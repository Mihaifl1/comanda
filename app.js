const { createClient } = supabase;

const supabaseClient = createClient(
  "https://kbbdsywnixtfmxrtwcus.supabase.co",
  "sb_publishable_yWSzqXZfgSSMPgTAntPdug_sCDHXl7B"
);

//////////////////////////////////////////////////
// LOGIN CHECK
//////////////////////////////////////////////////
async function checkUser() {
  const { data } = await supabaseClient.auth.getUser();
  if (!data.user) window.location.href = "index.html";
}

//////////////////////////////////////////////////
// LOGIN
//////////////////////////////////////////////////
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) alert("Login failed");
  else window.location.href = "dashboard.html";
}

//////////////////////////////////////////////////
// LOGOUT
//////////////////////////////////////////////////
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

//////////////////////////////////////////////////
// SALVARE COMANDA CU FIȘIER
//////////////////////////////////////////////////
async function saveOrder() {

  const client = document.getElementById("client").value;
  const produs = document.getElementById("produs").value;
  const cantitate = document.getElementById("cantitate").value;
  const fileInput = document.getElementById("file");

  let fileUrl = null;

  // 🔹 Dacă există fișier
  if (fileInput.files.length > 0) {

    const file = fileInput.files[0];
    const fileName = Date.now() + "_" + file.name;

    // Upload în bucket "comenzi"
    const { error: uploadError } = await supabaseClient
      .storage
      .from("comenzi")
      .upload(fileName, file);

    if (uploadError) {
      alert("Eroare upload fișier");
      console.error(uploadError);
      return;
    }

    // Obține URL public
    const { data } = supabaseClient
      .storage
      .from("comenzi")
      .getPublicUrl(fileName);

    fileUrl = data.publicUrl;
  }

  // 🔹 Inserare în tabel
  const { error } = await supabaseClient
    .from("comenzi")
    .insert([{
      client,
      produs,
      cantitate,
      file_url: fileUrl
    }]);

  if (error) {
    alert("Eroare salvare comandă");
    console.error(error);
  } else {
    alert("Comandă salvată!");
    window.location.href = "list.html";
  }
}

//////////////////////////////////////////////////
// LOAD LISTA (simplificat — list.html are deja render)
//////////////////////////////////////////////////
async function loadOrders() {

  const { data, error } = await supabaseClient
    .from("comenzi")
    .select("*")
    .order("data_comanda", { ascending: false });

  if (error) {
    console.log(error);
    return;
  }

  let html = "<table border='1' width='100%'><tr><th>Data</th><th>Client</th><th>Produs</th><th>Cantitate</th><th>Status</th><th>Fișier</th></tr>";

  data.forEach(c => {
    html += `<tr>
      <td>${c.data_comanda ? new Date(c.data_comanda).toLocaleString("ro-RO") : "-"}</td>
      <td>${c.client}</td>
      <td>${c.produs}</td>
      <td>${c.cantitate}</td>
      <td>${c.status || "Noua"}</td>
      <td>
        ${c.file_url 
          ? `<a href="${c.file_url}" target="_blank">Descarcă</a>` 
          : "-"}
      </td>
    </tr>`;
  });

  html += "</table>";

  const lista = document.getElementById("lista");
  if (lista) lista.innerHTML = html;
}
