"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const Footer = () => {
  // Update the year in copyright automatically
  useEffect(() => {
    const yearEl = document.querySelector(".year");
    if (yearEl) {
      const currentYear = new Date().getFullYear();
      yearEl.textContent = currentYear.toString();
    }
  }, []);

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Left Column - Company Info */}
          <div className="footer-col company-info">
            <Link href="/" className="footer-logo">
              <Image
                src="/img/logo_sheen.png"
                alt="Sheen Beauty Studio"
                width={80}
                height={80}
                className="footer-img"
                style={{ width: "auto", height: "auto" }}
              />
            </Link>
            <p className="footer-text">
              Enhance your natural beauty with Sheen.
            </p>
            <p className="footer-text">
              Professional microblading, lash lifting, and
            </p>
            <p className="footer-text">
              permanent makeup services in the heart of Berlin.
            </p>
            <div className="opening-hours">
              <p className="hours-title">Opening Hours:</p>
              <p className="hours">Mon - Fri: 10:00 - 19:00</p>
              <p className="hours">Sat: 10:00 - 16:00</p>
            </div>
          </div>

          {/* Middle Column - Visit Us */}
          <div className="footer-col visit-us">
            <h3 className="footer-heading">Visit Us</h3>
            <div className="contact-item">
              <div className="icon-container">
                <ion-icon name="location-outline"></ion-icon>
              </div>
              <p>Kurfürstendamm 63, 10707 Berlin</p>
            </div>
            <div className="contact-item">
              <div className="icon-container">
                <ion-icon name="call-outline"></ion-icon>
              </div>
              <a href="tel:+4917632812602">+49 176-32812602</a>
            </div>
            <div className="contact-item">
              <div className="icon-container">
                <ion-icon name="mail-outline"></ion-icon>
              </div>
              <a href="mailto:kontakt@sheenberlin.de">kontakt@sheenberlin.de</a>
            </div>
          </div>

          {/* Right Column - Quick Links */}
          <div className="footer-col links-section">
            <div className="quick-links">
              <h3 className="footer-heading">Quick Links</h3>
              <ul className="footer-nav">
                <li>
                  <a href="#service">Our Services</a>
                </li>
                <li>
                  <a href="#testimonials">Testimonials</a>
                </li>
                <li>
                  <Link href="/maps">Find us on Maps</Link>
                </li>
                <li>
                  <Link href="/datenschutz">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="/impressum">Impressum</Link>
                </li>
              </ul>
            </div>

            <div className="social-links">
              <h3 className="footer-heading">Follow Us</h3>
              <div className="social-icons">
                <a
                  href="https://www.instagram.com/sheen_beautystudio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit our Instagram page"
                >
                  <div className="social-icon instagram">
                    <ion-icon name="logo-instagram"></ion-icon>
                  </div>
                </a>
                <a
                  href="https://www.facebook.com/sheen.brows"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit our Facebook page"
                >
                  <div className="social-icon facebook">
                    <ion-icon name="logo-facebook"></ion-icon>
                  </div>
                </a>
                <a
                  href="https://www.treatwell.de/ort/sheen-berlin/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Book on Treatwell"
                >
                  <div className="social-icon treatwell">
                    <Image
                      src="/img/treatwell-icon.jpg"
                      alt="Treatwell"
                      width={32}
                      height={32}
                      quality={100}
                    />
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="copyright">
          <p>© 2025 Sheen Beauty Studio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
