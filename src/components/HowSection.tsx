"use client";

import Image from "next/image";

const HowSection = () => {
  return (
    <section className="section section-how" id="app">
      <div className="container">
        <span className="subheading">
          NEW! Our App is here!
          <span className="new-tag">NOW AVAILABLE</span>
        </span>
        <h2 className="heading-secondary">
          Download Our App and Book with Ease!
        </h2>
        <div className="app-download-container">
          <p className="app-description">
            Our brand new app is now available! Book your appointments quickly
            and easily, receive exclusive offers, and stay informed about the
            latest trends - all in one app.
          </p>

          {/* App Store Buttons */}
          <div className="store-buttons">
            <div className="store-button-container">
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="store-btn"
              >
                <Image
                  src="/img/logos/app-store-badge.svg"
                  alt="Download on the App Store"
                  width={160}
                  height={48}
                  className="store-logo"
                />
              </a>
              <div className="qr-code-container">
                <Image
                  src="/img/app/iosqr.png"
                  alt="QR Code für iOS App"
                  width={80}
                  height={80}
                  className="qr-code"
                />
              </div>
            </div>
            <div className="store-button-container">
              <a
                href="https://play.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="store-btn"
              >
                <Image
                  src="/img/logos/google-play-badge.png"
                  alt="Get it on Google Play"
                  width={160}
                  height={48}
                  className="store-logo google-play"
                />
              </a>
              <div className="coming-soon">Coming Soon</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container grid grid--2-cols grid--center-v">
        {/* STEP 01 */}
        <div className="step-text-box">
          <p className="step-number">01</p>
          <h3 className="heading-tertiary" style={{ color: "#333" }}>
            Find Your Perfect Treatment
          </h3>
          <p className="step-description" style={{ color: "#333" }}>
            Browse our extensive range of beauty treatments, from permanent
            makeup to skincare. Choose the treatment that best suits your needs.
          </p>
        </div>
        <div className="step-img-box">
          <Image
            src="/img/app/sheenapp1.png"
            className="step-img"
            alt="iphone app sheen app home screen"
            width={250}
            height={500}
          />
        </div>

        {/* STEP 02 */}
        <div className="step-img-box">
          <Image
            src="/img/app/sheenapp3.png"
            className="step-img"
            alt="iphone app sheen app treatment screen"
            width={250}
            height={500}
          />
        </div>
        <div className="step-text-box">
          <p className="step-number">02</p>
          <h3 className="heading-tertiary">Select Your Perfect Match</h3>
          <p className="step-description">
            Explore the diverse treatment menu and find what excites you. Tap on
            a treatment to learn more about it and view available appointment
            times.
          </p>
        </div>

        {/* STEP 03 */}
        <div className="step-text-box">
          <p className="step-number">03</p>
          <h3 className="heading-tertiary">Book with Ease</h3>
          <p className="step-description">
            Once you've chosen your treatment, select a date and time that suits
            you best from the available slots. Booking is quick and easy, so you
            can secure your beauty appointment in moments.
          </p>
        </div>
        <div className="step-img-box">
          <Image
            src="/img/app/sheenapp2.png"
            className="step-img"
            alt="iphone app sheen app booking calender"
            width={250}
            height={500}
          />
        </div>
      </div>
    </section>
  );
};

export default HowSection;
