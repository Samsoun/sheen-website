"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import FeaturedSection from "@/components/FeaturedSection";
import HowSection from "@/components/HowSection";
import PicturesSection from "@/components/PicturesSection";
import ServiceSection from "@/components/ServiceSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ContactSection from "@/components/ContactSection";

// Import anderer benötigter Komponenten...

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Service descriptions
  const serviceDescriptions = {
    browlifting: {
      title: "Browlifting",
      description:
        "Browlifting is a treatment that gives your eyebrows a natural lift. The treatment also includes eyebrow tinting and shaping.",
    },
    "brow-design": {
      title: "Brow Design",
      description:
        "Brow Design shapes your eyebrows perfectly to fit your face shape. The treatment includes plucking, trimming, and styling the eyebrows.",
    },
    // More service descriptions...
  };

  // Set isClient to true when component mounts on client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleOpenModal = (title: string, description: string) => {
    setModalTitle(title);
    setModalDescription(description);
    setModalOpen(true);
    // Prevent scrolling in the background
    if (typeof window !== "undefined") {
      document.body.style.overflow = "hidden";
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    // Allow scrolling again
    if (typeof window !== "undefined") {
      document.body.style.overflow = "";
    }
  };

  // ESC key to close modal
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalOpen) {
        handleCloseModal();
      }
    };

    if (typeof window !== "undefined") {
      document.addEventListener("keydown", handleEscKey);
      return () => {
        document.removeEventListener("keydown", handleEscKey);
      };
    }
  }, [modalOpen]);

  // Function that is called after successful form submission
  const handleSuccessfulSubmit = () => {
    setShowSuccessPopup(true);
  };

  return (
    <>
      <Header />

      <main>
        <HeroSection />
        <FeaturedSection />
        <HowSection />
        <PicturesSection />
        <ServiceSection onOpenModal={handleOpenModal} />
        <TestimonialsSection />
        <ContactSection />
      </main>

      <Footer />

      {/* Only render modals and popups on client side */}
      {isClient && (
        <>
          {showSuccessPopup && (
            <div id="success-popup" className="popup">
              <div className="popup-content">
                <h3>Message Sent Successfully!</h3>
                <p>
                  Thank you for contacting us. We will get back to you soon.
                </p>
                <button
                  className="btn btn--form"
                  onClick={() => setShowSuccessPopup(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {modalOpen && (
            <div className="service-modal-overlay" onClick={handleCloseModal}>
              <div
                className="service-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="close-modal" onClick={handleCloseModal}>
                  &times;
                </span>
                <h3 className="modal-title">{modalTitle}</h3>
                <p className="modal-description">{modalDescription}</p>
              </div>
            </div>
          )}

          {imageModalOpen && (
            <div id="imageModal" className="image-modal">
              <span
                className="close-image-modal"
                onClick={() => setImageModalOpen(false)}
              >
                &times;
              </span>
              <img
                className="modal-image"
                id="modalImage"
                src={currentImage}
                alt="Enlarged image"
              />
            </div>
          )}
        </>
      )}
    </>
  );
}
