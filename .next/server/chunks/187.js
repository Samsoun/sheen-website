exports.id=187,exports.ids=[187],exports.modules={257:(e,n,t)=>{Promise.resolve().then(t.t.bind(t,2994,23)),Promise.resolve().then(t.t.bind(t,6114,23)),Promise.resolve().then(t.t.bind(t,9727,23)),Promise.resolve().then(t.t.bind(t,9671,23)),Promise.resolve().then(t.t.bind(t,1868,23)),Promise.resolve().then(t.t.bind(t,4759,23))},7923:(e,n,t)=>{Promise.resolve().then(t.t.bind(t,4064,23)),Promise.resolve().then(t.bind(t,1707)),Promise.resolve().then(t.bind(t,198)),Promise.resolve().then(t.bind(t,4241))},1707:(e,n,t)=>{"use strict";t.d(n,{default:()=>s});var i=t(326),o=t(7577);let s=()=>{let[e,n]=(0,o.useState)(!1),[t,s]=(0,o.useState)(!1);return((0,o.useEffect)(()=>{s(!0),localStorage.getItem("cookieConsent")||n(!0)},[]),t)?i.jsx(i.Fragment,{children:e&&i.jsx("div",{className:"cookie-banner",children:(0,i.jsxs)("div",{className:"cookie-content",children:[i.jsx("h3",{children:"Cookie-Hinweis"}),i.jsx("p",{children:"Wir verwenden Cookies, um Ihre Erfahrung auf unserer Website zu verbessern. Durch die weitere Nutzung unserer Website stimmen Sie der Verwendung von Cookies zu."}),(0,i.jsxs)("div",{className:"cookie-buttons",children:[i.jsx("button",{onClick:e=>{e.preventDefault(),localStorage.setItem("cookieConsent","accepted"),n(!1)},className:"btn-accept",children:"Akzeptieren"}),i.jsx("button",{onClick:e=>{e.preventDefault(),localStorage.setItem("cookieConsent","declined"),n(!1)},className:"btn-decline",children:"Ablehnen"})]}),i.jsx("a",{href:"/datenschutz",className:"cookie-link",children:"Mehr erfahren"})]})})}):null}},198:(e,n,t)=>{"use strict";t.d(n,{default:()=>a});var i=t(326),o=t(7577),s=t(434);let r={necessary:!0,analytics:!1,marketing:!1,preferences:!1},c={setConsent:e=>{let n={...r,...e};localStorage.setItem("sheen-cookie-consent",JSON.stringify(n)),localStorage.setItem("sheen-cookie-consent-date",new Date().toISOString()),window.dispatchEvent(new CustomEvent("cookieConsentChange",{detail:n}))},getConsent:()=>{try{let e=localStorage.getItem("sheen-cookie-consent");if(!e)return null;if("accepted"===e)return{necessary:!0,analytics:!0,marketing:!0,preferences:!0};if("declined"===e)return r;return JSON.parse(e)}catch{return null}},isAllowed:e=>{let n=c.getConsent();return!!n&&n[e]},clearConsent:()=>{localStorage.removeItem("sheen-cookie-consent"),localStorage.removeItem("sheen-cookie-consent-date")},isConsentExpired:()=>{let e=localStorage.getItem("sheen-cookie-consent-date");if(!e)return!0;let n=new Date(e);return(new Date().getTime()-n.getTime())/2592e6>12},initializeAnalytics:()=>{c.isAllowed("analytics")&&console.log("\uD83D\uDD0D Analytics Cookies akzeptiert - GA kann initialisiert werden")},initializeMarketing:()=>{c.isAllowed("marketing")&&console.log("\uD83D\uDCE2 Marketing Cookies akzeptiert - Tracking kann initialisiert werden")}},a=()=>{let[e,n]=(0,o.useState)(!1),[t,r]=(0,o.useState)(!1),[a,l]=(0,o.useState)(!1);(0,o.useEffect)(()=>{let e=c.getConsent(),t=c.isConsentExpired();if(!e||t){let e=setTimeout(()=>{n(!0),r(!0)},1500);return()=>clearTimeout(e)}},[]);let d=()=>{console.log("\uD83C\uDF6A Cookie-Popup wird geschlossen"),r(!1),setTimeout(()=>{n(!1)},300)};return((0,o.useEffect)(()=>{},[]),e)?i.jsx(i.Fragment,{children:(0,i.jsxs)("div",{className:`cookie-consent ${t?"animate-in":"animate-out"}`,children:[(0,i.jsxs)("div",{className:"cookie-content",children:[i.jsx("div",{className:"cookie-icon",children:"\uD83C\uDF6A"}),(0,i.jsxs)("div",{className:"cookie-text",children:[i.jsx("h3",{className:"cookie-title",children:"Wir respektieren Ihre Privatsph\xe4re"}),(0,i.jsxs)("p",{className:"cookie-description",children:["Diese Website verwendet Cookies f\xfcr Funktionalit\xe4t und Analyse."," ",i.jsx(s.default,{href:"/datenschutz",className:"cookie-link",children:"Datenschutzerkl\xe4rung"})," • ",i.jsx(s.default,{href:"/impressum",className:"cookie-link",children:"Impressum"})]})]}),(0,i.jsxs)("div",{className:"cookie-actions",children:[i.jsx("button",{onClick:()=>{c.setConsent({necessary:!0,analytics:!1,marketing:!1,preferences:!1}),d()},className:"cookie-btn cookie-btn-necessary",children:"Nur notwendige"}),i.jsx("button",{onClick:()=>{c.setConsent({necessary:!0,analytics:!0,marketing:!0,preferences:!0}),d()},className:"cookie-btn cookie-btn-accept",children:"Alle akzeptieren"})]})]}),i.jsx("button",{onClick:d,className:"cookie-close","aria-label":"Cookie-Banner schlie\xdfen",children:"\xd7"})]})}):null}},4241:(e,n,t)=>{"use strict";function i(){return null}t.d(n,{default:()=>i}),t(7577)},7919:(e,n,t)=>{"use strict";t.r(n),t.d(n,{default:()=>d,metadata:()=>l});var i=t(9510);t(5023);var o=t(9720),s=t(8570);let r=(0,s.createProxy)(String.raw`/Users/sbehaein/Desktop/Sheenweb2 Versionen/Version mit login (18.03.2025)/src/components/CookieBanner.tsx#default`),c=(0,s.createProxy)(String.raw`/Users/sbehaein/Desktop/Sheenweb2 Versionen/Version mit login (18.03.2025)/src/components/CookieConsent.tsx#default`),a=(0,s.createProxy)(String.raw`/Users/sbehaein/Desktop/Sheenweb2 Versionen/Version mit login (18.03.2025)/src/components/StickyNavigation.tsx#default`),l={title:"Sheen — Smile through eyes",description:"Sheen is your go-to cosmetic studio for expert microblading and eyelashing services. Enhance your natural beauty and let your eyes shine with confidence. Book your appointment today!"};function d({children:e}){return(0,i.jsxs)("html",{lang:"en",children:[(0,i.jsxs)("head",{children:[i.jsx("meta",{name:"cookie-consent",content:"ignore"}),i.jsx("meta",{name:"cookie-notice",content:"disabled"}),i.jsx("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),i.jsx("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"}),i.jsx("link",{href:"https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&display=swap",rel:"stylesheet"}),i.jsx("script",{type:"module",src:"https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"}),i.jsx("script",{noModule:!0,src:"https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"}),i.jsx("script",{defer:!0,src:"https://unpkg.com/smoothscroll-polyfill@0.4.4/dist/smoothscroll.min.js"})]}),(0,i.jsxs)("body",{children:[i.jsx("main",{children:e}),i.jsx(r,{}),i.jsx(c,{}),i.jsx(a,{}),i.jsx(o.default,{id:"fix-navigation",strategy:"afterInteractive",children:`
            // Diese Funktion entfernt unerw\xfcnschte Event-Listener, die die Navigation blockieren k\xf6nnten
            function fixNavigation() {
              if (typeof window === 'undefined') return;
              
              try {
                console.log('Navigation-Fix wird angewendet...');
                
                // Finde alle Navigation-Links
                const navLinks = document.querySelectorAll('.main-nav-link');
                
                // Stelle sicher, dass alle Links richtig funktionieren
                navLinks.forEach(link => {
                  if (link.tagName === 'A') {
                    // Stelle sicher, dass der Link in einem neuen Tab ge\xf6ffnet wird, wenn er ein externes Ziel hat
                    const href = link.getAttribute('href');
                    if (href && (href.startsWith('http') || href.startsWith('https'))) {
                      link.setAttribute('target', '_blank');
                      link.setAttribute('rel', 'noopener noreferrer');
                    }
                  }
                  
                  // Entferne alle onClick-Attribute, die m\xf6glicherweise die Standardfunktion blockieren
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
            
            // Nach einer kurzen Verz\xf6gerung ausf\xfchren
            setTimeout(fixNavigation, 1000);
            
            // Und nochmal nach dem vollst\xe4ndigen Laden der Seite
            window.addEventListener('load', function() {
              setTimeout(fixNavigation, 500);
            });
          `}),i.jsx(o.default,{id:"remove-external-cookie-notices",strategy:"lazyOnload",children:`
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
                    // Zus\xe4tzliche Sicherheitspr\xfcfung: Nicht unsere Komponenten entfernen
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
            
            // Nur einmal beim Laden ausf\xfchren
            if (typeof window !== 'undefined') {
              if (document.readyState === 'complete' || document.readyState === 'interactive') {
                setTimeout(removeExternalCookieNotices, 1000);
              } else {
                document.addEventListener('DOMContentLoaded', function() {
                  setTimeout(removeExternalCookieNotices, 1000);
                });
              }
            }
          `})]})]})}},5023:()=>{}};