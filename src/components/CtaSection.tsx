'use client';

import { useState } from 'react';

interface CtaSectionProps {
  onSuccessfulSubmit: () => void;
}

const CtaSection = ({ onSuccessfulSubmit }: CtaSectionProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Hier würde die tatsächliche Formularverarbeitung stattfinden
    // z.B. mit fetch an eine API oder mit einem Service wie Netlify Forms

    // Dummy-Erfolgsfall
    console.log('Form submitted:', formData);
    onSuccessfulSubmit();

    // Formular zurücksetzen
    setFormData({
      name: '',
      email: '',
      message: '',
    });
  };

  return (
    <section className="section section-cta" id="cta">
      <div className="container">
        <div className="cta">
          <div className="cta-text-box">
            <h2 className="heading-secondary">Contact Us</h2>
            <p className="cta-text">
              Have questions or want to book an appointment? Send us a message!
            </p>
            <form
              className="cta-form"
              name="contact"
              method="POST"
              onSubmit={handleSubmit}
              id="contact-form"
            >
              <input type="hidden" name="form-name" value="contact" />
              <input type="hidden" name="subject" value="New message from website contact form" />

              <div>
                <label htmlFor="full-name">Name</label>
                <input
                  id="full-name"
                  type="text"
                  placeholder="Your Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-message">
                <label htmlFor="message">Your Message</label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Write your message here..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn btn--form">
                Send Message
              </button>
            </form>
          </div>
          <div className="cta-img-box" role="img" aria-label="Woman with beautiful eyes"></div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
