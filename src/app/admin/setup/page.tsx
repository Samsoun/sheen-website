'use client';

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/utils/firebase-config';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function AdminSetupPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [adminExists, setAdminExists] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);

      // Prüfen, ob bereits ein Admin existiert
      try {
        const adminsRef = collection(db, 'admins');
        const snapshot = await getDocs(adminsRef);

        if (!snapshot.empty) {
          setAdminExists(true);
        }
      } catch (error) {
        console.error('Fehler beim Prüfen von Admin-Accounts:', error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const createAdminAccount = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Prüfen, ob dieser Benutzer bereits Admin ist
      const adminsRef = collection(db, 'admins');
      const q = query(adminsRef, where('email', '==', user.email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setError('Für diese E-Mail existiert bereits ein Admin-Account.');
        setIsLoading(false);
        return;
      }

      // Neuen Admin erstellen
      await addDoc(collection(db, 'admins'), {
        uid: user.uid,
        email: user.email,
        createdAt: new Date(),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch (error) {
      console.error('Fehler beim Erstellen des Admin-Accounts:', error);
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-4">Lade...</h1>
      </div>
    );
  }

  if (adminExists) {
    return (
      <div className="container max-w-7xl mx-auto px-6 py-10">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Admin-Setup</h1>
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
            <p>
              Es existiert bereits ein Admin-Account. Wenn Sie Zugriff benötigen, kontaktieren Sie
              bitte den bestehenden Administrator.
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
          >
            Zurück zur Startseite
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-6 py-10">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Admin-Setup</h1>

        {success ? (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
            <p>Admin-Account erfolgreich erstellt! Sie werden in Kürze weitergeleitet...</p>
          </div>
        ) : (
          <>
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
              <p className="mb-2">
                Sie sind dabei, einen Admin-Account für die folgende E-Mail zu erstellen:
              </p>
              <p className="font-semibold">{user?.email}</p>
            </div>

            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                <p>{error}</p>
              </div>
            )}

            <button
              onClick={createAdminAccount}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verarbeite...' : 'Admin-Account erstellen'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
