
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { apiService } from '../services/api';
import { Product, Order, Affiliate, SiteConfig, FeaturedFit, FeatureToggles, PayoutRequest } from '../types';

const Admin: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSafeMode, setIsSafeMode] = useState(false);
  const [workerConnected, setWorkerConnected] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [affiliates, setAffiliates] = useState<Record<string, Affiliate>>({});
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(storage.getSiteConfig());
  const [isMaintenance, setIsMaintenance] = useState(storage.getMaintenance());
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'affiliates' | 'payouts' | 'cms' | 'system'>('products');

  // Modals / Editors
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

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
    setProducts(storage.getProducts());
    setOrders(storage.getOrders());
    setAffiliates(storage.getAffiliates());
    setSiteConfig(storage.getSiteConfig());
    setIsMaintenance(storage.getMaintenance());
    
    if (workerConnected) {
      try {
        const backendPayouts = await apiService.getPayouts();
        setPayouts(backendPayouts);
      } catch (err) {
        console.error("Failed to fetch backend stats", err);
      }
    }
  };

  const executeLogin = async () => {
    if (workerConnected) {
      try {
        const res = await apiService.adminLogin(password);
        localStorage.setItem('dkadris_auth_token', res.token);
      } catch (err) {
        alert("Backend Login Failed: " + (err as Error).message);
        return;
      }
    }
    sessionStorage.setItem('dkadris_admin_auth', 'true');
    setIsAuth(true);
    window.dispatchEvent(new CustomEvent('dkadris_storage_update'));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123' || workerConnected) executeLogin();
    else alert("Invalid Access Key");
  };

  const handlePayoutAction = async (id: string, status: 'approved' | 'paid' | 'rejected') => {
    if (!workerConnected) {
      alert("Backend required for payout processing.");
      return;
    }
    try {
      await apiService.updatePayoutStatus(id, status);
      alert(`Payout successfully ${status}`);
      refreshData();
    } catch (err) {
      alert("Action failed: " + (err as Error).message);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('dkadris_admin_auth');
    localStorage.removeItem('dkadris_auth_token');
    setIsAuth(false);
    setIsSafeMode(false);
    setPassword('');
    window.dispatchEvent(new CustomEvent('dkadris_storage_update'));
  };

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await toBase64(file);
        callback(base64);
      } catch (err) {
        alert("Image upload failed");
      }
    }
  };

  // Product CRUD
  const saveProduct = (p: Product) => {
    const exists = products.find(x => x.id === p.id);
    let newProducts;
    if (exists) {
      newProducts = products.map(x => x.id === p.id ? p : x);
    } else {
      newProducts = [...products, p];
    }
    storage.setProducts(newProducts);
    setProducts(newProducts);
    setEditingProduct(null);
    setIsAddingProduct(false);
  };

  const deleteProduct = (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const newProducts = products.filter(p => p.id !== id);
    storage.setProducts(newProducts);
    setProducts(newProducts);
  };

  // Site Config
  const saveConfig = () => {
    storage.setSiteConfig(siteConfig);
    storage.setMaintenance(isMaintenance);
    alert("System configuration published!");
    window.dispatchEvent(new CustomEvent('dkadris_storage_update'));
  };

  const moveFit = (index: number, direction: 'up' | 'down') => {
    const newFits = [...siteConfig.featuredFits];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newFits.length) {
      const temp = newFits[index];
      newFits[index] = newFits[newIndex];
      newFits[newIndex] = temp;
      setSiteConfig({ ...siteConfig, featuredFits: newFits });
    }
  };

  if (isLoading) return <div className="min-h-screen bg-navy flex items-center justify-center text-gold font-bold">Initializing System...</div>;

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy px-4">
        <div className="w-full max-w-md bg-cream p-10 rounded-[2.5rem] shadow-2xl text-center">
          <h1 className="text-3xl font-bold mb-6 text-navy font-belina">Admin Console</h1>
          {workerConnected && <div className="mb-4 text-[10px] text-green-600 font-black uppercase tracking-widest">Backend Active</div>}
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type={showPassword ? "text" : "password"}
              placeholder="System Access Key"
              className="w-full p-4 border-2 border-navy/10 rounded-2xl outline-none focus:border-copper transition-all text-center font-bold text-black"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
            />
            <button type="submit" className="w-full bg-navy text-gold py-4 rounded-2xl font-bold uppercase tracking-widest shadow-xl hover:bg-copper transition-all">
              Login
            </button>
            {!workerConnected && (
              <button type="button" onClick={() => { setIsSafeMode(true); executeLogin(); }} className="text-[10px] font-black text-navy/40 uppercase tracking-widest hover:text-navy">
                Bypass for Development
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col pt-24">
      {isSafeMode && <div className="bg-burntOrange text-white text-[10px] font-black py-2 px-6 uppercase tracking-[0.3em] text-center sticky top-0 z-[60]">Auth Disabled – Development Mode</div>}
      
      <nav className="bg-navy text-gold p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gold/20 shadow-xl mx-4 md:mx-6 rounded-[2rem]">
        <h1 className="text-xl md:text-2xl font-bold font-belina">D-Kadris Tailor CMS</h1>
        <div className="flex flex-wrap justify-center gap-2">
          {(['products', 'orders', 'affiliates', 'payouts', 'cms', 'system'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-gold text-navy shadow-lg' : 'text-gold/60 hover:text-gold'}`}>
              {tab}
            </button>
          ))}
          <button onClick={logout} className="ml-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-burntOrange/20 text-burntOrange border border-burntOrange/30 hover:bg-burntOrange hover:text-white transition-all">Exit</button>
        </div>
      </nav>

      <div className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full pb-32">
        {activeTab === 'products' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-navy font-belina">Inventory Manager</h2>
              <button onClick={() => setIsAddingProduct(true)} className="bg-navy text-gold px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-copper transition-all">+ Add Product</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-[2rem] shadow-xl border border-navy/5 relative group">
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-4 bg-cream">
                    <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                  </div>
                  <h3 className="font-bold text-navy text-lg">{p.name}</h3>
                  <p className="text-[10px] text-navy/40 font-black uppercase tracking-widest mb-2">{p.type} • {p.category}</p>
                  <p className="text-copper font-black">₦{p.price.toLocaleString()}</p>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => setEditingProduct(p)} className="flex-1 bg-navy/5 text-navy py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-navy hover:text-white transition-all">Edit</button>
                    <button onClick={() => deleteProduct(p.id)} className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-navy/5 overflow-hidden">
            <h2 className="text-3xl font-bold text-navy font-belina mb-8">Payout Approvals</h2>
            {!workerConnected ? (
              <div className="p-12 text-center text-navy/30 italic">Backend connection required to manage payouts.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-cream text-navy/40 uppercase text-[10px] font-black tracking-widest">
                      <th className="py-4">Affiliate</th>
                      <th className="py-4">Amount</th>
                      <th className="py-4">Status</th>
                      <th className="py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {payouts.map(p => (
                      <tr key={p.id} className="border-b border-cream">
                        <td className="py-4">
                          <p className="font-bold">{p.affiliateName}</p>
                          <p className="text-[10px] text-navy/40">{p.affiliateEmail}</p>
                        </td>
                        <td className="py-4 font-black text-copper">₦{p.amount.toLocaleString()}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-lg font-black uppercase text-[8px] tracking-widest ${
                            p.status === 'paid' ? 'bg-green-100 text-green-700' : 
                            p.status === 'approved' ? 'bg-blue-100 text-blue-700' : 
                            'bg-gold/20 text-burntOrange'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex gap-2">
                            {p.status === 'pending' && (
                              <>
                                <button onClick={() => handlePayoutAction(p.id, 'approved')} className="bg-navy text-gold px-3 py-1 rounded text-[8px] font-bold uppercase">Approve</button>
                                <button onClick={() => handlePayoutAction(p.id, 'rejected')} className="bg-red-50 text-red-600 px-3 py-1 rounded text-[8px] font-bold uppercase">Reject</button>
                              </>
                            )}
                            {p.status === 'approved' && (
                              <button onClick={() => handlePayoutAction(p.id, 'paid')} className="bg-green-600 text-white px-3 py-1 rounded text-[8px] font-bold uppercase">Mark Paid</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {payouts.length === 0 && <tr><td colSpan={4} className="py-12 text-center text-navy/30 italic">No pending payout requests.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'affiliates' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-navy font-belina">Partner Registry</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.values(affiliates).map((a: Affiliate) => (
                <div key={a.email} className="bg-white p-8 rounded-[2rem] shadow-xl border border-navy/5 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-navy">{a.name}</h3>
                      <p className="text-xs text-navy/40 font-medium">{a.email}</p>
                    </div>
                    <span className="bg-navy text-gold px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">{a.code}</span>
                  </div>
                  {a.verified === false && <span className="text-[8px] text-red-500 font-black uppercase mb-4 tracking-widest">Unverified Email</span>}
                  <div className="grid grid-cols-3 gap-4 text-center mt-auto border-t border-cream pt-6">
                    <div><p className="text-[8px] font-black text-navy/30 uppercase tracking-widest mb-1">Orders</p><span className="font-bold text-navy">{a.orders.length}</span></div>
                    <div><p className="text-[8px] font-black text-navy/30 uppercase tracking-widest mb-1">Network</p><span className="font-bold text-navy">{a.referredAffiliates.length}</span></div>
                    <div><p className="text-[8px] font-black text-navy/30 uppercase tracking-widest mb-1">Earnings</p><span className="font-bold text-copper">₦{a.commission.toLocaleString()}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cms' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-navy/5">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-navy font-belina">Site Appearance</h2>
                <button onClick={saveConfig} className="bg-copper text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl hover:bg-burntOrange transition-all">Publish Live</button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-navy/40 border-b pb-2">Branding & Logo</h3>
                  <div className="flex gap-4 mb-4">
                    <button onClick={() => setSiteConfig({...siteConfig, logoType: 'text'})} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest border-2 transition-all ${siteConfig.logoType === 'text' ? 'border-navy bg-navy text-gold' : 'border-cream text-navy/40'}`}>Text Only</button>
                    <button onClick={() => setSiteConfig({...siteConfig, logoType: 'image'})} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest border-2 transition-all ${siteConfig.logoType === 'image' ? 'border-navy bg-navy text-gold' : 'border-cream text-navy/40'}`}>Image/Logo</button>
                  </div>
                  {siteConfig.logoType === 'text' ? (
                    <input type="text" className="w-full p-4 bg-cream/30 border rounded-2xl font-bold text-navy" value={siteConfig.logoText} onChange={e => setSiteConfig({...siteConfig, logoText: e.target.value})} />
                  ) : (
                    <div className="space-y-4">
                      {siteConfig.logoImage && <img src={siteConfig.logoImage} className="h-16 w-auto mx-auto border-2 border-cream p-2 rounded-xl bg-white" />}
                      <input type="file" accept="image/*" onChange={e => handleImageUpload(e, base64 => setSiteConfig({...siteConfig, logoImage: base64}))} className="w-full text-xs font-bold text-navy/40" />
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-navy/40 border-b pb-2">Hero Visuals</h3>
                  <div className="flex gap-4 mb-4">
                    <button onClick={() => setSiteConfig({...siteConfig, heroBgType: 'url'})} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest border-2 transition-all ${siteConfig.heroBgType === 'url' ? 'border-navy bg-navy text-gold' : 'border-cream text-navy/40'}`}>Static URL</button>
                    <button onClick={() => setSiteConfig({...siteConfig, heroBgType: 'upload'})} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest border-2 transition-all ${siteConfig.heroBgType === 'upload' ? 'border-navy bg-navy text-gold' : 'border-cream text-navy/40'}`}>File Upload</button>
                  </div>
                  {siteConfig.heroBgType === 'url' ? (
                    <input type="text" className="w-full p-4 bg-cream/30 border rounded-2xl font-bold text-navy" value={siteConfig.heroBgUrl} onChange={e => setSiteConfig({...siteConfig, heroBgUrl: e.target.value})} />
                  ) : (
                    <div className="space-y-4">
                      {siteConfig.heroBgUpload && <img src={siteConfig.heroBgUpload} className="h-24 w-full object-cover rounded-xl border-2 border-cream shadow-sm" />}
                      <input type="file" accept="image/*" onChange={e => handleImageUpload(e, base64 => setSiteConfig({...siteConfig, heroBgUpload: base64}))} className="w-full text-xs font-bold text-navy/40" />
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-navy/40 border-b pb-2">Marketing Content</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="text-[10px] font-black text-navy/40 uppercase mb-2 block">Hero Main Title</label><textarea className="w-full p-4 bg-cream/30 border rounded-2xl font-bold text-navy" rows={3} value={siteConfig.heroTitle} onChange={e => setSiteConfig({...siteConfig, heroTitle: e.target.value})} /></div>
                    <div><label className="text-[10px] font-black text-navy/40 uppercase mb-2 block">Hero Subheadline</label><textarea className="w-full p-4 bg-cream/30 border rounded-2xl font-bold text-navy" rows={3} value={siteConfig.heroSubtitle} onChange={e => setSiteConfig({...siteConfig, heroSubtitle: e.target.value})} /></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-navy/5">
              <h2 className="text-3xl font-bold text-navy font-belina mb-8">Signature Gallery Curation</h2>
              <div className="space-y-4">
                {siteConfig.featuredFits.map((fit, idx) => (
                  <div key={fit.id} className="flex flex-col md:flex-row gap-6 p-6 border-2 border-cream rounded-3xl bg-cream/10 hover:border-gold/30 transition-all">
                    <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-lg flex-shrink-0">
                      <img src={fit.image} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input className="p-3 border rounded-xl text-xs font-bold" value={fit.title} onChange={e => {
                        const newFits = [...siteConfig.featuredFits];
                        newFits[idx].title = e.target.value;
                        setSiteConfig({...siteConfig, featuredFits: newFits});
                      }} />
                      <select className="p-3 border rounded-xl text-xs font-bold" value={fit.layoutType} onChange={e => {
                        const newFits = [...siteConfig.featuredFits];
                        newFits[idx].layoutType = e.target.value as any;
                        setSiteConfig({...siteConfig, featuredFits: newFits});
                      }}>
                        <option value="standard">Standard</option>
                        <option value="bold">Bold (2x2)</option>
                        <option value="wide">Wide (2x1)</option>
                        <option value="tall">Tall (1x2)</option>
                      </select>
                      <textarea className="p-3 border rounded-xl text-xs font-bold md:col-span-2" value={fit.description} onChange={e => {
                        const newFits = [...siteConfig.featuredFits];
                        newFits[idx].description = e.target.value;
                        setSiteConfig({...siteConfig, featuredFits: newFits});
                      }} />
                    </div>
                    <div className="flex flex-row md:flex-col justify-center items-center gap-2">
                      <button onClick={() => moveFit(idx, 'up')} className="p-3 bg-white rounded-xl shadow-sm border border-navy/5">↑</button>
                      <button onClick={() => moveFit(idx, 'down')} className="p-3 bg-white rounded-xl shadow-sm border border-navy/5">↓</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="max-w-xl mx-auto space-y-8">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-navy/5 text-center">
              <h2 className="text-3xl font-bold text-navy font-belina mb-4">System Master Switch</h2>
              <p className="text-navy/40 text-sm mb-10 leading-relaxed uppercase tracking-widest font-black">Control global accessibility of the store and all public endpoints.</p>
              
              <div className="flex items-center justify-center gap-6 mb-12">
                <span className={`text-xs font-black uppercase tracking-[0.2em] ${!isMaintenance ? 'text-green-600' : 'text-navy/20'}`}>Live</span>
                <button onClick={() => setIsMaintenance(!isMaintenance)} className={`w-20 h-10 rounded-full relative transition-all duration-500 shadow-inner ${isMaintenance ? 'bg-burntOrange' : 'bg-green-500'}`}>
                  <div className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-all duration-500 shadow-lg ${isMaintenance ? 'left-11' : 'left-1'}`}></div>
                </button>
                <span className={`text-xs font-black uppercase tracking-[0.2em] ${isMaintenance ? 'text-burntOrange' : 'text-navy/20'}`}>Maintenance</span>
              </div>

              <button onClick={saveConfig} className="w-full bg-navy text-gold py-5 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-xl hover:bg-copper transition-all active:scale-95">Update Global State</button>
            </div>
          </div>
        )}
      </div>

      {/* Product Editor Modal */}
      {(editingProduct || isAddingProduct) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-navy/95 backdrop-blur-md">
          <div className="bg-cream w-full max-w-2xl rounded-[3rem] p-10 max-h-[90vh] overflow-y-auto shadow-2xl relative border-4 border-gold/10">
            <button onClick={() => { setEditingProduct(null); setIsAddingProduct(false); }} className="absolute top-8 right-8 text-navy/40 hover:text-navy transition-colors">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-3xl font-bold text-navy font-belina mb-8">{isAddingProduct ? 'Create New Design' : 'Refine Product'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="aspect-[3/4] bg-white rounded-[2rem] border-4 border-white shadow-xl overflow-hidden relative">
                  <img src={(editingProduct?.image) || 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=2000&auto=format&fit=crop'} className="w-full h-full object-cover" />
                  <label className="absolute inset-0 bg-navy/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-gold font-bold uppercase tracking-widest text-xs">
                    Change Photo
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, base64 => {
                      if (isAddingProduct) setEditingProduct(prev => ({ ...(prev || {}), image: base64 } as any));
                      else setEditingProduct({ ...editingProduct!, image: base64 });
                    })} />
                  </label>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-navy/40 uppercase tracking-widest mb-1 block">Internal Code</label>
                  <input readOnly={!isAddingProduct} className="w-full p-4 bg-white border-none rounded-2xl font-bold text-navy" value={editingProduct?.id || `dk-${Math.random().toString(36).substr(2, 5)}`} onChange={e => setEditingProduct({...(editingProduct || {}), id: e.target.value} as any)} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-navy/40 uppercase tracking-widest mb-1 block">Full Product Name</label>
                  <input className="w-full p-4 bg-white border-none rounded-2xl font-bold text-navy" value={editingProduct?.name || ''} onChange={e => setEditingProduct({...(editingProduct || {}), name: e.target.value} as any)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-navy/40 uppercase tracking-widest mb-1 block">Price (₦)</label>
                    <input type="number" className="w-full p-4 bg-white border-none rounded-2xl font-bold text-navy" value={editingProduct?.price || 0} onChange={e => setEditingProduct({...(editingProduct || {}), price: Number(e.target.value)} as any)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-navy/40 uppercase tracking-widest mb-1 block">Market Section</label>
                    <select className="w-full p-4 bg-white border-none rounded-2xl font-bold text-navy" value={editingProduct?.category || 'men'} onChange={e => setEditingProduct({...(editingProduct || {}), category: e.target.value as any} as any)}>
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-navy/40 uppercase tracking-widest mb-1 block">Garment Type</label>
                  <select className="w-full p-4 bg-white border-none rounded-2xl font-bold text-navy" value={editingProduct?.type || 'trouser'} onChange={e => setEditingProduct({...(editingProduct || {}), type: e.target.value} as any)}>
                    {['jacket', 'shirt', 'trouser', 'shorts', 'skirt'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <button onClick={() => saveProduct(editingProduct as Product)} className="w-full bg-navy text-gold py-5 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-xl hover:bg-copper transition-all mt-6">Confirm Product Registry</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
