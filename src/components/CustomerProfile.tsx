"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  auth,
  getCustomerByUID,
  updateCustomerData,
  uploadProfileImage,
  logoutCustomer,
  CustomerData,
  deleteProfileImage,
  deleteCustomerAccount,
} from "@/utils/firebase-config";
import { calculatePriceComponents } from "@/utils/priceUtils";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/utils/firebase-config";
import { updateBookingStatus, canCancelBooking } from "@/utils/bookingService";
import {
  checkLoyaltyDiscountEligibility,
  checkBirthdayDiscountEligibility,
  handleBookingCancellation,
  recalculateTreatmentCount,
  type DiscountInfo,
} from "@/utils/discountService";
import "@/styles/profile.css";

// Schnittstelle für Buchungsdaten
interface BookingData {
  id: string;
  date: string;
  time: string;
  serviceName: string;
  email: string;
  treatments: {
    id: string;
    name: string;
    duration: number;
    price: number;
  }[];
  price: number;
  duration: number;
  status: string;
}

export default function CustomerProfile() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<CustomerData>>({});
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [bookings, setBookings] = useState<{
    past: BookingData[];
    upcoming: BookingData[];
    totalCount: number;
  }>({
    past: [],
    upcoming: [],
    totalCount: 0,
  });
  const [activeTab, setActiveTab] = useState<"profile" | "bookings">("profile");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(
    null
  );
  const [cancelError, setCancelError] = useState<string>("");
  const [loyaltyProgress, setLoyaltyProgress] = useState<any>(null);
  const [birthdayEligibility, setBirthdayEligibility] = useState<any>(null);
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(false);

  // Hilfsfunktion zum Formatieren des Datums
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";

    try {
      // Datum im Format YYYY-MM-DD parsen
      const [year, month, day] = dateStr.split("-");

      // Stelle sicher, dass alle Komponenten vorhanden sind
      if (!year || !month || !day) {
        console.error("Ungültiges Datumsformat:", dateStr);
        return dateStr;
      }

      // Formatiere das Datum direkt aus den String-Komponenten
      return `${day}.${month}.${year}`;
    } catch (error) {
      console.error("Fehler beim Formatieren des Datums:", error);
      return dateStr;
    }
  };

  // Funktion zum Abrufen der Buchungen des Kunden
  const getCustomerBookings = async () => {
    try {
      console.log("=========== BUCHUNGEN ABRUFEN START ===========");

      // Setze das aktuelle Datum auf Mitternacht für genaue Vergleiche
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // Hole den aktuellen Benutzer
      const user = auth.currentUser;
      if (!user) {
        console.error("Kein Benutzer angemeldet");
        return;
      }

      console.log("Suche Buchungen für:", {
        uid: user.uid,
        email: user.email,
      });

      // Erstelle die Abfragen für E-Mail
      const bookingsRef = collection(db, "bookings");
      const emailQuery = query(bookingsRef, where("email", "==", user.email));

      // Führe die Abfrage aus
      const snapshot = await getDocs(emailQuery);
      console.log(
        `Gefunden: ${snapshot.size} Buchungen für E-Mail ${user.email}`
      );

      // Verarbeite die Ergebnisse
      const uniqueBookings = new Map();

      snapshot.forEach((doc) => {
        const bookingData = { id: doc.id, ...doc.data() } as BookingData;

        // DEBUG: Zeige auch stornierte Buchungen, damit wir das System testen können
        // if (bookingData.status === "cancelled") {
        //   return;
        // }

        // Verwende die Buchungs-ID als Schlüssel
        const key = doc.id;

        if (!uniqueBookings.has(key)) {
          // Das Datum direkt aus der Datenbank verwenden, ohne Umwandlung
          uniqueBookings.set(key, bookingData);
          console.log("Neue Buchung gefunden:", {
            id: doc.id,
            date: bookingData.date,
            time: bookingData.time,
            service: bookingData.serviceName,
            email: bookingData.email,
            status: bookingData.status,
          });
        }
      });

      console.log(
        `Insgesamt ${uniqueBookings.size} eindeutige Buchungen gefunden`
      );

      // Sortiere die Buchungen in vergangene und zukünftige
      const pastBookings: BookingData[] = [];
      const upcomingBookings: BookingData[] = [];

      uniqueBookings.forEach((booking) => {
        // Datum direkt vergleichen ohne Zeitzonenkonvertierung
        const [year, month, day] = booking.date.split("-").map(Number);
        const bookingDate = new Date(year, month - 1, day, 12, 0, 0); // Setze auf 12 Uhr mittags um Zeitzonenprobleme zu vermeiden
        const today = new Date();
        today.setHours(12, 0, 0, 0);

        if (bookingDate < today) {
          pastBookings.push(booking);
          console.log("Vergangene Buchung:", booking.date, booking.serviceName);
        } else {
          upcomingBookings.push(booking);
          console.log("Zukünftige Buchung:", booking.date, booking.serviceName);
        }
      });

      // Sortiere die Buchungen nach Datum
      pastBookings.sort((a, b) => {
        const [yearA, monthA, dayA] = a.date.split("-").map(Number);
        const [yearB, monthB, dayB] = b.date.split("-").map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA, 12, 0, 0);
        const dateB = new Date(yearB, monthB - 1, dayB, 12, 0, 0);
        return dateB.getTime() - dateA.getTime();
      });

      upcomingBookings.sort((a, b) => {
        const [yearA, monthA, dayA] = a.date.split("-").map(Number);
        const [yearB, monthB, dayB] = b.date.split("-").map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA, 12, 0, 0);
        const dateB = new Date(yearB, monthB - 1, dayB, 12, 0, 0);
        return dateA.getTime() - dateB.getTime();
      });

      console.log(
        `Gefunden: ${pastBookings.length} vergangene und ${upcomingBookings.length} zukünftige Buchungen`
      );

      setBookings({
        past: pastBookings,
        upcoming: upcomingBookings,
        totalCount: uniqueBookings.size,
      });

      // Rabattdaten nach dem Laden der Buchungen aktualisieren
      if (currentUser) {
        await loadDiscountProgress();
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Fehler beim Abrufen der Buchungen:", error);
      setIsLoading(false);
    }
  };

  // Rabatt-Fortschritt für angemeldeten Benutzer laden
  const loadDiscountProgress = async () => {
    if (!currentUser) return;

    try {
      setIsLoadingDiscounts(true);

      // Treuerabatt-Fortschritt laden
      const loyaltyCheck = await checkLoyaltyDiscountEligibility(
        currentUser.uid
      );
      setLoyaltyProgress(loyaltyCheck);

      // Geburtstagsrabatt prüfen (falls Kundendaten vorhanden)
      if (customerData?.birthdate) {
        const birthdayCheck = await checkBirthdayDiscountEligibility(
          currentUser.uid
        );
        setBirthdayEligibility(birthdayCheck);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Rabattdaten:", error);
    } finally {
      setIsLoadingDiscounts(false);
    }
  };

  // Benutzer-Authentifizierungsstatus überwachen
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          // Kundendaten aus Firestore abrufen
          const data = await getCustomerByUID(user.uid);
          setCustomerData(data);

          // Buchungsdaten laden
          await getCustomerBookings();

          // Rabattdaten laden
          await loadDiscountProgress();
        } catch (error) {
          console.error("Fehler beim Laden der Benutzerdaten:", error);
          setError(
            "Fehler beim Laden Ihrer Daten. Bitte versuchen Sie es später erneut."
          );
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        router.push("/login"); // Umleitung zur Login-Seite, wenn kein Benutzer angemeldet ist
      }
    });

    // Aufräumen beim Unmounten
    return () => unsubscribe();
  }, [router]);

  // Rabattdaten neu laden wenn sich Kundendaten ändern
  useEffect(() => {
    if (currentUser && customerData) {
      loadDiscountProgress();
    }
  }, [currentUser, customerData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Validierungsregeln
    if (name === "firstName" || name === "lastName") {
      // Nur Buchstaben erlauben (inkl. Umlaute und Bindestrich/Leerzeichen für Doppelnamen)
      if (!/^[a-zA-ZäöüÄÖÜß\s\-]*$/.test(value)) {
        setValidationErrors((prev) => ({
          ...prev,
          [name]: "Bitte nur Buchstaben eingeben",
        }));
      } else {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }

    if (name === "phone") {
      // Nur Zahlen, Plus am Anfang und Leerzeichen für Formatierung erlauben
      if (!/^[0-9\+\s]*$/.test(value)) {
        setValidationErrors((prev) => ({
          ...prev,
          [name]: "Bitte nur Zahlen eingeben",
        }));
      } else {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }

    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);

      // Vorschau erstellen
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === "string") {
          setProfileImagePreview(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteProfileImage = async () => {
    if (!currentUser) return;

    setError(null);
    setSuccess(null);

    try {
      // Profilbild aus Firebase löschen
      const deleteResult = await deleteProfileImage(currentUser.uid);

      if (!deleteResult.success) {
        setError(deleteResult.error || "Fehler beim Löschen des Profilbilds.");
        return;
      }

      // Lokale Zustände zurücksetzen
      setProfileImage(null);
      setProfileImagePreview(null);

      // Kundendaten aktualisieren
      const updatedData = await getCustomerByUID(currentUser.uid);
      setCustomerData(updatedData);

      setSuccess("Profilbild erfolgreich gelöscht!");
    } catch (err) {
      setError(
        "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut."
      );
      console.error("Fehler beim Löschen des Profilbilds:", err);
    }
  };

  const handleEdit = () => {
    if (customerData) {
      setEditData({
        firstName: customerData.firstName || "",
        lastName: customerData.lastName || "",
        email: customerData.email || "",
        phone: customerData.phone || "",
        birthdate: customerData.birthdate || "",
      });
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    // Zurücksetzen der Bearbeitungsdaten auf die aktuellen Kundendaten
    if (customerData) {
      setEditData({
        firstName: customerData.firstName || "",
        lastName: customerData.lastName || "",
        email: customerData.email || "",
        phone: customerData.phone || "",
        birthdate: customerData.birthdate || "",
      });

      // Profilbild-Vorschau zurücksetzen
      setProfileImagePreview(customerData.profileImageUrl || null);
      setProfileImage(null);
    }

    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!currentUser) return;

    setError(null);
    setSuccess(null);

    // Prüfen, ob Validierungsfehler vorliegen
    if (Object.keys(validationErrors).length > 0) {
      setError("Bitte korrigieren Sie die Eingabefehler, bevor Sie speichern.");
      return;
    }

    try {
      // Daten nur aktualisieren, wenn es tatsächlich Änderungen gibt
      if (Object.keys(editData).length > 0) {
        console.log("Aktualisiere Kundendaten:", editData);
        const updateResult = await updateCustomerData(
          currentUser.uid,
          editData
        );

        if (!updateResult.success) {
          setError(
            updateResult.error || "Fehler beim Aktualisieren der Daten."
          );
          return;
        }
      }

      // Wenn ein neues Profilbild ausgewählt wurde, hochladen
      if (profileImage) {
        console.log("Lade Profilbild hoch");
        const uploadResult = await uploadProfileImage(
          currentUser.uid,
          profileImage
        );

        if (!uploadResult.success) {
          setError(
            "Daten wurden aktualisiert, aber das Profilbild konnte nicht hochgeladen werden."
          );
          return;
        }

        // Aktualisiere die Vorschau mit der neuen URL
        setProfileImagePreview(uploadResult.url || null);
      }

      // Daten neu laden
      console.log("Lade aktualisierte Kundendaten");
      const updatedData = await getCustomerByUID(currentUser.uid);
      setCustomerData(updatedData);

      setSuccess("Profil erfolgreich aktualisiert!");
      setIsEditing(false);
    } catch (err) {
      console.error("Fehler beim Aktualisieren des Profils:", err);
      setError(
        "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut."
      );
    }
  };

  const handleLogout = async () => {
    try {
      await logoutCustomer();
      router.push("/");
    } catch (err) {
      console.error("Fehler beim Abmelden:", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;

    setError(null);
    setSuccess(null);

    if (showDeleteConfirm) {
      try {
        const result = await deleteCustomerAccount(currentUser.uid);

        if (!result.success) {
          setError(result.error || "Fehler beim Löschen des Kontos.");
          return;
        }

        router.push("/");
      } catch (err) {
        setError(
          "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut."
        );
        console.error("Fehler beim Löschen des Kontos:", err);
      } finally {
        setShowDeleteConfirm(false);
      }
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Funktion zum Stornieren einer Buchung
  const handleCancelBooking = async (booking: BookingData) => {
    // Zuerst prüfen, ob die Stornierung zeitlich möglich ist
    if (!canCancelBooking(booking.date, booking.time)) {
      setSelectedBooking(booking);
      setCancelError(
        "Buchungen können nur bis 24 Stunden vor dem Termin storniert werden."
      );
      setShowCancelModal(true);
      return;
    }

    // Wenn die Stornierung möglich ist, zeige das Bestätigungsmodal
    setSelectedBooking(booking);
    setCancelError("");
    setShowCancelModal(true);
  };

  // Funktion für die tatsächliche Stornierung
  const confirmCancelBooking = async () => {
    if (!selectedBooking) return;

    try {
      const wasAlreadyCancelled = selectedBooking.status === "cancelled";

      const success = await updateBookingStatus(
        selectedBooking.id!,
        "cancelled"
      );
      if (success) {
        // 🔻 ZÄHLER NUR REDUZIEREN wenn Buchung vorher NICHT storniert war
        if (!wasAlreadyCancelled) {
          try {
            console.log(
              "🔻 Reduziere Behandlungszähler für neu stornierte Buchung:",
              selectedBooking.id
            );
            await handleBookingCancellation(selectedBooking.id!);
            console.log("✅ Behandlungszähler erfolgreich reduziert");
          } catch (countError) {
            console.error("❌ Fehler beim Reduzieren des Zählers:", countError);
            // Stornierung war erfolgreich, Zähler-Fehler nicht kritisch
          }
        } else {
          // TEST: Für bereits stornierte Buchungen trotzdem den Test durchführen
          try {
            console.log(
              "🧪 TEST: Behandlungszähler-Reduktion für bereits stornierte Buchung:",
              selectedBooking.id
            );
            await handleBookingCancellation(selectedBooking.id!);
            console.log("✅ TEST: Behandlungszähler-Reduktion getestet");
          } catch (countError) {
            console.error(
              "❌ TEST: Fehler beim Testen der Zähler-Reduktion:",
              countError
            );
          }
        }

        // 🔄 NEUBERECHNUNG: Zähler komplett neu basierend auf tatsächlichen Buchungen
        if (currentUser?.uid) {
          try {
            console.log("🔄 Starte Neuberechnung nach Stornierung...");
            await recalculateTreatmentCount(currentUser.uid);
            console.log("✅ Neuberechnung abgeschlossen");
          } catch (recalcError) {
            console.error("❌ Fehler bei der Neuberechnung:", recalcError);
          }
        }

        // Buchungen neu laden
        await getCustomerBookings();
        // Loyalty-Fortschritt neu laden
        if (currentUser?.uid) {
          try {
            const loyaltyCheck = await checkLoyaltyDiscountEligibility(
              currentUser.uid
            );
            setLoyaltyProgress(loyaltyCheck);
          } catch (error) {
            console.error(
              "Fehler beim Neuladen des Loyalty-Fortschritts:",
              error
            );
          }
        }

        setShowCancelModal(false);
        setSelectedBooking(null);
        setCancelError("");
      } else {
        setCancelError(
          "Die Buchung konnte nicht storniert werden. Bitte versuchen Sie es später erneut."
        );
      }
    } catch (error) {
      console.error("Fehler beim Stornieren der Buchung:", error);
      setCancelError(
        "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut."
      );
    }
  };

  // Modal für Stornierungshinweise
  const renderCancelModal = () => {
    if (!showCancelModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h3 className="text-xl font-semibold mb-4 text-red-600">
            {cancelError ? "Stornierung nicht möglich" : "Buchung stornieren"}
          </h3>

          <p className="text-gray-600 mb-6">
            {cancelError ||
              "Möchten Sie diese Buchung wirklich stornieren? Diese Aktion kann nicht rückgängig gemacht werden."}
          </p>

          <div className="flex justify-end gap-4">
            <button
              onClick={() => {
                setShowCancelModal(false);
                setSelectedBooking(null);
                setCancelError("");
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              {cancelError ? "Schließen" : "Abbrechen"}
            </button>

            {!cancelError && selectedBooking && (
              <button
                onClick={confirmCancelBooking}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Ja, stornieren
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Renderfunktion für Buchungen
  const renderBookingItem = (booking: BookingData, isPast: boolean) => {
    // Berechne die Preiskomponenten für die Buchung
    const priceComponents = calculatePriceComponents(booking.price);

    return (
      <div className="booking-item p-6 bg-white rounded-lg shadow-sm mb-4">
        <div className="booking-card-header">
          <div className="booking-date-time">
            <div className="booking-date flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-[#b2d8db]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {formatDate(booking.date)}
            </div>
            <div className="booking-time flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              {booking.time} Uhr
            </div>
          </div>
          <div className="booking-status">
            <span
              className={`status-badge ${
                booking.status === "confirmed"
                  ? "status-confirmed"
                  : booking.status === "cancelled"
                    ? "status-cancelled"
                    : "status-pending"
              }`}
            >
              {booking.status === "confirmed"
                ? "Bestätigt"
                : booking.status === "cancelled"
                  ? "Storniert"
                  : "Ausstehend"}
            </span>
          </div>
        </div>
        <div className="booking-details">
          <div className="booking-treatments">
            {booking.treatments && booking.treatments.length > 0 ? (
              <>
                <h4 className="booking-service-title flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-[#b2d8db]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                    <line x1="16" y1="8" x2="2" y2="22"></line>
                    <line x1="17.5" y1="15" x2="9" y2="15"></line>
                  </svg>
                  Behandlung:
                </h4>
                <ul className="booking-treatments-list">
                  {booking.treatments.map((treatment, index) => (
                    <li
                      key={`${booking.id}-${treatment.id}-${index}`}
                      className="booking-treatment-item"
                    >
                      <span className="treatment-name">{treatment.name}</span>
                      <span className="treatment-duration flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3 text-gray-600"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        {treatment.duration} Min.
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <h4 className="booking-service-title flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-[#b2d8db]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                    <line x1="16" y1="8" x2="2" y2="22"></line>
                    <line x1="17.5" y1="15" x2="9" y2="15"></line>
                  </svg>
                  Behandlung:
                </h4>
                <div className="booking-service-name">
                  {booking.serviceName}
                </div>
              </>
            )}
          </div>
          <div className="booking-price-duration">
            <div className="booking-price flex flex-col">
              <div className="flex items-center gap-1 text-[#28a745] font-semibold">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                {priceComponents.grossFormatted}
              </div>
              <div className="price-details text-xs text-gray-500 mt-1">
                <div>Netto: {priceComponents.netFormatted}</div>
                <div>MwSt (19%): {priceComponents.vatFormatted}</div>
              </div>
            </div>
            <div className="booking-duration flex items-center gap-1 text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              {booking.duration} Min.
            </div>
          </div>
        </div>

        {/* DEBUG: Zeige Button auch für stornierte Buchungen zum Testen */}
        <div className="booking-actions">
          {booking.status === "cancelled" ? (
            <div className="flex items-center gap-2">
              <span className="text-red-500 text-sm font-medium">
                ✅ BEREITS STORNIERT
              </span>
              <button
                onClick={() => handleCancelBooking(booking)}
                className="btn-cancel-booking flex items-center gap-1 opacity-60"
                title="TEST: Zähler-Reduktion bei bereits stornierten Buchungen"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                TEST: Zähler reduzieren
              </button>
            </div>
          ) : !isPast ? (
            <button
              onClick={() => handleCancelBooking(booking)}
              className="btn-cancel-booking flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              Termin stornieren
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="w-24 h-24 relative">
          <svg
            className="animate-spin w-full h-full text-b2d8db"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="#b2d8db"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="#b2d8db"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
        <p className="mt-8 text-2xl text-gray-600 font-medium">
          Daten werden geladen...
        </p>
      </div>
    );
  }

  if (!currentUser || !customerData) {
    return (
      <div className="profile-card">
        <div className="profile-content text-center py-12 px-6 md:px-12">
          <div className="mb-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-28 w-28 text-[#b2d8db]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Sie sind nicht angemeldet
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Bitte melden Sie sich an, um Ihr Profil zu sehen.
          </p>
          <button onClick={() => router.push("/login")} className="btn--form">
            Zur Anmeldung
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-card relative">
      {error && (
        <div className="form-feedback error">
          <strong>Fehler:</strong> {error}
        </div>
      )}

      {success && (
        <div className="form-feedback success">
          <strong>Erfolg!</strong> {success}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="delete-warning">
          <h3 className="delete-warning-title">Warnung: Konto löschen?</h3>
          <p className="delete-warning-text">
            Wenn Sie Ihr Konto löschen, gehen alle Ihre persönlichen Daten
            unwiderruflich verloren.
          </p>
          <div className="delete-warning-buttons">
            <button onClick={handleDeleteAccount} className="btn--danger">
              Konto endgültig löschen
            </button>
            <button onClick={handleCancelDelete} className="btn--cancel">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Tabs für Navigation zwischen Profil und Buchungen */}
      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Mein Profil
        </button>
        <button
          className={`profile-tab ${activeTab === "bookings" ? "active" : ""}`}
          onClick={() => setActiveTab("bookings")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Meine Buchungen
          {bookings.totalCount > 0 && (
            <span className="booking-count">{bookings.totalCount}</span>
          )}
        </button>
      </div>

      {activeTab === "profile" ? (
        // Profilinhaltsbereich mit modernerem Design
        <div className="profile-content bg-white rounded-b-lg">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Profilbild-Bereich */}
            <div className="profile-image-container">
              <div className="profile-image relative rounded-full overflow-hidden shadow-md border-4 border-[#e8f3f4]">
                {profileImagePreview ? (
                  <Image
                    src={profileImagePreview}
                    alt="Profilbild"
                    fill
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div className="w-full h-full bg-[#e8f3f4] flex items-center justify-center rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-24 w-24 md:h-32 md:w-32 text-[#b2d8db]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="w-full mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn--edit w-full"
                  >
                    Profilbild ändern
                  </button>
                  {profileImagePreview && (
                    <button
                      type="button"
                      onClick={handleDeleteProfileImage}
                      className="btn--logout w-full"
                    >
                      Profilbild entfernen
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                </div>
              )}

              <div className="text-center mt-6 mb-4">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  {customerData?.firstName} {customerData?.lastName}
                </h2>
                <p className="text-base text-gray-600 flex items-center justify-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[#b2d8db]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  {customerData?.email}
                </p>
              </div>

              <div className="w-full mt-8">
                <button onClick={handleLogout} className="btn--logout w-full">
                  Abmelden
                </button>

                <button
                  onClick={handleDeleteAccount}
                  className="btn--delete w-full mt-4"
                >
                  Konto löschen
                </button>
              </div>
            </div>

            {/* Profildaten-Bereich */}
            <div className="profile-details bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="profile-details-title">Persönliche Daten</h3>

              <div className="profile-details-content">
                {isEditing ? (
                  <>
                    <div className="profile-details-grid">
                      <div className="profile-detail-item">
                        <label
                          htmlFor="firstName"
                          className="block text-base md:text-lg font-medium text-gray-700 mb-2"
                        >
                          Vorname
                        </label>
                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          value={editData.firstName || ""}
                          onChange={handleChange}
                          className={`login-input ${validationErrors.firstName ? "border-red-500" : ""}`}
                        />
                        {validationErrors.firstName && (
                          <p className="text-red-500 text-sm mt-1">
                            {validationErrors.firstName}
                          </p>
                        )}
                      </div>

                      <div className="profile-detail-item">
                        <label
                          htmlFor="lastName"
                          className="block text-base md:text-lg font-medium text-gray-700 mb-2"
                        >
                          Nachname
                        </label>
                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          value={editData.lastName || ""}
                          onChange={handleChange}
                          className={`login-input ${validationErrors.lastName ? "border-red-500" : ""}`}
                        />
                        {validationErrors.lastName && (
                          <p className="text-red-500 text-sm mt-1">
                            {validationErrors.lastName}
                          </p>
                        )}
                      </div>

                      <div className="profile-detail-item">
                        <label
                          htmlFor="phone"
                          className="block text-base md:text-lg font-medium text-gray-700 mb-2"
                        >
                          Telefonnummer
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={editData.phone || ""}
                          onChange={handleChange}
                          className={`login-input ${validationErrors.phone ? "border-red-500" : ""}`}
                        />
                        {validationErrors.phone && (
                          <p className="text-red-500 text-sm mt-1">
                            {validationErrors.phone}
                          </p>
                        )}
                      </div>

                      <div className="profile-detail-item">
                        <label
                          htmlFor="birthdate"
                          className="block text-base md:text-lg font-medium text-gray-700 mb-2"
                        >
                          Geburtsdatum
                        </label>
                        <input
                          id="birthdate"
                          name="birthdate"
                          type="date"
                          value={editData.birthdate || ""}
                          onChange={handleChange}
                          className="login-input"
                        />
                      </div>
                    </div>

                    <div className="profile-actions">
                      <button
                        onClick={handleSave}
                        className="btn--edit"
                        disabled={Object.keys(validationErrors).length > 0}
                        style={{
                          opacity:
                            Object.keys(validationErrors).length > 0 ? 0.7 : 1,
                          cursor:
                            Object.keys(validationErrors).length > 0
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        Profil speichern
                      </button>

                      <button onClick={handleCancel} className="btn--logout">
                        Abbrechen
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="profile-details-grid">
                      <div className="profile-detail-item bg-[#f8f9fa] p-4 rounded-lg">
                        <h4 className="flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-[#b2d8db]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          Vorname
                        </h4>
                        <p>{customerData?.firstName}</p>
                      </div>

                      <div className="profile-detail-item bg-[#f8f9fa] p-4 rounded-lg">
                        <h4 className="flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-[#b2d8db]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          Nachname
                        </h4>
                        <p>{customerData?.lastName}</p>
                      </div>

                      <div className="profile-detail-item bg-[#f8f9fa] p-4 rounded-lg">
                        <h4 className="flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-[#b2d8db]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                          Telefonnummer
                        </h4>
                        <p>{customerData?.phone || "Nicht angegeben"}</p>
                      </div>

                      <div className="profile-detail-item bg-[#f8f9fa] p-4 rounded-lg">
                        <h4 className="flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-[#b2d8db]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              x="3"
                              y="4"
                              width="18"
                              height="18"
                              rx="2"
                              ry="2"
                            ></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          Geburtsdatum
                        </h4>
                        <p>
                          {customerData?.birthdate
                            ? new Date(
                                customerData.birthdate
                              ).toLocaleDateString("de-DE")
                            : "Nicht angegeben"}
                        </p>
                      </div>

                      <div className="profile-detail-item bg-[#f8f9fa] p-4 rounded-lg">
                        <h4 className="flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-[#b2d8db]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                          </svg>
                          E-Mail
                        </h4>
                        <p>{customerData?.email}</p>
                      </div>
                    </div>

                    <div className="profile-actions mt-6">
                      <button
                        onClick={handleEdit}
                        className="btn--edit flex items-center gap-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Profil bearbeiten
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Buchungen anzeigen
        <div className="bookings-content bg-white rounded-b-lg">
          {/* Treuerabatt-Fortschritt */}
          <div className="loyalty-progress-section">
            <div className="loyalty-progress-card">
              <div className="loyalty-header">
                <div className="loyalty-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <div className="loyalty-title">
                  <h3>⭐ Treuerabatt-Fortschritt</h3>
                  <p>Sammeln Sie Behandlungen für 20% Rabatt</p>
                </div>
              </div>

              {isLoadingDiscounts ? (
                <div className="loyalty-loading">
                  <div className="spinner"></div>
                  <p>Lade Rabattdaten...</p>
                </div>
              ) : loyaltyProgress ? (
                <>
                  {loyaltyProgress.isEligible ? (
                    <div className="loyalty-eligible">
                      <div className="celebration-badge">🎉</div>
                      <h4>Herzlichen Glückwunsch!</h4>
                      <p>
                        Sie sind berechtigt für <strong>20% Treuerabatt</strong>{" "}
                        bei Ihrer nächsten Buchung!
                      </p>
                    </div>
                  ) : loyaltyProgress.lastDiscountDate ? (
                    // Kunde hat kürzlich einen Rabatt verwendet
                    <div className="loyalty-reset">
                      <div className="reset-info">
                        <div className="reset-icon">✅</div>
                        <div className="reset-content">
                          <h4>Treuerabatt verwendet!</h4>
                          <p className="reset-description">
                            Sie haben am{" "}
                            <strong>
                              {new Date(
                                loyaltyProgress.lastDiscountDate
                              ).toLocaleDateString("de-DE")}
                            </strong>{" "}
                            Ihren 20% Treuerabatt eingelöst.
                          </p>
                          <p className="reset-restart">
                            🔄 Die Zählung für Ihren nächsten Treuerabatt hat
                            neu begonnen!
                          </p>
                        </div>
                      </div>

                      <div className="progress-section">
                        <div className="progress-info">
                          <span className="progress-numbers">
                            {loyaltyProgress.progress.current} /{" "}
                            {loyaltyProgress.progress.required} Behandlungen
                          </span>
                          <span className="progress-text">
                            für den nächsten Treuerabatt
                          </span>
                        </div>

                        <div className="progress-bar-container">
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${(loyaltyProgress.progress.current / loyaltyProgress.progress.required) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        <div className="progress-remaining">
                          <span className="remaining-count">
                            Noch {loyaltyProgress.progress.remaining}{" "}
                            Behandlungen
                          </span>
                          <span className="remaining-text">
                            bis zu Ihrem nächsten 20% Rabatt!
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Erster Treuerabatt-Fortschritt (noch nie einen Rabatt verwendet)
                    <div className="loyalty-progress">
                      <div className="progress-info">
                        <span className="progress-numbers">
                          {loyaltyProgress.progress.current} /{" "}
                          {loyaltyProgress.progress.required} Behandlungen
                        </span>
                        <span className="progress-text">
                          in den letzten 6 Monaten
                        </span>
                      </div>

                      <div className="progress-bar-container">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${(loyaltyProgress.progress.current / loyaltyProgress.progress.required) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="progress-remaining">
                        <span className="remaining-count">
                          Noch {loyaltyProgress.progress.remaining} Behandlungen
                        </span>
                        <span className="remaining-text">
                          bis zu 20% Rabatt!
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="loyalty-error">
                  <p>Rabattdaten konnten nicht geladen werden.</p>
                </div>
              )}

              {/* Geburtstagsrabatt-Info falls aktiv */}
              {birthdayEligibility?.isEligible && (
                <div className="birthday-bonus">
                  <div className="birthday-icon">🎂</div>
                  <div className="birthday-text">
                    <h4>Happy Birthday!</h4>
                    <p>
                      Sie erhalten diese Woche{" "}
                      <strong>10% Geburtstagsrabatt</strong> auf alle Buchungen!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Kommende Termine */}
          <div className="bookings-section">
            <h3 className="bookings-section-title flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-[#b2d8db]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Kommende Termine
            </h3>

            {bookings.upcoming.length > 0 ? (
              <div className="bookings-list">
                {bookings.upcoming.map((booking) =>
                  renderBookingItem(booking, false)
                )}
              </div>
            ) : (
              <div className="no-bookings">
                <p>Sie haben keine kommenden Termine.</p>
                <Link href="/booking" className="btn-book-new">
                  Neuen Termin buchen
                </Link>
              </div>
            )}
          </div>

          {/* Vergangene Termine */}
          <div className="bookings-section">
            <h3 className="bookings-section-title flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-[#b2d8db]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              Vergangene Termine
            </h3>

            {bookings.past.length > 0 ? (
              <div className="bookings-list">
                {bookings.past.map((booking) =>
                  renderBookingItem(booking, true)
                )}
              </div>
            ) : (
              <div className="no-bookings">
                <p>Sie haben noch keine vergangenen Termine.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Render cancel modal */}
      {renderCancelModal()}
    </div>
  );
}
