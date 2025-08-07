"use client";

import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/utils/firebase-config";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  startAfter,
  limit,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { calculatePriceComponents, formatPrice } from "@/utils/priceUtils";
import { cancelBooking } from "@/utils/bookingService";

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  serviceName: string;
  treatments: {
    id: string;
    name: string;
    duration: number;
    price: number;
  }[];
  price: number;
  duration: number;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: Timestamp;
  customerId?: string | null;
  userId?: string | null;
  bookingGroupId?: string;
  isMultiBooking?: boolean;
  treatmentIndex?: number;
  totalTreatments?: number;
}

export default function AdminBookingsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'pending', 'confirmed', 'cancelled'
  const [dateFilter, setDateFilter] = useState("all"); // 'all', 'today', 'tomorrow', 'thisWeek', 'thisMonth'
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisibleDoc, setLastVisibleDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [sortField, setSortField] = useState<
    "date" | "customer" | "treatment" | "duration" | "price"
  >("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc"); // desc = neueste zuerst
  const [cancellingBookings, setCancellingBookings] = useState<Set<string>>(
    new Set()
  );
  const pageSize = 20;
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
        loadBookings();
      } catch (error) {
        console.error("Fehler beim Prüfen der Admin-Berechtigungen:", error);
        router.push("/profile");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Filter-Updates abfangen
  useEffect(() => {
    if (isAdmin) {
      // Bei Filter-Änderungen wieder bei Seite 1 beginnen
      setPage(1);
      setBookings([]);
      setLastVisibleDoc(null);
      loadBookings();
    }
  }, [statusFilter, isAdmin]);

  const loadBookings = async (
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ) => {
    setIsLoading(true);
    try {
      const bookingsRef = collection(db, "bookings");

      // Basis-Query erstellen
      let baseQuery = query(bookingsRef, orderBy("createdAt", "desc"));

      // Statusfilter anwenden, falls ausgewählt
      if (statusFilter !== "all") {
        baseQuery = query(
          bookingsRef,
          where("status", "==", statusFilter),
          orderBy("createdAt", "desc")
        );
      }

      // Paginierung hinzufügen
      let q = baseQuery;
      if (lastDoc) {
        q = query(baseQuery, startAfter(lastDoc), limit(pageSize));
      } else {
        q = query(baseQuery, limit(pageSize));
      }

      const querySnapshot = await getDocs(q);

      // Letztes sichtbares Dokument für Paginierung speichern
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisibleDoc(lastVisible || null);

      // Prüfen, ob weitere Seiten vorhanden sind
      setHasMore(querySnapshot.docs.length === pageSize);

      const bookingsData: Booking[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookingsData.push({
          id: doc.id,
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          date: data.date || "",
          time: data.time || "",
          serviceName: data.serviceName || "",
          treatments: data.treatments || [],
          price: data.price || 0,
          duration: data.duration || 0,
          status: data.status || "pending", // Stelle sicher, dass der Status immer gesetzt ist
          createdAt: data.createdAt,
          customerId: data.customerId || null,
          userId: data.userId || null,
          bookingGroupId: data.bookingGroupId || "",
          isMultiBooking: data.isMultiBooking || false,
          treatmentIndex: data.treatmentIndex || 0,
          totalTreatments: data.totalTreatments || 0,
        });
      });

      if (lastDoc) {
        setBookings((prev) => [...prev, ...bookingsData]);
      } else {
        setBookings(bookingsData);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Buchungsdaten:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreBookings = () => {
    if (lastVisibleDoc) {
      setPage(page + 1);
      loadBookings(lastVisibleDoc);
    }
  };

  // Stornierungsfunktion
  const handleCancelBooking = async (
    bookingId: string,
    bookingName: string
  ) => {
    const confirmed = window.confirm(
      `Möchten Sie die Buchung von ${bookingName} wirklich stornieren? Diese Aktion kann nicht rückgängig gemacht werden.`
    );

    if (!confirmed) return;

    // Zu stornierende Buchungen markieren
    setCancellingBookings((prev) => new Set(prev).add(bookingId));

    try {
      const result = await cancelBooking(bookingId);

      if (result.success) {
        // Erfolgsmeldung
        alert(`Buchung von ${bookingName} wurde erfolgreich storniert.`);

        // Buchungen neu laden
        setPage(1);
        setBookings([]);
        setLastVisibleDoc(null);
        loadBookings();
      } else {
        // Fehlermeldung
        alert(
          `Fehler beim Stornieren: ${result.error || "Unbekannter Fehler"}`
        );
      }
    } catch (error) {
      console.error("Fehler beim Stornieren der Buchung:", error);
      alert(
        "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut."
      );
    } finally {
      // Loading-Status entfernen
      setCancellingBookings((prev) => {
        const newSet = new Set(prev);
        newSet.delete(bookingId);
        return newSet;
      });
    }
  };

  // Formatiere das Datum für die Anzeige
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const [year, month, day] = dateStr.split("-");
    return `${day}.${month}.${year}`;
  };

  // Gefilterte Buchungen
  const filteredBookings = bookings.filter((booking) => {
    // Suche
    const searchMatch =
      searchTerm === "" ||
      booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.phone.includes(searchTerm) ||
      booking.serviceName.toLowerCase().includes(searchTerm.toLowerCase());

    // Datumsfilter
    let dateMatch = true;
    const today = new Date();
    const bookingDate = new Date(booking.date);

    if (dateFilter === "today") {
      const todayStr = today.toISOString().split("T")[0];
      dateMatch = booking.date === todayStr;
    } else if (dateFilter === "tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];
      dateMatch = booking.date === tomorrowStr;
    } else if (dateFilter === "thisWeek") {
      const startOfWeek = new Date(today);
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Montag ist der erste Tag der Woche
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      dateMatch = bookingDate >= startOfWeek && bookingDate <= endOfWeek;
    } else if (dateFilter === "thisMonth") {
      dateMatch =
        bookingDate.getMonth() === today.getMonth() &&
        bookingDate.getFullYear() === today.getFullYear();
    }

    return searchMatch && dateMatch;
  });

  // Gruppiere Buchungen für die Anzeige nach bookingGroupId oder individueller ID
  const groupedBookings = React.useMemo(() => {
    const groups: Record<string, Booking[]> = {};

    filteredBookings.forEach((booking) => {
      // Verwende bookingGroupId falls vorhanden, sonst die eigene ID
      const groupKey =
        booking.bookingGroupId && booking.isMultiBooking
          ? booking.bookingGroupId
          : booking.id;

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }

      groups[groupKey].push(booking);
    });

    // Sortiere jede Gruppe nach treatmentIndex
    Object.keys(groups).forEach((key) => {
      groups[key].sort(
        (a, b) => (a.treatmentIndex || 0) - (b.treatmentIndex || 0)
      );
    });

    // Konvertiere das Objekt in ein Array von Gruppen
    return Object.values(groups);
  }, [filteredBookings]);

  // Sortierungsfunktion für Buchungsgruppen
  const sortBookingGroups = (groups: Booking[][]) => {
    return [...groups].sort((groupA, groupB) => {
      // Wir vergleichen immer den ersten Eintrag jeder Gruppe für die Sortierung
      const a = groupA[0];
      const b = groupB[0];

      let comparison = 0;

      switch (sortField) {
        case "date":
          // Zuerst nach Datum sortieren
          comparison = a.date.localeCompare(b.date);
          // Bei gleichem Datum nach Uhrzeit sortieren
          if (comparison === 0) {
            comparison = a.time.localeCompare(b.time);
          }
          break;
        case "customer":
          // Nach Kundennamen sortieren
          comparison = a.name.localeCompare(b.name);
          break;
        case "treatment":
          // Nach Name der ersten Behandlung sortieren
          const treatmentNameA =
            a.treatments && a.treatments.length > 0
              ? a.treatments[0].name
              : a.serviceName;
          const treatmentNameB =
            b.treatments && b.treatments.length > 0
              ? b.treatments[0].name
              : b.serviceName;
          comparison = treatmentNameA.localeCompare(treatmentNameB);
          break;
        case "duration":
          // Nach Gesamtdauer sortieren
          comparison = a.duration - b.duration;
          break;
        case "price":
          // Nach Preis sortieren
          comparison = a.price - b.price;
          break;
        default:
          // Standardsortierung nach Datum/Uhrzeit
          comparison = a.date.localeCompare(b.date);
          if (comparison === 0) {
            comparison = a.time.localeCompare(b.time);
          }
      }

      // Sortierrichtung berücksichtigen
      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  // Sortierfunktion anwenden
  const sortedGroupedBookings = sortBookingGroups(groupedBookings);

  // Hilfsfunktion zum Ändern der Sortierung
  const handleSort = (
    field: "date" | "customer" | "treatment" | "duration" | "price"
  ) => {
    if (sortField === field) {
      // Wenn das gleiche Feld geklickt wird, Sortierrichtung umkehren
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Bei neuem Feld: Feld ändern und Standardrichtung setzen
      setSortField(field);
      // Standardrichtung für jedes Feld festlegen
      if (field === "date") {
        setSortDirection("desc"); // Neueste zuerst
      } else {
        setSortDirection("asc"); // Aufsteigend für andere Felder
      }
    }
  };

  // Hilfsfunktion für Sortierpfeil-Darstellung
  const getSortIndicator = (
    field: "date" | "customer" | "treatment" | "duration" | "price"
  ) => {
    if (sortField !== field) return null;

    return sortDirection === "asc" ? (
      <span className="ml-1 inline-block">↑</span>
    ) : (
      <span className="ml-1 inline-block">↓</span>
    );
  };

  // Diese Funktion zeigt die Preisaufschlüsselung an
  const renderPriceDetails = (price: number) => {
    const priceComponents = calculatePriceComponents(price);

    return (
      <div className="admin-price-breakdown">
        <div className="admin-price brutto">
          {priceComponents.grossFormatted}
        </div>
        <div className="flex flex-col text-xs text-gray-500 mt-1">
          <span>Netto: {priceComponents.netFormatted}</span>
          <span>MwSt: {priceComponents.vatFormatted}</span>
        </div>
      </div>
    );
  };

  if (!isAdmin) {
    return (
      <>
        <main
          style={{
            minHeight: "100vh",
            backgroundColor: "#f8fafa",
          }}
        >
          <section
            className="section"
            style={{
              paddingTop: "9.6rem",
              paddingBottom: "9.6rem",
              backgroundColor: "#f8fafa",
              minHeight: "100vh",
            }}
          >
            <div className="container">
              <h1 className="heading-secondary">Überprüfe Berechtigungen...</h1>
            </div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <main>
        <style jsx global>{`
          /* Basis-Layout ohne Footer */
          html,
          body {
            margin: 0;
            padding: 0;
            background-color: #f8fafa;
            min-height: 100vh;
          }

          main {
            min-height: 100vh;
            background-color: #f8fafa;
          }

          /* Kompakter Admin Header */
          .admin-compact-header {
            padding: 2.4rem 0 1.6rem 0;
            background: linear-gradient(135deg, #b2d8db 0%, #7cc7d1 100%);
            margin-top: 0;
          }

          .admin-header-flex {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 2rem;
          }

          .admin-title-group {
            flex: 1;
          }

          .admin-page-title {
            font-size: 3.2rem;
            font-weight: 700;
            color: #fff;
            margin-bottom: 0.8rem;
            line-height: 1.2;
          }

          .admin-subtitle {
            font-size: 1.6rem;
            color: rgba(255, 255, 255, 0.9);
            margin: 0;
          }

          .admin-back-btn {
            flex-shrink: 0;
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.3);
            color: #fff;
            backdrop-filter: blur(10px);
          }

          .admin-back-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.5);
          }

          /* Kompakte Hauptsektion */
          .admin-main-section {
            padding: 3.2rem 0 6.4rem 0;
            background-color: #f8fafa;
            min-height: calc(100vh - 8rem);
          }

          /* Tabellen-Container auf 50% der gesamten Viewport-Breite begrenzen */
          .admin-table-container {
            width: 50vw;
            max-width: none;
            margin: 2.4rem auto;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
            overflow: hidden;
            display: block;
            position: relative;
            left: 50%;
            transform: translateX(-50%);
          }

          .admin-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
          }

          .admin-table th {
            background: #f8f9fa;
            color: #000;
            padding: 1.6rem 1.2rem;
            font-weight: 600;
            font-size: 1.4rem;
            text-align: left;
            border: none;
            border-bottom: 2px solid #e9ecef;
          }

          .admin-table td {
            padding: 1.4rem 1.2rem;
            border-bottom: 1px solid #f1f3f4;
            vertical-align: top;
          }

          /* Größere Schrift für Dauer und Uhrzeit */
          .booking-time {
            font-size: 1.6rem;
            font-weight: 600;
            color: #374151;
          }

          .booking-duration {
            font-size: 1.6rem;
            font-weight: 600;
            color: #374151;
          }

          .admin-table tbody tr:hover {
            background-color: #f8fafa;
          }

          .admin-table tbody tr:last-child td {
            border-bottom: none;
          }

          /* Such- und Filterkontrollen */
          .admin-search-controls {
            display: flex;
            gap: 1.6rem;
            margin-bottom: 2.4rem;
            flex-wrap: wrap;
            width: 50vw;
            max-width: 50vw;
            position: relative;
            left: 50%;
            transform: translateX(-50%);
          }

          .search-input-container {
            flex: 2;
            position: relative;
          }

          .search-input-container ion-icon {
            position: absolute;
            left: 1.2rem;
            top: 50%;
            transform: translateY(-50%);
            color: #6b7280;
            font-size: 1.8rem;
          }

          .admin-search-input {
            width: 100%;
            padding: 1.2rem 1.2rem 1.2rem 4.4rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1.4rem;
            transition: border-color 0.3s ease;
          }

          .admin-search-input:focus {
            outline: none;
            border-color: #b2d8db;
            box-shadow: 0 0 0 3px rgba(178, 216, 219, 0.1);
          }

          .admin-filter-selects {
            display: flex;
            gap: 1.2rem;
            flex: 1;
          }

          .admin-select {
            padding: 1.2rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1.4rem;
            background: #fff;
            transition: border-color 0.3s ease;
            min-width: 140px;
          }

          .admin-select:focus {
            outline: none;
            border-color: #b2d8db;
            box-shadow: 0 0 0 3px rgba(178, 216, 219, 0.1);
          }

          /* Sortierkontrollen */
          .admin-sort-controls {
            margin-bottom: 2.4rem;
            text-align: center;
          }

          .sort-label {
            display: block;
            font-weight: 600;
            margin-bottom: 1.2rem;
            color: #374151;
            font-size: 1.4rem;
          }

          .admin-sort-buttons {
            display: flex;
            gap: 0.8rem;
            justify-content: center;
            flex-wrap: wrap;
          }

          .admin-sort-btn {
            padding: 0.8rem 1.6rem;
            border: 2px solid #e5e7eb;
            background: #fff;
            border-radius: 6px;
            font-size: 1.3rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.4rem;
          }

          .admin-sort-btn:hover {
            border-color: #b2d8db;
            background: #f8fafa;
          }

          .admin-sort-btn.active {
            background: #b2d8db;
            border-color: #b2d8db;
            color: #fff;
          }

          .sort-indicator {
            display: flex;
            align-items: center;
          }

          /* Preisanzeige */
          .admin-price-breakdown {
            display: flex;
            flex-direction: column;
          }
          .admin-price.brutto {
            font-weight: 600;
          }
          .admin-price-details {
            overflow: hidden;
            max-height: 0;
            transition: max-height 0.3s ease-out;
          }
          .admin-price-row:hover .admin-price-details {
            max-height: 50px;
          }
          .admin-mwst-badge {
            display: inline-block;
            font-size: 0.7rem;
            padding: 0.1rem 0.3rem;
            border-radius: 0.25rem;
            background-color: #f3f4f6;
            color: #6b7280;
            margin-left: 0.25rem;
          }

          /* Ladezustand und leere Zustände */
          .admin-loading {
            text-align: center;
            padding: 4.8rem 2.4rem;
          }

          .loading-icon {
            font-size: 4.8rem;
            color: #b2d8db;
            margin-bottom: 1.6rem;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          .admin-empty-state {
            text-align: center;
            padding: 4.8rem 2.4rem;
            width: 50vw;
            max-width: 50vw;
            position: relative;
            left: 50%;
            transform: translateX(-50%);
          }

          .empty-icon {
            font-size: 6.4rem;
            color: #d1d5db;
            margin-bottom: 2.4rem;
          }

          .admin-empty-state p {
            font-size: 1.6rem;
            color: #6b7280;
          }

          /* Status Badges */
          .status-badge {
            padding: 0.4rem 1.2rem;
            border-radius: 20px;
            font-size: 1.2rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .status-badge.pending {
            background: #fef3c7;
            color: #d97706;
          }

          .status-badge.confirmed {
            background: #d1fae5;
            color: #059669;
          }

          .status-badge.cancelled {
            background: #fee2e2;
            color: #dc2626;
          }

          /* Action Buttons */
          .action-buttons {
            display: flex;
            gap: 0.8rem;
            flex-wrap: wrap;
          }

          .action-btn {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.8rem 1.2rem;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 1.2rem;
            cursor: pointer;
            transition: all 0.3s ease;
            white-space: nowrap;
          }

          .action-btn:hover {
            background: #e5e7eb;
            border-color: #9ca3af;
          }

          .action-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .action-btn.cancel-btn {
            background: #fee2e2;
            color: #dc2626;
            border-color: #fecaca;
          }

          .action-btn.cancel-btn:hover:not(:disabled) {
            background: #fecaca;
            border-color: #f87171;
          }

          .action-btn.cancel-btn ion-icon[name="sync-outline"] {
            animation: spin 1s linear infinite;
          }

          /* Load More Button */
          .load-more-container {
            text-align: center;
            margin-top: 3.2rem;
          }

          .load-more-btn {
            max-width: 300px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.8rem;
          }

          /* Desktop - Mobile Karten verstecken */
          .mobile-bookings-cards {
            display: none;
          }

          /* Mobile Optimierungen für Admin Buchungen */
          @media (max-width: 768px) {
            .admin-table-container {
              width: 95vw;
            }

            .admin-search-controls {
              width: 95vw;
              max-width: 95vw;
            }

            .admin-empty-state {
              width: 95vw;
              max-width: 95vw;
            }

            .admin-header-flex {
              flex-direction: column;
              align-items: stretch;
              text-align: center;
            }

            .admin-page-title {
              font-size: 2.8rem;
            }

            .admin-header-compact {
              padding: 2rem 0;
            }

            .admin-title {
              font-size: 2.4rem;
              margin-bottom: 0.8rem;
            }

            .admin-subtitle {
              font-size: 1.4rem;
            }

            /* Navigation für Mobile */
            .admin-nav .btn {
              padding: 1.2rem 1.6rem;
              font-size: 1.4rem;
              display: flex;
              align-items: center;
              gap: 0.8rem;
            }

            /* Filter und Such-Bereich */
            .admin-controls {
              flex-direction: column;
              gap: 1.5rem;
              padding: 0 1rem;
              margin: 2rem 0;
            }

            .admin-search-controls {
              flex-direction: column;
              gap: 1.2rem;
            }

            .search-input-container {
              position: relative;
              width: 100%;
            }

            .admin-search-input {
              width: 100%;
              padding: 1.2rem 1.2rem 1.2rem 4rem;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              font-size: 1.4rem;
            }

            .search-input-container ion-icon {
              position: absolute;
              left: 1.2rem;
              top: 50%;
              transform: translateY(-50%);
              font-size: 1.8rem;
              color: #9ca3af;
            }

            .filter-controls {
              display: flex;
              flex-direction: column;
              gap: 1rem;
            }

            .filter-group {
              display: flex;
              flex-direction: column;
              gap: 0.8rem;
            }

            .filter-label {
              font-size: 1.2rem;
              font-weight: 600;
              color: #374151;
            }

            .filter-buttons {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
              gap: 0.6rem;
            }

            .filter-btn {
              padding: 0.8rem 1rem;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              background: #fff;
              font-size: 1.1rem;
              font-weight: 500;
              color: #374151;
              cursor: pointer;
              transition: all 0.2s;
            }

            .filter-btn.active {
              background: #3b82f6;
              color: #fff;
              border-color: #3b82f6;
            }

            /* Sortierung für Mobile */
            .sort-controls {
              display: flex;
              flex-direction: column;
              gap: 1rem;
              padding: 0 1rem;
              margin: 1.5rem 0;
            }

            .sort-header {
              font-size: 1.3rem;
              font-weight: 600;
              color: #374151;
            }

            .sort-buttons {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 0.8rem;
            }

            .sort-btn {
              padding: 1rem;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              background: #fff;
              font-size: 1.2rem;
              color: #374151;
              cursor: pointer;
              transition: all 0.2s;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }

            .sort-btn.active {
              background: #f0f9ff;
              border-color: #3b82f6;
              color: #1d4ed8;
            }

            /* Desktop Tabelle verstecken */
            .desktop-bookings-table {
              display: none;
            }

            /* Mobile Buchungskarten */
            .mobile-bookings-cards {
              display: block;
              margin: 2rem 1rem;
            }

            .booking-group-card {
              background: #fff;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              margin-bottom: 2rem;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
              overflow: hidden;
            }

            .group-header {
              background: #f8fafa;
              padding: 1.5rem;
              border-bottom: 1px solid #e5e7eb;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }

            .customer-info-mobile .customer-name-mobile {
              font-size: 1.6rem;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 0.4rem;
            }

            .customer-info-mobile .customer-email-mobile {
              font-size: 1.3rem;
              color: #6b7280;
            }

            .multi-booking-badge {
              background: #dbeafe;
              color: #1d4ed8;
              padding: 0.6rem 1rem;
              border-radius: 20px;
              font-size: 1.1rem;
              font-weight: 600;
            }

            .booking-card {
              padding: 1.5rem;
              border-bottom: 1px solid #f3f4f6;
            }

            .booking-card:last-child {
              border-bottom: none;
            }

            .booking-card-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 1.2rem;
            }

            .booking-date-time .booking-date-mobile {
              font-size: 1.4rem;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 0.4rem;
            }

            .booking-date-time .booking-time-mobile {
              font-size: 1.3rem;
              color: #6b7280;
            }

            .status-badge-mobile {
              padding: 0.6rem 1.2rem;
              border-radius: 20px;
              font-size: 1.1rem;
              font-weight: 600;
              white-space: nowrap;
            }

            .status-badge-mobile.confirmed {
              background: #dcfce7;
              color: #166534;
            }

            .status-badge-mobile.pending {
              background: #fef3c7;
              color: #92400e;
            }

            .status-badge-mobile.cancelled {
              background: #fee2e2;
              color: #dc2626;
            }

            .booking-details-mobile {
              margin-bottom: 1.5rem;
            }

            .detail-row-mobile {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding: 0.8rem 0;
              border-bottom: 1px solid #f9fafb;
              gap: 1rem;
            }

            .detail-row-mobile:last-child {
              border-bottom: none;
            }

            .detail-label-mobile {
              font-size: 1.2rem;
              color: #6b7280;
              font-weight: 500;
              flex-shrink: 0;
              min-width: 8rem;
            }

            .detail-value-mobile {
              font-size: 1.3rem;
              color: #1f2937;
              font-weight: 500;
              text-align: right;
              flex: 1;
            }

            .treatment-index-mobile {
              color: #6b7280;
              font-size: 1.1rem;
            }

            .booking-actions-mobile {
              display: flex;
              gap: 1rem;
              flex-wrap: wrap;
            }

            .action-btn-mobile {
              flex: 1;
              background: #3b82f6;
              color: #fff;
              border: none;
              border-radius: 8px;
              padding: 1.2rem 1.6rem;
              font-size: 1.3rem;
              font-weight: 600;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.8rem;
              transition: all 0.2s;
              min-width: 140px;
            }

            .action-btn-mobile:hover {
              background: #2563eb;
            }

            .action-btn-mobile:disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }

            .action-btn-mobile.cancel-btn-mobile {
              background: #dc2626;
              color: #fff;
            }

            .action-btn-mobile.cancel-btn-mobile:hover:not(:disabled) {
              background: #b91c1c;
            }

            .action-btn-mobile ion-icon {
              font-size: 1.6rem;
            }

            .action-btn-mobile ion-icon[name="sync-outline"] {
              animation: spin 1s linear infinite;
            }

            /* Load More Button */
            .load-more-container {
              padding: 0 1rem;
              margin: 2rem 0;
            }

            .load-more-btn {
              width: 100%;
              padding: 1.5rem;
              font-size: 1.4rem;
            }

            /* Empty State */
            .admin-empty-state {
              text-align: center;
              padding: 4rem 2rem;
            }

            .empty-icon ion-icon {
              font-size: 4rem;
              color: #9ca3af;
              margin-bottom: 1.6rem;
            }
          }

          @media (max-width: 1200px) {
            .admin-table-container {
              width: 70vw;
            }

            .admin-search-controls {
              width: 70vw;
              max-width: 70vw;
            }

            .admin-empty-state {
              width: 70vw;
              max-width: 70vw;
            }
          }

          @media (max-width: 480px) {
            .filter-buttons {
              grid-template-columns: 1fr;
            }

            .sort-buttons {
              grid-template-columns: 1fr;
            }

            .booking-card-header {
              flex-direction: column;
              align-items: flex-start;
              gap: 1rem;
            }

            .detail-row-mobile {
              flex-direction: column;
              align-items: flex-start;
              gap: 0.4rem;
            }

            .detail-value-mobile {
              text-align: left;
            }
          }
        `}</style>

        {/* Kompakter Header für Buchungen */}
        <section className="section admin-compact-header">
          <div className="container">
            <div className="admin-header-flex">
              <div className="admin-title-group">
                <h1 className="admin-page-title">Buchungen verwalten</h1>
                <p className="admin-subtitle">
                  Übersicht aller Termine und Buchungen
                </p>
              </div>
              <Link href="/admin" className="btn btn--outline admin-back-btn">
                <ion-icon name="arrow-back-outline"></ion-icon>
                Dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* Filter und Such-Bereich */}
        <section className="section admin-main-section">
          <div className="container">
            {/* Such- und Filterleiste */}
            <div className="admin-search-controls">
              <div className="search-input-container">
                <ion-icon name="search-outline"></ion-icon>
                <input
                  type="text"
                  placeholder="Suche nach Name, E-Mail oder Behandlung..."
                  className="admin-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="admin-filter-selects">
                <select
                  className="admin-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Alle Status</option>
                  <option value="pending">Ausstehend</option>
                  <option value="confirmed">Bestätigt</option>
                  <option value="cancelled">Storniert</option>
                </select>
                <select
                  className="admin-select"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">Alle Daten</option>
                  <option value="today">Heute</option>
                  <option value="tomorrow">Morgen</option>
                  <option value="thisWeek">Diese Woche</option>
                  <option value="thisMonth">Diesen Monat</option>
                </select>
              </div>
            </div>

            {/* Sortieroptionen */}
            <div className="admin-sort-controls">
              <span className="sort-label">Sortieren nach:</span>
              <div className="admin-sort-buttons">
                {[
                  { id: "date", label: "Datum/Uhrzeit" },
                  { id: "customer", label: "Kunde" },
                  { id: "treatment", label: "Behandlung" },
                  { id: "duration", label: "Dauer" },
                  { id: "price", label: "Preis" },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSort(option.id as any)}
                    className={`admin-sort-btn ${sortField === option.id ? "active" : ""}`}
                  >
                    {option.label}
                    {sortField === option.id && (
                      <span className="sort-indicator">
                        <ion-icon
                          name={
                            sortDirection === "asc"
                              ? "arrow-up-outline"
                              : "arrow-down-outline"
                          }
                        ></ion-icon>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Buchungstabelle */}
            {isLoading && bookings.length === 0 ? (
              <div className="admin-loading">
                <div className="loading-icon">
                  <ion-icon name="sync-outline"></ion-icon>
                </div>
                <p>Lade Buchungsdaten...</p>
              </div>
            ) : (
              <>
                {/* Desktop Tabelle */}
                <div className="admin-table-container desktop-bookings-table">
                  <table className="admin-table bookings-table">
                    <thead>
                      <tr>
                        <th
                          onClick={() => handleSort("date")}
                          className="sortable"
                        >
                          <div className="th-content">
                            Datum/Uhrzeit
                            {getSortIndicator("date")}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("customer")}
                          className="sortable"
                        >
                          <div className="th-content">
                            Kunde
                            {getSortIndicator("customer")}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("treatment")}
                          className="sortable"
                        >
                          <div className="th-content">
                            Behandlung
                            {getSortIndicator("treatment")}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("duration")}
                          className="sortable"
                        >
                          <div className="th-content">
                            Dauer
                            {getSortIndicator("duration")}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("price")}
                          className="sortable"
                        >
                          <div className="th-content">
                            Preis
                            {getSortIndicator("price")}
                          </div>
                        </th>
                        <th>Status</th>
                        <th>Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedGroupedBookings.map((group, groupIndex) => (
                        <React.Fragment key={group[0].id}>
                          {group.map((booking, bookingIndex) => (
                            <tr
                              key={booking.id}
                              className={`booking-row ${
                                group.length > 1 ? "multi-booking" : ""
                              }`}
                            >
                              <td>
                                <div className="booking-date">
                                  {bookingIndex === 0 ||
                                  booking.date !== group[bookingIndex - 1].date
                                    ? formatDate(booking.date)
                                    : ""}
                                </div>
                                <div className="booking-time">
                                  {booking.time}
                                </div>
                              </td>
                              <td>
                                {bookingIndex === 0 ? (
                                  <div className="customer-info">
                                    <div className="customer-name">
                                      {booking.name}
                                    </div>
                                    <div className="customer-email">
                                      {booking.email}
                                    </div>
                                  </div>
                                ) : null}
                              </td>
                              <td>
                                <div className="treatment-info">
                                  {booking.treatments &&
                                  booking.treatments.length > 0 ? (
                                    <>
                                      <div className="treatment-name">
                                        {booking.treatments[0].name}
                                      </div>
                                      {booking.isMultiBooking && (
                                        <div className="treatment-index">
                                          Teil {booking.treatmentIndex! + 1} von{" "}
                                          {booking.totalTreatments}
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="treatment-name">
                                      {booking.serviceName}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="booking-duration">
                                  {booking.duration} Min.
                                </div>
                              </td>
                              <td>
                                <div className="booking-price">
                                  {renderPriceDetails(booking.price)}
                                </div>
                              </td>
                              <td>
                                <span
                                  className={`status-badge ${booking.status}`}
                                >
                                  {booking.status === "confirmed"
                                    ? "Bestätigt"
                                    : booking.status === "cancelled"
                                      ? "Storniert"
                                      : "Ausstehend"}
                                </span>
                              </td>
                              <td
                                style={{ width: "200px", whiteSpace: "nowrap" }}
                              >
                                <div
                                  className="action-buttons"
                                  style={{ display: "flex", gap: "8px" }}
                                >
                                  <button
                                    className="action-btn"
                                    style={{
                                      padding: "8px 16px",
                                      borderRadius: "6px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      fontSize: "14px",
                                      cursor: "pointer",
                                      backgroundColor: "#4CAF50",
                                      color: "white",
                                      border: "none",
                                    }}
                                    onClick={() =>
                                      alert("Details ansehen: " + booking.id)
                                    }
                                  >
                                    <ion-icon name="eye-outline"></ion-icon>
                                    <span>Details</span>
                                  </button>
                                  {booking.status !== "cancelled" && (
                                    <button
                                      className="action-btn cancel-btn"
                                      style={{
                                        padding: "8px 16px",
                                        borderRadius: "6px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontSize: "14px",
                                        cursor: cancellingBookings.has(
                                          booking.id
                                        )
                                          ? "not-allowed"
                                          : "pointer",
                                        backgroundColor: "#ff4444",
                                        color: "white",
                                        border: "none",
                                        opacity: cancellingBookings.has(
                                          booking.id
                                        )
                                          ? "0.7"
                                          : "1",
                                      }}
                                      onClick={() =>
                                        handleCancelBooking(
                                          booking.id,
                                          booking.name || "Unbekannter Kunde"
                                        )
                                      }
                                      disabled={cancellingBookings.has(
                                        booking.id
                                      )}
                                    >
                                      <ion-icon name="close-circle-outline"></ion-icon>
                                      <span>
                                        {cancellingBookings.has(booking.id)
                                          ? "Wird storniert..."
                                          : "Stornieren"}
                                      </span>
                                    </button>
                                  )}
                                  {booking.status !== "cancelled" && (
                                    <button
                                      className="action-btn cancel-btn"
                                      onClick={() =>
                                        handleCancelBooking(
                                          booking.id,
                                          booking.name
                                        )
                                      }
                                      disabled={cancellingBookings.has(
                                        booking.id
                                      )}
                                      style={{
                                        padding: "8px 16px",
                                        borderRadius: "6px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                        backgroundColor: "#fee2e2",
                                        color: "#dc2626",
                                        border: "1px solid #fecaca",
                                      }}
                                    >
                                      {cancellingBookings.has(booking.id) ? (
                                        <>
                                          <ion-icon name="sync-outline"></ion-icon>
                                          <span>Storniere...</span>
                                        </>
                                      ) : (
                                        <>
                                          <ion-icon name="close-outline"></ion-icon>
                                          <span>Stornieren</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {/* Optionaler visueller Trenner zwischen Buchungsgruppen */}
                          {groupIndex < sortedGroupedBookings.length - 1 && (
                            <tr className="group-separator">
                              <td colSpan={7}></td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Karten Layout */}
                <div className="mobile-bookings-cards">
                  {sortedGroupedBookings.map((group, groupIndex) => (
                    <div key={group[0].id} className="booking-group-card">
                      <div className="group-header">
                        <div className="customer-info-mobile">
                          <div className="customer-name-mobile">
                            {group[0].name}
                          </div>
                          <div className="customer-email-mobile">
                            {group[0].email}
                          </div>
                        </div>
                        {group.length > 1 && (
                          <div className="multi-booking-badge">
                            {group.length} Termine
                          </div>
                        )}
                      </div>

                      {group.map((booking, bookingIndex) => (
                        <div key={booking.id} className="booking-card">
                          <div className="booking-card-header">
                            <div className="booking-date-time">
                              <div className="booking-date-mobile">
                                📅 {formatDate(booking.date)}
                              </div>
                              <div className="booking-time-mobile">
                                🕐 {booking.time}
                              </div>
                            </div>
                            <span
                              className={`status-badge-mobile ${booking.status}`}
                            >
                              {booking.status === "confirmed"
                                ? "Bestätigt"
                                : booking.status === "cancelled"
                                  ? "Storniert"
                                  : "Ausstehend"}
                            </span>
                          </div>

                          <div className="booking-details-mobile">
                            <div className="detail-row-mobile">
                              <span className="detail-label-mobile">
                                💅 Behandlung:
                              </span>
                              <span className="detail-value-mobile">
                                {booking.treatments &&
                                booking.treatments.length > 0
                                  ? booking.treatments[0].name
                                  : booking.serviceName}
                                {booking.isMultiBooking && (
                                  <span className="treatment-index-mobile">
                                    {" "}
                                    (Teil {booking.treatmentIndex! + 1}/
                                    {booking.totalTreatments})
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="detail-row-mobile">
                              <span className="detail-label-mobile">
                                ⏱️ Dauer:
                              </span>
                              <span className="detail-value-mobile">
                                {booking.duration} Min
                              </span>
                            </div>
                            <div className="detail-row-mobile">
                              <span className="detail-label-mobile">
                                💰 Preis:
                              </span>
                              <span className="detail-value-mobile">
                                {renderPriceDetails(booking.price)}
                              </span>
                            </div>
                          </div>

                          <div className="booking-actions-mobile">
                            <button
                              className="action-btn-mobile"
                              onClick={() =>
                                alert("Details ansehen: " + booking.id)
                              }
                            >
                              <ion-icon name="eye-outline"></ion-icon>
                              Details ansehen
                            </button>
                            {booking.status !== "cancelled" && (
                              <button
                                className="action-btn-mobile cancel-btn-mobile"
                                onClick={() =>
                                  handleCancelBooking(booking.id, booking.name)
                                }
                                disabled={cancellingBookings.has(booking.id)}
                              >
                                {cancellingBookings.has(booking.id) ? (
                                  <>
                                    <ion-icon name="sync-outline"></ion-icon>
                                    Storniere...
                                  </>
                                ) : (
                                  <>
                                    <ion-icon name="close-outline"></ion-icon>
                                    Stornieren
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {sortedGroupedBookings.length === 0 && (
                  <div className="admin-empty-state">
                    <div className="empty-icon">
                      <ion-icon name="calendar-outline"></ion-icon>
                    </div>
                    <p>Keine Buchungen gefunden.</p>
                  </div>
                )}

                {hasMore && (
                  <div className="load-more-container">
                    <button
                      onClick={loadMoreBookings}
                      className="btn btn--full load-more-btn"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <ion-icon name="sync-outline"></ion-icon>
                          Lade...
                        </>
                      ) : (
                        <>
                          <ion-icon name="chevron-down-outline"></ion-icon>
                          Mehr Buchungen laden
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
