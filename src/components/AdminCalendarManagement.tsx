"use client";

import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/utils/firebase-config";
import {
  blockFullDay,
  blockTimeRange,
  blockDateRange,
  unblockTime,
  getAllBlockedTimes,
  getBlockedTimesForDate,
  type BlockedTime,
} from "@/utils/calendarBlockingService";

interface AdminCalendarManagementProps {
  onClose?: () => void;
}

export default function AdminCalendarManagement({
  onClose,
}: AdminCalendarManagementProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isUserLoading, setIsUserLoading] = useState<boolean>(true);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [blockType, setBlockType] = useState<
    "full-day" | "time-range" | "date-range"
  >("full-day");
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("18:00");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Bulk-Selection States
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);

  // Vordefinierte Gründe für Sperrungen
  const predefinedReasons = [
    "Urlaub",
    "Krankheit",
    "Geschäftstermin",
    "Wartung",
    "Feiertag",
    "Sonstiges",
  ];

  // Hilfsfunktion: Datum von YYYY-MM-DD zu DD/MM/YYYY formatieren
  const formatDateForDisplay = (dateString: string): string => {
    try {
      const [year, month, day] = dateString.split("-");
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.warn("Fehler beim Formatieren des Datums:", dateString);
      return dateString; // Fallback: Original-Format zurückgeben
    }
  };

  // Zeitslots für Uhrzeiten-Auswahl
  const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
  ];

  // Stelle sicher, dass die Uhrzeiten korrekt initialisiert sind
  useEffect(() => {
    // Force Reset der Uhrzeiten wenn der Modus gewechselt wird
    if (blockType === "time-range") {
      console.log("🕐 Prüfe Uhrzeiten-Initialisierung:", {
        startTime,
        endTime,
      });

      if (!startTime || !timeSlots.includes(startTime)) {
        console.log("🔧 Setze Standard-Startzeit: 09:00");
        setStartTime("09:00");
      }
      if (!endTime || !timeSlots.includes(endTime)) {
        console.log("🔧 Setze Standard-Endzeit: 18:00");
        setEndTime("18:00");
      }
    }
  }, [blockType]);

  // Initialisierung beim ersten Laden
  useEffect(() => {
    console.log("🚀 AdminCalendar: Erste Initialisierung der Uhrzeiten");
    if (!startTime) {
      setStartTime("09:00");
    }
    if (!endTime) {
      setEndTime("18:00");
    }
  }, []);

  // Firebase Auth Listener
  useEffect(() => {
    console.log("🔧 AdminCalendar: Initialisiere Firebase Auth Listener...");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log(
        "🔧 AdminCalendar: Auth State geändert:",
        user
          ? {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
            }
          : "Nicht angemeldet"
      );
      setCurrentUser(user);
      setIsUserLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Gesperrte Zeiten laden
  const loadBlockedTimes = async () => {
    try {
      setIsLoading(true);
      setError(null); // Vorherige Fehler löschen

      const times = await getAllBlockedTimes();
      setBlockedTimes(times);
      console.log("✅ Gesperrte Zeiten geladen:", times.length);

      // Wenn wir Einträge haben aber weniger als erwartet, könnte es ein Index-Problem geben
      if (times.length === 0) {
        console.info(
          "ℹ️ Keine gesperrten Zeiten gefunden. Das ist normal wenn noch keine erstellt wurden."
        );
      }
    } catch (error) {
      console.error("Fehler beim Laden der gesperrten Zeiten:", error);

      if ((error as Error).message?.includes("index")) {
        setError(
          "⚠️ Firebase Index wird erstellt... Die Liste wird in wenigen Minuten verfügbar sein. Sperrungen funktionieren bereits!"
        );
        console.warn(
          "💡 Hinweis: Das Index-Problem behebt sich automatisch. Sperrungen funktionieren trotzdem!"
        );
      } else {
        setError("❌ Fehler beim Laden der gesperrten Zeiten");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Nur laden wenn User geladen ist
    if (!isUserLoading) {
      loadBlockedTimes();
    }
  }, [isUserLoading]);

  // Erfolgs-/Fehlermeldungen nach bestimmter Zeit ausblenden
  useEffect(() => {
    if (success || error) {
      // Erfolgsmeldungen länger anzeigen (6 Sekunden), Fehlermeldungen kürzer (4 Sekunden)
      const displayTime = success ? 6000 : 4000;
      console.log(
        `⏰ Meldung wird für ${displayTime / 1000}s angezeigt:`,
        success || error
      );

      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
        console.log("💫 Meldung ausgeblendet");
      }, displayTime);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Hilfsfunktion: Anzahl der Tage berechnen
  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    return (
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
    );
  };

  // Zeit/Tag sperren
  const handleBlock = async () => {
    console.log("🔧 DEBUG: handleBlock gestartet", {
      blockType,
      selectedDate,
      startDate,
      endDate,
      startTime,
      endTime,
      reason: reason.trim(),
      userUid: currentUser?.uid,
      user: currentUser ? "vorhanden" : "nicht vorhanden",
      isUserLoading,
    });

    // Prüfe User-Authentifizierung
    if (isUserLoading) {
      setError("⏳ Benutzer wird geladen, bitte warten...");
      return;
    }

    if (!currentUser?.uid) {
      setError(
        "❌ Benutzer nicht authentifiziert. Bitte laden Sie die Seite neu."
      );
      console.error("❌ Kein currentUser.uid vorhanden:", currentUser);
      return;
    }

    // Prüfe Grund
    if (!reason.trim()) {
      setError("❌ Bitte geben Sie einen Grund für die Sperrung an");
      return;
    }

    // Validierung je nach Sperrungstyp
    if (blockType === "date-range") {
      if (!startDate) {
        setError("❌ Bitte wählen Sie ein Startdatum aus");
        return;
      }
      if (!endDate) {
        setError("❌ Bitte wählen Sie ein Enddatum aus");
        return;
      }

      // Zusätzliche Validierung für Datumsbereich
      if (new Date(startDate) > new Date(endDate)) {
        setError("❌ Startdatum muss vor oder gleich dem Enddatum liegen");
        return;
      }

      const dayCount = calculateDays(startDate, endDate);
      if (dayCount > 365) {
        setError("❌ Maximal 365 Tage können gleichzeitig gesperrt werden");
        return;
      }

      // Bestätigung für längere Zeiträume
      if (dayCount > 30) {
        const confirmed = window.confirm(
          `Möchten Sie wirklich ${dayCount} Tage sperren? (${startDate} bis ${endDate})`
        );
        if (!confirmed) return;
      }
    } else if (blockType === "time-range") {
      if (!selectedDate) {
        setError("❌ Bitte wählen Sie ein Datum aus");
        return;
      }
      if (!startTime) {
        setError("❌ Bitte wählen Sie eine Startzeit aus");
        return;
      }
      if (!endTime) {
        setError("❌ Bitte wählen Sie eine Endzeit aus");
        return;
      }
    } else {
      // full-day
      if (!selectedDate) {
        setError("❌ Bitte wählen Sie ein Datum aus");
        return;
      }
    }

    console.log("✅ Alle Validierungen bestanden, starte Sperrung...");

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      let result;
      console.log("🚀 Führe Sperrung aus...", blockType);

      if (blockType === "full-day") {
        console.log("📅 Sperre ganzen Tag:", selectedDate);
        result = await blockFullDay(
          selectedDate,
          reason.trim(),
          currentUser.uid
        );
      } else if (blockType === "date-range") {
        console.log("🏖️ Sperre Datumsbereich:", startDate, "bis", endDate);
        result = await blockDateRange(
          startDate,
          endDate,
          reason.trim(),
          currentUser.uid
        );
      } else {
        // time-range - Validierung wurde bereits oben gemacht
        console.log(
          "⏰ Sperre Zeitbereich:",
          selectedDate,
          startTime,
          "-",
          endTime
        );
        result = await blockTimeRange(
          selectedDate,
          startTime,
          endTime,
          reason.trim(),
          currentUser.uid
        );
      }

      console.log("📋 Sperrung-Ergebnis:", result);

      if (result.success) {
        let successMessage = "";
        if (blockType === "full-day") {
          successMessage = `✅ Ganzer Tag erfolgreich gesperrt: ${selectedDate}`;
        } else if (blockType === "date-range") {
          const dayCount = calculateDays(startDate, endDate);
          successMessage = `✅ ${dayCount} Tage erfolgreich gesperrt: ${startDate} bis ${endDate}`;
        } else {
          successMessage = `✅ Zeitraum erfolgreich gesperrt: ${selectedDate} von ${startTime} bis ${endTime} Uhr`;
        }

        // Verwende immer die success message, oder result.error für teilweise Erfolge
        const finalMessage = result.error || successMessage;
        setSuccess(finalMessage);
        console.log("🎉 Erfolgsmeldung gesetzt:", finalMessage);

        // Form zurücksetzen
        setSelectedDate("");
        setStartDate("");
        setEndDate("");
        setReason("");
        setStartTime("09:00");
        setEndTime("18:00");

        // Aktualisiere Liste
        console.log("🔄 Lade gesperrte Zeiten neu...");
        await loadBlockedTimes();
        console.log("✅ Liste wurde aktualisiert");
      } else {
        const errorMessage =
          result.error || "❌ Unbekannter Fehler beim Sperren";
        setError(errorMessage);
        console.error("❌ Sperrung fehlgeschlagen:", errorMessage);
      }
    } catch (error) {
      console.error("Fehler beim Sperren:", error);
      setError("Ein unerwarteter Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

  // Sperrung aufheben
  const handleUnblock = async (blockId: string) => {
    if (!window.confirm("Möchten Sie diese Sperrung wirklich aufheben?")) {
      return;
    }

    try {
      setIsLoading(true);
      const result = await unblockTime(blockId);

      if (result.success) {
        setSuccess("Sperrung erfolgreich aufgehoben");
        await loadBlockedTimes();
      } else {
        setError(result.error || "Fehler beim Aufheben der Sperrung");
      }
    } catch (error) {
      console.error("Fehler beim Aufheben der Sperrung:", error);
      setError("Ein unerwarteter Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

  // Bulk-Selection Funktionen
  const toggleBulkMode = () => {
    setIsBulkMode(!isBulkMode);
    setSelectedBlocks([]);
  };

  const toggleBlockSelection = (blockId: string) => {
    if (selectedBlocks.includes(blockId)) {
      setSelectedBlocks(selectedBlocks.filter((id) => id !== blockId));
    } else {
      setSelectedBlocks([...selectedBlocks, blockId]);
    }
  };

  const selectAllBlocks = () => {
    const allBlockIds = blockedTimes
      .map((block) => block.id)
      .filter(Boolean) as string[];
    setSelectedBlocks(allBlockIds);
  };

  const deselectAllBlocks = () => {
    setSelectedBlocks([]);
  };

  const handleBulkDelete = async () => {
    if (selectedBlocks.length === 0) {
      setError("Bitte wählen Sie mindestens eine Sperrung aus");
      return;
    }

    const confirmMessage = `Möchten Sie wirklich ${selectedBlocks.length} Sperrung(en) löschen?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const blockId of selectedBlocks) {
        try {
          const result = await unblockTime(blockId);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          console.error(`Fehler beim Löschen von Sperrung ${blockId}:`, error);
        }
      }

      if (successCount > 0) {
        setSuccess(
          `${successCount} Sperrung(en) erfolgreich gelöscht${errorCount > 0 ? `, ${errorCount} Fehler` : ""}`
        );
        await loadBlockedTimes();
        setSelectedBlocks([]);

        // Bulk-Modus verlassen wenn alle Sperrungen gelöscht wurden
        if (blockedTimes.length === selectedBlocks.length) {
          setIsBulkMode(false);
        }
      } else {
        setError(`Fehler beim Löschen von ${errorCount} Sperrung(en)`);
      }
    } catch (error) {
      console.error("Fehler beim Bulk-Löschen:", error);
      setError("Ein unerwarteter Fehler beim Löschen ist aufgetreten");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Mindestdatum (heute)
  const today = new Date().toISOString().split("T")[0];

  // Zeige Ladeanzeige während User geladen wird
  if (isUserLoading) {
    return (
      <div className="admin-calendar-management">
        <div className="calendar-header">
          <h2>📅 Kalender-Verwaltung</h2>
          {onClose && (
            <button onClick={onClose} className="btn-close">
              ✕
            </button>
          )}
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>⏳ Lade Benutzerinformationen...</p>
        </div>
      </div>
    );
  }

  // Zeige Fehler wenn kein User nach dem Laden
  if (!currentUser) {
    return (
      <div className="admin-calendar-management">
        <div className="calendar-header">
          <h2>📅 Kalender-Verwaltung</h2>
          {onClose && (
            <button onClick={onClose} className="btn-close">
              ✕
            </button>
          )}
        </div>
        <div className="alert alert-error">
          ❌ Sie sind nicht angemeldet. Bitte laden Sie die Seite neu oder
          melden Sie sich erneut an.
        </div>
      </div>
    );
  }

  return (
    <div className="admin-calendar-management">
      <div className="calendar-header">
        <h2>📅 Kalender-Verwaltung</h2>
        {onClose && (
          <button onClick={onClose} className="btn-close">
            ✕
          </button>
        )}
      </div>

      {/* Debug-Informationen (nur bei Entwicklung) */}
      {process.env.NODE_ENV === "development" && (
        <div className="debug-info">
          <small>
            🔧 DEBUG: User:{" "}
            {isUserLoading
              ? "⏳ Lädt..."
              : currentUser?.uid
                ? "✅ Angemeldet"
                : "❌ Nicht angemeldet"}
            ({currentUser?.email || "Keine E-Mail"}) | Typ: {blockType} | Datum:{" "}
            {selectedDate || startDate || "❌"} | Grund: {reason.trim() || "❌"}
          </small>
        </div>
      )}

      {/* Fehlermeldungen */}
      {error && (
        <div
          className={`alert ${error.includes("Index") ? "alert-warning" : "alert-error"}`}
        >
          {error.includes("Index") ? "⚠️" : "❌"} {error}
        </div>
      )}

      {/* Erfolgsmeldungen */}
      {success && <div className="alert alert-success">🎉 {success}</div>}

      {/* Neue Sperrung erstellen */}
      <div className="block-form">
        <h3>🚫 Neue Sperrung erstellen</h3>

        {(blockType === "full-day" || blockType === "time-range") && (
          <div className="form-group">
            <label htmlFor="date">Datum:</label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              min={today}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input"
            />
          </div>
        )}

        {blockType === "date-range" && (
          <div className="date-range-inputs">
            <div className="date-range-header">
              <h4>📅 Datumsbereich auswählen</h4>
              <p className="help-text">
                Wählen Sie den ersten und letzten Tag des Zeitraums
              </p>
            </div>
            <div className="form-group">
              <label htmlFor="start-date">🗓️ Startdatum:</label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                min={today}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input"
                placeholder="Wählen Sie das Startdatum"
              />
            </div>
            <div className="form-group">
              <label htmlFor="end-date">🗓️ Enddatum:</label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                min={startDate || today}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input"
                placeholder="Wählen Sie das Enddatum"
              />
            </div>
            {startDate && endDate && (
              <div className="date-range-info">
                <span className="days-count">
                  📅 {calculateDays(startDate, endDate)} Tage werden gesperrt
                </span>
                <span className="date-preview">
                  {startDate} bis {endDate}
                </span>
                {calculateDays(startDate, endDate) > 30 && (
                  <span className="warning-text">
                    ⚠️ Längerer Zeitraum - Bestätigung erforderlich
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="form-group">
          <label>Sperrungstyp:</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                value="full-day"
                checked={blockType === "full-day"}
                onChange={(e) =>
                  setBlockType(
                    e.target.value as "full-day" | "time-range" | "date-range"
                  )
                }
              />
              <div className="radio-content">
                <span className="radio-title">📅 Einzelner Tag</span>
                <span className="radio-desc">Einen kompletten Tag sperren</span>
              </div>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                value="date-range"
                checked={blockType === "date-range"}
                onChange={(e) =>
                  setBlockType(
                    e.target.value as "full-day" | "time-range" | "date-range"
                  )
                }
              />
              <div className="radio-content">
                <span className="radio-title">🏖️ Mehrere Tage</span>
                <span className="radio-desc">
                  Von Datum bis Datum (z.B. Urlaub)
                </span>
              </div>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                value="time-range"
                checked={blockType === "time-range"}
                onChange={(e) =>
                  setBlockType(
                    e.target.value as "full-day" | "time-range" | "date-range"
                  )
                }
              />
              <div className="radio-content">
                <span className="radio-title">⏰ Bestimmte Uhrzeiten</span>
                <span className="radio-desc">
                  Nur bestimmte Stunden an einem Tag
                </span>
              </div>
            </label>
          </div>
        </div>

        {blockType === "time-range" && (
          <div className="time-range-inputs">
            <div className="time-range-header">
              <h4>⏰ Uhrzeiten auswählen</h4>
              <p className="help-text">
                Wählen Sie den Zeitraum für die Sperrung
              </p>
            </div>
            <div className="form-group">
              <label htmlFor="start-time">🕐 Von Uhrzeit:</label>
              <select
                id="start-time"
                value={startTime || "09:00"}
                onChange={(e) => setStartTime(e.target.value)}
                className="form-select"
              >
                <option value="" disabled>
                  Startzeit auswählen...
                </option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time} Uhr
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="end-time">🕐 Bis Uhrzeit:</label>
              <select
                id="end-time"
                value={endTime || "18:00"}
                onChange={(e) => setEndTime(e.target.value)}
                className="form-select"
              >
                <option value="" disabled>
                  Endzeit auswählen...
                </option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time} Uhr
                  </option>
                ))}
              </select>
            </div>
            {startTime && endTime && (
              <div className="time-range-info">
                <span className="time-preview">
                  ⏰ Sperrung: {startTime} - {endTime} Uhr
                </span>
              </div>
            )}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="reason">Grund:</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="form-select"
          >
            <option value="">Grund auswählen...</option>
            {predefinedReasons.map((predefined) => (
              <option key={predefined} value={predefined}>
                {predefined}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Oder eigenen Grund eingeben..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="form-input mt-2"
          />
        </div>

        <button
          onClick={handleBlock}
          disabled={
            isLoading ||
            !reason.trim() ||
            (blockType === "date-range"
              ? !startDate || !endDate
              : !selectedDate)
          }
          className="btn-block"
        >
          {isLoading
            ? "⏳ Sperrung wird erstellt..."
            : blockType === "date-range"
              ? `🚫 ${startDate && endDate ? calculateDays(startDate, endDate) + " Tage" : "Tage"} sperren`
              : "🚫 Zeit sperren"}
        </button>
      </div>

      {/* Liste der gesperrten Zeiten */}
      <div className="blocked-times-list">
        <div className="blocked-times-header">
          <h3>🚫 Aktuelle Sperrungen ({blockedTimes.length})</h3>

          {blockedTimes.length > 0 && (
            <div className="bulk-controls">
              <button
                onClick={toggleBulkMode}
                className={`btn-bulk-toggle ${isBulkMode ? "active" : ""}`}
              >
                {isBulkMode ? "✕ Auswahl beenden" : "☑️ Mehrfach auswählen"}
              </button>

              {isBulkMode && (
                <>
                  <button
                    onClick={selectAllBlocks}
                    className="btn-bulk-action"
                    disabled={selectedBlocks.length === blockedTimes.length}
                  >
                    ✅ Alle auswählen
                  </button>
                  <button
                    onClick={deselectAllBlocks}
                    className="btn-bulk-action"
                    disabled={selectedBlocks.length === 0}
                  >
                    ❌ Alle abwählen
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="btn-bulk-delete"
                    disabled={selectedBlocks.length === 0 || isBulkDeleting}
                  >
                    {isBulkDeleting
                      ? "⏳ Lösche..."
                      : `🗑️ ${selectedBlocks.length} löschen`}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {isLoading && blockedTimes.length === 0 ? (
          <div className="loading">Lade gesperrte Zeiten...</div>
        ) : blockedTimes.length === 0 ? (
          <div className="no-blocks">
            {error?.includes("Index") ? (
              <div>
                <p>⚠️ Firebase Index wird erstellt</p>
                <small>
                  Die Liste wird in wenigen Minuten verfügbar sein. Sperrungen
                  funktionieren bereits!
                </small>
              </div>
            ) : (
              "Keine Sperrungen vorhanden"
            )}
          </div>
        ) : (
          <div className="blocks-grid">
            {blockedTimes.map((block) => (
              <div
                key={block.id}
                className={`block-item ${isBulkMode && selectedBlocks.includes(block.id || "") ? "selected" : ""}`}
              >
                <div className="block-header">
                  {isBulkMode && (
                    <div className="checkbox-container">
                      <input
                        type="checkbox"
                        id={`block-${block.id}`}
                        checked={selectedBlocks.includes(block.id || "")}
                        onChange={() =>
                          block.id && toggleBlockSelection(block.id)
                        }
                        className="block-checkbox"
                      />
                      <label
                        htmlFor={`block-${block.id}`}
                        className="checkbox-label"
                      ></label>
                    </div>
                  )}
                  <span className="block-date">
                    📅 {formatDateForDisplay(block.date)}
                  </span>
                  {!isBulkMode && (
                    <button
                      onClick={() => block.id && handleUnblock(block.id)}
                      className="btn-unblock"
                      title="Sperrung aufheben"
                    >
                      ❌
                    </button>
                  )}
                </div>
                <div className="block-time">
                  {block.isFullDay ? (
                    <span className="full-day">🚫 Ganzer Tag</span>
                  ) : (
                    <span className="time-range">
                      ⏰ {block.startTime} - {block.endTime}
                    </span>
                  )}
                </div>
                <div className="block-reason">💬 {block.reason}</div>
                <div className="block-meta">
                  Erstellt:{" "}
                  {block.createdAt.toDate().toLocaleDateString("de-DE")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-calendar-management {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e5e7eb;
        }

        .calendar-header h2 {
          margin: 0;
          color: #1f2937;
          font-size: 1.8rem;
        }

        .btn-close {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          cursor: pointer;
          font-size: 1.2rem;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .debug-info {
          padding: 8px 12px;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          margin-bottom: 15px;
          font-family: monospace;
          font-size: 12px;
          color: #6b7280;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .alert-error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .alert-warning {
          background: #fffbeb;
          color: #d97706;
          border: 1px solid #fed7aa;
        }

        .alert-success {
          background: #f0fdf4;
          color: #16a34a;
          border: 2px solid #22c55e;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
          font-weight: 600;
          animation: successFadeIn 0.3s ease-out;
        }

        @keyframes successFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .block-form {
          background: #f9fafb;
          padding: 25px;
          border-radius: 10px;
          margin-bottom: 30px;
        }

        .block-form h3 {
          margin: 0 0 20px 0;
          color: #374151;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 600;
          color: #374151;
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .radio-group {
          display: flex;
          gap: 20px;
        }

        .radio-label {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          font-weight: normal;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          transition: all 0.2s;
          margin-bottom: 8px;
        }

        .radio-label:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .radio-label input[type="radio"]:checked + .radio-content {
          color: #1e40af;
        }

        .radio-label input[type="radio"]:checked {
          accent-color: #3b82f6;
        }

        .radio-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .radio-title {
          font-weight: 600;
          font-size: 14px;
        }

        .radio-desc {
          font-size: 12px;
          color: #6b7280;
          font-style: italic;
        }

        .time-range-inputs {
          margin-bottom: 20px;
        }

        .time-range-header {
          margin-bottom: 15px;
          padding: 15px;
          background: #fef3f2;
          border: 1px solid #fed7d7;
          border-radius: 8px;
        }

        .time-range-header h4 {
          margin: 0 0 8px 0;
          color: #1e293b;
          font-size: 16px;
        }

        .time-range-inputs .form-group {
          display: inline-block;
          width: calc(50% - 10px);
          margin-right: 20px;
          vertical-align: top;
        }

        .time-range-inputs .form-group:last-of-type {
          margin-right: 0;
        }

        .time-range-info {
          margin-top: 15px;
          padding: 12px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 6px;
          text-align: center;
        }

        .time-preview {
          color: #ea580c;
          font-weight: 600;
          font-size: 14px;
        }

        .date-range-inputs {
          margin-bottom: 20px;
        }

        .date-range-header {
          grid-column: 1 / -1;
          margin-bottom: 15px;
          padding: 15px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }

        .date-range-header h4 {
          margin: 0 0 8px 0;
          color: #1e293b;
          font-size: 16px;
        }

        .help-text {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          font-style: italic;
        }

        .date-range-inputs .form-group {
          display: inline-block;
          width: calc(50% - 10px);
          margin-right: 20px;
          vertical-align: top;
        }

        .date-range-inputs .form-group:last-of-type {
          margin-right: 0;
        }

        .date-range-info {
          margin-top: 15px;
          padding: 15px;
          background: #f0f9ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          text-align: center;
        }

        .days-count {
          display: block;
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 8px;
          font-size: 16px;
        }

        .date-preview {
          display: block;
          color: #374151;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .warning-text {
          display: block;
          font-size: 12px;
          color: #d97706;
          font-weight: 500;
        }

        .btn-block {
          background: #dc2626;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.2s;
        }

        .btn-block:hover:not(:disabled) {
          background: #b91c1c;
        }

        .btn-block:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .blocked-times-list h3 {
          color: #374151;
          margin-bottom: 20px;
        }

        .blocks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 15px;
        }

        .block-item {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          transition: box-shadow 0.2s;
        }

        .block-item:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .block-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .block-date {
          font-weight: 600;
          color: #1f2937;
        }

        .btn-unblock {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .btn-unblock:hover {
          background: #fee2e2;
        }

        .block-time {
          margin-bottom: 8px;
        }

        .full-day {
          color: #dc2626;
          font-weight: 600;
        }

        .time-range {
          color: #059669;
          font-weight: 600;
        }

        .block-reason {
          color: #6b7280;
          margin-bottom: 8px;
        }

        .block-meta {
          font-size: 12px;
          color: #9ca3af;
        }

        .loading,
        .no-blocks {
          text-align: center;
          color: #6b7280;
          padding: 40px;
          font-style: italic;
        }

        .mt-2 {
          margin-top: 8px;
        }

        /* Bulk-Selection Styles */
        .blocked-times-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .bulk-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn-bulk-toggle {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }

        .btn-bulk-toggle:hover {
          background: #e5e7eb;
        }

        .btn-bulk-toggle.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .btn-bulk-action {
          background: #f9fafb;
          border: 1px solid #d1d5db;
          color: #6b7280;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-bulk-action:hover:not(:disabled) {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-bulk-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-bulk-delete {
          background: #dc2626;
          border: 1px solid #dc2626;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }

        .btn-bulk-delete:hover:not(:disabled) {
          background: #b91c1c;
          border-color: #b91c1c;
        }

        .btn-bulk-delete:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .block-item.selected {
          border-color: #3b82f6;
          background: #eff6ff;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .checkbox-container {
          position: relative;
          margin-right: 12px;
        }

        .block-checkbox {
          width: 18px;
          height: 18px;
          accent-color: #3b82f6;
          cursor: pointer;
        }

        .checkbox-label {
          cursor: pointer;
        }

        .block-header {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }

        .block-date {
          flex: 1;
          font-weight: 600;
          color: #1f2937;
        }

        @media (max-width: 768px) {
          .blocked-times-header {
            flex-direction: column;
            align-items: stretch;
          }

          .bulk-controls {
            justify-content: center;
          }
          .radio-group {
            flex-direction: column;
            gap: 8px;
          }

          .time-range-inputs .form-group {
            width: 100%;
            margin-right: 0;
            margin-bottom: 15px;
          }

          .date-range-inputs .form-group {
            width: 100%;
            margin-right: 0;
            margin-bottom: 15px;
          }

          .blocks-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
