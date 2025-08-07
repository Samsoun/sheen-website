import React, { ReactNode } from 'react';

// Typdefinition für die Behandlungsbedingungen
type TreatmentTermsType = {
  [key: string]: ReactNode;
};

// Behandlungsspezifische Bedingungen für die verschiedenen Services
export const treatmentTerms: Record<string, string> = {
  // Permanent Make-up Texte für: microblading, lipblush, eyeliner
  pmu: `
    <h4>Permanent Make-up – PMU (Augenbrauen, Lippen, Eyeliner)</h4>
    <p><strong>Nicht geeignet für:</strong></p>
    <ul>
      <li>Schwangere oder stillende Personen</li>
      <li>Personen mit aktiven Hautkrankheiten im Behandlungsbereich</li>
      <li>Personen mit Blutgerinnungsstörungen oder Einnahme blutverdünnender Medikamente</li>
    </ul>
    <p><strong>24 Stunden vor der Behandlung:</strong></p>
    <ul>
      <li>Kein Kaffee, Alkohol oder blutverdünnende Medikamente (z. B. Aspirin) einnehmen.</li>
    </ul>
    <p><strong>7 Tage vor der Behandlung:</strong></p>
    <ul>
      <li>Keine Botox- oder Filler-Behandlungen im Behandlungsbereich.</li>
    </ul>
    <p><strong>Bei Lippen-PMU:</strong></p>
    <ul>
      <li>Falls Sie zu Herpes neigen, empfehlen wir eine Prophylaxe vor der Behandlung.</li>
      <li>Falls Ihre Lippen trocken sind, führen Sie bitte 1–2 Tage vor der Behandlung ein sanftes Peeling durch und verwenden Sie eine feuchtigkeitsspendende Lippenpflege.</li>
    </ul>
    <p><strong>Wichtiger Hinweis:</strong></p>
    <ul>
      <li>Die behandelte Stelle darf für 48 Stunden nicht mit Wasser in Kontakt kommen. Bitte planen Sie Ihre Haarwäsche oder Dusche entsprechend im Voraus.</li>
    </ul>
  `,

  // Lash Lifting
  'lash-lifting': `
    <h4>Lash Lifting – Wimpernlifting</h4>
    <ul>
      <li>Bitte kommen Sie ungeschminkt zur Behandlung.</li>
      <li>Hormonelle Schwankungen (z. B. Periode, Schwangerschaft, Stillzeit) können das Ergebnis beeinflussen.</li>
      <li>Verwenden Sie 24 Stunden vor der Behandlung keine ölhaltigen Produkte auf den Wimpern.</li>
      <li>Falls Sie empfindliche Augen oder Allergien haben, teilen Sie uns dies bitte im Voraus mit.</li>
      <li>Tragen Sie keine Kontaktlinsen während der Behandlung. Bitte entfernen Sie Ihre Linsen vorher oder bringen Sie Ihr Etui und Pflegemittel mit.</li>
    </ul>
  `,

  // Brow Lifting
  browlifting: `
    <h4>Brow Lifting – Augenbrauenlifting</h4>
    <ul>
      <li>Bitte kommen Sie ohne Make-up an den Augenbrauen.</li>
      <li>Die Haut sollte frei von Irritationen, Wunden oder Sonnenbrand sein.</li>
      <li>Hormonelle Veränderungen können das Ergebnis beeinflussen.</li>
      <li>48 Stunden vor der Behandlung kein Peeling oder starkes Reiben der Brauenhaut.</li>
    </ul>
  `,

  // Microneedling
  microneedling: `
    <h4>Microneedling</h4>
    <p><strong>Nicht geeignet für:</strong></p>
    <ul>
      <li>Schwangere oder stillende Personen</li>
      <li>Personen mit aktiven Hautinfektionen, Ekzemen oder offenen Wunden im Behandlungsbereich</li>
      <li>Personen mit Blutgerinnungsstörungen oder Einnahme blutverdünnender Medikamente</li>
      <li>Personen mit Neigung zu Keloiden oder hypertrophen Narben</li>
    </ul>
    <p><strong>7 Tage vor der Behandlung:</strong></p>
    <ul>
      <li>Keine Botox-, Filler- oder chemische Peeling-Behandlungen.</li>
    </ul>
    <p><strong>24 Stunden vor der Behandlung:</strong></p>
    <ul>
      <li>Kein Alkohol, Koffein oder blutverdünnende Medikamente (z. B. Aspirin) einnehmen.</li>
      <li>Kein intensives Sonnenbaden oder Solarium.</li>
    </ul>
    <p><strong>Wichtiger Hinweis:</strong></p>
    <ul>
      <li>Bitte kommen Sie mit gereinigter Haut und ohne Make-up zur Behandlung.</li>
      <li>Nach der Behandlung kann die Haut leicht gerötet sein – dies ist normal und klingt in der Regel innerhalb von 24–48 Stunden ab.</li>
      <li>Planen Sie Ihre Termine so, dass Sie nach der Behandlung mindestens 48 Stunden lang kein Make-up auftragen müssen.</li>
    </ul>
  `,

  // Standardtext für Behandlungen ohne spezielle Bedingungen
  default: `
    <h4>Behandlungsinformationen</h4>
    <p>Für diese Behandlung gibt es keine speziellen Vorbereitungen oder Einschränkungen.</p>
    <p>Für ein optimales Ergebnis empfehlen wir jedoch:</p>
    <ul>
      <li>Kommen Sie entspannt und ausgeruht zur Behandlung</li>
      <li>Trinken Sie ausreichend Wasser vor Ihrem Termin</li>
      <li>Informieren Sie uns über eventuelle Allergien oder Hautempfindlichkeiten</li>
    </ul>
    <p>Bei Fragen oder Unsicherheiten kontaktieren Sie uns gerne vor Ihrem Termin unter: <strong>kontakt@sheenberlin.de</strong></p>
  `,
};
