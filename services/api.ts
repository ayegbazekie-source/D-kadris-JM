import { Order, Affiliate, PayoutRequest } from '../types';

const BASE_URL = '/api';

let memoryToken: string | null = null;

async function request(endpoint: string, options: RequestInit = {}) {
  const token = memoryToken || localStorage.getItem('dkadris_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error || errorData.message || 'API request failed';
    throw new Error(message);
  }
  return response.json();
}

export const apiService = {
  // Draft & Live
  getDraftConfig: () => request('/draft-config'),
  updateDraft: (data: any) => request('/update-draft', { method: 'POST', body: JSON.stringify(data) }),
  getLiveConfig: () => request('/live-config'),
  publishLive: () => request('/publish', { method: 'POST' }),

  // Catalog
  getCatalogs: (page = 1, limit = 12) => request(`/catalogs?page=${page}&limit=${limit}`),
  saveCatalog: (data: any) => request('/catalogs', { method: 'POST', body: JSON.stringify(data) }),
  deleteCatalog: (id: string) => request(`/catalogs/${id}`, { method: 'DELETE' }),

  // Gallery
  getGallery: () => request('/gallery'),
  updateGallery: (items: any[], config: any) => request('/gallery', { method: 'POST', body: JSON.stringify({ items, config }) }),

  // Site Settings
  getSettings: () => request('/settings'),
  updateSettings: (settings: any) => request('/settings', { method: 'POST', body: JSON.stringify(settings) }),

  // Admin
  adminLogin: async (password: string) => {
    const res = await request('/admin/login', { method: 'POST', body: JSON.stringify({ password }) });
    if (res.token) memoryToken = res.token;
    return res;
  },
  adminLogout: () => {
    memoryToken = null;
    localStorage.removeItem('dkadris_auth_token');
  },
  getOrders: (): Promise<Order[]> => request('/admin/orders'),
  getAffiliates: (): Promise<Record<string, Affiliate>> => request('/admin/affiliates'),
  getPayouts: (): Promise<PayoutRequest[]> => request('/admin/payouts'),
  approveOrder: (id: string) => request(`/admin/orders/${id}/approve`, { method: 'POST' }),
  updatePayoutStatus: (payoutId: string, status: 'approved' | 'paid' | 'rejected') => 
    request(`/admin/payouts/${payoutId}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Affiliate
  affiliateSignup: (data: any) => request('/affiliate/signup', { method: 'POST', body: JSON.stringify(data) }),
  affiliateLogin: (data: any) => request('/affiliate/login', { method: 'POST', body: JSON.stringify(data) }),
  getAffiliateStats: () => {
    const saved = localStorage.getItem('dkadris_current_affiliate');
    const email = saved ? JSON.parse(saved).email : '';
    return request(`/affiliate/stats?email=${email}`);
  },
  verifyEmail: (token: string) => request(`/affiliate/verify?token=${token}`),

  // Orders & Referrals
  trackOrder: (order: Order) => request('/orders/track', { method: 'POST', body: JSON.stringify(order) }),
  
  // Health Check
  isWorkerActive: async () => {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }
};
