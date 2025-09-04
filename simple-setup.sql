-- Setup simples para WhatsApp - apenas tabelas essenciais
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. Criar extensão uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de tenants (organizações)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Tabela de usuários
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(auth_user_id)
);

-- 4. Tabela de vínculo usuário-tenant
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(tenant_id, user_id)
);

-- 5. Tabela de contatos (ESSENCIAL para resolver o erro)
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  wa_phone_e164 TEXT NOT NULL,
  name TEXT,
  opt_in_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(tenant_id, wa_phone_e164)
);

-- 6. Tabela de conversas
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'open',
  session_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. Tabela de mensagens
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB,
  wa_msg_id TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. Tabela de eventos (webhook)
CREATE TABLE IF NOT EXISTS public.events_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Inserir tenant padrão para testes
INSERT INTO public.tenants (id, name, slug, company_name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Coruss',
  'coruss',
  'Coruss'
) ON CONFLICT (id) DO NOTHING;

-- Inserir usuário padrão para testes
INSERT INTO public.users (id, auth_user_id, email, full_name)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  'admin@coruss.com.br',
  'Admin Coruss'
) ON CONFLICT (id) DO NOTHING;

-- Vincular usuário ao tenant
INSERT INTO public.tenant_users (tenant_id, user_id, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'owner'
) ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- Verificar se as tabelas foram criadas
SELECT 'Tabelas criadas com sucesso!' as status;
