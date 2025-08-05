import React, { useState, useEffect } from "react";
import Image from "next/image";
import { sendContactFormEmail } from "@/utils/emailService";

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    message: "",
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Client-side only code
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verhindere mehrfaches Absenden
    if (isSubmitting) return;

    setIsSubmitting(true);
    setShowErrorMessage(false);

    try {
      console.log("📧 Sende Kontaktformular...", formData);

      const emailSent = await sendContactFormEmail(formData);

      if (emailSent) {
        console.log("📧 E-Mail-Client erfolgreich geöffnet!");

        // Form zurücksetzen
        setFormData({
          name: "",
          email: "",
          message: "",
        });

        // Erfolgsrückmeldung anzeigen
        setShowSuccessMessage(true);

        // Nach 7 Sekunden Erfolgsmeldung ausblenden
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 7000);
      } else {
        console.error("📧 E-Mail-Client konnte nicht geöffnet werden");
        setShowErrorMessage(true);

        // Fehlermeldung nach 5 Sekunden ausblenden
        setTimeout(() => {
          setShowErrorMessage(false);
        }, 5000);
      }
    } catch (error) {
      console.error("📧 Fehler beim Senden der E-Mail:", error);
      setShowErrorMessage(true);

      setTimeout(() => {
        setShowErrorMessage(false);
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="section-contact" id="contact">
      <div className="contact-container">
        <div className="contact-form-side">
          <h2 className="contact-heading">Contact Us</h2>
          <p className="contact-description">
            Have questions or want to book an appointment? Send us a message!
          </p>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="name" className="form-label">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="message" className="form-label">
                Your Message
              </label>
              <textarea
                id="message"
                name="message"
                className="form-textarea"
                placeholder="Write your message here..."
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <button type="submit" className="btn-form" disabled={isSubmitting}>
              {isSubmitting ? "📧 Öffne E-Mail..." : "Send Message"}
            </button>

            {isMounted && showSuccessMessage && (
              <div className="success-message">
                ✅ Ihr E-Mail-Client wurde geöffnet! Bitte senden Sie die
                vorausgefüllte E-Mail an nesa.afshari@web.de ab.
              </div>
            )}

            {isMounted && showErrorMessage && (
              <div className="error-message">
                ❌ E-Mail-Client konnte nicht geöffnet werden. Bitte senden Sie
                eine E-Mail direkt an: <strong>nesa.afshari@web.de</strong>
              </div>
            )}
          </form>
        </div>

        <div className="contact-image-side">
          {isMounted ? (
            <Image
              src="/img/shadi.jpg"
              alt="Shadi Beauty"
              className="contact-image"
              width={500}
              height={600}
              priority
            />
          ) : (
            <div className="contact-image-placeholder"></div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
