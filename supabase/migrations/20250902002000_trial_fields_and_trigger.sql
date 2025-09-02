-- Trial fields on organizations and auto-create org on signup with 3-day trial

-- Add columns if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='organizations' AND column_name='trial_starts_at'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN trial_starts_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='organizations' AND column_name='trial_ends_at'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN trial_ends_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='organizations' AND column_name='trial_status'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN trial_status TEXT DEFAULT 'active';
  END IF;
END $$;

-- Create organization on new auth user (if not exists) and start trial
CREATE OR REPLACE FUNCTION public.create_org_on_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.organizations (id, name, owner_id, trial_starts_at, trial_ends_at, trial_status)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name','Conta') || ' - Org', NEW.id, now(), now() + interval '3 days', 'active')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (NEW.id, NEW.id, 'owner')
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_create_org'
  ) THEN
    CREATE TRIGGER on_auth_user_created_create_org
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.create_org_on_auth_user();
  END IF;
END $$;


