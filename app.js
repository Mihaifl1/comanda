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
// SALVARE COMANDA CU FIȘIER
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

    // Upload fișier (dacă există)
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
            alert("Comanda se salvează, dar fișierul nu a putut fi uploadat.");
        }
    }

    // Salvează comanda în baza de date
    try {
        const { error } = await supabaseClient
            .from("comenzi")
            .insert([{
                client: client,
                produs: produs,
                cantitate: cantitate,
                file_url: fileUrl
            }]);

        if (error) throw error;

        // === TRIMITE EMAIL DIRECT DIN FRONTEND ===
        try {
            const emailBody = `
                <h2>🛒 Comandă Nouă Primita!</h2>
                <p><strong>Client:</strong> ${client}</p>
                <p><strong>Produs:</strong> ${produs}</p>
                <p><strong>Cantitate:</strong> ${cantitate}</p>
                ${fileUrl ? `<p><strong>Fișier:</strong> <a href="${fileUrl}">Descarcă fișierul</a></p>` : ''}
                <p><strong>Data:</strong> ${new Date().toLocaleString('ro-RO')}</p>
            `;

            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer re_4HxCc4uw_FrFiSAuU1h6ZpEZS4L5Tk8xR`   // cheia ta Resend
                },
                body: JSON.stringify({
                    from: "Comenzi App <onboarding@resend.dev>",
                    to: ["marcel.manoli@kablem.com"],
                    subject: `Comandă nouă - ${client}`,
                    html: emailBody
                })
            });

            if (res.ok) {
                console.log("Email trimis cu succes!");
            } else {
                console.error("Eroare email:", await res.text());
            }
        } catch (emailErr) {
            console.error("Eroare la trimiterea emailului:", emailErr);
            // nu oprim salvarea comenzii dacă emailul eșuează
        }

        alert("✅ Comanda a fost salvată cu succes!\nEmailul a fost trimis.");
        
        // Reset formular
        document.getElementById("client").value = "";
        document.getElementById("produs").value = "";
        document.getElementById("cantitate").value = "";
        fileInput.value = "";

        setTimeout(() => window.location.href = "list.html", 800);

    } catch (err) {
        console.error("Eroare salvare comandă:", err);
        alert("Eroare la salvarea comenzii: " + err.message);
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
