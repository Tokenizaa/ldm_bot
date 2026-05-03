-- SQL para rodar no Editor SQL do Supabase
-- Isso criará a estrutura necessária para o ForgeDeals AI

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image TEXT,
  price NUMERIC NOT NULL,
  old_price NUMERIC,
  discount NUMERIC,
  category TEXT,
  brand TEXT,
  affiliate_url TEXT NOT NULL,
  original_url TEXT,
  ai_description TEXT,
  ai_score NUMERIC DEFAULT 0,
  is_hot BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Histórico de Preços
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Posts de Redes Sociais
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'telegram', 'whatsapp', etc
  status TEXT NOT NULL DEFAULT 'pending',
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Logs do Crawler
CREATE TABLE IF NOT EXISTS crawler_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT,
  status TEXT,
  total_products INTEGER,
  new_products INTEGER DEFAULT 0,
  updated_products INTEGER DEFAULT 0,
  ignored_products INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Links de Afiliados Capturados
CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_name TEXT NOT NULL,
  affiliate_url TEXT NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  current_price NUMERIC,
  category TEXT,
  brand TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Funções de RPC para estatísticas (usadas no código TS)
CREATE OR REPLACE FUNCTION increment_views(product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products 
  SET views = views + 1,
      ctr = CASE WHEN views + 1 > 0 THEN (clicks::numeric / (views + 1)) * 100 ELSE 0 END
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_clicks(product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products 
  SET clicks = clicks + 1,
      ctr = CASE WHEN views > 0 THEN ((clicks + 1)::numeric / views) * 100 ELSE 0 END
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Ativar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE price_history;

-- 7. Policies (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access" ON price_history FOR SELECT USING (true);
