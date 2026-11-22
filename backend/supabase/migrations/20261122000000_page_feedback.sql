-- ============================================================================
-- NOTtEodo website: "Was this helpful?" on help and guide pages
-- Migration: 20261122000000_page_feedback.sql (after 20261121000000_website_platform.sql)
--
-- Anonymous votes, written only by the server (/api/feedback, service role). No account, no
-- IP address, no cookie: a row is the page, the answer and an optional note. Admins read and
-- delete. Rows are deleted after 180 days. Idempotent: safe to re-run.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.page_feedback (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    path TEXT NOT NULL CHECK (char_length(path) BETWEEN 1 AND 200 AND path ~ '^/[a-z0-9/_-]*$'),
    helpful BOOLEAN NOT NULL,
    note TEXT CHECK (note IS NULL OR char_length(note) BETWEEN 1 AND 1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS page_feedback_path ON public.page_feedback (path, created_at DESC);
ALTER TABLE public.page_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_feedback FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.page_feedback FROM anon, authenticated;
GRANT SELECT, DELETE ON public.page_feedback TO authenticated;
DROP POLICY IF EXISTS "page_feedback_admin_read" ON public.page_feedback;
CREATE POLICY "page_feedback_admin_read" ON public.page_feedback FOR SELECT TO authenticated USING ((SELECT public.is_app_admin()));
DROP POLICY IF EXISTS "page_feedback_admin_delete" ON public.page_feedback;
CREATE POLICY "page_feedback_admin_delete" ON public.page_feedback FOR DELETE TO authenticated USING ((SELECT public.is_app_admin()));

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
        CREATE EXTENSION IF NOT EXISTS pg_cron;
        PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'nt_prune_page_feedback';
        PERFORM cron.schedule('nt_prune_page_feedback', '41 4 * * *',
            $job$DELETE FROM public.page_feedback WHERE created_at < NOW() - INTERVAL '180 days'$job$);
    END IF;
EXCEPTION WHEN insufficient_privilege OR undefined_function THEN
    RAISE NOTICE 'pg_cron not available; prune page_feedback manually.';
END $$;
