"use client";

import React, { useState, useEffect } from "react";
import {
  getAvailableTimeSlots,
  findNextAvailableTimeSlot,
  timeToMinutes,
  minutesToTime,
  generateAllTimeSlots,
} from "@/utils/timeSlotUtils";
import { getBookingsForDate } from "@/utils/bookingService";
import {
  getBlockedTimesForRange,
  isFullDayBlocked,
  type BlockedTime,
} from "@/utils/calendarBlockingService";
import "@/styles/booking.css";

interface DateTimeSelectionProps {
  selectedTreatments: {
    id: string;
    name: string;
    duration: number;
    price: number;
  }[];
  selectedDateTime: {
    date: Date | null;
    time: string | null;
  };
  setSelectedDateTime: React.Dispatch<
    React.SetStateAction<{
      date: Date | null;
      time: string | null;
    }>
  >;
  onBack: () => void;
  onContinue: () => void;
}

export default function DateTimeSelection({
  selectedTreatments,
  selectedDateTime,
  setSelectedDateTime,
  onBack,
  onContinue,
}: DateTimeSelectionProps) {
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [extendedTimeSlots, setExtendedTimeSlots] = useState<
    Array<{
      time: string;
      isAvailable: boolean;
      reason?: string;
    }>
  >([]);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [unavailableMessage, setUnavailableMessage] = useState<string | null>(
    null
  );
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [isLoadingBlockedTimes, setIsLoadingBlockedTimes] =
    useState<boolean>(false);

  // Gesamtdauer der ausgewählten Behandlungen berechnen
  const totalDuration = selectedTreatments.reduce(
    (sum, treatment) => sum + treatment.duration,
    0
  );

  // Gesperrte Zeiten für den aktuellen Monat laden
  const loadBlockedTimesForMonth = async (month: Date) => {
    try {
      setIsLoadingBlockedTimes(true);

      // Datumsbereich für den ganzen Monat berechnen
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const startDateStr = startOfMonth.toISOString().split("T")[0];
      const endDateStr = endOfMonth.toISOString().split("T")[0];

      console.log(
        `📅 Lade gesperrte Zeiten für ${startDateStr} bis ${endDateStr}`
      );

      const blocked = await getBlockedTimesForRange(startDateStr, endDateStr);
      setBlockedTimes(blocked);

      console.log(
        `✅ ${blocked.length} gesperrte Zeiten geladen für ${month.getFullYear()}-${month.getMonth() + 1}`
      );
    } catch (error) {
      console.error("❌ Fehler beim Laden der gesperrten Zeiten:", error);
      setBlockedTimes([]);
    } finally {
      setIsLoadingBlockedTimes(false);
    }
  };

  // Verfügbare Termine generieren (nächste 3 Monate)
  useEffect(() => {
    // Nächste 3 Monate als verfügbare Termine festlegen
    const dates: Date[] = [];
    const now = new Date();

    // Startdatum auf morgen setzen
    const startDate = new Date();
    startDate.setDate(now.getDate() + 1);

    // Aktuellen Monat finden
    const currentMonth = now.getMonth();

    // Enddatum auf 3 Monate später setzen (letzter Tag des 3. Monats)
    const endDate = new Date(now.getFullYear(), currentMonth + 3, 0);

    // Termine von morgen bis zum Ende des dritten Monats generieren
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Sonntage hinzufügen, aber sie werden später als nicht verfügbar markiert
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setAvailableDates(dates);
  }, []);

  // ✅ SCHRITT 1: Nur Kalender-Ansicht für Volltagssperrungen wieder aktivieren
  useEffect(() => {
    console.log("🔧 SCHRITT 1: Lade gesperrte Zeiten für Kalender-Ansicht...");
    loadBlockedTimesForMonth(selectedMonth);
  }, [selectedMonth]);

  // 🚨 DEBUG: Automatisches Neu-Laden der Zeitslots temporär deaktiviert
  // useEffect(() => {
  //   if (selectedDateTime.date && blockedTimes.length >= 0) {
  //     console.log("🔄 Gesperrte Zeiten geändert - lade Zeitslots neu...");
  //     // ... (deaktiviert für Debugging)
  //   }
  // }, [blockedTimes]);

  // Formatiert ein Datum im YYYY-MM-DD Format für Datenbankanfragen
  const formatDateForDB = (date: Date): string => {
    // Setze die Zeit auf Mitternacht, um Zeitzonen-Probleme zu vermeiden
    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);

    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, "0");
    const day = String(localDate.getDate()).padStart(2, "0");

    // Formatiere das Datum direkt, ohne Zeitzonenkonvertierung
    return `${year}-${month}-${day}`;
  };

  // Diese Funktion prüft direkt, ob ein Zeitslot mit existierenden Buchungen überschneidet
  const checkSlotConflict = (
    slot: string,
    bookings: any[],
    duration: number
  ): boolean => {
    const slotStartMinutes = timeToMinutes(slot);
    const slotEndMinutes = slotStartMinutes + duration;

    return bookings.some((booking) => {
      if (!booking.time || typeof booking.duration !== "number") {
        console.warn("Ungültige Buchungsdaten:", booking);
        return false;
      }

      const bookingStartMinutes = timeToMinutes(booking.time);
      const bookingEndMinutes = bookingStartMinutes + booking.duration;

      // Prüfe auf Überschneidung
      return (
        (slotStartMinutes >= bookingStartMinutes &&
          slotStartMinutes < bookingEndMinutes) ||
        (slotEndMinutes > bookingStartMinutes &&
          slotEndMinutes <= bookingEndMinutes) ||
        (slotStartMinutes <= bookingStartMinutes &&
          slotEndMinutes >= bookingEndMinutes)
      );
    });
  };

  // ✅ SCHRITT 3: Erweiterte Zeitslot-Generierung mit ausgegrauten nicht verfügbaren Slots
  const loadExtendedTimeSlots = async (date: Date) => {
    if (!date) {
      setExtendedTimeSlots([]);
      return [];
    }

    console.log(
      "🔧 SCHRITT 3: Generiere erweiterte Zeitslots mit Verfügbarkeitsstatus..."
    );

    try {
      const formattedDate = formatDateForDB(date);

      // Lade Buchungen und gesperrte Zeiten
      const bookings = await getBookingsForDate(formattedDate);
      console.log(
        `📅 ${bookings.length} Buchungen gefunden für ${formattedDate}`
      );

      let blockedTimes: BlockedTime[] = [];
      try {
        const { getBlockedTimesForDate } = await import(
          "@/utils/calendarBlockingService"
        );
        blockedTimes = await getBlockedTimesForDate(formattedDate);
        console.log(
          `🚫 ${blockedTimes.length} Admin-Sperrungen gefunden für ${formattedDate}`
        );
      } catch (error) {
        console.warn(
          "🔧 FALLBACK: Konnte gesperrte Zeiten nicht laden:",
          (error as Error).message
        );
      }

      // Generiere ALLE möglichen Zeitslots
      const allSlots = generateAllTimeSlots();
      const businessEndMinutes = 18 * 60; // 18:00 Uhr
      const extendedSlots = [];

      for (const slot of allSlots) {
        const slotMinutes = timeToMinutes(slot);
        const slotEndMinutes = slotMinutes + totalDuration;

        // Prüfe Geschäftszeiten
        if (slotEndMinutes > businessEndMinutes) {
          continue; // Außerhalb der Geschäftszeiten = nicht anzeigen
        }

        let isAvailable = true;
        let unavailableReason = "";

        // Prüfe Buchungskonflikte
        const hasBookingConflict = bookings.some((booking) => {
          if (!booking.time || typeof booking.duration !== "number") {
            return false;
          }

          const bookingStartMinutes = timeToMinutes(booking.time);
          const bookingEndMinutes = bookingStartMinutes + booking.duration;

          return (
            (slotMinutes >= bookingStartMinutes &&
              slotMinutes < bookingEndMinutes) ||
            (slotEndMinutes > bookingStartMinutes &&
              slotEndMinutes <= bookingEndMinutes) ||
            (slotMinutes <= bookingStartMinutes &&
              slotEndMinutes >= bookingEndMinutes)
          );
        });

        if (hasBookingConflict) {
          isAvailable = false;
          unavailableReason = "Bereits gebucht";
        }

        // Prüfe Admin-Sperrungen
        if (isAvailable && blockedTimes.length > 0) {
          const blockingTime = blockedTimes.find((blocked) => {
            if (blocked.isFullDay) {
              return true; // Ganzer Tag gesperrt
            }

            if (!blocked.startTime || !blocked.endTime) {
              return false;
            }

            const blockStart = timeToMinutes(blocked.startTime);
            const blockEnd = timeToMinutes(blocked.endTime);

            return slotMinutes >= blockStart && slotMinutes < blockEnd;
          });

          if (blockingTime) {
            isAvailable = false;
            unavailableReason = blockingTime.isFullDay
              ? `Ganzer Tag gesperrt: ${blockingTime.reason}`
              : `Gesperrt: ${blockingTime.reason}`;
          }
        }

        extendedSlots.push({
          time: slot,
          isAvailable,
          reason: unavailableReason,
        });
      }

      const availableCount = extendedSlots.filter(
        (slot) => slot.isAvailable
      ).length;
      const unavailableCount = extendedSlots.filter(
        (slot) => !slot.isAvailable
      ).length;

      console.log(
        `✅ SCHRITT 3: ${availableCount} verfügbare + ${unavailableCount} nicht verfügbare Zeitslots generiert`
      );

      // Speichere erweiterte Zeitslots
      setExtendedTimeSlots(extendedSlots);

      // Für Kompatibilität: Gib nur die verfügbaren Zeiten zurück
      return extendedSlots
        .filter((slot) => slot.isAvailable)
        .map((slot) => slot.time);
    } catch (error) {
      console.error("Fehler beim Generieren der erweiterten Zeitslots:", error);
      setExtendedTimeSlots([]);
      return [];
    }
  };

  // Laden der verfügbaren Zeitslots
  const loadAvailableTimeSlots = async (date: Date) => {
    if (!date) return [];

    setIsLoading(true);

    try {
      const formattedDate = formatDateForDB(date);
      console.log(`DateTimeSelection: Lade Zeitslots für ${formattedDate}`);

      // ✅ SCHRITT 2: Zeitspezifische Sperrungen mit Fallback-Mechanismus
      console.log(
        "🔧 SCHRITT 2: Verwende getAvailableTimeSlots mit Fallback..."
      );

      try {
        // Versuche die vollständige getAvailableTimeSlots Funktion
        const availableSlots = await getAvailableTimeSlots(date, totalDuration);

        if (availableSlots.length === 0) {
          console.log(
            "⚠️ WARNUNG: getAvailableTimeSlots gab 0 Slots zurück - verwende Fallback"
          );
          throw new Error("Fallback aktiviert");
        }

        console.log(
          `✅ SCHRITT 2: ${availableSlots.length} verfügbare Zeitslots gefunden (MIT Admin-Sperrungen)`
        );

        // ✅ SCHRITT 3: Generiere auch erweiterte Zeitslots
        await loadExtendedTimeSlots(date);

        return availableSlots;
      } catch (error) {
        console.warn(
          "🔧 FALLBACK: getAvailableTimeSlots fehlgeschlagen, verwende vereinfachte Version:",
          (error as Error).message
        );

        // FALLBACK: Vereinfachte Zeitslot-Generierung (wie vorher)
        const bookings = await getBookingsForDate(formattedDate);
        console.log(`🔧 FALLBACK: ${bookings.length} Buchungen gefunden`);

        const allSlots = generateAllTimeSlots();
        const businessEndMinutes = 18 * 60; // 18:00 Uhr

        const fallbackSlots = allSlots.filter((slot) => {
          const slotMinutes = timeToMinutes(slot);
          const slotEndMinutes = slotMinutes + totalDuration;

          // Prüfe Geschäftszeiten
          if (slotEndMinutes > businessEndMinutes) {
            return false;
          }

          // Prüfe Buchungskonflikte
          const hasConflict = bookings.some((booking) => {
            if (!booking.time || typeof booking.duration !== "number") {
              return false;
            }

            const bookingStartMinutes = timeToMinutes(booking.time);
            const bookingEndMinutes = bookingStartMinutes + booking.duration;

            return (
              (slotMinutes >= bookingStartMinutes &&
                slotMinutes < bookingEndMinutes) ||
              (slotEndMinutes > bookingStartMinutes &&
                slotEndMinutes <= bookingEndMinutes) ||
              (slotMinutes <= bookingStartMinutes &&
                slotEndMinutes >= bookingEndMinutes)
            );
          });

          return !hasConflict;
        });

        console.log(
          `🔧 FALLBACK: ${fallbackSlots.length} verfügbare Zeitslots gefunden (OHNE Admin-Sperrungen)`
        );

        // ✅ SCHRITT 3: Generiere erweiterte Zeitslots auch im Fallback
        await loadExtendedTimeSlots(date);

        return fallbackSlots;
      }
    } catch (error) {
      console.error("Fehler beim Laden der Zeitslots:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Zeitslots bei Datumswechsel aktualisieren
  useEffect(() => {
    const updateTimeSlots = async () => {
      if (selectedDateTime.date) {
        setTimeSlots([]); // Leere die Zeitslots sofort, um alte Slots zu entfernen
        setUnavailableMessage(null);

        const dayOfWeek = selectedDateTime.date.getDay();

        // Keine Zeitslots für Sonntage
        if (dayOfWeek === 0) {
          setUnavailableMessage("An Sonntagen sind keine Termine verfügbar.");
          return;
        }

        // Lade verfügbare Zeitslots
        const availableSlots = await loadAvailableTimeSlots(
          selectedDateTime.date
        );

        setTimeSlots(availableSlots);

        if (availableSlots.length === 0) {
          setUnavailableMessage(
            "Für dieses Datum sind keine Zeitslots mit ausreichender Dauer verfügbar."
          );
        }
      }
    };

    updateTimeSlots();
  }, [selectedDateTime.date, totalDuration]);

  // Datum auswählen
  const handleDateSelect = async (date: Date) => {
    console.log("Neues Datum ausgewählt:", date);

    // Erstelle ein neues Date-Objekt und setze die Zeit auf Mitternacht
    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);

    // Setze das ausgewählte Datum
    setSelectedDateTime((prev) => ({
      ...prev,
      date: localDate,
      time: null, // Zeit zurücksetzen, wenn ein neues Datum ausgewählt wird
    }));

    // 🚨 DEBUG: Laden der gesperrten Zeiten temporär deaktiviert
    console.log(
      "🔧 DEBUG: Laden der gesperrten Zeiten übersprungen für Debugging..."
    );
  };

  // Zeit auswählen
  const handleTimeSelect = async (time: string) => {
    console.log("Zeit ausgewählt:", time, "für Datum:", selectedDateTime.date);

    // Bevor wir die Zeit setzen, prüfen wir nochmals auf Verfügbarkeit
    if (selectedDateTime.date) {
      const formattedDate = formatDateForDB(selectedDateTime.date);
      console.log("Prüfe Verfügbarkeit für:", formattedDate, time);

      // ✅ SCHRITT 2: Admin-Sperrungen bei Zeitauswahl mit Fallback
      console.log("🔧 SCHRITT 2: Prüfe Admin-Sperrungen bei Zeitauswahl...");

      try {
        const { isTimeSlotBlocked } = await import(
          "@/utils/calendarBlockingService"
        );
        const isBlocked = await isTimeSlotBlocked(formattedDate, time);

        if (isBlocked) {
          console.log(`🚫 SCHRITT 2: Zeitslot ${time} ist vom Admin gesperrt`);
          setUnavailableMessage(
            `Der gewählte Zeitslot ist nicht verfügbar (administrativ gesperrt). Bitte wählen Sie eine andere Zeit.`
          );
          return;
        } else {
          console.log(`✅ SCHRITT 2: Zeitslot ${time} ist NICHT gesperrt`);
        }
      } catch (error) {
        console.warn(
          "🔧 FALLBACK: Admin-Sperrung-Prüfung fehlgeschlagen, erlaube Zeitslot:",
          (error as Error).message
        );
        // Fallback: Erlaube den Zeitslot wenn die Prüfung fehlschlägt
      }

      // PRÜFE BUCHUNGSKONKFLIKTE
      const bookings = await getBookingsForDate(formattedDate);
      const hasConflict = checkSlotConflict(time, bookings, totalDuration);

      if (hasConflict) {
        // Suche nach dem nächsten verfügbaren Zeitslot
        const availableSlots = await loadAvailableTimeSlots(
          selectedDateTime.date
        );
        const nextSlotIndex = availableSlots.findIndex(
          (slot) => timeToMinutes(slot) > timeToMinutes(time)
        );
        const nextSlot =
          nextSlotIndex !== -1 ? availableSlots[nextSlotIndex] : null;

        if (nextSlot) {
          setUnavailableMessage(
            `Der gewählte Zeitslot ist bereits belegt. Der nächste verfügbare Termin ist um ${nextSlot} Uhr.`
          );
        } else {
          setUnavailableMessage(
            `Der gewählte Zeitslot ist bereits belegt. Es gibt keine weiteren verfügbaren Zeitslots für diesen Tag.`
          );
        }

        return;
      }

      // Zeitslot ist verfügbar, also setzen wir ihn
      const updatedDateTime = {
        date: selectedDateTime.date,
        time,
      };

      console.log("Setze neuen Termin:", updatedDateTime);
      setSelectedDateTime(updatedDateTime);
      setUnavailableMessage(null);
    } else {
      console.error("Kein Datum ausgewählt, kann Zeit nicht setzen");
      setUnavailableMessage("Bitte wählen Sie zuerst ein Datum aus.");
    }
  };

  // Zum nächsten Monat wechseln
  const goToNextMonth = () => {
    const nextMonth = new Date(selectedMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setSelectedMonth(nextMonth);
  };

  // Zum vorherigen Monat wechseln
  const goToPreviousMonth = () => {
    const prevMonth = new Date(selectedMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);

    // Nicht vor dem aktuellen Monat zurückgehen
    const currentMonth = new Date();
    if (
      prevMonth.getFullYear() < currentMonth.getFullYear() ||
      (prevMonth.getFullYear() === currentMonth.getFullYear() &&
        prevMonth.getMonth() < currentMonth.getMonth())
    ) {
      return;
    }

    setSelectedMonth(prevMonth);
  };

  // Kalenderdaten vorbereiten
  const prepareCalendarData = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    // Ersten Tag des Monats finden
    const firstDayOfMonth = new Date(year, month, 1);
    // Startender Wochentag angepasst an deutsche Kalenderwochen (Montag = 0, Sonntag = 6)
    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6; // Sonntag wird zu 6 statt -1

    // Anzahl der Tage im Monat
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Kalendarische Daten für den Kalender
    const calendarDays: any[] = [];

    // Leere Zellen für Tage vor dem ersten Tag des Monats
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push({ day: null, date: null });
    }

    // Tage des Monats
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Setze Uhrzeit auf Mitternacht für korrekte Datumsvergleiche

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay(); // 0 = Sonntag, 1 = Montag, ..., 6 = Samstag
      const isSunday = dayOfWeek === 0;

      // ✅ SCHRITT 1: Nur VOLLTAGSSPERRUNGEN für Kalenderansicht wieder aktivieren
      // Verwende lokale Zeit für konsistente Datumsverarbeitung
      const dateYear = date.getFullYear();
      const dateMonth = String(date.getMonth() + 1).padStart(2, "0");
      const dateDay = String(date.getDate()).padStart(2, "0");
      const dateStr = `${dateYear}-${dateMonth}-${dateDay}`;

      // Prüfe ob der GANZE TAG vom Admin gesperrt ist (nicht einzelne Uhrzeiten)
      const blockedTime = blockedTimes.find(
        (blocked) => blocked.date === dateStr && blocked.isFullDay === true
      );
      const isBlockedByAdmin = !!blockedTime;

      if (isBlockedByAdmin) {
        console.log(
          `🔧 SCHRITT 1: Tag ${dateStr} ist vollständig gesperrt:`,
          blockedTime?.reason
        );
      }

      // Ein Tag ist verfügbar, wenn:
      // 1. Es kein Sonntag ist
      // 2. Es nicht in der Vergangenheit liegt
      // 3. Es nicht VOLLSTÄNDIG vom Admin gesperrt ist
      const isPast = date < today;
      const isAvailable = !isSunday && !isPast && !isBlockedByAdmin;

      // Prüfen, ob das Datum ausgewählt ist
      const isSelected =
        selectedDateTime.date &&
        date.getDate() === selectedDateTime.date.getDate() &&
        date.getMonth() === selectedDateTime.date.getMonth() &&
        date.getFullYear() === selectedDateTime.date.getFullYear();

      calendarDays.push({
        day,
        date,
        isAvailable,
        isPast,
        isSelected,
        isSunday,
        isBlockedByAdmin,
        blockedReason: blockedTime?.reason || null,
      });
    }

    return calendarDays;
  };

  const calendarData = prepareCalendarData();

  // Prüfen, ob ein Weitergehen möglich ist
  const canContinue =
    selectedDateTime.date !== null && selectedDateTime.time !== null;

  // Monatsname formatieren
  const monthNames = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ];
  const formattedMonth = `${monthNames[selectedMonth.getMonth()]} ${selectedMonth.getFullYear()}`;

  // Eigene Formatierungsfunktion für Datum
  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    return new Intl.DateTimeFormat("de-DE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="datetime-selection-container">
      <h3 className="heading-tertiary">Termindaten</h3>
      <p className="booking-step-description">
        Bitte wählen Sie ein Datum und eine Uhrzeit für Ihre Behandlung.
        {totalDuration > 0 && (
          <span className="total-duration">
            {" "}
            Gesamtdauer: {totalDuration} Minuten
          </span>
        )}
      </p>

      <div className="calendar-container">
        <div className="calendar-header">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="month-nav-btn"
            aria-label="Vorheriger Monat"
          >
            &lt;
          </button>
          <h4 className="current-month">{formattedMonth}</h4>
          <button
            type="button"
            onClick={goToNextMonth}
            className="month-nav-btn"
            aria-label="Nächster Monat"
          >
            &gt;
          </button>
        </div>

        <div className="calendar-weekdays">
          <div className="weekday">Mo</div>
          <div className="weekday">Di</div>
          <div className="weekday">Mi</div>
          <div className="weekday">Do</div>
          <div className="weekday">Fr</div>
          <div className="weekday">Sa</div>
          <div className="weekday">So</div>
        </div>

        <div className="calendar-days">
          {calendarData.map((dayData, index) => (
            <div
              key={index}
              className={`calendar-day ${!dayData.day ? "empty-day" : ""} ${
                dayData.isSunday ? "sunday" : ""
              } ${dayData.isPast ? "past-day" : ""} ${
                dayData.isBlockedByAdmin ? "blocked-day" : ""
              } ${dayData.isAvailable ? "available-day" : ""} ${
                dayData.isSelected ? "selected-day" : ""
              }`}
              onClick={() => {
                if (dayData.day && dayData.isAvailable) {
                  handleDateSelect(dayData.date as Date);
                }
              }}
              title={
                dayData.isBlockedByAdmin
                  ? `🚫 Nicht verfügbar: ${dayData.blockedReason}`
                  : dayData.isSunday
                    ? "❌ Sonntags geschlossen"
                    : dayData.isPast
                      ? "❌ Datum liegt in der Vergangenheit"
                      : ""
              }
            >
              {dayData.day}
              {dayData.isBlockedByAdmin && (
                <div className="blocked-tooltip">
                  <strong>🚫 Nicht verfügbar</strong>
                  <br />
                  {dayData.blockedReason}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Legende für Kalender-Zustände */}
        <div className="calendar-legend">
          <div className="legend-item">
            <div className="legend-indicator available"></div>
            <span>Verfügbar</span>
          </div>
          <div className="legend-item">
            <div className="legend-indicator sunday"></div>
            <span>Sonntags geschlossen</span>
          </div>
          <div className="legend-item">
            <div className="legend-indicator past"></div>
            <span>Vergangen</span>
          </div>
          <div className="legend-item">
            <div className="legend-indicator blocked"></div>
            <span>Gesperrt</span>
          </div>
          {isLoadingBlockedTimes && (
            <div className="legend-loading">
              <span>⏳ Lade Sperrungen...</span>
            </div>
          )}
        </div>
      </div>

      {selectedDateTime.date && (
        <div className="time-slots-container">
          <h4 className="time-slots-heading">Verfügbare Zeiten</h4>

          {isLoading ? (
            <p className="loading-message">Lade verfügbare Zeiten...</p>
          ) : (
            <>
              {unavailableMessage && (
                <p className="unavailable-message">{unavailableMessage}</p>
              )}

              <div className="time-slots-grid">
                {extendedTimeSlots.length > 0
                  ? extendedTimeSlots.map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`time-slot ${
                          selectedDateTime.time === slot.time
                            ? "selected-time"
                            : ""
                        } ${!slot.isAvailable ? "unavailable-time" : ""}`}
                        onClick={() =>
                          slot.isAvailable && handleTimeSelect(slot.time)
                        }
                        disabled={!slot.isAvailable}
                        title={
                          !slot.isAvailable
                            ? `Nicht verfügbar: ${slot.reason}`
                            : `Verfügbar um ${slot.time}`
                        }
                      >
                        {slot.time}
                        {!slot.isAvailable && (
                          <span className="unavailable-icon">🚫</span>
                        )}
                      </button>
                    ))
                  : !unavailableMessage && (
                      <p className="no-slots-message">
                        Keine Zeiten für dieses Datum verfügbar.
                      </p>
                    )}
              </div>

              {/* ✅ SCHRITT 3: Legende für Zeitslot-Zustände */}
              {extendedTimeSlots.length > 0 && (
                <div className="time-slots-legend">
                  <div className="legend-item">
                    <div className="legend-indicator time-available"></div>
                    <span>Verfügbar</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-indicator time-unavailable">
                      <span className="mini-icon">🚫</span>
                    </div>
                    <span>Nicht verfügbar</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="form-actions">
        <button type="button" onClick={onBack} className="btn btn-secondary">
          Zurück
        </button>
        <button
          type="button"
          onClick={() => {
            if (!selectedDateTime.date || !selectedDateTime.time) {
              setUnavailableMessage(
                "Bitte wählen Sie ein Datum und eine Uhrzeit aus, bevor Sie fortfahren."
              );
              return;
            }
            console.log(
              "DateTimeSelection - Fortfahren mit:",
              selectedDateTime
            );
            onContinue();
          }}
          className="btn btn-primary"
          disabled={!canContinue}
        >
          Weiter
        </button>
      </div>
    </div>
  );
}
