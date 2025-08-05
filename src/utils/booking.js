// Google Calendar API Konfiguration
const CONFIG = {
  clientId:
    "748808166373-lc9ghf9t5932vg32p6rulk6t3st9f2u8.apps.googleusercontent.com", // Neue Client-ID
  apiKey: "AIzaSyBWO-38VWMnPIJqb86OXAXTLJ_pTmSybcg", // Neuer API-Schlüssel
  calendarId: "nesa.afshari@web.de", // Kalender-ID (E-Mail-Adresse)
  allowedOrigins: [
    "http://localhost:5500", // Entwicklungsserver
    "http://127.0.0.1:5500", // Alternative Entwicklungs-URL
    "https://sheenberlin.de", // Deine Produktions-Domain
    "https://www.sheenberlin.de", // Alternative Produktions-Domain
  ],
  scopes: "https://www.googleapis.com/auth/calendar.events", // Berechtigungen für Kalenderereignisse
};

// Firebase-Konfiguration wird bereits in booking.html geladen
// Die folgende Konfiguration wird entfernt, um Konflikte zu vermeiden
// const firebaseConfig = {
//   apiKey: "AIzaSyDQP9S9d0CyPIeGq4GXE2UOvbpHsJK7Urk",
//   authDomain: "sheen-booking.firebaseapp.com",
//   projectId: "sheen-booking",
//   storageBucket: "sheen-booking.appspot.com",
//   messagingSenderId: "748808166373",
//   appId: "1:748808166373:web:e67e8a6b0c6afb3a06bd9c",
// };

// Firebase wird bereits in booking.html initialisiert
// firebase.initializeApp(firebaseConfig);
// const db = firebase.firestore();

// Service-Daten
const services = {
  browlifting: {
    name: "Browlifting",
    duration: 75,
    price: 79,
  },
  "brow-design": {
    name: "Brow Design",
    duration: 20,
    price: 22,
  },
  "lash-lifting": {
    name: "Lash Lifting",
    duration: 60,
    price: 69,
  },
  lipblush: {
    name: "LipBlush",
    duration: 180,
    price: 399,
  },
  microblading: {
    name: "Microblading",
    duration: 180,
    price: 349,
  },
  eyeliner: {
    name: "Eyeliner",
    duration: 180,
    price: 349,
  },
  microneedling: {
    name: "Microneedling",
    duration: 75,
    price: 149,
  },
};

// Servicespezifische Behandlungsbedingungen
const serviceTerms = {
  // Permanent Make-up Texte für: microblading, lipblush, eyeliner
  pmu: `
    <h4>Permanent Make-up – PMU (Augenbrauen, Lippen, Eyeliner)</h4>
    <p><strong>Nicht geeignet für:</strong></p>
    <ul>
      <li>Schwangere oder stillende Personen</li>
      <li>Personen mit aktiven Hautkrankheiten im Behandlungsbereich</li>
      <li>Personen mit Blutgerinnungsstörungen oder Einnahme blutverdünnender Medikamente</li>
    </ul>
    <p><strong>24 Stunden vor der Behandlung:</strong></p>
    <ul>
      <li>Kein Kaffee, Alkohol oder blutverdünnende Medikamente (z. B. Aspirin) einnehmen.</li>
    </ul>
    <p><strong>7 Tage vor der Behandlung:</strong></p>
    <ul>
      <li>Keine Botox- oder Filler-Behandlungen im Behandlungsbereich.</li>
    </ul>
    <p><strong>Bei Lippen-PMU:</strong></p>
    <ul>
      <li>Falls Sie zu Herpes neigen, empfehlen wir eine Prophylaxe vor der Behandlung.</li>
      <li>Falls Ihre Lippen trocken sind, führen Sie bitte 1–2 Tage vor der Behandlung ein sanftes Peeling durch und verwenden Sie eine feuchtigkeitsspendende Lippenpflege.</li>
    </ul>
    <p><strong>Wichtiger Hinweis:</strong></p>
    <ul>
      <li>Die behandelte Stelle darf für 48 Stunden nicht mit Wasser in Kontakt kommen. Bitte planen Sie Ihre Haarwäsche oder Dusche entsprechend im Voraus.</li>
    </ul>
  `,

  // Lash Lifting
  "lash-lifting": `
    <h4>Lash Lifting – Wimpernlifting</h4>
    <ul>
      <li>Bitte kommen Sie ungeschminkt zur Behandlung.</li>
      <li>Hormonelle Schwankungen (z. B. Periode, Schwangerschaft, Stillzeit) können das Ergebnis beeinflussen.</li>
      <li>Verwenden Sie 24 Stunden vor der Behandlung keine ölhaltigen Produkte auf den Wimpern.</li>
      <li>Falls Sie empfindliche Augen oder Allergien haben, teilen Sie uns dies bitte im Voraus mit.</li>
      <li>Tragen Sie keine Kontaktlinsen während der Behandlung. Bitte entfernen Sie Ihre Linsen vorher oder bringen Sie Ihr Etui und Pflegemittel mit.</li>
    </ul>
  `,

  // Brow Lifting
  browlifting: `
    <h4>Brow Lifting – Augenbrauenlifting</h4>
    <ul>
      <li>Bitte kommen Sie ohne Make-up an den Augenbrauen.</li>
      <li>Die Haut sollte frei von Irritationen, Wunden oder Sonnenbrand sein.</li>
      <li>Hormonelle Veränderungen können das Ergebnis beeinflussen.</li>
      <li>48 Stunden vor der Behandlung kein Peeling oder starkes Reiben der Brauenhaut.</li>
    </ul>
  `,

  // Microneedling
  microneedling: `
    <h4>Microneedling</h4>
    <p><strong>Nicht geeignet für:</strong></p>
    <ul>
      <li>Schwangere oder stillende Personen</li>
      <li>Personen mit aktiven Hautinfektionen, Ekzemen oder offenen Wunden im Behandlungsbereich</li>
      <li>Personen mit Blutgerinnungsstörungen oder Einnahme blutverdünnender Medikamente</li>
      <li>Personen mit Neigung zu Keloiden oder hypertrophen Narben</li>
    </ul>
    <p><strong>7 Tage vor der Behandlung:</strong></p>
    <ul>
      <li>Keine Botox-, Filler- oder chemische Peeling-Behandlungen.</li>
    </ul>
    <p><strong>24 Stunden vor der Behandlung:</strong></p>
    <ul>
      <li>Kein Alkohol, Koffein oder blutverdünnende Medikamente (z. B. Aspirin) einnehmen.</li>
      <li>Kein intensives Sonnenbaden oder Solarium.</li>
    </ul>
    <p><strong>Wichtiger Hinweis:</strong></p>
    <ul>
      <li>Bitte kommen Sie mit gereinigter Haut und ohne Make-up zur Behandlung.</li>
      <li>Nach der Behandlung kann die Haut leicht gerötet sein – dies ist normal und klingt in der Regel innerhalb von 24–48 Stunden ab.</li>
      <li>Planen Sie Ihre Termine so, dass Sie nach der Behandlung mindestens 48 Stunden lang kein Make-up auftragen müssen.</li>
    </ul>
  `,
};

// DOM-Elemente - werden im DOMContentLoaded-Event initialisiert
let bookingForm,
  serviceSelect,
  dateInput,
  timeSelect,
  nameInput,
  emailInput,
  phoneInput,
  messageInput;
let confirmationModal, confirmationDetails, confirmBookingBtn, cancelBookingBtn;
let successModal, backToHomeBtn;
let closeModalBtns;
// Neue DOM-Elemente für das Terms-Modal
let termsModal, termsContent, termsCheckbox, acceptTermsBtn, cancelTermsBtn;

// Google Calendar API Variablen
let gapi = null;
let googleAuth = null;
let isGoogleApiInitialized = false;
let isGoogleAuthorized = false;
let googleAuthBtn = null;

// Globale Variablen
let selectedService = "";
let selectedDate = "";
let availableTimes = [];

