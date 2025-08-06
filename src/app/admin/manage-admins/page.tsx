"use client";

import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/utils/firebase-config";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

interface Admin {
  id: string;
  uid: string;
  email: string;
  createdAt: any;
}

export default function ManageAdminsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      // Admin-Berechtigungen prüfen
      try {
        const adminsRef = collection(db, "admins");
        const q = query(adminsRef, where("email", "==", user.email));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          // Keine Admin-Berechtigung
          router.push("/profile");
          return;
        }

        setIsAdmin(true);
        await loadAdmins();
      } catch (error) {
        console.error("Fehler beim Prüfen der Admin-Berechtigungen:", error);
        router.push("/profile");
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadAdmins = async () => {
    try {
      const adminsRef = collection(db, "admins");
      const snapshot = await getDocs(adminsRef);

      const adminsList: Admin[] = [];
      snapshot.forEach((doc) => {
        adminsList.push({
          id: doc.id,
          ...doc.data(),
        } as Admin);
      });

      // Nach Erstellungsdatum sortieren
      adminsList.sort((a, b) => a.createdAt?.toDate() - b.createdAt?.toDate());
      setAdmins(adminsList);
    } catch (error) {
      console.error("Fehler beim Laden der Admins:", error);
      setError("Fehler beim Laden der Admin-Liste.");
    }
  };

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAdminEmail.trim()) {
      setError("Bitte geben Sie eine gültige E-Mail-Adresse ein.");
      return;
    }

    setIsAddingAdmin(true);
    setError(null);
    setSuccess(null);

    try {
      // Prüfen, ob bereits ein Admin mit dieser E-Mail existiert
      const adminsRef = collection(db, "admins");
      const q = query(adminsRef, where("email", "==", newAdminEmail.trim()));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setError("Ein Admin mit dieser E-Mail-Adresse existiert bereits.");
        setIsAddingAdmin(false);
        return;
      }

      // Neuen Admin hinzufügen
      await addDoc(collection(db, "admins"), {
        email: newAdminEmail.trim(),
        createdAt: new Date(),
        addedBy: auth.currentUser?.email || "unknown",
      });

      setSuccess(`Admin "${newAdminEmail}" wurde erfolgreich hinzugefügt.`);
      setNewAdminEmail("");
      await loadAdmins(); // Liste aktualisieren
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Admins:", error);
      setError(
        "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut."
      );
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const removeAdmin = async (adminId: string, adminEmail: string) => {
    if (admins.length === 1) {
      setError("Der letzte Admin kann nicht entfernt werden.");
      return;
    }

    if (!confirm(`Möchten Sie den Admin "${adminEmail}" wirklich entfernen?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "admins", adminId));
      setSuccess(`Admin "${adminEmail}" wurde erfolgreich entfernt.`);
      await loadAdmins(); // Liste aktualisieren
    } catch (error) {
      console.error("Fehler beim Entfernen des Admins:", error);
      setError("Ein Fehler ist aufgetreten beim Entfernen des Admins.");
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-6 py-10">
        <div className="flex justify-center items-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Überprüfe Berechtigung...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container max-w-7xl mx-auto px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin-Verwaltung
          </h1>
          <p className="text-gray-600">
            Verwalten Sie die Administrator-Berechtigungen für das System.
          </p>
        </div>

        {/* Navigation zurück */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/admin")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ← Zurück zum Admin-Dashboard
          </button>
        </div>

        {/* Erfolgsmeldung */}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
            <p>{success}</p>
          </div>
        )}

        {/* Fehlermeldung */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Neuen Admin hinzufügen */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Neuen Admin hinzufügen
          </h2>
          <form onSubmit={addAdmin} className="space-y-4">
            <div>
              <label
                htmlFor="adminEmail"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                E-Mail-Adresse des neuen Admins
              </label>
              <input
                type="email"
                id="adminEmail"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Die Person muss sich bereits mit dieser E-Mail-Adresse
                registriert haben.
              </p>
            </div>
            <button
              type="submit"
              disabled={isAddingAdmin}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isAddingAdmin ? "Hinzufügen..." : "Admin hinzufügen"}
            </button>
          </form>
        </div>

        {/* Liste der Admins */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Aktuelle Administratoren
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {admins.length === 0 ? (
              <div className="px-6 py-4 text-center text-gray-500">
                Keine Administratoren gefunden.
              </div>
            ) : (
              admins.map((admin) => (
                <div
                  key={admin.id}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {admin.email}
                    </div>
                    <div className="text-sm text-gray-500">
                      Hinzugefügt am:{" "}
                      {admin.createdAt?.toDate().toLocaleDateString("de-DE")}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {admin.email === auth.currentUser?.email && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Sie
                      </span>
                    )}
                    {admins.length > 1 && (
                      <button
                        onClick={() => removeAdmin(admin.id, admin.email)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Entfernen
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Hinweis */}
        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Hinweis:</strong> Neue Admins können sich nach der
                Hinzufügung sofort bei dem Admin-Bereich anmelden. Der letzte
                Administrator kann nicht entfernt werden, um den Zugriff auf das
                System zu gewährleisten.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
