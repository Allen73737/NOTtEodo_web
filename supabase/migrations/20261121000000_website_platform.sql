-- ============================================================================
-- NOTtEodo website ↔ app platform
-- Migration: 20261121000000_website_platform.sql
--
-- Applies on top of the app's migrations (backend/supabase/migrations, up to
-- 20261119000000_nodo_memory_and_learning.sql). Idempotent: safe to re-run.
--
-- 1. admin_audit_log      immutable trail of every admin write (trigger-only)
-- 2. platform_config      shared config both clients read (URLs, versions, flags)
-- 3. app_releases         APK releases (+ one "latest" per channel, increasing versionCode)
-- 4. announcements        banners for web, app or both
-- 5. legal_documents      versions of the legal pages (the app shows "policy updated")
-- 6. faq_overrides, testimonials, roadmap_items   website CMS
-- 7. release_subscribers  double opt-in emails (server-only access)
-- 8. admin_invites        single-use, hashed, expiring sub-admin invites
-- 9. user_feedback        reply columns + source
-- 10. RPCs                increment_download, public_status, admin_table_counts,
--                         admin list/invite/redeem/revoke, public_nodo_insights
-- 11. Storage             apk-releases bucket: public read, admin write
--
-- Every table: RLS enabled and forced. Public (anon) reads only where stated.
-- Every write requires public.is_app_admin(). All admins have equal rights.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- 1. Audit log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor UUID,
    table_name TEXT NOT NULL,
    op TEXT NOT NULL CHECK (op IN ('INSERT', 'UPDATE', 'DELETE', 'RPC')),
    row_pk TEXT,
    diff JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS admin_audit_log_at ON public.admin_audit_log (at DESC);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_audit_log FROM anon, authenticated;
GRANT SELECT ON public.admin_audit_log TO authenticated;
DROP POLICY IF EXISTS "audit_admin_read" ON public.admin_audit_log;
CREATE POLICY "audit_admin_read" ON public.admin_audit_log
    FOR SELECT TO authenticated USING ((SELECT public.is_app_admin()));
-- No INSERT/UPDATE/DELETE policies or grants: only the SECURITY DEFINER trigger writes.

CREATE OR REPLACE FUNCTION public.audit_admin_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_old JSONB := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END;
    v_new JSONB := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END;
    v_pk TEXT := COALESCE(v_new ->> 'id', v_old ->> 'id', v_new ->> 'key', v_old ->> 'key', v_new ->> 'topic', v_old ->> 'topic');
    v_diff JSONB;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        SELECT COALESCE(jsonb_object_agg(k, jsonb_build_object('from', v_old -> k, 'to', v_new -> k)), '{}'::jsonb)
          INTO v_diff
          FROM jsonb_object_keys(v_new) AS k
         WHERE v_new -> k IS DISTINCT FROM v_old -> k AND k NOT IN ('updated_at');
        -- The public download counter is not an admin write.
        IF v_diff - 'download_count' = '{}'::jsonb THEN
            RETURN NEW;
        END IF;
    ELSE
        v_diff := COALESCE(v_new, v_old);
    END IF;
    -- Never copy secrets into the log.
    v_diff := v_diff - 'code_hash' - 'confirm_token_hash' - 'unsubscribe_token_hash';
    INSERT INTO public.admin_audit_log (actor, table_name, op, row_pk, diff)
    VALUES (auth.uid(), TG_TABLE_NAME, TG_OP, v_pk, v_diff);
    RETURN COALESCE(NEW, OLD);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.audit_admin_write() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END; $$;

