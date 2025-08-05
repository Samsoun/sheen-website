// src/utils/emailService.ts

// EmailJS Konfiguration - verwende Environment-Variablen mit Fallback
const EMAILJS_SERVICE_ID =
  process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "service_drz8xtb";
const EMAILJS_TEMPLATE_ID_CUSTOMER =
  process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_CUSTOMER || "template_hxneksd";
const EMAILJS_TEMPLATE_ID_ADMIN =
  process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_ADMIN || "template_gwjs37v";
const EMAILJS_TEMPLATE_ID_CONTACT =
  process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_CONTACT || "template_contact";
const EMAILJS_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "jjBT0mSIJ15QACfrL";

// Debug-Informationen für EmailJS-Konfiguration
console.log("📧 EmailJS Konfiguration aktualisiert:", {
  serviceId: EMAILJS_SERVICE_ID,
  publicKey: EMAILJS_PUBLIC_KEY?.substring(0, 8) + "...",
  templates: {
    customer: EMAILJS_TEMPLATE_ID_CUSTOMER + " (Terminbestätigung Kunde)",
    admin: EMAILJS_TEMPLATE_ID_ADMIN + " (Terminbuchung Admin)",
    contact: EMAILJS_TEMPLATE_ID_CONTACT,
  },
  status: "✅ Konfiguration bereit für Tests",
});

/**
 * Test-Funktion für EmailJS-Konfiguration
 */
export async function testEmailJSConfiguration(): Promise<boolean> {
  try {
    console.log("🧪 Teste EmailJS-Konfiguration...");

    if (typeof window === "undefined") {
      console.warn("🧪 Test nur im Browser möglich");
      return false;
    }

    const emailjs = await import("@emailjs/browser");
    emailjs.init(EMAILJS_PUBLIC_KEY);

    // Test-Daten für Admin-Template
    const testData = {
      customer_name: "Test Kunde",
      customer_email: "test@example.com",
      customer_phone: "+49 123 456789",
      booking_id: "TEST-" + Date.now(),
      service: "Augenbrauen zupfen",
      date: new Date().toLocaleDateString("de-DE"),
      time: "14:00",
      price: "25€",
      message: "Test-Buchung zur Überprüfung der E-Mail-Funktionalität",
      salon_name: "Sheen Beauty Studio",
      salon_address: "Kurfürstendamm 180, 10707 Berlin",
      salon_phone: "+49 176-32812602",
      salon_email: "kontakt@sheenberlin.de",
      from_name: "Buchungssystem Test",
      to_name: "Sheen Team",
      reply_to: "test@example.com",
    };

    console.log("🧪 Teste Admin-Template:", EMAILJS_TEMPLATE_ID_ADMIN);

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID_ADMIN,
      testData,
      EMAILJS_PUBLIC_KEY
    );

    console.log("✅ EmailJS-Test erfolgreich:", result);
    return result.status === 200;
  } catch (error) {
    console.error("❌ EmailJS-Test fehlgeschlagen:", error);
    return false;
  }
}

/**
 * Interface für eine Buchung
 */
interface BookingData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  service: string;
  serviceName: string;
  treatments?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  }[];
  price: number;
  duration: number;
  message?: string;
  createdAt?: Date;
}

/**
 * Interface für Kontaktformular-Daten
 */
interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

/**
 * Formatiert die Behandlungsliste für die E-Mail
 */
function formatTreatmentsList(bookingData: BookingData): string {
  if (bookingData.treatments && bookingData.treatments.length > 0) {
    return bookingData.treatments
      .map((treatment) => `${treatment.name} (${treatment.price}€)`)
      .join(", ");
  }

  return bookingData.serviceName;
}

/**
 * Sendet eine Bestätigungs-E-Mail an den Kunden
 */
