"use client";

import React, { useEffect, useState } from "react";
import "@/styles/booking.css";

interface LoyaltyStatusDisplayProps {
  customerId: string;
  bookingCount?: number;
}

export default function LoyaltyStatusDisplay({
  customerId,
  bookingCount,
}: LoyaltyStatusDisplayProps) {
  const [loyaltyStatus, setLoyaltyStatus] = useState<{
    isEligible: boolean;
    bookingCount: number;
    nextBookingForDiscount: number;
    loyaltyProgress: number;
    message: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Diese Funktion ersetzt den Aufruf von checkLoyaltyEligibility aus discountUtils
  const calculateLoyaltyStatus = (count: number) => {
    // Berechne die Position im Rabattzyklus (Rest der Division durch 5)
    const positionInCycle = count % 5;

    // Der Rabatt wird nur gewährt, wenn die nächste Buchung die 5., 10., 15. etc. ist
    const isEligible = positionInCycle === 4;

    // Berechne den Fortschritt zum nächsten Rabatt (in Prozent)
    const loyaltyProgress = Math.min(100, (positionInCycle + 1) * 20);

    // Berechne, wie viele Behandlungen bis zum nächsten Rabatt fehlen
    const nextBookingForDiscount = isEligible ? 1 : 5 - positionInCycle;

    let message = "";
    if (isEligible) {
      message =
        "🎉 Glückwunsch! Ihre nächste Buchung erhält einen 20% Treuerabatt.";
    } else {
      message = `Noch ${nextBookingForDiscount} Buchung${nextBookingForDiscount !== 1 ? "en" : ""} bis zu Ihrem 20% Treuerabatt!`;
    }

    return {
      isEligible,
      bookingCount: count,
      nextBookingForDiscount,
      loyaltyProgress,
      message,
    };
  };

  const updateLoyaltyStatus = async (count?: number) => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    try {
      // Hinweis: Die API-Abfrage wurde entfernt, da die discountUtils nicht mehr verfügbar sind
      // Stattdessen verwenden wir die direkt eingebettete Logik
      if (count !== undefined) {
        console.log(`Verwende übergebene Behandlungsanzahl: ${count}`);
        const status = calculateLoyaltyStatus(count);
        setLoyaltyStatus(status);
        console.log(
          `Treuerabatt-Anzeige aktualisiert mit übergebener Behandlungsanzahl: ${count}`
        );
      } else {
        // Da wir keine API mehr haben, verwenden wir Standardwerte
        const defaultCount = 0; // Standardwert, wenn keine Behandlungen bekannt sind
        const status = calculateLoyaltyStatus(defaultCount);
        setLoyaltyStatus(status);
        console.log(`Treuerabatt-Anzeige mit Standardwerten aktualisiert.`);
      }
    } catch (err) {
      console.error("Fehler beim Berechnen des Treuestatus:", err);
      setError("Fehler beim Laden Ihres Treueprogramm-Status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    updateLoyaltyStatus(bookingCount);
  }, [customerId, bookingCount]);

  if (loading) {
    return (
      <div className="loyalty-status-container loading">
        Lade Treueprogramm-Status...
      </div>
    );
  }

  if (error) {
    return <div className="loyalty-status-container error">{error}</div>;
  }

  if (!loyaltyStatus) {
    return null;
  }

  return (
    <div className="loyalty-status-container">
      <h3 className="loyalty-heading">Ihr Treueprogramm-Status</h3>

      <div className="loyalty-progress-container">
        <div className="loyalty-progress-bar-container">
          <div
            className="loyalty-progress-bar"
            style={{ width: `${loyaltyStatus.loyaltyProgress}%` }}
          />
          <div className="loyalty-progress-steps">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`loyalty-step ${loyaltyStatus.bookingCount >= step - 1 ? "completed" : ""}`}
              >
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="loyalty-message">
        {loyaltyStatus.isEligible ? (
          <div className="loyalty-eligible">
            <span className="loyalty-badge">20%</span>
            {loyaltyStatus.message}
          </div>
        ) : (
          <p>{loyaltyStatus.message}</p>
        )}
      </div>

      <div className="loyalty-details">
        <p>
          Sie haben <strong>{loyaltyStatus.bookingCount}</strong> Buchung
          {loyaltyStatus.bookingCount !== 1 ? "en" : ""} in den letzten 6
          Monaten.
        </p>
        {!loyaltyStatus.isEligible && (
          <p>
            Nach {loyaltyStatus.nextBookingForDiscount}
            weitere{loyaltyStatus.nextBookingForDiscount !== 1 ? "n" : ""}{" "}
            Buchung
            {loyaltyStatus.nextBookingForDiscount !== 1 ? "en" : ""}
            erhalten Sie einen 20% Rabatt auf Ihre nächste Buchung.
          </p>
        )}
      </div>
    </div>
  );
}
