/**
 * Hilfsfunktionen für Preisberechnungen
 */

// MwSt-Satz für Schönheitsbehandlungen in Deutschland (19%)
export const VAT_RATE = 0.19;

/**
 * Berechnet den Nettopreis aus einem Bruttopreis
 * @param grossPrice Bruttopreis (inkl. MwSt)
 * @returns Nettopreis (ohne MwSt)
 */
export const calculateNetPrice = (grossPrice: number): number => {
  return grossPrice / (1 + VAT_RATE);
};

/**
 * Berechnet die MwSt aus einem Bruttopreis
 * @param grossPrice Bruttopreis (inkl. MwSt)
 * @returns MwSt-Betrag
 */
export const calculateVAT = (grossPrice: number): number => {
  return grossPrice - calculateNetPrice(grossPrice);
};

/**
 * Formatiert einen Preis als Euro-Betrag mit 2 Nachkommastellen
 * @param price Preis als Zahl
 * @returns Formatierter Preis mit €-Symbol
 */
export const formatPrice = (price: number): string => {
  return `${price.toFixed(2)} €`;
};

/**
 * Berechnet alle Preiskomponenten (Brutto, Netto, MwSt)
 * @param grossPrice Bruttopreis (inkl. MwSt)
 * @returns Objekt mit Brutto-, Netto- und MwSt-Beträgen
 */
export const calculatePriceComponents = (grossPrice: number) => {
  const netPrice = calculateNetPrice(grossPrice);
  const vat = calculateVAT(grossPrice);

  return {
    gross: grossPrice,
    net: netPrice,
    vat: vat,
    grossFormatted: formatPrice(grossPrice),
    netFormatted: formatPrice(netPrice),
    vatFormatted: formatPrice(vat),
  };
};
