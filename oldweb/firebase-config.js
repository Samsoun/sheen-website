// Firebase Konfiguration
// Ersetzen Sie diese Werte mit Ihren eigenen Firebase-Projektdaten
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Exportieren der Konfiguration
export default firebaseConfig;

/*
ANLEITUNG ZUR EINRICHTUNG VON FIREBASE:

1. Erstellen Sie ein Firebase-Projekt:
   - Gehen Sie zu https://console.firebase.google.com/
   - Klicken Sie auf "Projekt hinzufügen"
   - Geben Sie einen Projektnamen ein und folgen Sie den Anweisungen

2. Firestore-Datenbank einrichten:
   - Wählen Sie im linken Menü "Firestore Database"
   - Klicken Sie auf "Datenbank erstellen"
   - Wählen Sie den Standort und den Startmodus (empfohlen: Testmodus für die Entwicklung)

3. Firebase-Konfiguration abrufen:
   - Klicken Sie im linken Menü auf "Projektübersicht"
   - Klicken Sie auf das Web-Symbol (</>) um eine Web-App zu registrieren
   - Geben Sie einen Namen für Ihre App ein und klicken Sie auf "Registrieren"
   - Kopieren Sie die Konfigurationsdaten und ersetzen Sie die Platzhalter in dieser Datei

4. Sicherheitsregeln für Firestore einrichten:
   - Gehen Sie zu "Firestore Database" > "Regeln"
   - Passen Sie die Regeln nach Bedarf an, z.B.:

   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /bookings/{booking} {
         allow read, write: if true; // Für Entwicklung
         // Für Produktion: allow read, write: if request.auth != null;
       }
     }
   }

5. Firebase-Authentifizierung einrichten (optional):
   - Wählen Sie im linken Menü "Authentication"
   - Klicken Sie auf "Erste Schritte"
   - Aktivieren Sie die gewünschten Anmeldemethoden (z.B. E-Mail/Passwort)

6. Deployment (optional):
   - Installieren Sie Firebase CLI: npm install -g firebase-tools
   - Führen Sie 'firebase login' aus
   - Initialisieren Sie Ihr Projekt: firebase init
   - Deployen Sie Ihre Website: firebase deploy
*/
