import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MOTIVATIONAL_MESSAGES } from '../constants';
import { apiService } from '../services/api';
import { SiteConfig, GalleryItem, GalleryConfig } from '../types';

const Home: React.FC = () => {
  const [msgIndex, setMsgIndex] = useState(0);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [galleryConfig, setGalleryConfig] = useState<GalleryConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const liveConfig = await apiService.getLiveConfig();
        setConfig(liveConfig.siteSettings);
        setGallery(liveConfig.siteSettings?.featuredFits || []);
      } catch (err) {
        console.error("Failed to fetch home data", err);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-12 h-12 border-4 border-navy border-t-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream text-navy p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">System Temporarily Unavailable</h2>
        <p className="mb-8">We are currently updating our collection. Please check back in a few minutes.</p>
        <button onClick={() => window.location.reload()} className="bg-navy text-gold px-8 py-3 rounded-xl font-bold">Retry Connection</button>
      </div>
    );
  }

  const getHeroBackground = () => {
    if (config.heroBgType === 'upload' && config.heroBgUpload) {
      return config.heroBgUpload;
    }
    return config.heroBgUrl;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header 
        className="min-h-screen flex items-center justify-center text-center px-4 py-20 transition-all duration-1000 relative"
        style={{
          background: `linear-gradient(rgba(26,43,76,0.7), rgba(26,43,76,0.7)), url('${getHeroBackground()}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-4xl animate-fade-in z-10">
          <h1 className="text-4xl md:text-7xl font-bold text-gold mb-6 drop-shadow-2xl whitespace-pre-line font-belina leading-tight px-2">
            {config.heroTitle}
          </h1>
          <p className="text-lg md:text-2xl text-white mb-10 font-medium px-4">
            {config.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 px-6">
            <Link to="/catalog" className="w-full sm:w-auto bg-copper text-white px-10 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-2xl">
              {config.shopButtonText}
            </Link>
            <Link to="/affiliate" className="w-full sm:w-auto bg-white text-navy px-10 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-2xl">
              Affiliate Dashboard
            </Link>
          </div>
          <div className="mt-12 h-8">
             <p className="text-gold italic text-lg transition-opacity duration-1000 font-belina px-4">
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

      {/* Craft Strip */}
      <section className="bg-cream py-20 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-12">
          <div className="text-center group">
            <div className="w-20 h-20 bg-navy rounded-full flex items-center justify-center mb-4 mx-auto group-hover:bg-copper transition-colors shadow-lg">
              <span className="text-3xl">🧶</span>
            </div>
            <h3 className="font-bold text-navy text-xl">Quality Fabrics</h3>
          </div>
          <div className="text-center group">
            <div className="w-20 h-20 bg-navy rounded-full flex items-center justify-center mb-4 mx-auto group-hover:bg-copper transition-colors shadow-lg">
              <span className="text-3xl">🧵</span>
            </div>
            <h3 className="font-bold text-navy text-xl">Expert Tailoring</h3>
          </div>
          <div className="text-center group">
            <div className="w-20 h-20 bg-navy rounded-full flex items-center justify-center mb-4 mx-auto group-hover:bg-copper transition-colors shadow-lg">
              <span className="text-3xl">🇳🇬</span>
            </div>
            <h3 className="font-bold text-navy text-xl">Made in Nigeria</h3>
          </div>
        </div>
      </section>

      {/* Featured Fits Section */}
      {gallery.length > 0 && (
        <section className="py-24 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-navy font-belina mb-2">Signature Gallery</h2>
              <p className="text-navy/40 font-bold uppercase tracking-widest text-xs">Curated style statements</p>
            </div>
            
            <div 
              className={`grid gap-6 md:gap-8 ${
                config.galleryLayoutStyle === 'grid' 
                  ? `grid-cols-1 md:grid-cols-${config.galleryColumns || 3}` 
                  : config.galleryLayoutStyle === 'asymmetric'
                  ? 'grid-cols-1 md:grid-cols-4'
                  : 'flex overflow-x-auto pb-8 snap-x'
              }`}
              style={{ gap: `${config.gallerySpacing || 4}px` }}
            >
              {gallery.filter(item => item.visibility !== false).map((item, idx) => (
                <div 
                  key={item.id} 
                  className={`relative group rounded-3xl overflow-hidden shadow-2xl border-4 border-navy/5 ${
                    config.galleryLayoutStyle === 'carousel' ? 'min-w-[300px] snap-center' : ''
                  } ${
                    config.galleryLayoutStyle === 'asymmetric' 
                      ? (idx % 5 === 0 ? 'md:col-span-2 md:row-span-2' : '')
                      : ''
                  } ${
                    item.layoutType === 'wide' ? 'md:col-span-2' : 
                    item.layoutType === 'tall' ? 'md:row-span-2' : 
                    item.layoutType === 'bold' ? 'border-gold shadow-gold/20' : ''
                  } aspect-[3/4]`}
                >
                  <img 
                    src={item.image} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    alt={item.title}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/20 to-transparent opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6 md:p-10">
                    <h4 className="font-bold text-gold font-belina text-xl md:text-2xl">
                      {item.title}
                    </h4>
                    <p className="text-white mt-2 max-w-sm text-sm md:text-base">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="bg-navy py-24 px-6 text-center text-white relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-gold/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-copper/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gold font-belina">Your Fit, Your Way</h2>
          <p className="text-lg md:text-xl mb-10 text-white/80">Contact us at {config.contactPhone} or {config.contactEmail} for custom measurement sessions.</p>
          <Link to="/catalog" className="inline-block bg-copper px-10 py-5 rounded-2xl font-bold text-lg md:text-xl hover:bg-burntOrange transition-colors shadow-2xl border border-white/10">
            Start Custom Order
          </Link>
        </div>
      </section>

      <div className="bg-cream py-6 text-center italic text-navy/60 font-medium px-4">
        {config.footerContent}
      </div>
    </div>
  );
};

export default Home;
