'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logoutCustomer } from '@/utils/firebase-config';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logoutCustomer();
        console.log('Benutzer abgemeldet');
        router.push('/');
      } catch (error) {
        console.error('Fehler beim Abmelden:', error);
        // Trotz Fehler zur Startseite weiterleiten
        router.push('/');
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-t-4 border-pink-500 border-solid rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600">Abmeldung läuft...</p>
    </div>
  );
}
