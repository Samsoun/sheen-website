import { generateAllTimeSlots } from './timeSlotUtils';

// Die Zeitslots mit 15-Minuten-Intervallen (9:00 Uhr bis 18:00 Uhr)
export const availableTimeSlots = generateAllTimeSlots().map((time) => ({
  time,
  duration: 120, // Standard-Dauer pro Slot (kann angepasst werden)
  daysAvailable: [1, 2, 3, 4, 5, 6], // Mo-Sa verfügbar
}));

// Behandlungstypen
export const treatments = [
  {
    id: 'browlifting',
    name: 'Browlifting',
    category: 'Augenbrauen',
    description:
      'Ein Lifting für Ihre Augenbrauen, bei dem wir in mehreren Schritten Ihre Härchen nach oben formen und fixieren. Das Ergebnis sind wundervolle, offene Augen und definierte Augenbrauen für bis zu 8 Wochen!',
    duration: 75, // Dauer in Minuten
    price: 65,
    image: '/img/Services/browlifting.jpg',
  },
  {
    id: 'browdesign',
    name: 'Brow Design',
    category: 'Augenbrauen',
    description:
      'Beim Brow Design werden Ihre Augenbrauen professionell gezupft und in Form gebracht. Wir arbeiten nach den individuellen Gesichtsproportionen für ein perfektes und natürliches Ergebnis.',
    duration: 30,
    price: 25,
    image: '/img/Services/browdesign.jpg',
  },
  {
    id: 'lashlifting',
    name: 'Lash Lifting',
    category: 'Wimpern',
    description:
      'Beim Lash Lifting verwenden wir eine spezielle Technik, um Ihren natürlichen Wimpern mehr Schwung und Länge zu verleihen. Genießen Sie bis zu 8 Wochen lang wunderschön geschwungene Wimpern!',
    duration: 60,
    price: 65,
    image: '/img/Services/lashlifting.jpg',
  },
  {
    id: 'lipblush',
    name: 'LipBlush',
    category: 'Lippen',
    description:
      'Eine semipermanente Pigmentierung der Lippen, die Ihnen voller aussehende, natürlich schöne Lippen verleiht. Die Farbe wird individuell auf Ihren Hautton abgestimmt.',
    duration: 120,
    price: 350,
    image: '/img/Services/lipblush.jpg',
  },
  {
    id: 'microblading',
    name: 'Microblading',
    category: 'Augenbrauen',
    description:
      'Microblading ist eine semipermanente Pigmentierungstechnik, bei der mit feinen Nadeln haardünne Striche in die Haut gezeichnet werden. Die Augenbrauen wirken natürlich, definiert und ausdrucksstark.',
    duration: 120,
    price: 350,
    image: '/img/Services/microblading.jpg',
  },
  {
    id: 'eyeliner',
    name: 'Eyeliner',
    category: 'Augen',
    description:
      'Permanenter Eyeliner für einen dauerhaft definierten Blick. Der Farbverlauf wird individuell an Ihre Augenform angepasst und betont auf natürliche Weise Ihre Augen.',
    duration: 120,
    price: 350,
    image: '/img/Services/eyeliner.jpg',
  },
  {
    id: 'microneedling',
    name: 'Microneedling',
    category: 'Haut',
    description:
      'Microneedling ist ein Verfahren, bei dem kleine Nadeln die Haut oberflächlich perforieren, um die Kollagenproduktion anzuregen. Dadurch wird die Hautstruktur verbessert und Falten reduziert.',
    duration: 60,
    price: 149,
    image: '/img/Services/microneedeling.jpg',
  },
];

// Kategorie-Labels
export const categoryLabels = {
  Augenbrauen: 'Augenbrauen',
  Wimpern: 'Wimpern',
  Lippen: 'Lippen',
  Augen: 'Augen',
  Haut: 'Haut',
};

// Beispiel für fiktive, bereits gebuchte Termine
export const mockBookedSlots = [
  { date: '2023-12-10', time: '10:00', duration: 75 },
  { date: '2023-12-10', time: '14:30', duration: 120 },
  { date: '2023-12-11', time: '11:15', duration: 60 },
  { date: '2023-12-12', time: '09:00', duration: 120 },
];

// Simuliere die Verfügbarkeitsprüfung mit bereits gebuchten Terminen
export const checkTimeSlotAvailability = (
  date: string,
  time: string,
  duration: number
): boolean => {
  // Überprüfe, ob der Zeitslot bereits gebucht ist
  const startMinutes = timeToMinutes(time);
  const endMinutes = startMinutes + duration;

  return !mockBookedSlots.some((slot) => {
    if (slot.date !== date) return false;

    const bookedStartMinutes = timeToMinutes(slot.time);
    const bookedEndMinutes = bookedStartMinutes + slot.duration;

    // Überlappungsprüfung
    return (
      (startMinutes >= bookedStartMinutes && startMinutes < bookedEndMinutes) ||
      (endMinutes > bookedStartMinutes && endMinutes <= bookedEndMinutes) ||
      (startMinutes <= bookedStartMinutes && endMinutes >= bookedEndMinutes)
    );
  });
};

// Hilfsfunktion zum Konvertieren einer Zeitstring in Minuten
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Interface für eine Buchung
interface BookingData {
  id?: string;
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
  duration: number;
  message?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
  createdAt?: Date;
}

// Mock-Funktion zum Speichern einer Buchung
// Diese Funktion wird durch die tatsächliche Firebase-Implementation in bookingService.ts ersetzt
export const saveBooking = async (
  bookingData: BookingData
): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    // Firebase ist nicht in dieser Entwicklungsumgebung verfügbar, simulieren wir die Anfrage
    // In einer echten Produktionsumgebung würde hier der Aufruf an bookingService erfolgen
    console.log('Simuliere Buchungsspeicherung mit Daten:', bookingData);

    // Simuliere eine Verzögerung von 1 Sekunde
    return new Promise((resolve) => {
      setTimeout(() => {
        // 90% Chance auf Erfolg (in einer echten Anwendung würden hier tatsächliche API-Anfragen stattfinden)
        if (Math.random() > 0.1) {
          const bookingId = Math.random().toString(36).substring(2, 10);

          // Füge den Termin zur Liste der gebuchten Termine hinzu (nur für Mock-Zwecke)
          mockBookedSlots.push({
            date: bookingData.date,
            time: bookingData.time,
            duration: bookingData.duration,
          });

          resolve({
            success: true,
            id: bookingId,
          });
        } else {
          resolve({
            success: false,
            error:
              'Der ausgewählte Termin ist nicht mehr verfügbar. Bitte wählen Sie einen anderen Termin.',
          });
        }
      }, 1000);
    });
  } catch (error) {
    return {
      success: false,
      error: 'Ein unerwarteter Fehler ist aufgetreten.',
    };
  }
};
