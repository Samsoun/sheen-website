"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/utils/firebase-config";
import {
  getAllBlockedTimes,
  type BlockedTime,
} from "@/utils/calendarBlockingService";

interface Booking {
  id: string;
  date: string;
  time: string;
  duration: number;
  name: string;
  email: string;
  phone: string;
  serviceName: string;
  price?: number;
  status: "pending" | "confirmed" | "cancelled";
  message?: string;
}

interface AdminCalendarViewProps {
  // Keine Props erforderlich
}

export default function AdminCalendarView({}: AdminCalendarViewProps) {
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Styles für das Modal
  const modalStyles = `
    .modal-overlay {
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
    }

    .modal-content {
      background: white;
      padding: 2rem;
      border-radius: 0.5rem;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .modal-close-btn {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.5rem;
      color: #6b7280;
      transition: color 0.2s;
    }

    .modal-close-btn:hover {
      color: #111827;
    }

    .modal-body {
      color: #374151;
    }

    .booking-detail-section {
      margin-bottom: 2rem;
    }

    .booking-detail-section h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #4b5563;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .booking-detail-section h3 ion-icon {
      font-size: 1.2rem;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .detail-value {
      font-weight: 500;
    }
  `;

  // Uhrzeiten-Array generieren (08:00 - 21:00 in 15min Schritten)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if (hour === 21 && minute > 0) break; // Stoppe bei 21:00
        const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        slots.push(timeStr);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Daten laden
  useEffect(() => {
    loadCalendarData();
  }, [currentDate, viewMode]);

  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      // Lade Buchungen für den gewählten Zeitraum
      const bookingsData = await loadBookings();
      setBookings(bookingsData);

      // Lade gesperrte Zeiten
      const blockedData = await getAllBlockedTimes();
      setBlockedTimes(blockedData);
    } catch (error) {
      console.error("Fehler beim Laden der Kalenderdaten:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookings = async (): Promise<Booking[]> => {
    try {
      const bookingsRef = collection(db, "bookings");

      // Bestimme Datumsbereich basierend auf Ansicht
      const { startDate, endDate } = getDateRange();

      console.log("🔍 Admin-Kalender: Lade Buchungen für Zeitraum:", {
        startDate,
        endDate,
      });

      // Vereinfachte Query ohne multiple orderBy (um Index-Problem zu vermeiden)
      const q = query(
        bookingsRef,
        where("date", ">=", startDate),
        where("date", "<=", endDate),
        orderBy("date")
      );

      const querySnapshot = await getDocs(q);
      const bookingsData: Booking[] = [];

      console.log("📅 Verarbeite Buchungen und filtere stornierte aus");

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("📅 Buchung gefunden:", {
          id: doc.id,
          date: data.date,
          time: data.time,
          name: data.name,
          service: data.serviceName,
          status: data.status,
          duration: data.duration,
        });

        // Füge nur nicht-stornierte Buchungen hinzu
        if (data.status !== "cancelled") {
          bookingsData.push({
            id: doc.id,
            date: data.date || "",
            time: data.time || "",
            duration: data.duration || 0,
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            serviceName: data.serviceName || "",
            price: data.price || 0,
            status: data.status || "pending",
            message: data.message || "",
          });
        } else {
          console.log(
            `🗑️ Stornierte Buchung übersprungen: ${doc.id} (${data.date} ${data.time})`
          );
        }
      });

      // Sortiere die Buchungen clientseitig nach Datum und Zeit
      bookingsData.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });

      console.log(
        `✅ Insgesamt ${bookingsData.length} Buchungen für Admin-Kalender geladen und sortiert`
      );
      return bookingsData;
    } catch (error) {
      console.error("❌ Fehler beim Laden der Buchungen:", error);
      return [];
    }
  };

  // Funktion zum Öffnen des Buchungsdetail-Modals
  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  // Funktion zum Schließen des Modals
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
  };

  // Formatiere Zeit im 24h Format
  const formatTime = (time: string) => {
    return time;
  };

  // Formatiere Datum zu deutschem Format
  const formatDate = (date: string) => {
    const [year, month, day] = date.split("-");
    return `${day}.${month}.${year}`;
  };

  // Datumsbereich für aktuelle Ansicht bestimmen
  const getDateRange = () => {
    if (viewMode === "week") {
      const startOfWeek = new Date(currentDate);
      const day = currentDate.getDay();
      const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // Montag als Wochenstart
      startOfWeek.setDate(diff);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return {
        startDate: formatDateForFirestore(startOfWeek),
        endDate: formatDateForFirestore(endOfWeek),
      };
    } else {
      // Monatsansicht
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      return {
        startDate: formatDateForFirestore(startOfMonth),
        endDate: formatDateForFirestore(endOfMonth),
      };
    }
  };

  // Datum für Firestore formatieren
  const formatDateForFirestore = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Tage für aktuelle Ansicht generieren
  const getDaysInView = () => {
    const days = [];
    const { startDate, endDate } = getDateRange();
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");

    const current = new Date(start);
    while (current <= end) {
      days.push({
        date: new Date(current),
        dateStr: formatDateForFirestore(current),
      });
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // Interface für Day-Objekte in der Monatsansicht
  interface MonthDay {
    date: Date;
    dateStr: string;
    isInCurrentMonth: boolean;
  }

  // Für Monatsansicht: Organisiere Tage in Wochen
  const getWeeksInMonth = (): MonthDay[][] => {
    if (viewMode === "week") {
      const weekDays = getDaysInView();
      const currentMonthValue = currentDate.getMonth();
      return [
        weekDays.map((dayObj) => ({
          date: dayObj.date,
          dateStr: dayObj.dateStr,
          isInCurrentMonth: dayObj.date.getMonth() === currentMonthValue,
        })),
      ];
    }

    // Für Monatsansicht: Kompletter Kalendermonat
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Erster Tag des Monats
    const firstDayOfMonth = new Date(year, month, 1);
    // Letzter Tag des Monats
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Starte mit dem Montag der ersten Woche
    const startCalendar = new Date(firstDayOfMonth);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const daysToSubtract = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1; // Montag = 0
    startCalendar.setDate(firstDayOfMonth.getDate() - daysToSubtract);

    // Ende mit dem Sonntag der letzten Woche
    const endCalendar = new Date(lastDayOfMonth);
    const lastDayWeekday = lastDayOfMonth.getDay();
    const daysToAdd = lastDayWeekday === 0 ? 0 : 7 - lastDayWeekday;
    endCalendar.setDate(lastDayOfMonth.getDate() + daysToAdd);

    const weeks = [];
    const current = new Date(startCalendar);

    // Generiere mindestens 4, maximal 6 Wochen für den Monat
    let weekCount = 0;
    while (current <= endCalendar && weekCount < 6) {
      const week = [];
      // 7 Tage pro Woche (Mo-So)
      for (let i = 0; i < 7; i++) {
        week.push({
          date: new Date(current),
          dateStr: formatDateForFirestore(current),
          isInCurrentMonth: current.getMonth() === month,
        });
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
      weekCount++;
    }

    return weeks;
  };

  // Navigation
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Zur aktuellen Woche/Monat springen
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Zu spezifischem Datum springen (für Debug)
  const goToDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    setCurrentDate(new Date(year, month - 1, day));
  };

  // Status für eine bestimmte Zeit/Tag bestimmen
  const getTimeSlotStatus = (dateStr: string, time: string) => {
    // Prüfe Ganztags-Sperrung
    const fullDayBlock = blockedTimes.find(
      (block) => block.date === dateStr && block.isFullDay
    );
    if (fullDayBlock) {
      // Bei Ganztags-Sperrung: nur beim ersten Zeitslot des Tages (08:00) Text anzeigen
      const isFirstSlotOfDay = time === timeSlots[0]; // 08:00 ist der erste Slot
      return {
        type: "blocked-day",
        reason: fullDayBlock.reason,
        isFirstSlot: isFirstSlotOfDay,
      };
    }

    // Prüfe Zeitbereichs-Sperrung
    const timeBlock = blockedTimes.find((block) => {
      if (block.date !== dateStr || block.isFullDay) return false;
      if (!block.startTime || !block.endTime) return false;

      const slotTime = timeToMinutes(time);
      const blockStart = timeToMinutes(block.startTime);
      const blockEnd = timeToMinutes(block.endTime);

      return slotTime >= blockStart && slotTime < blockEnd;
    });
    if (timeBlock) {
      // Bestimme, ob dies der erste Slot der Sperrung ist (für Text-Anzeige)
      const blockStart = timeToMinutes(timeBlock.startTime!);
      const slotTime = timeToMinutes(time);
      const isFirstSlot = slotTime === blockStart;

      return {
        type: "blocked-time",
        reason: timeBlock.reason,
        isFirstSlot: isFirstSlot,
        blockData: timeBlock,
      };
    }

    // Prüfe Buchungen
    const booking = bookings.find((b) => {
      if (b.date !== dateStr) return false;

      const bookingStart = timeToMinutes(b.time);
      const bookingEnd = bookingStart + b.duration;
      const slotTime = timeToMinutes(time);

      return slotTime >= bookingStart && slotTime < bookingEnd;
    });
    if (booking) {
      // Bestimme, ob dies der erste Slot der Buchung ist (für Text-Anzeige)
      const bookingStart = timeToMinutes(booking.time);
      const slotTime = timeToMinutes(time);
      const isFirstSlot = slotTime === bookingStart;

      return {
        type: "booked",
        booking: booking,
        status: booking.status,
        isFirstSlot: isFirstSlot,
      };
    }

    return { type: "available" };
  };

  // Hilfsfunktion: Zeit in Minuten umwandeln
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Formatierung für Anzeige
  const formatDisplayDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
    };

    if (viewMode === "week") {
      const { startDate, endDate } = getDateRange();
      const start = new Date(startDate + "T00:00:00");
      const end = new Date(endDate + "T00:00:00");

      const startFormatted = start.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
      });
      const endFormatted = end.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
      });

      return `${startFormatted} - ${endFormatted} ${start.getFullYear()}`;
    } else {
      return currentDate.toLocaleDateString("de-DE", options);
    }
  };

  const days = getDaysInView();
  const weeks = getWeeksInMonth();

  return (
    <div className="admin-calendar-view">
      {/* Header mit Navigation und Ansicht-Wechsel */}
      <div className="calendar-header">
        <div className="calendar-navigation">
          <button onClick={navigatePrevious} className="nav-btn">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </button>

          <div className="date-display">
            <h3>{formatDisplayDate()}</h3>
            <span className="view-label">
              {viewMode === "week" ? "Wochenansicht" : "Monatsansicht"}
            </span>
          </div>

          <button onClick={navigateNext} className="nav-btn">
            <ion-icon name="chevron-forward-outline"></ion-icon>
          </button>
        </div>

        <div className="calendar-controls">
          <button onClick={goToToday} className="today-btn">
            Heute
          </button>

          <div className="view-switcher">
            <button
              onClick={() => setViewMode("week")}
              className={`view-btn ${viewMode === "week" ? "active" : ""}`}
            >
              Woche
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`view-btn ${viewMode === "month" ? "active" : ""}`}
            >
              Monat
            </button>
          </div>
        </div>
      </div>

      {/* Legende */}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color available"></div>
          <span>Verfügbar</span>
        </div>
        <div className="legend-item">
          <div className="legend-color booked"></div>
          <span>Gebucht</span>
        </div>
        <div className="legend-item">
          <div className="legend-color blocked-time"></div>
          <span>Zeitbereich gesperrt</span>
        </div>
        <div className="legend-item">
          <div className="legend-color blocked-day"></div>
          <span>Ganzer Tag gesperrt</span>
        </div>
      </div>

      {/* Kalender-Grid */}
      {isLoading ? (
        <div className="calendar-loading">
          <ion-icon name="sync-outline"></ion-icon>
          <span>Lade Kalenderdaten...</span>
        </div>
      ) : viewMode === "month" ? (
        <div className="month-calendar-grid">
          {/* Wochentage Header */}
          <div className="month-header">
            {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((dayName) => (
              <div key={dayName} className="month-day-header">
                {dayName}
              </div>
            ))}
          </div>

          {/* Wochen */}
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="month-week">
              {week.map((day) => {
                const dayBookings = bookings.filter(
                  (b) => b.date === day.dateStr
                );
                const dayBlocked = blockedTimes.some(
                  (bt) => bt.isFullDay && bt.date === day.dateStr
                );
                const hasTimeBlocks = blockedTimes.some(
                  (bt) => !bt.isFullDay && bt.date === day.dateStr
                );

                return (
                  <div
                    key={day.dateStr}
                    className={`month-day-cell ${!day.isInCurrentMonth ? "other-month" : ""} ${dayBlocked ? "blocked-day" : ""}`}
                  >
                    <div className="day-number">
                      {day.date.getDate()}
                      {!day.isInCurrentMonth && (
                        <span className="month-indicator">
                          .{day.date.getMonth() + 1}
                        </span>
                      )}
                    </div>

                    {dayBlocked ? (
                      <div className="day-status blocked">
                        {blockedTimes.find(
                          (bt) => bt.isFullDay && bt.date === day.dateStr
                        )?.reason || "Gesperrt"}
                      </div>
                    ) : (
                      <>
                        {dayBookings.length > 0 && (
                          <div className="day-bookings">
                            {dayBookings.slice(0, 3).map((booking, idx) => (
                              <div key={idx} className="booking-item">
                                <span className="booking-time">
                                  {booking.time}
                                </span>
                                <span className="booking-service">
                                  {booking.serviceName}
                                </span>
                              </div>
                            ))}
                            {dayBookings.length > 3 && (
                              <div className="more-bookings">
                                +{dayBookings.length - 3} weitere
                              </div>
                            )}
                          </div>
                        )}

                        {hasTimeBlocks && (
                          <div className="day-status time-blocked">
                            Teilweise gesperrt
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="calendar-grid">
          {/* Header mit Tagen */}
          <div className="calendar-grid-header">
            <div className="time-header">Zeit</div>
            {days.map((day) => (
              <div key={day.dateStr} className="day-header">
                <div className="day-name">
                  {day.date.toLocaleDateString("de-DE", { weekday: "short" })}
                </div>
                <div className="day-date">
                  {day.date.getDate().toString().padStart(2, "0")}
                </div>
              </div>
            ))}
          </div>

          {/* Zeit-Slots */}
          <div className="calendar-grid-body">
            {timeSlots.map((time) => (
              <div key={time} className="time-row">
                <div className="time-cell">{time}</div>
                {days.map((day) => {
                  const status = getTimeSlotStatus(day.dateStr, time);
                  return (
                    <div
                      key={`${day.dateStr}-${time}`}
                      className={`slot-cell ${status.type}`}
                      title={
                        status.type === "booked"
                          ? `${status.booking?.name} - ${status.booking?.serviceName} (${status.booking?.duration} Min.)`
                          : status.type === "blocked-time" ||
                              status.type === "blocked-day"
                            ? status.reason
                            : "Verfügbar"
                      }
                      onClick={() =>
                        status.type === "booked" &&
                        status.booking &&
                        handleBookingClick(status.booking)
                      }
                      style={{
                        cursor:
                          status.type === "booked" ? "pointer" : "default",
                      }}
                    >
                      {status.type === "booked" && status.isFirstSlot && (
                        <div className="booking-info">
                          <div className="booking-name">
                            {status.booking?.name}
                          </div>
                          <div className="booking-service">
                            {status.booking?.serviceName}
                          </div>
                          <div className="booking-time">
                            {status.booking?.time} -{" "}
                            {(() => {
                              const [hours, minutes] = status.booking?.time
                                .split(":")
                                .map(Number) || [0, 0];
                              const startMinutes = hours * 60 + minutes;
                              const endMinutes =
                                startMinutes + (status.booking?.duration || 0);
                              const endHours = Math.floor(endMinutes / 60);
                              const endMins = endMinutes % 60;
                              return `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;
                            })()}
                          </div>
                        </div>
                      )}
                      {status.type === "blocked-day" && status.isFirstSlot && (
                        <div className="blocking-info">
                          <div className="blocking-reason">
                            {status.reason || "Gesperrt"}
                          </div>
                        </div>
                      )}
                      {status.type === "blocked-time" && status.isFirstSlot && (
                        <div className="blocking-info">
                          <div className="blocking-reason">
                            {status.reason || "Gesperrt"}
                          </div>
                          <div className="blocking-time">
                            {status.blockData?.startTime} -{" "}
                            {status.blockData?.endTime}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        /* Spezifischer Reset - nur horizontale Rahmen entfernen */
        .calendar-grid :global(*),
        .calendar-grid-header :global(*),
        .calendar-grid-body :global(*) {
          border-top: none !important;
          border-bottom: none !important;
          border-collapse: collapse !important;
          border-spacing: 0 !important;
        }

        .admin-calendar-view {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          margin: 0;
          padding: 2rem;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem 2.4rem;
          background: linear-gradient(135deg, #b2d8db 0%, #9dd4d8 100%);
          color: #000;
        }

        .calendar-navigation {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .nav-btn {
          background: rgba(255, 255, 255, 0.3);
          border: 1px solid rgba(0, 0, 0, 0.2);
          border-radius: 50%;
          width: 4rem;
          height: 4rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .nav-btn:hover {
          background: rgba(255, 255, 255, 0.5);
          border-color: rgba(0, 0, 0, 0.3);
        }

        .date-display h3 {
          margin: 0;
          font-size: 2rem;
          font-weight: 600;
        }

        .view-label {
          font-size: 1.2rem;
          opacity: 0.9;
        }

        .calendar-controls {
          display: flex;
          align-items: center;
          gap: 1.6rem;
        }

        .today-btn {
          background: rgba(255, 255, 255, 0.3);
          border: 1px solid rgba(0, 0, 0, 0.2);
          color: #000;
          padding: 0.8rem 1.6rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .today-btn:hover {
          background: rgba(255, 255, 255, 0.5);
          border-color: rgba(0, 0, 0, 0.3);
        }

        .debug-btn {
          background: rgba(255, 193, 7, 0.3);
          border: 1px solid rgba(255, 193, 7, 0.6);
          color: #000;
          padding: 0.8rem 1.6rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1.2rem;
        }

        .debug-btn:hover {
          background: rgba(255, 193, 7, 0.5);
          border-color: rgba(255, 193, 7, 0.8);
        }

        .view-switcher {
          display: flex;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          overflow: hidden;
        }

        .view-btn {
          background: transparent;
          border: none;
          color: #000;
          padding: 0.8rem 1.6rem;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .view-btn.active {
          background: rgba(255, 255, 255, 0.5);
        }

        .calendar-legend {
          display: flex;
          gap: 2rem;
          padding: 1.6rem 2.4rem;
          background: #f8fafa;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: 1.3rem;
        }

        .legend-color {
          width: 1.6rem;
          height: 1.6rem;
          border-radius: 3px;
        }

        .legend-color.available {
          background: #f3f4f6;
        }

        .legend-color.booked {
          background: #34d399;
        }

        .legend-color.blocked-time {
          background: #9ca3af;
        }

        .legend-color.blocked-day {
          background: #dc2626;
        }

        .calendar-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.2rem;
          padding: 4rem;
          color: #6b7280;
        }

        .calendar-loading ion-icon {
          font-size: 2.4rem;
          animation: spin 1s linear infinite;
        }

        .calendar-grid {
          overflow-x: auto;
          width: 100%;
        }

        .calendar-grid-header {
          display: flex;
          background: #f8fafa;
          position: sticky;
          top: 0;
          z-index: 10;
          width: 100%;
        }

        .time-header {
          width: 10%;
          min-width: 6rem;
          padding: 0.8rem;
          font-weight: 600;
          text-align: center;
          background: #f1f3f4;
          border: none;
          outline: none;
        }

        .day-header {
          flex: 1;
          min-width: 0;
          padding: 0.8rem;
          text-align: center;
          border-top: none !important;
          border-bottom: none !important;
          border-right: none !important;
          outline: none;
          border-left: 1px solid #e5e7eb !important;
        }

        .day-header:first-child {
          border-left: none !important;
        }

        .day-name {
          font-weight: 600;
          font-size: 1rem;
          color: #374151;
        }

        .day-date {
          font-size: 0.9rem;
          color: #6b7280;
          margin-top: 0.2rem;
        }

        .calendar-grid-body {
          max-height: 60vh;
          overflow-y: auto;
        }

        .time-row {
          display: flex;
          width: 100%;
        }

        .time-cell {
          width: 10%;
          min-width: 6rem;
          padding: 0.6rem;
          text-align: center;
          font-size: 1rem;
          color: #6b7280;
          background: #f9fafb;
          border: none;
          outline: none;
        }

        .slot-cell {
          flex: 1;
          min-width: 0;
          min-height: 3.5rem;
          position: relative;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          border-top: none !important;
          border-bottom: none !important;
          border-right: none !important;
          outline: none;
          box-sizing: border-box;
          border-left: 1px solid #e5e7eb !important;
        }

        .slot-cell:first-child {
          border-left: none !important;
        }

        .slot-cell.available {
          background: #ffffff;
        }

        .slot-cell.available:hover {
          background: #f3f4f6;
        }

        .slot-cell.booked {
          background: #34d399;
          color: #fff;
        }

        .slot-cell.blocked-time {
          background: #9ca3af;
          color: #fff;
        }

        .slot-cell.blocked-day {
          background: #dc2626;
          color: #fff;
        }

        .booking-info {
          padding: 0.3rem;
          font-size: 0.9rem;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          width: 100%;
          height: 100%;
          text-align: left;
        }

        .booking-name {
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 1rem;
        }

        .booking-service {
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 1rem;
          opacity: 0.95;
          margin-top: 0.1rem;
        }

        .booking-time {
          font-weight: 400;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 0.9rem;
          opacity: 0.85;
          margin-top: 0.1rem;
        }

        .blocking-info {
          padding: 0.4rem;
          font-size: 1rem;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          width: 100%;
          height: 100%;
          text-align: left;
        }

        .blocking-reason {
          font-weight: 500;
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 1.3rem;
        }

        .blocking-time {
          font-weight: 400;
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 1.1rem;
          opacity: 0.85;
          margin-top: 0.1rem;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Monatsansicht Styling */
        .month-calendar-grid {
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }

        .month-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: #f8f9fa;
          border-bottom: 1px solid #e5e7eb;
        }

        .month-day-header {
          padding: 1rem;
          text-align: center;
          font-weight: 600;
          color: #374151;
          border-right: 1px solid #e5e7eb;
        }

        .month-day-header:last-child {
          border-right: none;
        }

        .month-week {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          border-bottom: 1px solid #e5e7eb;
        }

        .month-week:last-child {
          border-bottom: none;
        }

        .month-day-cell {
          min-height: 8rem;
          padding: 0.5rem;
          border-right: 1px solid #e5e7eb;
          position: relative;
          background: #fff;
          overflow: hidden;
        }

        .month-day-cell:last-child {
          border-right: none;
        }

        .month-day-cell.other-month {
          background: #f9fafb;
          opacity: 0.5;
        }

        .month-day-cell.blocked-day {
          background: #dc2626;
          color: #fff;
        }

        .day-number {
          font-size: 1.4rem;
          font-weight: 600;
          margin-bottom: 0.4rem;
          color: #374151;
          position: relative;
        }

        .month-indicator {
          font-size: 0.8rem;
          opacity: 0.6;
        }

        .month-day-cell.other-month .day-number {
          opacity: 0.4;
        }

        .day-bookings {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .booking-item {
          background: #34d399;
          color: #fff;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-size: 0.8rem;
          display: flex;
          flex-direction: column;
        }

        .booking-item .booking-time {
          font-weight: 600;
          color: #fff;
          margin: 0;
        }

        .booking-item .booking-service {
          color: #fff;
          opacity: 0.9;
          margin: 0;
        }

        .more-bookings {
          background: #6b7280;
          color: #fff;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-size: 0.7rem;
          text-align: center;
        }

        .day-status {
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-size: 0.8rem;
          text-align: center;
          margin-top: 0.2rem;
        }

        .day-status.blocked {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
        }

        .day-status.time-blocked {
          background: #9ca3af;
          color: #fff;
        }

        @media (max-width: 768px) {
          .calendar-header {
            flex-direction: column;
            gap: 1.6rem;
            align-items: stretch;
          }

          .calendar-navigation {
            justify-content: center;
          }

          .calendar-controls {
            justify-content: center;
          }

          .calendar-legend {
            flex-wrap: wrap;
            justify-content: center;
          }

          .day-header {
            min-width: 8rem;
          }

          .slot-cell {
            min-width: 8rem;
          }
        }

        /* Mobile Optimierungen für Kalender */
        @media (max-width: 768px) {
          .admin-calendar-view {
            margin: 0;
            padding: 1rem;
            border-radius: 8px;
          }

          .calendar-header {
            flex-direction: column;
            gap: 1.5rem;
            align-items: stretch;
            padding: 1.5rem;
          }

          .calendar-navigation {
            justify-content: center;
            gap: 1rem;
          }

          .nav-btn {
            padding: 1rem;
            min-width: 4.5rem;
            border-radius: 8px;
          }

          .date-display h3 {
            font-size: 1.8rem;
            text-align: center;
          }

          .view-label {
            font-size: 1.2rem;
            text-align: center;
          }

          .calendar-controls {
            flex-direction: column;
            gap: 1.2rem;
            align-items: stretch;
          }

          .today-btn {
            padding: 1.2rem 2rem;
            font-size: 1.4rem;
            border-radius: 8px;
          }

          .view-switcher {
            display: flex;
            width: 100%;
          }

          .view-btn {
            flex: 1;
            padding: 1.2rem;
            font-size: 1.3rem;
            border-radius: 6px;
          }

          /* Legende für Mobile anpassen */
          .calendar-legend {
            padding: 1.2rem;
            flex-wrap: wrap;
            gap: 1rem;
          }

          .legend-item {
            flex: 1;
            min-width: calc(50% - 0.5rem);
            align-items: center;
            text-align: center;
          }

          .legend-color {
            width: 1.5rem;
            height: 1.5rem;
            margin-bottom: 0.4rem;
          }

          .legend-item span {
            font-size: 1.1rem;
          }

          /* Monatsansicht für Mobile */
          .month-calendar-grid {
            border-radius: 8px;
          }

          .month-day-header {
            padding: 0.8rem 0.4rem;
            font-size: 1.1rem;
          }

          .month-day-cell {
            min-height: 6rem;
            padding: 0.4rem;
          }

          .day-number {
            font-size: 1.2rem;
            margin-bottom: 0.3rem;
          }

          .booking-item {
            font-size: 0.7rem;
            padding: 0.15rem 0.3rem;
            margin-bottom: 0.2rem;
          }

          .booking-item .booking-time {
            font-size: 0.65rem;
          }

          .booking-item .booking-service {
            font-size: 0.65rem;
          }

          .day-status {
            font-size: 0.7rem;
            padding: 0.15rem 0.3rem;
          }

          /* Wochenansicht für Mobile */
          .calendar-grid {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .calendar-grid-header {
            min-width: 100%;
          }

          .time-header {
            min-width: 4rem;
            padding: 0.6rem 0.3rem;
            font-size: 1rem;
          }

          .day-header {
            min-width: 8rem;
            padding: 0.6rem 0.3rem;
          }

          .day-name {
            font-size: 0.9rem;
          }

          .day-date {
            font-size: 0.8rem;
          }

          .time-cell {
            min-width: 4rem;
            padding: 0.4rem 0.2rem;
            font-size: 0.9rem;
          }

          .slot-cell {
            min-width: 8rem;
            min-height: 3rem;
          }

          .booking-info {
            padding: 0.2rem;
            font-size: 0.8rem;
          }

          .booking-name {
            font-size: 0.9rem;
          }

          .booking-service {
            font-size: 0.9rem;
          }

          .booking-time {
            font-size: 0.8rem;
          }

          .blocking-info {
            padding: 0.2rem;
            font-size: 0.8rem;
          }

          .blocking-reason {
            font-size: 0.9rem;
          }

          .blocking-time {
            font-size: 0.8rem;
          }

          /* Scroll-Hinweis für Wochenansicht */
          .calendar-grid::after {
            content: "← Zum Scrollen wischen →";
            display: block;
            text-align: center;
            padding: 1rem;
            background: #f3f4f6;
            color: #6b7280;
            font-size: 1.1rem;
            border-top: 1px solid #e5e7eb;
          }

          .calendar-grid-body {
            max-height: 50vh;
          }
        }

        @media (max-width: 480px) {
          .legend-item {
            min-width: 100%;
          }

          .month-day-header {
            padding: 0.6rem 0.2rem;
            font-size: 1rem;
          }

          .month-day-cell {
            min-height: 5rem;
            padding: 0.3rem;
          }

          .day-number {
            font-size: 1.1rem;
          }

          .time-header {
            min-width: 3.5rem;
          }

          .day-header {
            min-width: 7rem;
          }

          .slot-cell {
            min-width: 7rem;
          }

          /* Modal Styles */
          .modal-overlay {
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

          .modal-content {
            background: white;
            border-radius: 12px;
            padding: 0;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            animation: slideIn 0.3s ease-out;
          }

          .modal-header {
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .modal-header h2 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #111827;
            margin: 0;
          }

          .modal-close-btn {
            background: none;
            border: none;
            color: #6b7280;
            cursor: pointer;
            font-size: 1.5rem;
            padding: 0.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .modal-body {
            padding: 1.5rem;
          }

          .booking-detail-section {
            margin-bottom: 1.5rem;
          }

          .booking-detail-section h3 {
            font-size: 1rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .detail-grid {
            display: grid;
            gap: 1rem;
          }

          .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem;
            background: #f9fafb;
            border-radius: 6px;
          }

          .detail-label {
            color: #6b7280;
            font-size: 0.9rem;
          }

          .detail-value {
            font-weight: 500;
            color: #111827;
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

          .booking-info {
            font-size: 0.7rem;
          }

          .booking-name {
            font-size: 0.8rem;
          }

          .booking-service {
            font-size: 0.8rem;
          }

          /* Neues Modal Design */
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
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow:
              0 20px 25px -5px rgba(0, 0, 0, 0.1),
              0 10px 10px -5px rgba(0, 0, 0, 0.04);
            animation: slideIn 0.3s ease-out;
          }

          .modal-header {
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .modal-header h2 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1f2937;
            margin: 0;
          }

          .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6b7280;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.5rem;
            transition: color 0.2s;
          }

          .modal-close:hover {
            color: #1f2937;
          }

          .modal-content {
            padding: 1.5rem;
          }

          .booking-detail-section {
            margin-bottom: 2rem;
          }

          .booking-detail-section h3 {
            font-size: 1.2rem;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 1rem 0;
          }

          .detail-grid {
            display: grid;
            gap: 1rem;
          }

          .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background: #f9fafb;
            border-radius: 8px;
          }

          .label {
            color: #6b7280;
          }

          .value {
            font-weight: 500;
            color: #1f2937;
          }

          .status-confirmed {
            color: #059669 !important;
          }

          .status-cancelled {
            color: #dc2626 !important;
          }

          .status-pending {
            color: #d97706 !important;
          }

          .treatments-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .treatment-item {
            background: #f9fafb;
            border-radius: 8px;
            padding: 1rem;
          }

          .treatment-name {
            font-weight: 500;
            color: #1f2937;
            margin-bottom: 0.5rem;
          }

          .treatment-details {
            display: flex;
            gap: 1rem;
            color: #6b7280;
            font-size: 0.9rem;
          }

          .message-content {
            background: #f9fafb;
            border-radius: 8px;
            padding: 1rem;
            white-space: pre-wrap;
            word-break: break-word;
            color: #1f2937;
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
        }
      `}</style>

      {showModal && selectedBooking && (
        <div className="booking-modal-overlay" onClick={handleCloseModal}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Buchungsdetails</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            <div className="modal-content">
              <div className="booking-detail-section">
                <h3>👤 Kunde</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Name:</span>
                    <span className="value">{selectedBooking.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">E-Mail:</span>
                    <span className="value">{selectedBooking.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Telefon:</span>
                    <span className="value">{selectedBooking.phone}</span>
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
                        : selectedBooking.status === "cancelled"
                          ? "Storniert"
                          : "Ausstehend"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="booking-detail-section">
                <h3>💅 Behandlung</h3>
                <div className="treatments-list">
                  <div className="treatment-item">
                    <div className="treatment-name">
                      {selectedBooking.serviceName}
                    </div>
                    <div className="treatment-details">
                      <span className="treatment-duration">
                        ⏱️ {selectedBooking.duration} Min
                      </span>
                      {selectedBooking.price && (
                        <span className="treatment-price">
                          💰 {selectedBooking.price}€
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

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
    </div>
  );
}
