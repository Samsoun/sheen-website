"use client";

import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/utils/firebase-config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
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
          const bookingData = bookingDoc.data();

          console.log(`📋 Prüfe Buchung ${bookingDoc.id}:`, {
            bookingEmail: bookingData.email,
            customerEmail: customerData.email,
            customerId: bookingData.customerId,
            userId: bookingData.userId,
            status: bookingData.status,
            date: bookingData.date,
          });

          // Prüfe verschiedene Möglichkeiten der Zuordnung
          if (
            bookingData.customerId === doc.id ||
            bookingData.userId === doc.id ||
            bookingData.email === customerData.email
          ) {
            console.log(`✅ Buchung gehört zu Kunde ${customerData.firstName}`);
            if (bookingData.status !== "cancelled") {
              customerBookings++;
              customerBookingsList.push(bookingData);
            }
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
                <div className="admin-table-container">
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
                                  {customer.currentBookings.map(
                                    (booking, index) => (
                                      <button
                                        key={index}
                                        className="booking-item"
                                        onClick={() =>
                                          openBookingDetails(booking, customer)
                                        }
                                        title="Klicken für Details"
                                      >
                                        📅 {formatDate(booking.date)} -{" "}
                                        {booking.time}
                                      </button>
                                    )
                                  )}
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
    </>
  );
}