-- Helper to attach the audit + updated_at triggers.
CREATE OR REPLACE FUNCTION public._nt_attach_admin_triggers(p_table TEXT, p_touch BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit ON public.%I', p_table);
    EXECUTE format('CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_admin_write()', p_table);
    IF p_touch THEN
        EXECUTE format('DROP TRIGGER IF EXISTS trg_touch ON public.%I', p_table);
        EXECUTE format('CREATE TRIGGER trg_touch BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', p_table);
    END IF;
END; $$;
REVOKE EXECUTE ON FUNCTION public._nt_attach_admin_triggers(TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;

-- Standard policy set: optional anon/auth read filter + admin-only writes.
CREATE OR REPLACE FUNCTION public._nt_admin_write_policies(p_table TEXT)
RETURNS VOID LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS "admin_insert" ON public.%I', p_table);
    EXECUTE format('DROP POLICY IF EXISTS "admin_update" ON public.%I', p_table);
    EXECUTE format('DROP POLICY IF EXISTS "admin_delete" ON public.%I', p_table);
    EXECUTE format('DROP POLICY IF EXISTS "admin_read_all" ON public.%I', p_table);
    EXECUTE format('CREATE POLICY "admin_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_app_admin()))', p_table);
    EXECUTE format('CREATE POLICY "admin_update" ON public.%I FOR UPDATE TO authenticated USING ((SELECT public.is_app_admin())) WITH CHECK ((SELECT public.is_app_admin()))', p_table);
    EXECUTE format('CREATE POLICY "admin_delete" ON public.%I FOR DELETE TO authenticated USING ((SELECT public.is_app_admin()))', p_table);
    EXECUTE format('CREATE POLICY "admin_read_all" ON public.%I FOR SELECT TO authenticated USING ((SELECT public.is_app_admin()))', p_table);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', p_table);
END; $$;
REVOKE EXECUTE ON FUNCTION public._nt_admin_write_policies(TEXT) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. platform_config
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_config (
    key TEXT PRIMARY KEY CHECK (key ~ '^[a-z][a-z0-9_]{1,63}$'),
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT platform_config_size CHECK (pg_column_size(value) < 65536)
);
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_config FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_config FROM anon, authenticated;
GRANT SELECT ON public.platform_config TO anon;
DROP POLICY IF EXISTS "config_public_read" ON public.platform_config;
CREATE POLICY "config_public_read" ON public.platform_config FOR SELECT TO anon, authenticated USING (true);
SELECT public._nt_admin_write_policies('platform_config');
SELECT public._nt_attach_admin_triggers('platform_config', true);

INSERT INTO public.platform_config (key, value) VALUES
    ('play_live', 'false'),
    ('nodo_cloud_opt_in', 'false'),
    ('min_supported_version_code', '1'),
    ('latest_version_code', '1'),
    ('maintenance', '{"on": false, "message": ""}'),
    ('urls', '{"privacy": "https://[DOMAIN]/privacy", "terms": "https://[DOMAIN]/terms", "delete_account": "https://[DOMAIN]/delete-account", "support": "https://[DOMAIN]/support", "help": "https://[DOMAIN]/help", "play": "https://play.google.com/store/apps/details?id=com.notteodo.notteodo", "website": "https://[DOMAIN]", "status": "https://[DOMAIN]/status"}'),
    ('flags', '{"release_emails": true, "testimonials": false, "roadmap": false}'),
    ('hero', '{"eyebrow": "Notes. Tasks. Life.", "headline": "Curate your everyday.", "sub": ""}')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. app_releases
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_name TEXT NOT NULL CHECK (version_name ~ '^\d+\.\d+\.\d+([-+][0-9A-Za-z.-]+)?$'),
    version_code INT NOT NULL UNIQUE CHECK (version_code > 0),
    channel TEXT NOT NULL DEFAULT 'stable' CHECK (channel IN ('stable', 'beta')),
    file_path TEXT NOT NULL CHECK (file_path ~ '^NOTtEodo-[0-9A-Za-z.+-]+\.apk$'),
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes < 524288000),
    sha256 TEXT NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
    signing_cert_sha256 TEXT CHECK (signing_cert_sha256 IS NULL OR signing_cert_sha256 ~ '^[0-9A-F:]{95}$'),
    min_sdk INT CHECK (min_sdk IS NULL OR min_sdk BETWEEN 16 AND 99),
    release_notes_md TEXT NOT NULL DEFAULT '' CHECK (char_length(release_notes_md) <= 20000),
    poster_key TEXT,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    is_latest BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    download_count BIGINT NOT NULL DEFAULT 0,
    created_by UUID DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS app_releases_published ON public.app_releases (channel, is_published, version_code DESC);
ALTER TABLE public.app_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_releases FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_releases FROM anon, authenticated;
GRANT SELECT ON public.app_releases TO anon;
DROP POLICY IF EXISTS "releases_public_read" ON public.app_releases;
CREATE POLICY "releases_public_read" ON public.app_releases FOR SELECT TO anon, authenticated USING (is_published);
SELECT public._nt_admin_write_policies('app_releases');
SELECT public._nt_attach_admin_triggers('app_releases', true);

-- versionCode must increase within a channel; "latest" is unique per channel; publishing stamps the date
-- and keeps platform_config.latest_version_code in step for stable.
CREATE OR REPLACE FUNCTION public.app_releases_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'INSERT' AND EXISTS (
        SELECT 1 FROM public.app_releases WHERE version_code >= NEW.version_code
    ) THEN
        RAISE EXCEPTION 'versionCode % must be higher than every existing release', NEW.version_code
            USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.is_published AND NEW.published_at IS NULL THEN
        NEW.published_at := NOW();
    END IF;
    IF NEW.is_latest AND NOT NEW.is_published THEN
        RAISE EXCEPTION 'Only a published release can be marked latest' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.is_latest AND (TG_OP = 'INSERT' OR NOT OLD.is_latest) THEN
        UPDATE public.app_releases SET is_latest = FALSE
         WHERE channel = NEW.channel AND id <> NEW.id AND is_latest;
        IF NEW.channel = 'stable' THEN
            INSERT INTO public.platform_config (key, value) VALUES ('latest_version_code', to_jsonb(NEW.version_code))
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.app_releases_rules() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_release_rules ON public.app_releases;
CREATE TRIGGER trg_release_rules BEFORE INSERT OR UPDATE ON public.app_releases
    FOR EACH ROW EXECUTE FUNCTION public.app_releases_rules();

-- Download counter: one count per (hashed client, release, UTC day). Raw IPs are never stored;
-- the website sends sha256(daily_salt || ip), and rows are pruned after 2 days.
CREATE TABLE IF NOT EXISTS public.download_events (
    day DATE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')::date,
    client_hash TEXT NOT NULL CHECK (client_hash ~ '^[0-9a-f]{64}$'),
    release_id UUID NOT NULL REFERENCES public.app_releases(id) ON DELETE CASCADE,
    PRIMARY KEY (day, client_hash, release_id)
);
ALTER TABLE public.download_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_events FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.download_events FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_download(p_release_id UUID, p_client_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_inserted INT;
BEGIN
    IF p_client_hash IS NULL OR p_client_hash !~ '^[0-9a-f]{64}$' THEN
        RAISE EXCEPTION 'invalid client hash' USING ERRCODE = 'invalid_parameter_value';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.app_releases WHERE id = p_release_id AND is_published) THEN
        RETURN FALSE;
    END IF;
    -- At most 20 distinct counted downloads per hashed client per day, across all releases.
    IF (SELECT COUNT(*) FROM public.download_events
         WHERE day = (NOW() AT TIME ZONE 'utc')::date AND client_hash = p_client_hash) >= 20 THEN
        RETURN FALSE;
    END IF;
    INSERT INTO public.download_events (client_hash, release_id) VALUES (p_client_hash, p_release_id)
    ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted > 0 THEN
        UPDATE public.app_releases SET download_count = download_count + 1 WHERE id = p_release_id;
    END IF;
    DELETE FROM public.download_events WHERE day < (NOW() AT TIME ZONE 'utc')::date - 1;
    RETURN v_inserted > 0;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.increment_download(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_download(UUID, TEXT) TO anon, authenticated, service_role;


-- ---------------------------------------------------------------------------
-- 4. announcements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
    body_md TEXT NOT NULL DEFAULT '' CHECK (char_length(body_md) <= 2000),
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'notice', 'warning', 'critical')),
    target TEXT NOT NULL DEFAULT 'both' CHECK (target IN ('web', 'app', 'both')),
    audience TEXT NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'signed_in')),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    cta_label TEXT CHECK (cta_label IS NULL OR char_length(cta_label) <= 40),
    -- Allowlist: https URLs or site-relative paths only (no javascript:, data:, protocol-relative).
    cta_url TEXT CHECK (cta_url IS NULL OR cta_url ~ '^(https://[A-Za-z0-9.-]+(/[^[:space:]]*)?|/([A-Za-z0-9_?&=#.-][A-Za-z0-9/_?&=#.-]*)?)$'),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.announcements FROM anon, authenticated;
