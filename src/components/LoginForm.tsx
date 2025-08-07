'use client';

import React, { useState, useEffect } from 'react';
import {
  loginCustomer,
  resetPassword,
  signInWithGoogle,
  signInWithProvider,
} from '@/utils/firebase-config';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface LoginFormProps {
  onLoginSuccess?: () => void;
  initialResetMode?: boolean;
}

export default function LoginForm({ onLoginSuccess, initialResetMode = false }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(initialResetMode);
  const router = useRouter();

  // Debugging für Render-Zyklen
  console.log('LoginForm wird gerendert mit showResetPassword =', showResetPassword);
  console.log('initialResetMode =', initialResetMode);

  // Setze showResetPassword basierend auf initialResetMode
  useEffect(() => {
    console.log('useEffect: initialResetMode =', initialResetMode);
    setShowResetPassword(initialResetMode);
  }, [initialResetMode]);

  // Prüfe, ob eine Erfolgsanzeige für das Passwort-Reset gespeichert ist
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const resetSuccess = sessionStorage.getItem('resetSuccess');
      if (resetSuccess) {
        setSuccess(resetSuccess);
        // Erfolgsanzeige aus sessionStorage löschen, damit sie nicht nochmal angezeigt wird
        sessionStorage.removeItem('resetSuccess');
      }
    }
  }, []);

  // Funktion zur Übersetzung von Firebase-Fehlercodes in benutzerfreundliche Meldungen
  const getReadableErrorMessage = (errorMessage: string): string => {
    if (
      errorMessage.includes('auth/invalid-credential') ||
      errorMessage.includes('auth/wrong-password') ||
      errorMessage.includes('auth/user-not-found')
    ) {
      return 'E-Mail oder Passwort ist falsch. Bitte überprüfen Sie Ihre Eingaben.';
    } else if (errorMessage.includes('auth/too-many-requests')) {
      return 'Zu viele fehlgeschlagene Anmeldeversuche. Bitte versuchen Sie es später erneut oder setzen Sie Ihr Passwort zurück.';
    } else if (errorMessage.includes('auth/user-disabled')) {
      return 'Dieses Konto wurde deaktiviert. Bitte kontaktieren Sie den Support.';
    } else if (errorMessage.includes('auth/invalid-email')) {
      return 'Ungültiges E-Mail-Format. Bitte geben Sie eine gültige E-Mail-Adresse ein.';
    } else if (errorMessage.includes('auth/email-already-in-use')) {
      return 'Diese E-Mail-Adresse wird bereits verwendet. Bitte versuchen Sie sich anzumelden oder nutzen Sie die Passwort-Vergessen-Funktion.';
    } else {
      // Generische Fehlermeldung für andere Fehler
      return 'Bei der Anmeldung ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await loginCustomer(email, password);

      if (result.success) {
        setSuccess('Anmeldung erfolgreich!');

        // Bei erfolgreicher Anmeldung Callback aufrufen oder zur Profilseite navigieren
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          router.push('/profile');
        }
      } else {
        // Firebase-Fehlermeldung in benutzerfreundliche Meldung übersetzen
        setError(
          result.error
            ? getReadableErrorMessage(result.error)
            : 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.'
        );
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google.com') => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await signInWithProvider(provider);

      if (result.success) {
        setSuccess('Anmeldung erfolgreich!');

        // Bei erfolgreicher Anmeldung Callback aufrufen oder zur Profilseite navigieren
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          router.push('/profile');
        }
      } else {
        // Verbesserte Fehlerbehandlung für spezifische Firebase-Fehler
        if (result.error) {
          setError(getReadableErrorMessage(result.error));
        } else {
          setError(`Anmeldung mit Google fehlgeschlagen.`);
        }
        console.error(`${provider} login error:`, result.error);
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      console.error(`${provider} login unexpected error:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verhindere, dass das Formular abgesendet wird, wenn keine E-Mail eingegeben wurde
    if (!email) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse ein');
      return;
    }

    // Einfache E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      console.log('Sende Passwort-Reset-Anfrage für:', email);
      const result = await resetPassword(email);

      if (result.success) {
        console.log('Passwort-Reset-Anfrage erfolgreich gesendet');
        // Direkt den Erfolgs-State setzen und nach einem Timeout das Formular umschalten
        setSuccess(
          'Eine E-Mail zum Zurücksetzen des Passworts wurde an Sie gesendet. Bitte überprüfen Sie Ihren Posteingang und auch den Spam-Ordner.'
        );
        setError(null);

        // Nach 5 Sekunden zum Login-Formular zurückkehren
        setTimeout(() => {
          setShowResetPassword(false);
        }, 5000);
      } else {
        console.error('Passwort-Reset-Anfrage fehlgeschlagen:', result.error);
        // Verbesserte Fehlerbehandlung für spezifische Firebase-Fehler
        if (result.error) {
          // Wenn "user-not-found", trotzdem positive Meldung zeigen (Sicherheitsgründe)
          if (result.error.includes('Es wurde kein Konto mit dieser E-Mail-Adresse gefunden')) {
            // Direkt den Erfolgs-State setzen und nach einem Timeout das Formular umschalten
            setSuccess(
              'Aus Sicherheitsgründen informieren wir Sie, dass eine E-Mail gesendet wurde, falls ein Konto mit dieser Adresse existiert.'
            );
            setError(null);

            // Nach 5 Sekunden zum Login-Formular zurückkehren
            setTimeout(() => {
              setShowResetPassword(false);
            }, 5000);
          } else {
            setError(getReadableErrorMessage(result.error));
          }
        } else {
          setError('Passwort-Reset fehlgeschlagen. Bitte überprüfen Sie Ihre E-Mail-Adresse.');
        }
      }
    } catch (err) {
      console.error('Unerwarteter Fehler beim Passwort-Reset:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  // Stop-Event-Propagation-Helfer für alle Button-Klicks
  const handleButtonClick = (e: React.MouseEvent, callback: () => void, buttonName: string) => {
    // Verhindere Standardverhalten und Propagation
    e.preventDefault();
    e.stopPropagation();

    // Protokolliere den Klick
    console.log(`${buttonName} Button geklickt`);

    // Führe den Callback aus
    callback();
  };

  return (
    <div className="login-body">
      {/* Debug-Anzeige */}
      <div style={{ display: 'none' }}>
        <p>Debug: showResetPassword = {String(showResetPassword)}</p>
        <p>Debug: initialResetMode = {String(initialResetMode)}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md text-lg border border-red-300 shadow-sm">
          <div className="flex items-center">
            <svg
              className="w-6 h-6 mr-2 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md text-lg border border-green-300 shadow-sm">
          <div className="flex items-center">
            <svg
              className="w-6 h-6 mr-2 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span>{success}</span>
          </div>
        </div>
      )}

      {!showResetPassword ? (
        <>
          {/* Social Login Buttons */}
          <div className="social-login-container">
            <button
              type="button"
              onClick={(e) => handleButtonClick(e, () => handleSocialLogin('google.com'), 'Google')}
              className="social-button social-button-google"
              disabled={isLoading}
              aria-label="Mit Google anmelden"
            >
              <div className="social-button-content">
                <svg
                  className="social-button-icon"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path
                      fill="#4285F4"
                      d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                    />
                    <path
                      fill="#34A853"
                      d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                    />
                  </g>
                </svg>
                <span className="social-button-text">Mit Google anmelden</span>
              </div>
            </button>
          </div>

          <div className="login-divider">
            <div className="login-divider-line"></div>
            <span className="login-divider-text">oder</span>
            <div className="login-divider-line"></div>
          </div>

          {/* Passwort vergessen Button außerhalb des Formulars */}
          <div className="flex justify-end mb-6">
            <button
              type="button"
              onClick={(e) =>
                handleButtonClick(
                  e,
                  () => {
                    setShowResetPassword(true);
                    console.log('showResetPassword wurde auf true gesetzt');
                  },
                  'Passwort vergessen'
                )
              }
              className="login-link"
            >
              Passwort vergessen?
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="login-form-group">
              <label htmlFor="email" className="login-label">
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="login-input"
                placeholder="ihre@email.de"
              />
            </div>

            <div className="login-form-group">
              <label htmlFor="password" className="login-label">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={isLoading} className="login-button">
              {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
            </button>

            <div className="login-footer">
              <p className="text-lg text-gray-600">
                Noch kein Konto?{' '}
                <button
                  type="button"
                  onClick={(e) =>
                    handleButtonClick(e, () => router.push('/register'), 'Jetzt registrieren')
                  }
                  className="login-link"
                >
                  Jetzt registrieren
                </button>
              </p>
            </div>
          </form>
        </>
      ) : (
        <div className="password-reset-container">
          <h3 className="text-xl font-semibold mb-4">Passwort zurücksetzen</h3>
          <p className="mb-4 text-gray-600">
            Geben Sie Ihre E-Mail-Adresse ein, und wir senden Ihnen einen Link zum Zurücksetzen
            Ihres Passworts.
          </p>

          <form onSubmit={handlePasswordReset}>
            <div className="login-form-group">
              <label htmlFor="reset-email" className="login-label">
                E-Mail
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="login-input"
                placeholder="ihre@email.de"
              />
            </div>

            <button type="submit" disabled={isLoading} className="login-button mb-4">
              {isLoading ? 'Wird gesendet...' : 'Passwort zurücksetzen'}
            </button>

            <button
              type="button"
              onClick={(e) =>
                handleButtonClick(
                  e,
                  () => {
                    setShowResetPassword(false);
                    console.log('showResetPassword wurde auf false gesetzt');
                  },
                  'Zurück zur Anmeldung'
                )
              }
              className="login-button bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              Zurück zur Anmeldung
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
