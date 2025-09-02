-- Policies: allow user to create own organization and owner-based contacts access

-- Organizations: allow authenticated user to INSERT their own organization row
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='organizations' AND policyname='User can create own organization'
  ) THEN
    DROP POLICY "User can create own organization" ON public.organizations;
  END IF;
END $$;

CREATE POLICY "User can create own organization" ON public.organizations
  FOR INSERT WITH CHECK (id = auth.uid() AND owner_id = auth.uid());

-- Contacts: switch to owner-based policies (avoid membership dependency)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contacts' AND policyname='Org members can select contacts'
  ) THEN
    DROP POLICY "Org members can select contacts" ON public.contacts;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contacts' AND policyname='Org members can modify contacts'
  ) THEN
    DROP POLICY "Org members can modify contacts" ON public.contacts;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contacts' AND policyname='Owner can select contacts'
  ) THEN
    CREATE POLICY "Owner can select contacts" ON public.contacts
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.organizations o
          WHERE o.id = contacts.organization_id AND o.owner_id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contacts' AND policyname='Owner can modify contacts'
  ) THEN
    CREATE POLICY "Owner can modify contacts" ON public.contacts
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.organizations o
          WHERE o.id = contacts.organization_id AND o.owner_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.organizations o
          WHERE o.id = contacts.organization_id AND o.owner_id = auth.uid()
        )
      );
  END IF;
END $$;


