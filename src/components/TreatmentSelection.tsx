'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { treatments, categoryLabels } from '@/utils/mockData';
import { calculatePriceComponents } from '@/utils/priceUtils';
import '@/styles/booking.css';

interface TreatmentSelectionProps {
  selectedTreatments: {
    id: string;
    name: string;
    duration: number;
    price: number;
  }[];
  toggleTreatment: (treatment: {
    id: string;
    name: string;
    duration: number;
    price: number;
  }) => void;
  onContinue: () => void;
}

export default function TreatmentSelection({
  selectedTreatments,
  toggleTreatment,
  onContinue,
}: TreatmentSelectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filteredTreatments, setFilteredTreatments] = useState(treatments);
  const [showPriceDetails, setShowPriceDetails] = useState<{ [key: string]: boolean }>({});

  // Behandlungen nach Kategorie filtern
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredTreatments(treatments);
    } else {
      setFilteredTreatments(
        treatments.filter((treatment) => treatment.category === selectedCategory)
      );
    }
  }, [selectedCategory]);

  // Prüfen, ob eine Behandlung ausgewählt ist
  const isTreatmentSelected = (id: string) => {
    return selectedTreatments.some((treatment) => treatment.id === id);
  };

  // Gesamtdauer der ausgewählten Behandlungen berechnen
  const totalDuration = selectedTreatments.reduce((sum, treatment) => sum + treatment.duration, 0);

  // Gesamtpreis der ausgewählten Behandlungen berechnen
  const totalPrice = selectedTreatments.reduce((sum, treatment) => sum + treatment.price, 0);

  // Preiskomponenten für den Gesamtpreis
  const totalPriceComponents = calculatePriceComponents(totalPrice);

  // Toggle für Preisdetails
  const togglePriceDetails = (id: string) => {
    setShowPriceDetails((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Prüfen, ob Weitergehen möglich ist
  const canContinue = selectedTreatments.length > 0;

  // Liste der verfügbaren Kategorien direkt aus den Behandlungsdaten extrahieren
  const uniqueCategories = Array.from(new Set(treatments.map((treatment) => treatment.category)));

  return (
    <div className="treatments-container">
      <h3 className="heading-tertiary">Behandlungen</h3>
      <p className="booking-step-description">
        Wählen Sie eine oder mehrere Behandlungen aus, die Sie buchen möchten.
      </p>

      {/* Kategorien-Tabs */}
      <div className="category-tabs">
        <button
          key="all"
          className={`category-tab ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          Alle
        </button>

        {uniqueCategories.map((category) => (
          <button
            key={category}
            className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Behandlungen */}
      <div className="treatments-grid">
        {filteredTreatments.map((treatment) => {
          const isSelected = isTreatmentSelected(treatment.id);
          // Verwende die Bildpfade aus den Daten
          const imagePath = treatment.image;
          // Preiskomponenten berechnen
          const priceComponents = calculatePriceComponents(treatment.price);
          // Überprüfen, ob Preisdetails angezeigt werden sollen
          const showDetails = showPriceDetails[treatment.id] || false;

          return (
            <div key={treatment.id} className={`treatment-card ${isSelected ? 'selected' : ''}`}>
              <div
                className="treatment-image"
                onClick={() =>
                  toggleTreatment({
                    id: treatment.id,
                    name: treatment.name,
                    duration: treatment.duration,
                    price: treatment.price,
                  })
                }
              >
                <Image
                  src={imagePath}
                  alt={treatment.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  style={{ objectFit: 'cover' }}
                  onError={(e) => {
                    // Fallback, falls das Bild nicht geladen werden kann
                    const target = e.target as HTMLImageElement;
                    target.src = `https://via.placeholder.com/400x250/b2d8db/333333?text=${encodeURIComponent(treatment.name)}`;
                  }}
                />
                {isSelected && <div className="selected-overlay">✓</div>}
              </div>
              <div
                className="treatment-info"
                onClick={() =>
                  toggleTreatment({
                    id: treatment.id,
                    name: treatment.name,
                    duration: treatment.duration,
                    price: treatment.price,
                  })
                }
              >
                <h4 className="treatment-name">{treatment.name}</h4>
                <p className="treatment-description">{treatment.description}</p>
                <div className="treatment-meta">
                  <span className="treatment-duration">{treatment.duration} Min.</span>
                  <div className="treatment-price-container">
                    <span className="treatment-price">{priceComponents.grossFormatted}</span>
                    <button
                      className="price-details-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePriceDetails(treatment.id);
                      }}
                    >
                      {showDetails ? '▲' : '▼'}
                    </button>
                  </div>
                </div>
                {showDetails && (
                  <div className="price-breakdown" onClick={(e) => e.stopPropagation()}>
                    <div className="price-row">
                      <span>Netto:</span>
                      <span>{priceComponents.netFormatted}</span>
                    </div>
                    <div className="price-row">
                      <span>MwSt (19%):</span>
                      <span>{priceComponents.vatFormatted}</span>
                    </div>
                    <div className="price-row">
                      <span>Brutto:</span>
                      <span>{priceComponents.grossFormatted}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Zusammenfassung */}
      {selectedTreatments.length > 0 && (
        <div className="treatment-summary">
          <h4 className="summary-title">Ihre Auswahl</h4>
          <div className="summary-items">
            {selectedTreatments.map((treatment) => {
              const priceComponents = calculatePriceComponents(treatment.price);
              return (
                <div key={treatment.id} className="summary-item">
                  <span>{treatment.name}</span>
                  <span>{priceComponents.grossFormatted}</span>
                </div>
              );
            })}
          </div>
          <div className="price-breakdown-summary">
            <div className="price-row">
              <span>Netto-Gesamt:</span>
              <span>{totalPriceComponents.netFormatted}</span>
            </div>
            <div className="price-row">
              <span>MwSt (19%):</span>
              <span>{totalPriceComponents.vatFormatted}</span>
            </div>
            <div className="summary-total">
              <span>Brutto-Gesamtpreis:</span>
              <span>{totalPriceComponents.grossFormatted}</span>
            </div>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          onClick={onContinue}
          className="btn btn-primary"
          disabled={!canContinue}
        >
          Weiter
        </button>
      </div>
    </div>
  );
}
