const { createClient } = supabase;

const supabaseClient = createClient(
  "https://kbbdsywnixtfmxrtwcus.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmRzeXduaXh0Zm14cnR3Y3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NDQ5MTksImV4cCI6MjA4ODEyMDkxOX0.Uz4xGhxiZkcwVIrNnFwoWpiwnLW2L8HCXGd4toNv3Hc"
);

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
    // 🔥 EMAIL CORECT (FORMAT WEBHOOK)
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
            type: "INSERT",
            table: "comenzi",
            schema: "public",
            record: {
              client,
              produs,
              cantitate,
              file_url: fileUrl
            }
          })
        }
      );
    } catch (emailErr) {
      console.error("Email error:", emailErr);
    }

    //////////////////////////////////////////////////
    // SUCCESS
    //////////////////////////////////////////////////
    alert(`✅ Comanda a fost salvată cu succes!

Client: ${client}
Produs: ${produs}

📧 Email trimis automat`);

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
