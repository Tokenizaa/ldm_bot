-- FORGEDEALS BOT - SUPABASE SCHEMA
-- Schema simples e direto para operação do bot

-- Tabela de Produtos
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    old_price DECIMAL(10,2) NOT NULL,
    image TEXT NOT NULL,
    affiliate_url TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Posts
CREATE TABLE posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    facebook_post_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'posted', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_created_at ON products(created_at);

-- Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (ajustar conforme necessidade)
-- Por enquanto, permitir tudo para desenvolvimento
CREATE POLICY "Enable all operations for all users" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for all users" ON posts FOR ALL USING (true) WITH CHECK (true);
