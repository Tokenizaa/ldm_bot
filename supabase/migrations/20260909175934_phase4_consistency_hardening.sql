-- Fase 4: alinhar o estado persistido com a máquina de publicação implementada.
-- Também remove índices/foreign keys duplicados criados durante as iterações da Fase 3/4.

drop index if exists public.monthly_plans_period_start_uidx;
drop index if exists public.posts_plan_affiliate_uidx;

alter table public.posts drop constraint if exists posts_affiliate_link_id_fkey;
alter table public.posts drop constraint if exists posts_plan_id_fkey;

alter table public.monthly_plans drop constraint if exists monthly_plans_status_check;
alter table public.posts drop constraint if exists posts_status_check;
alter table public.publication_history drop constraint if exists publication_history_status_check;

alter table public.monthly_plans
  add constraint monthly_plans_status_check
  check (status = any (array[
    'draft','partial','generating','ready','scheduling','scheduled',
    'published','completed','completed_with_errors','failed','cancelled'
  ]));

alter table public.posts
  add constraint posts_status_check
  check (status = any (array[
    'draft','scheduled','publishing','published','failed','cancelled'
  ]));

alter table public.publication_history
  add constraint publication_history_status_check
  check (status = any (array[
    'generated','scheduled','publishing','published','failed'
  ]));

-- O serviço de agendamento trata publication_history como relação 1:1 com o post.
create unique index if not exists publication_history_post_uq
  on public.publication_history(post_id)
  where post_id is not null;
