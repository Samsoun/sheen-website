'use client';

import { useState, useEffect } from 'react';

const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Erst rendern, wenn wir auf dem Client sind
  useEffect(() => {
    setMounted(true);
    // Überprüfen, ob der Benutzer bereits eine Entscheidung getroffen hat
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      // Wenn keine Entscheidung getroffen wurde, Banner anzeigen
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = (e: React.MouseEvent) => {
    e.preventDefault(); // Verhindert jede mögliche Navigation
    localStorage.setItem('cookieConsent', 'accepted');
    setShowBanner(false);
    // Keine Weiterleitung - Benutzer bleibt auf der aktuellen Seite
  };

  const declineCookies = (e: React.MouseEvent) => {
    e.preventDefault(); // Verhindert jede mögliche Navigation
    localStorage.setItem('cookieConsent', 'declined');
    setShowBanner(false);
    // Keine Weiterleitung - Benutzer bleibt auf der aktuellen Seite
  };

  // Nur auf dem Client rendern
  if (!mounted) {
    return null;
  }

  return (
    <>
      {showBanner && (
        <div className="cookie-banner">
          <div className="cookie-content">
            <h3>Cookie-Hinweis</h3>
            <p>
              Wir verwenden Cookies, um Ihre Erfahrung auf unserer Website zu verbessern. Durch die
              weitere Nutzung unserer Website stimmen Sie der Verwendung von Cookies zu.
            </p>
            <div className="cookie-buttons">
              <button onClick={acceptCookies} className="btn-accept">
                Akzeptieren
              </button>
              <button onClick={declineCookies} className="btn-decline">
                Ablehnen
              </button>
            </div>
            <a href="/datenschutz" className="cookie-link">
              Mehr erfahren
            </a>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieBanner;
