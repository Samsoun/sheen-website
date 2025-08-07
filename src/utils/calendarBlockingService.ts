import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase-config";

/**
 * Interface für gesperrte Zeiten
 */
export interface BlockedTime {
  id?: string;
  date: string; // YYYY-MM-DD Format
  startTime?: string; // HH:MM Format (für spezifische Uhrzeiten)
  endTime?: string; // HH:MM Format (für spezifische Uhrzeiten)
  isFullDay: boolean; // true = ganzer Tag gesperrt
  reason: string; // Grund für Sperrung (Urlaub, Krankheit, etc.)
  createdAt: Timestamp;
  createdBy: string; // Admin User ID
}

/**
 * Mehrere Tage gleichzeitig sperren (Datumsbereich)
 */
export async function blockDateRange(
  startDate: string,
  endDate: string,
  reason: string,
  adminId: string
): Promise<{ success: boolean; error?: string; blockedDays?: number }> {
  try {
    console.log(
      `🚫 Sperre Datumsbereich: ${startDate} bis ${endDate} - Grund: ${reason}`
    );

    // Validiere Datumsbereich - verwende lokale Zeit statt UTC
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");

    if (start > end) {
      return { success: false, error: "Startdatum muss vor Enddatum liegen" };
    }

    // Berechne die Anzahl der zu sperrenden Tage
    const daysDifference =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (daysDifference > 365) {
      return {
        success: false,
        error: "Maximal 365 Tage können gleichzeitig gesperrt werden",
      };
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Iteriere durch alle Tage im Bereich
    const currentDate = new Date(start);
    while (currentDate <= end) {
      // Verwende lokale Zeit für die Datums-String-Generierung
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      // Prüfe ob bereits gesperrt
      const existingBlocks = await getBlockedTimesForDate(dateStr);
      const fullDayBlock = existingBlocks.find((block) => block.isFullDay);

      if (fullDayBlock) {
        console.log(`⚠️ Tag ${dateStr} bereits gesperrt - überspringe`);
        errorCount++;
        errors.push(`${dateStr} bereits gesperrt`);
      } else {
        // Lösche alle spezifischen Zeitsperrungen für diesen Tag
        for (const block of existingBlocks) {
          if (!block.isFullDay && block.id) {
            await deleteDoc(doc(db, "blocked_times", block.id));
          }
        }

        // Erstelle neue Ganztags-Sperrung
        await addDoc(collection(db, "blocked_times"), {
          date: dateStr,
          isFullDay: true,
          reason,
          createdAt: Timestamp.now(),
          createdBy: adminId,
        });

        successCount++;
        console.log(`✅ Tag ${dateStr} erfolgreich gesperrt`);
      }

      // Nächster Tag
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const totalDays = daysDifference;

    if (successCount === 0) {
      return {
        success: false,
        error: `Alle ${totalDays} Tage waren bereits gesperrt`,
        blockedDays: 0,
      };
    } else if (errorCount > 0) {
      return {
        success: true,
        error: `${successCount}/${totalDays} Tage gesperrt. ${errorCount} bereits gesperrt: ${errors.slice(0, 3).join(", ")}${errors.length > 3 ? "..." : ""}`,
        blockedDays: successCount,
      };
    } else {
      return {
        success: true,
        blockedDays: successCount,
      };
    }
  } catch (error) {
    console.error("❌ Fehler beim Sperren des Datumsbereichs:", error);
    return { success: false, error: "Fehler beim Sperren des Datumsbereichs" };
  }
}

/**
 * Ganzen Tag sperren
 */
export async function blockFullDay(
  date: string,
  reason: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🚫 Sperre ganzen Tag: ${date} - Grund: ${reason}`);

    // Prüfe ob bereits eine Sperrung für diesen Tag existiert
    const existingBlocks = await getBlockedTimesForDate(date);
    const fullDayBlock = existingBlocks.find((block) => block.isFullDay);

    if (fullDayBlock) {
      return {
        success: false,
        error: "Dieser Tag ist bereits vollständig gesperrt",
      };
    }

    // Lösche alle spezifischen Zeitsperrungen für diesen Tag
    for (const block of existingBlocks) {
      if (!block.isFullDay && block.id) {
        await deleteDoc(doc(db, "blocked_times", block.id));
      }
    }

    // Erstelle neue Ganztags-Sperrung
    await addDoc(collection(db, "blocked_times"), {
      date,
      isFullDay: true,
      reason,
      createdAt: Timestamp.now(),
      createdBy: adminId,
    });

    console.log(`✅ Ganzer Tag erfolgreich gesperrt: ${date}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Fehler beim Sperren des ganzen Tags:", error);
    return { success: false, error: "Fehler beim Sperren des Tages" };
  }
}

/**
 * Spezifische Uhrzeiten sperren
 */
export async function blockTimeRange(
  date: string,
  startTime: string,
  endTime: string,
  reason: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(
      `🚫 Sperre Zeitraum: ${date} ${startTime}-${endTime} - Grund: ${reason}`
    );

    // Prüfe ob bereits eine Ganztags-Sperrung existiert
    const existingBlocks = await getBlockedTimesForDate(date);
    const fullDayBlock = existingBlocks.find((block) => block.isFullDay);

    if (fullDayBlock) {
      return {
        success: false,
        error: "Dieser Tag ist bereits vollständig gesperrt",
      };
    }

    // Prüfe Überschneidungen mit bestehenden Zeitsperrungen
    const hasConflict = existingBlocks.some((block) => {
      if (block.isFullDay || !block.startTime || !block.endTime) return false;

      const blockStart = timeToMinutes(block.startTime);
      const blockEnd = timeToMinutes(block.endTime);
      const newStart = timeToMinutes(startTime);
      const newEnd = timeToMinutes(endTime);

      return newStart < blockEnd && newEnd > blockStart;
    });

    if (hasConflict) {
      return {
        success: false,
        error: "Zeitraum überschneidet sich mit bestehender Sperrung",
      };
    }

    // Erstelle neue Zeitraum-Sperrung
    await addDoc(collection(db, "blocked_times"), {
      date,
      startTime,
      endTime,
      isFullDay: false,
      reason,
      createdAt: Timestamp.now(),
      createdBy: adminId,
    });

    console.log(
      `✅ Zeitraum erfolgreich gesperrt: ${date} ${startTime}-${endTime}`
    );
    return { success: true };
  } catch (error) {
    console.error("❌ Fehler beim Sperren des Zeitraums:", error);
    return { success: false, error: "Fehler beim Sperren des Zeitraums" };
  }
}

