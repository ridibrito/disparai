-- Multi-tenant: organizações e associação de membros

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Tabelas de organização e membros
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner', -- owner | admin | agent | viewer
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (organization_id, user_id)
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Políticas básicas: membros podem ver a org e a lista de membros
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='organizations' AND policyname='Members can view organizations'
  ) THEN
    CREATE POLICY "Members can view organizations" ON public.organizations
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.organization_members m
          WHERE m.organization_id = id AND m.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='organization_members' AND policyname='Members can view members'
  ) THEN
    CREATE POLICY "Members can view members" ON public.organization_members
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.organization_members m
          WHERE m.organization_id = organization_members.organization_id AND m.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 2) Coluna organization_id nas tabelas de dados
-- Obs: adiciona como NULLable, preenche, depois aplica NOT NULL

-- Helper para adicionar coluna + índice
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contacts' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.contacts ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON public.contacts(organization_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contact_lists' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.contact_lists ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    CREATE INDEX IF NOT EXISTS idx_contact_lists_organization_id ON public.contact_lists(organization_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='campaigns' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.campaigns ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    CREATE INDEX IF NOT EXISTS idx_campaigns_organization_id ON public.campaigns(organization_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='campaign_recipients' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.campaign_recipients ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    CREATE INDEX IF NOT EXISTS idx_campaign_recipients_org_id ON public.campaign_recipients(organization_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='conversations' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.conversations ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    CREATE INDEX IF NOT EXISTS idx_conversations_organization_id ON public.conversations(organization_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='messages' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    CREATE INDEX IF NOT EXISTS idx_messages_organization_id ON public.messages(organization_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='devices' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.devices ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    CREATE INDEX IF NOT EXISTS idx_devices_organization_id ON public.devices(organization_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='api_connections' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.api_connections ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    CREATE INDEX IF NOT EXISTS idx_api_connections_organization_id ON public.api_connections(organization_id);
  END IF;
END $$;

-- 3) Seed: cria uma organização por usuário (id igual ao id do usuário) e o adiciona como owner
INSERT INTO public.organizations (id, name, owner_id)
SELECT u.id, COALESCE(NULLIF(u.full_name, ''), 'Conta') || ' - Org', u.id
FROM public.users u
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT u.id, u.id, 'owner' FROM public.users u
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Permissões de gerenciamento de membros: apenas owner/admin
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='organization_members' AND policyname='Owners/Admins manage members'
  ) THEN
    CREATE POLICY "Owners/Admins manage members" ON public.organization_members
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.organization_members m
          WHERE m.organization_id = organization_members.organization_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner','admin')
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.organization_members m
          WHERE m.organization_id = organization_members.organization_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner','admin')
        )
      );
  END IF;
END $$;

-- 4) Backfill organization_id nas tabelas (associando ao user_id existente)
UPDATE public.contact_lists cl SET organization_id = u.id
FROM public.users u WHERE cl.user_id = u.id AND cl.organization_id IS NULL;

UPDATE public.contacts c SET organization_id = u.id
FROM public.users u WHERE c.user_id = u.id AND c.organization_id IS NULL;

UPDATE public.campaigns ca SET organization_id = u.id
FROM public.users u WHERE ca.user_id = u.id AND ca.organization_id IS NULL;

UPDATE public.campaign_recipients cr SET organization_id = ca.organization_id
FROM public.campaigns ca WHERE cr.campaign_id = ca.id AND cr.organization_id IS NULL;

UPDATE public.conversations co SET organization_id = u.id
FROM public.users u WHERE co.user_id = u.id AND co.organization_id IS NULL;

UPDATE public.messages m SET organization_id = co.organization_id
FROM public.conversations co WHERE m.conversation_id = co.id AND m.organization_id IS NULL;

UPDATE public.devices d SET organization_id = u.id
FROM public.users u WHERE d.user_id = u.id AND d.organization_id IS NULL;

UPDATE public.api_connections ac SET organization_id = u.id
FROM public.users u WHERE ac.user_id = u.id AND ac.organization_id IS NULL;

-- 5) Tornar NOT NULL após preenchimento
ALTER TABLE public.contact_lists ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.contacts ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.campaigns ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.campaign_recipients ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.conversations ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.messages ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.devices ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.api_connections ALTER COLUMN organization_id SET NOT NULL;

-- 6) RLS: políticas baseadas em membership (mantém as existentes por compatibilidade)

-- Helper para gerar USING/ WITH CHECK por membership
-- contacts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contacts' AND policyname='Org members can select contacts'
  ) THEN
    CREATE POLICY "Org members can select contacts" ON public.contacts
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.organization_members m
          WHERE m.organization_id = contacts.organization_id AND m.user_id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contacts' AND policyname='Org members can modify contacts'
  ) THEN
    CREATE POLICY "Org members can modify contacts" ON public.contacts
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.organization_members m
          WHERE m.organization_id = contacts.organization_id AND m.user_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.organization_members m
          WHERE m.organization_id = contacts.organization_id AND m.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- contact_lists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contact_lists' AND policyname='Org members can manage contact_lists'
  ) THEN
    CREATE POLICY "Org members can manage contact_lists" ON public.contact_lists
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.organization_members m
          WHERE m.organization_id = contact_lists.organization_id AND m.user_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.organization_members m
          WHERE m.organization_id = contact_lists.organization_id AND m.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- campaigns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='campaigns' AND policyname='Org members can manage campaigns'
  ) THEN
    CREATE POLICY "Org members can manage campaigns" ON public.campaigns
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.organization_members m
          WHERE m.organization_id = campaigns.organization_id AND m.user_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.organization_members m
          WHERE m.organization_id = campaigns.organization_id AND m.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- campaign_recipients
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='campaign_recipients' AND policyname='Org members can manage campaign_recipients'
  ) THEN
    CREATE POLICY "Org members can manage campaign_recipients" ON public.campaign_recipients
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.organization_members m
          WHERE m.organization_id = campaign_recipients.organization_id AND m.user_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.organization_members m
          WHERE m.organization_id = campaign_recipients.organization_id AND m.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- conversations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversations' AND policyname='Org members can manage conversations'
  ) THEN
    CREATE POLICY "Org members can manage conversations" ON public.conversations
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.organization_members m
          WHERE m.organization_id = conversations.organization_id AND m.user_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.organization_members m
          WHERE m.organization_id = conversations.organization_id AND m.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- messages
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='Org members can manage messages'
  ) THEN
    CREATE POLICY "Org members can manage messages" ON public.messages
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.organization_members m
          WHERE m.organization_id = messages.organization_id AND m.user_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.organization_members m
          WHERE m.organization_id = messages.organization_id AND m.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- devices
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='devices' AND policyname='Org members can manage devices'
  ) THEN
    CREATE POLICY "Org members can manage devices" ON public.devices
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.organization_members m
          WHERE m.organization_id = devices.organization_id AND m.user_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.organization_members m
          WHERE m.organization_id = devices.organization_id AND m.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- api_connections
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='api_connections' AND policyname='Org members can manage api_connections'
  ) THEN
    CREATE POLICY "Org members can manage api_connections" ON public.api_connections
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.organization_members m
          WHERE m.organization_id = api_connections.organization_id AND m.user_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.organization_members m
          WHERE m.organization_id = api_connections.organization_id AND m.user_id = auth.uid()
        )
      );
  END IF;
END $$;


-- 7) Função utilitária: obter user_id por email com checagem de permissão (owner/admin)
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(target_email TEXT, org_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT u.id
  FROM auth.users u
  WHERE u.email = target_email
    AND EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = org_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin')
    )
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT, UUID) TO authenticated;

