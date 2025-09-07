-- Add RLS policies to whatsapp_instances and api_connections

-- Enable RLS for the tables
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_connections ENABLE ROW LEVEL SECURITY;

-- Policies for whatsapp_instances
DROP POLICY IF EXISTS p_whatsapp_instances_select ON public.whatsapp_instances;
CREATE POLICY p_whatsapp_instances_select ON public.whatsapp_instances FOR SELECT USING (
  organization_id IN (
    SELECT organization_id
    FROM public.organization_members
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS p_whatsapp_instances_mod ON public.whatsapp_instances;
CREATE POLICY p_whatsapp_instances_mod ON public.whatsapp_instances FOR ALL USING (
  organization_id IN (
    SELECT organization_id
    FROM public.organization_members
    WHERE user_id = auth.uid()
  )
) WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM public.organization_members
    WHERE user_id = auth.uid()
  )
);

-- Policies for api_connections
DROP POLICY IF EXISTS p_api_connections_select ON public.api_connections;
CREATE POLICY p_api_connections_select ON public.api_connections FOR SELECT USING (
  organization_id IN (
    SELECT organization_id
    FROM public.organization_members
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS p_api_connections_mod ON public.api_connections;
CREATE POLICY p_api_connections_mod ON public.api_connections FOR ALL USING (
  organization_id IN (
    SELECT organization_id
    FROM public.organization_members
    WHERE user_id = auth.uid()
  )
) WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM public.organization_members
    WHERE user_id = auth.uid()
  )
);