// EmailJS Konfiguration - BITTE AKTUALISIEREN
const EMAILJS_SERVICE_ID = "service_drz8xtb";
const EMAILJS_TEMPLATE_ID_CUSTOMER = "template_hxneksd";
const EMAILJS_TEMPLATE_ID_ADMIN = "template_gwjs37v";
const EMAILJS_PUBLIC_KEY = "jjBT0mSIJ15QACfrL";

// Initialisiere EmailJS wenn die Seite geladen ist
document.addEventListener("DOMContentLoaded", function () {
  // EmailJS initialisieren
  emailjs.init(EMAILJS_PUBLIC_KEY);
  console.log("EmailJS initialisiert mit Public Key:", EMAILJS_PUBLIC_KEY);

  // Füge einen Test-Button hinzu, um EmailJS direkt zu testen
  // createEmailTestButton(); // Diese Zeile wurde entfernt, um den Test-Button zu deaktivieren

  // DOM-Elemente initialisieren - mit Fehlerprüfung
  bookingForm = document.getElementById("booking-form");
  serviceSelect = document.getElementById("service");
  dateInput = document.getElementById("date");
  timeSelect = document.getElementById("time");
  nameInput = document.getElementById("full-name");
  emailInput = document.getElementById("email");
  phoneInput = document.getElementById("phone");
  messageInput = document.getElementById("message");

  confirmationModal = document.getElementById("confirmation-modal");
  confirmationDetails = document.getElementById("confirmation-details");
  confirmBookingBtn = document.getElementById("confirm-booking");
  cancelBookingBtn = document.getElementById("cancel-booking");

  successModal = document.getElementById("success-modal");
  backToHomeBtn = document.getElementById("back-to-home");

  closeModalBtns = document.querySelectorAll(".close-modal");

  // Google Auth Button - wird nur initialisiert, wenn vorhanden (für Admin-Seite)
  googleAuthBtn = document.getElementById("google-auth-btn");

  // Neue DOM-Elemente für das Terms-Modal
  termsModal = document.getElementById("terms-modal");
  termsContent = document.getElementById("terms-content");
  termsCheckbox = document.getElementById("terms-checkbox");
  acceptTermsBtn = document.getElementById("accept-terms");
  cancelTermsBtn = document.getElementById("cancel-terms");

  // Überprüfen, ob alle Elemente korrekt gefunden wurden
  console.log("Form found:", bookingForm !== null);
  console.log("Confirmation modal found:", confirmationModal !== null);
  console.log("Confirmation details found:", confirmationDetails !== null);
  console.log("Confirm booking button found:", confirmBookingBtn !== null);
  console.log("Cancel booking button found:", cancelBookingBtn !== null);
  console.log("Success modal found:", successModal !== null);
  console.log("Back to home button found:", backToHomeBtn !== null);
  console.log("Google Auth Button found:", googleAuthBtn !== null);

  // Firebase-Initialisierung prüfen
  checkFirebaseInitialization();

  // Google API initialisieren - NUR wenn der Auth-Button vorhanden ist (Admin-Seite)
  if (googleAuthBtn && typeof window.gapi !== "undefined") {
    console.log(
      "Google API gefunden und Auth Button vorhanden, initialisiere..."
    );
    initializeGoogleApi();
  } else {
    console.log(
      "Google API wird übersprungen - kein Auth Button gefunden oder API nicht verfügbar"
    );
    // Für reguläre Benutzer keine Fehlermeldung ausgeben
  }

  // Google Auth Button Event Listener - nur hinzufügen, wenn Button existiert
  if (googleAuthBtn) {
    googleAuthBtn.addEventListener("click", function () {
      // Direkte Google API Authentifizierung ohne Firebase-Anmeldung vorher
      if (typeof gapi !== "undefined" && gapi.auth2) {
        handleGoogleSignIn();
      } else {
        // Falls Google API noch nicht geladen ist
        console.log("Google API wird geladen...");
        initializeGoogleApi();

        // Nachricht für Benutzer
        googleAuthBtn.textContent = "Google API wird geladen...";
        googleAuthBtn.style.backgroundColor = "#f1c40f";
      }
    });
  } else {
    console.error("Google Auth Button nicht gefunden!");
  }

  // Minimales Datum auf heute setzen
  const today = new Date();
  const formattedToday = today.toISOString().split("T")[0];
  if (dateInput) {
    dateInput.min = formattedToday;
    dateInput.addEventListener("change", handleDateChange);
  }

  if (serviceSelect) {
    serviceSelect.addEventListener("change", handleServiceChange);
  }

  // Formular-Submit-Event-Listener
  if (bookingForm) {
    bookingForm.addEventListener("submit", function (e) {
      console.log("Form submitted");
      e.preventDefault();
      handleFormSubmit(e);
    });
  } else {
    console.error("Booking form not found!");
  }

  // Bestätigungs-Button-Event-Listener
  if (confirmBookingBtn) {
    confirmBookingBtn.addEventListener("click", function () {
      console.log("Confirm booking button clicked");
      confirmBooking();
    });
  } else {
    console.error("Confirm booking button not found!");
  }

  // Abbrechen-Button-Event-Listener
  if (cancelBookingBtn) {
    cancelBookingBtn.addEventListener("click", function () {
      console.log("Cancel booking button clicked");
      closeModals();
    });
  } else {
    console.error("Cancel booking button not found!");
  }

  // Zurück zur Startseite-Button-Event-Listener
  if (backToHomeBtn) {
    backToHomeBtn.addEventListener("click", function () {
      console.log("Back to home button clicked");
      window.location.href = "index.html";
    });
  } else {
    console.error("Back to home button not found!");
  }

  // Alle Modal-Schließen-Buttons
  if (closeModalBtns && closeModalBtns.length > 0) {
    closeModalBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        // Schließe alle Modals
        if (confirmationModal) confirmationModal.style.display = "none";
        if (successModal) successModal.style.display = "none";
        if (termsModal) termsModal.style.display = "none";
      });
    });
  } else {
    console.error("Close modal buttons not found!");
  }

  // Event-Listener für Modals (wenn außerhalb geklickt wird)
  window.addEventListener("click", function (event) {
    if (confirmationModal && event.target === confirmationModal) {
      confirmationModal.style.display = "none";
    }
    if (successModal && event.target === successModal) {
      successModal.style.display = "none";
    }
    if (termsModal && event.target === termsModal) {
      termsModal.style.display = "none";
    }
  });

  // Cookie-Banner Funktionalität
  const cookieBanner = document.getElementById("cookieBanner");
  const cookieAccept = document.getElementById("cookieAccept");
  const cookieDecline = document.getElementById("cookieDecline");

  if (!getCookie("cookieConsent")) {
    cookieBanner.style.display = "block";
  }

  // Event-Listener für die Buttons
  cookieAccept.addEventListener("click", function () {
    setCookie("cookieConsent", "accepted", 365);
    cookieBanner.style.display = "none";
    // Hier können Sie Code hinzufügen, um zusätzliche Cookies zu setzen oder Analytics zu aktivieren
  });

  cookieDecline.addEventListener("click", function () {
    setCookie("cookieConsent", "declined", 365);
    cookieBanner.style.display = "none";
  });

  // Sicherstellen, dass der "Learn more"-Link funktioniert
  const cookieMoreInfo = document.querySelector(".cookie-more-info");
  if (cookieMoreInfo) {
    cookieMoreInfo.addEventListener("click", function (e) {
      // Standardverhalten des Links beibehalten (zur datenschutz.html navigieren)
      console.log("Learn more link clicked");
    });
  }

  // Event-Listener für das Terms-Modal
  if (termsCheckbox) {
    termsCheckbox.addEventListener("change", function () {
      if (acceptTermsBtn) {
        acceptTermsBtn.disabled = !this.checked;
      }
    });
  }

  if (acceptTermsBtn) {
    acceptTermsBtn.addEventListener("click", function () {
      if (termsModal) {
        termsModal.style.display = "none";
      }
      // Nach Zustimmung zu den Bedingungen das Bestätigungsmodal anzeigen
      showConfirmationModal();
    });
  }

  if (cancelTermsBtn) {
    cancelTermsBtn.addEventListener("click", function () {
      if (termsModal) {
        termsModal.style.display = "none";
      }
    });
  }
});

