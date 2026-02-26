import { Order, Affiliate, SiteConfig, FeatureToggles } from '../types';

const KEYS = {
  ORDERS: 'dkadris_orders',
  AFFILIATES: 'dkadris_affiliates',
  ADMIN_AUTH: 'dkadris_admin_auth',
  SITE_CONFIG: 'dkadris_site_config',
  MAINTENANCE: 'dkadris_maintenance'
};

const safeParse = <T>(value: string | null, fallback: T): T => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (err) {
    console.error('Storage parse error:', err);
    return fallback;
  }
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
  contactPhone: '+2348163914835', // ✅ updated
  footerContent: "Premium denim, crafted in Nigeria, worn by the world.", // ✅ updated
  featureToggles: DEFAULT_TOGGLES
};

const notify = () => {
  window.dispatchEvent(new CustomEvent('dkadris_storage_update'));
};

export const storage = {
  // ---------------- ORDERS ----------------
  getOrders: (): Order[] => safeParse<Order[]>(localStorage.getItem(KEYS.ORDERS), []),
  setOrders: (orders: Order[]) => {
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
    notify();
  },

  // ---------------- AFFILIATES ----------------
  getAffiliates: (): Affiliate[] => {
    const data = safeParse<any>(localStorage.getItem(KEYS.AFFILIATES), []);
    if (data && typeof data === 'object' && !Array.isArray(data)) return Object.values(data);
    return Array.isArray(data) ? data : [];
  },
  setAffiliates: (affiliates: Affiliate[]) => {
    localStorage.setItem(KEYS.AFFILIATES, JSON.stringify(affiliates));
    notify();
  },

  // ---------------- MAINTENANCE ----------------
  getMaintenance: (): boolean => safeParse<boolean>(localStorage.getItem(KEYS.MAINTENANCE), false),
  setMaintenance: (status: boolean) => {
    localStorage.setItem(KEYS.MAINTENANCE, JSON.stringify(status));
    notify();
  },

  // ---------------- SITE CONFIG ----------------
  getSiteConfig: (): SiteConfig => {
    const saved = safeParse<Partial<SiteConfig>>(localStorage.getItem(KEYS.SITE_CONFIG), {});
    return {
      ...DEFAULT_CONFIG,
      ...saved,
      featureToggles: {
        ...DEFAULT_TOGGLES,
        ...saved.featureToggles
      }
    };
  }, // ✅ COMMA FIXED
  setSiteConfig: (config: SiteConfig) => {
    localStorage.setItem(KEYS.SITE_CONFIG, JSON.stringify(config));
    notify();
  }
};
