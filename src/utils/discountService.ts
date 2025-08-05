import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { db, getCustomerByUID } from "./firebase-config";

/**
 * Interface für Benutzerdaten mit Rabattinformationen
 */
export interface UserDiscountData {
  userId: string;
  name: string;
  email: string;
  birthDate?: Timestamp | null;
  bookingCountLast6Months: number;
  lastDiscountDate?: Timestamp | null;
  isEligibleForLoyaltyDiscount: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Interface für Rabattinformationen
 */
export interface DiscountInfo {
  type: "loyalty" | "birthday" | "none";
  percentage: number;
  amount: number;
  description: string;
  isEligible: boolean;
  progressInfo?: {
    current: number;
    required: number;
    remaining: number;
  };
}

/**
 * Interface für erweiterte Buchungsdaten mit Rabattinformationen
 */
export interface BookingWithDiscount {
  originalPrice: number;
  discountInfo: DiscountInfo;
  finalPrice: number;
  savings: number;
}

/**
 * Hilfsfunktion: Datum vor 6 Monaten berechnen
 */
function getSixMonthsAgo(): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - 6);
  return date;
}

/**
 * Hilfsfunktion: Ist das aktuelle Datum in der Geburtstagswoche?
 */
function isInBirthdayWeek(
  birthDate: Date,
  checkDate: Date = new Date()
): boolean {
  // Aktuelles Jahr für Geburtstag verwenden
  const currentYear = checkDate.getFullYear();
  const birthdayThisYear = new Date(
    currentYear,
    birthDate.getMonth(),
    birthDate.getDate()
  );

  // Wenn Geburtstag schon war, nächstes Jahr verwenden
  if (birthdayThisYear < checkDate) {
    birthdayThisYear.setFullYear(currentYear + 1);
  }

  // Woche vor und nach dem Geburtstag berechnen
  const weekStart = new Date(birthdayThisYear);
  weekStart.setDate(birthdayThisYear.getDate() - 3); // 3 Tage vor Geburtstag

  const weekEnd = new Date(birthdayThisYear);
  weekEnd.setDate(birthdayThisYear.getDate() + 3); // 3 Tage nach Geburtstag

  return checkDate >= weekStart && checkDate <= weekEnd;
}

/**
 * Benutzerdaten für Rabattsystem abrufen oder erstellen
 */
export async function getUserDiscountData(
  userId: string
): Promise<UserDiscountData | null> {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserDiscountData;
    }

    return null;
  } catch (error) {
    console.error("Fehler beim Abrufen der Benutzerdaten:", error);
    return null;
  }
}

/**
 * Anzahl Behandlungen in den letzten 6 Monaten für einen Benutzer abrufen
 */
export async function getBookingCountLast6Months(
  userId: string
): Promise<number> {
  try {
    // Zuerst die E-Mail-Adresse des Benutzers abrufen
    const customerData = await getCustomerByUID(userId);
    if (!customerData || !customerData.email) {
      console.log("Keine Kundendaten oder E-Mail für userId:", userId);
      return 0;
    }

    const sixMonthsAgo = getSixMonthsAgo();
    const bookingsRef = collection(db, "bookings");

    // Debug-Log
    console.log("Suche Buchungen für:", {
      email: customerData.email,
      sixMonthsAgo: sixMonthsAgo.toISOString(),
      userId,
    });

    const q = query(
      bookingsRef,
      where("email", "==", customerData.email),
      where("status", "==", "confirmed")
    );

    const querySnapshot = await getDocs(q);

    // Manuell nach Datum filtern und Behandlungen zählen (nicht Buchungen)
    let count = 0;
    querySnapshot.forEach((doc) => {
      const booking = doc.data();

      // Buchungsdatum prüfen (Format: YYYY-MM-DD)
      if (booking.date) {
        const bookingDate = new Date(booking.date);
        if (bookingDate >= sixMonthsAgo) {
          // Anzahl der Behandlungen in dieser Buchung zählen
          const treatmentCount = booking.treatments
            ? booking.treatments.length
            : 1;
          count += treatmentCount;

          console.log(
            `  📋 Buchung vom ${booking.date}: ${treatmentCount} Behandlungen`
          );
        }
      }
    });

    console.log(
      `Gefunden: ${count} Behandlungen in den letzten 6 Monaten für ${customerData.email}`
    );
    return count;
  } catch (error) {
    console.error("Fehler beim Abrufen der Behandlungsanzahl:", error);
    return 0;
  }
}