// Google Auth Button Funktionalität
function handleGoogleSignIn() {
  console.log("Starte Google Anmeldung...");

  const googleAuthBtn = document.getElementById("google-auth-btn");
  googleAuthBtn.textContent = "Verbindung wird hergestellt...";

  gapi.auth2
    .getAuthInstance()
    .signIn()
    .then(
      function (user) {
        console.log("Google Anmeldung erfolgreich:", user);
        googleAuthBtn.textContent = "Mit Google verbunden ✓";
        googleAuthBtn.style.backgroundColor = "#27ae60";
        googleAuthBtn.style.color = "white";

        // Testen, ob wir Zugriff auf den Kalender haben
        testCalendarAccess();
      },
      function (error) {
        console.error("Google Anmeldung fehlgeschlagen:", error);
        googleAuthBtn.textContent = "Anmeldung fehlgeschlagen";
        googleAuthBtn.style.backgroundColor = "#e74c3c";

        // Nach 3 Sekunden Button zurücksetzen
        setTimeout(function () {
          googleAuthBtn.textContent = "Mit Google verbinden";
          googleAuthBtn.style.backgroundColor = "#4285F4";
        }, 3000);

        // Benutzer informieren
        alert("Google Anmeldung fehlgeschlagen: " + error.error);
      }
    );
}

// Google API initialisieren - aktualisierte Version ohne Firebase-Abhängigkeit
function initializeGoogleApi() {
  console.log("Initialisiere Google API...");

  // Google API laden
  const script = document.createElement("script");
  script.src = "https://apis.google.com/js/api.js";
  script.onload = function () {
    console.log("Google API Script geladen");
    gapi.load("client:auth2", startGoogleClient);
  };
  script.onerror = function () {
    console.error("Fehler beim Laden der Google API");
    alert(
      "Fehler beim Laden der Google API. Bitte prüfen Sie Ihre Internetverbindung."
    );
  };
  document.body.appendChild(script);
}

// Google Client starten - aktualisierte Version
function startGoogleClient() {
  console.log("Initialisiere Google Client...");

  gapi.client
    .init({
      apiKey: CONFIG.apiKey,
      clientId: CONFIG.clientId,
      discoveryDocs: [
        "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
      ],
      scope: CONFIG.scopes,
    })
    .then(function () {
      console.log("Google Client initialisiert");

      // Status des Auth-Buttons aktualisieren
      const googleAuthBtn = document.getElementById("google-auth-btn");

      // Prüfen, ob Benutzer bereits angemeldet ist
      if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
        console.log("Benutzer bereits mit Google angemeldet");
        googleAuthBtn.textContent = "Mit Google verbunden ✓";
        googleAuthBtn.style.backgroundColor = "#27ae60";

        // Testen, ob wir Zugriff auf den Kalender haben
        testCalendarAccess();
      } else {
        console.log("Benutzer nicht mit Google angemeldet");
        googleAuthBtn.textContent = "Mit Google verbinden";
        googleAuthBtn.style.backgroundColor = "#4285F4";
      }

      // Auf Änderungen des Anmeldestatus hören
      gapi.auth2.getAuthInstance().isSignedIn.listen(function (isSignedIn) {
        console.log("Google Anmeldestatus geändert:", isSignedIn);

        if (isSignedIn) {
          googleAuthBtn.textContent = "Mit Google verbunden ✓";
          googleAuthBtn.style.backgroundColor = "#27ae60";
        } else {
          googleAuthBtn.textContent = "Mit Google verbinden";
          googleAuthBtn.style.backgroundColor = "#4285F4";
        }
      });
    })
    .catch(function (error) {
      console.error("Google Client Initialisierung fehlgeschlagen:", error);
      alert(
        "Fehler bei der Initialisierung der Google API: " + error.details ||
          error.message ||
          JSON.stringify(error)
      );
    });
}

// Neue Funktion zum Testen des Kalenderzugriffs
async function testCalendarAccess() {
  try {
    // Versuche, die nächsten 10 Ereignisse im Kalender abzurufen
    const response = await gapi.client.calendar.events.list({
      calendarId: CONFIG.calendarId,
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    console.log(
      "✅ Kalenderzugriff erfolgreich getestet:",
      response.result.items.length + " Ereignisse gefunden"
    );

    if (googleAuthBtn) {
      googleAuthBtn.classList.add("btn-success");
      googleAuthBtn.textContent = "Google Calendar verbunden ✓";
    }

    return true;
  } catch (error) {
    console.error("❌ Kalenderzugriff fehlgeschlagen:", error);

    if (error.result && error.result.error.code === 404) {
      console.error(
        "Kalender nicht gefunden. Bitte überprüfen Sie die Kalender-ID:",
        CONFIG.calendarId
      );
      alert(
        "Der angegebene Google Kalender wurde nicht gefunden. Bitte überprüfen Sie die Kalender-ID in der Konfiguration."
      );
    } else if (error.result && error.result.error.code === 403) {
      console.error(
        "Keine Berechtigung für den Kalender. Bitte teilen Sie den Kalender mit dem Dienstkonto oder verwenden Sie den primären Kalender des angemeldeten Benutzers."
      );
      alert(
        "Sie haben keine Berechtigung für den angegebenen Kalender. Bitte stellen Sie sicher, dass Sie Zugriff auf diesen Kalender haben."
      );
    }

    return false;
  }
}

async function authorizeGoogleCalendar(bookingData) {
  console.log("Autorisiere Google Calendar...");
  if (!isGoogleApiInitialized) {
    console.error("Google API nicht initialisiert.");
    return false;
  }

  try {
    if (!isGoogleAuthorized) {
      console.log("Nicht autorisiert, starte Google SignIn Popup...");
      await googleAuth.signIn({
        prompt: "select_account",
        ux_mode: "popup",
      });
      console.log("Google Calendar autorisiert.");
      return true;
    } else {
      console.log("Bereits autorisiert.");
      return true;
    }
  } catch (error) {
    console.error("Fehler bei der Google Calendar Autorisierung:", error);
    return false;
  }
}

async function addEventToGoogleCalendar(bookingData) {
  console.log("Füge Termin zum Google Kalender hinzu...");

  if (!isGoogleApiInitialized) {
    console.error("Google API nicht initialisiert.");
    return false;
  }

  try {
    // Autorisieren, falls noch nicht geschehen
    const authorized = await authorizeGoogleCalendar();
    if (!authorized) {
      console.error("Konnte Google Calendar nicht autorisieren.");
      return false;
    }

    // Start- und Endzeit berechnen
    const [hours, minutes] = bookingData.time.split(":");
    const startDate = new Date(bookingData.date);
    startDate.setHours(parseInt(hours), parseInt(minutes), 0);

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + bookingData.duration);

    // Kalenderereignis erstellen mit detaillierteren Informationen
    const event = {
      summary: `${bookingData.serviceName} - ${bookingData.name}`,
      description: `Kundentermin: ${bookingData.serviceName}\n\nKunde: ${
        bookingData.name
      }\nEmail: ${bookingData.email}\nTelefon: ${
        bookingData.phone
      }\n\nNachricht: ${bookingData.message || "Keine Nachricht"}\n\nPreis: ${
        bookingData.price
      }€\nDauer: ${bookingData.duration} Minuten\n\nBuchungs-ID: ${
        bookingData.bookingId || "nicht verfügbar"
      }`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: "Europe/Berlin",
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: "Europe/Berlin",
      },
      colorId: "4", // Blauton, kann angepasst werden (1-11)
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 1 Tag vorher
          { method: "popup", minutes: 60 }, // 1 Stunde vorher
          { method: "popup", minutes: 30 }, // 30 Minuten vorher
        ],
      },
      // Füge Status hinzu
      status: "confirmed",
      // Transparenz: Wenn besetzt, wird die Zeit als belegt angezeigt
      transparency: "opaque",
      // Sichtbarkeit: Standard, privat, etc.
      visibility: "default",
    };

    console.log("Event wird erstellt:", event);

    const request = gapi.client.calendar.events.insert({
      calendarId: CONFIG.calendarId,
      resource: event,
    });

    const response = await new Promise((resolve, reject) => {
      request.execute((resp) => {
        if (resp.error) {
          console.error("API-Fehler beim Erstellen des Events:", resp.error);
          reject(resp.error);
        } else {
          console.log("Event erfolgreich erstellt:", resp);
          resolve(resp);
        }
      });
    });

    console.log("Event created: %s", response.htmlLink);

    // Erfolgreiche Nachricht im UI anzeigen
    showSuccessNotification(
      "Google Kalender aktualisiert",
      "Der Termin wurde erfolgreich in Ihren Google Kalender eingetragen."
    );

    return true;
  } catch (error) {
    console.error("Fehler beim Hinzufügen des Termins zum Kalender:", error);

    // Benutzerfreundliche Fehlermeldung
    if (error && error.result) {
      if (error.result.error.code === 404) {
        alert(
          "Der Google Kalender konnte nicht gefunden werden. Bitte überprüfen Sie die Kalender-ID in der Konfiguration."
        );
      } else if (error.result.error.code === 403) {
        alert(
          "Sie haben keine Berechtigung, Termine in diesem Kalender zu erstellen. Bitte überprüfen Sie die Berechtigungen."
        );
      } else {
        alert(
          "Fehler beim Erstellen des Termins im Google Kalender: " +
            error.result.error.message
        );
      }
    } else {
      alert(
        "Es ist ein unbekannter Fehler bei der Google Calendar-Integration aufgetreten. Der Termin wurde trotzdem in unserem System gespeichert."
      );
    }

    return false;
  }
}

