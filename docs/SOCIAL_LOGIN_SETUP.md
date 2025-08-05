# Einrichtung des Social Logins (Google & Apple)

Diese Anleitung hilft Ihnen bei der Einrichtung der Social-Login-Funktionen für Ihre Anwendung.

## Voraussetzungen

- Ein Firebase-Projekt
- Zugriff auf die Firebase-Konsole
- (Für Apple Sign-In) Ein Apple Developer-Konto

## Firebase-Authentifizierungsanbieter aktivieren

### Google-Anmeldung aktivieren

1. Gehen Sie zur [Firebase Console](https://console.firebase.google.com/) und wählen Sie Ihr Projekt.
2. Klicken Sie im linken Menü auf **Authentication**.
3. Wählen Sie den Tab **Sign-in method**.
4. Klicken Sie auf **Google** in der Liste der Anbieter.
5. Aktivieren Sie die Option **Google aktivieren**.
6. Fügen Sie eine **Support-E-Mail** für das Projekt hinzu (in der Regel Ihre E-Mail).
7. Klicken Sie auf **Speichern**.

### Apple-Anmeldung aktivieren

1. Gehen Sie zur [Firebase Console](https://console.firebase.google.com/) und wählen Sie Ihr Projekt.
2. Klicken Sie im linken Menü auf **Authentication**.
3. Wählen Sie den Tab **Sign-in method**.
4. Klicken Sie auf **Apple** in der Liste der Anbieter.
5. Aktivieren Sie die Option **Apple aktivieren**.
6. Folgen Sie den Anweisungen, um Ihre **Apple Developer-Konfiguration** einzurichten:
   - Sie benötigen ein Apple Developer-Konto.
   - Erstellen Sie eine App-ID, einen Dienstbezeichner und einen privaten Schlüssel.
   - Konfigurieren Sie den OAuth-Umleitungs-URI (dieser wird in der Firebase-Konsole angezeigt).
7. Fügen Sie die folgenden Informationen hinzu:
   - **Dienstbezeichner**
   - **Apple Team-ID**
   - **Schlüssel-ID**
   - **Privater Schlüssel**
8. Klicken Sie auf **Speichern**.

## Domain-Autorisierung für OAuth-Weiterleitungen

1. Gehen Sie zur [Firebase Console](https://console.firebase.google.com/) und wählen Sie Ihr Projekt.
2. Klicken Sie im linken Menü auf **Authentication**.
3. Wählen Sie den Tab **Settings**.
4. Scrollen Sie zum Abschnitt **Autorisierte Domains**.
5. Stellen Sie sicher, dass Ihre Anwendungsdomains hier aufgeführt sind. Für die lokale Entwicklung sollte `localhost` bereits autorisiert sein.
6. Fügen Sie bei Bedarf Ihre Produktionsdomains hinzu.

## Überprüfung der Einrichtung

Nach der Einrichtung sollten Sie die Social-Login-Funktionen testen können. Wenn Sie weiterhin den Fehler `auth/operation-not-allowed` erhalten, überprüfen Sie folgende Punkte:

1. Stellen Sie sicher, dass die Anbieter in der Firebase-Konsole wirklich aktiviert sind.
2. Überprüfen Sie, ob die korrekten Domains in den autorisierten Domains aufgeführt sind.
3. Prüfen Sie die Firebase-Konsolenlogs auf mögliche Fehler.
4. Für Apple Sign-In: Stellen Sie sicher, dass alle Apple Developer-Einstellungen korrekt sind.

## Fehlerbehebung

### Fehler: auth/operation-not-allowed

Dieser Fehler tritt auf, wenn der Authentifizierungsanbieter (Google oder Apple) in der Firebase-Konsole nicht aktiviert ist. Bitte folgen Sie den oben genannten Schritten, um die Anbieter zu aktivieren.

### Popup blockiert

Manchmal werden Popups vom Browser blockiert. Stellen Sie sicher, dass Popups für Ihre Website erlaubt sind.

### CORS-Fehler

Wenn Sie CORS-Fehler (Cross-Origin Resource Sharing) sehen, überprüfen Sie, ob Ihre Domain in den autorisierten Domains in den Firebase-Authentifizierungseinstellungen aufgeführt ist.

## Häufig gestellte Fragen

**F: Muss ich meine Firebase-Konfiguration aktualisieren, nachdem ich Social Login aktiviert habe?**  
A: Nein, die Firebase-Konfiguration muss nicht geändert werden. Es ist nur erforderlich, die Anbieter in der Firebase-Konsole zu aktivieren.

**F: Kann ich mehrere Social-Login-Anbieter verwenden?**  
A: Ja, Sie können so viele Anbieter aktivieren, wie Sie möchten.

**F: Wie verbinde ich Konten, die mit verschiedenen Methoden erstellt wurden?**  
A: Firebase unterstützt die Kontoverbindung, aber dies erfordert zusätzliche Implementierung in Ihrer Anwendung.

## Weitere Ressourcen

- [Firebase-Authentifizierungsdokumentation](https://firebase.google.com/docs/auth)
- [Google-Anmeldung mit Firebase](https://firebase.google.com/docs/auth/web/google-signin)
- [Apple-Anmeldung mit Firebase](https://firebase.google.com/docs/auth/web/apple)
