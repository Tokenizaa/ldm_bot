-- Fase 4: alinhar o estado persistido com a máquina de publicação implementada.
--
-- Este migration foi originalmente aplicado depois que o schema da Fase 3 já
-- existia no projeto remoto. O repositório, porém, perdeu parte da cadeia
-- histórica de migrations. Para permitir um `supabase db reset` limpo, esta
-- migration agora é deliberadamente no-op quando as tabelas ainda não existem.
-- O baseline versionado seguinte recria o schema completo.

DO $$
BEGIN
  IF to_regclass('public.monthly_plans') IS NOT NULL
     AND to_regclass('public.posts') IS NOT NULL
     AND to_regclass('public.publication_history') IS NOT NULL THEN

    DROP INDEX IF EXISTS public.monthly_plans_period_start_uidx;
    DROP INDEX IF EXISTS public.posts_plan_affiliate_uidx;

    ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_affiliate_link_id_fkey;
    ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_plan_id_fkey;

    ALTER TABLE public.monthly_plans DROP CONSTRAINT IF EXISTS monthly_plans_status_check;
    ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_status_check;
    ALTER TABLE public.publication_history DROP CONSTRAINT IF EXISTS publication_history_status_check;

    ALTER TABLE public.monthly_plans
      ADD CONSTRAINT monthly_plans_status_check
      CHECK (status = ANY (ARRAY[
        'draft','partial','generating','ready','scheduling','scheduled',
        'published','completed','completed_with_errors','failed','cancelled'
      ]));

    ALTER TABLE public.posts
      ADD CONSTRAINT posts_status_check
      CHECK (status = ANY (ARRAY[
        'draft','scheduled','publishing','published','failed','cancelled'
      ]));

    ALTER TABLE public.publication_history
      ADD CONSTRAINT publication_history_status_check
      CHECK (status = ANY (ARRAY[
        'generated','scheduled','publishing','published','failed'
      ]));

    CREATE UNIQUE INDEX IF NOT EXISTS publication_history_post_uq
      ON public.publication_history(post_id)
      WHERE post_id IS NOT NULL;
  END IF;
END
$$;
