
import { Product, Order, Affiliate, SiteConfig, FeaturedFit, FeatureToggles } from '../types';
import { INITIAL_PRODUCTS } from '../constants';

const KEYS = {
  PRODUCTS: 'dkadris_products',
  ORDERS: 'dkadris_orders',
  AFFILIATES: 'dkadris_affiliates',
  ADMIN_AUTH: 'dkadris_admin_auth',
  SITE_CONFIG: 'dkadris_site_config'
};

const DEFAULT_FEATURED_FITS: FeaturedFit[] = [
  {
    id: 'f1',
    title: 'Savanna Bootcut',
    description: 'The ultimate classic for any occasion.',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1000&auto=format&fit=crop',
    layoutType: 'bold'
  },
  {
    id: 'f2',
    title: 'Lagos Slim Fit',
    description: 'Precision cut for the modern urban dweller.',
    image: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800&auto=format&fit=crop',
    layoutType: 'tall'
  },
  {
    id: 'f3',
    title: 'Signature Stitch',
    description: 'Our premium artisanal denim line.',
    image: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=800&auto=format&fit=crop',
    layoutType: 'standard'
  }
];

const DEFAULT_TOGGLES: FeatureToggles = {
  enablePayments: false,
  enableVendorAccounts: false,
  enableBulkOrders: false,
  enableCommissions: false,
  enableAffiliateWithdrawals: false
};

const DEFAULT_CONFIG: SiteConfig = {
  logoText: 'D-Kadris',
  logoType: 'text',
  heroTitle: 'Authentic Denim.\nTailored in Nigeria.\nWorn by You.',
  heroSubtitle: 'Premium jeans crafted with pride.',
  heroBgType: 'url',
  heroBgUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=2000&auto=format&fit=crop',
  shopButtonText: 'Shop Collection',
  brandQuote: '"Every stitch tells a story of Nigerian craftsmanship."',
  facebookUrl: 'https://www.facebook.com/profile.php?id=61559673571368',
  instagramUrl: 'https://www.instagram.com/dkadris_tailoring?igsh=MW1jM2xud2Y1YW1xdw==',
  tiktokUrl: 'https://www.tiktok.com/@dkadris.tailoring?_r=1&_t=ZS-93ZAREPRK4L',
  featuredFits: DEFAULT_FEATURED_FITS,
  featureToggles: DEFAULT_TOGGLES
};

// Helper to notify other components of state changes
const notify = () => {
  window.dispatchEvent(new CustomEvent('dkadris_storage_update'));
};

export const storage = {
  getProducts: (): Product[] => {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    const products = data ? JSON.parse(data) : INITIAL_PRODUCTS;
    return products.map((p: any) => ({
      ...p,
      whitelisted: p.whitelisted ?? true,
      createdAt: p.createdAt ?? Date.now()
    }));
  },
  setProducts: (products: Product[]) => {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    notify();
  },
  getOrders: (): Order[] => {
    const data = localStorage.getItem(KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  },
  setOrders: (orders: Order[]) => {
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
    notify();
  },
  getAffiliates: (): Record<string, Affiliate> => {
    const data = localStorage.getItem(KEYS.AFFILIATES);
    return data ? JSON.parse(data) : {};
  },
  setAffiliates: (affiliates: Record<string, Affiliate>) => {
    localStorage.setItem(KEYS.AFFILIATES, JSON.stringify(affiliates));
    notify();
  },
  getMaintenance: (): boolean => {
    return localStorage.getItem('maintenance') === 'true';
  },
  setMaintenance: (status: boolean) => {
    localStorage.setItem('maintenance', String(status));
    notify();
  },
  getSiteConfig: (): SiteConfig => {
    const data = localStorage.getItem(KEYS.SITE_CONFIG);
    return data ? JSON.parse(data) : DEFAULT_CONFIG;
  },
  setSiteConfig: (config: SiteConfig) => {
    localStorage.setItem(KEYS.SITE_CONFIG, JSON.stringify(config));
    notify();
  }
};
