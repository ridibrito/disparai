-- Tabela de membresias entre contatos e listas (N:N)
CREATE TABLE IF NOT EXISTS public.contact_list_members (
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  list_id UUID REFERENCES public.contact_lists(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (contact_id, list_id)
);

ALTER TABLE public.contact_list_members ENABLE ROW LEVEL SECURITY;

-- Índices auxiliares
CREATE INDEX IF NOT EXISTS idx_clm_contact_id ON public.contact_list_members(contact_id);
CREATE INDEX IF NOT EXISTS idx_clm_list_id ON public.contact_list_members(list_id);

-- Políticas owner-based para contact_lists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contact_lists' AND policyname='Org members can manage contact_lists'
  ) THEN
    DROP POLICY "Org members can manage contact_lists" ON public.contact_lists;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contact_lists' AND policyname='Owner can manage contact_lists'
  ) THEN
    CREATE POLICY "Owner can manage contact_lists" ON public.contact_lists
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.organizations o
          WHERE o.id = contact_lists.organization_id AND o.owner_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.organizations o
          WHERE o.id = contact_lists.organization_id AND o.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Políticas owner-based para contact_list_members
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contact_list_members' AND policyname='Owner can select contact_list_members'
  ) THEN
    CREATE POLICY "Owner can select contact_list_members" ON public.contact_list_members
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.contact_lists cl
          JOIN public.organizations o ON o.id = cl.organization_id
          WHERE cl.id = contact_list_members.list_id AND o.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contact_list_members' AND policyname='Owner can modify contact_list_members'
  ) THEN
    CREATE POLICY "Owner can modify contact_list_members" ON public.contact_list_members
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.contact_lists cl
          JOIN public.organizations o ON o.id = cl.organization_id
          WHERE cl.id = contact_list_members.list_id AND o.owner_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.contact_lists cl
          JOIN public.organizations o ON o.id = cl.organization_id
          WHERE cl.id = contact_list_members.list_id AND o.owner_id = auth.uid()
        )
      );
  END IF;
END $$;


