'use client';

import { useState } from 'react';

const CTASection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Hier den Code für das Absenden des Formulars einfügen
  };

  return (
    <section className="section-cta" id="contact">
      <div className="container">
        <div className="cta">
          <div className="cta-text-box">
            <h2 className="heading-secondary">Contact Us</h2>
            <p className="cta-text">
              Have questions or want to book an appointment? Send us a message!
            </p>

            <form className="cta-form" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="full-name">Name</label>
                <input id="full-name" type="text" placeholder="Your Name" required />
              </div>

              <div>
                <label htmlFor="email">Email Address</label>
                <input id="email" type="email" placeholder="your@email.com" required />
              </div>

              <div className="cta-form-message">
                <label htmlFor="message">Your Message</label>
                <textarea id="message" placeholder="Write your message here..." required></textarea>
              </div>

              <button type="submit">Send Message</button>
            </form>
          </div>
          <div className="cta-img-box" role="img" aria-label="Shadi, the owner"></div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
