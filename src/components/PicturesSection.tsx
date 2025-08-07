'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

const PicturesSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const images = [
    { src: '/img/brows/brow1.jpg', alt: 'Browlifting Ergebnis 1' },
    { src: '/img/brows/brow2.jpg', alt: 'Browlifting Ergebnis 2' },
    { src: '/img/brows/brow3.jpg', alt: 'Browlifting Ergebnis 3' },
    { src: '/img/brows/brow4.jpg', alt: 'Browlifting Ergebnis 4' },
    { src: '/img/brows/brow5.jpg', alt: 'Browlifting Ergebnis 5' },
    { src: '/img/brows/brow6.jpg', alt: 'Browlifting Ergebnis 6' },
    { src: '/img/brows/brow7.jpg', alt: 'Browlifting Ergebnis 7' },
    { src: '/img/brows/brow8.jpg', alt: 'Browlifting Ergebnis 8' },
  ];

  const openModal = (index: number) => {
    setModalImageIndex(index);
    setModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModalOpen(false);
    document.body.style.overflow = 'auto';
  };

  const nextImage = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const nextModalImage = () => {
    setModalImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevModalImage = () => {
    setModalImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalOpen) {
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowRight') nextModalImage();
        if (e.key === 'ArrowLeft') prevModalImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  // Automatisches Wechseln der Bilder
  useEffect(() => {
    const timer = setInterval(nextImage, 5000);
    return () => clearInterval(timer);
  }, []);

  // Bestimmen der Klassen für jedes Bild abhängig von seiner Position relativ zum aktiven Bild
  const getCarouselItemClass = (index: number) => {
    const diff = (index - activeIndex + images.length) % images.length;

    if (diff === 0) return 'carousel-item active';
    if (diff === 1 || diff === -4) return 'carousel-item next-1';
    if (diff === 2 || diff === -3) return 'carousel-item next-2';
    if (diff === images.length - 1 || diff === -1) return 'carousel-item prev-1';
    if (diff === images.length - 2 || diff === -2) return 'carousel-item prev-2';
    return 'carousel-item hidden';
  };

  return (
    <section className="section section-pictures" id="pictures">
      <div className="container center-text">
        <span className="subheading">Pictures</span>
      </div>

      {/* 3D Carousel Container */}
      <div className="carousel-container" ref={carouselRef}>
        <div className="carousel-wrapper">
          {images.map((image, index) => (
            <div key={index} className={getCarouselItemClass(index)}>
              <Image src={image.src} alt={image.alt} width={300} height={300} />
            </div>
          ))}
        </div>
      </div>

      {modalOpen && (
        <div className="picture-modal" onClick={closeModal}>
          <span className="modal-close" onClick={closeModal}>
            &times;
          </span>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[modalImageIndex].src}
              alt={images[modalImageIndex].alt}
              width={800}
              height={800}
              className="modal-image"
            />
            <button className="modal-prev" onClick={prevModalImage}>
              <ion-icon name="chevron-back-outline"></ion-icon>
            </button>
            <button className="modal-next" onClick={nextModalImage}>
              <ion-icon name="chevron-forward-outline"></ion-icon>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default PicturesSection;
