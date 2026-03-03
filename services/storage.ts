import { Order, Affiliate, SiteConfig, FeatureToggles } from '../types';

const KEYS = {
  ORDERS: 'dkadris_orders',
  AFFILIATES: 'dkadris_affiliates',
  ADMIN_AUTH: 'dkadris_admin_auth',
  SITE_CONFIG: 'dkadris_site_config'
};

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
  contactEmail: 'dkadristailoringservice@gmail.com',
  contactPhone: '+234 816 391 4835',
  footerContent: 'Premium denim, crafted in Nigeria, worn by the world.',
  featureToggles: DEFAULT_TOGGLES,
  featuredFits: [],
  galleryLayoutStyle: 'grid',
  gallerySpacing: 4,
  galleryColumns: 3,
  isMaintenance: false
};

// Helper to notify other components of state changes
const notify = () => {
  window.dispatchEvent(new CustomEvent('dkadris_storage_update'));
};

export const storage = {
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
