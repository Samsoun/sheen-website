"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { calculatePriceComponents, formatPrice } from "@/utils/priceUtils";
import "@/styles/booking.css";

interface BookingConfirmationProps {
  selectedTreatments: {
    id: string;
    name: string;
    duration: number;
    price: number;
  }[];
  selectedDateTime: {
    date: Date | string | null;
    time: string;
  };
  customerInfo: {
    fullName: string;
    email: string;
    phone: string;
    message: string;
  };
}

export default function BookingConfirmation({
  selectedTreatments,
  selectedDateTime,
  customerInfo,
}: BookingConfirmationProps) {
  const router = useRouter();

  // State für Rabattdaten
  const [discountData, setDiscountData] = useState<any>(null);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number>(0);

  // Lade Rabattdaten aus sessionStorage
  useEffect(() => {
    const originalAmount = selectedTreatments.reduce(
      (sum, treatment) => sum + treatment.price,
      0
    );
    setOriginalPrice(originalAmount);
    setFinalPrice(originalAmount); // Standardwert

    try {
      // Versuche Rabattdaten zu laden
      const storedDiscountData = sessionStorage.getItem(
        "bookingDataWithDiscount"
      );
      const storedFinalPrice = sessionStorage.getItem("finalPrice");
      const storedDiscount = sessionStorage.getItem("appliedDiscount");

      if (storedDiscountData) {
        const parsedData = JSON.parse(storedDiscountData);
        setDiscountData(parsedData);
        setFinalPrice(parsedData.finalPrice || originalAmount);

        console.log("🎯 Rabattdaten in Bestätigung geladen:", {
          original: originalAmount,
          final: parsedData.finalPrice,
          discount: parsedData.appliedDiscount,
        });
      } else if (storedFinalPrice) {
        // Fallback
        const finalPriceValue = parseFloat(storedFinalPrice);
        setFinalPrice(finalPriceValue);

        if (storedDiscount) {
          const parsedDiscount = JSON.parse(storedDiscount);
          setDiscountData({ appliedDiscount: parsedDiscount });
        }
      }
    } catch (error) {
      console.error("Fehler beim Laden der Rabattdaten in Bestätigung:", error);
    }
  }, [selectedTreatments]);

  // Debug: Buchungsbestätigung geladen
  console.log(
    "BookingConfirmation geladen - ID:",
    selectedTreatments[0]?.id || "N/A"
  );

  // Handler für "Weitere Behandlung buchen"
  const handleBookNewAppointment = () => {
    console.log("🔄 Starte neue Buchung...");

    // Lösche alle booking-relevanten Daten aus dem localStorage/sessionStorage
    try {
      localStorage.removeItem("bookingTreatments");
      sessionStorage.removeItem("bookingTreatments");

      // Lösche Rabattdaten
      sessionStorage.removeItem("bookingDataWithDiscount");
      sessionStorage.removeItem("appliedDiscount");
      sessionStorage.removeItem("originalPrice");
      sessionStorage.removeItem("finalPrice");
      localStorage.removeItem("bookingDataWithDiscount");

      // Lösche window-Objekt Daten
      if (typeof window !== "undefined") {
        (window as any).__BOOKING_TREATMENTS__ = null;
        (window as any).__BOOKING_DISCOUNT_DATA__ = null;
      }

      console.log("✅ Buchungsdaten gelöscht");
    } catch (error) {
      console.error("❌ Fehler beim Löschen der Buchungsdaten:", error);
    }

    // Alternative Navigation mit window.location für robustere Weiterleitung
    const newUrl = "/booking?step=treatments&refresh=" + Date.now();
    console.log("🚀 Navigiere zu:", newUrl);

    try {
      // Versuche erst router.push
      router.push(newUrl);
      console.log("✅ Router.push ausgeführt");

      // Fallback mit window.location nach kurzer Verzögerung
      setTimeout(() => {
        console.log("🔄 Fallback: Verwende window.location");
        window.location.href = newUrl;
      }, 100);
    } catch (error) {
      console.error(
        "❌ Router.push fehlgeschlagen, verwende window.location:",
        error
      );
      window.location.href = newUrl;
    }
  };
  // Datum formatieren - unterstützt sowohl Date Objects als auch ISO Strings
  const formatDate = (dateInput: Date | string | null): string => {
    if (!dateInput) return "Kein Datum gewählt";

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

      return new Intl.DateTimeFormat("de-DE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    } catch (error) {
      console.error("Fehler beim Formatieren des Datums:", error);
      return "Ungültiges Datum";
    }
  };

  // Gesamtdauer berechnen
  const totalDuration = selectedTreatments.reduce(
    (sum, treatment) => sum + treatment.duration,
    0
  );

  // Preiskomponenten für die einzelnen Behandlungen berechnen
  const treatmentsWithPriceComponents = selectedTreatments.map((treatment) => {
    const priceComponents = calculatePriceComponents(treatment.price);
    return {
      ...treatment,
      priceComponents,
    };
  });

  // Preiskomponenten für den FINALEN Preis (mit Rabatt)
  const finalPriceComponents = calculatePriceComponents(finalPrice);
  const originalPriceComponents = calculatePriceComponents(originalPrice);

  // Hilfsfunktion für Preisformatierung
  const formatCurrency = (price: number): string => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Buchungs-ID generieren
  const bookingId = `SHN-${Math.floor(Math.random() * 10000)}-${new Date().getFullYear()}`;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
      {/* Header mit Erfolgsmeldung */}
      <div className="bg-[#e8f3f4] p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-[#b2d8db] rounded-full flex items-center justify-center mb-4 shadow-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Buchung erfolgreich!
        </h2>
        <p className="text-lg text-gray-600">
          Vielen Dank für Ihre Buchung, {customerInfo.fullName}! Eine
          Bestätigungsmail wurde an{" "}
          <span className="font-medium">{customerInfo.email}</span> gesendet.
        </p>
      </div>

      <div className="p-6 md:p-8">
        {/* Buchungsnummer */}
        <div className="mb-8 flex justify-between items-center">
          <h3 className="text-2xl font-semibold text-gray-800">
            Ihre Buchungsdetails
          </h3>
          <div className="px-4 py-2 bg-gray-100 rounded-lg">
            <p className="text-base font-medium">
              Buchungsnummer:{" "}
              <span className="text-[#28a745] font-bold">{bookingId}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Gebuchte Behandlungen */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="py-3 px-4 bg-[#f8f9fa] border-b border-gray-200">
                <h4 className="text-xl font-medium text-gray-700 flex items-center gap-2">
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
                  Gebuchte Behandlungen
                </h4>
              </div>
              <div className="p-4">
                <ul className="divide-y divide-gray-200">
                  {treatmentsWithPriceComponents.map((treatment) => (
                    <li
                      key={treatment.id}
                      className="py-4 first:pt-2 last:pb-2"
                    >
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-lg font-medium text-gray-800">
                            {treatment.name}
                          </span>
                          <span className="text-lg font-semibold text-gray-800">
                            {formatPrice(treatment.price)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-gray-500">
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
                          <span>{treatment.duration} Min.</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Termininformationen */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-full">
              <div className="py-3 px-4 bg-[#f8f9fa] border-b border-gray-200">
                <h4 className="text-xl font-medium text-gray-700 flex items-center gap-2">
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
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-500">Datum</span>
                    <p className="text-lg font-medium text-gray-800">
                      {formatDate(selectedDateTime.date)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Uhrzeit</span>
                    <p className="text-lg font-medium text-gray-800">
                      {selectedDateTime.time
                        ? selectedDateTime.time + " Uhr"
                        : "Keine Uhrzeit gewählt"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Gesamtdauer</span>
                    <p className="text-lg font-medium text-gray-800">
                      {totalDuration} Minuten
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kundendaten */}
        <div className="mb-8">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="py-3 px-4 bg-[#f8f9fa] border-b border-gray-200">
              <h4 className="text-xl font-medium text-gray-700 flex items-center gap-2">
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
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Name</span>
                  <p className="text-lg font-medium text-gray-800">
                    {customerInfo.fullName || "Kein Name angegeben"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">E-Mail</span>
                  <p className="text-lg font-medium text-gray-800">
                    {customerInfo.email || "Keine E-Mail angegeben"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Telefon</span>
                  <p className="text-lg font-medium text-gray-800">
                    {customerInfo.phone || "Keine Telefonnummer angegeben"}
                  </p>
                </div>
                {customerInfo.message && (
                  <div className="col-span-full mt-2">
                    <span className="text-sm text-gray-500">
                      Ihre Nachricht
                    </span>
                    <p className="text-base">{customerInfo.message}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preisübersicht */}
        <div className="mb-8">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="py-3 px-4 bg-[#f8f9fa] border-b border-gray-200">
              <h4 className="text-xl font-medium text-gray-700 flex items-center gap-2">
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
            </div>
            <div className="p-4">
              <div className="divide-y divide-gray-200">
                {/* Grundpreis (ohne Rabatt) */}
                <div className="py-3 flex justify-between text-lg">
                  <span>Grundpreis:</span>
                  <span className="font-medium">
                    {formatCurrency(originalPrice)}
                  </span>
                </div>

                {/* Rabatt anzeigen (falls angewendet) */}
                {discountData?.appliedDiscount?.isEligible && (
                  <div className="py-3 flex justify-between text-lg text-green-600">
                    <span>
                      {discountData.appliedDiscount.type === "loyalty"
                        ? "Treuerabatt"
                        : "Geburtstagsrabatt"}
                      ({discountData.appliedDiscount.percentage}%):
                    </span>
                    <span className="font-medium">
                      -{formatCurrency(discountData.appliedDiscount.amount)}
                    </span>
                  </div>
                )}

                {/* Gesamtpreis */}
                <div className="py-4 flex justify-between items-center">
                  <span className="font-semibold text-xl">Gesamt:</span>
                  <span className="font-bold text-2xl text-[#28a745]">
                    {formatCurrency(finalPrice)}
                  </span>
                </div>

                {/* Ersparnis hervorheben */}
                {discountData?.appliedDiscount?.isEligible &&
                  discountData.appliedDiscount.amount > 0 && (
                    <div className="py-3">
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
                            Sie haben{" "}
                            {formatCurrency(
                              discountData.appliedDiscount.amount
                            )}{" "}
                            gespart!
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              {/* MwSt Informationen */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="flex justify-between text-base text-gray-600">
                  <span>Netto-Gesamt:</span>
                  <span>{finalPriceComponents.netFormatted}</span>
                </p>
                <p className="flex justify-between text-base text-gray-600 mt-2">
                  <span>MwSt (19%):</span>
                  <span>{finalPriceComponents.vatFormatted}</span>
                </p>

                {/* Gesamtpreis */}
                <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-semibold text-xl">Gesamtbetrag:</span>
                  <span className="font-bold text-2xl text-[#28a745]">
                    {finalPriceComponents.grossFormatted}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Aktionsbuttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <Link
            href="/"
            className="py-4 px-6 rounded-md bg-white border border-gray-300 text-gray-700 text-lg font-medium hover:bg-gray-50 transition-colors text-center flex-1"
          >
            Zurück zur Startseite
          </Link>
          <button
            onClick={handleBookNewAppointment}
            className="py-4 px-6 rounded-md bg-[#b2d8db] text-gray-800 text-lg font-medium hover:bg-[#9ecacd] transition-colors text-center flex-1"
          >
            Weitere Behandlung buchen
          </button>
        </div>
      </div>
    </div>
  );
}
