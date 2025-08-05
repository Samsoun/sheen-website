"use client";

import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/utils/firebase-config";
import {
  calculateAvailableDiscount,
  checkLoyaltyDiscountEligibility,
  checkBirthdayDiscountEligibility,
  type DiscountInfo,
} from "@/utils/discountService";

interface DiscountDisplayProps {
  totalPrice: number;
  onDiscountCalculated?: (discountInfo: DiscountInfo) => void;
  showProgress?: boolean;
  currentTreatments?: any[]; // Aktuell ausgewählte Behandlungen
}

export default function DiscountDisplay({
  totalPrice,
  onDiscountCalculated,
  showProgress = true,
  currentTreatments = [],
}: DiscountDisplayProps) {
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        calculateDiscount(currentUser.uid);
      } else {
        setDiscountInfo(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [totalPrice, currentTreatments]);

  const calculateDiscount = async (userId: string) => {
    try {
      setIsLoading(true);
      const discount = await calculateAvailableDiscountWithCurrentTreatments(
        userId,
        totalPrice,
        currentTreatments
      );
      setDiscountInfo(discount);
      onDiscountCalculated?.(discount);
    } catch (error) {
      console.error("Fehler bei Rabattberechnung:", error);
      setDiscountInfo({
        type: "none",
        percentage: 0,
        amount: 0,
        description: "Rabattberechnung nicht verfügbar",
        isEligible: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Hilfsfunktion: Rabattberechnung mit aktuellen Behandlungen
  const calculateAvailableDiscountWithCurrentTreatments = async (
    userId: string,
    originalPrice: number,
    currentTreatments: any[]
  ): Promise<DiscountInfo> => {
    try {
      console.log(
        "🔍 DiscountDisplay: Prüfe Rabatt-Berechtigung für User:",
        userId
      );

      // 🚨 WICHTIG: Zuerst prüfen ob bereits ein Rabatt heute verwendet wurde
      const baseDiscount = await calculateAvailableDiscount(
        userId,
        originalPrice
      );

      // 📊 BEHANDLUNGSZÄHLUNG: Hole die korrekte Zählung nach Rabatt-Reset
      const currentTreatmentCount =
        await checkLoyaltyDiscountEligibility(userId);
      const selectedTreatmentsCount = currentTreatments.length;

      // Nur Session-Cache prüfen (nicht mehr tagesbasierte Sperre)
      if (baseDiscount.description.includes("bereits verwendet")) {
        console.log(
          "❌ Rabatt bereits in dieser Session verwendet, starte neue Zählung:",
          {
            bisherigeNachReset: currentTreatmentCount.progress.current,
            aktuelleAuswahl: selectedTreatmentsCount,
            neueZählung: selectedTreatmentsCount, // Nur aktuelle zählen!
          }
        );

        // Nach Rabatt-Verwendung: Zählung beginnt neu mit nur den aktuellen Behandlungen
        return {
          type: "none",
          percentage: 0,
          amount: 0,
          description:
            "Treuerabatt bereits in dieser Session verwendet. Laden Sie die Seite neu für weitere Buchungen.",
          isEligible: false,
          progressInfo: {
            current: selectedTreatmentsCount, // 🎯 NUR die aktuellen Behandlungen zählen
            required: 5,
            remaining: Math.max(0, 5 - selectedTreatmentsCount),
          },
        };
      }

      // 🎯 KORRIGIERTE BEHANDLUNGSZÄHLUNG nach Rabatt-Reset
      // Die currentTreatmentCount.progress.current zählt bereits nur Behandlungen NACH dem letzten Rabatt
      const correctCurrentCount = currentTreatmentCount.progress.current;
      const correctTotalAfterBooking =
        correctCurrentCount + selectedTreatmentsCount;

      console.log(`🎯 KORRIGIERTE Behandlungsberechnung:`, {
        bisherigeNachLetztemRabatt: correctCurrentCount,
        aktuelleAuswahl: selectedTreatmentsCount,
        korrekteGesamtzahl: correctTotalAfterBooking,
        benötigtFürRabatt: 5,
        würdeBerechtigen: correctTotalAfterBooking >= 5,
      });

      // Prüfen ob nach dieser Buchung Berechtigung erreicht wird
      const willBeEligible = correctTotalAfterBooking >= 5;

      if (willBeEligible) {
        // Kunde ist nach dieser Buchung berechtigt für Treuerabatt
        const discountAmount = originalPrice * 0.2; // 20% Rabatt

        console.log(`✅ TREUERABATT GEWÄHRT!`, {
          finalAmount: discountAmount,
          originalPrice,
          totalTreatments: correctTotalAfterBooking,
        });

        return {
          type: "loyalty",
          percentage: 20,
          amount: discountAmount,
          description:
            "🎉 Treuerabatt erreicht! Sie erhalten 20% Rabatt auf diese Buchung!",
          isEligible: true,
          progressInfo: {
            current: correctTotalAfterBooking,
            required: 5,
            remaining: Math.max(0, 5 - correctTotalAfterBooking),
          },
        };
      }

      if (currentTreatmentCount.isEligible) {
        // Kunde ist bereits berechtigt
        const discountAmount = originalPrice * 0.2; // 20% Rabatt
        return {
          type: "loyalty",
          percentage: 20,
          amount: discountAmount,
          description: "Treuerabatt - Sie sind berechtigt für 20% Rabatt!",
          isEligible: true,
          progressInfo: currentTreatmentCount.progress,
        };
      }

      // Geburtstagsrabatt prüfen (nur wenn kein Treuerabatt)
      const birthdayCheck = await checkBirthdayDiscountEligibility(userId);
      if (birthdayCheck.isEligible) {
        const discountAmount = originalPrice * 0.1; // 10% Rabatt
        return {
          type: "birthday",
          percentage: 10,
          amount: discountAmount,
          description: "Geburtstagsrabatt - Alles Gute zum Geburtstag! 🎉",
          isEligible: true,
        };
      }

      // Fortschritt nach dieser Buchung anzeigen (mit korrigierter Zählung)
      const remainingAfterBooking = Math.max(0, 5 - correctTotalAfterBooking);

      return {
        type: "none",
        percentage: 0,
        amount: 0,
        description: `Noch ${remainingAfterBooking} Behandlungen bis zum Treuerabatt`,
        isEligible: false,
        progressInfo: {
          current: correctTotalAfterBooking,
          required: 5,
          remaining: remainingAfterBooking,
        },
      };
    } catch (error) {
      console.error("Fehler bei der Rabattberechnung:", error);
      return {
        type: "none",
        percentage: 0,
        amount: 0,
        description: "Rabattberechnung nicht verfügbar",
        isEligible: false,
      };
    }
  };

  // Nur für angemeldete Benutzer anzeigen
  if (!user) {
    return (
      <div className="discount-guest-info">
        <div className="discount-card discount-info">
          <div className="discount-icon">
            <ion-icon name="person-outline"></ion-icon>
          </div>
          <div className="discount-content">
            <h4>Exklusive Rabatte für Mitglieder</h4>
            <p>
              Melden Sie sich an, um von Treue- und Geburtstagsrabatten zu
              profitieren!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="discount-loading">
        <div className="discount-card">
          <div className="discount-spinner"></div>
          <p>Rabatte werden berechnet...</p>
        </div>
      </div>
    );
  }

  if (!discountInfo) {
    return null;
  }

  const finalPrice = totalPrice - discountInfo.amount;

  return (
    <div className="discount-display">
      {discountInfo.isEligible ? (
        // Aktiver Rabatt
        <div className="discount-card discount-active">
          <div className="discount-header">
            <div className="discount-icon discount-icon-active">
              {discountInfo.type === "loyalty" ? (
                <ion-icon name="star"></ion-icon>
              ) : (
                <ion-icon name="gift"></ion-icon>
              )}
            </div>
            <div className="discount-badge">-{discountInfo.percentage}%</div>
          </div>

          <div className="discount-content">
            <h4 className="discount-title">
              {discountInfo.type === "loyalty"
                ? "🎉 Treuerabatt"
                : "🎂 Geburtstagsrabatt"}
            </h4>
            <p className="discount-description">{discountInfo.description}</p>

            <div className="discount-calculation">
              <div className="price-row original-price">
                <span>Originalpreis:</span>
                <span>€{totalPrice.toFixed(2)}</span>
              </div>
              <div className="price-row discount-amount">
                <span>Rabatt ({discountInfo.percentage}%):</span>
                <span>-€{discountInfo.amount.toFixed(2)}</span>
              </div>
              <div className="price-row final-price">
                <span>Endpreis:</span>
                <span>€{finalPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="discount-savings">
              Sie sparen €{discountInfo.amount.toFixed(2)}!
            </div>
          </div>
        </div>
      ) : (
        // Fortschrittsanzeige für Treuerabatt
        showProgress &&
        discountInfo.progressInfo && (
          <div className="discount-card discount-progress">
            <div className="discount-icon">
              <ion-icon name="star-outline"></ion-icon>
            </div>

            <div className="discount-content">
              <h4 className="discount-title">Treuerabatt-Fortschritt</h4>
              <p className="discount-description">{discountInfo.description}</p>

              <div className="progress-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(discountInfo.progressInfo.current / discountInfo.progressInfo.required) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="progress-text">
                  {discountInfo.progressInfo.current} /{" "}
                  {discountInfo.progressInfo.required} Behandlungen
                </div>
              </div>

              <div className="progress-motivation">
                Noch {discountInfo.progressInfo.remaining} Behandlungen bis zu
                20% Rabatt!
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

// Kompakte Version für kleinere Bereiche
export function DiscountBadge({ totalPrice }: { totalPrice: number }) {
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const discount = await calculateAvailableDiscount(
            currentUser.uid,
            totalPrice
          );
          setDiscountInfo(discount);
        } catch (error) {
          console.error("Fehler bei Rabattberechnung:", error);
        }
      }
    });

    return () => unsubscribe();
  }, [totalPrice]);

  if (!user || !discountInfo?.isEligible) {
    return null;
  }

  return (
    <div className="discount-badge-compact">
      <ion-icon
        name={discountInfo.type === "loyalty" ? "star" : "gift"}
      ></ion-icon>
      <span>-{discountInfo.percentage}% Rabatt</span>
    </div>
  );
}