// Funktion zur Überprüfung der Firebase-Initialisierung
function checkFirebaseInitialization() {
  console.log("Checking Firebase initialization...");

  // Prüfen, ob Firebase definiert ist
  if (typeof firebase === "undefined") {
    console.error(
      "Firebase ist nicht definiert. Bitte stellen Sie sicher, dass die Firebase SDK korrekt geladen wurde."
    );
    showFirebaseError("Firebase ist nicht definiert");
    return false;
  }

  // Prüfen, ob Firestore definiert ist
  if (typeof firebase.firestore !== "function") {
    console.error(
      "Firebase Firestore ist nicht definiert. Bitte stellen Sie sicher, dass die Firestore SDK korrekt geladen wurde."
    );
    showFirebaseError("Firebase Firestore ist nicht definiert");
    return false;
  }

  // Prüfen, ob db definiert ist
  if (typeof db === "undefined") {
    console.error(
      "Firestore db ist nicht definiert. Bitte stellen Sie sicher, dass die Firestore-Datenbank korrekt initialisiert wurde."
    );

    // Versuchen, db zu initialisieren, falls Firebase verfügbar ist
    try {
      window.db = firebase.firestore();
      console.log("Firestore db wurde initialisiert:", typeof window.db);
      return true;
    } catch (error) {
      console.error("Fehler bei der Initialisierung von Firestore:", error);
      showFirebaseError(
        "Fehler bei der Initialisierung von Firestore: " + error.message
      );
      return false;
    }
  }

  console.log("Firebase und Firestore sind korrekt initialisiert.");
  return true;
}

// Funktion zur Anzeige von Firebase-Fehlern
function showFirebaseError(message) {
  if (timeSelect) {
    timeSelect.innerHTML = `<option value="" selected disabled>Fehler: ${message}</option>`;
    timeSelect.disabled = true;
  }

  // Fehlermeldung im UI anzeigen
  const errorElement = document.createElement("div");
  errorElement.className = "firebase-error";
  errorElement.style.color = "red";
  errorElement.style.padding = "1rem";
  errorElement.style.marginTop = "1rem";
  errorElement.style.backgroundColor = "#ffeeee";
  errorElement.style.borderRadius = "5px";
  errorElement.innerHTML = `
    <p><strong>Fehler bei der Verbindung zur Datenbank:</strong></p>
    <p>${message}</p>
    <p>Bitte laden Sie die Seite neu oder kontaktieren Sie den Support.</p>
  `;

  // Fehlermeldung nach dem Formular einfügen
  if (bookingForm) {
    bookingForm.parentNode.insertBefore(errorElement, bookingForm.nextSibling);
  }
}

// Funktionen
function handleDateChange() {
  console.log("Date changed:", dateInput.value);
  const selectedDate = dateInput.value;

  if (!selectedDate) {
    timeSelect.disabled = true;
    timeSelect.innerHTML =
      '<option value="" selected disabled>Bitte wählen Sie zuerst ein Datum</option>';
    return;
  }

  // Verfügbare Zeiten basierend auf dem ausgewählten Datum laden
  loadAvailableTimes(selectedDate);
}

function handleServiceChange() {
  console.log("Service changed:", serviceSelect.value);
  // Wenn ein Service ausgewählt wurde und ein Datum vorhanden ist, Zeiten neu laden
  if (serviceSelect && serviceSelect.value && dateInput && dateInput.value) {
    loadAvailableTimes(dateInput.value);
  }
}

async function loadAvailableTimes(date) {
  console.log("Loading available times for date:", date);

  if (!timeSelect) {
    console.error("Time select element not found!");
    return;
  }

  timeSelect.disabled = true;
  timeSelect.innerHTML =
    '<option value="" selected disabled>Zeiten werden geladen...</option>';

  try {
    // Debug-Informationen
    console.log("Firebase object:", typeof firebase);
    console.log("Firestore db object:", typeof db);

    if (typeof firebase === "undefined") {
      throw new Error("Firebase ist nicht definiert");
    }

    if (typeof db === "undefined") {
      throw new Error("Firestore db ist nicht definiert");
    }

    // Ausgewählter Service
    const selectedService =
      serviceSelect && serviceSelect.value
        ? services[serviceSelect.value]
        : null;
    const serviceDuration = selectedService ? selectedService.duration : 60;

    // Prüfen, ob das ausgewählte Datum ein Wochenende ist
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay(); // 0 = Sonntag, 6 = Samstag

    let startTime, endTime;

    if (dayOfWeek === 0) {
      // Sonntag - geschlossen
      timeSelect.innerHTML =
        '<option value="" selected disabled>Sonntag geschlossen</option>';
      return;
    } else if (dayOfWeek === 6) {
      // Samstag - 10:00 bis 16:00
      startTime = 10;
      endTime = 16;
    } else {
      // Montag bis Freitag - 10:00 bis 19:00
      startTime = 10;
      endTime = 19;
    }

    console.log("Attempting to access Firestore collection 'bookings'");

    try {
      // Versuchen, auf die Firestore-Datenbank zuzugreifen
      // Wenn dies fehlschlägt, verwenden wir einen Fallback-Modus ohne Datenbankabfrage
      const bookingsSnapshot = await db
        .collection("bookings")
        .where("date", "==", date)
        .get()
        .catch((error) => {
          console.error("Firestore access error:", error);
          // Wenn der Fehler mit Berechtigungen zu tun hat, werfen wir ihn weiter
          if (error.code === "permission-denied") {
            throw new Error(
              "Zugriff auf die Datenbank verweigert. Bitte kontaktieren Sie den Administrator."
            );
          }
          // Bei anderen Fehlern verwenden wir den Fallback-Modus
          throw new Error(
            "Datenbankzugriff nicht möglich - Fallback-Modus aktiviert"
          );
        });

      console.log("Firestore query successful");

      // Gebuchte Zeiten mit Servicedetails sammeln
      const bookedSlots = [];
      bookingsSnapshot.forEach((doc) => {
        const bookingData = doc.data();
        // Wir benötigen Zeit und Dauer für jede Buchung
        if (bookingData.time && bookingData.duration) {
          bookedSlots.push({
            startTime: bookingData.time,
            duration: bookingData.duration,
            service: bookingData.service || "",
            serviceName: bookingData.serviceName || "Unbekannter Service",
          });
        } else {
          console.warn("Unvollständige Buchungsdaten gefunden:", bookingData);
        }
      });

      console.log("Booked slots:", bookedSlots);

      // Verfügbare Zeiten generieren, unter Berücksichtigung der Servicedauer
      const availableTimes = [];

      // Für jeden möglichen Zeitslot überprüfen
      for (let hour = startTime; hour < endTime; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          // Prüfen, ob genug Zeit für den Service vor Ladenschluss bleibt
          const serviceEndHour =
            hour + Math.floor((minute + serviceDuration) / 60);
          const serviceEndMinute = (minute + serviceDuration) % 60;

          if (
            serviceEndHour < endTime ||
            (serviceEndHour === endTime && serviceEndMinute === 0)
          ) {
            const timeString = `${hour.toString().padStart(2, "0")}:${minute
              .toString()
              .padStart(2, "0")}`;

            // Überprüfen, ob dieser Zeitslot mit einer bestehenden Buchung überschneidet
            const isSlotAvailable = !isTimeSlotOverlapping(
              timeString,
              serviceDuration,
              bookedSlots
            );

            if (isSlotAvailable) {
              availableTimes.push(timeString);
            }
          }
        }
      }

      console.log("Available times:", availableTimes);

      // Zeitauswahl aktualisieren
      updateTimeSelect(availableTimes);
    } catch (firestoreError) {
      console.error("Firestore error:", firestoreError);

      // Fallback-Modus: Alle Zeiten anzeigen (nicht optimal, aber besser als gar nichts)
      console.log(
        "Using fallback mode - showing all available times without checking bookings"
      );

      const availableTimes = [];

      // Alle möglichen Zeitslots generieren
      for (let hour = startTime; hour < endTime; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          // Prüfen, ob genug Zeit für den Service vor Ladenschluss bleibt
          const serviceEndHour =
            hour + Math.floor((minute + serviceDuration) / 60);
          const serviceEndMinute = (minute + serviceDuration) % 60;

          if (
            serviceEndHour < endTime ||
            (serviceEndHour === endTime && serviceEndMinute === 0)
          ) {
            const timeString = `${hour.toString().padStart(2, "0")}:${minute
              .toString()
              .padStart(2, "0")}`;
            availableTimes.push(timeString);
          }
        }
      }

      // Zeitauswahl aktualisieren mit Hinweis auf Fallback-Modus
      updateTimeSelect(availableTimes, true);
    }
  } catch (error) {
    console.error("Fehler beim Laden der verfügbaren Zeiten:", error);
    if (timeSelect) {
      timeSelect.innerHTML =
        '<option value="" selected disabled>Fehler: ' +
        error.message +
        "</option>";
    }
  }
}

