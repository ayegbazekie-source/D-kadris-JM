export type ImageSize = 'small' | 'medium' | 'large' | { width: number; height: number };

export type ProductCategory = 'men' | 'women' | 'unisex' | 'jeans' | 'shorts' | 'jackets' | 'custom';

export interface Product {
  id: string;
  name: string;
  price: number;
  category?: ProductCategory; // Deprecated, but keeping for migration safety
  categories: ProductCategory[];
  type: string;
  image: string;
  imageSize?: ImageSize;
  orderIndex?: number;
  quantity?: number;
  whitelisted: boolean;
  published: boolean;
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
  commissionAmount?: number;
  commissionRate?: number;
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

export interface FeatureToggles {
  enablePayments: boolean;
  enableVendorAccounts: boolean;
  enableBulkOrders: boolean;
  enableCommissions: boolean;
  enableAffiliateWithdrawals: boolean;
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  image: string;
  layoutType: 'standard' | 'bold' | 'wide' | 'tall';
  order: number;
  visibility: boolean;
}

export interface GalleryConfig {
  layout: 'grid' | 'carousel' | 'asymmetric';
  columns: 2 | 3 | 4;
  displayCount: number;
  visible: boolean;
}

export interface SiteConfig {
  logoText: string;
  logoType: 'text' | 'image';
  logoImage?: string;
  logoWidth?: number;
  logoHeight?: number;
  heroTitle: string;
  heroSubtitle: string;
  heroBgType: 'url' | 'upload';
  heroBgUrl: string;
  heroBgUpload?: string;
  shopButtonText: string;
  brandQuote: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  footerContent: string;
  contactEmail: string;
  contactPhone: string;
  featureToggles: FeatureToggles;
  featuredFits: GalleryItem[];
  galleryLayoutStyle: 'grid' | 'carousel' | 'asymmetric';
  gallerySpacing: number;
  galleryColumns: number;
  isMaintenance: boolean;
}

export interface AppConfig {
  catalogs: Product[];
  siteSettings: SiteConfig;
}

export interface AppData {
  draft: AppConfig;
  live: AppConfig;
}
