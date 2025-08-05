import React from 'react';
import Link from 'next/link';
import '@/styles/booking.css';

export default function LoginRequired() {
  return (
    <div className="login-required-container">
      <div className="login-required-content">
        <div className="login-required-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-24 w-24 text-[#b2d8db]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h2 className="login-required-title">Anmeldung erforderlich</h2>
        <p className="login-required-text">
          Um einen Termin zu buchen, müssen Sie sich zuerst anmelden. Nach der Anmeldung können Sie
          Ihre Buchung fortsetzen.
        </p>
        <div className="login-required-buttons">
          <Link href="/login" className="btn--primary">
            Anmelden
          </Link>
          <Link href="/register" className="btn--secondary">
            Registrieren
          </Link>
        </div>
      </div>
    </div>
  );
}
