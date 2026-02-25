import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "db.json");

const DEFAULT_DB = {
  catalogs: [],
  gallery: [],
  galleryConfig: {
    layout: 'grid',
    columns: 3,
    displayCount: 6,
    visible: true
  },
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
    }
  }
};

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DB, null, 2));
}

function getDB() {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(data);
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
    return req.headers.authorization?.includes('Bearer');
  };

  // --- CATALOG API ---
  app.get("/api/catalogs", (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || 12;
    const admin = isAdmin(req);
    
    if (limit > 100) limit = 100;
    const offset = (page - 1) * limit;
    
    const db = getDB();
    let products = db.catalogs || [];
    
    if (!admin) {
      products = products.filter((p: any) => p.published === true);
    }
    
    // Sort by orderIndex if exists, otherwise by createdAt DESC
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
    const index = db.catalogs.findIndex((p: any) => p.id === newProduct.id);
    
    if (index !== -1) {
      db.catalogs[index] = newProduct;
    } else {
      db.catalogs.push(newProduct);
    }
    
    saveDB(db);
    res.json(newProduct);
  });

  app.delete("/api/catalogs/:id", (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    
    const { id } = req.params;
    const db = getDB();
    db.catalogs = db.catalogs.filter((p: any) => p.id !== id);
    saveDB(db);
    res.json({ success: true });
  });

  // --- GALLERY API ---
  app.get("/api/gallery", (req, res) => {
    const db = getDB();
    const admin = isAdmin(req);
    
    if (!admin && !db.galleryConfig.visible) {
      return res.json({ items: [], config: db.galleryConfig });
    }

    const items = [...(db.gallery || [])].sort((a, b) => a.orderIndex - b.orderIndex);
    res.json({ items, config: db.galleryConfig });
  });

  app.post("/api/gallery", (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const { items, config } = req.body;
    const db = getDB();
    if (items) db.gallery = items;
    if (config) db.galleryConfig = config;
    saveDB(db);
    res.json({ success: true });
  });

  // --- SITE SETTINGS API ---
  app.get("/api/settings", (req, res) => {
    const db = getDB();
    res.json(db.siteSettings);
  });

  app.post("/api/settings", (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const db = getDB();
    db.siteSettings = { ...db.siteSettings, ...req.body };
    saveDB(db);
    res.json(db.siteSettings);
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