// Neue Funktion: Überprüfen, ob sich ein Zeitslot mit bestehenden Buchungen überschneidet
function isTimeSlotOverlapping(startTimeStr, duration, bookedSlots) {
  // Konvertiere den String "HH:MM" in Minuten seit Tagesbeginn
  function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }

  // Start- und Endzeit des neuen Termins in Minuten
  const newSlotStart = timeToMinutes(startTimeStr);
  const newSlotEnd = newSlotStart + duration;

  // Überprüfen, ob sich der neue Termin mit einem bestehenden überschneidet
  for (const bookedSlot of bookedSlots) {
    const bookedStart = timeToMinutes(bookedSlot.startTime);
    const bookedEnd = bookedStart + bookedSlot.duration;

    // Überprüfen auf Überschneidung - korrigierte Logik:
    // Eine Überschneidung liegt nur vor, wenn der neue Termin in den bestehenden Termin hineinragt
    // oder der bestehende Termin in den neuen Termin hineinragt
    const hasOverlap =
      // Wenn der neue Termin während eines bestehenden beginnt
      (newSlotStart >= bookedStart && newSlotStart < bookedEnd) ||
      // Wenn der neue Termin während eines bestehenden endet
      (newSlotEnd > bookedStart && newSlotEnd <= bookedEnd) ||
      // Wenn der neue Termin einen bestehenden komplett umfasst
      (newSlotStart < bookedStart && newSlotEnd > bookedEnd);

    if (hasOverlap) {
      console.log(
        `Zeitkonflikt erkannt: Neue Zeit ${startTimeStr} (Dauer: ${duration} Min.) überschneidet sich mit bestehender Buchung ${bookedSlot.serviceName} um ${bookedSlot.startTime} (Dauer: ${bookedSlot.duration} Min.)`
      );
      return true; // Überschneidung gefunden
    }
  }

  return false; // Keine Überschneidung
}

// Hilfsfunktion zum Aktualisieren der Zeitauswahl
function updateTimeSelect(availableTimes, isFallbackMode = false) {
  if (!timeSelect) {
    console.error("Time select element not found!");
    return;
  }

  timeSelect.innerHTML = "";

  if (availableTimes.length === 0) {
    timeSelect.innerHTML =
      '<option value="" selected disabled>Keine Termine verfügbar</option>';
  } else {
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.disabled = true;
    defaultOption.selected = true;

    if (isFallbackMode) {
      defaultOption.textContent =
        "⚠️ Offline-Modus - Bitte wählen Sie eine Uhrzeit";
    } else {
      defaultOption.textContent = "Bitte wählen Sie eine Uhrzeit";
    }

    timeSelect.appendChild(defaultOption);

    availableTimes.forEach((time) => {
      const option = document.createElement("option");
      option.value = time;
      option.textContent = time + " Uhr";
      timeSelect.appendChild(option);
    });

    timeSelect.disabled = false;
  }
}

function handleFormSubmit(e) {
  console.log("Handling form submission");

  // Formularvalidierung
  if (!validateForm()) {
    return;
  }

  // Buchungsdetails anzeigen
  if (
    !serviceSelect ||
    !dateInput ||
    !timeSelect ||
    !nameInput ||
    !emailInput ||
    !phoneInput
  ) {
    console.error("Required form elements not found!");
    alert("Es ist ein Fehler aufgetreten. Bitte laden Sie die Seite neu.");
    return;
  }

  // Hier verwenden wir let statt const, um den Fehler zu beheben
  let selectedService = services[serviceSelect.value];
  let bookingDetails = `
    <p><strong>Service:</strong> ${selectedService.name}</p>
    <p><strong>Datum:</strong> ${formatDate(dateInput.value)}</p>
    <p><strong>Uhrzeit:</strong> ${timeSelect.value} Uhr</p>
    <p><strong>Dauer:</strong> ${selectedService.duration} Minuten</p>
    <p><strong>Preis:</strong> €${selectedService.price}</p>
    <p><strong>Name:</strong> ${nameInput.value}</p>
    <p><strong>E-Mail:</strong> ${emailInput.value}</p>
    <p><strong>Telefon:</strong> ${phoneInput.value}</p>
  `;

  if (messageInput && messageInput.value) {
    bookingDetails += `<p><strong>Nachricht:</strong> ${messageInput.value}</p>`;
  }

  if (confirmationDetails) {
    confirmationDetails.innerHTML = bookingDetails;
  }

  // Anstatt direkt das Confirmation Modal anzuzeigen, zuerst die Terms anzeigen
  showTermsModal(serviceSelect.value);
}

function validateForm() {
  console.log("Validating form");

  // Prüfen, ob alle erforderlichen Elemente existieren
  if (
    !serviceSelect ||
    !dateInput ||
    !timeSelect ||
    !nameInput ||
    !emailInput ||
    !phoneInput
  ) {
    console.error("Required form elements not found!");
    alert("Es ist ein Fehler aufgetreten. Bitte laden Sie die Seite neu.");
    return false;
  }

  // Einfache Validierung - kann erweitert werden
  if (!serviceSelect.value) {
    alert("Bitte wählen Sie einen Service aus.");
    return false;
  }

  if (!dateInput.value) {
    alert("Bitte wählen Sie ein Datum aus.");
    return false;
  }

  if (!timeSelect.value) {
    alert("Bitte wählen Sie eine Uhrzeit aus.");
    return false;
  }

  if (!nameInput.value) {
    alert("Bitte geben Sie Ihren Namen ein.");
    return false;
  }

  if (!emailInput.value) {
    alert("Bitte geben Sie Ihre E-Mail-Adresse ein.");
    return false;
  }

  if (!phoneInput.value) {
    alert("Bitte geben Sie Ihre Telefonnummer ein.");
    return false;
  }

  return true;
}