/**
 * Rabattberechtigung für Treuerabatt prüfen
 */
export async function checkLoyaltyDiscountEligibility(userId: string): Promise<{
  isEligible: boolean;
  progress: { current: number; required: number; remaining: number };
  lastDiscountDate?: Date;
}> {
  try {
    console.log("🔍 NEUE EINFACHE Treuerabatt-Prüfung für User:", userId);

    // 🎯 EINFACHE LÖSUNG: Verwende direkten Zähler aus der Datenbank
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    let currentTreatmentCount = 0;
    let lastDiscountDate: Date | undefined;

    if (userDoc.exists()) {
      const userData = userDoc.data();
      // Verwende einen einfachen Zähler statt komplexer Datumslogik
      currentTreatmentCount = userData.treatmentCountSinceLastDiscount || 0;
      lastDiscountDate = userData.lastDiscountDate?.toDate();

      console.log("📊 EINFACHER Behandlungszähler:", {
        behandlungenSeitLetztemRabatt: currentTreatmentCount,
        letzterRabatt: lastDiscountDate?.toISOString() || "Nie",
      });
    } else {
      console.log("ℹ️ Kein Benutzerdatensatz gefunden, erstelle neuen");

      // Erstelle Benutzerdatensatz mit Zähler = 0
      await setDoc(userRef, {
        treatmentCountSinceLastDiscount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      currentTreatmentCount = 0;
    }

    const required = 5;
    const isEligible = currentTreatmentCount >= required;
    const remaining = Math.max(0, required - currentTreatmentCount);

    console.log("🎯 EINFACHES Treuerabatt-Ergebnis:", {
      aktuellerZähler: currentTreatmentCount,
      benötigt: required,
      berechtigt: isEligible,
      verbleibend: remaining,
    });

    return {
      isEligible,
      progress: {
        current: currentTreatmentCount,
        required,
        remaining,
      },
      lastDiscountDate,
    };
  } catch (error) {
    console.error("Fehler bei der Treuerabatt-Prüfung:", error);
    return {
      isEligible: false,
      progress: { current: 0, required: 5, remaining: 5 },
    };
  }
}

/**
 * Behandlungen seit einem bestimmten Datum zählen
 */
async function getBookingCountSinceDate(
  userId: string,
  sinceDate: Date
): Promise<number> {
  try {
    // Zuerst die E-Mail-Adresse des Benutzers abrufen
    const customerData = await getCustomerByUID(userId);
    if (!customerData || !customerData.email) {
      console.log("Keine Kundendaten oder E-Mail für userId:", userId);
      return 0;
    }

    const bookingsRef = collection(db, "bookings");

    // Debug-Log
    console.log("Suche Buchungen seit Datum für:", {
      email: customerData.email,
      sinceDate: sinceDate.toISOString(),
      userId,
    });

    const q = query(
      bookingsRef,
      where("email", "==", customerData.email),
      where("status", "==", "confirmed")
    );

    const querySnapshot = await getDocs(q);

    // Manuell nach Datum filtern und Behandlungen zählen
    let count = 0;
    querySnapshot.forEach((doc) => {
      const booking = doc.data();

      // Buchungsdatum prüfen (Format: YYYY-MM-DD)
      if (booking.date) {
        const bookingDate = new Date(booking.date);
        // WICHTIG: Buchungen am gleichen Tag wie der Rabatt sollen NICHT zählen
        // weil sie bereits für den aktuellen Rabatt verwendet wurden
        if (bookingDate > sinceDate) {
          // Anzahl der Behandlungen in dieser Buchung zählen
          const treatmentCount = booking.treatments
            ? booking.treatments.length
            : 1;
          count += treatmentCount;

          console.log(
            `  ✅ Buchung vom ${booking.date}: ${treatmentCount} Behandlungen (ZÄHLT für nächsten Rabatt)`
          );
        } else {
          console.log(
            `  ❌ Buchung vom ${booking.date}: nicht berücksichtigt (am/vor Rabatt-Datum: ${sinceDate.toISOString().split("T")[0]})`
          );
        }
      }
    });

    console.log(
      `Gefunden: ${count} Behandlungen seit ${sinceDate.toISOString()} für ${customerData.email}`
    );
    return count;
  } catch (error) {
    console.error("Fehler beim Zählen der Behandlungen seit Datum:", error);
    return 0;
  }
}

/**
 * Anzahl Behandlungen in den letzten 6 Monaten für eine E-Mail abrufen
 */
export async function getBookingCountLast6MonthsByEmail(
  email: string
): Promise<number> {
  try {
    const sixMonthsAgo = getSixMonthsAgo();
    const bookingsRef = collection(db, "bookings");

    // Debug-Log
    console.log("Suche Buchungen für E-Mail:", {
      email,
      sixMonthsAgo: sixMonthsAgo.toISOString(),
    });

    const q = query(
      bookingsRef,
      where("email", "==", email),
      where("status", "==", "confirmed")
    );

    const querySnapshot = await getDocs(q);

    // Manuell nach Datum filtern und Behandlungen zählen (nicht Buchungen)
    let count = 0;
    querySnapshot.forEach((doc) => {
      const booking = doc.data();

      // Buchungsdatum prüfen (Format: YYYY-MM-DD)
      if (booking.date) {
        const bookingDate = new Date(booking.date);
        if (bookingDate >= sixMonthsAgo) {
          // Anzahl der Behandlungen in dieser Buchung zählen
          const treatmentCount = booking.treatments
            ? booking.treatments.length
            : 1;
          count += treatmentCount;

          console.log(
            `  📋 Buchung vom ${booking.date}: ${treatmentCount} Behandlungen`
          );
        }
      }
    });

    console.log(
      `Gefunden: ${count} Behandlungen in den letzten 6 Monaten für ${email}`
    );
    return count;
  } catch (error) {
    console.error("Fehler beim Abrufen der Behandlungsanzahl:", error);
    return 0;
  }
}

/**
 * Rabattberechtigung für Treuerabatt prüfen (mit E-Mail)
 */
export async function checkLoyaltyDiscountEligibilityByEmail(
  email: string
): Promise<{
  isEligible: boolean;
  progress: { current: number; required: number; remaining: number };
  lastDiscountDate?: Date;
}> {
  try {
    // Aktuelle Buchungsanzahl abrufen
    const bookingCount = await getBookingCountLast6MonthsByEmail(email);

    // TODO: Benutzerdaten für letzten Rabatt abrufen (momentan ignoriert)
    // Da wir in der Admin-Ansicht sind, nehmen wir an, dass noch kein Rabatt verwendet wurde

    const required = 5;
    const isEligible = bookingCount >= required;
    const remaining = Math.max(0, required - bookingCount);

    return {
      isEligible,
      progress: {
        current: bookingCount,
        required,
        remaining,
      },
    };
  } catch (error) {
    console.error("Fehler bei der Treuerabatt-Prüfung (E-Mail):", error);
    return {
      isEligible: false,
      progress: { current: 0, required: 5, remaining: 5 },
    };
  }
}

/**
 * Geburtstagsrabatt-Berechtigung prüfen
 */
export async function checkBirthdayDiscountEligibility(
  userId: string
): Promise<{
  isEligible: boolean;
  daysUntilBirthday?: number;
  birthdayWeekStart?: Date;
  birthdayWeekEnd?: Date;
}> {
  try {
    const userData = await getUserDiscountData(userId);

    if (!userData?.birthDate) {
      return { isEligible: false };
    }

    const birthDate = userData.birthDate.toDate();
    const today = new Date();

    // Prüfen, ob wir in der Geburtstagswoche sind
    const isEligible = isInBirthdayWeek(birthDate, today);

    // Geburtstagswoche berechnen
    const currentYear = today.getFullYear();
    const birthdayThisYear = new Date(
      currentYear,
      birthDate.getMonth(),
      birthDate.getDate()
    );

    if (birthdayThisYear < today) {
      birthdayThisYear.setFullYear(currentYear + 1);
    }

    const weekStart = new Date(birthdayThisYear);
    weekStart.setDate(birthdayThisYear.getDate() - 3);

    const weekEnd = new Date(birthdayThisYear);
    weekEnd.setDate(birthdayThisYear.getDate() + 3);

    // Tage bis zum Geburtstag
    const timeDiff = birthdayThisYear.getTime() - today.getTime();
    const daysUntilBirthday = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return {
      isEligible,
      daysUntilBirthday,
      birthdayWeekStart: weekStart,
      birthdayWeekEnd: weekEnd,
    };
  } catch (error) {
    console.error("Fehler bei der Geburtstagsrabatt-Prüfung:", error);
    return { isEligible: false };
  }
}

/**
 * Verfügbare Rabatte für einen Benutzer berechnen
 */
// Globaler Cache für verwendet Rabatte (um Mehrfachnutzung zu verhindern)
const usedDiscountCache = new Set<string>();

export async function calculateAvailableDiscount(
  userId: string,
  originalPrice: number
): Promise<DiscountInfo> {
  try {
    console.log("💰 Berechne verfügbare Rabatte für User:", userId);

    // 🚨 KRITISCH: Prüfe ob dieser Benutzer bereits einen Rabatt in dieser Session verwendet hat
    if (usedDiscountCache.has(userId)) {
      console.log(
        "🚨 BLOCKIERT: Benutzer hat bereits einen Rabatt in dieser Session verwendet"
      );
      const loyaltyCheck = await checkLoyaltyDiscountEligibility(userId);
      return {
        type: "none",
        percentage: 0,
        amount: 0,
        description: `Treuerabatt bereits verwendet. Noch ${5 - (loyaltyCheck.progress.current || 0)} Behandlungen bis zum nächsten Rabatt.`,
        isEligible: false,
        progressInfo: loyaltyCheck.progress || {
          current: 0,
          required: 5,
          remaining: 5,
        },
      };
    }

    // WICHTIG: Keine pauschale Tagessperre mehr!
    // Die korrekte Logik ist bereits in checkLoyaltyDiscountEligibility implementiert
    console.log(
      "💡 Verwende die präzise Loyalitätsprüfung (keine pauschale Tagessperre)"
    );

    // Treuerabatt prüfen (hat Priorität)
    const loyaltyCheck = await checkLoyaltyDiscountEligibility(userId);
    console.log("🎯 Treuerabatt-Prüfung Ergebnis:", loyaltyCheck);

    if (loyaltyCheck.isEligible) {
      const discountAmount = originalPrice * 0.2; // 20% Rabatt
      console.log("✅ Treuerabatt gewährt:", {
        amount: discountAmount,
        percentage: 20,
      });

      return {
        type: "loyalty",
        percentage: 20,
        amount: discountAmount,
        description:
          "Treuerabatt - Herzlichen Glückwunsch zu Ihrer 5. Buchung!",
        isEligible: true,
        progressInfo: loyaltyCheck.progress,
      };
    }

    // Geburtstagsrabatt prüfen (nur wenn kein Treuerabatt)
    const birthdayCheck = await checkBirthdayDiscountEligibility(userId);
    console.log("🎂 Geburtstagsrabatt-Prüfung Ergebnis:", birthdayCheck);

    if (birthdayCheck.isEligible) {
      const discountAmount = originalPrice * 0.1; // 10% Rabatt
      console.log("✅ Geburtstagsrabatt gewährt:", {
        amount: discountAmount,
        percentage: 10,
      });

      return {
        type: "birthday",
        percentage: 10,
        amount: discountAmount,
        description: "Geburtstagsrabatt - Alles Gute zum Geburtstag! 🎉",
        isEligible: true,
      };
    }

    // Kein Rabatt verfügbar, aber Fortschritt anzeigen
    console.log(
      "ℹ️ Kein Rabatt verfügbar, zeige Fortschritt:",
      loyaltyCheck.progress
    );

    return {
      type: "none",
      percentage: 0,
      amount: 0,
      description: `Noch ${loyaltyCheck.progress.remaining} Behandlungen bis zum Treuerabatt`,
      isEligible: false,
      progressInfo: loyaltyCheck.progress,
    };
  } catch (error) {
    console.error("❌ Fehler bei der Rabattberechnung:", error);
    return {
      type: "none",
      percentage: 0,
      amount: 0,
      description: "Rabattberechnung nicht verfügbar",
      isEligible: false,
    };
  }
}

/**
 * Markiert einen Benutzer als "Rabatt verwendet" um Mehrfachnutzung zu verhindern
 */
export function markDiscountAsUsed(userId: string): void {
  console.log("🔒 Markiere Rabatt als verwendet für User:", userId);
  usedDiscountCache.add(userId);
}

/**
 * Entfernt einen Benutzer aus dem Rabatt-Cache (für neue Sessions)
 */
export function clearDiscountCache(userId?: string): void {
  if (userId) {
    console.log("🗑️ Lösche Rabatt-Cache für User:", userId);
    usedDiscountCache.delete(userId);
  } else {
    console.log("🗑️ Lösche kompletten Rabatt-Cache");
    usedDiscountCache.clear();
  }
}

/**
 * DEBUG: Zeigt den aktuellen Cache-Status (für Testzwecke)
 */
export function getDiscountCacheStatus(): { size: number; users: string[] } {
  const users = Array.from(usedDiscountCache);
  console.log("📊 Aktueller Rabatt-Cache:", {
    size: usedDiscountCache.size,
    users,
  });
  return { size: usedDiscountCache.size, users };
}

/**
 * NOTFALL-RESET: Löscht alle Rabatt-Sperren (nur für Testzwecke)
 */
export function emergencyResetAllDiscounts(): void {
  console.log("🚨 NOTFALL-RESET: Lösche alle Rabatt-Sperren");
  usedDiscountCache.clear();

  // Füge diese Funktion zum Window-Objekt hinzu für Browser-Konsole
  if (typeof window !== "undefined") {
    (window as any).emergencyResetDiscounts = emergencyResetAllDiscounts;
    (window as any).getDiscountCacheStatus = getDiscountCacheStatus;
    console.log("🔧 Debug-Funktionen verfügbar:");
    console.log(
      "  - window.emergencyResetDiscounts() - Löscht alle Rabatt-Sperren"
    );
    console.log("  - window.getDiscountCacheStatus() - Zeigt Cache-Status");
  }
}

/**
 * DEBUG-FUNKTION: Zeigt aktuellen Behandlungszähler
 */
async function showTreatmentCount(userId: string): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log("🔢 AKTUELLER BEHANDLUNGSZÄHLER:", {
        userId,
        treatmentCountSinceLastDiscount:
          data.treatmentCountSinceLastDiscount || 0,
        lastDiscountDate:
          data.lastDiscountDate?.toDate()?.toISOString() || "Nie",
      });
    } else {
      console.log("ℹ️ Kein Benutzerdatensatz gefunden für:", userId);
    }
  } catch (error) {
    console.error("❌ Fehler beim Abrufen des Zählers:", error);
  }
}

