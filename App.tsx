import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Affiliate from './pages/Affiliate';
import Admin from './pages/Admin';
import { storage } from './services/storage';

const Maintenance: React.FC = () => (
  <div className="min-h-screen bg-navy flex items-center justify-center p-6 text-center">
    <div className="max-w-md">
      <h1 className="text-4xl md:text-6xl font-bold text-gold mb-6 font-belina">Crafting Excellence...</h1>
      <p className="text-white/80 text-lg mb-10">Our digital boutique is temporarily closed for artisanal updates. We'll be back with fresh denim shortly.</p>
      <div className="w-20 h-1 bg-copper mx-auto mb-8"></div>
      <p className="text-gold/40 text-xs font-black uppercase tracking-[0.3em]">Estimated Uptime: Within 2 Hours</p>
      <Link to="/admin" className="mt-12 inline-block text-[10px] text-white/20 hover:text-white uppercase tracking-widest font-bold">Access System Console</Link>
    </div>
  </div>
);

const App: React.FC = () => {
  const [isMaintenance, setIsMaintenance] = useState(storage.getMaintenance());

  useEffect(() => {
    const handleUpdate = () => {
      setIsMaintenance(storage.getMaintenance());
    };
    window.addEventListener('dkadris_storage_update', handleUpdate);
    return () => window.removeEventListener('dkadris_storage_update', handleUpdate);
  }, []);

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/admin" element={<Admin />} />
            {isMaintenance ? (
              <Route path="*" element={<Maintenance />} />
            ) : (
              <>
                <Route path="/" element={<Home />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/affiliate" element={<Affiliate />} />
              </>
            )}
          </Routes>
        </main>
        {!isMaintenance && <Footer />}
      </div>
    </Router>
  );
};

export default App;
