-- Row Level Security (RLS) para WhatsApp Cloud API
-- Execute: psql "$DATABASE_URL" -f sql/010_rls.sql

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_raw ENABLE ROW LEVEL SECURITY;

-- Políticas para tenants
DROP POLICY IF EXISTS p_tenants_select ON public.tenants;
CREATE POLICY p_tenants_select ON public.tenants FOR SELECT USING (
  id IN (
    SELECT tu.tenant_id
    FROM public.users u
    JOIN public.tenant_users tu ON tu.user_id = u.id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Políticas para users
DROP POLICY IF EXISTS p_users_self ON public.users;
CREATE POLICY p_users_self ON public.users FOR SELECT USING (auth.uid() = auth_user_id);

-- Políticas para tenant_users
DROP POLICY IF EXISTS p_tenant_users_self ON public.tenant_users;
CREATE POLICY p_tenant_users_self ON public.tenant_users FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = tenant_users.user_id AND u.auth_user_id = auth.uid()
  )
);

-- Políticas para wa_accounts
DROP POLICY IF EXISTS p_wa_accounts_select ON public.wa_accounts;
CREATE POLICY p_wa_accounts_select ON public.wa_accounts FOR SELECT USING (
  tenant_id = public.current_tenant_id()
);

DROP POLICY IF EXISTS p_wa_accounts_mod ON public.wa_accounts;
CREATE POLICY p_wa_accounts_mod ON public.wa_accounts FOR ALL USING (
  tenant_id = public.current_tenant_id()
) WITH CHECK (tenant_id = public.current_tenant_id());

-- Políticas para contacts
DROP POLICY IF EXISTS p_contacts_select ON public.contacts;
CREATE POLICY p_contacts_select ON public.contacts FOR SELECT USING (
  tenant_id = public.current_tenant_id()
);

DROP POLICY IF EXISTS p_contacts_mod ON public.contacts;
CREATE POLICY p_contacts_mod ON public.contacts FOR ALL USING (
  tenant_id = public.current_tenant_id()
) WITH CHECK (tenant_id = public.current_tenant_id());

-- Políticas para wa_templates
DROP POLICY IF EXISTS p_wa_templates_select ON public.wa_templates;
CREATE POLICY p_wa_templates_select ON public.wa_templates FOR SELECT USING (
  tenant_id = public.current_tenant_id()
);

DROP POLICY IF EXISTS p_wa_templates_mod ON public.wa_templates;
CREATE POLICY p_wa_templates_mod ON public.wa_templates FOR ALL USING (
  tenant_id = public.current_tenant_id()
) WITH CHECK (tenant_id = public.current_tenant_id());

-- Políticas para segments
DROP POLICY IF EXISTS p_segments_select ON public.segments;
CREATE POLICY p_segments_select ON public.segments FOR SELECT USING (
  tenant_id = public.current_tenant_id()
);

DROP POLICY IF EXISTS p_segments_mod ON public.segments;
CREATE POLICY p_segments_mod ON public.segments FOR ALL USING (
  tenant_id = public.current_tenant_id()
) WITH CHECK (tenant_id = public.current_tenant_id());

-- Políticas para campaigns
DROP POLICY IF EXISTS p_campaigns_select ON public.campaigns;
CREATE POLICY p_campaigns_select ON public.campaigns FOR SELECT USING (
  tenant_id = public.current_tenant_id()
);

DROP POLICY IF EXISTS p_campaigns_mod ON public.campaigns;
CREATE POLICY p_campaigns_mod ON public.campaigns FOR ALL USING (
  tenant_id = public.current_tenant_id()
) WITH CHECK (tenant_id = public.current_tenant_id());

-- Políticas para campaign_targets
DROP POLICY IF EXISTS p_campaign_targets_select ON public.campaign_targets;
CREATE POLICY p_campaign_targets_select ON public.campaign_targets FOR SELECT USING (
  campaign_id IN (
    SELECT id FROM public.campaigns WHERE tenant_id = public.current_tenant_id()
  )
);

