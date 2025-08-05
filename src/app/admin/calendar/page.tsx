"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/utils/firebase-config";
import { collection, query, where, getDocs } from "firebase/firestore";
import AdminCalendarManagement from "@/components/AdminCalendarManagement";

export default function AdminCalendarPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
          router.push("/");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Fehler bei der Admin-Überprüfung:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Überprüfe Berechtigung...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="admin-calendar-page">
      <div className="admin-nav">
        <button onClick={() => router.push("/admin")} className="btn-back">
          ← Zurück zum Admin Dashboard
        </button>
      </div>

      <main className="calendar-main">
        <AdminCalendarManagement />
      </main>

      <style jsx>{`
        .admin-calendar-page {
          min-height: 100vh;
          background: #f3f4f6;
          padding: 20px;
        }

        .admin-nav {
          max-width: 1000px;
          margin: 0 auto 20px auto;
        }

        .btn-back {
          background: #6b7280;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }

        .btn-back:hover {
          background: #4b5563;
        }

        .calendar-main {
          max-width: 1000px;
          margin: 0 auto;
        }

        .admin-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 20px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
