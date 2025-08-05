# Firebase-Konfiguration für Sheen Website

Diese Datei enthält wichtige Informationen zur Einrichtung der Firebase-Sicherheitsregeln für die Sheen-Website.

## Fehler "Missing or insufficient permissions"

Wenn Sie den Fehler "Missing or insufficient permissions" beim Bestätigen einer Buchung sehen, liegt das vermutlich an fehlenden Berechtigungen in den Firebase-Sicherheitsregeln. Die Buchung wird zwar erfolgreich in der `bookings`-Sammlung gespeichert, aber der Versuch, die Akzeptanz der Behandlungsbedingungen in der `termsAcceptances`-Sammlung zu speichern, schlägt fehl.

## Firebase-Sicherheitsregeln anpassen

Bitte aktualisieren Sie Ihre Firebase-Sicherheitsregeln wie folgt:

1. Gehen Sie zur [Firebase Console](https://console.firebase.google.com/)
2. Wählen Sie Ihr Projekt "sheen-termin" aus
3. Navigieren Sie zu "Firestore Database" im linken Menü
4. Klicken Sie auf den Tab "Regeln"
5. Ersetzen Sie die aktuellen Regeln durch die folgenden Regeln:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regeln für die Bookings-Sammlung
    match /bookings/{booking} {
      allow read, write: if true; // Für Entwicklung und öffentliche Buchungen
    }

    // Regeln für die termsAcceptances-Sammlung
    match /termsAcceptances/{doc} {
      allow read, write: if true; // Für Entwicklung und öffentliche Buchungen
    }

    // Regeln für alle anderen Sammlungen
    match /{document=**} {
      allow read, write: if request.auth != null; // Nur für authentifizierte Benutzer
    }
  }
}
```

6. Klicken Sie auf "Veröffentlichen", um die Regeln zu speichern

## Hinweis zur Produktion

Die oben gezeigten Regeln erlauben allen Benutzern, Buchungen zu erstellen und Behandlungsbedingungen zu akzeptieren. Dies ist für eine öffentliche Buchungsseite angemessen.

Für sensiblere Daten oder administrative Funktionen sollten Sie strengere Regeln verwenden, die eine Authentifizierung erfordern, wie z.B.:

```
match /admin/{document=**} {
  allow read, write: if request.auth != null && request.auth.token.admin == true;
}
```

## Zusätzliche Verbesserungen

Der Code wurde bereits aktualisiert, um die Buchung auch dann zu speichern, wenn das Speichern der Behandlungsbedingungen-Akzeptanz oder das Senden der Bestätigungs-E-Mails fehlschlägt. Dies ermöglicht es Ihnen, Buchungen zu erhalten, auch wenn ein Teil des Prozesses fehlschlägt.

Für Fragen oder weitere Hilfe kontaktieren Sie bitte Ihren Entwickler.
