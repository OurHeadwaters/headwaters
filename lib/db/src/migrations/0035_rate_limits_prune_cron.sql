-- Schedule a pg_cron job that purges expired rate-limit rows every 5 minutes.
-- This provides a database-level safety net independent of server process uptime.
--
-- The entire block is wrapped in an inner BEGIN/EXCEPTION so that if pg_cron is
-- not installed on this PostgreSQL instance the migration completes cleanly and
-- the in-process setInterval (plus the boot-time prune added to index.ts) serve
-- as the fallback.
DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron extension not available — skipping cron job registration (in-process prune remains active)';
    RETURN;
  END;

  -- Remove any stale registration so this migration is idempotent.
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'prune_rate_limits') THEN
    PERFORM cron.unschedule('prune_rate_limits');
  END IF;

  -- Delete expired rate-limit rows every 5 minutes.
  PERFORM cron.schedule(
    'prune_rate_limits',
    '*/5 * * * *',
    'DELETE FROM rate_limits WHERE reset_at < NOW()'
  );

  RAISE NOTICE 'pg_cron: scheduled prune_rate_limits every 5 minutes';
END;
$$;