/**
 * Sperrung aufheben
 */
export async function unblockTime(
  blockId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`✅ Hebe Sperrung auf: ${blockId}`);

    await deleteDoc(doc(db, "blocked_times", blockId));

    console.log(`✅ Sperrung erfolgreich aufgehoben: ${blockId}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Fehler beim Aufheben der Sperrung:", error);
    return { success: false, error: "Fehler beim Aufheben der Sperrung" };
  }
}

/**
 * Alle gesperrten Zeiten für ein bestimmtes Datum abrufen
 */
export async function getBlockedTimesForDate(
  date: string
): Promise<BlockedTime[]> {
  try {
    // Vereinfachte Abfrage ohne orderBy um Index-Probleme zu vermeiden
    const q = query(collection(db, "blocked_times"), where("date", "==", date));

    const querySnapshot = await getDocs(q);
    const blockedTimes: BlockedTime[] = [];

    querySnapshot.forEach((doc) => {
      blockedTimes.push({
        id: doc.id,
        ...doc.data(),
      } as BlockedTime);
    });

    // Manuell nach createdAt sortieren
    blockedTimes.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
      const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime; // Neueste zuerst
    });

    return blockedTimes;
  } catch (error) {
    console.error("❌ Fehler beim Abrufen der gesperrten Zeiten:", error);
    if ((error as Error).message?.includes("index")) {
      console.warn(
        "⚠️ Firebase Index wird benötigt. Verwende einfache Abfrage..."
      );
      // Fallback: Alle Dokumente laden und manuell filtern
      try {
        const allDocs = await getDocs(collection(db, "blocked_times"));
        const blockedTimes: BlockedTime[] = [];
        allDocs.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() } as BlockedTime;
          if (data.date === date) {
            blockedTimes.push(data);
          }
        });
        return blockedTimes;
      } catch (fallbackError) {
        console.error(
          "❌ Auch Fallback-Abfrage fehlgeschlagen:",
          fallbackError
        );
        return [];
      }
    }
    return [];
  }
}

/**
 * Alle gesperrten Zeiten für einen Datumsbereich abrufen
 */
export async function getBlockedTimesForRange(
  startDate: string,
  endDate: string
): Promise<BlockedTime[]> {
  try {
    // Vereinfachte Abfrage ohne orderBy
    const q = query(
      collection(db, "blocked_times"),
      where("date", ">=", startDate),
      where("date", "<=", endDate)
    );

    const querySnapshot = await getDocs(q);
    const blockedTimes: BlockedTime[] = [];

    querySnapshot.forEach((doc) => {
      blockedTimes.push({
        id: doc.id,
        ...doc.data(),
      } as BlockedTime);
    });

    // Manuell sortieren: erst nach Datum, dann nach Erstellungszeit
    blockedTimes.sort((a, b) => {
      // Primär nach Datum sortieren
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      // Sekundär nach Erstellungszeit (neueste zuerst)
      const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
      const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });

    return blockedTimes;
  } catch (error) {
    console.error(
      "❌ Fehler beim Abrufen der gesperrten Zeiten für Bereich:",
      error
    );
    if ((error as Error).message?.includes("index")) {
      console.warn("⚠️ Firebase Index wird benötigt. Verwende Fallback...");
      // Fallback: Alle laden und manuell filtern
      try {
        const allDocs = await getDocs(collection(db, "blocked_times"));
        const blockedTimes: BlockedTime[] = [];
        allDocs.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() } as BlockedTime;
          if (data.date >= startDate && data.date <= endDate) {
            blockedTimes.push(data);
          }
        });
        return blockedTimes;
      } catch (fallbackError) {
        console.error("❌ Fallback-Abfrage fehlgeschlagen:", fallbackError);
        return [];
      }
    }
    return [];
  }
}

/**
 * Prüfe ob ein spezifischer Zeitslot gesperrt ist
 */
export async function isTimeSlotBlocked(
  date: string,
  time: string
): Promise<boolean> {
  try {
    const blockedTimes = await getBlockedTimesForDate(date);

    // Prüfe Ganztags-Sperrung
    if (blockedTimes.some((block) => block.isFullDay)) {
      return true;
    }

    // Prüfe spezifische Zeitsperrungen
    const timeMinutes = timeToMinutes(time);

    return blockedTimes.some((block) => {
      if (block.isFullDay || !block.startTime || !block.endTime) return false;

      const blockStart = timeToMinutes(block.startTime);
      const blockEnd = timeToMinutes(block.endTime);

      return timeMinutes >= blockStart && timeMinutes < blockEnd;
    });
  } catch (error) {
    console.error("❌ Fehler beim Prüfen der Zeitslot-Sperrung:", error);
    return false;
  }
}

/**
 * Prüfe ob ein ganzer Tag gesperrt ist
 */
export async function isFullDayBlocked(date: string): Promise<boolean> {
  try {
    const blockedTimes = await getBlockedTimesForDate(date);
    return blockedTimes.some((block) => block.isFullDay);
  } catch (error) {
    console.error("❌ Fehler beim Prüfen der Ganztags-Sperrung:", error);
    return false;
  }
}

/**
 * Hilfsfunktion: Zeit in Minuten umwandeln
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Alle gesperrten Zeiten abrufen (für Admin-Übersicht)
 */
export async function getAllBlockedTimes(): Promise<BlockedTime[]> {
  try {
    console.log("📋 Lade alle gesperrten Zeiten...");

    // Einfache Abfrage ohne orderBy um Index-Probleme zu vermeiden
    const querySnapshot = await getDocs(collection(db, "blocked_times"));
    const blockedTimes: BlockedTime[] = [];

    querySnapshot.forEach((doc) => {
      blockedTimes.push({
        id: doc.id,
        ...doc.data(),
      } as BlockedTime);
    });

    console.log(
      `📋 ${blockedTimes.length} gesperrte Zeiten gefunden, sortiere manuell...`
    );

    // Manuell sortieren: erst nach Datum, dann nach Erstellungszeit
    blockedTimes.sort((a, b) => {
      // Primär nach Datum sortieren (aufsteigend)
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      // Sekundär nach Erstellungszeit (neueste zuerst)
      const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
      const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });

    console.log(
      `✅ Alle gesperrten Zeiten sortiert: ${blockedTimes.length} Einträge`
    );
    return blockedTimes;
  } catch (error) {
    console.error("❌ Fehler beim Abrufen aller gesperrten Zeiten:", error);

    if ((error as Error).message?.includes("index")) {
      console.warn(
        "⚠️ Firebase Index-Problem erkannt. Das ist normal beim ersten Mal."
      );
      console.info(
        "💡 Firebase erstellt automatisch Indizes im Hintergrund. Bitte warten Sie einige Minuten."
      );
    }

    return [];
  }
}
