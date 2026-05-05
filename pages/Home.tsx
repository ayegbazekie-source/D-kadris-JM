import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MOTIVATIONAL_MESSAGES } from '../constants';
import { apiService } from '../services/api';
import { SiteConfig, GalleryItem } from '../types';

// Default fallback config
const DEFAULT_CONFIG: SiteConfig = {
  heroTitle: "D-Kadris Denims",
  heroSubtitle: "Premium denim crafted for you",
  shopButtonText: "Shop Now",
  brandQuote: "Crafted with precision and style",
  contactPhone: "+2348163914835",
  contactEmail: "dkadristailoringservice@gmail.com",
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

  // Featured spotlight rotation (restores old "live homepage feel")
  const [activeFeaturedIndex, setActiveFeaturedIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const liveConfig = await apiService.getLiveConfig();
        const safeSettings = liveConfig?.siteSettings || DEFAULT_CONFIG;

        setConfig(safeSettings);
        setGallery(safeSettings.featuredFits || []);
      } catch (err) {
        console.error("Failed to fetch home data", err);
        setConfig(DEFAULT_CONFIG);
        setGallery([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Motivational message rotation
    const msgInterval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MOTIVATIONAL_MESSAGES.length);
    }, 4000);

    return () => clearInterval(msgInterval);
  }, []);

  // Featured auto-rotation (old homepage dynamic feel)
  useEffect(() => {
    if (gallery.length === 0) return;

    const interval = setInterval(() => {
      setActiveFeaturedIndex((prev) => (prev + 1) % gallery.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [gallery]);

  const getHeroBackground = () => {
    if (config.heroBgType === 'upload' && config.heroBgUpload) {
      return config.heroBgUpload;
    }
    if (config.heroBgUrl) return config.heroBgUrl;
    return null;
  };

  const heroBg = getHeroBackground();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-12 h-12 border-4 border-navy border-t-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeFeatured =
    gallery.length > 0 ? gallery[activeFeaturedIndex] : null;

  return (
    <div className="min-h-screen flex flex-col">

      {/* HERO SECTION */}
      <header
        className="min-h-screen flex items-center justify-center text-center px-4 py-20 relative"
        style={{
          background: heroBg
            ? `linear-gradient(rgba(26,43,76,0.75), rgba(26,43,76,0.75)), url('${heroBg}')`
            : 'linear-gradient(135deg, #1a2b4c, #0f172a)',
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
            <Link
              to="/catalog"
              className="w-full sm:w-auto bg-copper text-white px-10 py-4 rounded-xl font-bold text-lg"
            >
              {config.shopButtonText}
            </Link>

            <Link
              to="/affiliate"
              className="w-full sm:w-auto bg-white text-navy px-10 py-4 rounded-xl font-bold text-lg"
            >
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

      {/* BRAND STORY */}
      <section className="bg-navy py-16 text-center">
        <p className="text-gold text-xl md:text-2xl font-belina italic px-6 max-w-4xl mx-auto">
          {config.brandQuote}
        </p>
      </section>

      {/* FEATURED FIT SPOTLIGHT (RESTORED OLD FEEL) */}
      {activeFeatured && (
        <section className="py-20 bg-white px-4">
          <div className="max-w-5xl mx-auto text-center">

            <h2 className="text-3xl font-bold text-navy mb-6">
              Featured Fit
            </h2>

            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img
                src={activeFeatured.image}
                alt={activeFeatured.title}
                className="w-full h-[500px] object-cover"
              />

              <div className="p-6">
                <h3 className="text-xl font-bold text-navy">
                  {activeFeatured.title}
                </h3>
                <p className="text-gray-600 mt-2">
                  {activeFeatured.description}
                </p>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* FEATURED GALLERY GRID */}
      {gallery.length > 0 && (
        <section className="py-20 px-4 bg-gray-50">
          <div
            className={`max-w-6xl mx-auto grid gap-6`}
            style={{
              gridTemplateColumns: `repeat(${config.galleryColumns || 3}, minmax(0, 1fr))`
            }}
          >
            {gallery.map((item) => (
              <div
                key={item.id}
                className="rounded-xl overflow-hidden shadow-lg bg-white"
              >
                <img
                  src={item.image}
                  className="w-full h-[400px] object-cover"
                  alt={item.title}
                />
                <div className="p-4">
                  <h4 className="font-bold text-navy">{item.title}</h4>
                  <p className="text-sm text-gray-600">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-navy py-20 text-center text-white">
        <h2 className="text-3xl font-bold mb-4 text-gold">
          Your Fit, Your Way
        </h2>

        <p className="mb-6">
          Contact us at {config.contactPhone} or {config.contactEmail}
        </p>

        <Link
          to="/catalog"
          className="bg-copper px-8 py-4 rounded-xl font-bold"
        >
          Start Custom Order
        </Link>
      </section>

      {/* FOOTER */}
      <div className="bg-cream py-6 text-center italic text-navy/60">
        {config.footerContent}
      </div>

    </div>
  );
};

export default Home;