/**
 * DEBUG-FUNKTION: Setze Behandlungszähler manuell (für Tests)
 */
async function setTreatmentCount(userId: string, count: number): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      treatmentCountSinceLastDiscount: count,
      updatedAt: Timestamp.now(),
    });
    console.log(
      `✅ Behandlungszähler manuell gesetzt: ${count} für User ${userId}`
    );
  } catch (error) {
    console.error("❌ Fehler beim Setzen des Zählers:", error);
  }
}

/**
 * DEBUG-FUNKTION: Teste Stornierung direkt mit User ID
 */
async function testCancellationByUserId(
  userId: string,
  treatmentCount: number = 2
): Promise<void> {
  try {
    console.log(
      `🧪 TESTE Stornierung: ${treatmentCount} Behandlungen für User ${userId}`
    );
    await decrementTreatmentCount(userId, treatmentCount);
    await showTreatmentCount(userId);
  } catch (error) {
    console.error("❌ Fehler beim Test:", error);
  }
}

/**
 * KORREKTUR-FUNKTION: Berechne Zähler komplett neu basierend auf tatsächlichen Buchungen
 */
export async function recalculateTreatmentCount(userId: string): Promise<void> {
  try {
    console.log(`🔄 NEUBERECHNUNG: Zähle alle Behandlungen für User ${userId}`);

    // 1. User-Daten laden
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    let lastDiscountDate: Date | null = null;
    if (userDoc.exists()) {
      const userData = userDoc.data();
      lastDiscountDate = userData.lastDiscountDate?.toDate() || null;
    }

    // 2. Alle Buchungen des Users laden
    const customerData = await getCustomerByUID(userId);
    if (!customerData?.email) {
      console.log("❌ Keine E-Mail für User gefunden:", userId);
      return;
    }

    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("email", "==", customerData.email),
      where("status", "==", "confirmed")
    );
    const querySnapshot = await getDocs(q);

    // 3. Zähle nur Behandlungen NACH dem letzten Rabatt
    let totalTreatments = 0;
    querySnapshot.forEach((doc) => {
      const booking = doc.data();

      if (booking.date) {
        const bookingDate = new Date(booking.date);

        // Wenn kein Rabatt bisher oder Buchung nach letztem Rabatt
        if (!lastDiscountDate || bookingDate > lastDiscountDate) {
          const treatmentCount = booking.treatments
            ? booking.treatments.length
            : 1;
          totalTreatments += treatmentCount;
          console.log(
            `  ✅ Buchung ${booking.date}: +${treatmentCount} Behandlungen`
          );
        } else {
          console.log(
            `  ⏭️ Buchung ${booking.date}: übersprungen (vor letztem Rabatt)`
          );
        }
      }
    });

    // 4. Zähler in Firebase aktualisieren
    await updateDoc(userRef, {
      treatmentCountSinceLastDiscount: totalTreatments,
      updatedAt: Timestamp.now(),
    });

    console.log(
      `✅ NEUBERECHNUNG abgeschlossen: ${totalTreatments} Behandlungen seit letztem Rabatt`
    );
    console.log(
      `📊 Letzter Rabatt war: ${lastDiscountDate?.toISOString() || "Nie"}`
    );
  } catch (error) {
    console.error("❌ Fehler bei der Neuberechnung:", error);
  }
}

