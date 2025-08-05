"use client";

import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/utils/firebase-config";
import {
  getUserDiscountData,
  checkLoyaltyDiscountEligibility,
  checkBirthdayDiscountEligibility,
  createOrUpdateUserDiscountData,
  type UserDiscountData,
} from "@/utils/discountService";
import { Timestamp } from "firebase/firestore";
import "@/styles/discount.css";

interface UserDiscountProfileProps {
  showCompact?: boolean;
  showBirthdateInput?: boolean;
}

export default function UserDiscountProfile({
  showCompact = false,
  showBirthdateInput = true,
}: UserDiscountProfileProps) {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserDiscountData | null>(null);
  const [loyaltyProgress, setLoyaltyProgress] = useState<any>(null);
  const [birthdayEligibility, setBirthdayEligibility] = useState<any>(null);
  const [birthDate, setBirthDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadUserData(currentUser.uid);
      } else {
        setUserData(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      setIsLoading(true);

      // Benutzerdaten laden
      const userData = await getUserDiscountData(userId);
      setUserData(userData);

      if (userData?.birthDate) {
        // Datum für Input formatieren (YYYY-MM-DD)
        const date = userData.birthDate.toDate();
        const formattedDate = date.toISOString().split("T")[0];
        setBirthDate(formattedDate);
      }

      // Treuerabatt-Fortschritt laden
      const loyaltyCheck = await checkLoyaltyDiscountEligibility(userId);
      setLoyaltyProgress(loyaltyCheck);

      // Geburtstagsrabatt prüfen
      if (userData?.birthDate) {
        const birthdayCheck = await checkBirthdayDiscountEligibility(userId);
        setBirthdayEligibility(birthdayCheck);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Benutzerdaten:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBirthDateSave = async () => {
    if (!user || !birthDate) return;

    try {
      setIsSaving(true);
      setMessage("");

      // Datum parsen und validieren
      const selectedDate = new Date(birthDate);
      const today = new Date();

      if (selectedDate >= today) {
        setMessage("Bitte geben Sie ein gültiges Geburtsdatum ein.");
        return;
      }

      // Benutzer-Daten aktualisieren
      await createOrUpdateUserDiscountData(user.uid, {
        birthDate: Timestamp.fromDate(selectedDate),
      });

      // Daten neu laden
      await loadUserData(user.uid);

      setMessage("Geburtsdatum erfolgreich gespeichert!");

      // Nachricht nach 3 Sekunden ausblenden
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Fehler beim Speichern des Geburtsdatums:", error);
      setMessage("Fehler beim Speichern. Bitte versuchen Sie es erneut.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatNextBirthday = (daysUntil: number) => {
    if (daysUntil === 0) return "Heute ist Ihr Geburtstag! 🎉";
    if (daysUntil === 1) return "Morgen ist Ihr Geburtstag! 🎂";
    if (daysUntil <= 7) return `Ihr Geburtstag ist in ${daysUntil} Tagen! 🎈`;
    return `Noch ${daysUntil} Tage bis zu Ihrem Geburtstag`;
  };

  if (!user) {
    return (
      <div className="discount-profile-guest">
        <div className="discount-card discount-info">
          <div className="discount-content">
            <h3>Melden Sie sich an für exklusive Vorteile!</h3>
            <p>
              Registrierte Mitglieder erhalten Treue- und Geburtstagsrabatte.
              Melden Sie sich an, um Ihre Vorteile zu nutzen!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="discount-profile-loading">
        <div className="discount-spinner"></div>
        <p>Lade Ihre Rabattinformationen...</p>
      </div>
    );
  }

  if (showCompact) {
    return (
      <div className="discount-profile-compact">
        {/* Kompakte Ansicht für Header/Sidebar */}
        {loyaltyProgress && (
          <div className="loyalty-compact">
            <div className="progress-ring">
              <svg width="40" height="40">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                  fill="none"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${(loyaltyProgress.progress.current / loyaltyProgress.progress.required) * 100} 100`}
                  transform="rotate(-90 20 20)"
                />
              </svg>
              <span className="progress-number">
                {loyaltyProgress.progress.current}/
                {loyaltyProgress.progress.required}
              </span>
            </div>
          </div>
        )}

        {birthdayEligibility?.isEligible && (
          <div className="birthday-compact">
            <ion-icon name="gift"></ion-icon>
            <span>Geburtstagsrabatt aktiv!</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="user-discount-profile">
      <h2 className="profile-title">Ihre Rabatte & Vorteile</h2>

      {/* Geburtsdatum eingeben */}
      {showBirthdateInput && !userData?.birthDate && (
        <div className="discount-card">
          <div className="discount-content">
            <h3>🎂 Geburtstagsrabatt aktivieren</h3>
            <p>
              Geben Sie Ihr Geburtsdatum an, um 10% Rabatt in Ihrer
              Geburtstagswoche zu erhalten!
            </p>

            <div className="birthdate-input-group">
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="birthdate-input"
                max={new Date().toISOString().split("T")[0]}
              />
              <button
                onClick={handleBirthDateSave}
                disabled={!birthDate || isSaving}
                className="save-birthdate-btn"
              >
                {isSaving ? "Speichern..." : "Speichern"}
              </button>
            </div>

            {message && (
              <div
                className={`message ${message.includes("Fehler") ? "error" : "success"}`}
              >
                {message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Treuerabatt-Fortschritt */}
      {loyaltyProgress && (
        <div className="discount-card discount-progress">
          <div className="discount-header">
            <div className="discount-icon">
              <ion-icon name="star"></ion-icon>
            </div>
            <h3>⭐ Treuerabatt-Fortschritt</h3>
          </div>

          <div className="discount-content">
            {loyaltyProgress.isEligible ? (
              <div className="eligible-message">
                <div className="celebration">🎉</div>
                <h4>Herzlichen Glückwunsch!</h4>
                <p>
                  Sie sind berechtigt für 20% Treuerabatt bei Ihrer nächsten
                  Buchung!
                </p>
              </div>
            ) : (
              <>
                <p>Sammeln Sie Behandlungen für Ihren Treuerabatt</p>

                <div className="progress-container">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(loyaltyProgress.progress.current / loyaltyProgress.progress.required) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    {loyaltyProgress.progress.current} /{" "}
                    {loyaltyProgress.progress.required} Buchungen
                  </div>
                </div>

                <div className="progress-motivation">
                  Noch {loyaltyProgress.progress.remaining} Buchungen bis zu 20%
                  Rabatt!
                </div>

                <div className="benefits-info">
                  <h5>Ihre Vorteile:</h5>
                  <ul>
                    <li>20% Rabatt bei der 5. Buchung</li>
                    <li>Buchungen zählen 6 Monate rückwirkend</li>
                    <li>Nach jedem Rabatt startet die Zählung neu</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Geburtstagsrabatt-Status */}
      {userData?.birthDate && (
        <div className="discount-card">
          <div className="discount-header">
            <div className="discount-icon">
              <ion-icon name="gift"></ion-icon>
            </div>
            <h3>🎂 Geburtstagsrabatt</h3>
          </div>

          <div className="discount-content">
            {birthdayEligibility?.isEligible ? (
              <div className="birthday-active">
                <div className="celebration">🎉</div>
                <h4>Happy Birthday!</h4>
                <p>
                  Sie erhalten diese Woche 10% Geburtstagsrabatt auf alle
                  Buchungen!
                </p>
                <div className="birthday-week-info">
                  Gültig bis:{" "}
                  {birthdayEligibility.birthdayWeekEnd?.toLocaleDateString(
                    "de-DE"
                  )}
                </div>
              </div>
            ) : (
              <div className="birthday-waiting">
                <p>
                  {formatNextBirthday(
                    birthdayEligibility?.daysUntilBirthday || 0
                  )}
                </p>
                <div className="birthday-info">
                  <h5>Ihr Geburtstagsrabatt:</h5>
                  <ul>
                    <li>10% Rabatt in Ihrer Geburtstagswoche</li>
                    <li>Automatisch angewendet bei der Buchung</li>
                    <li>
                      Kombinierbar mit anderen Aktionen (höchster Rabatt gilt)
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rabatt-Tipps */}
      <div className="discount-card discount-tips">
        <div className="discount-content">
          <h3>💡 Rabatt-Tipps</h3>
          <div className="tips-grid">
            <div className="tip">
              <ion-icon name="calendar"></ion-icon>
              <div>
                <h4>Regelmäßige Termine</h4>
                <p>
                  Buchen Sie regelmäßig, um schneller zum Treuerabatt zu
                  gelangen.
                </p>
              </div>
            </div>
            <div className="tip">
              <ion-icon name="people"></ion-icon>
              <div>
                <h4>Freunde einladen</h4>
                <p>
                  Empfehlen Sie uns weiter - zufriedene Kunden sind unser bester
                  Beweis!
                </p>
              </div>
            </div>
            <div className="tip">
              <ion-icon name="notifications"></ion-icon>
              <div>
                <h4>Benachrichtigungen</h4>
                <p>
                  Verpassen Sie keine Rabattaktionen - folgen Sie uns in den
                  sozialen Medien.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
