/**
 * Admin-Hinzufügung Script für SheenBerlin
 *
 * Dieses Script fügt einen neuen Administrator zur Firestore-Datenbank hinzu.
 *
 * Verwendung:
 * 1. Stellen Sie sicher, dass Node.js installiert ist
 * 2. Installieren Sie die Firebase Admin SDK: npm install firebase-admin
 * 3. Laden Sie Ihren Firebase Service Account Key herunter und speichern Sie ihn als 'serviceAccountKey.json'
 * 4. Führen Sie das Script aus: node add-admin.js
 */

const admin = require("firebase-admin");

// Firebase Admin SDK initialisieren
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * Fügt einen neuen Admin zur Datenbank hinzu
 * @param {string} email - E-Mail-Adresse des neuen Admins
 */
async function addAdmin(email) {
  try {
    // Prüfen, ob bereits ein Admin mit dieser E-Mail existiert
    const adminsRef = db.collection("admins");
    const existingAdmin = await adminsRef.where("email", "==", email).get();

    if (!existingAdmin.empty) {
      console.log(`❌ Admin mit E-Mail "${email}" existiert bereits.`);
      return false;
    }

    // Neuen Admin hinzufügen
    const newAdmin = {
      email: email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      addedBy: "script",
    };

    const docRef = await adminsRef.add(newAdmin);
    console.log(
      `✅ Admin "${email}" erfolgreich hinzugefügt mit ID: ${docRef.id}`
    );
    return true;
  } catch (error) {
    console.error("❌ Fehler beim Hinzufügen des Admins:", error);
    return false;
  }
}

/**
 * Listet alle aktuellen Admins auf
 */
async function listAdmins() {
  try {
    const adminsRef = db.collection("admins");
    const snapshot = await adminsRef.get();

    console.log("\n📋 Aktuelle Administratoren:");
    console.log("================================");

    if (snapshot.empty) {
      console.log("Keine Administratoren gefunden.");
      return;
    }

    snapshot.forEach((doc, index) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() || "Unbekannt";
      console.log(`${index + 1}. ${data.email} (Hinzugefügt: ${createdAt})`);
    });
  } catch (error) {
    console.error("❌ Fehler beim Abrufen der Admin-Liste:", error);
  }
}

// Hauptfunktion
async function main() {
  console.log("🔧 SheenBerlin Admin-Verwaltung");
  console.log("==============================\n");

  // Aktuelle Admins auflisten
  await listAdmins();

  // HIER DIE E-MAIL-ADRESSE DES NEUEN ADMINS EINTRAGEN:
  const newAdminEmail = "neueradmin@example.com"; // 👈 Ändern Sie diese E-Mail-Adresse

  console.log(`\n➕ Füge neuen Admin hinzu: ${newAdminEmail}`);

  const success = await addAdmin(newAdminEmail);

  if (success) {
    console.log("\n📋 Aktualisierte Admin-Liste:");
    await listAdmins();
  }

  // Firebase-Verbindung schließen
  await admin.app().delete();
  console.log("\n✅ Fertig!");
}

// Script ausführen, wenn es direkt aufgerufen wird
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { addAdmin, listAdmins };
