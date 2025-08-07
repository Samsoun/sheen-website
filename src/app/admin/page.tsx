"use client";

import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/utils/firebase-config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { cancelBooking } from "@/utils/bookingService";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import {
  getUserDiscountData,
  checkLoyaltyDiscountEligibility,
  checkBirthdayDiscountEligibility,
  checkLoyaltyDiscountEligibilityByEmail,
} from "@/utils/discountService";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  birthdate: string;
  phone: string;
  createdAt: any;
  bookingsCount: number;
  currentBookings: any[];
  isEligibleForLoyaltyDiscount: boolean;
  isEligibleForBirthdayDiscount: boolean;
  loyaltyProgress?: {
    current: number;
    required: number;
    remaining: number;
  };
  lastDiscountDate?: Date;
  totalSavings?: number;
  birthdayWeekActive?: boolean;
}

interface AdminData {
  totalCustomers: number;
  loyaltyDiscounts: number;
  birthdayDiscounts: number;
  totalSavingsGenerated: number;
  customersWithBirthdate: number;
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<{
    id: string;
    customerName: string;
  } | null>(null);
  const [cancellingBookings, setCancellingBookings] = useState<Set<string>>(
    new Set()
  );
  const [adminData, setAdminData] = useState<AdminData>({
    totalCustomers: 0,
    loyaltyDiscounts: 0,
    birthdayDiscounts: 0,
    totalSavingsGenerated: 0,
    customersWithBirthdate: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'loyalty', 'birthday'
  const router = useRouter();

  // Buchungsdetails öffnen
  const openBookingDetails = (booking: any, customer: Customer) => {
    setSelectedBooking(booking);
    setSelectedCustomer(customer);
    setShowBookingModal(true);
  };

  // Modal schließen
  const closeBookingModal = () => {
    setShowBookingModal(false);
    setSelectedBooking(null);
    setSelectedCustomer(null);
  };

  // Datum formatieren von YYYY-MM-DD zu DD.MM.YYYY
  const formatDate = (dateString: string) => {
    if (!dateString) return dateString;
    const [year, month, day] = dateString.split("-");
    return `${day}.${month}.${year}`;
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) {
      console.error("Keine Buchung zum Stornieren ausgewählt");
      return;
    }

    const { id: bookingId, customerName } = bookingToCancel;
    console.log("Storniere Buchung:", { bookingId, customerName });

    if (!bookingId) {
      console.error("Keine gültige Buchungs-ID gefunden");
      alert("Fehler: Keine gültige Buchungs-ID gefunden");
      return;
    }

    setShowCancelModal(false);
    setCancellingBookings((prev) => new Set(prev).add(bookingId));

    try {
      console.log("Sende Stornierungsanfrage für Buchung:", bookingId);
      const result = await cancelBooking(bookingId);
      console.log("Stornierungsergebnis:", result);

      if (result.success) {
        console.log("Stornierung erfolgreich");
        setBookingToCancel(null);
        // Kunden neu laden statt kompletter Seiten-Reload
        await loadCustomers();
      } else {
        console.error("Stornierung fehlgeschlagen:", result.error);
        alert(
          result.error ||
            "Fehler beim Stornieren der Buchung. Bitte versuchen Sie es später erneut."
        );
      }
    } catch (error) {
      console.error("Fehler beim Stornieren:", error);
      alert(
        "Ein unerwarteter Fehler ist aufgetreten. Bitte überprüfen Sie die Konsole für weitere Details."
      );
    } finally {
      setCancellingBookings((prev) => {
        const newSet = new Set(prev);
        newSet.delete(bookingId);
        return newSet;
      });
    }
  };

  const openCancelModal = (bookingId: string, customerName: string) => {
    setBookingToCancel({ id: bookingId, customerName });
    setShowCancelModal(true);
  };

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
        loadCustomers();
      } catch (error) {
        console.error("Fehler beim Prüfen der Admin-Berechtigungen:", error);
        router.push("/profile");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      // Alle Kunden abrufen
      const customersRef = collection(db, "customers");
      const customersSnapshot = await getDocs(customersRef);
      const customersData: Customer[] = [];

      let loyaltyCount = 0;
      let birthdayCount = 0;

      // Für jeden Kunden die Buchungshistorie und Rabattberechtigung prüfen
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);

