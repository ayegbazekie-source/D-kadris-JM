
import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Savanna Bootcut',
    price: 15000,
    category: 'men',
    type: 'trouser',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop',
    quantity: 100,
    whitelisted: true,
    createdAt: 1672531200000
  },
  {
    id: '2',
    name: 'Lagos Slim Fit',
    price: 15000,
    category: 'women',
    type: 'shirt',
    image: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800&auto=format&fit=crop',
    quantity: 80,
    whitelisted: true,
    createdAt: 1672617600000
  },
  {
    id: '3',
    name: 'Signature Stitch',
    price: 18000,
    category: 'men',
    type: 'jacket',
    image: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=800&auto=format&fit=crop',
    quantity: 50,
    whitelisted: true,
    createdAt: 1672704000000
  }
];

export const MEASUREMENT_FIELDS = [
  'shoulder', 'chest', 'sleeve', 'waist', 'thigh', 'hip', 'length'
];

export const MOTIVATIONAL_MESSAGES = [
  "Excellence is stitched into every thread.",
  "Tailoring that fits your story.",
  "Premium denim crafted with pride.",
  "Your style, your perfect fit."
];
