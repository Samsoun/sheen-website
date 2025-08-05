2:I[9107,[],"ClientPageRoot"]
3:I[8472,["358","static/chunks/bc9e92e6-bdb779df96772fe6.js","657","static/chunks/5650b5f8-374501359e77ccc4.js","432","static/chunks/432-3bf0f582c4811944.js","108","static/chunks/108-8ed2d2239abb151a.js","898","static/chunks/app/admin/calendar/page-784b201a0c826456.js"],"default",1]
4:I[4707,[],""]
5:I[6423,[],""]
6:I[5404,["648","static/chunks/648-8eae6b87a6a19d34.js","185","static/chunks/app/layout-678ddef4e0d124ad.js"],"default"]
7:I[9412,["648","static/chunks/648-8eae6b87a6a19d34.js","185","static/chunks/app/layout-678ddef4e0d124ad.js"],"default"]
8:I[7839,["648","static/chunks/648-8eae6b87a6a19d34.js","185","static/chunks/app/layout-678ddef4e0d124ad.js"],"default"]
9:I[8003,["648","static/chunks/648-8eae6b87a6a19d34.js","185","static/chunks/app/layout-678ddef4e0d124ad.js"],""]
a:Tba7,
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
          b:T9a9,
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
          0:["WyPhJ7U96xrXvc5_xhzs0",[[["",{"children":["admin",{"children":["calendar",{"children":["__PAGE__",{}]}]}]},"$undefined","$undefined",true],["",{"children":["admin",{"children":["calendar",{"children":["__PAGE__",{},[["$L1",["$","$L2",null,{"props":{"params":{},"searchParams":{}},"Component":"$3"}],null],null],null]},[null,["$","$L4",null,{"parallelRouterKey":"children","segmentPath":["children","admin","children","calendar","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L5",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[null,["$","$L4",null,{"parallelRouterKey":"children","segmentPath":["children","admin","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L5",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/7f2aba5ee38a9cf2.css","precedence":"next","crossOrigin":"$undefined"}],["$","link","1",{"rel":"stylesheet","href":"/_next/static/css/457cbc6219834ed5.css","precedence":"next","crossOrigin":"$undefined"}],["$","link","2",{"rel":"stylesheet","href":"/_next/static/css/c7f42d93748356f8.css","precedence":"next","crossOrigin":"$undefined"}],["$","link","3",{"rel":"stylesheet","href":"/_next/static/css/da5c1811a349496a.css","precedence":"next","crossOrigin":"$undefined"}],["$","link","4",{"rel":"stylesheet","href":"/_next/static/css/7ddca07e626132f6.css","precedence":"next","crossOrigin":"$undefined"}],["$","link","5",{"rel":"stylesheet","href":"/_next/static/css/7b38f284b8191e92.css","precedence":"next","crossOrigin":"$undefined"}],["$","link","6",{"rel":"stylesheet","href":"/_next/static/css/ba1cdd3773e5b4b2.css","precedence":"next","crossOrigin":"$undefined"}]],["$","html",null,{"lang":"en","children":[["$","head",null,{"children":[["$","meta",null,{"name":"cookie-consent","content":"ignore"}],["$","meta",null,{"name":"cookie-notice","content":"disabled"}],["$","link",null,{"rel":"preconnect","href":"https://fonts.googleapis.com"}],["$","link",null,{"rel":"preconnect","href":"https://fonts.gstatic.com","crossOrigin":"anonymous"}],["$","link",null,{"href":"https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&display=swap","rel":"stylesheet"}],["$","script",null,{"type":"module","src":"https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"}],["$","script",null,{"noModule":true,"src":"https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"}],["$","script",null,{"defer":true,"src":"https://unpkg.com/smoothscroll-polyfill@0.4.4/dist/smoothscroll.min.js"}]]}],["$","body",null,{"children":[["$","main",null,{"children":["$","$L4",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L5",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],"notFoundStyles":[]}]}],["$","$L6",null,{}],["$","$L7",null,{}],["$","$L8",null,{}],["$","$L9",null,{"id":"fix-navigation","strategy":"afterInteractive","children":"$a"}],["$","$L9",null,{"id":"remove-external-cookie-notices","strategy":"lazyOnload","children":"$b"}]]}]]}]],null],null],["$Lc",null]]]]
c:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}],["$","title","2",{"children":"Sheen — Smile through eyes"}],["$","meta","3",{"name":"description","content":"Sheen is your go-to cosmetic studio for expert microblading and eyelashing services. Enhance your natural beauty and let your eyes shine with confidence. Book your appointment today!"}]]
1:null
