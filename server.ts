import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Public Ingest for n8n
  app.post("/api/public/ingest", async (req, res) => {
    if (!supabase) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    const { 
      title, 
      price, 
      old_price, 
      discount, 
      image, 
      category, 
      brand, 
      affiliate_url, 
      original_url 
    } = req.body;

    if (!title || !price || !affiliate_url) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const slug = title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      
      const { data, error } = await supabase
        .from('products')
        .upsert({
          title,
          slug,
          price,
          old_price,
          discount,
          image,
          category,
          brand,
          affiliate_url,
          original_url,
          active: true,
          created_at: new Date().toISOString()
        }, { onConflict: 'slug' })
        .select();

      if (error) throw error;

      res.status(201).json({ success: true, data });
    } catch (error: any) {
      console.error("Ingest error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ForgeDeals Server running on http://localhost:${PORT}`);
  });
}

startServer();