DROP POLICY IF EXISTS p_campaign_targets_mod ON public.campaign_targets;
CREATE POLICY p_campaign_targets_mod ON public.campaign_targets FOR ALL USING (
  campaign_id IN (
    SELECT id FROM public.campaigns WHERE tenant_id = public.current_tenant_id()
  )
) WITH CHECK (
  campaign_id IN (
    SELECT id FROM public.campaigns WHERE tenant_id = public.current_tenant_id()
  )
);

-- Políticas para conversations
DROP POLICY IF EXISTS p_conversations_select ON public.conversations;
CREATE POLICY p_conversations_select ON public.conversations FOR SELECT USING (
  tenant_id = public.current_tenant_id()
);

DROP POLICY IF EXISTS p_conversations_mod ON public.conversations;
CREATE POLICY p_conversations_mod ON public.conversations FOR ALL USING (
  tenant_id = public.current_tenant_id()
) WITH CHECK (tenant_id = public.current_tenant_id());

-- Políticas para messages
DROP POLICY IF EXISTS p_messages_select ON public.messages;
CREATE POLICY p_messages_select ON public.messages FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM public.conversations WHERE tenant_id = public.current_tenant_id()
  )
);

DROP POLICY IF EXISTS p_messages_mod ON public.messages;
CREATE POLICY p_messages_mod ON public.messages FOR ALL USING (
  conversation_id IN (
    SELECT id FROM public.conversations WHERE tenant_id = public.current_tenant_id()
  )
) WITH CHECK (
  conversation_id IN (
    SELECT id FROM public.conversations WHERE tenant_id = public.current_tenant_id()
  )
);

-- Políticas para ai_sessions
DROP POLICY IF EXISTS p_ai_sessions_select ON public.ai_sessions;
CREATE POLICY p_ai_sessions_select ON public.ai_sessions FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM public.conversations WHERE tenant_id = public.current_tenant_id()
  )
);

DROP POLICY IF EXISTS p_ai_sessions_mod ON public.ai_sessions;
CREATE POLICY p_ai_sessions_mod ON public.ai_sessions FOR ALL USING (
  conversation_id IN (
    SELECT id FROM public.conversations WHERE tenant_id = public.current_tenant_id()
  )
) WITH CHECK (
  conversation_id IN (
    SELECT id FROM public.conversations WHERE tenant_id = public.current_tenant_id()
  )
);

-- Políticas para handoffs
DROP POLICY IF EXISTS p_handoffs_select ON public.handoffs;
CREATE POLICY p_handoffs_select ON public.handoffs FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM public.conversations WHERE tenant_id = public.current_tenant_id()
  )
);

DROP POLICY IF EXISTS p_handoffs_mod ON public.handoffs;
CREATE POLICY p_handoffs_mod ON public.handoffs FOR ALL USING (
  conversation_id IN (
    SELECT id FROM public.conversations WHERE tenant_id = public.current_tenant_id()
  )
) WITH CHECK (
  conversation_id IN (
    SELECT id FROM public.conversations WHERE tenant_id = public.current_tenant_id()
  )
);

-- Políticas para schedules
DROP POLICY IF EXISTS p_schedules_select ON public.schedules;
CREATE POLICY p_schedules_select ON public.schedules FOR SELECT USING (
  tenant_id = public.current_tenant_id()
);

DROP POLICY IF EXISTS p_schedules_mod ON public.schedules;
CREATE POLICY p_schedules_mod ON public.schedules FOR ALL USING (
  tenant_id = public.current_tenant_id()
) WITH CHECK (tenant_id = public.current_tenant_id());

-- Políticas para events_raw (apenas para admins)
DROP POLICY IF EXISTS p_events_raw_select ON public.events_raw;
CREATE POLICY p_events_raw_select ON public.events_raw FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.tenant_users tu ON tu.user_id = u.id
    WHERE u.auth_user_id = auth.uid() AND tu.role IN ('owner', 'admin')
  )
);
