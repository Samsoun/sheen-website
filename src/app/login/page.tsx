'use client';

import { useSearchParams } from 'next/navigation';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  const reset = searchParams.get('reset');

  return (
    <div className="login-container">
      <div className="w-full max-w-2xl mx-auto px-6">
        {registered && (
          <div className="mb-8 p-5 bg-green-100 text-green-700 rounded-md text-center text-lg">
            Registrierung erfolgreich! Sie können sich jetzt anmelden.
          </div>
        )}
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">Anmelden</h1>
            <p className="login-subtitle">Melden Sie sich mit Ihren Zugangsdaten an</p>
          </div>
          <LoginForm initialResetMode={reset === 'true'} />
        </div>
      </div>
    </div>
  );
}