export async function sendCustomerConfirmation(
  bookingData: BookingData
): Promise<boolean> {
  try {
    // EmailJS dynamisch laden, um SSR-Probleme zu vermeiden
    const emailjs = await import("@emailjs/browser");

    // EmailJS sofort initialisieren
    emailjs.init(EMAILJS_PUBLIC_KEY);

    // Formatieren des Datums für die E-Mail (DD.MM.YYYY)
    const dateObj = new Date(bookingData.date);
    const formattedDate = `${dateObj.getDate().toString().padStart(2, "0")}.${(
      dateObj.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}.${dateObj.getFullYear()}`;

    // E-Mail-Template-Daten vorbereiten
    const emailData = {
      booking_id: bookingData.id || "Noch nicht zugewiesen",
      service: formatTreatmentsList(bookingData),
      date: formattedDate,
      time: bookingData.time,
      price: `${bookingData.price}€`,
      customer_name: bookingData.name,
      customer_email: bookingData.email,
      customer_phone: bookingData.phone,
      message: bookingData.message || "Keine Nachricht",
      salon_name: "Sheen Beauty Studio",
      salon_address: "Kurfürstendamm 180, 10707 Berlin",
      salon_phone: "+49 176-32812602",
      salon_email: "kontakt@sheenberlin.de",
      from_name: "Sheen Beauty Studio",
      to_name: bookingData.name,
      reply_to: "kontakt@sheenberlin.de",
    };

    console.log("📧 Sende E-Mail an Kunden:", emailData);

    // E-Mail an Kunden senden
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID_CUSTOMER,
      emailData
    );

    console.log(
      "✅ E-Mail an Kunden erfolgreich gesendet!",
      response.status,
      response.text
    );
    return true;
  } catch (error) {
    console.error("❌ Fehler beim Senden der Kunden-E-Mail:", error);
    return false;
  }
}

/**
 * Sendet eine Benachrichtigungs-E-Mail an den Salon-Admin
 */
export async function sendAdminNotification(
  bookingData: BookingData
): Promise<boolean> {
  try {
    // EmailJS dynamisch laden, um SSR-Probleme zu vermeiden
    const emailjs = await import("@emailjs/browser");

    // EmailJS sofort initialisieren
    emailjs.init(EMAILJS_PUBLIC_KEY);

    // Formatieren des Datums für die E-Mail (DD.MM.YYYY)
    const dateObj = new Date(bookingData.date);
    const formattedDate = `${dateObj.getDate().toString().padStart(2, "0")}.${(
      dateObj.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}.${dateObj.getFullYear()}`;

    // E-Mail-Template-Daten vorbereiten
    const emailData = {
      booking_id: bookingData.id || "Noch nicht zugewiesen",
      service: formatTreatmentsList(bookingData),
      date: formattedDate,
      time: bookingData.time,
      price: `${bookingData.price}€`,
      customer_name: bookingData.name,
      customer_email: bookingData.email,
      customer_phone: bookingData.phone,
      message: bookingData.message || "Keine Nachricht",
      salon_name: "Sheen Beauty Studio",
      salon_address: "Kurfürstendamm 180, 10707 Berlin",
      salon_phone: "+49 176-32812602",
      salon_email: "kontakt@sheenberlin.de",
      from_name: "Buchungssystem",
      to_name: "Sheen Team",
      reply_to: bookingData.email,
    };

    console.log("📧 Sende E-Mail an Admin:", emailData);

    // E-Mail an Admin senden
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID_ADMIN,
      emailData
    );

    console.log(
      "✅ E-Mail an Admin erfolgreich gesendet!",
      response.status,
      response.text
    );
    return true;
  } catch (error) {
    console.error("❌ Fehler beim Senden der Admin-E-Mail:", error);
    return false;
  }
}

/**
 * Sendet sowohl Kunden- als auch Admin-E-Mails für eine Buchung
 */
export async function sendBookingConfirmationEmails(
  bookingData: BookingData
): Promise<boolean> {
  try {
    console.log("🔄 Starte E-Mail-Versand...");

    const customerEmailSent = await sendCustomerConfirmation(bookingData);
    console.log(
      "📫 E-Mail an Kunden:",
      customerEmailSent ? "gesendet ✅" : "fehlgeschlagen ❌"
    );

    const adminEmailSent = await sendAdminNotification(bookingData);
    console.log(
      "📫 E-Mail an Admin:",
      adminEmailSent ? "gesendet ✅" : "fehlgeschlagen ❌"
    );

    return customerEmailSent || adminEmailSent; // Erfolgreich, wenn mindestens eine E-Mail gesendet wurde
  } catch (error) {
    console.error("❌ Unerwarteter Fehler beim E-Mail-Versand:", error);
    return false;
  }
}

/**
 * Sendet eine E-Mail vom Kontaktformular direkt an nesa.afshari@web.de
 */