async function confirmBooking() {
  console.log("Confirming booking");
  try {
    // Prüfen, ob alle erforderlichen Elemente existieren
    if (
      !serviceSelect ||
      !dateInput ||
      !timeSelect ||
      !nameInput ||
      !emailInput ||
      !phoneInput
    ) {
      console.error("Required form elements not found!");
      alert("Es ist ein Fehler aufgetreten. Bitte laden Sie die Seite neu.");
      return;
    }

    // Prüfen, ob Firebase und db definiert sind
    if (typeof firebase === "undefined" || typeof db === "undefined") {
      console.error("Firebase oder db ist nicht definiert");
      alert(
        "Fehler: Firebase nicht initialisiert. Bitte laden Sie die Seite neu und versuchen Sie es erneut."
      );
      return;
    }

    // Buchungsdaten für Firebase vorbereiten
    const bookingData = {
      service: serviceSelect.value,
      serviceName: services[serviceSelect.value].name,
      date: dateInput.value,
      time: timeSelect.value,
      name: nameInput.value,
      email: emailInput.value,
      phone: phoneInput.value,
      message: messageInput ? messageInput.value || "" : "",
      price: services[serviceSelect.value].price,
      duration: services[serviceSelect.value].duration,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: "confirmed",
      // Speicherung der Zustimmung zu den Behandlungsbedingungen
      termsAccepted: true,
      termsAcceptedAt: new Date().toISOString(),
      termsVersion: "1.0", // Version der Bedingungen für zukünftige Änderungen
      termsType: getServiceTermsType(serviceSelect.value), // Art der akzeptierten Bedingungen (service-spezifisch)
    };

    console.log("Booking data:", bookingData);

    try {
      // In Firebase speichern
      console.log("Attempting to save booking to Firestore...");
      const docRef = await db.collection("bookings").add(bookingData);
      console.log("Document written with ID: ", docRef.id);

      // Zusätzlich einen Audit-Trail der Zustimmung in einer separaten Collection speichern
      await saveTermsAcceptanceAudit(bookingData, docRef.id);

      // Booking ID zu den Daten hinzufügen (wichtig für Google Calendar)
      bookingData.bookingId = docRef.id;

      // E-Mail-Bestätigungen senden
      sendConfirmationEmails(bookingData, docRef.id);

      // Versuche, den Termin zum Google Kalender hinzuzufügen - nur wenn API initialisiert und autorisiert
      let calendarSuccess = false;
      if (isGoogleApiInitialized && isGoogleAuthorized) {
        try {
          console.log("Versuche, Termin zum Google Kalender hinzuzufügen...");
          calendarSuccess = await addEventToGoogleCalendar(bookingData);
          if (calendarSuccess) {
            console.log("Termin erfolgreich zum Google Kalender hinzugefügt.");
          } else {
            console.warn(
              "Termin konnte nicht zum Google Kalender hinzugefügt werden."
            );
          }
        } catch (calendarError) {
          console.warn("Fehler bei der Kalender-Integration:", calendarError);
          // Kein Alert für Benutzer, nur Konsolenwarnung
        }
      } else {
        console.log(
          "Google Calendar Integration übersprungen - nicht initialisiert oder autorisiert. Status: ",
          "Initialisiert:",
          isGoogleApiInitialized,
          "Autorisiert:",
          isGoogleAuthorized
        );

        // Wenn der Admin-Button verfügbar ist, aber keine Autorisierung vorliegt
        if (googleAuthBtn && isGoogleApiInitialized && !isGoogleAuthorized) {
          console.log(
            "Google Auth Button gefunden, aber nicht autorisiert. Hinweis anzeigen."
          );
          showSuccessNotification(
            "Google Calendar nicht verbunden",
            "Um Termine automatisch in Google Calendar einzutragen, klicken Sie auf 'Mit Google verbinden'.",
            8000
          );
        }
      }

      // Bestätigungsmodal schließen und Erfolgsmodal anzeigen
      if (confirmationModal) confirmationModal.style.display = "none";
      if (successModal) {
        // Erfolgstext ist für alle Benutzer gleich - keine Erwähnung von Google Calendar
        successModal.style.display = "block";
        console.log("Success modal should be displayed now");
      } else {
        console.error("Success modal not found!");
        alert("Ihre Buchung wurde erfolgreich gespeichert!");
      }

      // Formular zurücksetzen
      if (bookingForm) bookingForm.reset();
      if (timeSelect) {
        timeSelect.disabled = true;
        timeSelect.innerHTML =
          '<option value="" selected disabled>Bitte wählen Sie zuerst ein Datum</option>';
      }
    } catch (firestoreError) {
      console.error("Firestore error during booking:", firestoreError);
      console.log("Firestore error code:", firestoreError.code);
      console.log("Firestore error message:", firestoreError.message);

      // E-Mail trotzdem senden - auch ohne Datenbank-Speicherung
      const tempBookingId = "temp-" + new Date().getTime();
      sendConfirmationEmails(bookingData, tempBookingId);

      // Wenn der Fehler mit Berechtigungen zu tun hat
      if (firestoreError.code === "permission-denied") {
        alert(
          "Zugriff auf die Datenbank verweigert. Bitte kontaktieren Sie den Administrator."
        );
      } else {
        // Fallback: Lokale Bestätigung ohne Datenbankspeicherung
        console.log("Using fallback mode for booking confirmation");
        alert(
          "Hinweis: Ihre Buchung konnte nicht in der Datenbank gespeichert werden. Bitte kontaktieren Sie uns telefonisch unter +49 176-32812602, um Ihren Termin zu bestätigen."
        );
      }

      // Bestätigungsmodal schließen und Erfolgsmodal anzeigen
      if (confirmationModal) confirmationModal.style.display = "none";
      if (successModal) {
        successModal.style.display = "block";
      } else {
        console.error("Success modal not found!");
      }

      // Formular zurücksetzen
      if (bookingForm) bookingForm.reset();
      if (timeSelect) {
        timeSelect.disabled = true;
        timeSelect.innerHTML =
          '<option value="" selected disabled>Bitte wählen Sie zuerst ein Datum</option>';
      }
    }
  } catch (error) {
    console.error("Fehler beim Speichern der Buchung:", error);
    alert(
      "Es ist ein Fehler aufgetreten: " +
        error.message +
        "\nBitte versuchen Sie es später erneut oder kontaktieren Sie uns telefonisch."
    );
    if (confirmationModal) confirmationModal.style.display = "none";
  }
}

function closeModals() {
  console.log("Closing modals");
  if (confirmationModal) confirmationModal.style.display = "none";
  if (successModal) successModal.style.display = "none";
}

function formatDate(dateString) {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Date(dateString).toLocaleDateString("de-DE", options);
}

