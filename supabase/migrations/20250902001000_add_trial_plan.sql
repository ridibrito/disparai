-- Add TRIAL plan and set as default for new users

-- Ensure UNIQUE(name)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'plans_name_key' AND conrelid = 'public.plans'::regclass
  ) THEN
    ALTER TABLE public.plans ADD CONSTRAINT plans_name_key UNIQUE (name);
  END IF;
END $$;

-- Insert Trial plan (1 device, 100 contacts, 1 campaign)
INSERT INTO public.plans (name, price, contact_limit, message_limit, features)
VALUES ('Trial', 0, 100, 500, '{"dispositivos":1, "campanhas_simultaneas":1, "trial":true}')
ON CONFLICT (name) DO NOTHING;

-- Update default plan function to use Trial
CREATE OR REPLACE FUNCTION public.set_default_plan_on_user()
RETURNS TRIGGER AS $$
DECLARE
  trial_plan_id UUID;
BEGIN
  SELECT id INTO trial_plan_id FROM public.plans WHERE name = 'Trial' LIMIT 1;
  IF trial_plan_id IS NULL THEN
    SELECT id INTO trial_plan_id FROM public.plans WHERE name = 'Básico' LIMIT 1;
  END IF;
  IF trial_plan_id IS NOT NULL THEN
    UPDATE public.users SET plan_id = trial_plan_id WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


