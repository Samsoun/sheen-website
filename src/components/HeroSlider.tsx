'use client';

import { useState, useEffect } from 'react';

export default function HeroSlider() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hero-slider">
      {/* Slide 1 */}
      <div className={`hero-slide ${activeSlide === 0 ? 'active' : ''}`}>{/* Slide-Inhalt */}</div>

      {/* Weitere Slides */}

      {/* Navigation Dots */}
      <div className="hero-dots">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={`hero-dot ${activeSlide === index ? 'active' : ''}`}
            onClick={() => setActiveSlide(index)}
          ></span>
        ))}
      </div>
    </div>
  );
}