GRANT SELECT ON public.announcements TO anon;
DROP POLICY IF EXISTS "announcements_public_read" ON public.announcements;
CREATE POLICY "announcements_public_read" ON public.announcements FOR SELECT TO anon, authenticated
    USING (is_active AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at > NOW())
           AND (audience = 'all' OR auth.uid() IS NOT NULL));
SELECT public._nt_admin_write_policies('announcements');
SELECT public._nt_attach_admin_triggers('announcements', true);

-- ---------------------------------------------------------------------------
-- 5. legal_documents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc TEXT NOT NULL CHECK (doc IN ('privacy', 'terms', 'child-safety', 'cookies', 'data-safety', 'accessibility')),
    version TEXT NOT NULL CHECK (version ~ '^\d+\.\d+$'),
    effective_date DATE NOT NULL,
    content_sha256 TEXT NOT NULL CHECK (content_sha256 ~ '^[0-9a-f]{64}$'),
    summary_of_changes TEXT NOT NULL DEFAULT '' CHECK (char_length(summary_of_changes) <= 2000),
    url TEXT NOT NULL CHECK (url ~ '^https://'),
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID DEFAULT auth.uid(),
    UNIQUE (doc, version)
);
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.legal_documents FROM anon, authenticated;
GRANT SELECT ON public.legal_documents TO anon;
DROP POLICY IF EXISTS "legal_public_read" ON public.legal_documents;
CREATE POLICY "legal_public_read" ON public.legal_documents FOR SELECT TO anon, authenticated USING (true);
SELECT public._nt_admin_write_policies('legal_documents');
SELECT public._nt_attach_admin_triggers('legal_documents', false);

