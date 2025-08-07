/**
 * Hilfsfunktionen für die Speicherung und das Abrufen von Buchungsdaten zwischen Komponenten
 */

import { Treatment } from '@/types/treatment';

/**
 * Speichert die Behandlungen im Session Storage
 * @param treatments - Die Behandlungen
 */
export const storeTreatmentsForBooking = (treatments: Treatment[]) => {
  try {
    // Speichere im Session Storage für die aktuelle Sitzung
    sessionStorage.setItem('bookingTreatments', JSON.stringify(treatments));

    // Speichere auch im Local Storage für persistentes Speichern als Backup
    localStorage.setItem('bookingTreatments', JSON.stringify(treatments));

    console.log('Behandlungen gespeichert:', treatments);
    return true;
  } catch (error) {
    console.error('Fehler beim Speichern der Behandlungen:', error);
    return false;
  }
};

/**
 * Ruft die Behandlungen aus allen verfügbaren Speicherorten ab
 * @returns Die Behandlungen oder ein leeres Array, wenn keine vorhanden sind
 */
export const getTreatmentsFromStorage = (): Treatment[] => {
  try {
    // Versuche zuerst aus dem Session Storage zu laden
    const sessionTreatments = sessionStorage.getItem('bookingTreatments');
    if (sessionTreatments) {
      return JSON.parse(sessionTreatments);
    }

    // Falls nicht im Session Storage, versuche Local Storage
    const localTreatments = localStorage.getItem('bookingTreatments');
    if (localTreatments) {
      return JSON.parse(localTreatments);
    }

    console.log('Keine gespeicherten Behandlungen gefunden');
    return [];
  } catch (error) {
    console.error('Fehler beim Laden der Behandlungen:', error);
    return [];
  }
};
