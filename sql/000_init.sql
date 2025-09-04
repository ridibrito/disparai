-- WhatsApp Cloud API + OpenAI Integration Schema
-- Execute: psql "$DATABASE_URL" -f sql/000_init.sql

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabelas de organização e usuários
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  company_name TEXT,
  owner_name TEXT,
  owner_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL, -- supabase.auth.users.id
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  unique(auth_user_id)
);

CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- owner|admin|member
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  unique(tenant_id, user_id)
);

-- 2. WhatsApp Business Account
CREATE TABLE IF NOT EXISTS public.wa_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  waba_id TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  tier TEXT DEFAULT '1k', -- 1k, 10k, 100k, unlimited
  quality_rating TEXT DEFAULT 'green', -- green, yellow, red
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Contatos e opt-in
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  wa_phone_e164 TEXT NOT NULL, -- formato: +5511999999999
  name TEXT,
  tags TEXT[],
  opt_in_status TEXT DEFAULT 'pending', -- pending, granted, revoked
  opt_in_source TEXT, -- whatsapp_message, form, qr_code, etc
  opt_in_ts TIMESTAMPTZ,
  opt_out_ts TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  unique(tenant_id, wa_phone_e164)
);

-- 4. Templates aprovados
CREATE TABLE IF NOT EXISTS public.wa_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- marketing, utility, authentication
  status TEXT NOT NULL, -- approved, pending, rejected
  language TEXT DEFAULT 'pt_BR',
  components JSONB, -- estrutura do template
  meta_template_id TEXT, -- ID do template na Meta
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  unique(tenant_id, name, language)
);

-- 5. Segmentação
CREATE TABLE IF NOT EXISTS public.segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rule JSONB, -- regra de segmentação (SQL/JSON)
  contact_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Campanhas
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- template, flow
  template_id UUID REFERENCES public.wa_templates(id),
  segment_id UUID REFERENCES public.segments(id),
  status TEXT DEFAULT 'draft', -- draft, scheduled, running, completed, paused
  scheduled_at TIMESTAMPTZ,
  estimated_cost DECIMAL(10,4),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. Alvos das campanhas
CREATE TABLE IF NOT EXISTS public.campaign_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, sent, delivered, read, failed
  wa_msg_id TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  unique(campaign_id, contact_id)
);

-- 8. Conversas
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'open', -- open, closed
  session_expires_at TIMESTAMPTZ, -- janela de 24h
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. Mensagens
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL, -- in, out
  type TEXT NOT NULL, -- text, template, media, interactive
  payload JSONB, -- conteúdo da mensagem
  wa_msg_id TEXT, -- ID da mensagem no WhatsApp
  status TEXT DEFAULT 'sent', -- sent, delivered, read, failed
  pricing_category TEXT, -- free, business_initiated, user_initiated
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 10. Sessões de IA
CREATE TABLE IF NOT EXISTS public.ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  context JSONB, -- contexto da conversa
  last_intent TEXT,
  confidence DECIMAL(3,2),
  handoff_triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 11. Handoffs para humanos
CREATE TABLE IF NOT EXISTS public.handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'waiting', -- waiting, assigned, resolved
  assigned_to UUID REFERENCES public.users(id),
  assigned_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 12. Agendamentos
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  meet_link TEXT,
  google_event_id TEXT,
  status TEXT DEFAULT 'scheduled', -- scheduled, confirmed, cancelled
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 13. Log de eventos brutos (webhook)
CREATE TABLE IF NOT EXISTS public.events_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contacts_wa_phone_e164 ON public.contacts(wa_phone_e164);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_id ON public.contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact_id ON public.conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_session_expires ON public.conversations(session_expires_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_wa_msg_id ON public.messages(wa_msg_id);
CREATE INDEX IF NOT EXISTS idx_campaign_targets_campaign_id ON public.campaign_targets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_wa_templates_tenant_name ON public.wa_templates(tenant_id, name);

-- Função helper: retorna tenant_id ativo do usuário logado
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE SQL STABLE
AS $$
  SELECT tu.tenant_id
  FROM public.users u
  JOIN public.tenant_users tu ON tu.user_id = u.id
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1
$$;
