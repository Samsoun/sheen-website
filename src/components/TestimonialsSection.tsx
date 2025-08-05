"use client";

import Image from "next/image";

const TestimonialsSection = () => {
  const testimonials = [
    {
      text: "I had an amazing experience at Sheen Beautystudio! Shadi is a true artist who created perfectly natural-looking eyebrows that suit my face beautifully.",
      name: "Maryam Sadreddini",
      image: "/img/customers/maryam.png",
    },
    {
      text: "Sheen Beauty Studio amazed me with flawless microblading and quick service. Shadi's expertise and the elegant location made my experience outstanding.",
      name: "Leo Orta",
      image: "/img/customers/leo.png",
    },
    {
      text: "Very professional and a pleasant atmosphere. Super flexible and easy appointment booking. Thank you!",
      name: "Laura Kliche",
      image: "/img/customers/laura.png",
    },
    {
      text: "For me, the best studio for my eyebrows in Berlin. The owner is very knowledgeable and extremely friendly, and the prices are fair.",
      name: "Yana Kosturkova",
      image: "/img/customers/yana.png",
    },
  ];

  const galleryImages = [
    "auge.jpg",
    "lippe1.jpg",
    "augenbraue3.jpg",
    "auge1.jpg",
    "augenbraue1.jpg",
    "augenbraue2.jpg",
    "augemessen.jpg",
    "eyelash2.jpg",
    "eyelash3.jpg",
    "eyelash.jpg",
    "lash4.jpg",
    "lippe2.jpg",
  ];

  return (
    <section className="section section-testimonials" id="testimonials">
      <div className="testimonials-header">
        <span className="subheading">TESTIMONIALS</span>
      </div>

      <div className="testimonials-content">
        <div className="testimonials-container">
          <h2 className="heading-secondary">Sheen through their eyes</h2>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div className="testimonial-card" key={index}>
                <div className="testimonial-author-image">
                  <Image
                    className="testimonial-img"
                    src={testimonial.image}
                    alt={`Foto von ${testimonial.name}`}
                    width={64}
                    height={64}
                  />
                </div>
                <blockquote className="testimonial-text">
                  {testimonial.text}
                </blockquote>
                <p className="testimonial-name">&mdash; {testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="gallery">
          {galleryImages.map((imgName, index) => (
            <figure className="gallery-item" key={index}>
              <Image
                src={`/img/gallery/${imgName}`}
                alt={`Schönheitsstudio Galleriebild ${index + 1}`}
                width={400}
                height={400}
                style={{ objectFit: "cover" }}
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
