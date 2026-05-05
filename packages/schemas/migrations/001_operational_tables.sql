-- Operational tables for ForgeDeals (minimal v1)

-- Jobs/executions
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  queue text not null,
  name text not null,
  idempotency_key text unique,
  status text not null default 'queued',
  attempts int not null default 0,
  max_attempts int not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_queue_status_idx on jobs(queue, status);
create index if not exists jobs_created_at_idx on jobs(created_at desc);

create table if not exists executions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  worker_id text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  success boolean,
  error text,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists executions_job_id_idx on executions(job_id);
create index if not exists executions_started_at_idx on executions(started_at desc);

-- Publication logs
create table if not exists publication_logs (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  group_id text,
  post_id text,
  status text not null,
  payload jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists publication_logs_platform_created_idx on publication_logs(platform, created_at desc);

-- AI generations
create table if not exists ai_generations (
  id uuid primary key default gen_random_uuid(),
  model text not null,
  purpose text not null,
  input_hash text,
  prompt text,
  output text,
  latency_ms int,
  created_at timestamptz not null default now()
);

create index if not exists ai_generations_model_created_idx on ai_generations(model, created_at desc);
create index if not exists ai_generations_input_hash_idx on ai_generations(input_hash);

-- Cooldown registry
create table if not exists cooldown_registry (
  id uuid primary key default gen_random_uuid(),
  scope text not null, -- e.g. "facebook:group", "facebook:account"
  key text not null,
  cooldown_until timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(scope, key)
);

create index if not exists cooldown_registry_until_idx on cooldown_registry(cooldown_until);

-- Engagement metrics
create table if not exists engagement_metrics (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  group_id text,
  post_id text not null,
  metric text not null, -- like, comment, share, click, view
  value numeric not null default 0,
  captured_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb
);

create index if not exists engagement_metrics_post_idx on engagement_metrics(post_id, captured_at desc);

