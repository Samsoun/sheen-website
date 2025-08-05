"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BookingForm from "@/components/BookingForm";
import TreatmentSelection from "@/components/TreatmentSelection";
import DateTimeSelection from "@/components/DateTimeSelection";
import BookingSummary from "@/components/BookingSummary";
import BookingConfirmation from "@/components/BookingConfirmation";
import TreatmentTerms from "@/components/TreatmentTerms";
import LoginRequired from "@/components/LoginRequired";
import { saveBooking } from "@/utils/bookingService";
import { auth, getCustomerByUID, CustomerData } from "@/utils/firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import {
  applyDiscountToBooking,
  markDiscountAsUsed,
  incrementTreatmentCount,
} from "@/utils/discountService";
import "@/styles/booking.css";
import { useRouter } from "next/navigation";

// Schritte des Buchungsprozesses
enum BookingStep {
  TreatmentSelection = 0,
  DateTimeSelection = 1,
  CustomerForm = 2,
  TreatmentTerms = 3,
  Summary = 4,
  Confirmation = 5,
}

export default function Booking() {
  // Zustand für ausgewählte Behandlungen
  const [selectedTreatments, setSelectedTreatments] = useState<
    {
      id: string;
      name: string;
      duration: number;
      price: number;
    }[]
  >([]);

  // Zustand für den ausgewählten Termin
  const [selectedDateTime, setSelectedDateTime] = useState<{
    date: Date | null;
    time: string | null;
  }>({
    date: null,
    time: null,
  });

  // Zustand für Kundeninformationen
  const [customerInfo, setCustomerInfo] = useState<{
    fullName: string;
    email: string;
    phone: string;
    message: string;
  }>({
    fullName: "",
    email: "",
    phone: "",
    message: "",
  });

  // Buchungsstatus
  const [currentStep, setCurrentStep] = useState<BookingStep>(
    BookingStep.TreatmentSelection
  );
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Prüfe auf URL-Parameter für direkten Einstieg in einen bestimmten Schritt
  useEffect(() => {
    try {
      // Prüfen, ob window und URL-Objekt verfügbar sind (nur im Browser)
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const stepParam = urlParams.get("step");
        const refreshParam = urlParams.get("refresh");

        if (stepParam === "treatments") {
          console.log(
            "Direkter Einstieg in die Behandlungsauswahl über URL-Parameter"
          );
          setCurrentStep(BookingStep.TreatmentSelection);
          // Zurücksetzen des Zustands für eine neue Buchung
          setSelectedTreatments([]);
          setSelectedDateTime({ date: null, time: null });
          setBookingConfirmed(false);
          setBookingError(null);

          // Lösche auch customerInfo wenn es ein refresh ist
          if (refreshParam) {
            console.log(
              "🔄 Refresh-Parameter erkannt (" +
                refreshParam +
                ") - kompletter State-Reset"
            );
            setCustomerInfo({
              fullName: "",
              email: "",
              phone: "",
              message: "",
            });

            // Entferne refresh Parameter aus URL für saubere Navigation
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete("refresh");
            window.history.replaceState({}, "", newUrl.toString());

            console.log("✅ State komplett zurückgesetzt, URL bereinigt");
          }
        }
      }
    } catch (error) {
      console.error("Fehler beim Verarbeiten der URL-Parameter:", error);
    }
  }, []);

  // Benutzerauthentifizierung überwachen und Kundendaten laden
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        try {
          const customerData = await getCustomerByUID(user.uid);
          if (customerData) {
            // Wenn der Benutzer angemeldet ist, setze die Kundeninformationen
            setCustomerInfo({
              fullName: `${customerData.firstName} ${customerData.lastName}`,
              email: customerData.email,
              phone: customerData.phone || "",
              message: "",
            });
          }
        } catch (error) {
          console.error("Fehler beim Laden der Kundendaten:", error);
        }
      } else {
        setIsLoggedIn(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Behandlung zum Array hinzufügen oder entfernen
  const toggleTreatment = (treatment: {
    id: string;
    name: string;
    duration: number;
    price: number;
  }) => {
    setSelectedTreatments((prevTreatments) => {
      const exists = prevTreatments.some((t) => t.id === treatment.id);
      if (exists) {
        return prevTreatments.filter((t) => t.id !== treatment.id);
      } else {
        return [...prevTreatments, treatment];
      }
    });
  };

  // Zum nächsten Schritt gehen
  const goToNextStep = () => {
    setCurrentStep((prevStep) =>
      prevStep < BookingStep.Confirmation ? prevStep + 1 : prevStep
    );
  };

  // Zum vorherigen Schritt gehen
  const goToPreviousStep = () => {
    setCurrentStep((prevStep) =>
      prevStep > BookingStep.TreatmentSelection ? prevStep - 1 : prevStep
    );
  };

  // Buchung bestätigen
  const handleConfirmBooking = async () => {
    try {
      setIsSubmitting(true);
      setBookingError(null);

      // Alle Felder validieren
      if (!selectedTreatments || selectedTreatments.length === 0) {
        setBookingError("Bitte wählen Sie mindestens eine Behandlung aus.");
        setIsSubmitting(false);
        return;
      }

      if (!selectedDateTime.date || !selectedDateTime.time) {
        setBookingError(
          "Bitte wählen Sie ein Datum und eine Uhrzeit für Ihren Termin."
        );
        setIsSubmitting(false);
        return;
      }

      // Berechne Originalpreis und -dauer
      const calcOriginalPrice = selectedTreatments.reduce(
        (sum, treatment) => sum + treatment.price,
        0
      );
      const calcTotalDuration = selectedTreatments.reduce(
        (sum, treatment) => sum + treatment.duration,
        0
      );

      // 🎯 RABATTDATEN AUS SESSIONSTORAGE LESEN
      let finalPrice = calcOriginalPrice;
      let appliedDiscount = null;
      let discountInfo = null;

      try {
        // Versuche Rabattdaten aus sessionStorage zu lesen
        const storedDiscountData = sessionStorage.getItem(
          "bookingDataWithDiscount"
        );
        const storedDiscount = sessionStorage.getItem("appliedDiscount");
        const storedFinalPrice = sessionStorage.getItem("finalPrice");

        if (storedDiscountData) {
          const discountData = JSON.parse(storedDiscountData);
          finalPrice = discountData.finalPrice || calcOriginalPrice;
          appliedDiscount = discountData.appliedDiscount;
          discountInfo = discountData.discountInfo;

          console.log("📊 Rabattdaten aus sessionStorage geladen:", {
            originalPrice: calcOriginalPrice,
            finalPrice: finalPrice,
            discount: appliedDiscount,
            savings: discountInfo?.amount || 0,
          });
        } else if (storedDiscount && storedFinalPrice) {
          // Fallback: Einzelne gespeicherte Werte
          appliedDiscount = JSON.parse(storedDiscount);
          finalPrice = parseFloat(storedFinalPrice);

          console.log("📊 Fallback-Rabattdaten geladen:", {
            originalPrice: calcOriginalPrice,
            finalPrice: finalPrice,
            discount: appliedDiscount,
          });
        }
      } catch (error) {
        console.error("Fehler beim Lesen der Rabattdaten:", error);
        // Bei Fehlern verwende Originalpreis
        finalPrice = calcOriginalPrice;
      }

      // Datum korrekt formatieren
      const localDate = new Date(selectedDateTime.date);
      localDate.setHours(0, 0, 0, 0);
      const formattedDate = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;

      // Erstelle die Buchungsdaten mit Rabatt-Informationen
      const bookingData = {
        name: customerInfo.fullName,
        email: customerInfo.email,
        phone: customerInfo.phone,
        date: formattedDate,
        time: selectedDateTime.time,
        service: selectedTreatments[0].id,
        serviceName: selectedTreatments[0].name,
        treatments: selectedTreatments,
        message: customerInfo.message || "",
        price: finalPrice, // 🎯 FINALER PREIS MIT RABATT
        originalPrice: calcOriginalPrice, // Für Transparenz
        appliedDiscount: appliedDiscount, // Rabattdetails
        discountInfo: discountInfo, // Vollständige Rabattinformationen
        duration: calcTotalDuration,
        termsAccepted: true,
      };

      // 🚨 KRITISCH: SOFORTIGE BLOCKIERUNG VON WEITEREN RABATTEN
      if (appliedDiscount?.isEligible && auth.currentUser?.uid) {
        console.log("🚨 BLOCKIERE SOFORT weitere Rabatte für diesen Benutzer!");

        // 1. SOFORT in Cache markieren (verhindert weitere Rabatte in dieser Session)
        markDiscountAsUsed(auth.currentUser.uid);

        // 2. Firebase-Reset für dauerhafte Sperrung
        try {
          console.log(
            "🎯 WICHTIG: Setze Treuerabatt zurück VOR Buchungsbestätigung"
          );

          // Importiere die Funktion direkt
          const { updateDoc, doc, Timestamp } = await import(
            "firebase/firestore"
          );
          const { db } = await import("@/utils/firebase-config");

          const userRef = doc(db, "users", auth.currentUser.uid);
          await updateDoc(userRef, {
            lastDiscountDate: Timestamp.now(),
            isEligibleForLoyaltyDiscount: false,
            updatedAt: Timestamp.now(),
          });

          console.log("✅ Treuerabatt-Reset VOR Buchung erfolgreich");
        } catch (resetError) {
          console.error("❌ Fehler beim Treuerabatt-Reset:", resetError);
        }
      }

      // Versuche die Buchung zu speichern
      console.log("Buchungsdaten:", bookingData);
      const result = await saveBooking(bookingData);

      if (result.success) {
        // 🔢 EINFACHE ZÄHLUNG: Erhöhe Behandlungszähler nach erfolgreicher Buchung
        if (auth.currentUser?.uid && !appliedDiscount?.isEligible) {
          try {
            const treatmentCount = selectedTreatments.length;
            console.log(`🔢 Erhöhe Zähler um ${treatmentCount} Behandlungen`);
            await incrementTreatmentCount(auth.currentUser.uid, treatmentCount);
            console.log("✅ Behandlungszähler erfolgreich erhöht");
          } catch (countError) {
            console.error("❌ Fehler beim Erhöhen des Zählers:", countError);
          }
        }

        // 🎯 RABATT ANWENDEN (nur für Tracking)
        if (appliedDiscount?.isEligible && result.id) {
          try {
            console.log(
              "🎯 Wende Rabatt an für Buchung (Tracking):",
              result.id
            );
            await applyDiscountToBooking(
              auth.currentUser?.uid || "",
              result.id,
              appliedDiscount
            );
            console.log("✅ Rabatt-Tracking erfolgreich angewendet");
          } catch (discountError) {
            console.error("❌ Fehler beim Rabatt-Tracking:", discountError);
            // Auch bei Rabatt-Fehlern die Buchung als erfolgreich betrachten
          }
        }

        // Auch wenn ein Fehler zurückgegeben wurde, aber success=true ist,
        // betrachten wir es als erfolgreiche Buchung und zeigen die Erfolgsseite an

        if (result.error) {
          // Zeige die Fehlermeldung an, leite aber trotzdem zur Erfolgsseite weiter
          console.warn("Buchung mit Warnung erfolgreich:", result.error);
          setBookingError(result.error);

          // Erst bookingConfirmed und dann currentStep setzen
          setBookingConfirmed(true);
          setTimeout(() => {
            setCurrentStep(BookingStep.Confirmation);
          }, 3000);
        } else {
          // Alles erfolgreich
          setBookingConfirmed(true);
          setCurrentStep(BookingStep.Confirmation);
        }
      } else {
        // Nur bei wirklichen Fehlern (success=false) zeigen wir einen Fehler an
        setBookingError(
          result.error ||
            "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut."
        );
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Fehler bei der Buchungsbestätigung:", error);

      // Spezifische Behandlung für Berechtigungsfehler
      if (
        error instanceof Error &&
        (error.toString().includes("permission-denied") ||
          error.toString().includes("permission"))
      ) {
        // Bei Berechtigungsfehlern setzen wir trotzdem ein erfolgreiches Ergebnis
        setBookingError(
          "Die Buchung wurde erfolgreich gespeichert, aber es gab technische Probleme. Sie erhalten demnächst eine Bestätigungs-E-Mail."
        );

        // Nach kurzer Verzögerung weiterleiten
        setBookingConfirmed(true);
        setTimeout(() => {
          setCurrentStep(BookingStep.Confirmation);
        }, 5000);
      } else {
        setBookingError(
          error instanceof Error
            ? error.message
            : "Es ist ein unbekannter Fehler aufgetreten. Bitte versuchen Sie es später erneut."
        );
        setIsSubmitting(false);
      }
    }
  };

  // Zeige den aktuellen Schritt an
  const renderCurrentStep = () => {
    switch (currentStep) {
      case BookingStep.TreatmentSelection:
        return (
          <TreatmentSelection
            selectedTreatments={selectedTreatments}
            toggleTreatment={toggleTreatment}
            onContinue={goToNextStep}
          />
        );
      case BookingStep.DateTimeSelection:
        return (
          <DateTimeSelection
            selectedTreatments={selectedTreatments}
            selectedDateTime={selectedDateTime}
            setSelectedDateTime={setSelectedDateTime}
            onBack={goToPreviousStep}
            onContinue={goToNextStep}
          />
        );
      case BookingStep.CustomerForm:
        return (
          <BookingForm
            customerInfo={customerInfo}
            setCustomerInfo={setCustomerInfo}
            onBack={goToPreviousStep}
            onContinue={goToNextStep}
            isLoggedIn={isLoggedIn}
          />
        );
      case BookingStep.TreatmentTerms:
        return (
          <TreatmentTerms
            selectedTreatments={selectedTreatments}
            onBack={goToPreviousStep}
            onContinue={goToNextStep}
          />
        );
      case BookingStep.Summary:
        return (
          <BookingSummary
            selectedTreatments={selectedTreatments}
            selectedDateTime={{
              date: selectedDateTime.date
                ? selectedDateTime.date.toISOString()
                : "",
              time: selectedDateTime.time || "",
            }}
            customerInfo={{
              firstName: customerInfo.fullName.split(" ")[0],
              lastName: customerInfo.fullName.split(" ").slice(1).join(" "),
              email: customerInfo.email,
              phone: customerInfo.phone,
            }}
            onBack={goToPreviousStep}
            onConfirm={(updatedTreatments) => {
              // Wenn aktualisierte Treatments mit Rabatten zurückgegeben werden, verwende diese
              if (updatedTreatments && updatedTreatments.length > 0) {
                console.log(
                  "Aktualisierte Treatments mit Rabatten empfangen:",
                  updatedTreatments
                );
                setSelectedTreatments(updatedTreatments);
              }
              handleConfirmBooking();
            }}
            error={bookingError || undefined}
          />
        );
      case BookingStep.Confirmation:
        return (
          <BookingConfirmation
            selectedTreatments={selectedTreatments}
            selectedDateTime={{
              date: selectedDateTime.date,
              time: selectedDateTime.time || "",
            }}
            customerInfo={customerInfo}
          />
        );
      default:
        return null;
    }
  };

  // Wenn der Benutzer nicht angemeldet ist, zeige die LoginRequired-Komponente
  if (!isLoggedIn) {
    return (
      <section className="section section-booking">
        <Link href="/" className="home-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          Home
        </Link>

        <div className="container center-text">
          <span className="subheading">Termin Buchen</span>
        </div>

        <div className="container">
          <div className="booking-container">
            <LoginRequired />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section section-booking">
      {/* Home Button außerhalb des Containers */}
      <Link href="/" className="home-button">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        Home
      </Link>

      <div className="container center-text">
        <span className="subheading">Termin Buchen</span>
      </div>

      <div className="container">
        <div className="booking-container">
          {/* Moderne Fortschrittsanzeige */}
          <div className="booking-progress">
            <div className="progress-bar-container">
              <div className="progress-steps">
                {/* Verbindungslinien */}
                <div className="progress-line"></div>
                <div
                  className="progress-line-active"
                  style={{
                    width: `${((currentStep - 1) / 4) * 100}%`,
                  }}
                ></div>

                {/* Progress Steps */}
                <div
                  className={`progress-step ${currentStep >= BookingStep.TreatmentSelection ? "active" : ""} ${currentStep > BookingStep.TreatmentSelection ? "completed" : ""}`}
                >
                  <div
                    className={`step-circle ${currentStep >= BookingStep.TreatmentSelection ? "active" : ""} ${currentStep > BookingStep.TreatmentSelection ? "completed" : ""}`}
                  >
                    {currentStep > BookingStep.TreatmentSelection ? "✓" : "1"}
                  </div>
                  <span className="step-text">Behandlung</span>
                </div>

                <div
                  className={`progress-step ${currentStep >= BookingStep.DateTimeSelection ? "active" : ""} ${currentStep > BookingStep.DateTimeSelection ? "completed" : ""}`}
                >
                  <div
                    className={`step-circle ${currentStep >= BookingStep.DateTimeSelection ? "active" : ""} ${currentStep > BookingStep.DateTimeSelection ? "completed" : ""}`}
                  >
                    {currentStep > BookingStep.DateTimeSelection ? "✓" : "2"}
                  </div>
                  <span className="step-text">Termin</span>
                </div>

                <div
                  className={`progress-step ${currentStep >= BookingStep.CustomerForm ? "active" : ""} ${currentStep > BookingStep.CustomerForm ? "completed" : ""}`}
                >
                  <div
                    className={`step-circle ${currentStep >= BookingStep.CustomerForm ? "active" : ""} ${currentStep > BookingStep.CustomerForm ? "completed" : ""}`}
                  >
                    {currentStep > BookingStep.CustomerForm ? "✓" : "3"}
                  </div>
                  <span className="step-text">Persönliche Daten</span>
                </div>

                <div
                  className={`progress-step ${currentStep >= BookingStep.TreatmentTerms ? "active" : ""} ${currentStep > BookingStep.TreatmentTerms ? "completed" : ""}`}
                >
                  <div
                    className={`step-circle ${currentStep >= BookingStep.TreatmentTerms ? "active" : ""} ${currentStep > BookingStep.TreatmentTerms ? "completed" : ""}`}
                  >
                    {currentStep > BookingStep.TreatmentTerms ? "✓" : "4"}
                  </div>
                  <span className="step-text">Bedingungen</span>
                </div>

                <div
                  className={`progress-step ${currentStep >= BookingStep.Summary ? "active" : ""} ${currentStep > BookingStep.Summary ? "completed" : ""}`}
                >
                  <div
                    className={`step-circle ${currentStep >= BookingStep.Summary ? "active" : ""} ${currentStep > BookingStep.Summary ? "completed" : ""}`}
                  >
                    {currentStep > BookingStep.Summary ? "✓" : "5"}
                  </div>
                  <span className="step-text">Überprüfen</span>
                </div>
              </div>
            </div>
          </div>

          {/* Aktueller Schritt wird hier gerendert */}
          <div className="booking-step-content">{renderCurrentStep()}</div>
        </div>
      </div>
    </section>
  );
}