-- ---------------------------------------------------------------------------
-- 6. Website CMS: FAQ overrides, testimonials (consent required), roadmap
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faq_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL CHECK (char_length(question) BETWEEN 3 AND 300),
    answer_md TEXT NOT NULL CHECK (char_length(answer_md) BETWEEN 3 AND 4000),
    section TEXT,
    sort INT NOT NULL DEFAULT 100,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote TEXT NOT NULL CHECK (char_length(quote) BETWEEN 10 AND 600),
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
    handle TEXT CHECK (handle IS NULL OR char_length(handle) <= 80),
    source TEXT NOT NULL CHECK (char_length(source) BETWEEN 2 AND 200),
    consent_at TIMESTAMPTZ,
    consent_note TEXT CHECK (consent_note IS NULL OR char_length(consent_note) <= 500),
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- A testimonial cannot be published without a recorded consent.
    CHECK (NOT is_published OR consent_at IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS public.roadmap_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
    body TEXT NOT NULL DEFAULT '' CHECK (char_length(body) <= 1000),
    status TEXT NOT NULL DEFAULT 'exploring' CHECK (status IN ('exploring', 'planned', 'building', 'shipped')),
    sort INT NOT NULL DEFAULT 100,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['faq_overrides', 'testimonials', 'roadmap_items'] LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
        EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
        EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
        EXECUTE format('DROP POLICY IF EXISTS "public_read_published" ON public.%I', t);
        EXECUTE format('CREATE POLICY "public_read_published" ON public.%I FOR SELECT TO anon, authenticated USING (is_published)', t);
        PERFORM public._nt_admin_write_policies(t);
        PERFORM public._nt_attach_admin_triggers(t, true);
    END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 7. release_subscribers (double opt-in; written only by the website server)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.release_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email extensions.citext NOT NULL CHECK (char_length(email::text) BETWEEN 3 AND 320 AND email::text ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    topic TEXT NOT NULL CHECK (topic IN ('play_launch', 'releases')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
    confirm_token_hash TEXT NOT NULL CHECK (confirm_token_hash ~ '^[0-9a-f]{64}$'),
    unsubscribe_token_hash TEXT NOT NULL CHECK (unsubscribe_token_hash ~ '^[0-9a-f]{64}$'),
    consent_text_version TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,
    UNIQUE (email, topic)
);
ALTER TABLE public.release_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_subscribers FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.release_subscribers FROM anon, authenticated;
GRANT SELECT, DELETE ON public.release_subscribers TO authenticated;
DROP POLICY IF EXISTS "subscribers_admin_read" ON public.release_subscribers;
CREATE POLICY "subscribers_admin_read" ON public.release_subscribers FOR SELECT TO authenticated USING ((SELECT public.is_app_admin()));
DROP POLICY IF EXISTS "subscribers_admin_delete" ON public.release_subscribers;
CREATE POLICY "subscribers_admin_delete" ON public.release_subscribers FOR DELETE TO authenticated USING ((SELECT public.is_app_admin()));
-- Pending sign-ups that were never confirmed are deleted after 7 days; unsubscribed after 30.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
        CREATE EXTENSION IF NOT EXISTS pg_cron;
        PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'nt_prune_subscribers';
        PERFORM cron.schedule('nt_prune_subscribers', '29 4 * * *',
            $job$DELETE FROM public.release_subscribers
                 WHERE (status = 'pending' AND created_at < NOW() - INTERVAL '7 days')
                    OR (status = 'unsubscribed' AND unsubscribed_at < NOW() - INTERVAL '30 days')$job$);
    END IF;
EXCEPTION WHEN insufficient_privilege OR undefined_function THEN
    RAISE NOTICE 'pg_cron not available; prune release_subscribers manually.';
END $$;

-- ---------------------------------------------------------------------------
-- 8. Sub-admin invites (replace the app's local-only codes)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_hash TEXT NOT NULL UNIQUE CHECK (code_hash ~ '^[0-9a-f]{64}$'),
    note TEXT CHECK (note IS NULL OR char_length(note) <= 200),
    created_by UUID NOT NULL DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '72 hours',
    redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    redeemed_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invites FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_invites FROM anon, authenticated;
GRANT SELECT, UPDATE ON public.admin_invites TO authenticated;
DROP POLICY IF EXISTS "invites_admin_read" ON public.admin_invites;
CREATE POLICY "invites_admin_read" ON public.admin_invites FOR SELECT TO authenticated USING ((SELECT public.is_app_admin()));
DROP POLICY IF EXISTS "invites_admin_revoke" ON public.admin_invites;
CREATE POLICY "invites_admin_revoke" ON public.admin_invites FOR UPDATE TO authenticated
    USING ((SELECT public.is_app_admin())) WITH CHECK ((SELECT public.is_app_admin()));
SELECT public._nt_attach_admin_triggers('admin_invites', false);

-- Creates an invite and returns the one-time code (only its hash is stored).
CREATE OR REPLACE FUNCTION public.create_admin_invite(p_note TEXT DEFAULT NULL, p_hours INT DEFAULT 72)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_code TEXT;
BEGIN
    IF NOT public.is_app_admin() THEN
        RAISE EXCEPTION 'Only admins can invite' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF p_hours NOT BETWEEN 1 AND 336 THEN
        RAISE EXCEPTION 'Invites last 1 to 336 hours' USING ERRCODE = 'invalid_parameter_value';
    END IF;
    -- 96 bits of randomness, readable in groups: NT-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
    v_code := 'NT-' || array_to_string(
        ARRAY(SELECT substr(h, i, 4) FROM (SELECT upper(encode(gen_random_bytes(12), 'hex')) AS h) x,
              generate_series(1, 21, 4) AS i), '-');
    INSERT INTO public.admin_invites (code_hash, note, expires_at)
    VALUES (encode(digest(v_code, 'sha256'), 'hex'), p_note, NOW() + make_interval(hours => p_hours));
    RETURN v_code;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.create_admin_invite(TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_admin_invite(TEXT, INT) TO authenticated;

-- Redeems an invite for the signed-in caller: single use, unexpired, unrevoked.
CREATE OR REPLACE FUNCTION public.redeem_admin_invite(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_id UUID;
    v_uid UUID := auth.uid();
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Sign in first' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NOT public.check_rate_limit(v_uid, 'redeem_admin_invite', 5, 3600) THEN
        RAISE EXCEPTION 'Too many attempts. Try again in an hour.' USING ERRCODE = 'check_violation';
    END IF;
    SELECT id INTO v_id FROM public.admin_invites
     WHERE code_hash = encode(digest(upper(trim(p_code)), 'sha256'), 'hex')
       AND redeemed_at IS NULL AND revoked_at IS NULL AND expires_at > NOW()
     FOR UPDATE;
    IF v_id IS NULL THEN
        RETURN FALSE;
    END IF;
    UPDATE public.admin_invites SET redeemed_by = v_uid, redeemed_at = NOW() WHERE id = v_id;
    INSERT INTO public.app_admins (user_id, note) VALUES (v_uid, 'invite ' || v_id::text)
    ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO public.admin_audit_log (actor, table_name, op, row_pk, diff)
    VALUES (v_uid, 'app_admins', 'RPC', v_uid::text, jsonb_build_object('via', 'redeem_admin_invite', 'invite', v_id));
    RETURN TRUE;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.redeem_admin_invite(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_admin_invite(TEXT) TO authenticated;

-- Lists admins with their email (admins only).
CREATE OR REPLACE FUNCTION public.admin_list_admins()
RETURNS TABLE (user_id UUID, email TEXT, added_at TIMESTAMPTZ, note TEXT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_app_admin() THEN
        RAISE EXCEPTION 'Admins only' USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN QUERY
        SELECT a.user_id, u.email::text, a.added_at, a.note
          FROM public.app_admins a JOIN auth.users u ON u.id = a.user_id
         ORDER BY a.added_at;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_list_admins() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_admins() TO authenticated;

-- Removes an admin. The last admin can never be removed.
CREATE OR REPLACE FUNCTION public.admin_revoke_admin(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_app_admin() THEN
        RAISE EXCEPTION 'Admins only' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF (SELECT COUNT(*) FROM public.app_admins) <= 1 THEN
        RAISE EXCEPTION 'The last admin cannot be removed' USING ERRCODE = 'check_violation';
    END IF;
    DELETE FROM public.app_admins WHERE user_id = p_user_id;
    INSERT INTO public.admin_audit_log (actor, table_name, op, row_pk, diff)
    VALUES (auth.uid(), 'app_admins', 'RPC', p_user_id::text, jsonb_build_object('via', 'admin_revoke_admin'));
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_revoke_admin(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_revoke_admin(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 9. Feedback replies (visible to the author in the app and on the web)
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_feedback ADD COLUMN IF NOT EXISTS admin_reply TEXT;
ALTER TABLE public.user_feedback ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;
ALTER TABLE public.user_feedback ADD COLUMN IF NOT EXISTS replied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.user_feedback ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.user_feedback DROP CONSTRAINT IF EXISTS user_feedback_reply_size;
ALTER TABLE public.user_feedback ADD CONSTRAINT user_feedback_reply_size
    CHECK (admin_reply IS NULL OR char_length(admin_reply) <= 5000) NOT VALID;
ALTER TABLE public.user_feedback DROP CONSTRAINT IF EXISTS user_feedback_source;
ALTER TABLE public.user_feedback ADD CONSTRAINT user_feedback_source
    CHECK (source IS NULL OR source IN ('app', 'web')) NOT VALID;
-- Authors cannot write a reply into their own feedback.
DROP POLICY IF EXISTS "feedback_insert_own" ON public.user_feedback;
CREATE POLICY "feedback_insert_own" ON public.user_feedback
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = (SELECT auth.uid())
        AND status = 'pending'
        AND admin_notes IS NULL
        AND admin_reply IS NULL
        AND replied_at IS NULL
        AND replied_by IS NULL
    );
SELECT public._nt_attach_admin_triggers('user_feedback', false);
-- The audit trigger logs every insert too; feedback inserts come from users, which is fine
-- (the log is admin-only) but would copy personal text. Keep only status changes for feedback:
CREATE OR REPLACE FUNCTION public.audit_feedback_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND public.is_app_admin() THEN
        INSERT INTO public.admin_audit_log (actor, table_name, op, row_pk, diff)
        VALUES (auth.uid(), 'user_feedback', 'UPDATE', NEW.id::text,
                jsonb_build_object('status', jsonb_build_object('from', OLD.status, 'to', NEW.status),
                                   'replied', NEW.admin_reply IS DISTINCT FROM OLD.admin_reply));
    ELSIF TG_OP = 'DELETE' AND public.is_app_admin() THEN
        INSERT INTO public.admin_audit_log (actor, table_name, op, row_pk, diff)
        VALUES (auth.uid(), 'user_feedback', 'DELETE', OLD.id::text, '{}'::jsonb);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.audit_feedback_write() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_audit ON public.user_feedback;
CREATE TRIGGER trg_audit AFTER UPDATE OR DELETE ON public.user_feedback
    FOR EACH ROW EXECUTE FUNCTION public.audit_feedback_write();

-- nodo_app_insights edits by admins are audited too.
SELECT public._nt_attach_admin_triggers('nodo_app_insights', false);

-- ---------------------------------------------------------------------------
-- 10. Read-only RPCs
-- ---------------------------------------------------------------------------
-- Public status (no secrets, no user data).
CREATE OR REPLACE FUNCTION public.public_status()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT jsonb_build_object(
        'db', 'ok',
        'at', NOW(),
        'maintenance', COALESCE((SELECT value FROM public.platform_config WHERE key = 'maintenance'), '{"on":false}'::jsonb),
        'latest_version_code', COALESCE((SELECT value FROM public.platform_config WHERE key = 'latest_version_code'), '0'::jsonb),
        'latest_release', (SELECT jsonb_build_object('version_name', version_name, 'version_code', version_code, 'published_at', published_at)
                             FROM public.app_releases WHERE channel = 'stable' AND is_latest AND is_published LIMIT 1)
    );
$$;
REVOKE EXECUTE ON FUNCTION public.public_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_status() TO anon, authenticated;

-- Approved, de-personalised app answers (no user ids exist in this table) for web help search.
CREATE OR REPLACE FUNCTION public.public_nodo_insights()
RETURNS TABLE (topic TEXT, question TEXT, answer TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT topic, question, answer FROM public.nodo_app_insights
     WHERE status = 'approved' AND answer IS NOT NULL
     ORDER BY hits DESC LIMIT 200;
$$;
REVOKE EXECUTE ON FUNCTION public.public_nodo_insights() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_nodo_insights() TO anon, authenticated;

-- Row counts for the admin Overview (real aggregates, admins only).
CREATE OR REPLACE FUNCTION public.admin_table_counts()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v JSONB := '{}'::jsonb;
    t TEXT;
    n BIGINT;
BEGIN
    IF NOT public.is_app_admin() THEN
        RAISE EXCEPTION 'Admins only' USING ERRCODE = 'insufficient_privilege';
    END IF;
    FOREACH t IN ARRAY ARRAY['user_collections', 'user_keys', 'user_feedback', 'nodo_memories', 'nodo_threads',
                             'nodo_turns', 'nodo_app_insights', 'app_admins', 'app_releases', 'announcements',
                             'release_subscribers', 'security_audit_logs', 'admin_audit_log', 'ai_usage'] LOOP
        IF to_regclass('public.' || t) IS NOT NULL THEN
            EXECUTE format('SELECT COUNT(*) FROM public.%I', t) INTO n;
            v := v || jsonb_build_object(t, n);
        END IF;
    END LOOP;
    v := v || jsonb_build_object('accounts', (SELECT COUNT(*) FROM auth.users));
    v := v || jsonb_build_object('synced_accounts', (SELECT COUNT(DISTINCT user_id) FROM public.user_collections));
    v := v || jsonb_build_object('e2ee_accounts', (SELECT COUNT(*) FROM public.user_keys));
    v := v || jsonb_build_object('ai_requests_today',
        COALESCE((SELECT SUM(requests) FROM public.ai_usage WHERE day = (NOW() AT TIME ZONE 'utc')::date), 0));
    RETURN v;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_table_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_table_counts() TO authenticated;

-- Storage use per bucket (admins only).
CREATE OR REPLACE FUNCTION public.admin_storage_usage()
RETURNS TABLE (bucket TEXT, objects BIGINT, bytes BIGINT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, storage, pg_temp
AS $$
BEGIN
    IF NOT public.is_app_admin() THEN
        RAISE EXCEPTION 'Admins only' USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN QUERY
        SELECT o.bucket_id::text, COUNT(*)::bigint, COALESCE(SUM((o.metadata ->> 'size')::bigint), 0)::bigint
          FROM storage.objects o GROUP BY o.bucket_id ORDER BY 1;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_storage_usage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_storage_usage() TO authenticated;

-- ---------------------------------------------------------------------------
-- 11. Storage: apk-releases (public read, admin-only write)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('apk-releases', 'apk-releases', TRUE, 524288000, ARRAY['application/vnd.android.package-archive'])
ON CONFLICT (id) DO UPDATE SET public = TRUE, file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "apk_public_read" ON storage.objects;
CREATE POLICY "apk_public_read" ON storage.objects FOR SELECT TO anon, authenticated
    USING (bucket_id = 'apk-releases');
DROP POLICY IF EXISTS "apk_admin_insert" ON storage.objects;
CREATE POLICY "apk_admin_insert" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'apk-releases' AND (SELECT public.is_app_admin()) AND name ~ '^NOTtEodo-[0-9A-Za-z.+-]+\.apk$');
DROP POLICY IF EXISTS "apk_admin_update" ON storage.objects;
CREATE POLICY "apk_admin_update" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'apk-releases' AND (SELECT public.is_app_admin()))
    WITH CHECK (bucket_id = 'apk-releases' AND (SELECT public.is_app_admin()));
DROP POLICY IF EXISTS "apk_admin_delete" ON storage.objects;
CREATE POLICY "apk_admin_delete" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'apk-releases' AND (SELECT public.is_app_admin()));

-- ---------------------------------------------------------------------------
-- 12. Realtime: both clients subscribe to these
-- ---------------------------------------------------------------------------
DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['app_releases', 'announcements', 'platform_config'] LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
        ) AND EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
        END IF;
    END LOOP;
END $$;

