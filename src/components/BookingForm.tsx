"use client";

import React, { useState } from "react";
import "@/styles/booking.css";

interface BookingFormProps {
  customerInfo: {
    fullName: string;
    email: string;
    phone: string;
    message: string;
  };
  setCustomerInfo: React.Dispatch<
    React.SetStateAction<{
      fullName: string;
      email: string;
      phone: string;
      message: string;
    }>
  >;
  onBack: () => void;
  onContinue: () => void;
  isLoggedIn?: boolean;
}

export default function BookingForm({
  customerInfo,
  setCustomerInfo,
  onBack,
  onContinue,
  isLoggedIn = false,
}: BookingFormProps) {
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Spezielle Validierung während der Eingabe
    if (name === "fullName") {
      // Erlaube nur Buchstaben und Leerzeichen
      const sanitizedValue = value.replace(/[^a-zA-ZäöüÄÖÜß\s]/g, "");
      setCustomerInfo((prev) => ({
        ...prev,
        [name]: sanitizedValue,
      }));
    } else if (name === "phone") {
      // Erlaube nur Zahlen, '+' und Leerzeichen
      const sanitizedValue = value.replace(/[^\d+\s]/g, "");
      setCustomerInfo((prev) => ({
        ...prev,
        [name]: sanitizedValue,
      }));
    } else {
      // Normales Verhalten für andere Felder
      setCustomerInfo((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Fehler zurücksetzen, wenn der Benutzer zu tippen beginnt
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      fullName: "",
      email: "",
      phone: "",
    };

    // Vollständiger Name validieren
    if (!customerInfo.fullName.trim()) {
      newErrors.fullName = "Bitte geben Sie Ihren Namen ein";
      isValid = false;
    } else if (!/^[a-zA-ZäöüÄÖÜß\s]+$/.test(customerInfo.fullName)) {
      newErrors.fullName = "Der Name darf nur Buchstaben enthalten";
      isValid = false;
    } else if (!customerInfo.fullName.trim().includes(" ")) {
      newErrors.fullName = "Bitte geben Sie Vor- und Nachname ein";
      isValid = false;
    } else if (
      customerInfo.fullName
        .trim()
        .split(" ")
        .filter((word) => word.length > 0).length < 2
    ) {
      newErrors.fullName = "Bitte geben Sie Vor- und Nachname ein";
      isValid = false;
    }

    // Email validieren
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerInfo.email.trim()) {
      newErrors.email = "Bitte geben Sie Ihre E-Mail-Adresse ein";
      isValid = false;
    } else if (!emailRegex.test(customerInfo.email)) {
      newErrors.email = "Bitte geben Sie eine gültige E-Mail-Adresse ein";
      isValid = false;
    }

    // Telefonnummer validieren
    if (!customerInfo.phone.trim()) {
      newErrors.phone = "Bitte geben Sie Ihre Telefonnummer ein";
      isValid = false;
    } else if (!/^[\d+\s]+$/.test(customerInfo.phone)) {
      newErrors.phone = "Die Telefonnummer darf nur Zahlen enthalten";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onContinue();
    }
  };

  return (
    <div className="booking-form-container">
      <h3 className="heading-tertiary">Persönliche Daten</h3>

      {isLoggedIn ? (
        <p className="booking-step-description">
          Sie sind angemeldet. Ihre persönlichen Daten wurden automatisch
          ausgefüllt und können bei Bedarf bearbeitet werden.
        </p>
      ) : (
        <p className="booking-step-description">
          Bitte geben Sie Ihre Kontaktdaten an, damit wir Ihren Termin
          bestätigen können.
        </p>
      )}

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-group">
          <label htmlFor="fullName" className="form-label">
            Vollständiger Name *
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={customerInfo.fullName}
            onChange={handleChange}
            className={`form-input ${errors.fullName ? "input-error" : ""}`}
            placeholder="Vor- und Nachname"
          />
          {errors.fullName && (
            <span className="error-message">{errors.fullName}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            E-Mail *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={customerInfo.email}
            onChange={handleChange}
            className={`form-input ${errors.email ? "input-error" : ""}`}
            placeholder="ihre-email@beispiel.de"
          />
          {errors.email && (
            <span className="error-message">{errors.email}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="phone" className="form-label">
            Telefonnummer *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={customerInfo.phone}
            onChange={handleChange}
            className={`form-input ${errors.phone ? "input-error" : ""}`}
            placeholder="+49 123 456789"
          />
          {errors.phone && (
            <span className="error-message">{errors.phone}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="message" className="form-label">
            Nachricht (optional)
          </label>
          <textarea
            id="message"
            name="message"
            value={customerInfo.message}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Besondere Wünsche oder Anmerkungen"
            rows={4}
          ></textarea>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onBack} className="btn btn-secondary">
            Zurück
          </button>
          <button type="submit" className="btn btn-primary">
            Weiter
          </button>
        </div>
      </form>
    </div>
  );
}