// Initialisiere Debug-Funktionen beim Laden
if (typeof window !== "undefined") {
  (window as any).emergencyResetDiscounts = emergencyResetAllDiscounts;
  (window as any).getDiscountCacheStatus = getDiscountCacheStatus;
  (window as any).showTreatmentCount = showTreatmentCount;
  (window as any).setTreatmentCount = setTreatmentCount;
  (window as any).testCancellationByUserId = testCancellationByUserId;
  (window as any).handleBookingCancellation = handleBookingCancellation;
  (window as any).recalculateTreatmentCount = recalculateTreatmentCount;

  // 🔄 AUTO-RESET: Lösche Cache bei jedem Seitenladen (neue Session)
  // Das ermöglicht es Benutzern, nach einem Seitenladen wieder Rabatte zu erhalten
  if (usedDiscountCache.size > 0) {
    console.log("🔄 AUTO-RESET: Lösche Session-Cache bei Seitenladen");
    usedDiscountCache.clear();
  }

  // Zeige Debug-Info beim ersten Laden
  console.log("🔧 EINFACHES RABATT-SYSTEM DEBUG-MODUS AKTIV");
  console.log("📋 Verfügbare Debug-Funktionen:");
  console.log(
    "  🚨 window.emergencyResetDiscounts() - Notfall-Reset aller Rabatt-Sperren"
  );
  console.log(
    "  📊 window.getDiscountCacheStatus() - Zeigt aktuellen Cache-Status"
  );
  console.log(
    "  🔢 window.showTreatmentCount('[user-id]') - Zeigt aktuellen Behandlungszähler"
  );
  console.log(
    "  ⚙️ window.setTreatmentCount('[user-id]', [count]) - Setzt Zähler manuell"
  );
  console.log(
    "  🧪 window.testCancellationByUserId('[user-id]', [count]) - Testet Stornierung"
  );
  console.log(
    "  📋 window.handleBookingCancellation('[booking-id]') - Testet Buchungsstornierung"
  );
  console.log(
    "  🔄 window.recalculateTreatmentCount('[user-id]') - Neuberechnung basierend auf tatsächlichen Buchungen"
  );
  console.log("  💡 Erweiterte Debug-Funktionen für Stornierungstests");
}

