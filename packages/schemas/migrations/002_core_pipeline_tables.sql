-- Core pipeline tables (Supabase-first MVP)

-- Products (if you already have it, keep existing and adjust manually)
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  image text,
  price numeric not null,
  old_price numeric,
  discount numeric,
  category text,
  brand text,
  affiliate_url text,
  original_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_created_at_idx on products(created_at desc);
create index if not exists products_brand_idx on products(brand);
create index if not exists products_category_idx on products(category);

-- scheduled_posts: the operational heart
create table if not exists scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  platform text not null default 'facebook',
  type text not null, -- offer|question|review|...
  content text not null,
  scheduled_for timestamptz not null,
  status text not null default 'pending', -- pending|locked|published|failed|cancelled
  locked_by text,
  locked_at timestamptz,
  attempts int not null default 0,
  max_attempts int not null default 3,
  last_error text,
  published_at timestamptz,
  facebook_post_url text,
  risk_score numeric,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scheduled_posts_status_time_idx on scheduled_posts(status, scheduled_for);
create index if not exists scheduled_posts_product_idx on scheduled_posts(product_id);

-- publication logs (append-only)
create table if not exists publication_logs (
  id uuid primary key default gen_random_uuid(),
  scheduled_post_id uuid references scheduled_posts(id) on delete set null,
  platform text not null,
  group_id text,
  status text not null, -- ok|failed|skipped
  payload jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists publication_logs_created_at_idx on publication_logs(created_at desc);

-- cooldown registry: anti-spam minimal enforcement
create table if not exists cooldown_registry (
  id uuid primary key default gen_random_uuid(),
  scope text not null, -- facebook:group | facebook:account
  key text not null,
  cooldown_until timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(scope, key)
);

create index if not exists cooldown_registry_scope_key_idx on cooldown_registry(scope, key);
create index if not exists cooldown_registry_until_idx on cooldown_registry(cooldown_until);

-- engagement metrics (append-only)
create table if not exists engagement_metrics (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  group_id text,
  post_url text,
  metric text not null, -- click|like|comment|share|view
  value numeric not null default 0,
  captured_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb
);

create index if not exists engagement_metrics_platform_time_idx on engagement_metrics(platform, captured_at desc);
create index if not exists engagement_metrics_post_url_idx on engagement_metrics(post_url);

