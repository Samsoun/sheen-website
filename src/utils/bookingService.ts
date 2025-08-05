import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "./firebase-config";
import { sendBookingConfirmationEmails } from "./emailService";
import {
  calculateAvailableDiscount,
  applyDiscountToBooking,
  calculateBookingWithDiscount,
  createOrUpdateUserDiscountData,
  type DiscountInfo,
} from "./discountService";

/**
 * Interface für eine Buchung
 */
export interface BookingData {
  id?: string;
  bookingIds?: string[]; // Für Mehrfachbuchungen: Liste aller zugehörigen Buchungs-IDs
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  service: string;
  serviceName: string;
  treatments?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  }[];
  price: number;
  originalPrice?: number; // Originalpreis vor Rabatt
  duration: number;
  message?: string;
  status?: "pending" | "confirmed" | "cancelled";
  createdAt?: Date;
  termsAccepted?: boolean;
  customerId?: string | null;
  userId?: string | null;
  bookingGroupId?: string; // Referenz zur Haupt-ID für gruppierte Buchungen
  isMultiBooking?: boolean; // Flag für Mehrfachbuchungen
  treatmentIndex?: number; // Index dieser Behandlung innerhalb einer Mehrfachbuchung
  totalTreatments?: number; // Gesamtzahl der Behandlungen in dieser Buchungsgruppe

  // Rabatt-bezogene Felder
  appliedLoyaltyDiscount?: boolean;
  loyaltyDiscountAmount?: number;
  loyaltyDiscountPercentage?: number;
  appliedBirthdayDiscount?: boolean;
  birthdayDiscountAmount?: number;
  birthdayDiscountPercentage?: number;
  totalSavings?: number;
}

/**
 * Hilfsfunktion zum Konvertieren einer Zeitstring in Minuten
 */
