import { getBookingsForDate } from "./bookingService";
import {
  getBlockedTimesForDate,
  isTimeSlotBlocked,
  isFullDayBlocked,
} from "./calendarBlockingService";

// Geschäftszeiten für den Salon
const BUSINESS_HOURS = {
  start: 9, // 9 Uhr morgens
  end: 18, // 18 Uhr abends (6 Uhr nachmittags)
};

// Intervall für Zeitslots in Minuten
const TIME_SLOT_INTERVAL = 15;

/**
 * Generiert alle möglichen Zeitslots für einen Tag in 15-Minuten-Intervallen
 */
export function generateAllTimeSlots(): string[] {
  const slots: string[] = [];
  const startMinutes = BUSINESS_HOURS.start * 60; // Umrechnung in Minuten
  const endMinutes = BUSINESS_HOURS.end * 60; // Umrechnung in Minuten

  // Zeitslots in 15-Minuten-Intervallen generieren
  for (
    let minutes = startMinutes;
    minutes < endMinutes;
    minutes += TIME_SLOT_INTERVAL
  ) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const formattedTime = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    slots.push(formattedTime);
  }

  return slots;
}

/**
 * Konvertiert eine Zeitstring (HH:MM) in Minuten seit Mitternacht
 */
export function timeToMinutes(time: string): number {
  if (!time) return 0;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Konvertiert Minuten seit Mitternacht in einen Zeitstring (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Formatiert ein Datum im YYYY-MM-DD Format
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Monate sind 0-basiert
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Prüft, ob ein Zeitslot mit bestehenden Buchungen kollidiert
 * Diese Funktion führt die lokale Überlappungsprüfung mit vorhandenen Buchungen durch
 */
export function checkTimeSlotConflict(
  slot: string,
  existingBookings: any[],
  duration: number
): boolean {
  if (!existingBookings || existingBookings.length === 0) return false;

  console.log(
    `Prüfe Slot ${slot} gegen ${existingBookings.length} bestehende Buchungen`
  );

  // Zeit des neuen Slots in Minuten
  const slotStartMinutes = timeToMinutes(slot);
  const slotEndMinutes = slotStartMinutes + duration;

  // Überprüfe Überschneidungen mit bestehenden Buchungen
  for (const booking of existingBookings) {
    if (!booking.time || typeof booking.duration !== "number") {
      console.warn("Ungültige Buchungsdaten:", booking);
      continue;
    }

    const bookingStartMinutes = timeToMinutes(booking.time);
    const bookingEndMinutes = bookingStartMinutes + booking.duration;

    // Prüfe auf Überschneidung
    const hasOverlap =
      (slotStartMinutes >= bookingStartMinutes &&
        slotStartMinutes < bookingEndMinutes) ||
      (slotEndMinutes > bookingStartMinutes &&
        slotEndMinutes <= bookingEndMinutes) ||
      (slotStartMinutes <= bookingStartMinutes &&
        slotEndMinutes >= bookingEndMinutes);

    if (hasOverlap) {
      console.log(
        `Konflikt: Slot ${slot} überschneidet sich mit Buchung um ${booking.time} (${booking.duration} Min)`
      );
      return true;
    }
  }

  return false;
}

/**
 * Holt die verfügbaren Zeitslots für ein bestimmtes Datum und eine Behandlungsdauer
 * Berücksichtigt jetzt auch gesperrte Zeiten vom Admin
 */
export async function getAvailableTimeSlots(
  date: Date,
  treatmentDuration: number
): Promise<string[]> {
  try {
    // Formatiere das Datum manuell, um Zeitzonen-Probleme zu vermeiden
    const formattedDate = formatDate(date);
    console.log("getAvailableTimeSlots für Datum:", formattedDate);

    // 🚫 PRÜFE ZUERST OB GANZER TAG GESPERRT IST
    const isDayBlocked = await isFullDayBlocked(formattedDate);
    if (isDayBlocked) {
      console.log(`❌ Ganzer Tag gesperrt: ${formattedDate}`);
      return [];
    }

    // Holt existierende Buchungen für das ausgewählte Datum
    const existingBookings = await getBookingsForDate(formattedDate);
    console.log(
      `Anzahl Buchungen für ${formattedDate}:`,
      existingBookings.length
    );

    // 🚫 LADE GESPERRTE ZEITEN
    const blockedTimes = await getBlockedTimesForDate(formattedDate);
    console.log(
      `Anzahl gesperrte Zeiten für ${formattedDate}:`,
      blockedTimes.length
    );

    // Detaillierte Ausgabe der Buchungen
    existingBookings.forEach((booking, idx) => {
      console.log(
        `Buchung ${idx + 1}: ${booking.time}-${minutesToTime(timeToMinutes(booking.time) + booking.duration)}`
      );
    });

    // Detaillierte Ausgabe der gesperrten Zeiten
    blockedTimes.forEach((blocked, idx) => {
      if (blocked.isFullDay) {
        console.log(`Gesperrt ${idx + 1}: Ganzer Tag - ${blocked.reason}`);
      } else {
        console.log(
          `Gesperrt ${idx + 1}: ${blocked.startTime}-${blocked.endTime} - ${blocked.reason}`
        );
      }
    });

    // Generiere alle möglichen Zeitslots
    const allTimeSlots = generateAllTimeSlots();
    console.log(
      `Prüfe ${allTimeSlots.length} mögliche Zeitslots auf Konflikte...`
    );

    // Aktuelles Datum und Zeit
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    // Aktuelle Zeit in Minuten (nur für heute relevant)
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Filtere die verfügbaren Zeitslots basierend auf bestehenden Buchungen UND gesperrten Zeiten
    const availableSlots: string[] = [];

    for (const slot of allTimeSlots) {
      // Wenn es der heutige Tag ist, überspringe vergangene Zeitslots
      if (isToday) {
        const slotMinutes = timeToMinutes(slot);
        // Füge 30 Minuten Puffer hinzu
        if (slotMinutes <= currentMinutes + 30) {
          console.log(
            `Slot ${slot} liegt in der Vergangenheit oder ist zu nah an der aktuellen Zeit`
          );
          continue;
        }
      }

      // 🚫 PRÜFE OB ZEITSLOT GESPERRT IST
      const isBlocked = await isTimeSlotBlocked(formattedDate, slot);
      if (isBlocked) {
        console.log(`🚫 Slot ${slot} ist vom Admin gesperrt`);
        continue;
      }

      // Prüfe Konflikt mit bestehenden Buchungen
      const hasConflict = checkTimeSlotConflict(
        slot,
        existingBookings,
        treatmentDuration
      );
      if (!hasConflict) {
        availableSlots.push(slot);
      } else {
        console.log(`📅 Slot ${slot} ist bereits belegt`);
      }
    }

    // Sorge dafür, dass der letzte verfügbare Zeitslot noch vor Geschäftsschluss endet
    const lastPossibleSlotMinutes = BUSINESS_HOURS.end * 60 - treatmentDuration;
    const filteredSlots = availableSlots.filter(
      (slot) => timeToMinutes(slot) <= lastPossibleSlotMinutes
    );

    console.log(
      `✅ Insgesamt ${filteredSlots.length} verfügbare Zeitslots gefunden (nach Abzug gesperrter Zeiten)`
    );
    return filteredSlots;
  } catch (error) {
    console.error("Fehler beim Abrufen der verfügbaren Zeitslots:", error);
    return [];
  }
}

/**
 * Findet den nächsten verfügbaren Zeitslot nach einem konfliktbehafteten Zeitslot
 */
export function findNextAvailableTimeSlot(
  conflictingSlot: string,
  treatmentDuration: number,
  existingBookings: any[]
): string | null {
  const allTimeSlots = generateAllTimeSlots();
  const conflictingSlotIndex = allTimeSlots.indexOf(conflictingSlot);

  if (conflictingSlotIndex === -1) return null;

  // Überprüfe alle nachfolgenden Zeitslots
  for (let i = conflictingSlotIndex + 1; i < allTimeSlots.length; i++) {
    const nextSlot = allTimeSlots[i];
    if (!checkTimeSlotConflict(nextSlot, existingBookings, treatmentDuration)) {
      // Stelle sicher, dass die Behandlung vor Geschäftsschluss beendet ist
      const slotEndMinutes = timeToMinutes(nextSlot) + treatmentDuration;
      if (slotEndMinutes <= BUSINESS_HOURS.end * 60) {
        return nextSlot;
      }
    }
  }

  return null; // Kein verfügbarer Zeitslot gefunden
}
