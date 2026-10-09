//////////////////////////////////////////////////
// AUTH (login simplu catre API-ul propriu)
//////////////////////////////////////////////////
function checkUser() {
  requireAuth();
}

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(API_BASE + "/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: email, pass: password })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      alert("Login failed");
      return;
    }
    setToken(data.token);
    window.location.href = "dashboard.html";
  } catch (e) {
    alert("Eroare conexiune: " + e.message);
  }
}

function logout() {
  clearToken();
  window.location.href = "index.html";
}

//////////////////////////////////////////////////
// SALVARE COMANDA (+ upload fisier)
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

  const fd = new FormData();
  fd.append("client", client);
  fd.append("produs", produs);
  fd.append("cantitate", cantitate);
  if (file) fd.append("file", file);

  try {
    const res = await fetch(API_BASE + "/save.php", {
      method: "POST",
      headers: { "X-Token": authToken() },
      body: fd
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "eroare");

    alert(`✅ Comanda a fost salvată!\n\nClient: ${client}\nProdus: ${produs}`);

    document.getElementById("client").value = "";
    document.getElementById("produs").value = "";
    document.getElementById("cantitate").value = "";
    fileInput.value = "";

    setTimeout(() => (window.location.href = "list.html"), 1000);
  } catch (err) {
    alert("❌ Eroare:\n" + err.message);
  }
}

//////////////////////////////////////////////////
// INREGISTRARE CONT NOU
//////////////////////////////////////////////////
async function registerUser() {
  const user = document.getElementById("reg_user").value.trim();
  const pass = document.getElementById("reg_pass").value;
  const pass2 = document.getElementById("reg_pass2").value;
  const msg = document.getElementById("reg_msg");

  if (pass !== pass2) {
    msg.style.color = "#c0392b";
    msg.innerText = "Parolele nu coincid.";
    return;
  }

  try {
    const res = await fetch(API_BASE + "/register.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, pass })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "eroare");

    msg.style.color = "#16a34a";
    msg.innerText = "✅ Cont creat! Te poți autentifica.";
    setTimeout(() => (window.location.href = "index.html"), 1200);
  } catch (e) {
    msg.style.color = "#c0392b";
    msg.innerText = "❌ " + e.message;
  }
}
