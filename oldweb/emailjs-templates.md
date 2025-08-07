# EmailJS-Vorlagen für Sheen Beauty Studio

## 1. Kunden-Bestätigung (EMAILJS_TEMPLATE_ID_CUSTOMER)

**Betreff:** Terminbestätigung - Sheen Beauty Studio

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Terminbestätigung</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
      }
      .header {
        background-color: #e8f3f4;
        padding: 20px;
        text-align: center;
      }
      .logo {
        max-width: 150px;
        height: auto;
      }
      .content {
        padding: 20px;
      }
      .booking-details {
        background-color: #f9f9f9;
        padding: 15px;
        border-radius: 5px;
        margin: 20px 0;
      }
      .footer {
        background-color: #e8f3f4;
        padding: 15px;
        text-align: center;
        font-size: 12px;
      }
      h2 {
        color: #4b4c4c;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <img
        src="https://sheenberlin.de/img/logo_sheen.png"
        alt="Sheen Beauty Studio"
        class="logo"
      />
      <h2>Ihre Terminbestätigung</h2>
    </div>

    <div class="content">
      <p>Hallo {{customer_name}},</p>

      <p>
        vielen Dank für Ihre Buchung bei Sheen Beauty Studio. Wir freuen uns,
        Sie bald begrüßen zu dürfen!
      </p>

      <div class="booking-details">
        <h3>Ihre Buchungsdetails:</h3>
        <p><strong>Buchungs-ID:</strong> {{booking_id}}</p>
        <p><strong>Service:</strong> {{service}}</p>
        <p><strong>Datum:</strong> {{date}}</p>
        <p><strong>Uhrzeit:</strong> {{time}} Uhr</p>
        <p><strong>Preis:</strong> {{price}}</p>
      </div>

      <h3>Wichtige Informationen:</h3>
      <ul>
        <li>Bitte erscheinen Sie 5-10 Minuten vor Ihrem Termin.</li>
        <li>Bei Verspätung kann sich die Behandlungszeit verkürzen.</li>
        <li>
          Falls Sie den Termin nicht wahrnehmen können, bitten wir Sie,
          mindestens 24 Stunden vorher abzusagen.
        </li>
      </ul>

      <p>Falls Sie Fragen haben, können Sie uns gerne kontaktieren:</p>
      <p>
        Telefon: {{salon_phone}}<br />
        E-Mail: {{salon_email}}
      </p>

      <p>Wir freuen uns auf Ihren Besuch!</p>
      <p>
        Mit freundlichen Grüßen,<br />
        Ihr Team vom Sheen Beauty Studio
      </p>
    </div>

    <div class="footer">
      <p>{{salon_name}} | {{salon_address}} | {{salon_phone}}</p>
      <p><a href="https://sheenberlin.de">www.sheenberlin.de</a></p>
    </div>
  </body>
</html>
```

## 2. Salon-Benachrichtigung (EMAILJS_TEMPLATE_ID_ADMIN)

**Betreff:** Neue Terminbuchung - {{service}} am {{date}}

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Neue Terminbuchung</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
      }
      .header {
        background-color: #e8f3f4;
        padding: 15px;
        text-align: center;
      }
      .content {
        padding: 20px;
      }
      .booking-details {
        background-color: #f9f9f9;
        padding: 15px;
        border-radius: 5px;
        margin: 20px 0;
      }
      .customer-info {
        background-color: #f0f0f0;
        padding: 15px;
        border-radius: 5px;
        margin: 20px 0;
      }
      h2 {
        color: #4b4c4c;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h2>Neue Terminbuchung eingegangen</h2>
    </div>

    <div class="content">
      <p>Eine neue Terminbuchung wurde über die Website vorgenommen.</p>

      <div class="booking-details">
        <h3>Termindetails:</h3>
        <p><strong>Buchungs-ID:</strong> {{booking_id}}</p>
        <p><strong>Service:</strong> {{service}}</p>
        <p><strong>Datum:</strong> {{date}}</p>
        <p><strong>Uhrzeit:</strong> {{time}} Uhr</p>
        <p><strong>Preis:</strong> {{price}}</p>
      </div>

      <div class="customer-info">
        <h3>Kundeninformationen:</h3>
        <p><strong>Name:</strong> {{customer_name}}</p>
        <p><strong>E-Mail:</strong> {{customer_email}}</p>
        <p><strong>Telefon:</strong> {{customer_phone}}</p>
        <p><strong>Nachricht:</strong> {{message}}</p>
      </div>

      <p>Dieser Termin wurde automatisch in der Datenbank gespeichert.</p>
    </div>
  </body>
</html>
```

## Anleitung zur Einrichtung in EmailJS

1. Melden Sie sich bei [EmailJS](https://www.emailjs.com/) an
2. Erstellen Sie einen E-Mail-Service unter "Email Services"
3. Gehen Sie zu "Email Templates" und erstellen Sie zwei neue Vorlagen:
   - Eine für Kunden (kopieren Sie die Kunden-Vorlage)
   - Eine für den Salon (kopieren Sie die Salon-Vorlage)
4. Notieren Sie sich die IDs:
   - Service ID (zu finden unter "Email Services")
   - Template IDs (zu finden unter "Email Templates")
   - Public Key (zu finden unter "Account" -> "API Keys")
5. Aktualisieren Sie diese IDs in der Datei `js/booking.js`
