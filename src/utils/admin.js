document.addEventListener("DOMContentLoaded", function () {
  // DOM-Elemente
  const loginForm = document.getElementById("login-form");
  const loginContainer = document.getElementById("login-container");
  const adminDashboard = document.getElementById("admin-dashboard");
  const bookingsList = document.getElementById("bookings-list");
  const logoutBtn = document.getElementById("logout-btn");
  const dateFilter = document.getElementById("date-filter");
  const statusFilter = document.getElementById("status-filter");
  const clearFiltersBtn = document.getElementById("clear-filters");

  // Authentifizierungsstatus überwachen
  auth.onAuthStateChanged(function (user) {
    if (user) {
      // Benutzer ist eingeloggt
      loginContainer.classList.add("hidden");
      adminDashboard.classList.remove("hidden");
      loadBookings();
    } else {
      // Benutzer ist nicht eingeloggt
      loginContainer.classList.remove("hidden");
      adminDashboard.classList.add("hidden");
    }
  });

  // Login-Formular
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const email = document.getElementById("admin-email").value;
      const password = document.getElementById("admin-password").value;

      auth
        .signInWithEmailAndPassword(email, password)
        .then(function (userCredential) {
          console.log("Erfolgreich eingeloggt");
        })
        .catch(function (error) {
          console.error("Login fehlgeschlagen:", error);
          alert("Login fehlgeschlagen: " + error.message);
        });
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      auth
        .signOut()
        .then(function () {
          console.log("Erfolgreich abgemeldet");
        })
        .catch(function (error) {
          console.error("Abmeldung fehlgeschlagen:", error);
        });
    });
  }

  // Filter-Funktionen
  if (dateFilter) {
    dateFilter.addEventListener("change", loadBookings);
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", loadBookings);
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", function () {
      dateFilter.value = "";
      statusFilter.value = "all";
      loadBookings();
    });
  }

  // Buchungen laden
  function loadBookings() {
    if (!bookingsList) return;

    bookingsList.innerHTML =
      '<tr><td colspan="7">Buchungen werden geladen...</td></tr>';

    // Firestore-Abfrage erstellen
    let query = db.collection("bookings");

    // Filter anwenden
    if (dateFilter && dateFilter.value) {
      query = query.where("date", "==", dateFilter.value);
    }

    if (statusFilter && statusFilter.value !== "all") {
      query = query.where("status", "==", statusFilter.value);
    }

    // Nach Datum und Zeit sortieren
    query = query.orderBy("date", "asc").orderBy("time", "asc");

    // Abfrage ausführen
    query
      .get()
      .then(function (querySnapshot) {
        if (querySnapshot.empty) {
          bookingsList.innerHTML =
            '<tr><td colspan="7">Keine Buchungen gefunden</td></tr>';
          return;
        }

        bookingsList.innerHTML = "";

        querySnapshot.forEach(function (doc) {
          const booking = doc.data();
          const bookingId = doc.id;

          // Datum formatieren
          const formattedDate = formatDate(booking.date);

          // Zeile erstellen
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${booking.time}</td>
            <td>${formatServiceName(booking.service)}</td>
            <td>${booking.name}</td>
            <td>
              <a href="mailto:${booking.email}">${booking.email}</a>
              ${
                booking.phone
                  ? `<br><a href="tel:${booking.phone}">${booking.phone}</a>`
                  : ""
              }
            </td>
            <td>
              <select class="status-select" data-id="${bookingId}">
                <option value="pending" ${
                  booking.status === "pending" ? "selected" : ""
                }>Ausstehend</option>
                <option value="confirmed" ${
                  booking.status === "confirmed" ? "selected" : ""
                }>Bestätigt</option>
                <option value="cancelled" ${
                  booking.status === "cancelled" ? "selected" : ""
                }>Storniert</option>
              </select>
            </td>
            <td>
              <button class="btn-delete" data-id="${bookingId}">Löschen</button>
            </td>
          `;

          bookingsList.appendChild(row);
        });

        // Event-Listener für Status-Änderungen hinzufügen
        const statusSelects = document.querySelectorAll(".status-select");
        statusSelects.forEach(function (select) {
          select.addEventListener("change", function () {
            const bookingId = this.getAttribute("data-id");
            const newStatus = this.value;

            updateBookingStatus(bookingId, newStatus);
          });
        });

        // Event-Listener für Löschen-Buttons hinzufügen
        const deleteButtons = document.querySelectorAll(".btn-delete");
        deleteButtons.forEach(function (button) {
          button.addEventListener("click", function () {
            const bookingId = this.getAttribute("data-id");

            if (confirm("Möchtest du diese Buchung wirklich löschen?")) {
              deleteBooking(bookingId);
            }
          });
        });
      })
      .catch(function (error) {
        console.error("Fehler beim Laden der Buchungen:", error);
        bookingsList.innerHTML =
          '<tr><td colspan="7">Fehler beim Laden der Buchungen</td></tr>';
      });
  }

  // Buchungsstatus aktualisieren
  function updateBookingStatus(bookingId, newStatus) {
    db.collection("bookings")
      .doc(bookingId)
      .update({
        status: newStatus,
      })
      .then(function () {
        console.log("Buchungsstatus aktualisiert");
      })
      .catch(function (error) {
        console.error("Fehler beim Aktualisieren des Status:", error);
        alert("Fehler beim Aktualisieren des Status: " + error.message);
      });
  }

  // Buchung löschen
  function deleteBooking(bookingId) {
    db.collection("bookings")
      .doc(bookingId)
      .delete()
      .then(function () {
        console.log("Buchung gelöscht");
        loadBookings(); // Liste aktualisieren
      })
      .catch(function (error) {
        console.error("Fehler beim Löschen der Buchung:", error);
        alert("Fehler beim Löschen der Buchung: " + error.message);
      });
  }

  // Hilfsfunktionen
  function formatDate(dateString) {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", options);
  }

  function formatServiceName(serviceId) {
    const serviceNames = {
      browlifting: "Browlifting",
      "brow-design": "Brow Design",
      "lash-lifting": "Lash Lifting",
      lipblush: "LipBlush",
      microblading: "Microblading",
      eyeliner: "Eyeliner",
      microneedling: "Microneedling",
    };

    return serviceNames[serviceId] || serviceId;
  }
});
