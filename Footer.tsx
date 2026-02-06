
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { SiteConfig } from '../types';

const Footer: React.FC = () => {
  const [config, setConfig] = useState<SiteConfig>(storage.getSiteConfig());
  const [showAdmin, setShowAdmin] = useState(false);

  const isStudioPreview = () => {
    return window.location.hostname.includes('aistudio.google.com') || 
           window.location.hostname.includes('localhost');
  };

  useEffect(() => {
    const updateConfig = () => setConfig(storage.getSiteConfig());
    setShowAdmin(isStudioPreview());
    window.addEventListener('dkadris_storage_update', updateConfig);
    return () => window.removeEventListener('dkadris_storage_update', updateConfig);
  }, []);

  return (
    <footer className="bg-navy text-gold py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        <div>
          <h3 className="text-2xl font-bold mb-4 font-belina">{config.logoText} Tailoring</h3>
          <p className="text-white/80">Premium denim, crafted in Nigeria, worn by the world.</p>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-4 uppercase tracking-widest text-xs">Contact Us</h4>
          <p className="text-white/80">📧 dkadristailoringservice@gmail.com</p>
          <p className="text-white/80">📍 Lokoja, Nigeria</p>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-4 uppercase tracking-widest text-xs">Follow Us</h4>
          <div className="flex justify-center md:justify-start gap-6">
             <a href={config.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-all transform hover:scale-110">Facebook</a>
             <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-all transform hover:scale-110">Instagram</a>
             <a href={config.tiktokUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-all transform hover:scale-110">TikTok</a>
          </div>
        </div>
      </div>
      <div className="mt-12 pt-8 border-t border-gold/20 text-center text-sm text-white/40 flex flex-col items-center gap-3">
        <span>© 2026 {config.logoText} Tailoring Jeans Market. All Rights Reserved.</span>
        {showAdmin && (
          <Link 
            to="/admin" 
            className="mt-2 bg-gold/10 hover:bg-gold/20 text-gold px-6 py-2 rounded-xl border border-gold/30 transition-all font-bold text-xs uppercase tracking-widest shadow-lg"
          >
            Admin Dashboard
          </Link>
        )}
      </div>
    </footer>
  );
};

export default Footer;
