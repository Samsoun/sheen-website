"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { cookieManager } from "@/utils/cookieManager";

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Prüfe ob der User bereits eine Entscheidung getroffen hat oder diese abgelaufen ist
    const hasConsent = cookieManager.getConsent();
    const isExpired = cookieManager.isConsentExpired();

    // Debug-Info in der Konsole (nur im Development)
    if (process.env.NODE_ENV === "development") {
      console.log("🍪 Cookie-Status:", { hasConsent, isExpired });
    }

    if (!hasConsent || isExpired) {
      // Zeige das Popup nach kurzer Verzögerung für bessere UX
      const timer = setTimeout(() => {
        if (process.env.NODE_ENV === "development") {
          console.log("🍪 Zeige Cookie-Banner");
        }
        setIsVisible(true);
        setIsAnimating(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    cookieManager.setConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    });
    closeBanner();
  };

  const handleDecline = () => {
    cookieManager.setConsent({
      necessary: true, // Notwendige Cookies können nicht abgelehnt werden
      analytics: false,
      marketing: false,
      preferences: false,
    });
    closeBanner();
  };

  const handleAcceptNecessary = () => {
    cookieManager.setConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
    closeBanner();
  };

  const closeBanner = () => {
    console.log("🍪 Cookie-Popup wird geschlossen");
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  // Entwickler-Helper: Cookie-Status zurücksetzen (nur im Development)
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      // @ts-ignore
      window.resetCookieConsent = () => {
        cookieManager.clearConsent();
        console.log(
          "🍪 Cookie-Consent zurückgesetzt - Seite neu laden für Popup"
        );
      };
    }
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Cookie Consent Banner */}
      <div
        className={`cookie-consent ${isAnimating ? "animate-in" : "animate-out"}`}
      >
        <div className="cookie-content">
          <div className="cookie-icon">🍪</div>

          <div className="cookie-text">
            <h3 className="cookie-title">Wir respektieren Ihre Privatsphäre</h3>
            <p className="cookie-description">
              Diese Website verwendet Cookies für Funktionalität und Analyse.{" "}
              <Link href="/datenschutz" className="cookie-link">
                Datenschutzerklärung
              </Link>
              {" • "}
              <Link href="/impressum" className="cookie-link">
                Impressum
              </Link>
            </p>
          </div>

          <div className="cookie-actions">
            <button
              onClick={handleAcceptNecessary}
              className="cookie-btn cookie-btn-necessary"
            >
              Nur notwendige
            </button>
            <button
              onClick={handleAccept}
              className="cookie-btn cookie-btn-accept"
            >
              Alle akzeptieren
            </button>
          </div>
        </div>

        <button
          onClick={closeBanner}
          className="cookie-close"
          aria-label="Cookie-Banner schließen"
        >
          ×
        </button>
      </div>
    </>
  );
};

export default CookieConsent;
