"use client";

import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, getCustomerByUID } from "@/utils/firebase-config";
import "@/styles/booking.css";
import "@/styles/discount.css";
import { useAuth } from "@/utils/auth/AuthContext";
import { Treatment } from "@/types/treatment";
import DiscountDisplay from "./DiscountDisplay";
import {
  calculateAvailableDiscount,
  type DiscountInfo,
} from "@/utils/discountService";

interface BookingSummaryProps {
  selectedTreatments: Treatment[];
  selectedDateTime: {
    date: string | Date | null;
    time: string;
  };
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  onBack: () => void;
  onConfirm: (treatments?: Treatment[]) => void;
  error?: string;
}

// Einfache Hilfsfunktion für die Preisformatierung
const formatCurrency = (price: number): string => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export default function BookingSummary({
  selectedTreatments,
  selectedDateTime,
  customerInfo,
  onBack,
  onConfirm,
  error,
}: BookingSummaryProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);
  const [finalPrice, setFinalPrice] = useState(0);
  const { user } = useAuth();

  // Berechne Gesamtpreis
  const calculateTotalPrice = () => {
    return selectedTreatments.reduce(
      (total, treatment) => total + treatment.price,
      0
    );
  };

  const totalPrice = calculateTotalPrice();
  const totalDuration = selectedTreatments.reduce(
    (total, treatment) => total + treatment.duration,
    0
  );

  // Rabatt-Handler
  const handleDiscountCalculated = (discount: DiscountInfo) => {
    setDiscountInfo(discount);
    const calculatedFinalPrice = totalPrice - discount.amount;
    setFinalPrice(calculatedFinalPrice);
  };

  // Initialer Finalpreis ohne Rabatt
  useEffect(() => {
    if (!discountInfo) {
      setFinalPrice(totalPrice);
    }
  }, [totalPrice, discountInfo]);

  // Überprüfe Anmeldestatus und Rabatte, wenn sich der Nutzer oder die Behandlungen ändern
  useEffect(() => {
    // Debug: Alle Buchungsdaten ausgeben
    console.log("BookingSummary Debug:");
    console.log("- selectedTreatments:", selectedTreatments);
    console.log(
      "- selectedDateTime:",
      JSON.stringify(selectedDateTime, null, 2)
    );
    console.log("- customerInfo:", JSON.stringify(customerInfo, null, 2));

    // Spezifische Prüfungen
    console.log("- selectedDateTime.date:", selectedDateTime?.date);
    console.log("- selectedDateTime.time:", selectedDateTime?.time);
    console.log("- customerInfo.firstName:", customerInfo?.firstName);
    console.log("- customerInfo.lastName:", customerInfo?.lastName);
    console.log("- customerInfo.email:", customerInfo?.email);

    // Rabattberechnung loggen
    if (discountInfo) {
      console.log("- Rabattinfo:", discountInfo);
      console.log("- Originalpreis:", totalPrice);
      console.log("- Endpreis:", finalPrice);
      console.log("- Ersparnis:", discountInfo.amount);
    }
  }, [
    selectedTreatments,
    totalPrice,
    user,
    customerInfo,
    discountInfo,
    finalPrice,
  ]);

  // Formatiere das Datum - unterstützt sowohl Date Objects als auch ISO Strings
  const formatDate = (dateInput: string | Date | null) => {
    if (!dateInput) {
      return "Kein Datum gewählt";
    }

    try {
      let date: Date;

      // Prüfe ob es bereits ein Date Object ist
      if (dateInput instanceof Date) {
        date = dateInput;
      } else {
        // Konvertiere String zu Date
        date = new Date(dateInput);
      }

      // Prüfe, ob das Datum valide ist
      if (isNaN(date.getTime())) {
        return "Ungültiges Datum";
      }

      return date.toLocaleDateString("de-DE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Fehler beim Formatieren des Datums:", error);
      return "Ungültiges Datum";
    }
  };

  // Helper-Funktion um den Namen zu extrahieren
  const getCustomerName = () => {
    if (!customerInfo) {
      return "Kein Kunde angegeben";
    }

    // Fall 1: firstName und lastName sind vorhanden
    if (customerInfo.firstName && customerInfo.lastName) {
      const firstName = customerInfo.firstName.trim();
      const lastName = customerInfo.lastName.trim();
      return `${firstName} ${lastName}`;
    }

    // Fall 2: Nur einer der beiden ist vorhanden
    if (customerInfo.firstName || customerInfo.lastName) {
      return (customerInfo.firstName || customerInfo.lastName || "").trim();
    }

    // Fall 3: Fullname ist direkt verfügbar
    if ("fullName" in customerInfo && (customerInfo as any).fullName) {
      const fullName = (customerInfo as any).fullName.trim();
      return fullName !== "" ? fullName : "Kein Name angegeben";
    }

    // Fall 4: Nur name ist verfügbar
    if ("name" in customerInfo && (customerInfo as any).name) {
      const name = (customerInfo as any).name.trim();
      return name !== "" ? name : "Kein Name angegeben";
    }

    // Fall 5: Extrahiere aus E-Mail
    if (customerInfo.email && customerInfo.email.includes("@")) {
      return customerInfo.email.split("@")[0];
    }

    // Fallback
    return "Kein Name angegeben";
  };

  // Angepasster onConfirm Handler, der die rabattierten Behandlungen weitergibt
  const handleConfirm = () => {
    // Bereite die Treatments mit Rabattinformationen für die Übergabe vor
    const treatmentsForConfirmation = selectedTreatments;

    // Erstelle ein komplettes Buchungsobjekt mit allen Rabattdaten
    const bookingDataWithDiscount = {
      treatments: treatmentsForConfirmation,
      dateTime: selectedDateTime,
      customer: customerInfo,
      discountInfo: discountInfo,
      originalPrice: totalPrice,
      finalPrice: finalPrice,
      appliedDiscount: discountInfo?.isEligible ? discountInfo : null,
    };

    // Speichere die kompletten Buchungsdaten mit Rabattinformationen
    try {
      // Speichere die ursprünglichen Treatments
      sessionStorage.setItem(
        "bookingTreatments",
        JSON.stringify(treatmentsForConfirmation)
      );

      // WICHTIG: Speichere die kompletten Buchungsdaten mit Rabatt
      sessionStorage.setItem(
        "bookingDataWithDiscount",
        JSON.stringify(bookingDataWithDiscount)
      );

      // Speichere auch spezifische Rabattdaten
      if (discountInfo?.isEligible) {
        sessionStorage.setItem("appliedDiscount", JSON.stringify(discountInfo));
        sessionStorage.setItem("originalPrice", totalPrice.toString());
        sessionStorage.setItem("finalPrice", finalPrice.toString());
      }

      // WICHTIG: Speichere die Behandlungen auch direkt im Window-Objekt
      (window as any).__BOOKING_TREATMENTS__ = treatmentsForConfirmation;
      (window as any).__BOOKING_DISCOUNT_DATA__ = bookingDataWithDiscount;

      // Speichere als Backup auch in localStorage
      localStorage.setItem(
        "bookingTreatments",
        JSON.stringify(treatmentsForConfirmation)
      );
      localStorage.setItem(
        "bookingDataWithDiscount",
        JSON.stringify(bookingDataWithDiscount)
      );

      console.log("💾 Buchungsdaten mit Rabatt gespeichert:", {
        treatments: treatmentsForConfirmation.length,
        originalPrice: totalPrice,
        finalPrice: finalPrice,
        discount: discountInfo?.isEligible
          ? `${discountInfo.percentage}%`
          : "Kein Rabatt",
        savings: discountInfo?.amount || 0,
      });
    } catch (error) {
      console.error("Fehler beim Speichern der Buchungsdaten:", error);
    }

    // Logge die vollständigen Buchungsdaten
    console.log(
      "✅ Bestätigung mit kompletten Buchungsdaten:",
      bookingDataWithDiscount
    );

    // Rufe den übergebenen onConfirm Handler auf
    try {
      // @ts-ignore - Versuch, die Daten direkt zu übergeben
      onConfirm(treatmentsForConfirmation);
    } catch (e) {
      // Fallback zum normalen Aufruf ohne Parameter
      onConfirm();
    }
  };

  return (
    <div className="booking-summary bg-white rounded-lg shadow-md border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-2xl font-semibold text-gray-800">
          Buchungsübersicht
        </h3>
      </div>

      {selectedTreatments.length > 0 ? (
        <div className="p-6">
          <div className="grid gap-8">
            {/* Ausgewählte Behandlungen */}
            <div className="booking-section">
              <h4 className="text-xl font-medium text-gray-700 mb-4 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-[#b2d8db]"
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
                Ausgewählte Behandlungen
              </h4>
              <div className="bg-gray-50 rounded-lg p-5">
                <ul className="divide-y divide-gray-200">
                  {selectedTreatments.map((treatment) => (
                    <li
                      key={treatment.id}
                      className="py-4 flex justify-between items-center"
                    >
                      <div className="flex flex-col">
                        <span className="text-lg font-medium text-gray-800">
                          {treatment.name}
                        </span>
                        <span className="text-base text-gray-500 flex items-center gap-1 mt-1">
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
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          {treatment.duration} Min.
                        </span>
                      </div>
                      {/* Preis mit Rabatt anzeigen */}
                      <span className="text-lg font-semibold text-gray-800">
                        {formatCurrency(treatment.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Termin */}
            {selectedDateTime && (
              <div className="booking-section">
                <h4 className="text-xl font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-[#b2d8db]"
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
                  Termin
                </h4>
                <div className="bg-gray-50 rounded-lg p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-[#b2d8db]"
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
                      <div>
                        <span className="text-base text-gray-500">Datum</span>
                        <p className="text-lg font-medium text-gray-800">
                          {formatDate(selectedDateTime.date) ||
                            "Kein Datum gewählt"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-[#b2d8db]"
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
                      <div>
                        <span className="text-base text-gray-500">Uhrzeit</span>
                        <p className="text-lg font-medium text-gray-800">
                          {selectedDateTime.time && selectedDateTime.time !== ""
                            ? `${selectedDateTime.time} Uhr`
                            : "Keine Uhrzeit gewählt"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-[#b2d8db]"
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
                      <div>
                        <span className="text-base text-gray-500">
                          Gesamtdauer
                        </span>
                        <p className="text-lg font-medium text-gray-800">
                          {totalDuration} Minuten
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Kundendaten */}
            {customerInfo && (
              <div className="booking-section">
                <h4 className="text-xl font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-[#b2d8db]"
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
                  Ihre Daten
                </h4>
                <div className="bg-gray-50 rounded-lg p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <span className="text-base text-gray-500">Name</span>
                      <p className="text-lg font-medium text-gray-800">
                        {getCustomerName() || "Kein Name angegeben"}
                      </p>
                    </div>
                    <div>
                      <span className="text-base text-gray-500">E-Mail</span>
                      <p className="text-lg font-medium text-gray-800">
                        {customerInfo.email && customerInfo.email.trim() !== ""
                          ? customerInfo.email
                          : "Keine E-Mail angegeben"}
                      </p>
                    </div>
                    {(customerInfo.phone ||
                      ("phoneNumber" in customerInfo &&
                        (customerInfo as any).phoneNumber)) && (
                      <div>
                        <span className="text-base text-gray-500">Telefon</span>
                        <p className="text-lg font-medium text-gray-800">
                          {customerInfo.phone ||
                            ("phoneNumber" in customerInfo
                              ? (customerInfo as any).phoneNumber
                              : "Keine Telefonnummer")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Rabattanzeige */}
            <DiscountDisplay
              totalPrice={totalPrice}
              onDiscountCalculated={handleDiscountCalculated}
              showProgress={true}
              currentTreatments={selectedTreatments}
            />

            {/* Preisübersicht */}
            <div className="booking-section">
              <h4 className="text-xl font-medium text-gray-700 mb-4 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-[#b2d8db]"
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
                Preisübersicht
              </h4>
              <div className="bg-gray-50 rounded-lg p-5">
                <div className="divide-y divide-gray-200">
                  {/* Original Preis */}
                  <div className="price-row py-3 flex justify-between text-lg">
                    <span>Grundpreis:</span>
                    <span className="font-medium">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>

                  {/* Rabatt anzeigen (falls vorhanden) */}
                  {discountInfo && discountInfo.isEligible && (
                    <div className="price-row py-3 flex justify-between text-lg text-green-600">
                      <span>
                        {discountInfo.type === "loyalty"
                          ? "Treuerabatt"
                          : "Geburtstagsrabatt"}
                        ({discountInfo.percentage}%):
                      </span>
                      <span className="font-medium">
                        -{formatCurrency(discountInfo.amount)}
                      </span>
                    </div>
                  )}

                  {/* Gesamtpreis */}
                  <div className="total-price-row py-4 flex justify-between items-center">
                    <span className="font-semibold text-xl">Gesamt:</span>
                    <span className="font-bold text-2xl text-[#28a745]">
                      {formatCurrency(finalPrice)}
                    </span>
                  </div>

                  {/* Ersparnis hervorheben */}
                  {discountInfo &&
                    discountInfo.isEligible &&
                    discountInfo.amount > 0 && (
                      <div className="savings-highlight py-3">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-green-700">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6" />
                              <polyline points="9 17 12 14 15 17" />
                              <polyline points="15 7 12 10 9 7" />
                            </svg>
                            <span className="font-semibold">
                              Sie sparen {formatCurrency(discountInfo.amount)}!
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Preis-Details */}
                  <div className="price-details py-4">
                    <p className="text-base text-gray-500">
                      Enthaltene MwSt (19%):{" "}
                      {formatCurrency((finalPrice * 0.19) / 1.19)}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-base text-gray-500">
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
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>Gesamtdauer: {totalDuration} Min.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Aktionen */}
            <div className="booking-actions mt-6 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={onBack}
                className="py-4 px-6 text-lg rounded-md border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors flex-1"
              >
                Zurück
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="py-4 px-6 text-lg rounded-md bg-[#b2d8db] text-gray-800 font-medium hover:bg-[#9ecacd] transition-colors flex-1"
              >
                Termin verbindlich buchen
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-10 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-20 w-20 mx-auto text-gray-300 mb-6"
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
          <p className="text-xl text-gray-500 mb-6">
            Sie haben noch keine Behandlungen ausgewählt.
          </p>
          <button
            onClick={onBack}
            className="py-4 px-8 text-lg rounded-md bg-[#b2d8db] text-gray-800 font-medium hover:bg-[#9ecacd] transition-colors"
          >
            Zurück zur Behandlungsauswahl
          </button>
        </div>
      )}

      {error && (
        <div className="p-5 bg-red-50 text-red-600 border-t border-red-200 rounded-b-lg text-lg">
          {error}
        </div>
      )}
    </div>
  );
}
