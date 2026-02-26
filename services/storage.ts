import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { apiService } from '../services/api';
import { Product, Order, Affiliate, SiteConfig, GalleryItem, GalleryConfig, PayoutRequest } from '../types';

const Admin: React.FC = () => {
  // --- UI & Auth State ---
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'gallery' | 'orders' | 'affiliates' | 'payouts' | 'cms' | 'system'>('products');
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [workerConnected, setWorkerConnected] = useState(false);

  // --- Data State ---
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [galleryConfig, setGalleryConfig] = useState<GalleryConfig | null>(null);

  // --- Initialization ---
  useEffect(() => {
    const checkStatus = async () => {
      const active = await apiService.isWorkerActive();
      setWorkerConnected(active);
      const session = sessionStorage.getItem('dkadris_admin_auth') === 'true';
      setIsAuth(session);
      setIsLoading(false);
    };
    checkStatus();
  }, []);

  useEffect(() => {
    if (isAuth) {
      refreshData();
    }
  }, [isAuth, workerConnected]);

  const refreshData = async () => {
    try {
      const [catalogRes, galleryRes, settingsRes] = await Promise.all([
        apiService.getCatalogs(1, 1000),
        apiService.getGallery(),
        apiService.getSettings()
      ]);

      // Set API Data with fallbacks
      setProducts(Array.isArray(catalogRes?.data) ? catalogRes.data : Array.isArray(catalogRes) ? catalogRes : []);
      setGallery(Array.isArray(galleryRes?.items) ? galleryRes.items : []);
      setGalleryConfig(galleryRes?.config ?? null);
      setSiteConfig(settingsRes ?? storage.getSiteConfig()); //

    } catch (err) {
      console.error("Failed to fetch data", err);
    }

    // Set Local Storage Data
    setOrders(storage.getOrders() ?? []);
    setIsMaintenance(storage.getMaintenance() ?? false);

    const storedAffiliates = storage.getAffiliates();
    if (Array.isArray(storedAffiliates)) {
      setAffiliates(storedAffiliates);
    } else if (storedAffiliates && typeof storedAffiliates === 'object') {
      setAffiliates(Object.values(storedAffiliates));
    }
  };

  // --- Save Functions ---
  const handleGlobalSave = () => {
    switch (activeTab) {
      case 'products':
        storage.setProducts(products); //
        alert("Product catalog saved to local storage!");
        break;
      case 'cms':
        if (siteConfig) {
          storage.setSiteConfig(siteConfig); //
          alert("Site configuration updated!");
        }
        break;
      case 'orders':
        storage.setOrders(orders); //
        alert("Orders synchronized!");
        break;
      case 'system':
        storage.setMaintenance(isMaintenance); //
        alert("System settings updated!");
        break;
      default:
        alert("Save functionality for this tab is handled via API.");
    }
  };

  if (isLoading) return <div>Loading Admin...</div>;
  if (!isAuth) return <div>Unauthorized Access</div>;

  return (
    <div style={{ paddingBottom: '80px', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <h1>D-Kadris Admin Dashboard</h1>
      
      {/* Tab Navigation logic would go here */}

      {/* Main Content Area */}
      <main>
        {activeTab === 'products' && (
          <div>
            {/* Render your product list/inputs here */}
            <p>Managing {products.length} Products</p>
          </div>
        )}
        
        {activeTab === 'cms' && siteConfig && (
          <div>
            <label>Hero Title</label>
            <input 
              value={siteConfig.heroTitle} 
              onChange={(e) => setSiteConfig({...siteConfig, heroTitle: e.target.value})}
            />
          </div>
        )}
      </main>

      {/* --- Floating Save Bar --- */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '800px',
        backgroundColor: '#1a1a1a', // Dark indigo/denim feel
        color: 'white',
        padding: '16px 24px',
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        border: '1px solid #333',
        zIndex: 1000
      }}>
        <div style={{ fontSize: '14px', opacity: 0.8 }}>
          Editing <b>{activeTab.toUpperCase()}</b>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={refreshData}
            style={{
              background: 'transparent',
              color: '#ccc',
              border: '1px solid #444',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Discard
          </button>
          <button 
            onClick={handleGlobalSave}
            style={{
              background: '#2563eb', // Clean blue accent
              color: 'white',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Admin;
  