/**
 * Rabatt auf Buchung anwenden und in Firebase speichern
 */
export async function applyDiscountToBooking(
  userId: string,
  bookingId: string,
  discountInfo: DiscountInfo
): Promise<void> {
  try {
    console.log("📝 Wende Rabatt an auf Buchung:", {
      userId,
      bookingId,
      discountType: discountInfo.type,
    });

    if (!discountInfo.isEligible) {
      console.log("❌ Rabatt nicht berechtigt, keine Anwendung");
      return;
    }

    // Buchung mit Rabattinformationen aktualisieren
    const bookingRef = doc(db, "bookings", bookingId);
    const updateData: any = {};

    if (discountInfo.type === "loyalty") {
      updateData.appliedLoyaltyDiscount = true;
      updateData.loyaltyDiscountAmount = discountInfo.amount;
      updateData.loyaltyDiscountPercentage = discountInfo.percentage;
      console.log("🎯 Treuerabatt-Daten für Buchung:", updateData);
    } else if (discountInfo.type === "birthday") {
      updateData.appliedBirthdayDiscount = true;
      updateData.birthdayDiscountAmount = discountInfo.amount;
      updateData.birthdayDiscountPercentage = discountInfo.percentage;
      console.log("🎂 Geburtstagsrabatt-Daten für Buchung:", updateData);
    }

    await updateDoc(bookingRef, updateData);
    console.log("✅ Buchung erfolgreich mit Rabatt aktualisiert");

    // WICHTIG: Bei Treuerabatt sollten Benutzerdaten bereits vorher aktualisiert worden sein
    // Diese Funktion dient nur noch als Backup-Sicherheit
    if (discountInfo.type === "loyalty") {
      console.log("🔄 Backup-Sicherheit: Treuerabatt-Reset für Benutzer");
      await updateUserAfterLoyaltyDiscount(userId);
    }
  } catch (error) {
    console.error("❌ Fehler beim Anwenden des Rabatts:", error);
  }
}

