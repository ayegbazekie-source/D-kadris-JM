
export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'men' | 'women';
  type: string;
  image: string;
  quantity?: number;
  whitelisted: boolean;
  createdAt: number;
}

export interface Measurements {
  shoulder?: string;
  chest?: string;
  sleeve?: string;
  waist?: string;
  thigh?: string;
  hip?: string;
  length: string;
}

export interface Order {
  id: string;
  productName: string;
  productType: string;
  quantity: number;
  measurements: Measurements;
  timestamp: number;
  customerEmail: string;
  referrerCode?: string;
  status: 'pending' | 'paid' | 'delivered';
  total: number;
  paymentRef?: string;
}

export interface Affiliate {
  name: string;
  email: string;
  password?: string;
  code: string;
  referrerCode?: string;
  referredAffiliates: { name: string; email: string; bonusEligible: boolean }[];
  orders: string[]; // Order IDs
  commission: number;
  verified?: boolean;
  payoutThresholdReached?: boolean;
}

export interface PayoutRequest {
  id: string;
  affiliateEmail: string;
  affiliateName: string;
  amount: number;
  status: 'pending' | 'eligible' | 'approved' | 'paid' | 'rejected';
  requestDate: number;
  payoutDate?: number;
  history: { status: string; date: number; actor: 'admin' | 'system' }[];
}

export interface FeaturedFit {
  id: string;
  title: string;
  description: string;
  image: string;
  layoutType: 'bold' | 'wide' | 'tall' | 'standard';
}

export interface FeatureToggles {
  enablePayments: boolean;
  enableVendorAccounts: boolean;
  enableBulkOrders: boolean;
  enableCommissions: boolean;
  enableAffiliateWithdrawals: boolean;
}

export interface SiteConfig {
  logoText: string;
  logoType: 'text' | 'image';
  logoImage?: string; // Base64
  heroTitle: string;
  heroSubtitle: string;
  heroBgType: 'url' | 'upload';
  heroBgUrl: string;
  heroBgUpload?: string; // Base64
  shopButtonText: string;
  brandQuote: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  featuredFits: FeaturedFit[];
  featureToggles: FeatureToggles;
}
