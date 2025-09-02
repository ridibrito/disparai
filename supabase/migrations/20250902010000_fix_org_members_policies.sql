-- Fix recursive RLS policies causing: "infinite recursion detected in policy for relation organization_members"

-- 1) Drop recursive policies
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='organizations' AND policyname='Members can view organizations'
  ) THEN
    DROP POLICY "Members can view organizations" ON public.organizations;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='organization_members' AND policyname='Members can view members'
  ) THEN
    DROP POLICY "Members can view members" ON public.organization_members;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='organization_members' AND policyname='Owners/Admins manage members'
  ) THEN
    DROP POLICY "Owners/Admins manage members" ON public.organization_members;
  END IF;
END $$;

-- 2) Recreate non-recursive, simpler policies

-- Organizations: only owner can SELECT (prevents cycle via organization_members)
CREATE POLICY "Owner can view organizations" ON public.organizations
  FOR SELECT USING (owner_id = auth.uid());

-- Organization members: users can SELECT their own membership rows
CREATE POLICY "Users can view own membership" ON public.organization_members
  FOR SELECT USING (user_id = auth.uid());

-- Organization members: only org owner can manage all membership rows
CREATE POLICY "Owner manages members" ON public.organization_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_members.organization_id AND o.owner_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_members.organization_id AND o.owner_id = auth.uid()
    )
  );