/**
 * Benutzerdaten nach Treuerabatt aktualisieren
 */
async function updateUserAfterLoyaltyDiscount(userId: string): Promise<void> {
  try {
    console.log(
      "🔄 EINFACHER Reset: Setze Behandlungszähler auf 0 nach Treuerabatt für User:",
      userId
    );

    const userRef = doc(db, "users", userId);
    const now = Timestamp.now();

    await updateDoc(userRef, {
      lastDiscountDate: now,
      isEligibleForLoyaltyDiscount: false,
      treatmentCountSinceLastDiscount: 0, // 🎯 RESET AUF 0
      updatedAt: now,
    });

    console.log("✅ EINFACHER Reset erfolgreich:", {
      userId,
      treatmentCountSinceLastDiscount: 0,
      lastDiscountDate: now.toDate().toISOString(),
    });
  } catch (error) {
    console.error("❌ Fehler beim Reset des Behandlungszählers:", error);
  }
}

/**
 * EINFACHE FUNKTION: Erhöhe Behandlungszähler nach erfolgreicher Buchung
 */
export async function incrementTreatmentCount(
  userId: string,
  treatmentCount: number
): Promise<void> {
  try {
    console.log(
      `🔢 Erhöhe Behandlungszähler um ${treatmentCount} für User:`,
      userId
    );

    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    let currentCount = 0;
    if (userDoc.exists()) {
      currentCount = userDoc.data().treatmentCountSinceLastDiscount || 0;
    }

    const newCount = currentCount + treatmentCount;

    await updateDoc(userRef, {
      treatmentCountSinceLastDiscount: newCount,
      updatedAt: Timestamp.now(),
    });

    console.log(
      `✅ Behandlungszähler aktualisiert: ${currentCount} → ${newCount}`
    );
  } catch (error) {
    console.error("❌ Fehler beim Erhöhen des Behandlungszählers:", error);
  }
}

