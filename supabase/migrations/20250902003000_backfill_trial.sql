-- Backfill trial fields for existing organizations that don't have them
UPDATE public.organizations
SET 
  trial_starts_at = COALESCE(trial_starts_at, created_at),
  trial_ends_at   = COALESCE(trial_ends_at, created_at + interval '3 days'),
  trial_status    = COALESCE(trial_status, 'active')
WHERE trial_starts_at IS NULL OR trial_ends_at IS NULL OR trial_status IS NULL;


