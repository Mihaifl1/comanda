const { createClient } = supabase;

const supabaseClient = createClient(
  "https://kbbdsywnixtfmxrtwcus.supabase.co",
  "ANON_PUBLIC_KEY_AICI"
);

// LOGIN CHECK
async function checkUser() {
  const { data } = await supabaseClient.auth.getUser();
  if (!data.user) window.location.href = "index.html";
}

// LOGIN
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) alert("Login failed");
  else window.location.href = "dashboard.html";
}

// LOGOUT
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

// SALVARE COMANDA
async function saveOrder() {

  const client = document.getElementById("client").value;
  const produs = document.getElementById("produs").value;
  const cantitate = document.getElementById("cantitate").value;

  const { error } = await supabaseClient
    .from("comenzi")
    .insert([{ client, produs, cantitate }]);

  if (error) alert("Eroare salvare");
  else {
    alert("Comandă salvată!");
    window.location.href = "list.html";
  }
}

// LOAD LISTA
async function loadOrders() {

  const { data } = await supabaseClient
    .from("comenzi")
    .select("*")
    .order("id", { ascending: false });

  let html = "<table border='1' width='100%'><tr><th>Client</th><th>Produs</th><th>Cantitate</th><th>Status</th></tr>";

  data.forEach(c => {
    html += `<tr>
      <td>${c.client}</td>
      <td>${c.produs}</td>
      <td>${c.cantitate}</td>
      <td>${c.status}</td>
    </tr>`;
  });

  html += "</table>";

  document.getElementById("lista").innerHTML = html;
}
