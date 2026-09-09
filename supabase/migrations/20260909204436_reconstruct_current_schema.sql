-- Reconstructed current production schema baseline.
-- This migration was applied to the connected Supabase project through the
-- Supabase MCP on 2026-09-09. It is idempotent so it can also rebuild a clean DB.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.system_config (
  key TEXT PRIMARY KEY, config JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_name TEXT NOT NULL, affiliate_url TEXT NOT NULL, original_url TEXT NOT NULL,
  current_price NUMERIC(10,2) NOT NULL, previous_price NUMERIC(10,2), lowest_price NUMERIC(10,2), category TEXT, brand TEXT,
  monitored BOOLEAN DEFAULT true, last_checked_at TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ DEFAULT NOW(), last_price_change TIMESTAMPTZ,
  price_drop_percentage NUMERIC(5,2) DEFAULT 0, opportunity_score NUMERIC(5,2) DEFAULT 0, product_identity_key TEXT
);
CREATE TABLE IF NOT EXISTS public.affiliate_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), affiliate_link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL, price_change NUMERIC(10,2) DEFAULT 0, checked_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.crawler_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), category_id TEXT, category_name TEXT, products_found INTEGER DEFAULT 0,
  products_saved INTEGER DEFAULT 0, status TEXT CHECK (status = ANY (ARRAY['success','partial','failed'])), error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(), finished_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS public.monthly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), period_start DATE NOT NULL, period_end DATE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo', posts_per_day SMALLINT NOT NULL DEFAULT 5, total_posts INTEGER NOT NULL DEFAULT 150,
  status TEXT NOT NULL DEFAULT 'draft', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT monthly_plans_period_check CHECK (period_end = period_start + 29),
  CONSTRAINT monthly_plans_posts_per_day_check CHECK (posts_per_day = 5),
  CONSTRAINT monthly_plans_total_posts_check CHECK (total_posts = 150),
  CONSTRAINT monthly_plans_status_check CHECK (status = ANY (ARRAY['draft','partial','generating','ready','scheduling','scheduled','published','completed','completed_with_errors','failed','cancelled']))
);
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), group_id TEXT NOT NULL, group_name TEXT, content TEXT NOT NULL, link TEXT, image_url TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL, published_at TIMESTAMPTZ, status TEXT DEFAULT 'scheduled', facebook_post_id TEXT,
  affiliate_link_id UUID REFERENCES public.affiliate_links(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT NOW(),
  plan_id UUID REFERENCES public.monthly_plans(id) ON DELETE SET NULL, slot_index SMALLINT, post_type TEXT, attempts INTEGER NOT NULL DEFAULT 0,
  error_message TEXT, publishing_started_at TIMESTAMPTZ, last_attempt_at TIMESTAMPTZ,
  CONSTRAINT posts_status_check CHECK (status = ANY (ARRAY['draft','scheduled','publishing','published','failed','cancelled']))
);
CREATE TABLE IF NOT EXISTS public.publication_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), affiliate_link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  product_identity_key TEXT NOT NULL, post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES public.monthly_plans(id) ON DELETE SET NULL, group_id TEXT, published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled', content_hash TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), scheduled_at TIMESTAMPTZ,
  CONSTRAINT publication_history_status_check CHECK (status = ANY (ARRAY['generated','scheduled','publishing','published','failed']))
);

