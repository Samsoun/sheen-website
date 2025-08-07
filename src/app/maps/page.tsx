'use client';

import { useEffect } from 'react';
import Link from 'next/link';

const MapsPage = () => {
  useEffect(() => {
    // Öffne Google Maps sofort in einem neuen Tab
    window.open('https://www.google.com/maps/search/Sheen+Berlin+Kurfürstendamm+180', '_blank');
  }, []);

  return (
    <div className="maps-container">
      <div className="maps-header">
        <Link href="/" className="back-btn">
          <ion-icon name="arrow-back-outline"></ion-icon>
          <span className="back-btn-text">Back to Homepage</span>
        </Link>
      </div>

      <div className="maps-content">
        <p>Google Maps should be opening in a new tab...</p>
        <p>
          If it doesn't open automatically,{' '}
          <a
            href="https://www.google.com/maps/search/Sheen+Berlin+Kurfürstendamm+180"
            target="_blank"
            rel="noopener noreferrer"
          >
            click here
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default MapsPage;
