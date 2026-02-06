
import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../services/storage';
import { apiService } from '../services/api';
import { Product, Order, Measurements, SiteConfig } from '../types';

const Catalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(storage.getSiteConfig());
  const [filter, setFilter] = useState<'all' | 'men' | 'women'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderType, setOrderType] = useState<string>('trouser');
  const [quantity, setQuantity] = useState(1);
  const [measurements, setMeasurements] = useState<Measurements>({ length: '' });
  const [workerActive, setWorkerActive] = useState(false);

  useEffect(() => {
    const init = async () => {
      setProducts(storage.getProducts());
      setSiteConfig(storage.getSiteConfig());
      const active = await apiService.isWorkerActive();
      setWorkerActive(active);
    };
    init();
    
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const ref = params.get('ref');
    if (ref) localStorage.setItem('referrer', ref);
  }, []);

  const displayProducts = useMemo(() => {
    return products
      .filter(p => p.whitelisted)
      .filter(p => filter === 'all' || p.category === filter)
      .sort((a, b) => {
        if (sortBy === 'newest') return b.createdAt - a.createdAt;
        return a.createdAt - b.createdAt;
      });
  }, [products, filter, sortBy]);

  const handleMeasurementChange = (field: keyof Measurements, value: string) => {
    setMeasurements(prev => ({ ...prev, [field]: value }));
  };

  const submitOrder = async () => {
    if (!measurements.length) {
      alert("Measurement Length is required for a perfect fit!");
      return;
    }

    const ref = localStorage.getItem('referrer');
    const measurementsStr = Object.entries(measurements)
      .filter(([_, val]) => val !== '')
      .map(([key, val]) => `${key}: ${val}`)
      .join('\n');

    const msg = `Greetings D-Kadris! I'm interested in the following:\n\n*Product:* ${selectedProduct?.name}\n*Style:* ${orderType}\n*Quantity:* ${quantity}\n\n*Measurements:*\n${measurementsStr}${ref ? `\n\n*Referral Code:* ${ref}` : ''}\n\nCan you confirm availability and lead time?`;
    
    // Log the order internally for admin tracking
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      productName: selectedProduct?.name || '',
      productType: orderType,
      quantity,
      measurements,
      timestamp: Date.now(),
      customerEmail: 'customer@whatsapp.com',
      referrerCode: ref || undefined,
      status: 'pending',
      total: (selectedProduct?.price || 0) * quantity
    };

    if (workerActive) {
      try {
        await apiService.trackOrder(newOrder);
      } catch (err) {
        console.warn("Backend order tracking failed, continuing with WhatsApp order.", err);
      }
    }

    window.open(`https://wa.me/2348163914835?text=${encodeURIComponent(msg)}`);

    const currentOrders = storage.getOrders();
    storage.setOrders([...currentOrders, newOrder]);
    setSelectedProduct(null);
    alert("Inquiry sent to our WhatsApp workshop! We'll reply within minutes.");
  };

  const renderMeasurementField = (field: keyof Measurements, label: string) => (
    <div className="mb-4">
      <label className="block text-[10px] font-black text-navy/40 mb-1 uppercase tracking-widest">{label}</label>
      <select 
        className="w-full p-3 border-2 border-cream rounded-xl focus:border-copper outline-none transition-colors text-black font-bold appearance-none bg-white text-sm"
        value={measurements[field] || ''}
        onChange={(e) => handleMeasurementChange(field, e.target.value)}
      >
        <option value="" className="text-black">Select</option>
        {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
          <option key={num} value={num} className="text-black">{num}"</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-6 bg-cream">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-navy mb-4 font-belina tracking-tight">Browse Market</h1>
          <div className="w-24 h-1 bg-gold mx-auto mb-6"></div>
          <p className="text-navy/40 font-black uppercase tracking-widest text-xs">Premium Denim Collection</p>
        </header>

        <div className="sticky top-20 z-40 bg-cream/80 backdrop-blur-md py-4 mb-12 flex flex-col md:flex-row justify-between items-center gap-4 border-y border-navy/5 px-4">
          <div className="flex gap-2 bg-white/50 p-1 rounded-2xl border">
            {(['all', 'men', 'women'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === cat ? 'bg-navy text-gold shadow-md' : 'text-navy/60'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <select 
            className="bg-white border rounded-xl px-4 py-2 text-xs font-bold text-navy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="newest">Recent Releases</option>
            <option value="oldest">Classic Library</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayProducts.map(product => (
            <div key={product.id} className="bg-white rounded-[2rem] overflow-hidden shadow-xl hover:-translate-y-1 transition-all border border-navy/5 flex flex-col">
              <div className="aspect-[3/4] overflow-hidden">
                <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
              </div>
              <div className="p-8 flex flex-col items-center text-center">
                <h3 className="text-xl font-bold text-navy mb-1">{product.name}</h3>
                <p className="text-[10px] text-navy/40 uppercase font-black tracking-widest mb-4">{product.type}</p>
                <p className="text-copper font-black text-2xl mb-6">₦{product.price.toLocaleString()}</p>
                <button 
                  onClick={() => {
                    setSelectedProduct(product);
                    setOrderType(product.type);
                    setMeasurements({ length: '' });
                  }}
                  className="mt-auto w-full bg-navy text-gold py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg hover:bg-copper transition-all"
                >
                  Initiate Custom Order
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/95 backdrop-blur-md">
          <div className="bg-cream w-full max-w-lg rounded-[2.5rem] p-8 max-h-[90vh] overflow-y-auto shadow-2xl relative border-4 border-gold/20">
            <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 text-navy">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-navy mb-2 font-belina">Workshop Request</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-navy/40">Step 1: Fit Specification</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-navy/40 mb-2 uppercase tracking-widest">Garment Style</label>
                  <select 
                    className="w-full p-4 border bg-white rounded-2xl font-bold text-sm text-black outline-none focus:border-gold transition-colors" 
                    value={orderType} 
                    onChange={(e) => setOrderType(e.target.value)}
                  >
                    {['jacket', 'shirt', 'trouser', 'shorts', 'skirt'].map(t => <option key={t} value={t} className="text-black">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-navy/40 mb-2 uppercase tracking-widest">Quantity</label>
                  <select 
                    className="w-full p-4 border bg-white rounded-2xl font-bold text-sm text-black outline-none focus:border-gold transition-colors" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  >
                    {[1, 2, 3, 5, 10].map(n => <option key={n} value={n} className="text-black">{n}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border">
                <p className="text-[10px] font-black text-navy/40 mb-6 uppercase tracking-widest text-center">Body Measurements (Inches)</p>
                <div className="grid grid-cols-2 gap-x-4">
                  {renderMeasurementField('length', 'Full Length')}
                  {['jacket', 'shirt'].includes(orderType) && (
                    <>
                      {renderMeasurementField('shoulder', 'Shoulder')}
                      {renderMeasurementField('chest', 'Chest')}
                      {renderMeasurementField('sleeve', 'Sleeve')}
                    </>
                  )}
                  {['trouser', 'shorts', 'skirt'].includes(orderType) && (
                    <>
                      {renderMeasurementField('waist', 'Waist')}
                      {orderType !== 'skirt' && renderMeasurementField('thigh', 'Thigh')}
                      {orderType === 'skirt' && renderMeasurementField('hip', 'Hip')}
                    </>
                  )}
                </div>
              </div>

              <button onClick={submitOrder} className="w-full bg-navy text-gold py-5 rounded-2xl font-bold text-lg hover:bg-copper transition-all shadow-xl uppercase tracking-[0.2em]">
                Confirm & Chat via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
