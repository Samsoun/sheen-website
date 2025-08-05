'use client';

import CustomerProfile from '@/components/CustomerProfile';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ProfilePage() {
  return (
    <>
      <Header />

      <main className="main">
        <section className="section-profile py-12 md:py-20">
          <div className="container">
            <div className="profile-header mb-8 text-center">
              <h1 className="heading-primary mb-4">Mein Profil</h1>
              <p className="text-gray-600 mb-8">
                Verwalten Sie Ihre persönlichen Daten und sehen Sie Ihre Buchungen.
              </p>
            </div>
            <CustomerProfile />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
