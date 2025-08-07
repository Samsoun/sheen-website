# Sheen Beauty Studio - Buchungssystem

Dieses Projekt enthält ein Buchungssystem für das Sheen Beauty Studio, das mit Firebase als Backend integriert ist.

## Funktionen

- Responsive Design für alle Geräte
- Service-Auswahl mit Preisen und Dauer
- Datums- und Zeitauswahl basierend auf Verfügbarkeit
- Automatische Berücksichtigung der Öffnungszeiten
- Bestätigungsprozess für Buchungen
- Speicherung der Buchungen in Firebase
- Einfache Verwaltung der Termine

## Einrichtung

### 1. Firebase-Projekt erstellen

1. Gehen Sie zu [Firebase Console](https://console.firebase.google.com/)
2. Klicken Sie auf "Projekt hinzufügen"
3. Geben Sie einen Projektnamen ein und folgen Sie den Anweisungen
4. Aktivieren Sie Firestore Database im Testmodus

### 2. Firebase-Konfiguration aktualisieren

1. Gehen Sie in Ihrem Firebase-Projekt zur Projektübersicht
2. Klicken Sie auf das Web-Symbol (</>) um eine Web-App zu registrieren
3. Geben Sie einen Namen für Ihre App ein und klicken Sie auf "Registrieren"
4. Kopieren Sie die Konfigurationsdaten
5. Öffnen Sie die Datei `js/booking.js` und ersetzen Sie die Platzhalter in der `firebaseConfig` mit Ihren eigenen Werten

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

### 3. Firestore-Datenbank einrichten

1. Erstellen Sie eine Sammlung namens "bookings" in Ihrer Firestore-Datenbank
2. Stellen Sie sicher, dass die Sicherheitsregeln den Zugriff erlauben:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookings/{booking} {
      allow read, write: if true; // Für Entwicklung
      // Für Produktion: allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Lokale Entwicklung

1. Starten Sie einen lokalen Webserver, z.B. mit [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) für VS Code
2. Öffnen Sie die Website in Ihrem Browser
3. Testen Sie das Buchungsformular

### 5. Deployment (optional)

1. Installieren Sie Firebase CLI: `npm install -g firebase-tools`
2. Führen Sie `firebase login` aus
3. Initialisieren Sie Ihr Projekt: `firebase init`
4. Deployen Sie Ihre Website: `firebase deploy`

## Anpassung

### Services anpassen

Um die verfügbaren Services zu ändern, bearbeiten Sie das `services`-Objekt in der Datei `js/booking.js`:

```javascript
const services = {
  "service-id": {
    name: "Service Name",
    duration: 60, // Dauer in Minuten
    price: 99, // Preis in Euro
  },
  // Weitere Services hinzufügen
};
```

Aktualisieren Sie auch die entsprechenden Optionen im HTML-Formular in `booking.html`.

### Öffnungszeiten anpassen

Die Öffnungszeiten werden in der Funktion `loadAvailableTimes` in `js/booking.js` definiert. Passen Sie die Variablen `startTime` und `endTime` an, um die Öffnungszeiten zu ändern.

### Design anpassen

Das Design kann über die CSS-Dateien angepasst werden:

- `css/booking.css` für das Buchungsformular
- `css/style.css` für allgemeine Stile

## Verwaltung der Buchungen

Alle Buchungen werden in der Firestore-Datenbank gespeichert und können über die Firebase Console eingesehen und verwaltet werden.

Für eine erweiterte Verwaltung könnte ein Admin-Dashboard entwickelt werden, das auf die Firebase-Daten zugreift.

## Lizenz

Dieses Projekt ist urheberrechtlich geschützt und darf nur mit Genehmigung verwendet werden.

© 2024 Sheen Beauty Studio