      for (const doc of customersSnapshot.docs) {
        const customerData = doc.data() as Omit<
          Customer,
          | "id"
          | "bookingsCount"
          | "isEligibleForLoyaltyDiscount"
          | "isEligibleForBirthdayDiscount"
        >;

        // Buchungen zählen
        const bookingsRef = collection(db, "bookings");

        // Alle Buchungen abrufen und passende für diesen Kunden finden
        const allBookingsQuery = query(bookingsRef);
        const allBookingsSnapshot = await getDocs(allBookingsQuery);

        console.log(
          `🔍 Debug für Kunde: ${customerData.firstName} ${customerData.lastName} (ID: ${doc.id})`
        );
        console.log(`📧 Kunde Email: ${customerData.email}`);
        console.log(
          `📊 Gesamt Buchungen gefunden: ${allBookingsSnapshot.docs.length}`
        );

        // Suche nach Buchungen die zu diesem Kunden gehören
        let customerBookings = 0;
        const customerBookingsList: any[] = [];

        allBookingsSnapshot.docs.forEach((bookingDoc) => {
          // Kombiniere die Daten mit der ID
          const rawData = bookingDoc.data();
          const bookingData = {
            ...rawData,
            id: bookingDoc.id,
          };

          console.log(`📋 Prüfe Buchung ${bookingDoc.id}:`, {
            bookingEmail: rawData.email,
            customerEmail: customerData.email,
            customerId: rawData.customerId,
            userId: rawData.userId,
            status: rawData.status,
            date: rawData.date,
            id: bookingDoc.id,
          });

          // Prüfe verschiedene Möglichkeiten der Zuordnung
          if (
            rawData.customerId === doc.id ||
            rawData.userId === doc.id ||
            rawData.email === customerData.email
          ) {
            console.log(`✅ Buchung gehört zu Kunde ${customerData.firstName}`);
            customerBookings++;
            customerBookingsList.push(bookingData);
          }
        });

        console.log(
          `🎯 ${customerData.firstName} hat ${customerBookings} aktive Buchungen`
        );

        // Zähle auch kürzliche bestätigte Buchungen für Treuerabatt
        const sixMonthsAgoStr = sixMonthsAgo.toISOString().split("T")[0];
        let recentConfirmedBookings = 0;

        allBookingsSnapshot.docs.forEach((bookingDoc) => {
          const bookingData = bookingDoc.data();
          if (
            (bookingData.customerId === doc.id ||
              bookingData.userId === doc.id ||
              bookingData.email === customerData.email) &&
            bookingData.status === "confirmed" &&
            bookingData.date >= sixMonthsAgoStr
          ) {
            recentConfirmedBookings++;
          }
        });

        const totalBookingsCount = customerBookings;
        const recentBookingsCount = recentConfirmedBookings;

        // **NEUE RABATT-BERECHNUNG mit discountService**
        let loyaltyProgress = null;
        let birthdayEligibility = null;
        let totalSavings = 0;

        try {
          // Treuerabatt-Fortschritt prüfen (mit E-Mail statt UID)
          console.log(
            `🔍 Prüfe Treuerabatt für ${customerData.firstName} (${customerData.email})`
          );
          loyaltyProgress = await checkLoyaltyDiscountEligibilityByEmail(
            customerData.email
          );
          console.log(
            `✅ Treuerabatt-Ergebnis für ${customerData.firstName}:`,
            loyaltyProgress
          );

          // Geburtstagsrabatt prüfen (falls Geburtsdatum vorhanden)
          if (customerData.birthdate) {
            birthdayEligibility = await checkBirthdayDiscountEligibility(
              doc.id
            );
          }

          // Gesamte Ersparnisse aus allen Buchungen berechnen
          customerBookingsList.forEach((booking) => {
            if (booking.totalSavings) {
              totalSavings += booking.totalSavings;
            }
          });
        } catch (error) {
          console.error(
            `Fehler bei Rabattberechnung für ${customerData.firstName}:`,
            error
          );
        }

        const isEligibleForLoyaltyDiscount =
          loyaltyProgress?.isEligible || false;
        const isEligibleForBirthdayDiscount =
          birthdayEligibility?.isEligible || false;

        if (isEligibleForLoyaltyDiscount) loyaltyCount++;
        if (isEligibleForBirthdayDiscount) birthdayCount++;

        // Kunden für Anzeige vorbereiten
        customersData.push({
          id: doc.id,
          ...customerData,
          bookingsCount: totalBookingsCount,
          currentBookings: customerBookingsList,
          isEligibleForLoyaltyDiscount,
          isEligibleForBirthdayDiscount,
          loyaltyProgress: loyaltyProgress?.progress,
          lastDiscountDate: loyaltyProgress?.lastDiscountDate,
          totalSavings,
          birthdayWeekActive: isEligibleForBirthdayDiscount,
        });
      }

