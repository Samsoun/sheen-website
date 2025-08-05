"use client";

import Image from "next/image";
import Link from "next/link";

const HeroSection = () => {
  return (
    <section className="section section-hero">
      <div className="hero-static">
        {/* Static Hero Content - Previously Slide 1 */}
        <div className="hero-slide active">
          <div className="hero-text-box">
            <h1 className="heading-primary">
              <div className="hero-title-container">
                <span className="title-left">Enhance your</span>
                <div className="title-middle">
                  <span className="gradient-text">natural beauty</span>
                </div>
                <span className="title-right">with Sheen</span>
              </div>
            </h1>
            <p className="hero-description">
              Let your eyes shine with confidence and tell your story.
              <br />
              Book your appointment now and let your eyes shine with confidence!
            </p>
            <Link href="/booking" className="btn btn--full margin-right-sm">
              Book Now
            </Link>
            <a href="#service" className="btn btn--outline">
              Learn more &darr;
            </a>

            <div className="delivered-services">
              <div className="delivered-imgs">
                <Image
                  src="/img/customers/customer-1.jpg"
                  alt="customer photo"
                  width={45}
                  height={45}
                />
                <Image
                  src="/img/customers/human-1.jpg"
                  alt="customer photo"
                  width={45}
                  height={45}
                />
                <Image
                  src="/img/customers/customer-3.jpg"
                  alt="customer photo"
                  width={45}
                  height={45}
                />
                <Image
                  src="/img/customers/human-2.jpg"
                  alt="customer photo"
                  width={45}
                  height={45}
                />
                <Image
                  src="/img/customers/customer-5.jpg"
                  alt="customer photo"
                  width={45}
                  height={45}
                />
                <Image
                  src="/img/customers/customer-6.jpg"
                  alt="customer photo"
                  width={45}
                  height={45}
                />
              </div>
              <p className="delivered-text">
                <span>500+</span> beautified last year!
              </p>
            </div>
          </div>

          {/* Hero Image */}
          <div className="hero-img-box">
            <Image
              src="/img/models/model1.jpg"
              className="hero-img"
              alt="beautiful model with perfect makeup"
              style={{
                filter: "grayscale(5%) brightness(1.1) contrast(1.05)",
                aspectRatio: "16/9",
                objectFit: "cover",
                width: "100%",
                maskImage: `
                  radial-gradient(ellipse 120% 100% at 50% 50%, 
                    black 0%, 
                    black 60%, 
                    rgba(0,0,0,0.8) 75%, 
                    rgba(0,0,0,0.4) 90%, 
                    transparent 100%)
                `,
                WebkitMaskImage: `
                  radial-gradient(ellipse 120% 100% at 50% 50%, 
                    black 0%, 
                    black 60%, 
                    rgba(0,0,0,0.8) 75%, 
                    rgba(0,0,0,0.4) 90%, 
                    transparent 100%)
                `,
              }}
              width={1200}
              height={675}
              priority
            />
            <div className="hero-overlay"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
