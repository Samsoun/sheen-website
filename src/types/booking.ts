export interface BookingData {
  id?: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  message?: string;
  treatments: Treatment[];
  serviceName?: string;
  price: number;
  duration: number;
  status: string;
  userId?: string;
  customerId?: string;
  bookingGroupId?: string;
  isMultiBooking?: boolean;
  treatmentIndex?: number;
  totalTreatments?: number;
  createdAt?: any;
  termsAccepted?: boolean;
}
