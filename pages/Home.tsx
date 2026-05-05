import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MOTIVATIONAL_MESSAGES } from '../constants';
import { apiService } from '../services/api';
import { SiteConfig, GalleryItem } from '../types';

// ✅ Default fallback config (VERY IMPORTANT)
const DEFAULT_CONFIG: SiteConfig = {
  heroTitle: "D-Kadris Denims",
  heroSubtitle: "Premium denim crafted for you",
  shopButtonText: "Shop Now",
  brandQuote: "Crafted with precision and style",
  contactPhone: "+234XXXXXXXXXX",
  contactEmail: "your@email.com",
  footerContent: "D-Kadris Denims",
  heroBgUrl: "",
  heroBgType: "url",
  heroBgUpload: "",
  featuredFits: [],
  galleryLayoutStyle: "grid",
  galleryColumns: 3,
  gallerySpacing: 6
};

const Home: React.FC = () => {
  const [msgIndex, setMsgIndex] = useState(0);
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const liveConfig = await apiService.getLiveConfig();

        // ✅ Safe fallback handling
        const safeSettings = liveConfig?.siteSettings || DEFAULT_CONFIG;

        setConfig(safeSettings);
        setGallery(safeSettings.featuredFits || []);
      } catch (err) {
        console.error("Failed to fetch home data", err);

        // ✅ Fallback if API fails completely
        setConfig(DEFAULT_CONFIG);
        setGallery([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MOTIVATIONAL_MESSAGES.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const getHeroBackground = () => {
    if (config.heroBgType === 'upload' && config.heroBgUpload) {
      return config.heroBgUpload;
    }
    return config.heroBgUrl || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-12 h-12 border-4 border-navy border-t-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header 
        className="min-h-screen flex items-center justify-center text-center px-4 py-20 relative"
        style={{
          background: `linear-gradient(rgba(26,43,76,0.7), rgba(26,43,76,0.7)), url('${getHeroBackground()}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-4xl z-10">
          <h1 className="text-4xl md:text-7xl font-bold text-gold mb-6 font-belina leading-tight px-2">
            {config.heroTitle}
          </h1>

          <p className="text-lg md:text-2xl text-white mb-10 px-4">
            {config.heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 px-6">
            <Link to="/catalog" className="w-full sm:w-auto bg-copper text-white px-10 py-4 rounded-xl font-bold text-lg">
              {config.shopButtonText}
            </Link>

            <Link to="/affiliate" className="w-full sm:w-auto bg-white text-navy px-10 py-4 rounded-xl font-bold text-lg">
              Affiliate Dashboard
            </Link>
          </div>

          <div className="mt-12 h-8">
            <p className="text-gold italic text-lg font-belina px-4">
              {MOTIVATIONAL_MESSAGES[msgIndex]}
            </p>
          </div>
        </div>
      </header>

      {/* Brand Story */}
      <section className="bg-navy py-16 text-center">
        <p className="text-gold text-xl md:text-2xl font-belina italic px-6 max-w-4xl mx-auto">
          {config.brandQuote}
        </p>
      </section>

      {/* Featured Fits */}
      {gallery.length > 0 && (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {gallery.map((item) => (
              <div key={item.id} className="rounded-xl overflow-hidden shadow-lg">
                <img src={item.image} className="w-full h-[400px] object-cover" alt={item.title} />
                <div className="p-4">
                  <h4 className="font-bold text-navy">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-navy py-20 text-center text-white">
        <h2 className="text-3xl font-bold mb-4 text-gold">Your Fit, Your Way</h2>
        <p className="mb-6">
          Contact us at {config.contactPhone} or {config.contactEmail}
        </p>

        <Link to="/catalog" className="bg-copper px-8 py-4 rounded-xl font-bold">
          Start Custom Order
        </Link>
      </section>

      <div className="bg-cream py-6 text-center italic text-navy/60">
        {config.footerContent}
      </div>
    </div>
  );
};

export default Home;