function timeToMinutes(time: string): number {
  if (!time) return 0;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Prüft, ob ein Zeitslot mit bestehenden Buchungen überschneidet
 */
async function isTimeSlotConflicting(
  date: string,
  time: string,
  duration: number
): Promise<boolean> {
  try {
    // Debug-Logging
    console.log(
      `🔍 Prüfe Zeitslot-Konflikt für ${date} ${time} (${duration} Minuten)`
    );

    // Hole alle Buchungen für das Datum
    const dateQuery = query(
      collection(db, "bookings"),
      where("date", "==", date)
    );

    const querySnapshot = await getDocs(dateQuery);

    if (querySnapshot.empty) {
      console.log(
        `✅ Keine Buchungen für Datum ${date} gefunden - Zeitslot ist verfügbar`
      );
      return false;
    }

    // Konvertiere neue Buchungszeit in Minuten für den Vergleich
    const newStartMinutes = timeToMinutes(time);
    const newEndMinutes = newStartMinutes + duration;

    console.log(
      `📊 Neue Buchung: Start ${time} (${newStartMinutes} Min), Ende: ${newEndMinutes} Min`
    );

    // Überprüfe alle Buchungen für das Datum auf Überschneidungen
    const existingBookings: BookingData[] = [];
    querySnapshot.forEach((doc) => {
      const bookingData = doc.data() as BookingData;
      // Nur aktive Buchungen berücksichtigen
      if (bookingData.status !== "cancelled") {
        bookingData.id = doc.id;
        existingBookings.push(bookingData);
      }
    });

    // Logge die Anzahl der gefundenen Buchungen
    console.log(
      `🔄 ${existingBookings.length} aktive Buchungen für ${date} gefunden`
    );

    // Überprüfe jede bestehende Buchung auf Überschneidungen
    for (const booking of existingBookings) {
      const bookingStartMinutes = timeToMinutes(booking.time);
      const bookingEndMinutes = bookingStartMinutes + booking.duration;

      console.log(
        `  Prüfe gegen: ID ${booking.id}, Zeit ${booking.time} (${bookingStartMinutes}-${bookingEndMinutes} Min)`
      );

      // Überprüfe auf Überschneidungen zwischen den Zeiten
      const hasOverlap =
        (newStartMinutes >= bookingStartMinutes &&
          newStartMinutes < bookingEndMinutes) ||
        (newEndMinutes > bookingStartMinutes &&
          newEndMinutes <= bookingEndMinutes) ||
        (newStartMinutes <= bookingStartMinutes &&
          newEndMinutes >= bookingEndMinutes);

      if (hasOverlap) {
        console.log(
          `❌ Konflikt gefunden mit Buchung ID ${booking.id}: ${booking.time} (${booking.duration} Min)`
        );
        return true;
      }
    }

    console.log(
      `✅ Keine Konflikte gefunden für ${date} um ${time} - Zeitslot ist verfügbar`
    );
    return false;
  } catch (error) {
    console.error("❌ Fehler bei der Prüfung auf Zeitslot-Konflikte:", error);
    return false;
  }
}

/**
 * Speichert eine neue Buchung in der Firestore-Datenbank
 * Wenn mehrere Behandlungen ausgewählt wurden, wird jede als separate Buchung gespeichert
 */
export async function saveBooking(
  bookingData: BookingData
): Promise<{ success: boolean; id?: string; ids?: string[]; error?: string }> {
  try {
    // Debug-Logging für den Buchungsprozess
    console.log("=========== BUCHUNGSPROZESS START ===========");
    console.log(
      "Eingangsdaten für saveBooking:",
      JSON.stringify(bookingData, null, 2)
    );

    // Hole den aktuellen Benutzer
    const user = auth.currentUser;
    console.log("Aktueller Benutzer:", user?.uid, user?.email);

    if (!user) {
      console.error("Kein Benutzer angemeldet");
      return {
        success: false,
        error: "Sie müssen angemeldet sein, um eine Buchung vorzunehmen.",
      };
    }

    // Validierung: Prüfe, ob Pflichtfelder vorhanden sind
    if (!bookingData.date || !bookingData.time) {
      console.error("Fehler: Datum oder Uhrzeit fehlt in den Buchungsdaten");
      return {
        success: false,
        error: "Datum und Uhrzeit sind erforderlich.",
      };
    }

    if (!bookingData.name || !bookingData.email || !bookingData.phone) {
      console.error("Fehler: Kundendaten unvollständig");
      return {
        success: false,
        error: "Bitte füllen Sie alle Pflichtfelder aus.",
      };
    }

    if (!bookingData.treatments || bookingData.treatments.length === 0) {
      console.error("Fehler: Keine Behandlungen ausgewählt");
      return {
        success: false,
        error: "Bitte wählen Sie mindestens eine Behandlung aus.",
      };
    }

    // Korrekte Formatierung des Datums sicherstellen
    if (bookingData.date && typeof bookingData.date === "string") {
      // Datum direkt im YYYY-MM-DD Format verwenden, ohne Zeitzonenkonvertierung
      const [year, month, day] = bookingData.date.split("-").map(Number);
      const formattedDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      bookingData.date = formattedDate;
      console.log("Formatiertes Buchungsdatum:", formattedDate);
    }

    // Prüfe Zeitslot-Verfügbarkeit
    try {
      console.log(
        `Prüfe Verfügbarkeit für ${bookingData.date} um ${bookingData.time}`
      );
      const isConflicting = await isTimeSlotConflicting(
        bookingData.date,
        bookingData.time,
        bookingData.duration
      );

      if (isConflicting) {
        console.error(
          `❌ Zeitslot ${bookingData.date} um ${bookingData.time} ist bereits belegt!`
        );
        return {
          success: false,
          error: `Der gewählte Zeitslot am ${bookingData.date} um ${bookingData.time} Uhr ist bereits belegt. Bitte wählen Sie einen anderen Termin.`,
        };
      }
    } catch (timeCheckError) {
      console.warn("⚠️ Fehler bei der Prüfung des Zeitslots:", timeCheckError);
    }

    // **RABATT-BERECHNUNG für angemeldete Benutzer**
    const totalOriginalPrice = bookingData.treatments.reduce(
      (sum, treatment) => sum + treatment.price,
      0
    );
    let discountInfo: DiscountInfo | null = null;
    let adjustedTreatments = [...bookingData.treatments];

    console.log("🎯 Starte Rabattberechnung für Benutzer:", user.uid);
    console.log("💰 Gesamtpreis vor Rabatt:", totalOriginalPrice);

    try {
      // Nur für angemeldete Benutzer Rabatte berechnen
      discountInfo = await calculateAvailableDiscount(
        user.uid,
        totalOriginalPrice
      );
      console.log("🎁 Rabattinfo berechnet:", discountInfo);

      // Wenn ein Rabatt verfügbar ist, Preise anpassen
      if (discountInfo.isEligible && discountInfo.amount > 0) {
        const discountRatio = discountInfo.amount / totalOriginalPrice;

        // Anteilige Rabattverteilung auf alle Behandlungen
        adjustedTreatments = bookingData.treatments.map((treatment) => ({
          ...treatment,
          originalPrice: treatment.price,
          price: Math.round(treatment.price * (1 - discountRatio) * 100) / 100,
        }));

        console.log("✅ Preise nach Rabatt angepasst:", adjustedTreatments);
      }

      // Benutzer-Rabattdaten erstellen/aktualisieren
      await createOrUpdateUserDiscountData(user.uid, {
        name: bookingData.name,
        email: bookingData.email,
        // birthDate wird separat im Profil gesetzt
      });
    } catch (discountError) {
      console.error("❌ Fehler bei Rabattberechnung:", discountError);
      // Weiter ohne Rabatt, wenn Berechnung fehlschlägt
    }

    const bookingIds: string[] = [];
    let mainBookingId = "";
    let currentTime = bookingData.time;

    try {
      // Für jede Behandlung eine separate Buchung erstellen
      for (let i = 0; i < adjustedTreatments.length; i++) {
        const treatment = adjustedTreatments[i];
        const originalTreatment = bookingData.treatments[i];

        // Rabattinformationen für diese einzelne Buchung berechnen
        const treatmentDiscountAmount = discountInfo?.isEligible
          ? originalTreatment.price - treatment.price
          : 0;

        // Einzelne Buchungsdaten erstellen
        const singleBookingData: any = {
          name: bookingData.name,
          email: bookingData.email,
          phone: bookingData.phone,
          message: bookingData.message || "",
          date: bookingData.date,
          time: currentTime,
          service: treatment.id,
          serviceName: treatment.name,
          treatments: [treatment],
          price: treatment.price, // Bereits rabattierter Preis
          originalPrice: originalTreatment.price, // Originalpreis vor Rabatt
          duration: treatment.duration,
          status: "confirmed",
          createdAt: Timestamp.now(),
          termsAccepted: true,
          userId: user.uid,
          customerId: user.uid,
          bookingGroupId: mainBookingId || "pending",
          isMultiBooking: bookingData.treatments.length > 1,
          treatmentIndex: i,
          totalTreatments: bookingData.treatments.length,

          // Rabatt-spezifische Felder
          appliedLoyaltyDiscount:
            discountInfo?.type === "loyalty" && discountInfo.isEligible,
          loyaltyDiscountAmount:
            discountInfo?.type === "loyalty" ? treatmentDiscountAmount : 0,
          loyaltyDiscountPercentage:
            discountInfo?.type === "loyalty" ? discountInfo.percentage : 0,
          appliedBirthdayDiscount:
            discountInfo?.type === "birthday" && discountInfo.isEligible,
          birthdayDiscountAmount:
            discountInfo?.type === "birthday" ? treatmentDiscountAmount : 0,
          birthdayDiscountPercentage:
            discountInfo?.type === "birthday" ? discountInfo.percentage : 0,
          totalSavings: treatmentDiscountAmount,
        };

        console.log("Speichere Buchung mit folgenden Daten:", {
          email: bookingData.email,
          userId: user.uid,
          date: bookingData.date,
          time: currentTime,
          service: treatment.name,
        });

        // Buchung in Firestore speichern
        const docRef = await addDoc(
          collection(db, "bookings"),
          singleBookingData
        );
        console.log("Buchung gespeichert mit ID:", docRef.id);
        bookingIds.push(docRef.id);

        // Die erste Buchungs-ID als Hauptbuchungs-ID verwenden
        if (i === 0) {
          mainBookingId = docRef.id;
          console.log("Hauptbuchungs-ID gesetzt:", mainBookingId);

          // Aktualisiere die bookingGroupId
          await updateDoc(doc(db, "bookings", docRef.id), {
            bookingGroupId: mainBookingId,
          });
        }

        // Zeit für die nächste Behandlung aktualisieren
        if (i < bookingData.treatments.length - 1) {
          const [hours, minutes] = currentTime.split(":").map(Number);
          let totalMinutes = hours * 60 + minutes + treatment.duration;
          const newHours = Math.floor(totalMinutes / 60);
          const newMinutes = totalMinutes % 60;
          currentTime = `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`;
        }
      }

      // E-Mail senden
      try {
        const emailsSent = await sendBookingConfirmationEmails({
          ...bookingData,
          id: mainBookingId,
          bookingIds,
        } as any);

        if (!emailsSent) {
          console.warn("⚠️ E-Mails konnten nicht gesendet werden");
        }
      } catch (emailError) {
        console.warn("⚠️ Fehler beim Senden der E-Mails:", emailError);
      }

      return {
        success: true,
        id: mainBookingId,
        ids: bookingIds,
      };
    } catch (bookingError) {
      console.error("❌ Fehler beim Speichern der Buchungen:", bookingError);

      if (bookingIds.length > 0) {
        return {
          success: true,
          id: mainBookingId,
          ids: bookingIds,
        };
      }

      return {
        success: false,
        error:
          bookingError instanceof Error
            ? bookingError.message
            : "Fehler beim Speichern der Buchung.",
      };
    }
  } catch (error) {
    console.error("❌ Fehler beim Speichern der Buchung:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}

/**
 * Prüft, ob ein Zeitslot bereits gebucht ist
 */
export async function isTimeSlotBooked(
  date: string,
  time: string
): Promise<boolean> {
  try {
    // Vereinfachte Abfrage nur nach Datum und Zeit
    const q = query(
      collection(db, "bookings"),
      where("date", "==", date),
      where("time", "==", time)
    );

    // Führe die Abfrage aus
    const querySnapshot = await getDocs(q);

    // Filtere stornierte Buchungen in JavaScript
    const activeBookings = querySnapshot.docs.filter(
      (doc) => doc.data().status !== "cancelled"
    );

    return activeBookings.length > 0;
  } catch (error) {
    console.error("Fehler beim Prüfen des Zeitslots:", error);
    return true;
  }
}

/**
 * Holt alle Buchungen für ein bestimmtes Datum
 */
export async function getBookingsForDate(date: string): Promise<BookingData[]> {
  try {
    console.log(`Suche Buchungen für Datum: ${date}`);

    // Stelle sicher, dass das Datum im Format YYYY-MM-DD ist
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      console.error("Ungültiges Datumsformat:", date);
      return [];
    }

    // Erstelle eine Abfrage, um alle Buchungen für das angegebene Datum zu finden
    // Hinweis: Wir entfernen den Status-Filter, um alle Buchungen zu bekommen, auch stornierte
    // Das kann uns helfen, Probleme besser zu diagnostizieren
    const q = query(collection(db, "bookings"), where("date", "==", date));

    // Führe die Abfrage aus
    const querySnapshot = await getDocs(q);

    // Wandle die Ergebnisse in BookingData-Objekte um
    const allBookings: BookingData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Omit<BookingData, "id">;
      allBookings.push({
        ...data,
        id: doc.id,
      });
    });

    console.log(
      `${allBookings.length} Buchungen insgesamt für Datum ${date} gefunden`
    );

    // Jetzt filtern wir die stornierten Buchungen heraus
    const activeBookings = allBookings.filter(
      (booking) => booking.status !== "cancelled"
    );
    console.log(
      `${activeBookings.length} aktive Buchungen (nicht storniert) für Datum ${date}`
    );

    // Ausgabe aller aktiven Buchungen für Debugging
    activeBookings.forEach((booking, index) => {
      console.log(`Buchung ${index + 1}:`, {
        id: booking.id,
        time: booking.time,
        duration: booking.duration,
        status: booking.status,
      });
    });

    return activeBookings;
  } catch (error) {
    console.error("Fehler beim Abrufen der Buchungen:", error);
    return [];
  }
}

/**
 * Aktualisiert den Status einer Buchung
 */
export async function updateBookingStatus(
  bookingId: string,
  status: "pending" | "confirmed" | "cancelled"
): Promise<boolean> {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, {
      status: status,
      updatedAt: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Buchungsstatus:", error);
    return false;
  }
}

/**
 * Prüft, ob eine Buchung storniert werden kann (24 Stunden vor Termin)
 */
export function canCancelBooking(
  bookingDate: string,
  bookingTime: string
): boolean {
  try {
    // Aktuelles Datum und Zeit
    const now = new Date();

    // Buchungsdatum und -zeit parsen
    const [year, month, day] = bookingDate.split("-").map(Number);
    const [hours, minutes] = bookingTime.split(":").map(Number);
    const bookingDateTime = new Date(year, month - 1, day, hours, minutes);

    // Differenz in Millisekunden
    const diffInMs = bookingDateTime.getTime() - now.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    // Prüfen, ob mehr als 24 Stunden bis zum Termin
    return diffInHours >= 24;
  } catch (error) {
    console.error("Fehler beim Prüfen der Stornierungsfrist:", error);
    return false;
  }
}