// E-Mail-Bestätigungen senden
function sendConfirmationEmails(bookingData, bookingId) {
  console.log("=== EMAIL DEBUGGING START ===");
  console.log("Sende Bestätigungs-E-Mails für Buchung:", bookingId);

  // Bestätigungsnachricht im UI zeigen, auch wenn E-Mail fehlschlägt
  showSuccessNotification(
    "Terminbuchung erfolgreich!",
    "Ihre Buchung wurde gespeichert. Falls Sie keine E-Mail-Bestätigung erhalten, kontaktieren Sie uns bitte direkt unter +49 176-32812602."
  );

  console.log("EmailJS Konfiguration:");
  console.log("- Service ID:", EMAILJS_SERVICE_ID);
  console.log("- Template ID Kunde:", EMAILJS_TEMPLATE_ID_CUSTOMER);
  console.log("- Template ID Admin:", EMAILJS_TEMPLATE_ID_ADMIN);
  console.log("- Public Key:", EMAILJS_PUBLIC_KEY);
  console.log("- EmailJS vorhanden:", typeof emailjs !== "undefined");
  console.log(
    "- EmailJS send Funktion vorhanden:",
    typeof emailjs.send === "function"
  );

  // Formatieren des Datums für die E-Mail (DD.MM.YYYY)
  const dateObj = new Date(bookingData.date);
  const formattedDate = `${dateObj.getDate().toString().padStart(2, "0")}.${(
    dateObj.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}.${dateObj.getFullYear()}`;

  // Vorbereitete Daten für E-Mail-Templates
  const emailData = {
    booking_id: bookingId,
    service: bookingData.serviceName,
    date: formattedDate,
    time: bookingData.time,
    price: `${bookingData.price}€`, // Preis direkt aus den Buchungsdaten mit €-Symbol
    customer_name: bookingData.name,
    customer_email: bookingData.email,
    customer_phone: bookingData.phone,
    message: bookingData.message || "Keine Nachricht",
    salon_name: "Sheen Beauty Studio",
    salon_address: "Kurfürstendamm 180, 10707 Berlin",
    salon_phone: "+49 176-32812602",
    salon_email: "kontakt@sheenberlin.de",
    // Füge zusätzliche Felder für bessere Kompatibilität mit verschiedenen E-Mail-Diensten hinzu
    from_name: "Sheen Beauty Studio",
    to_name: bookingData.name,
    reply_to: "kontakt@sheenberlin.de",
    // Information über die akzeptierten Behandlungsbedingungen
    terms_accepted: "Ja",
    terms_accepted_at: new Date().toLocaleString("de-DE"),
    terms_type: getServiceTermsTypeLabel(bookingData.service),
  };

  console.log("E-Mail-Daten vorbereitet:", JSON.stringify(emailData, null, 2));

  // Versuche zuerst mit EmailJS
  try {
    console.log("Versuche E-Mail mit EmailJS zu senden...");

    // 1. E-Mail an Kunden senden
    console.log("Sende E-Mail an Kunden...");
    emailjs
      .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_CUSTOMER, emailData)
      .then(
        function (response) {
          console.log(
            "✅ E-Mail an Kunden erfolgreich gesendet!",
            response.status,
            response.text
          );
        },
        function (error) {
          console.error("❌ Fehler beim Senden der Kunden-E-Mail:", error);
          console.error("Fehlerdetails:", JSON.stringify(error, null, 2));

          // Bei Fehler Alternative probieren: Formspree nutzen
          sendEmailViaFormspree(bookingData, emailData, "kunde");
        }
      );

    // 2. E-Mail an Salon senden
    console.log("Sende E-Mail an Salon...");
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_ADMIN, emailData).then(
      function (response) {
        console.log(
          "✅ E-Mail an Salon erfolgreich gesendet!",
          response.status,
          response.text
        );
      },
      function (error) {
        console.error("❌ Fehler beim Senden der Salon-E-Mail:", error);
        console.error("Fehlerdetails:", JSON.stringify(error, null, 2));

        // Bei Fehler Alternative probieren: Formspree nutzen
        sendEmailViaFormspree(bookingData, emailData, "salon");
      }
    );
  } catch (error) {
    console.error("❌ Schwerer Fehlerm bei EmailJS:", error);
    console.error("Stack Trace:", error.stack);
    console.error("Fehlerdetails:", JSON.stringify(error, null, 2));

    // Bei Fehler Alternative probieren: Formspree nutzen
    sendEmailViaFormspree(bookingData, emailData, "beide");
  }
  console.log("=== EMAIL DEBUGGING ENDE ===");
}

// Neue Funktion: Test-Button für E-Mail erstellen
function createEmailTestButton() {
  const testBtn = document.createElement("button");
  testBtn.id = "email-test-button";
  testBtn.textContent = "EmailJS Test";
  testBtn.style.position = "fixed";
  testBtn.style.bottom = "10px";
  testBtn.style.left = "10px";
  testBtn.style.zIndex = "9999";
  testBtn.style.padding = "10px 15px";
  testBtn.style.backgroundColor = "#333";
  testBtn.style.color = "white";
  testBtn.style.border = "none";
  testBtn.style.borderRadius = "4px";
  testBtn.style.cursor = "pointer";

  testBtn.addEventListener("click", testEmailJS);

  document.body.appendChild(testBtn);
  console.log("E-Mail-Test-Button hinzugefügt");
}

// Neue Funktion: EmailJS testen
function testEmailJS() {
  console.log("=== DIREKTER EMAILJS TEST GESTARTET ===");
  console.log("EmailJS Konfiguration:");
  console.log("- Service ID:", EMAILJS_SERVICE_ID);
  console.log("- Template ID Kunde:", EMAILJS_TEMPLATE_ID_CUSTOMER);
  console.log("- Public Key:", EMAILJS_PUBLIC_KEY);

  // Einfache Test-Daten
  const testData = {
    booking_id: "TEST-" + new Date().getTime(),
    service: "Test Service",
    date: "01.01.2023",
    time: "12:00",
    price: "100€",
    customer_name: "Test User",
    customer_email: "test@example.com",
    customer_phone: "+49 123 456789",
    message: "Dies ist ein Test",
    salon_name: "Sheen Beauty Studio",
    salon_address: "Kurfürstendamm 180, 10707 Berlin",
    salon_phone: "+49 176-32812602",
    salon_email: "kontakt@sheenberlin.de",
  };

  console.log("Test-Daten:", JSON.stringify(testData, null, 2));

  try {
    // EmailJS erneut initialisieren für den Test
    emailjs.init(EMAILJS_PUBLIC_KEY);

    // Test-E-Mail senden
    emailjs
      .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_CUSTOMER, testData)
      .then(
        function (response) {
          console.log(
            "✅ TEST ERFOLGREICH! E-Mail gesendet:",
            response.status,
            response.text
          );
          alert("E-Mail-Test erfolgreich! Prüfen Sie die Konsole für Details.");
        },
        function (error) {
          console.error("❌ TEST FEHLGESCHLAGEN! Fehler:", error);
          console.error("Fehlerdetails:", JSON.stringify(error, null, 2));
          alert("E-Mail-Test fehlgeschlagen! Fehler: " + JSON.stringify(error));
        }
      );
  } catch (error) {
    console.error("❌ SCHWERER FEHLER BEI TEST:", error);
    console.error("Stack Trace:", error.stack);
    alert("Schwerer Fehler beim E-Mail-Test: " + error.message);
  }

  console.log("=== EMAILJS TEST ABGESCHLOSSEN ===");
}

// Verbesserte Erfolgsmeldung mit optionaler Zeitdauer
function showSuccessNotification(title, message, duration = 30000) {
  const notificationElement = document.createElement("div");
  notificationElement.style.position = "fixed";
  notificationElement.style.bottom = "20px";
  notificationElement.style.right = "20px";
  notificationElement.style.padding = "20px";
  notificationElement.style.backgroundColor = "#d4edda";
  notificationElement.style.color = "#155724";
  notificationElement.style.borderRadius = "5px";
  notificationElement.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
  notificationElement.style.zIndex = "9999";
  notificationElement.style.maxWidth = "400px";

  notificationElement.innerHTML = `
    <div style="font-weight: bold; font-size: 18px; margin-bottom: 10px;">${title}</div>
    <div style="margin-bottom: 15px;">${message}</div>
    <button style="padding: 8px 15px; background-color: #155724; color: white; border: none; border-radius: 3px; cursor: pointer;">OK</button>
  `;

  document.body.appendChild(notificationElement);

  // OK-Button Funktion
  const closeButton = notificationElement.querySelector("button");
  closeButton.addEventListener("click", function () {
    document.body.removeChild(notificationElement);
  });

  // Nach der angegebenen Zeit automatisch entfernen
  setTimeout(function () {
    if (document.body.contains(notificationElement)) {
      document.body.removeChild(notificationElement);
    }
  }, duration);
}

