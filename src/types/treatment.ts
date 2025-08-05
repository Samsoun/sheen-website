export interface Treatment {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  category?: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