/**
 * EINFACHE FUNKTION: Reduziere Behandlungszähler bei Stornierung
 */
export async function decrementTreatmentCount(
  userId: string,
  treatmentCount: number
): Promise<void> {
  try {
    console.log(
      `🔻 Reduziere Behandlungszähler um ${treatmentCount} für User:`,
      userId
    );

    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    let currentCount = 0;
    if (userDoc.exists()) {
      currentCount = userDoc.data().treatmentCountSinceLastDiscount || 0;
    }

    // Sicherstellen, dass der Zähler nicht unter 0 fällt
    const newCount = Math.max(0, currentCount - treatmentCount);

    await updateDoc(userRef, {
      treatmentCountSinceLastDiscount: newCount,
      updatedAt: Timestamp.now(),
    });

    console.log(
      `✅ Behandlungszähler reduziert: ${currentCount} → ${newCount}`
    );
  } catch (error) {
    console.error("❌ Fehler beim Reduzieren des Behandlungszählers:", error);
  }
}

/**
 * SMART FUNKTION: Reduziere Zähler automatisch bei Buchungsstornierung
 */
export async function handleBookingCancellation(
  bookingId: string
): Promise<void> {
  try {
    console.log(`🔍 Verarbeite Stornierung für Buchung:`, bookingId);

    // 1. Buchung laden
    const bookingRef = doc(db, "bookings", bookingId);
    const bookingDoc = await getDoc(bookingRef);

    if (!bookingDoc.exists()) {
      console.log("❌ Buchung nicht gefunden:", bookingId);
      return;
    }

    const bookingData = bookingDoc.data();

    // 2. User ID ermitteln - EINFACHE DIREKTE METHODE
    let userId: string | null = null;

    console.log("🔍 SUCHE User ID für Buchung:", {
      bookingId,
      email: bookingData.email,
      userId: bookingData.userId,
      customerId: bookingData.customerId,
    });

    // Methode 1: Direkt aus bookingData.userId (moderne Buchungen)
    if (bookingData.userId) {
      userId = bookingData.userId;
      console.log("✅ User ID direkt aus bookingData.userId gefunden:", userId);
    }
    // Methode 2: Aus bookingData.customerId (Fallback)
    else if (bookingData.customerId) {
      userId = bookingData.customerId;
      console.log("✅ User ID aus bookingData.customerId gefunden:", userId);
    }
    // Methode 3: Als letzter Ausweg über E-Mail suchen
    else if (bookingData.email) {
      try {
        console.log("🔍 Fallback: Suche User über E-Mail:", bookingData.email);
        const customersRef = collection(db, "customers");
        const q = query(customersRef, where("email", "==", bookingData.email));
        const customerSnapshot = await getDocs(q);

        if (!customerSnapshot.empty) {
          const customerDoc = customerSnapshot.docs[0];
          const customerData = customerDoc.data();
          userId = customerData.uid;
          console.log("✅ User ID über E-Mail-Suche gefunden:", userId);
        } else {
          console.log("❌ Kein Kunde mit dieser E-Mail gefunden");
        }
      } catch (error) {
        console.log("❌ Fehler bei E-Mail-Suche:", error);
      }
    }

    if (!userId) {
      console.log("❌ KEINE User ID gefunden! Buchungsdaten:", {
        bookingId,
        verfügbareFelder: Object.keys(bookingData),
        userId: bookingData.userId,
        customerId: bookingData.customerId,
        email: bookingData.email,
      });
      return;
    }

    console.log("🎯 FINALE User ID für Stornierung:", userId);

    // 3. Anzahl Behandlungen ermitteln
    const treatmentCount = bookingData.treatments
      ? bookingData.treatments.length
      : 1;

    console.log(`📊 Buchung-Details:`, {
      bookingId,
      userId,
      email: bookingData.email,
      treatmentCount,
      status: bookingData.status,
    });

    // 4. IMMER reduzieren wenn User gefunden wurde (auch bei bereits stornierten)
    console.log(
      `📊 Verarbeite Stornierung: Status="${bookingData.status}", Behandlungen=${treatmentCount}`
    );

    await decrementTreatmentCount(userId, treatmentCount);
    console.log(
      `✅ Zähler reduziert für Buchung (Status: ${bookingData.status}): ${treatmentCount} Behandlungen`
    );
  } catch (error) {
    console.error("❌ Fehler bei der Stornierungsverarbeitung:", error);
  }
}