// Alternative E-Mail-Methode über Formspree
function sendEmailViaFormspree(bookingData, emailData, recipient) {
  console.log(
    "🔄 Versuche E-Mail über alternative Methode (Formspree) zu senden..."
  );

  // Vorbereiten der E-Mail-Daten für Formspree
  const formspreeData = {
    name: bookingData.name,
    email: bookingData.email,
    message: `
      Neue Buchung bei Sheen Beauty Studio
      
      Service: ${bookingData.serviceName}
      Datum: ${emailData.date}
      Uhrzeit: ${bookingData.time}
      Preis: ${bookingData.price}€
      
      Kunde: ${bookingData.name}
      E-Mail: ${bookingData.email}
      Telefon: ${bookingData.phone}
      
      Nachricht: ${bookingData.message || "Keine Nachricht"}
      
      Buchungs-ID: ${emailData.booking_id}
    `,
    _subject: `Neue Buchung: ${bookingData.serviceName} am ${emailData.date}`,
  };

  // Formspree-IDs (Sie müssen diese auf formspree.io erstellen und hier einsetzen)
  const FORMSPREE_SALON_ID = "xdoqlgyv"; // Ersetzen Sie dies mit Ihrer eigenen Formspree-ID für Salon-E-Mails
  const FORMSPREE_KUNDE_ID = "xdoqlgyv"; // Ersetzen Sie dies mit Ihrer eigenen Formspree-ID für Kunden-E-Mails

  // Bestimmen, welche E-Mails gesendet werden sollen
  if (recipient === "kunde" || recipient === "beide") {
    console.log("Sende Kunden-E-Mail über Formspree...");
    fetch(`https://formspree.io/f/${FORMSPREE_KUNDE_ID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...formspreeData,
        email: bookingData.email, // Kunden-E-Mail als Empfänger
        _subject: "Ihre Terminbestätigung bei Sheen Beauty Studio",
      }),
    })
      .then((response) => {
        if (response.ok) {
          console.log("✅ Kunden-E-Mail über Formspree erfolgreich gesendet!");
        } else {
          console.error(
            "❌ Fehler beim Senden der Kunden-E-Mail über Formspree:",
            response.statusText
          );
        }
      })
      .catch((error) => {
        console.error("❌ Fehler bei der Formspree-Anfrage (Kunde):", error);
      });
  }

  if (recipient === "salon" || recipient === "beide") {
    console.log("Sende Salon-E-Mail über Formspree...");
    fetch(`https://formspree.io/f/${FORMSPREE_SALON_ID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...formspreeData,
        email: "kontakt@sheenberlin.de", // Salon-E-Mail als Empfänger
      }),
    })
      .then((response) => {
        if (response.ok) {
          console.log("✅ Salon-E-Mail über Formspree erfolgreich gesendet!");
        } else {
          console.error(
            "❌ Fehler beim Senden der Salon-E-Mail über Formspree:",
            response.statusText
          );
        }
      })
      .catch((error) => {
        console.error("❌ Fehler bei der Formspree-Anfrage (Salon):", error);
      });
  }
}

// Cookie-Funktionen
const setCookie = function (name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
};

const getCookie = function (name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

// Diese Funktion wird in handleFormSubmit aufgerufen
function showTermsModal(serviceType) {
  console.log("Showing terms modal for service:", serviceType);

  // Bestimme die passenden Bedingungen je nach Service
  let termsHTML = "";

  if (
    serviceType === "microblading" ||
    serviceType === "lipblush" ||
    serviceType === "eyeliner"
  ) {
    // PMU-Bedingungen für Microblading, Lipblush und Eyeliner
    termsHTML = serviceTerms.pmu;
  } else if (serviceType === "lash-lifting") {
    // Lash Lifting Bedingungen
    termsHTML = serviceTerms["lash-lifting"];
  } else if (serviceType === "browlifting") {
    // Browlifting Bedingungen
    termsHTML = serviceTerms.browlifting;
  } else if (serviceType === "microneedling") {
    // Microneedling Bedingungen
    termsHTML = serviceTerms.microneedling;
  } else {
    // Fallback für Services ohne spezifische Bedingungen
    termsHTML = `<p>Für diesen Service gibt es keine speziellen Vorbereitungen oder Einschränkungen.</p>
                <p>Bei Fragen kontaktieren Sie uns bitte unter: <strong>kontakt@sheenberlin.de</strong></p>`;
  }

  // Setze den Inhalt des Terms-Modals
  if (termsContent) {
    termsContent.innerHTML = termsHTML;
  }

  // Zurücksetzen der Checkbox
  if (termsCheckbox) {
    termsCheckbox.checked = false;
  }

  // Deaktiviere den Bestätigen-Button
  if (acceptTermsBtn) {
    acceptTermsBtn.disabled = true;
  }

  // Anzeigen des Modals
  if (termsModal) {
    termsModal.style.display = "block";
  }
}

// Hilfsfunktion zur Bestimmung des Typs der Bedingungen für die Datenbank
function getServiceTermsType(serviceType) {
  if (
    serviceType === "microblading" ||
    serviceType === "lipblush" ||
    serviceType === "eyeliner"
  ) {
    return "permanent-makeup";
  } else if (serviceType === "lash-lifting") {
    return "lash-lifting";
  } else if (serviceType === "browlifting") {
    return "brow-lifting";
  } else if (serviceType === "microneedling") {
    return "microneedling";
  } else {
    return "standard";
  }
}

// Hilfsfunktion zur Bestimmung des Bedingungen-Labels für die E-Mail
function getServiceTermsTypeLabel(serviceType) {
  if (
    serviceType === "microblading" ||
    serviceType === "lipblush" ||
    serviceType === "eyeliner"
  ) {
    return "Permanent Make-up Bedingungen";
  } else if (serviceType === "lash-lifting") {
    return "Lash Lifting Bedingungen";
  } else if (serviceType === "browlifting") {
    return "Brow Lifting Bedingungen";
  } else if (serviceType === "microneedling") {
    return "Microneedling Bedingungen";
  } else {
    return "Standardbedingungen";
  }
}

// Verschiebt die Anzeige des Confirmation-Modals in eine separate Funktion
function showConfirmationModal() {
  if (confirmationModal) {
    confirmationModal.style.display = "block";
    console.log("Confirmation modal should be displayed now");
  } else {
    console.error("Confirmation modal not found!");
    // Fallback: Direkt bestätigen, wenn das Modal nicht gefunden wird
    if (confirm("Möchten Sie den Termin verbindlich buchen?")) {
      confirmBooking();
    }
  }
}

// Separater Audit-Trail für die Zustimmung zu den Behandlungsbedingungen
async function saveTermsAcceptanceAudit(bookingData, bookingId) {
  try {
    console.log("Erstelle Audit-Trail für Bedingungszustimmung");

    // Erstelle ein separates Dokument mit allen relevanten Informationen
    const termsAuditData = {
      bookingId: bookingId,
      customerName: bookingData.name,
      customerEmail: bookingData.email,
      customerPhone: bookingData.phone,
      service: bookingData.serviceName,
      termsAccepted: true,
      termsAcceptedAt: new Date().toISOString(),
      termsAcceptedIPAddress: await getClientIP(), // Optional, wenn verfügbar
      termsVersion: "1.0",
      termsType: bookingData.termsType,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      userAgent: navigator.userAgent, // Browser/Gerät-Information speichern
    };

    // In einer separaten Collection speichern für Audit-Zwecke
    await db.collection("termsAcceptances").add(termsAuditData);
    console.log("Audit-Trail für Bedingungszustimmung erstellt");
  } catch (error) {
    console.error("Fehler beim Erstellen des Audit-Trails:", error);
    // Den Buchungsvorgang nicht stoppen, falls dieser Teil fehlschlägt
  }
}

// Hilfsfunktion, um die IP-Adresse des Clients zu ermitteln (optional)
async function getClientIP() {
  try {
    // Verwende einen öffentlichen Service, um die IP zu ermitteln
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error("Fehler beim Ermitteln der IP-Adresse:", error);
    return "unknown";
  }
}
