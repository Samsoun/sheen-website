import type { Metadata } from 'next';
import { ReactNode } from 'react';
import '@/styles/booking.css';

export const metadata: Metadata = {
  title: 'Termin Buchen | Sheen Berlin',
  description:
    'Buchen Sie Ihren Termin für Microblading, Lash Lifting und andere Beauty-Behandlungen bei Sheen Berlin.',
};

export default function BookingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
