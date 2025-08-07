// Cookie Manager für Sheen Beauty Website
export interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export const DEFAULT_CONSENT: CookieConsent = {
  necessary: true, // Immer erforderlich
  analytics: false,
  marketing: false,
  preferences: false,
};

export const cookieManager = {
  // Speichere Cookie-Einstellungen
  setConsent: (consent: Partial<CookieConsent>) => {
    const fullConsent = { ...DEFAULT_CONSENT, ...consent };
    localStorage.setItem("sheen-cookie-consent", JSON.stringify(fullConsent));
    localStorage.setItem("sheen-cookie-consent-date", new Date().toISOString());

    // Triggere Event für andere Komponenten
    window.dispatchEvent(
      new CustomEvent("cookieConsentChange", {
        detail: fullConsent,
      })
    );
  },

  // Hole Cookie-Einstellungen
  getConsent: (): CookieConsent | null => {
    try {
      const stored = localStorage.getItem("sheen-cookie-consent");
      if (!stored) return null;

      // Für Backward-Kompatibilität mit einfachen Strings
      if (stored === "accepted") {
        return {
          necessary: true,
          analytics: true,
          marketing: true,
          preferences: true,
        };
      }
      if (stored === "declined") {
        return DEFAULT_CONSENT;
      }

      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  // Prüfe ob bestimmte Cookie-Kategorie erlaubt ist
  isAllowed: (category: keyof CookieConsent): boolean => {
    const consent = cookieManager.getConsent();
    if (!consent) return false;
    return consent[category];
  },

  // Lösche alle Cookie-Einstellungen
  clearConsent: () => {
    localStorage.removeItem("sheen-cookie-consent");
    localStorage.removeItem("sheen-cookie-consent-date");
  },

  // Prüfe ob Consent veraltet ist (älter als 12 Monate)
  isConsentExpired: (): boolean => {
    const consentDate = localStorage.getItem("sheen-cookie-consent-date");
    if (!consentDate) return true;

    const date = new Date(consentDate);
    const now = new Date();
    const diffMonths =
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);

    return diffMonths > 12;
  },

  // Google Analytics initialisieren (falls erlaubt)
  initializeAnalytics: () => {
    if (cookieManager.isAllowed("analytics")) {
      // Google Analytics Code hier
      console.log(
        "🔍 Analytics Cookies akzeptiert - GA kann initialisiert werden"
      );
    }
  },

  // Marketing-Tools initialisieren (falls erlaubt)
  initializeMarketing: () => {
    if (cookieManager.isAllowed("marketing")) {
      // Facebook Pixel, etc. hier
      console.log(
        "📢 Marketing Cookies akzeptiert - Tracking kann initialisiert werden"
      );
    }
  },
};

// Automatische Initialisierung bei Seitenload
if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    cookieManager.initializeAnalytics();
    cookieManager.initializeMarketing();
  });
}
