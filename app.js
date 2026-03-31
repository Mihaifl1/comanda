const { createClient } = supabase;

const supabaseClient = createClient(
  "https://kbbdsywnixtfmxrtwcus.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYmRzeXduaXh0Zm14cnR3Y3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NDQ5MTksImV4cCI6MjA4ODEyMDkxOX0.Uz4xGhxiZkcwVIrNnFwoWpiwnLW2L8HCXGd4toNv3Hc"
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
// SALVARE COMANDĂ + EMAIL
//////////////////////////////////////////////////
async function saveOrder() {
  const client = document.getElementById("client").value.trim();
  const produs = document.getElementById("produs").value.trim();
  const cantitate = parseInt(document.getElementById("cantitate").value) || 0;
  const fileInput = document.getElementById("file");
  const file = fileInput.files[0];

  if (!client || !produs || cantitate <= 0) {
    alert("Te rog completează Client, Produs și Cantitate!");
    return;
  }

  let fileUrl = null;

  //////////////////////////////////////////////////
  // UPLOAD FIȘIER
  //////////////////////////////////////////////////
  if (file) {
    try {
      const fileName = `comenzi/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabaseClient.storage
        .from("comenzi")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseClient.storage
        .from("comenzi")
        .getPublicUrl(fileName);

      fileUrl = urlData.publicUrl;

    } catch (e) {
      console.error("Upload error:", e);
    }
  }

  //////////////////////////////////////////////////
  // SALVARE ÎN DB
  //////////////////////////////////////////////////
  try {
    const { error } = await supabaseClient
      .from("comenzi")
      .insert([{
        client,
        produs,
        cantitate,
        file_url: fileUrl,
        status: "Noua"
      }]);

    if (error) throw error;

    //////////////////////////////////////////////////
    // 🔥 TRIMITE EMAIL (EDGE FUNCTION)
    //////////////////////////////////////////////////
    try {
      await fetch(
        "https://kbbdsywnixtfmxrtwcus.supabase.co/functions/v1/send-new-order-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            client,
            produs,
            cantitate,
            file_url: fileUrl
          })
        }
      );
    } catch (emailErr) {
      console.error("Email error:", emailErr);
    }

    //////////////////////////////////////////////////
    // SUCCESS UI
    //////////////////////////////////////////////////
    alert(`✅ Comanda a fost salvată cu succes!

Client: ${client}
Produs: ${produs}

📧 Email trimis automat`);

    // reset
    document.getElementById("client").value = "";
    document.getElementById("produs").value = "";
    document.getElementById("cantitate").value = "";
    fileInput.value = "";

    setTimeout(() => window.location.href = "list.html", 1200);

  } catch (err) {
    console.error(err);
    alert("❌ Eroare:\n" + err.message);
  }
}

//////////////////////////////////////////////////
// LOAD LISTA
//////////////////////////////////////////////////
async function loadOrders() {
  const { data, error } = await supabaseClient
    .from("comenzi")
    .select("*")
    .order("data_comanda", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  let html = `
  <table border='1' width='100%' style="border-collapse:collapse">
    <tr style="background:#eee">
      <th>Data</th>
      <th>Client</th>
      <th>Produs</th>
      <th>Cantitate</th>
      <th>Status</th>
      <th>Fișier</th>
    </tr>
  `;

  data.forEach(c => {
    html += `
    <tr>
      <td>${c.data_comanda ? new Date(c.data_comanda).toLocaleString("ro-RO") : "-"}</td>
      <td>${c.client}</td>
      <td>${c.produs}</td>
      <td>${c.cantitate}</td>
      <td>${c.status || "Noua"}</td>
      <td>${c.file_url ? `<a href="${c.file_url}" target="_blank">Descarcă</a>` : "-"}</td>
    </tr>
    `;
  });

  html += "</table>";

  const lista = document.getElementById("lista");
  if (lista) lista.innerHTML = html;
}
