import { Order, Affiliate, PayoutRequest } from '../types';

// Use the Pages environment variable for the Worker URL
const BASE_URL = 'https://api.d-kadrisdenims.com';
// Generic request helper
async function request(endpoint: string, options: RequestInit = {}) {
  // Read auth token from localStorage (set after admin login)
  const token = localStorage.getItem('dkadris_auth_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(errorData.message || 'API request failed');
  }
  return response.json();
}

export const apiService = {
  // ----------------------
  // Admin
  // ----------------------
  adminLogin: async (password: string) => {
    
    // Call Worker login endpoint
    return request('/admin/login', { method: 'POST', body: JSON.stringify({ password }) });
  },

  getPayouts: (): Promise<PayoutRequest[]> => request('/admin/payouts'),
  updatePayoutStatus: (payoutId: string, status: 'approved' | 'paid' | 'rejected') =>
    request(`/admin/payouts/${payoutId}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // ----------------------
  // Affiliate
  // ----------------------
  affiliateSignup: (data: any) => request('/affiliate/signup', { method: 'POST', body: JSON.stringify(data) }),
  affiliateLogin: (data: any) => request('/affiliate/login', { method: 'POST', body: JSON.stringify(data) }),
  getAffiliateStats: () => request('/affiliate/stats'),
  verifyEmail: (token: string) => request(`/affiliate/verify?token=${token}`),

  // ----------------------
  // Orders & Referrals
  // ----------------------
  trackOrder: (order: Order) => request('/orders/track', { method: 'POST', body: JSON.stringify(order) }),

  // ----------------------
  // Health Check
  // ----------------------
  isWorkerActive: async () => {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }
};