ALTER TABLE public.affiliate_links ADD COLUMN IF NOT EXISTS product_identity_key TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS group_id TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS facebook_post_id TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS affiliate_link_id UUID;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS plan_id UUID;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS slot_index SMALLINT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS post_type TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS publishing_started_at TIMESTAMPTZ;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ;
ALTER TABLE public.publication_history ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS affiliate_links_identity_uq ON public.affiliate_links(product_identity_key);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_affiliate_url ON public.affiliate_links(affiliate_url);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_category ON public.affiliate_links(category);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_monitored ON public.affiliate_links(monitored);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_opportunity_score ON public.affiliate_links(opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_price_history_link_id ON public.affiliate_price_history(affiliate_link_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_price_history_checked_at ON public.affiliate_price_history(checked_at);
CREATE INDEX IF NOT EXISTS idx_crawler_logs_started_at ON public.crawler_logs(started_at);
CREATE UNIQUE INDEX IF NOT EXISTS monthly_plans_period_start_uq ON public.monthly_plans(period_start);
CREATE INDEX IF NOT EXISTS idx_posts_affiliate_link_id ON public.posts(affiliate_link_id);
CREATE INDEX IF NOT EXISTS idx_posts_group_id ON public.posts(group_id);
CREATE INDEX IF NOT EXISTS idx_posts_plan_id ON public.posts(plan_id);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON public.posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_status_scheduled_at ON public.posts(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_posts_last_attempt_at ON public.posts(last_attempt_at);
CREATE INDEX IF NOT EXISTS idx_posts_plan_slot ON public.posts(plan_id, slot_index);
CREATE INDEX IF NOT EXISTS idx_posts_due_scheduled ON public.posts(scheduled_at, status) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_posts_publishing_started_at ON public.posts(publishing_started_at) WHERE status = 'publishing';
CREATE UNIQUE INDEX IF NOT EXISTS posts_plan_affiliate_uq ON public.posts(plan_id, affiliate_link_id);
CREATE UNIQUE INDEX IF NOT EXISTS posts_plan_slot_uq ON public.posts(plan_id, slot_index);
CREATE UNIQUE INDEX IF NOT EXISTS posts_plan_schedule_uidx ON public.posts(plan_id, scheduled_at) WHERE plan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS posts_plan_status_schedule_idx ON public.posts(plan_id, status, scheduled_at) WHERE plan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_publication_history_affiliate ON public.publication_history(affiliate_link_id);
CREATE INDEX IF NOT EXISTS idx_publication_history_identity ON public.publication_history(product_identity_key);
CREATE INDEX IF NOT EXISTS idx_publication_history_post_status ON public.publication_history(post_id, status);
CREATE INDEX IF NOT EXISTS idx_publication_history_published_at ON public.publication_history(published_at);
CREATE UNIQUE INDEX IF NOT EXISTS publication_history_post_uq ON public.publication_history(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_system_config_key ON public.system_config(key);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='posts_affiliate_link_fk') THEN ALTER TABLE public.posts ADD CONSTRAINT posts_affiliate_link_fk FOREIGN KEY (affiliate_link_id) REFERENCES public.affiliate_links(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='posts_plan_fk') THEN ALTER TABLE public.posts ADD CONSTRAINT posts_plan_fk FOREIGN KEY (plan_id) REFERENCES public.monthly_plans(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='publication_history_affiliate_link_id_fkey') THEN ALTER TABLE public.publication_history ADD CONSTRAINT publication_history_affiliate_link_id_fkey FOREIGN KEY (affiliate_link_id) REFERENCES public.affiliate_links(id) ON DELETE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='publication_history_plan_id_fkey') THEN ALTER TABLE public.publication_history ADD CONSTRAINT publication_history_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.monthly_plans(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='publication_history_post_id_fkey') THEN ALTER TABLE public.publication_history ADD CONSTRAINT publication_history_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE SET NULL; END IF;
END $$;

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawler_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='system_config' AND policyname='Allow public read access') THEN CREATE POLICY "Allow public read access" ON public.system_config FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='system_config' AND policyname='Allow service role write') THEN CREATE POLICY "Allow service role write" ON public.system_config FOR ALL USING (auth.role()='service_role'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='affiliate_links' AND policyname='Allow public read access') THEN CREATE POLICY "Allow public read access" ON public.affiliate_links FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='affiliate_links' AND policyname='Allow service role write') THEN CREATE POLICY "Allow service role write" ON public.affiliate_links FOR ALL USING (auth.role()='service_role'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='affiliate_price_history' AND policyname='Allow public read access') THEN CREATE POLICY "Allow public read access" ON public.affiliate_price_history FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='affiliate_price_history' AND policyname='Allow service role write') THEN CREATE POLICY "Allow service role write" ON public.affiliate_price_history FOR ALL USING (auth.role()='service_role'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='crawler_logs' AND policyname='Allow public read access') THEN CREATE POLICY "Allow public read access" ON public.crawler_logs FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='crawler_logs' AND policyname='Allow service role write') THEN CREATE POLICY "Allow service role write" ON public.crawler_logs FOR ALL USING (auth.role()='service_role'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='monthly_plans' AND policyname='Service role manages monthly plans') THEN CREATE POLICY "Service role manages monthly plans" ON public.monthly_plans FOR ALL TO service_role USING (true) WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='posts' AND policyname='Service role manages posts') THEN CREATE POLICY "Service role manages posts" ON public.posts FOR ALL TO service_role USING (true) WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='publication_history' AND policyname='service role manages publication history') THEN CREATE POLICY "service role manages publication history" ON public.publication_history FOR ALL TO service_role USING (true) WITH CHECK (true); END IF;
END $$;

INSERT INTO public.system_config (key, config, updated_at) VALUES ('main', '{"facebook":{"postsPerDay":10,"delayBetweenPosts":120,"activeHours":[9,13,17,20],"activeGroups":[],"defaultCTA":"Confira esta oferta! 👉","mode":"safe","humanizationLevel":75},"system":{"autoStart":false,"logLevel":"info","backupEnabled":true,"emergencyStop":true,"cdpPort":9222}}'::jsonb, NOW()) ON CONFLICT (key) DO NOTHING;