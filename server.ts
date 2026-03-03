import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "db.json");

const DEFAULT_CONFIG = {
  catalogs: [],
  siteSettings: {
    logoText: 'D-Kadris',
    logoType: 'text',
    logoWidth: 150,
    logoHeight: 50,
    heroTitle: 'Authentic Denim.\nTailored in Nigeria.\nWorn by You.',
    heroSubtitle: 'Premium jeans crafted with pride.',
    heroBgType: 'url',
    heroBgUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=2000&auto=format&fit=crop',
    shopButtonText: 'Shop Collection',
    brandQuote: '"Every stitch tells a story of Nigerian craftsmanship."',
    facebookUrl: 'https://www.facebook.com/profile.php?id=61559673571368',
    instagramUrl: 'https://www.instagram.com/dkadris_tailoring?igsh=MW1jM2xud2Y1YW1xdw==',
    tiktokUrl: 'https://www.tiktok.com/@dkadris.tailoring?_r=1&_t=ZS-93ZAREPRK4L',
    footerContent: 'Ready-to-wear sizes also available in all major cities.',
    contactEmail: 'info@dkadris.com',
    contactPhone: '+234 816 391 4835',
    featureToggles: {
      enablePayments: false,
      enableVendorAccounts: false,
      enableBulkOrders: false,
      enableCommissions: false,
      enableAffiliateWithdrawals: false
    },
    featuredFits: [],
    galleryLayoutStyle: 'grid',
    gallerySpacing: 4,
    galleryColumns: 3,
    isMaintenance: false
  }
};

const DEFAULT_DB = {
  draft: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
  live: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
  orders: [],
  affiliates: {},
  payouts: [],
  customers: {} // Track customer purchase history: { email: { purchaseCount: number } }
};

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DB, null, 2));
}

function getDB() {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    const db = JSON.parse(data);
    
    const migrateProducts = (products: any[]) => {
      return (products || []).map(p => ({
        ...p,
        categories: p.categories || (p.category ? [p.category] : []),
        published: p.published ?? true,
        whitelisted: p.whitelisted ?? true
      }));
    };

    // Migration for old structure or missing fields
    if (!db.draft || !db.live || !db.draft.siteSettings || !db.live.siteSettings) {
      const oldConfig = {
        catalogs: migrateProducts(db.catalogs || db.draft?.catalogs || []),
        siteSettings: {
          ...DEFAULT_CONFIG.siteSettings,
          ...(db.siteSettings || db.draft?.siteSettings || db.live?.siteSettings || {})
        }
      };
      // If old gallery exists, migrate it to featuredFits
      if (db.gallery && oldConfig.siteSettings) {
        oldConfig.siteSettings.featuredFits = db.gallery.map((item: any) => ({
          ...item,
          layoutType: item.layoutType || 'standard',
          order: item.orderIndex || 0,
          visibility: true
        }));
      }
      return {
        ...DEFAULT_DB,
        ...db,
        draft: JSON.parse(JSON.stringify(oldConfig)),
        live: JSON.parse(JSON.stringify(oldConfig))
      };
    }

    // Ensure categories exists even if draft/live already exist
    if (db.draft) db.draft.catalogs = migrateProducts(db.draft.catalogs);
    if (db.live) db.live.catalogs = migrateProducts(db.live.catalogs);
    
    return db;
  } catch (err) {
    return DEFAULT_DB;
  }
}

