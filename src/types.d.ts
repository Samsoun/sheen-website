/// <reference types="react" />
/// <reference types="react-dom" />

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// Buchungssystem Typdefinitionen
interface Treatment {
  id: string;
  name: string;
  description: string;
  duration: number; // Dauer in Minuten
  price: number;
  category: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  message?: string;
}

interface BookingData {
  id?: string;
  treatments: Treatment[];
  date: string;
  time: string;
  duration: number;
  totalPrice: number;
  customer: CustomerInfo;
  status: 'pending' | 'confirmed' | 'canceled';
  createdAt?: string;
}
