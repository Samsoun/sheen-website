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
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
          status: data.status || "pending",
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
        <Header />
        <main>
          <section
            className="section"
            style={{ paddingTop: "9.6rem", paddingBottom: "9.6rem" }}
          >
            <div className="container">
              <h1 className="heading-secondary">Überprüfe Berechtigungen...</h1>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        <style jsx global>{`
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
        `}</style>

        {/* Hero Section für Buchungen */}
        <section className="section-hero admin-hero">
          <div className="container">
            <div className="admin-hero-content">
              <span className="subheading">Buchungsmanagement</span>
              <h1 className="heading-primary admin-heading">Alle Buchungen</h1>
              <p className="admin-description">
                Übersicht aller Termine und Buchungen mit erweiterten Filter-
                und Sortieroptionen.
              </p>
              <div className="admin-breadcrumb">
                <Link
                  href="/admin"
                  className="btn btn--outline"
                  style={{ marginTop: "2.4rem" }}
                >
                  <ion-icon name="arrow-back-outline"></ion-icon>
                  Zurück zum Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Filter und Such-Bereich */}
        <section className="section admin-section">
          <div className="container">
            <h2 className="heading-secondary">Buchungen verwalten</h2>

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
                <div className="admin-table-container">
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
                              <td>
                                <button
                                  className="action-btn"
                                  onClick={() =>
                                    alert("Details ansehen: " + booking.id)
                                  }
                                >
                                  <ion-icon name="eye-outline"></ion-icon>
                                  Details
                                </button>
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
      <Footer />
    </>
  );
}