export async function sendContactFormEmail(
  contactData: ContactFormData
): Promise<boolean> {
  try {
    console.log(
      "📧 Sende Kontaktformular-E-Mail direkt an nesa.afshari@web.de..."
    );

    // mailto: Link erstellen für direkte E-Mail
    const subject = encodeURIComponent(
      `Kontaktanfrage von ${contactData.name} - Sheen Beauty Website`
    );
    const body = encodeURIComponent(`
Neue Kontaktanfrage von der Sheen Beauty Website:

👤 Name: ${contactData.name}
📧 E-Mail: ${contactData.email}
📅 Datum: ${new Date().toLocaleDateString("de-DE")}
🕐 Zeit: ${new Date().toLocaleTimeString("de-DE")}

📝 Nachricht:
${contactData.message}

---
Diese E-Mail wurde automatisch von der Sheen Beauty Website generiert.
Antworten Sie direkt an: ${contactData.email}
    `);

    const mailtoLink = `mailto:nesa.afshari@web.de?subject=${subject}&body=${body}&reply-to=${contactData.email}`;

    // Für Browser-Umgebung: Öffne mailto-Link
    if (typeof window !== "undefined") {
      console.log("📧 Öffne E-Mail-Client mit mailto-Link...");

      try {
        // Erstelle einen unsichtbaren Link und klicke darauf
        const link = document.createElement("a");
        link.href = mailtoLink;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log("📧 E-Mail-Client geöffnet!");

        // Zusätzlich: E-Mail-Inhalt in die Zwischenablage kopieren als Backup
        const emailContent = `An: nesa.afshari@web.de
Betreff: Kontaktanfrage von ${contactData.name} - Sheen Beauty Website

Neue Kontaktanfrage von der Sheen Beauty Website:

👤 Name: ${contactData.name}
📧 E-Mail: ${contactData.email}
📅 Datum: ${new Date().toLocaleDateString("de-DE")}
🕐 Zeit: ${new Date().toLocaleTimeString("de-DE")}

📝 Nachricht:
${contactData.message}

---
Diese E-Mail wurde automatisch von der Sheen Beauty Website generiert.
Antworten Sie direkt an: ${contactData.email}`;

        // Versuche in Zwischenablage zu kopieren
        if (navigator.clipboard) {
          navigator.clipboard
            .writeText(emailContent)
            .then(() => {
              console.log(
                "📋 E-Mail-Inhalt in Zwischenablage kopiert (Backup)"
              );
            })
            .catch(() => {
              console.log("📋 Zwischenablage-Kopie fehlgeschlagen");
            });
        }

        return true;
      } catch (linkError) {
        console.error("📧 Fehler beim Öffnen des mailto-Links:", linkError);

        // Fallback: Zeige E-Mail-Adresse in Alert
        alert(
          `Bitte senden Sie eine E-Mail an: nesa.afshari@web.de\n\nBetreff: Kontaktanfrage von ${contactData.name}\n\nIhre Nachricht: ${contactData.message}`
        );
        return true;
      }
    } else {
      console.warn("📧 Nicht im Browser - kann mailto-Link nicht öffnen");
      return false;
    }
  } catch (error) {
    console.error("📧 Fehler beim Öffnen des E-Mail-Clients:", error);

    // Alternative: Fallback zu EmailJS für kritische Fälle
    try {
      console.log("📧 Fallback: Versuche EmailJS als Backup...");

      if (typeof window === "undefined") {
        return false;
      }

      const emailjs = await import("@emailjs/browser");
      emailjs.init(EMAILJS_PUBLIC_KEY);

      const fallbackParams = {
        customer_name: contactData.name,
        customer_email: contactData.email,
        service_name: "🔔 Kontaktanfrage von Website",
        booking_date: new Date().toLocaleDateString("de-DE"),
        booking_time: new Date().toLocaleTimeString("de-DE"),
        message: `📨 Kontaktformular-Nachricht:\n\n"${contactData.message}"\n\n👤 Absender: ${contactData.name}\n📧 E-Mail: ${contactData.email}`,
        price: "0 €",
        phone: "Über Kontaktformular",
        timestamp: new Date().toLocaleString("de-DE"),
        to_name: "Nesa Afshari",
        reply_to: contactData.email,
      };

      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID_ADMIN,
        fallbackParams,
        EMAILJS_PUBLIC_KEY
      );

      console.log("📧 Fallback-E-Mail erfolgreich gesendet:", result);
      return result.status === 200;
    } catch (fallbackError) {
      console.error("📧 Auch Fallback fehlgeschlagen:", fallbackError);
      return false;
    }
  }
}
