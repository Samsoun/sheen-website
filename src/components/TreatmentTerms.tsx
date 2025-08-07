'use client';

import React, { useState } from 'react';
import '@/styles/booking.css';

// Import behandlungsspezifische Bedingungen
import { treatmentTerms } from '../utils/treatmentData';

interface TreatmentTermsProps {
  selectedTreatments: {
    id: string;
    name: string;
    duration: number;
    price: number;
  }[];
  onBack: () => void;
  onContinue: () => void;
}

export default function TreatmentTerms({
  selectedTreatments,
  onBack,
  onContinue,
}: TreatmentTermsProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Finde die passenden Bedingungen für alle ausgewählten Behandlungen
  const getTermsContent = () => {
    // Wenn keine Behandlungen ausgewählt wurden, zeige die Standard-Bedingungen an
    if (!selectedTreatments || selectedTreatments.length === 0) {
      return treatmentTerms.default;
    }

    // Sammle alle eindeutigen Bedingungen für die ausgewählten Behandlungen
    const uniqueTermContents = new Set<string>();
    const processedTypes = new Set<string>();

    selectedTreatments.forEach((treatment) => {
      let termsContent = '';
      const id = treatment.id;

      // Überprüfe, ob wir diese Art von Behandlung bereits verarbeitet haben
      if (processedTypes.has(id)) {
        return;
      }

      // Bestimme den Behandlungstyp
      if (id === 'microblading' || id === 'lipblush' || id === 'eyeliner') {
        if (!processedTypes.has('pmu')) {
          termsContent = treatmentTerms.pmu;
          processedTypes.add('pmu');
        }
      } else if (id === 'lash-lifting') {
        if (!processedTypes.has('lash-lifting')) {
          termsContent = treatmentTerms['lash-lifting'];
          processedTypes.add('lash-lifting');
        }
      } else if (id === 'browlifting') {
        if (!processedTypes.has('browlifting')) {
          termsContent = treatmentTerms.browlifting;
          processedTypes.add('browlifting');
        }
      } else if (id === 'microneedling') {
        if (!processedTypes.has('microneedling')) {
          termsContent = treatmentTerms.microneedling;
          processedTypes.add('microneedling');
        }
      } else {
        // Für sonstige Behandlungen, nur einmal die Standard-Bedingungen hinzufügen
        if (!processedTypes.has('default')) {
          termsContent = treatmentTerms.default;
          processedTypes.add('default');
        }
      }

      // Füge die Bedingungen zur Menge hinzu, wenn sie nicht leer sind
      if (termsContent) {
        uniqueTermContents.add(termsContent);
      }
    });

    // Verwende die Standard-Bedingungen, wenn keine spezifischen gefunden wurden
    if (uniqueTermContents.size === 0) {
      return treatmentTerms.default;
    }

    // Kombiniere alle einzigartigen Bedingungen zu einem HTML-String
    return Array.from(uniqueTermContents).join('<hr class="terms-divider" />');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (termsAccepted) {
      onContinue();
    }
  };

  return (
    <div className="treatment-terms-container">
      <h3 className="heading-tertiary">Behandlungsbedingungen</h3>
      <p className="booking-step-description">
        Bitte lesen und bestätigen Sie die folgenden Informationen zu Ihren gewählten Behandlungen:
      </p>

      <div className="terms-content" dangerouslySetInnerHTML={{ __html: getTermsContent() }} />

      <form onSubmit={handleSubmit} className="terms-form">
        <div className="form-group checkbox-group">
          <input
            type="checkbox"
            id="accept-terms"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="form-checkbox"
          />
          <label htmlFor="accept-terms" className="checkbox-label">
            Ich habe die Behandlungsbedingungen gelesen und verstanden *
          </label>
        </div>

        {!termsAccepted && (
          <p className="terms-hint">
            Bitte bestätigen Sie die Behandlungsbedingungen, um fortzufahren.
          </p>
        )}

        <div className="form-actions">
          <button type="button" onClick={onBack} className="btn btn-secondary">
            Zurück
          </button>
          <button type="submit" className="btn btn-primary" disabled={!termsAccepted}>
            Weiter
          </button>
        </div>
      </form>
    </div>
  );
}