      // Admin-Statistiken berechnen
      const totalSavingsGenerated = customersData.reduce(
        (sum, customer) => sum + (customer.totalSavings || 0),
        0
      );
      const customersWithBirthdate = customersData.filter(
        (customer) => customer.birthdate && customer.birthdate.trim() !== ""
      ).length;

      setCustomers(customersData);
      setAdminData({
        totalCustomers: customersData.length,
        loyaltyDiscounts: loyaltyCount,
        birthdayDiscounts: birthdayCount,
        totalSavingsGenerated,
        customersWithBirthdate,
      });
    } catch (error) {
      console.error("Fehler beim Laden der Kundendaten:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Hilfsfunktion zur Überprüfung, ob Kunde in dieser Woche Geburtstag hat
  const hasBirthdayThisWeek = (birthdate: string): boolean => {
    if (!birthdate) return false;

    const today = new Date();
    const birthDate = new Date(birthdate);

    // Aktuelles Jahr für den Vergleich verwenden
    const birthdateThisYear = new Date(
      today.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate()
    );

    // Beginn dieser Woche berechnen (Montag)
    const startOfWeek = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Montag ist der erste Tag der Woche
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Ende dieser Woche berechnen (Sonntag)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Prüfen, ob Geburtstag in dieser Woche liegt
    return birthdateThisYear >= startOfWeek && birthdateThisYear <= endOfWeek;
  };

  // Gefilterte und durchsuchte Kunden
  const filteredCustomers = customers.filter((customer) => {
    // Suche
    const searchMatch =
      searchTerm === "" ||
      customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter
    let filterMatch = true;
    if (filter === "loyalty") {
      filterMatch = customer.isEligibleForLoyaltyDiscount;
    } else if (filter === "birthday") {
      filterMatch = customer.isEligibleForBirthdayDiscount;
    }

    return searchMatch && filterMatch;
  });

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
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        {/* Kompakter Admin Header */}
        <section className="admin-header-compact">
          <div className="container">
            <div className="admin-header-content">
              <h1 className="admin-title">Admin Dashboard</h1>
              <p className="admin-subtitle">
                Verwalten Sie Ihre Kunden, Buchungen und Rabatte
              </p>
            </div>
          </div>
        </section>

        {/* Kompakte Dashboard Statistiken */}
        <section className="admin-stats-section">
          <div className="container">
            <h2 className="stats-title">Aktuelle Statistiken</h2>

            <div className="stats-cards-compact">
              <div
                className="stat-card-compact clickable"
                onClick={() => {
                  const customerSection = document.getElementById(
                    "customer-management"
                  );
                  customerSection?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="stat-icon-compact">
                  <ion-icon name="people-outline"></ion-icon>
                </div>
                <div className="stat-info">
                  <span className="stat-number-compact">
                    {adminData.totalCustomers}
                  </span>
                  <span className="stat-label-compact">Kunden gesamt</span>
                </div>
              </div>

              <div className="stat-card-compact">
                <div className="stat-icon-compact loyalty">
                  <ion-icon name="gift-outline"></ion-icon>
                </div>
                <div className="stat-info">
                  <span className="stat-number-compact">
                    {adminData.loyaltyDiscounts}
                  </span>
                  <span className="stat-label-compact">Treuerabatte (20%)</span>
                </div>
              </div>

              <div className="stat-card-compact">
                <div className="stat-icon-compact birthday">
                  <ion-icon name="gift-outline"></ion-icon>
                </div>
                <div className="stat-info">
                  <span className="stat-number-compact">
                    {adminData.birthdayDiscounts}
                  </span>
                  <span className="stat-label-compact">
                    Geburtstagsrabatte (10%)
                  </span>
                </div>
              </div>

              <div className="stat-card-compact">
                <div className="stat-icon-compact savings">
                  <ion-icon name="cash-outline"></ion-icon>
                </div>
                <div className="stat-info">
                  <span className="stat-number-compact">
                    €{(adminData.totalSavingsGenerated || 0).toFixed(0)}
                  </span>
                  <span className="stat-label-compact">
                    Ersparnisse generiert
                  </span>
                </div>
              </div>

              <div className="stat-card-compact">
                <div className="stat-icon-compact birthdate">
                  <ion-icon name="calendar-outline"></ion-icon>
                </div>
                <div className="stat-info">
                  <span className="stat-number-compact">
                    {adminData.customersWithBirthdate || 0}
                  </span>
                  <span className="stat-label-compact">
                    Kunden mit Geburtstag
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Kunden Management */}
        <section id="customer-management" className="admin-customers-section">
          <div className="container">
            <div className="customers-header">
              <h2 className="customers-title">Kunden verwalten</h2>
              <div className="admin-nav-buttons">
                <Link
                  href="/admin/bookings"
                  className="btn btn--outline bookings-link"
                >
                  <ion-icon name="calendar-outline"></ion-icon>
                  Alle Buchungen
                </Link>
                <Link
                  href="/admin/calendar"
                  className="btn btn--primary calendar-link"
                >
                  <ion-icon name="time-outline"></ion-icon>
                  Kalender verwalten
                </Link>
                <Link
                  href="/admin/manage-admins"
                  className="btn btn--secondary admin-manage-link"
                >
                  <ion-icon name="people-outline"></ion-icon>
                  Admin verwalten
                </Link>
              </div>
            </div>

            {/* Suchleiste und Filter */}
            <div className="admin-search-controls">
              <div className="search-input-container">
                <ion-icon name="search-outline"></ion-icon>
                <input
                  type="text"
                  placeholder="Suche nach Namen oder E-Mail..."
                  className="admin-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="admin-filter-buttons">
                <button
                  className={`admin-filter-btn ${filter === "all" ? "active" : ""}`}
                  onClick={() => setFilter("all")}
                >
                  Alle
                </button>
                <button
                  className={`admin-filter-btn ${filter === "loyalty" ? "active" : ""}`}
                  onClick={() => setFilter("loyalty")}
                >
                  Treuerabatt
                </button>
                <button
                  className={`admin-filter-btn ${filter === "birthday" ? "active" : ""}`}
                  onClick={() => setFilter("birthday")}
                >
                  Geburtstagsrabatt
                </button>
              </div>
            </div>
          </div>

          {/* Kundentabelle - VOLLE BREITE */}
          <div className="admin-table-fullwidth">
            {isLoading ? (
              <div className="admin-loading">
                <div className="loading-icon">
                  <ion-icon name="sync-outline"></ion-icon>
                </div>
                <p>Lade Kundendaten...</p>
              </div>
            ) : (
              <>
                {/* Desktop Tabelle */}
                <div className="admin-table-container desktop-table">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>E-Mail</th>
                        <th>Telefon</th>
                        <th>Geburtstag</th>
                        <th>Buchungen</th>
                        <th>Rabatt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id}>
                          <td>
                            <div className="customer-name">
                              {customer.firstName} {customer.lastName}
                            </div>
                          </td>
                          <td>
                            <div className="customer-email">
                              {customer.email}
                            </div>
                          </td>
                          <td>
                            <div className="customer-phone">
                              {customer.phone}
                            </div>
                          </td>
                          <td>
                            <div className="customer-birthdate">
                              {customer.birthdate}
                            </div>
                          </td>
                          <td>
                            <div className="customer-bookings">
                              {customer.currentBookings &&
                              customer.currentBookings.length > 0 ? (
                                <div className="bookings-list">
                                  {customer.currentBookings
                                    .sort(
                                      (a, b) =>
                                        new Date(a.date).getTime() -
                                        new Date(b.date).getTime()
                                    )
                                    .map((booking, index) => (
                                      <div
                                        key={index}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "8px",
                                          marginBottom: "4px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            flex: 1,
                                          }}
                                        >
                                          <button
                                            className="booking-item"
                                            onClick={() =>
                                              openBookingDetails(
                                                booking,
                                                customer
                                              )
                                            }
                                            title="Klicken für Details"
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              opacity:
                                                booking.status === "cancelled"
                                                  ? "0.7"
                                                  : "1",
                                              minWidth: "140px",
                                              backgroundColor:
                                                booking.status === "cancelled"
                                                  ? "#f3f4f6"
                                                  : "#fff",
                                            }}
                                          >
                                            📅 {formatDate(booking.date)} -{" "}
                                            {booking.time}
                                          </button>
                                          {booking.status === "cancelled" && (
                                            <span
                                              style={{
                                                fontSize: "0.85rem",
                                                color: "#dc2626",
                                                backgroundColor: "#fee2e2",
                                                padding: "2px 8px",
                                                borderRadius: "4px",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "4px",
                                                whiteSpace: "nowrap",
                                                userSelect: "none",
                                              }}
                                            >
                                              <ion-icon name="close-circle"></ion-icon>
                                              Storniert
                                            </span>
                                          )}
                                        </div>
                                        {booking.status !== "cancelled" && (
                                          <button
                                            className="cancel-btn"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              console.log(
                                                "Buchungsdaten:",
                                                booking
                                              );
                                              console.log(
                                                "Buchungs-ID:",
                                                booking.id
                                              );
                                              openCancelModal(
                                                booking.id,
                                                `${customer.firstName} ${customer.lastName}`
                                              );
                                            }}
                                            disabled={cancellingBookings.has(
                                              booking.id
                                            )}
                                            style={{
                                              backgroundColor:
                                                cancellingBookings.has(
                                                  booking.id
                                                )
                                                  ? "#f87171"
                                                  : "#ef4444",
                                              color: "white",
                                              border: "none",
                                              borderRadius: "6px",
                                              padding: "6px 12px",
                                              cursor: cancellingBookings.has(
                                                booking.id
                                              )
                                                ? "not-allowed"
                                                : "pointer",
                                              opacity: cancellingBookings.has(
                                                booking.id
                                              )
                                                ? "0.8"
                                                : "1",
                                              fontSize: "0.85rem",
                                              fontWeight: "500",
                                              display: "inline-flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              gap: "4px",
                                              transition: "all 0.2s ease",
                                              boxShadow:
                                                "0 1px 2px rgba(0,0,0,0.05)",
                                              minWidth: "90px",
                                              marginLeft: "auto",
                                            }}
                                          >
                                            <ion-icon name="close-circle-outline"></ion-icon>
                                            {cancellingBookings.has(booking.id)
                                              ? "Wird storniert..."
                                              : "Stornieren"}
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                <span className="no-bookings">
                                  Keine Buchungen
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="customer-discounts">
                              {/* Treuerabatt Status */}
                              {customer.isEligibleForLoyaltyDiscount ? (
                                <div className="discount-item">
                                  <span className="discount-badge loyalty-active">
                                    ⭐ 20% Bereit
                                  </span>
                                </div>
                              ) : customer.loyaltyProgress ? (
                                <div className="discount-item">
                                  <span className="discount-badge loyalty-progress">
                                    {customer.loyaltyProgress.current}/
                                    {customer.loyaltyProgress.required}{" "}
                                    Behandlungen
                                  </span>
                                  <div className="mini-progress">
                                    <div
                                      className="mini-progress-fill"
                                      style={{
                                        width: `${(customer.loyaltyProgress.current / customer.loyaltyProgress.required) * 100}%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              ) : (
                                <span className="discount-badge loyalty-none">
                                  0/5 Behandlungen
                                </span>
                              )}

                              {/* Geburtstagsrabatt Status */}
                              {customer.birthdayWeekActive && (
                                <div className="discount-item">
                                  <span className="discount-badge birthday-active">
                                    🎂 10% Aktiv
                                  </span>
                                </div>
                              )}

                              {/* Ersparnisse anzeigen */}
                              {customer.totalSavings &&
                                customer.totalSavings > 0 && (
                                  <div className="discount-item">
                                    <span className="discount-badge savings">
                                      €{(customer.totalSavings || 0).toFixed(0)}{" "}
                                      gespart
                                    </span>
                                  </div>
                                )}

                              {/* Fallback wenn keine Rabatte */}
                              {!customer.isEligibleForLoyaltyDiscount &&
                                !customer.birthdayWeekActive &&
                                (!customer.totalSavings ||
                                  customer.totalSavings === 0) &&
                                !customer.loyaltyProgress && (
                                  <span className="discount-badge none">
                                    Keine Rabatte
                                  </span>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Karten Layout */}
                <div className="mobile-customer-cards">
                  {filteredCustomers.map((customer) => (
                    <div key={customer.id} className="customer-card">
                      <div className="customer-card-header">
                        <div>
                          <div className="customer-name-mobile">
                            {customer.firstName} {customer.lastName}
                          </div>
                          <div className="customer-email-mobile">
                            {customer.email}
                          </div>
                        </div>
                      </div>

                      <div className="customer-details">
                        <div className="detail-row">
                          <span className="detail-label">📞 Telefon:</span>
                          <span className="detail-value">{customer.phone}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">🎂 Geburtstag:</span>
                          <span className="detail-value">
                            {customer.birthdate || "Nicht angegeben"}
                          </span>
                        </div>
                      </div>

                      {customer.currentBookings &&
                        customer.currentBookings.length > 0 && (
                          <div className="customer-bookings-mobile">
                            <div className="bookings-title">
                              📅 Aktuelle Buchungen:
                            </div>
                            {customer.currentBookings.map((booking, index) => (
                              <button
                                key={index}
                                className="booking-item"
                                onClick={() =>
                                  openBookingDetails(booking, customer)
                                }
                              >
                                {formatDate(booking.date)} - {booking.time}
                              </button>
                            ))}
                          </div>
                        )}

                      <div className="discounts-mobile">
                        {/* Treuerabatt Status */}
                        {customer.isEligibleForLoyaltyDiscount ? (
                          <span className="discount-badge loyalty-active">
                            ⭐ 20% Bereit
                          </span>
                        ) : customer.loyaltyProgress ? (
                          <span className="discount-badge loyalty-progress">
                            {customer.loyaltyProgress.current}/
                            {customer.loyaltyProgress.required} Behandlungen
                          </span>
                        ) : (
                          <span className="discount-badge loyalty-none">
                            0/5 Behandlungen
                          </span>
                        )}

                        {/* Geburtstagsrabatt Status */}
                        {customer.birthdayWeekActive && (
                          <span className="discount-badge birthday-active">
                            🎂 10% Aktiv
                          </span>
                        )}

                        {/* Ersparnisse anzeigen */}
                        {customer.totalSavings && customer.totalSavings > 0 && (
                          <span className="discount-badge savings">
                            €{(customer.totalSavings || 0).toFixed(0)} gespart
                          </span>
                        )}

                        {/* Fallback wenn keine Rabatte */}
                        {!customer.isEligibleForLoyaltyDiscount &&
                          !customer.birthdayWeekActive &&
                          (!customer.totalSavings ||
                            customer.totalSavings === 0) &&
                          !customer.loyaltyProgress && (
                            <span className="discount-badge none">
                              Keine Rabatte
                            </span>
                          )}
                      </div>
                    </div>
                  ))}
                </div>

                {filteredCustomers.length === 0 && (
                  <div className="admin-empty-state">
                    <div className="empty-icon">
                      <ion-icon name="people-outline"></ion-icon>
                    </div>
                    <p>Keine Kunden gefunden.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <style jsx>{`
        /* Desktop - Mobile Karten verstecken */
        .mobile-customer-cards {
          display: none;
        }

        /* Mobile Optimierungen für Admin Dashboard */
        @media (max-width: 768px) {
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

          /* Kompakte Statistik-Karten für Mobile */
          .stats-cards-compact {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin: 2rem 0;
          }

          .stat-card-compact {
            padding: 1.2rem;
            border-radius: 8px;
            background: #fff;
            border: 1px solid #e5e7eb;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            min-height: 8rem;
          }

          .stat-icon-compact {
            font-size: 2rem;
            margin-bottom: 0.8rem;
            color: #6b7280;
          }

          .stat-number-compact {
            font-size: 1.8rem;
            font-weight: 700;
            color: #1f2937;
            display: block;
            margin-bottom: 0.4rem;
          }

          .stat-label-compact {
            font-size: 1.1rem;
            color: #6b7280;
            line-height: 1.3;
          }

          /* Navigation Buttons für Mobile */
          .admin-nav-buttons {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-top: 2rem;
          }

          .admin-nav-buttons .btn {
            padding: 1.2rem 1.6rem;
            font-size: 1.4rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.8rem;
            text-decoration: none;
            font-weight: 600;
          }

          .admin-nav-buttons .btn ion-icon {
            font-size: 1.8rem;
          }

          /* Such- und Filter-Bereich */
          .admin-search-controls {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            margin: 2rem 0;
            padding: 0 1rem;
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

          .admin-filter-buttons {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.8rem;
          }

          .admin-filter-btn {
            padding: 1rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: #fff;
            font-size: 1.2rem;
            font-weight: 500;
            color: #374151;
            cursor: pointer;
            transition: all 0.2s;
          }

          .admin-filter-btn.active {
            background: #3b82f6;
            color: #fff;
            border-color: #3b82f6;
          }

          /* Mobile Tabelle - Karten Layout */
          .desktop-table {
            display: none; /* Verstecke Desktop-Tabelle auf Mobile */
          }

          /* Mobile Kunden-Karten */
          .mobile-customer-cards {
            display: block;
            margin: 2rem 1rem;
          }

          .customer-card {
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 1.6rem;
            margin-bottom: 1.6rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }

          .customer-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1.2rem;
          }

          .customer-name-mobile {
            font-size: 1.6rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 0.4rem;
          }

          .customer-email-mobile {
            font-size: 1.3rem;
            color: #6b7280;
          }

          .customer-details {
            margin-bottom: 1.2rem;
          }

          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.8rem 0;
            border-bottom: 1px solid #f3f4f6;
          }

          .detail-row:last-child {
            border-bottom: none;
          }

          .detail-label {
            font-size: 1.2rem;
            color: #6b7280;
            font-weight: 500;
          }

          .detail-value {
            font-size: 1.3rem;
            color: #1f2937;
            font-weight: 500;
          }

          .customer-bookings-mobile {
            margin-top: 1.2rem;
          }

          .bookings-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 0.8rem;
          }

          .booking-item {
            background: #f8fafa;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 1rem;
            margin-bottom: 0.8rem;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 1.2rem;
          }

          .booking-item:hover {
            background: #f0f9ff;
            border-color: #3b82f6;
          }

          .discounts-mobile {
            display: flex;
            flex-wrap: wrap;
            gap: 0.6rem;
            margin-top: 1rem;
          }

          .discount-badge {
            padding: 0.6rem 1rem;
            border-radius: 20px;
            font-size: 1.1rem;
            font-weight: 500;
            white-space: nowrap;
          }

          .discount-badge.loyalty-active {
            background: #dcfce7;
            color: #166534;
          }

          .discount-badge.birthday-active {
            background: #fef3c7;
            color: #92400e;
          }

          .discount-badge.savings {
            background: #e0f2fe;
            color: #0369a1;
          }

          .discount-badge.none {
            background: #f3f4f6;
            color: #6b7280;
          }

          /* Modal für Mobile anpassen */
          .booking-modal {
            width: 95%;
            max-width: none;
            max-height: 90vh;
            overflow-y: auto;
            margin: 2rem auto;
          }

          .modal-content {
            padding: 1.5rem;
          }

          .booking-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            animation: fadeIn 0.2s ease-out;
          }

          .booking-modal {
            background: white;
            border-radius: 12px;
            max-width: 90%;
            width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            animation: slideIn 0.3s ease-out;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideIn {
            from {
              transform: translateY(-20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .detail-grid {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.8rem 0;
            border-bottom: 1px solid #f3f4f6;
          }

          .treatment-item {
            background: #f8fafa;
            padding: 1.2rem;
            border-radius: 8px;
            margin-bottom: 1rem;
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

        @media (max-width: 480px) {
          .stats-cards-compact {
            grid-template-columns: 1fr;
            gap: 1.2rem;
          }

          .admin-filter-buttons {
            grid-template-columns: 1fr;
          }

          .customer-card {
            padding: 1.2rem;
          }

          .customer-name-mobile {
            font-size: 1.4rem;
          }
        }
      `}</style>

      {/* Buchungsdetails Modal */}
      {showBookingModal && selectedBooking && selectedCustomer && (
        <div className="booking-modal-overlay" onClick={closeBookingModal}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Buchungsdetails</h2>
              <button className="modal-close" onClick={closeBookingModal}>
                ✕
              </button>
            </div>

            <div className="modal-content">
              <div className="booking-detail-section">
                <h3>👤 Kunde</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Name:</span>
                    <span className="value">
                      {selectedCustomer.firstName} {selectedCustomer.lastName}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">E-Mail:</span>
                    <span className="value">{selectedCustomer.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Telefon:</span>
                    <span className="value">{selectedCustomer.phone}</span>
                  </div>
                </div>
              </div>

              <div className="booking-detail-section">
                <h3>📅 Termin</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Datum:</span>
                    <span className="value">
                      {formatDate(selectedBooking.date)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Uhrzeit:</span>
                    <span className="value">{selectedBooking.time}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Status:</span>
                    <span className={`value status-${selectedBooking.status}`}>
                      {selectedBooking.status === "confirmed"
                        ? "Bestätigt"
                        : selectedBooking.status === "pending"
                          ? "Ausstehend"
                          : selectedBooking.status === "cancelled"
                            ? "Storniert"
                            : selectedBooking.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="booking-detail-section">
                <h3>💅 Behandlungen</h3>
                <div className="treatments-list">
                  {selectedBooking.treatments &&
                  selectedBooking.treatments.length > 0 ? (
                    selectedBooking.treatments.map(
                      (treatment: any, index: number) => (
                        <div key={index} className="treatment-item">
                          <div className="treatment-name">{treatment.name}</div>
                          <div className="treatment-details">
                            <span className="treatment-duration">
                              ⏱️ {treatment.duration} Min
                            </span>
                            <span className="treatment-price">
                              💰 {treatment.price}€
                            </span>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <p>Keine Behandlungen verfügbar</p>
                  )}
                </div>
              </div>

              {selectedBooking.totalPrice && (
                <div className="booking-detail-section">
                  <h3>💰 Kosten</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Gesamtpreis:</span>
                      <span className="value total-price">
                        {selectedBooking.totalPrice}€
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedBooking.message && (
                <div className="booking-detail-section">
                  <h3>💬 Nachricht</h3>
                  <div className="message-content">
                    {selectedBooking.message}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stornierungsmodal */}
      {showCancelModal && bookingToCancel && (
        <div
          className="booking-modal-overlay"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="booking-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "500px",
              background: "white",
              borderRadius: "12px",
              boxShadow:
                "0 20px 25px -5px rgba(0,0,0,0.1),0 10px 10px -5px rgba(0,0,0,0.04)",
            }}
          >
            <div
              className="modal-header"
              style={{ borderBottom: "1px solid #e5e7eb", padding: "1.5rem" }}
            >
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  color: "#1f2937",
                }}
              >
                Buchung stornieren
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowCancelModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-content" style={{ padding: "1.5rem" }}>
              <div style={{ marginBottom: "2rem" }}>
                <ion-icon
                  name="warning-outline"
                  style={{
                    fontSize: "3rem",
                    color: "#ef4444",
                    marginBottom: "1rem",
                    display: "block",
                    margin: "0 auto",
                  }}
                ></ion-icon>
                <p
                  style={{
                    textAlign: "center",
                    color: "#374151",
                    fontSize: "1.1rem",
                    lineHeight: "1.5",
                    marginTop: "1rem",
                  }}
                >
                  Möchten Sie die Buchung von{" "}
                  <strong>{bookingToCancel.customerName}</strong> wirklich
                  stornieren?
                  <br />
                  <span style={{ color: "#ef4444", fontSize: "0.9rem" }}>
                    Diese Aktion kann nicht rückgängig gemacht werden.
                  </span>
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "center",
                }}
              >
                <button
                  onClick={() => setShowCancelModal(false)}
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    background: "white",
                    color: "#374151",
                    fontSize: "0.95rem",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCancelBooking}
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderRadius: "6px",
                    border: "none",
                    background: "#ef4444",
                    color: "white",
                    fontSize: "0.95rem",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  Ja, Buchung stornieren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