function saveDB(db: any) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Middleware to check admin auth
  const isAdmin = (req: express.Request) => {
    const auth = req.headers.authorization;
    if (!auth) return false;
    // Handle both "Bearer <token>" and "<token>" formats, case-insensitive
    const token = auth.toLowerCase().replace('bearer ', '').trim();
    return token === 'mock-token-dkadris';
  };

  // --- DRAFT & LIVE API ---
  app.get("/api/draft-config", (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized: Admin access required' });
    const db = getDB();
    res.json(db.draft);
  });

  app.post("/api/update-draft", (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized: Admin access required' });
    const db = getDB();
    db.draft = { ...db.draft, ...req.body };
    saveDB(db);
    res.json(db.draft);
  });

  app.get("/api/live-config", (req, res) => {
    const db = getDB();
    res.json(db.live);
  });

  app.post("/api/publish", (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized: Admin access required' });
    const db = getDB();
    db.live = JSON.parse(JSON.stringify(db.draft));
    saveDB(db);
    res.json({ success: true, live: db.live });
  });

  // --- CATALOG API (Legacy/Compatibility) ---
  app.get("/api/catalogs", (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || 12;
    const admin = isAdmin(req);
    
    if (limit > 100) limit = 100;
    const offset = (page - 1) * limit;
    
    const db = getDB();
    // Admin reads from draft, public reads from live
    const config = admin ? db.draft : db.live;
    let products = config.catalogs || [];
    
    if (!admin) {
      products = products.filter((p: any) => p.published === true);
    }
    
    const sortedProducts = [...products].sort((a, b) => {
      if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
        return a.orderIndex - b.orderIndex;
      }
      return b.createdAt - a.createdAt;
    });
    
    const paginatedProducts = sortedProducts.slice(offset, offset + limit);
    
    res.json({
      data: paginatedProducts,
      total: products.length,
      page,
      limit,
      hasMore: offset + limit < products.length
    });
  });

  app.post("/api/catalogs", (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    
    const newProduct = req.body;
    if (!newProduct.id) newProduct.id = Math.random().toString(36).substr(2, 9);
    if (!newProduct.createdAt) newProduct.createdAt = Date.now();
    
    const db = getDB();
    const index = db.draft.catalogs.findIndex((p: any) => p.id === newProduct.id);
    
    if (index !== -1) {
      db.draft.catalogs[index] = newProduct;
    } else {
      db.draft.catalogs.push(newProduct);
    }
    
    saveDB(db);
    res.json(newProduct);
  });

  app.delete("/api/catalogs/:id", (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    
    const { id } = req.params;
    const db = getDB();
    db.draft.catalogs = db.draft.catalogs.filter((p: any) => p.id !== id);
    saveDB(db);
    res.json({ success: true });
  });

  // --- GALLERY API (Legacy/Compatibility) ---
  app.get("/api/gallery", (req, res) => {
    const db = getDB();
    const admin = isAdmin(req);
    const config = admin ? db.draft : db.live;
    
    const items = [...(config.siteSettings.featuredFits || [])].sort((a, b) => a.order - b.order);
    res.json({ 
      items, 
      config: {
        layout: config.siteSettings.galleryLayoutStyle,
        columns: config.siteSettings.galleryColumns,
        visible: true // Or some other logic
      }
    });
  });

  app.post("/api/gallery", (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const { items, config } = req.body;
    const db = getDB();
    if (items) db.draft.siteSettings.featuredFits = items;
    if (config) {
      db.draft.siteSettings.galleryLayoutStyle = config.layout;
      db.draft.siteSettings.galleryColumns = config.columns;
    }
    saveDB(db);
    res.json({ success: true });
  });

  // --- SITE SETTINGS API (Legacy/Compatibility) ---
  app.get("/api/settings", (req, res) => {
    const db = getDB();
    const admin = isAdmin(req);
    const config = admin ? db.draft : db.live;
    res.json(config.siteSettings);
  });

  app.post("/api/settings", (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const db = getDB();
    db.draft.siteSettings = { ...db.draft.siteSettings, ...req.body };
    saveDB(db);
    res.json(db.draft.siteSettings);
  });

  // --- ORDERS & AFFILIATES API ---
  app.get("/api/admin/orders", (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const db = getDB();
    res.json(db.orders || []);
  });

  app.get("/api/admin/affiliates", (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const db = getDB();
    res.json(db.affiliates || {});
  });

  app.post("/api/admin/orders/:id/approve", (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const db = getDB();
    const orderIndex = db.orders.findIndex((o: any) => o.id === req.params.id);
    if (orderIndex === -1) return res.status(404).json({ error: 'Order not found' });

    const order = db.orders[orderIndex];
    if (order.status === 'paid') return res.status(400).json({ error: 'Order already paid' });

    order.status = 'paid';

    // Commission Logic
    if (order.referrerCode) {
      // Find affiliate by code
      const affiliate = Object.values(db.affiliates).find((a: any) => a.code === order.referrerCode) as any;
      if (affiliate) {
        const customerEmail = order.customerEmail;
        if (!db.customers) db.customers = {};
        if (!db.customers[customerEmail]) {
          db.customers[customerEmail] = { purchaseCount: 0 };
        }

        const isFirstPurchase = db.customers[customerEmail].purchaseCount === 0;
        const commissionRate = isFirstPurchase ? 0.10 : 0.05;
        const commissionAmount = order.total * commissionRate;

        order.commissionRate = commissionRate;
        order.commissionAmount = commissionAmount;

        affiliate.commission = (affiliate.commission || 0) + commissionAmount;
        if (!affiliate.orders) affiliate.orders = [];
        affiliate.orders.push(order.id);

        db.customers[customerEmail].purchaseCount += 1;
      }
    }

    saveDB(db);
    res.json({ success: true, order });
  });

  app.get("/api/admin/payouts", (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const db = getDB();
    res.json(db.payouts || []);
  });

  app.patch("/api/admin/payouts/:id", (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { status } = req.body;
    const db = getDB();
    const payout = db.payouts.find((p: any) => p.id === id);
    if (payout) {
      payout.status = status;
      saveDB(db);
      res.json(payout);
    } else {
      res.status(404).json({ error: 'Payout not found' });
    }
  });

  app.post("/api/orders/track", (req, res) => {
    const order = req.body;
    const db = getDB();
    if (!db.orders) db.orders = [];
    db.orders.push(order);
    
    // Update affiliate commission if applicable
    if (order.referrerCode && db.affiliates) {
      const affiliate = Object.values(db.affiliates).find((a: any) => a.code === order.referrerCode) as any;
      if (affiliate) {
        affiliate.orders.push(order.id);
        affiliate.commission += (order.total * 0.1);
      }
    }
    
    saveDB(db);
    res.json({ success: true });
  });

  app.post("/api/affiliate/signup", (req, res) => {
    const data = req.body;
    const db = getDB();
    if (!db.affiliates) db.affiliates = {};
    
    if (db.affiliates[data.email]) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const newCode = data.name.toLowerCase().split(' ')[0] + Math.floor(Math.random() * 1000);
    const newAffiliate = {
      ...data,
      code: newCode,
      referredAffiliates: [],
      orders: [],
      commission: 0,
      verified: false
    };
    
    db.affiliates[data.email] = newAffiliate;
    saveDB(db);
    res.json({ success: true, user: newAffiliate });
  });

  app.post("/api/affiliate/login", (req, res) => {
    const { email, password } = req.body;
    const db = getDB();
    const affiliate = db.affiliates?.[email];
    
    if (affiliate && affiliate.password === password) {
      res.json({ token: 'mock-affiliate-token', user: affiliate });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.get("/api/affiliate/stats", (req, res) => {
    const { email } = req.query;
    const db = getDB();
    const affiliate = db.affiliates?.[email as string];
    
    if (affiliate) {
      // Also include full order objects for the dashboard
      const affiliateOrders = (db.orders || []).filter((o: any) => affiliate.orders?.includes(o.id));
      res.json({ ...affiliate, orders: affiliateOrders });
    } else {
      res.status(404).json({ error: 'Affiliate not found' });
    }
  });

  // --- AUTH & OTHER ---
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (password === 'admin123') { // Simple mock auth
      res.json({ token: 'mock-token-dkadris' });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
