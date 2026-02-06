import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { apiService } from '../services/api';
import { Affiliate } from '../types';

const AffiliatePage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState<Affiliate | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [workerConnected, setWorkerConnected] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    referrerCode: '',
    policyAccepted: false
  });

  useEffect(() => {
    const checkStatus = async () => {
      const active = await apiService.isWorkerActive();
      setWorkerConnected(active);
      const savedUser = localStorage.getItem('dkadris_current_affiliate');
      if (savedUser) {
        if (active) {
          try {
            const stats = await apiService.getAffiliateStats();
            setUser(stats);
          } catch {
            localStorage.removeItem('dkadris_current_affiliate');
          }
        } else {
          const parsed = JSON.parse(savedUser);
          const affiliates = storage.getAffiliates();
          if (affiliates[parsed.email]) setUser(affiliates[parsed.email]);
        }
      }
    };
    checkStatus();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (isResetMode) {
      // Simulate or call reset password logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(`Password reset instructions sent to ${formData.email}. Please check your inbox.`);
      setIsResetMode(false);
      setLoading(false);
      return;
    }

    if (!isLogin && !formData.policyAccepted) {
      setError("Please accept the D-Kadris Partnership Policy to continue.");
      setLoading(false);
      return;
    }

    if (workerConnected) {
      try {
        if (isLogin) {
          const res = await apiService.affiliateLogin({ email: formData.email, password: formData.password });
          localStorage.setItem('dkadris_auth_token', res.token);
          setUser(res.user);
          localStorage.setItem('dkadris_current_affiliate', JSON.stringify({ email: res.user.email }));
        } else {
          await apiService.affiliateSignup(formData);
          setSuccess("Account created! A verification email has been sent via Brevo. Please verify your email to unlock commissions.");
          setIsLogin(true);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Fallback to local storage if no worker
    await new Promise(resolve => setTimeout(resolve, 800));
    const affiliates = storage.getAffiliates();
    if (isLogin) {
      const existing = affiliates[formData.email];
      if (existing && existing.password === formData.password) {
        setUser(existing);
        localStorage.setItem('dkadris_current_affiliate', JSON.stringify({ email: existing.email }));
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } else {
      const newCode = formData.name.toLowerCase().split(' ')[0] + Math.floor(Math.random() * 1000);
      const newAffiliate: Affiliate = { 
        ...formData, 
        code: newCode, 
        referredAffiliates: [], 
        orders: [], 
        commission: 0,
        verified: true // Auto-verify on fallback
      };
      affiliates[formData.email] = newAffiliate;
      storage.setAffiliates(affiliates);
      setUser(newAffiliate);
      localStorage.setItem('dkadris_current_affiliate', JSON.stringify({ email: newAffiliate.email }));
    }
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dkadris_current_affiliate');
    localStorage.removeItem('dkadris_auth_token');
  };

  const PolicyModal = () => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-navy/95 backdrop-blur-md">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 md:p-12 overflow-y-auto max-h-[80vh] shadow-2xl relative">
        <button onClick={() => setShowPolicy(false)} className="absolute top-6 right-6 text-navy/40 hover:text-navy">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="text-3xl font-bold text-navy mb-6 font-belina">D-Kadris Partnership Policy</h2>
        <div className="space-y-4 text-navy/80 text-sm leading-relaxed">
          <p><strong>1. Introduction:</strong> Welcome to the D-Kadris Tailoring Affiliate Network. By joining, you agree to promote our artisanal Nigerian denim with integrity.</p>
          <p><strong>2. Commission Tiers:</strong> Partners earn 10% commission on first-time customer orders and 5% on recurring orders made using their unique referral link or code.</p>
          <p><strong>3. Payout Threshold:</strong> Withdrawals are eligible once your balance reaches ₦5,000. Payouts are processed after a 14-day validation window to ensure no order cancellations.</p>
          <p><strong>4. Ethical Promotion:</strong> Spaming, deceptive advertising, or misuse of D-Kadris branding will result in immediate account termination and forfeiture of earnings.</p>
          <p><strong>5. Verification:</strong> All partners must verify their email via our Brevo-powered system to unlock payout functionality.</p>
          <p><strong>6. Modifications:</strong> D-Kadris reserves the right to update commission rates or terms with 7 days notice to all registered partners.</p>
        </div>
        <button onClick={() => setShowPolicy(false)} className="mt-8 w-full bg-navy text-gold py-4 rounded-xl font-bold uppercase tracking-widest text-xs">I Understand</button>
      </div>
    </div>
  );

  if (user) {
    const orders = storage.getOrders().filter(o => o.referrerCode === user.code);
    const earnings = user.commission || orders.reduce((sum, o) => sum + (o.total * 0.1), 0);
    const threshold = 5000;
    const progress = Math.min((earnings / threshold) * 100, 100);

    return (
      <div className="min-h-screen pt-24 pb-20 px-6 bg-cream">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-bold text-navy font-belina">Welcome, {user.name}</h1>
              <p className="text-navy/40 font-bold uppercase tracking-widest text-xs mt-1">Affiliate Partner Dashboard</p>
            </div>
            <button onClick={logout} className="bg-white text-burntOrange border-2 border-burntOrange/10 px-8 py-3 rounded-xl font-bold shadow-sm hover:bg-burntOrange hover:text-white transition-all">Logout</button>
          </div>

          {!user.verified && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-2xl mb-8 flex items-center justify-between">
              <p className="text-amber-800 text-sm font-medium">Verify your email to start receiving payouts. Check your Brevo-sent inbox link.</p>
              <button className="text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white px-4 py-2 rounded-lg">Resend Email</button>
            </div>
          )}

          <div className="bg-navy p-8 md:p-12 rounded-[2.5rem] shadow-2xl mb-12 text-white relative overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-2xl font-bold text-gold mb-2">Referral Engine</h2>
                <p className="text-white/60 text-sm mb-6">10% for new styles, 5% for recurrent fits.</p>
                <div className="flex flex-col sm:flex-row items-stretch gap-2 bg-white/10 p-2 rounded-2xl border border-white/20">
                  <input readOnly value={`${window.location.origin}/#/catalog?ref=${user.code}`} className="flex-1 bg-transparent border-none outline-none px-4 py-3 font-mono text-sm text-gold" />
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/#/catalog?ref=${user.code}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className={`px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${copied ? 'bg-green-500 text-white' : 'bg-gold text-navy hover:bg-white'}`}>{copied ? '✓ Copied' : '📋 Copy'}</button>
                </div>
              </div>
              <div className="bg-gold text-navy p-8 rounded-3xl text-center min-w-[200px] shadow-2xl">
                 <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Partner Code</p>
                 <span className="text-4xl font-black block tracking-tighter">{user.code}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl text-center border-b-4 border-copper md:col-span-2">
              <p className="text-navy/60 font-bold text-[10px] uppercase mb-4 tracking-widest">Payout Threshold (₦5,000)</p>
              <div className="w-full h-4 bg-cream rounded-full overflow-hidden mb-4 border border-navy/5">
                <div className="h-full bg-copper transition-all duration-1000" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase text-navy/40">
                <span>₦{earnings.toLocaleString()}</span>
                <span>{progress.toFixed(0)}% Complete</span>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2rem] shadow-xl text-center border-b-4 border-navy flex flex-col items-center">
              <p className="text-navy/60 font-bold text-[10px] uppercase mb-2 tracking-widest">Payout Status</p>
              <span className={`text-xl font-black ${earnings >= 5000 && user.verified ? 'text-green-600' : 'text-navy/20'}`}>
                {earnings >= 5000 && user.verified ? 'ELIGIBLE' : 'PENDING'}
              </span>
            </div>
            <div className="bg-white p-8 rounded-[2rem] shadow-xl text-center border-b-4 border-navy flex flex-col items-center">
              <p className="text-navy/60 font-bold text-[10px] uppercase mb-2 tracking-widest">Earnings Window</p>
              <span className="text-xl font-black text-navy">14 DAYS</span>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-navy/5">
            <h3 className="text-2xl font-bold text-navy mb-6 font-belina">🛒 Orders Linked</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-cream text-navy/40 uppercase text-[10px] font-black tracking-widest">
                    <th className="py-4">Product</th>
                    <th className="py-4">Comm. %</th>
                    <th className="py-4">Earnings</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {orders.length === 0 ? <tr><td colSpan={3} className="py-12 text-center text-navy/30 italic">No sales tracked yet.</td></tr> : orders.map(o => (
                    <tr key={o.id} className="border-b border-cream">
                      <td className="py-4 font-bold">{o.productName}</td>
                      <td className="py-4 font-black">10%</td>
                      <td className="py-4 text-copper font-black">₦{(o.total * 0.1).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-24 pb-20 px-6 bg-cream">
      {showPolicy && <PolicyModal />}
      <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-navy/5 transition-all">
        <div className="bg-navy p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <h1 className="text-3xl font-bold text-gold mb-2 font-belina">
            {isResetMode ? 'Recover Account' : (isLogin ? 'Partner Login' : 'Join Our Network')}
          </h1>
          <p className="text-white/60 text-sm relative z-10">Premium Denim Rewards Engine</p>
        </div>
        
        <form onSubmit={handleAuth} className="p-10 space-y-6">
          {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium border-l-4 border-red-500 animate-fade-in">{error}</div>}
          {success && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-medium border-l-4 border-green-500 animate-fade-in">{success}</div>}
          
          {isResetMode ? (
            <div>
              <label className="block text-[10px] font-black text-navy/60 mb-2 uppercase tracking-widest">Registered Email</label>
              <input 
                type="email" 
                required 
                className="w-full p-4 bg-cream/50 border-2 border-transparent focus:border-gold rounded-2xl outline-none font-bold text-black" 
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
                placeholder="you@example.com"
              />
            </div>
          ) : (
            <>
              {!isLogin && (
                <div>
                  <label className="block text-[10px] font-black text-navy/60 mb-2 uppercase tracking-widest">Full Legal Name</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full p-4 bg-cream/50 border-2 border-transparent focus:border-gold rounded-2xl outline-none font-bold text-black" 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    placeholder="Enter full name"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-[10px] font-black text-navy/60 mb-2 uppercase tracking-widest">Email Address</label>
                <input 
                  type="email" 
                  required 
                  className="w-full p-4 bg-cream/50 border-2 border-transparent focus:border-gold rounded-2xl outline-none font-bold text-black" 
                  value={formData.email} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })} 
                  placeholder="your@email.com"
                />
              </div>

              <div className="relative">
                <label className="block text-[10px] font-black text-navy/60 mb-2 uppercase tracking-widest">Secure Password</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  className="w-full p-4 pr-12 bg-cream/50 border-2 border-transparent focus:border-gold rounded-2xl outline-none font-bold text-black" 
                  value={formData.password} 
                  onChange={e => setFormData({ ...formData, password: e.target.value })} 
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[38px] text-navy/30 hover:text-navy transition-colors"
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-[10px] font-black text-navy/60 mb-1 uppercase tracking-widest">Referrer Code (Optional)</label>
                  <p className="text-[9px] text-copper font-bold mb-2 italic">Add a code if you were referred to earn an immediate ₦500 bonus upon verification.</p>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-cream/50 border-2 border-transparent focus:border-gold rounded-2xl outline-none font-bold uppercase text-black" 
                    value={formData.referrerCode} 
                    onChange={e => setFormData({ ...formData, referrerCode: e.target.value.toUpperCase() })} 
                    placeholder="XYZ123"
                  />
                </div>
              )}

              {!isLogin && (
                <div className="flex items-start gap-3 py-2">
                  <input 
                    type="checkbox" 
                    id="policy"
                    className="mt-1 w-5 h-5 rounded border-2 border-navy/10 text-navy focus:ring-gold"
                    checked={formData.policyAccepted}
                    onChange={e => setFormData({ ...formData, policyAccepted: e.target.checked })}
                  />
                  <label htmlFor="policy" className="text-xs text-navy/60 font-medium">
                    I agree to the <button type="button" onClick={() => setShowPolicy(true)} className="text-copper font-bold underline">D-Kadris Partnership Policy</button>
                  </label>
                </div>
              )}
            </>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-navy text-gold py-5 rounded-2xl font-bold text-lg shadow-xl uppercase tracking-widest hover:bg-copper transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isResetMode ? 'Send Reset Link' : (isLogin ? 'Initialize Session' : 'Create Partner Account'))}
          </button>
          
          <div className="flex flex-col items-center gap-4 pt-4">
            <p className="text-sm text-navy/60">
              {isResetMode ? 'Remember your password?' : (isLogin ? "New to the network?" : "Already a partner?") } 
              <button 
                type="button" 
                onClick={() => { 
                  setIsResetMode(false); 
                  setIsLogin(!isLogin); 
                  setError(null);
                  setSuccess(null);
                }} 
                className="ml-2 text-copper font-bold hover:underline"
              >
                {isResetMode ? 'Back to Login' : (isLogin ? 'Join Us' : 'Login')}
              </button>
            </p>
            
            {isLogin && !isResetMode && (
              <button 
                type="button" 
                onClick={() => { setIsResetMode(true); setError(null); setSuccess(null); }}
                className="text-xs font-bold text-navy/40 hover:text-navy uppercase tracking-widest"
              >
                Forgot Password?
              </button>
            )}
            
            {isResetMode && (
              <button 
                type="button" 
                onClick={() => setIsResetMode(false)}
                className="text-xs font-bold text-navy/40 hover:text-navy uppercase tracking-widest"
              >
                Cancel Recovery
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AffiliatePage;
