'use client';

import React, { useState } from 'react';
import { registerCustomer } from '@/utils/firebase-config';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | React.ReactNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) return 'Bitte geben Sie Ihren Vornamen ein.';
    if (!formData.lastName.trim()) return 'Bitte geben Sie Ihren Nachnamen ein.';
    if (!formData.email.trim()) return 'Bitte geben Sie Ihre E-Mail-Adresse ein.';
    if (!/\S+@\S+\.\S+/.test(formData.email))
      return 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
    if (!formData.password) return 'Bitte geben Sie ein Passwort ein.';
    if (formData.password.length < 8) return 'Das Passwort muss mindestens 8 Zeichen lang sein.';
    if (formData.password !== formData.confirmPassword)
      return 'Die Passwörter stimmen nicht überein.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Benutzer registrieren - nur mit den wesentlichen Daten
      const registrationResult = await registerCustomer(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: '', // Leerer Wert für Telefonnummer
        birthdate: '', // Leerer Wert für Geburtsdatum
      });

      if (!registrationResult.success) {
        // Bessere Fehlermeldung für bereits existierende E-Mail-Adressen
        if (registrationResult.error?.includes('auth/email-already-in-use')) {
          setError(
            <div>
              Diese E-Mail-Adresse ist bereits registriert. Bitte{' '}
              <button type="button" onClick={() => router.push('/login')} className="login-link">
                melden Sie sich an
              </button>{' '}
              oder{' '}
              <button
                type="button"
                onClick={() => router.push('/login?reset=true')}
                className="login-link"
              >
                setzen Sie Ihr Passwort zurück
              </button>
              .
            </div>
          );
        } else {
          setError(
            registrationResult.error ||
              'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.'
          );
        }
        return;
      }

      // Zur Login-Seite weiterleiten
      router.push('/login?registered=true');
    } catch (err) {
      // Prüfen auf Firebase-Fehler
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';

      if (errorMessage.includes('auth/email-already-in-use')) {
        setError(
          <div>
            Diese E-Mail-Adresse ist bereits registriert. Bitte{' '}
            <button type="button" onClick={() => router.push('/login')} className="login-link">
              melden Sie sich an
            </button>{' '}
            oder{' '}
            <button
              type="button"
              onClick={() => router.push('/login?reset=true')}
              className="login-link"
            >
              setzen Sie Ihr Passwort zurück
            </button>
            .
          </div>
        );
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      }
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-body">
      {error && <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md text-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="login-form-group">
          <label htmlFor="firstName" className="login-label">
            Vorname *
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="login-input"
            placeholder="Ihr Vorname"
          />
        </div>

        <div className="login-form-group">
          <label htmlFor="lastName" className="login-label">
            Nachname *
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="login-input"
            placeholder="Ihr Nachname"
          />
        </div>

        <div className="login-form-group">
          <label htmlFor="email" className="login-label">
            E-Mail *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="login-input"
            placeholder="ihre@email.de"
          />
        </div>

        <div className="login-form-group">
          <label htmlFor="password" className="login-label">
            Passwort *
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
            className="login-input"
            placeholder="Mindestens 8 Zeichen"
          />
        </div>

        <div className="login-form-group">
          <label htmlFor="confirmPassword" className="login-label">
            Passwort bestätigen *
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="login-input"
            placeholder="Passwort wiederholen"
          />
        </div>

        <div className="pt-4">
          <button type="submit" disabled={isLoading} className="login-button">
            {isLoading ? 'Wird registriert...' : 'Registrieren'}
          </button>
        </div>

        <div className="login-footer">
          <p className="text-lg text-gray-600">
            Bereits registriert?{' '}
            <Link href="/login" className="login-link">
              Jetzt anmelden
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
