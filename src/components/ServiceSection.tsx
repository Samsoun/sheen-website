"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface ServiceDescriptionProps {
  title: string;
  description: string;
}

interface ServiceSectionProps {
  onOpenModal: (title: string, description: string) => void;
}

const ServiceSection = ({ onOpenModal }: ServiceSectionProps) => {
  // Service-Daten
  const services = [
    {
      id: "browlifting",
      title: "Browlifting",
      image: "/img/Services/browlifting.jpg",
      duration: "75 min",
      price: "79",
      description:
        "Browlifting is an innovative treatment that shapes your natural eyebrows and adds more volume. The treatment gently lifts the eyebrows and fixes them in the desired position. The result is a fresh, open look that lasts up to 6-8 weeks.",
    },
    {
      id: "brow-design",
      title: "Brow Design",
      image: "/img/Services/browdesign.jpg",
      duration: "20 min",
      price: "22",
      description:
        "Brow Design creates the perfect shape for your eyebrows through precise plucking, trimming, and tinting. We consider your natural brow shape and facial features to achieve a harmonious and natural result.",
    },
    {
      id: "lash-lifting",
      title: "Lash Lifting",
      image: "/img/Services/lashlifting.JPEG",
      duration: "60 min",
      price: "69",
      description:
        "Lash Lifting is a gentle method to give your natural lashes a dramatic curl. The treatment lifts the lashes from the root and provides an open, expressive look. The result lasts 6-8 weeks.",
    },
    {
      id: "lipblush",
      title: "LipBlush",
      image: "/img/Services/lipblush.jpg",
      duration: "180 min",
      price: "399",
      description:
        "LipBlush is a semi-permanent lip color that gives your lips a natural, even color and definition. The treatment can also balance minor asymmetries and make your lips appear fuller.",
    },
    {
      id: "microblading",
      title: "Microblading",
      image: "/img/Services/microblading.JPEG",
      duration: "180 min",
      price: "349",
      description:
        "Microblading is a precise technique for natural-looking eyebrows. Using a special blade, fine hair strokes are drawn into the top layer of skin. The result is defined, natural-looking eyebrows that last 1-3 years.",
    },
    {
      id: "eyeliner",
      title: "Eyeliner",
      image: "/img/Services/eyeliner.JPEG",
      duration: "180 min",
      price: "349",
      description:
        "Permanent Eyeliner emphasizes your eyes in a subtle or dramatic way - according to your preferences. The pigmentation is precisely worked along the lash line and lasts 3-5 years.",
    },
    {
      id: "microneedling",
      title: "Microneedling",
      image: "/img/Services/microneedeling.jpg",
      duration: "75 min",
      price: "149",
      description:
        "Microneedling is an effective treatment for skin improvement. Fine needles create microscopic channels in the skin that stimulate collagen production. Ideal for acne scars, fine lines, and general skin rejuvenation.",
    },
  ];

  const handleServiceDescriptionClick = (serviceId: string) => {
    // Finde den Service anhand der ID
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      onOpenModal(service.title, service.description);
    }
  };

  return (
    <section className="section section-service" id="service">
      <div className="container center-text">
        <span className="subheading">Services</span>
        <h2 className="heading-secondary">
          Smile Through Eyes with Our Signature Services
        </h2>
      </div>
      <div className="container grid grid--3-cols margin-right-md">
        {services.map((service, index) => (
          <div className="service" key={service.id}>
            <Image
              src={service.image}
              className="meal-img"
              alt={`${service.title} Service`}
              width={400}
              height={250}
              priority={index === 0} // Erstes Bild hat Priorität für LCP
            />
            <div className="service-content">
              <p className="service-title">{service.title}</p>
              <ul className="service-attributes">
                <li className="service-attribute">
                  <ion-icon
                    className="service-icon"
                    name="eye-outline"
                  ></ion-icon>
                  <span
                    className="service-description-link"
                    onClick={() => handleServiceDescriptionClick(service.id)}
                  >
                    Description
                  </span>
                </li>
                <li className="service-attribute">
                  <ion-icon
                    className="service-icon"
                    name="time-outline"
                  ></ion-icon>
                  <span>
                    Duration: <strong>{service.duration}</strong>
                  </span>
                </li>
                <li className="service-attribute">
                  <ion-icon
                    className="service-icon"
                    name="cash-outline"
                  ></ion-icon>
                  <span> Price:</span>
                  <span>€ {service.price}</span>
                </li>
              </ul>
              <Link href="/booking" className="btn-service">
                Book Now
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ServiceSection;
