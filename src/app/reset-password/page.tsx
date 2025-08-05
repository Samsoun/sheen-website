'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { confirmPasswordReset } from '@/utils/firebase-config';
import '@/styles/login.css';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [manualCodeInput, setManualCodeInput] = useState<string>('');

  const searchParams = useSearchParams();
  const router = useRouter();

  // Auf der Client-Seite ausführen, wenn die Komponente geladen wird
  useEffect(() => {
    // Sofort nach dem Code suchen, ohne Ladezustand
    try {
      console.log('Suche nach Reset-Code in URL...');

      // Aus SearchParams
      const code = searchParams.get('oobCode');
      const mode = searchParams.get('mode');
      const apiKey = searchParams.get('apiKey');

      console.log('Gefundene Parameter:', {
        oobCode: code,
        mode,
        apiKey,
      });

      if (code) {
        console.log('oobCode in SearchParams gefunden:', code);
        setOobCode(code);
        return;
      }

      // Aus window.location.search (als Fallback)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const codeFromUrl = urlParams.get('oobCode');

        if (codeFromUrl) {
          console.log('oobCode in URLSearchParams gefunden:', codeFromUrl);
          setOobCode(codeFromUrl);
          return;
        }

        // Aus dem gesamten URL-String
        const fullUrl = window.location.href;
        console.log('Volle URL:', fullUrl);

        const oobMatch = fullUrl.match(/oobCode=([^&]+)/);
        if (oobMatch && oobMatch[1]) {
          console.log('oobCode in URL-String gefunden:', oobMatch[1]);
          setOobCode(oobMatch[1]);
          return;
        }
      }

      console.log('Kein oobCode gefunden, setze Fehlermeldung');
      setError(
        'Es wurde kein Reset-Code in der URL gefunden. Sie können einen neuen Reset-Link anfordern oder den Code manuell eingeben, falls Sie ihn haben.'
      );
    } catch (err) {
      console.error('Fehler beim Extrahieren des Reset-Codes:', err);
      setError(
        'Beim Verarbeiten des Reset-Links ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder fordern Sie einen neuen Reset-Link an.'
      );
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Wenn manuelle Eingabe verwendet wurde und oobCode noch nicht gesetzt ist
    const codeToUse = oobCode || manualCodeInput;

    if (!codeToUse) {
      setError('Bitte geben Sie einen Reset-Code ein oder fordern Sie einen neuen Reset-Link an.');
      return;
    }

    // Validierung der Passwörter
    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Versuche Passwort zurückzusetzen mit Code:', codeToUse);
      const result = await confirmPasswordReset(codeToUse, password);

      if (result.success) {
        console.log('Passwort erfolgreich zurückgesetzt');
        setSuccess(true);
        // Nach 3 Sekunden zur Login-Seite weiterleiten
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        console.error('Fehler beim Zurücksetzen des Passworts:', result.error);
        setError(
          result.error ||
            'Fehler beim Zurücksetzen des Passworts. Bitte fordern Sie einen neuen Link an.'
        );
      }
    } catch (err) {
      console.error('Unerwarteter Fehler beim Passwort-Reset:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="w-full max-w-2xl mx-auto px-6">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">Passwort zurücksetzen</h1>
            <p className="login-subtitle">Geben Sie Ihr neues Passwort ein</p>
          </div>

          <div className="login-body">
            {success ? (
              <div className="p-4 bg-green-100 text-green-700 rounded-md text-lg">
                <p>Ihr Passwort wurde erfolgreich zurückgesetzt!</p>
                <p className="mt-2">Sie werden in Kürze zur Anmeldeseite weitergeleitet...</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md text-lg">
                    {error}
                    <div className="mt-2">
                      <button
                        onClick={() => router.push('/login?reset=true')}
                        className="login-link"
                      >
                        Neuen Reset-Link anfordern
                      </button>
                    </div>
                  </div>
                )}

                {!oobCode && (
                  <div className="mb-6 p-4 bg-yellow-50 text-yellow-700 rounded-md">
                    <p className="mb-2">
                      Wenn Sie einen Reset-Code in der E-Mail oder URL haben, geben Sie ihn hier
                      ein:
                    </p>
                    <div className="flex">
                      <input
                        type="text"
                        placeholder="Reset-Code eingeben"
                        className="login-input mr-2"
                        value={manualCodeInput}
                        onChange={(e) => setManualCodeInput(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="login-form-group">
                    <label htmlFor="password" className="login-label">
                      Neues Passwort
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="login-input"
                      placeholder="Mindestens 8 Zeichen"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Das Passwort muss mindestens 8 Zeichen lang sein
                    </p>
                  </div>

                  <div className="login-form-group">
                    <label htmlFor="confirmPassword" className="login-label">
                      Passwort bestätigen
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="login-input"
                      placeholder="Passwort wiederholen"
                    />
                  </div>

                  <button type="submit" disabled={isLoading} className="login-button mt-6">
                    {isLoading ? 'Wird zurückgesetzt...' : 'Passwort zurücksetzen'}
                  </button>
                </form>

                <div className="login-footer mt-8">
                  <p className="text-lg text-gray-600">
                    Zurück zur{' '}
                    <button
                      type="button"
                      onClick={() => router.push('/login')}
                      className="login-link"
                    >
                      Anmeldeseite
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