/**
 * Benutzer-Rabattdaten erstellen oder aktualisieren
 */
export async function createOrUpdateUserDiscountData(
  userId: string,
  userData: Partial<UserDiscountData>
): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    const existingUser = await getDoc(userRef);

    const now = Timestamp.now();

    if (existingUser.exists()) {
      // Benutzer existiert - nur aktualisieren
      await updateDoc(userRef, {
        ...userData,
        updatedAt: now,
      });
    } else {
      // Neuen Benutzer erstellen
      const newUserData: UserDiscountData = {
        userId,
        name: userData.name || "",
        email: userData.email || "",
        birthDate: userData.birthDate || null,
        bookingCountLast6Months: 0,
        isEligibleForLoyaltyDiscount: false,
        createdAt: now,
        updatedAt: now,
        ...userData,
      };

      await setDoc(userRef, newUserData);
    }
  } catch (error) {
    console.error(
      "Fehler beim Erstellen/Aktualisieren der Benutzerdaten:",
      error
    );
  }
}

/**
 * Berechnung der finalen Buchungspreise mit Rabatt
 */
export function calculateBookingWithDiscount(
  originalPrice: number,
  discountInfo: DiscountInfo
): BookingWithDiscount {
  const finalPrice = originalPrice - discountInfo.amount;
  const savings = discountInfo.amount;

  return {
    originalPrice,
    discountInfo,
    finalPrice,
    savings,
  };
}
