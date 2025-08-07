import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import CookieBanner from "@/components/CookieBanner";
import CookieConsent from "@/components/CookieConsent";
import StickyNavigation from "@/components/StickyNavigation";

export const metadata: Metadata = {
  title: "Sheen — Smile through eyes",
  description:
    "Sheen is your go-to cosmetic studio for expert microblading and eyelashing services. Enhance your natural beauty and let your eyes shine with confidence. Book your appointment today!",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover",
  },
  themeColor: "#b2d8db",
  colorScheme: "light",
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="cookie-consent" content="ignore" />
        <meta name="cookie-notice" content="disabled" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&display=swap"
          rel="stylesheet"
        />
        <script
          type="module"
          src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"
        ></script>
        <script
          noModule
          src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"
        ></script>
        <script
          defer
          src="https://unpkg.com/smoothscroll-polyfill@0.4.4/dist/smoothscroll.min.js"
        ></script>
      </head>
      <body>
        <main>{children}</main>
        <CookieBanner />
        <CookieConsent />
        <StickyNavigation />

        {/* Script, um alte Event-Listener zu entfernen, die möglicherweise die Navigation blockieren */}
        <Script id="fix-navigation" strategy="afterInteractive">
          {`
            // Diese Funktion entfernt unerwünschte Event-Listener, die die Navigation blockieren könnten
            function fixNavigation() {
              if (typeof window === 'undefined') return;
              
              try {
                console.log('Navigation-Fix wird angewendet...');
                
                // Finde alle Navigation-Links
                const navLinks = document.querySelectorAll('.main-nav-link');
                
                // Stelle sicher, dass alle Links richtig funktionieren
                navLinks.forEach(link => {
                  if (link.tagName === 'A') {
                    // Stelle sicher, dass der Link in einem neuen Tab geöffnet wird, wenn er ein externes Ziel hat
                    const href = link.getAttribute('href');
                    if (href && (href.startsWith('http') || href.startsWith('https'))) {
                      link.setAttribute('target', '_blank');
                      link.setAttribute('rel', 'noopener noreferrer');
                    }
                  }
                  
                  // Entferne alle onClick-Attribute, die möglicherweise die Standardfunktion blockieren
                  if (link.hasAttribute('onclick')) {
                    link.removeAttribute('onclick');
                  }
                });

                // Stelle sicher, dass die Links in den Login und Booking-Seiten funktionieren
                const loginLinks = document.querySelectorAll('a[href="/login"], a[href*="/login"], button[onclick*="login"], .login-link');
                const bookingLink = document.querySelector('a[href="/booking"], a[href*="/booking"]');
                
                // Behandle alle Login-Links
                loginLinks.forEach(link => {
                  link.addEventListener('click', function(e) {
                    console.log('Login-Link wurde geklickt, Navigation wird forciert...');
                    e.preventDefault(); // Verhindere das Standardverhalten
                    // Forciere die Navigation
                    window.location.href = '/login';
                  });
                });
                
                if (bookingLink) {
                  bookingLink.addEventListener('click', function(e) {
                    console.log('Booking-Link wurde geklickt, Navigation wird forciert...');
                    // Forciere die Navigation
                    window.location.href = '/booking';
                  });
                }
              } catch (error) {
                console.error('Fehler beim Anwenden des Navigation-Fixes:', error);
              }
            }
            
            // Nach einer kurzen Verzögerung ausführen
            setTimeout(fixNavigation, 1000);
            
            // Und nochmal nach dem vollständigen Laden der Seite
            window.addEventListener('load', function() {
              setTimeout(fixNavigation, 500);
            });
          `}
        </Script>

        {/* Sicheres Script zum Entfernen nur spezifischer externer Cookie-Notices */}
        <Script id="remove-external-cookie-notices" strategy="lazyOnload">
          {`
            // Sichere Funktion zum Entfernen nur spezifischer externer Cookie-Hinweise
            function removeExternalCookieNotices() {
              if (typeof window === 'undefined') return;
              
              try {
                // Nur sehr spezifische externe Cookie-Notices entfernen
                // NICHT unsere eigenen Cookie-Komponenten (.cookie-consent, .cookie-banner)
                const safeSelectors = [
                  '.cookie-notice:not(.cookie-consent):not(.cookie-banner)',
                  '[data-cookie-notice]:not(.cookie-consent):not(.cookie-banner)',
                  '.gdpr-notice:not(.cookie-consent):not(.cookie-banner)',
                  '.privacy-notice:not(.cookie-consent):not(.cookie-banner)'
                ];
                
                safeSelectors.forEach(selector => {
                  const elements = document.querySelectorAll(selector);
                  elements.forEach(element => {
                    // Zusätzliche Sicherheitsprüfung: Nicht unsere Komponenten entfernen
                    if (!element.closest('.cookie-consent') && 
                        !element.closest('.cookie-banner') &&
                        !element.classList.contains('cookie-consent') &&
                        !element.classList.contains('cookie-banner') &&
                        element.tagName !== 'SCRIPT') {
                      
                      // Sanftes Ausblenden statt forciertes Entfernen
                      element.style.display = 'none';
                      element.style.visibility = 'hidden';
                      element.style.opacity = '0';
                      element.style.pointerEvents = 'none';
                      element.setAttribute('aria-hidden', 'true');
                    }
                  });
                });
              } catch (error) {
                console.error('Fehler beim Ausblenden externer Cookie-Hinweise:', error);
              }
            }
            
            // Nur einmal beim Laden ausführen
            if (typeof window !== 'undefined') {
              if (document.readyState === 'complete' || document.readyState === 'interactive') {
                setTimeout(removeExternalCookieNotices, 1000);
              } else {
                document.addEventListener('DOMContentLoaded', function() {
                  setTimeout(removeExternalCookieNotices, 1000);
                });
              }
            }
          `}
        </Script>
      </body>
    </html>
  );
}
