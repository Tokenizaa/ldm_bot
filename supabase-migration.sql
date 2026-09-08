-- System configuration table for frontend-controlled settings
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Allow read for anon key (frontend needs to read config)
CREATE POLICY "Allow public read access" ON system_config
  FOR SELECT USING (true);

-- Only service role can write config
CREATE POLICY "Allow service role write" ON system_config
  FOR ALL USING (auth.role() = 'service_role');

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);

-- Insert default config on first run (upsert handles duplicates)
INSERT INTO system_config (key, config, updated_at)
VALUES (
  'main',
  '{
    "facebook": {
      "postsPerDay": 10,
      "delayBetweenPosts": 120,
      "activeHours": [9, 13, 17, 20],
      "activeGroups": [
        { "id": "1", "name": "Ferramentas Profissionais", "limit": 3, "active": true },
        { "id": "2", "name": "Mecânicos Brasil", "limit": 2, "active": true }
      ],
      "defaultCTA": "Confira esta oferta! 👉",
      "mode": "safe",
      "humanizationLevel": 75
    },
    "ollama": {
      "activeModel": "llama3:8b",
      "temperature": 0.7,
      "maxTokens": 150,
      "copyStyle": "enthusiastic",
      "useEmojis": true,
      "includeCTA": true,
      "writingTone": "promotional"
    },
    "crawler": {
      "activeCategories": [
        { "id": "maquinas-eletricas", "name": "Ferramentas Elétricas", "url": "https://www.lojadomecanico.com.br/categorias/21/maquinas-eletricas", "priority": 1 },
        { "id": "ferramentas-manuais", "name": "Ferramentas Manuais", "url": "https://www.lojadomecanico.com.br/categorias/2/ferramentas-manuais-para-oficinas", "priority": 2 }
      ],
      "maxProducts": 10,
      "scrapingDelay": 2,
      "minScore": 30,
      "priorityCategories": ["maquinas-eletricas"]
    },
    "planning": {
      "promotionalPosts": 4,
      "educationalPosts": 3,
      "engagementPosts": 2,
      "institutionalPosts": 1,
      "totalDailyPosts": 10,
      "rotationStrategy": "balanced"
    },
    "system": {
      "autoStart": false,
      "logLevel": "info",
      "backupEnabled": true,
      "emergencyStop": true,
      "cdpPort": 9222
    }
  }'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- Affiliate links table (if not exists)
CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  affiliate_url TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  current_price DECIMAL(10,2) NOT NULL,
  previous_price DECIMAL(10,2) NOT NULL,
  lowest_price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  monitored BOOLEAN DEFAULT true,
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  price_drop_percentage DECIMAL(5,2) DEFAULT 0,
  opportunity_score DECIMAL(5,2) DEFAULT 0,
  last_price_change TIMESTAMPTZ
);

ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON affiliate_links FOR SELECT USING (true);
CREATE POLICY "Allow service role write" ON affiliate_links FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_affiliate_links_affiliate_url ON affiliate_links(affiliate_url);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_category ON affiliate_links(category);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_brand ON affiliate_links(brand);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_monitored ON affiliate_links(monitored);

-- Price history table
CREATE TABLE IF NOT EXISTS affiliate_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id UUID REFERENCES affiliate_links(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  price_change DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE affiliate_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON affiliate_price_history FOR SELECT USING (true);
CREATE POLICY "Allow service role write" ON affiliate_price_history FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_affiliate_price_history_link_id ON affiliate_price_history(affiliate_link_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_price_history_created_at ON affiliate_price_history(created_at);

-- Crawler logs table
CREATE TABLE IF NOT EXISTS crawler_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failure')),
  total_products INTEGER DEFAULT 0,
  new_products INTEGER DEFAULT 0,
  updated_products INTEGER DEFAULT 0,
  ignored_products INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE crawler_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON crawler_logs FOR SELECT USING (true);
CREATE POLICY "Allow service role write" ON crawler_logs FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_crawler_logs_created_at ON crawler_logs(created_at);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES affiliate_links(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('telegram', 'whatsapp', 'instagram', 'facebook')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'published', 'failed')),
  content TEXT,
  group_name TEXT,
  post_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON posts FOR SELECT USING (true);
CREATE POLICY "Allow service role write" ON posts FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);