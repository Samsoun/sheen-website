import Image from 'next/image';

const FeaturedSection = () => {
  return (
    <section className="section section-featured" id="featured">
      <div className="container">
        <h2 className="heading-featured-in">As featured in</h2>
        <div className="logos">
          <Image src="/img/logos/treatwell.png" alt="Treatwell logo" width={140} height={50} />
          <Image src="/img/logos/google.png" alt="Google logo" width={140} height={50} />
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;
