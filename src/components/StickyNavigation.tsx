"use client";

import { useEffect } from "react";

export default function StickyNavigation() {
  useEffect(() => {
    const handleStickyNav = () => {
      const featuredSection = document.querySelector(".section-featured");
      const header = document.querySelector(".header");

      if (!featuredSection || !header) {
        // Sticky Navigation ist nur auf der Hauptseite verfügbar
        return;
      }

      let lastScrollPosition = 0;
      let ticking = false;

      function checkScroll() {
        const currentScrollPos = window.scrollY;
        const featuredRect = featuredSection?.getBoundingClientRect();

        // Verhindern zu vieler Berechnungen (Performance-Verbesserung)
        if (!ticking && featuredRect) {
          window.requestAnimationFrame(function () {
            if (featuredRect.top <= 0) {
              // Füge zuerst nav-hidden hinzu (Header wird versteckt)
              if (!document.body.classList.contains("sticky")) {
                header?.classList.add("nav-hidden");

                // Nach kurzer Verzögerung sticky hinzufügen (Header erscheint sanft)
                setTimeout(() => {
                  document.body.classList.add("sticky");
                  // Entferne nav-hidden nach einer weiteren kurzen Verzögerung
                  setTimeout(() => {
                    header?.classList.remove("nav-hidden");
                  }, 50);
                }, 50);
              }
            } else {
              document.body.classList.remove("sticky");
            }

            lastScrollPosition = currentScrollPos;
            ticking = false;
          });

          ticking = true;
        }
      }

      // Initialer Check
      checkScroll();

      // Event-Listener für Scroll
      window.addEventListener("scroll", checkScroll);

      // Cleanup-Funktion
      return () => {
        window.removeEventListener("scroll", checkScroll);
      };
    };

    // Nach einer kurzen Verzögerung starten
    const timeoutId = setTimeout(handleStickyNav, 500);

    // Cleanup
    return () => clearTimeout(timeoutId);
  }, []);

  // Diese Komponente rendert nichts sichtbares
  return null;
}
