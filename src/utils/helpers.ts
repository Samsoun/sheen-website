/**
 * Formatiert einen Betrag als Euro-Währung
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Formatiert ein Datum in deutsches Format
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Konvertiert eine Minutenanzahl in ein lesbares Zeitformat
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} Min.`;
  } else if (mins === 0) {
    return `${hours} Std.`;
  } else {
    return `${hours} Std. ${mins} Min.`;
  }
}

/**
 * Validiert eine E-Mail-Adresse
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validiert eine Telefonnummer (deutsche Format)
 */
export function isValidPhone(phone: string): boolean {
  // Einfache Validierung für deutsche Telefonnummern
  // Akzeptiert verschiedene Formate wie 0177 12345678, +49 177 12345678, etc.
  const phoneRegex = /^(\+49|0)[0-9 ]{6,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Fügt führende Nullen zu einer Zahl hinzu (für Zeit/Datum-Formatierung)
 */
export function padZero(num: number): string {
  return num.toString().padStart(2, '0');
}
