-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create function to drain HP
CREATE OR REPLACE FUNCTION public.drain_hp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Decrease HP by 1, minimum 0
  UPDATE agent_state 
  SET hp = GREATEST(0, hp - 1),
      is_dead = CASE WHEN hp <= 1 THEN true ELSE false END,
      updated_at = now();
END;
$$;

-- Schedule the drain to run every minute
SELECT cron.schedule(
  'drain-hp-every-minute',
  '* * * * *',
  'SELECT public.drain_hp()'
);