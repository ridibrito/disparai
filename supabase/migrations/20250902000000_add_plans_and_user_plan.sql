-- Ensure plans table exists
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  contact_limit INTEGER NOT NULL DEFAULT 0,
  message_limit INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add plan_id to users if missing
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id);

-- Garantir UNIQUE em name (para suportar ON CONFLICT abaixo)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'plans_name_key'
      AND conrelid = 'public.plans'::regclass
  ) THEN
    ALTER TABLE public.plans ADD CONSTRAINT plans_name_key UNIQUE (name);
  END IF;
END $$;

-- Seed default plans if not present
INSERT INTO public.plans (name, price, contact_limit, message_limit, features)
VALUES 
  ('Básico', 49.90, 500, 1000, '{"dispositivos": 1, "campanhas_simultaneas": 2, "suporte": "email"}'),
  ('Profissional', 99.90, 2000, 5000, '{"dispositivos": 3, "campanhas_simultaneas": 5, "suporte": "email,chat", "automacao": true}'),
  ('Empresarial', 199.90, 10000, 20000, '{"dispositivos": 10, "campanhas_simultaneas": 20, "suporte": "email,chat,telefone", "automacao": true, "api_acesso": true}')
ON CONFLICT (name) DO NOTHING;

-- Set default plan for existing users without plan
-- Trigger: set default plan on new user
CREATE OR REPLACE FUNCTION public.set_default_plan_on_user()
RETURNS TRIGGER AS $$
DECLARE
  basic_plan_id UUID;
BEGIN
  SELECT id INTO basic_plan_id FROM public.plans WHERE name = 'Básico' LIMIT 1;
  IF basic_plan_id IS NOT NULL THEN
    UPDATE public.users SET plan_id = basic_plan_id WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_set_plan'
  ) THEN
    CREATE TRIGGER on_auth_user_created_set_plan
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.set_default_plan_on_user();
  END IF;
END $$;

-- RLS read policy for plans (visible to authenticated users)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='plans' AND policyname='Plans visible to authenticated'
  ) THEN
    ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Plans visible to authenticated" ON public.plans
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'plans_touch_updated_at'
  ) THEN
    CREATE TRIGGER plans_touch_updated_at
    BEFORE UPDATE ON public.plans
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;


