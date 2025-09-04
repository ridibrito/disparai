-- Execute cada bloco separadamente para identificar problemas

-- BLOCO 1: Verificar extensões
SELECT 'Verificando extensões...' as status;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SELECT 'Extensão uuid-ossp criada/verificada' as status;

-- BLOCO 2: Criar tabela tenants
SELECT 'Criando tabela tenants...' as status;
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
SELECT 'Tabela tenants criada' as status;

-- BLOCO 3: Criar tabela users
SELECT 'Criando tabela users...' as status;
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(auth_user_id)
);
SELECT 'Tabela users criada' as status;

-- BLOCO 4: Criar tabela tenant_users
SELECT 'Criando tabela tenant_users...' as status;
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(tenant_id, user_id)
);
SELECT 'Tabela tenant_users criada' as status;

-- BLOCO 5: Criar tabela contacts (ESSENCIAL!)
SELECT 'Criando tabela contacts...' as status;
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  wa_phone_e164 TEXT NOT NULL,
  name TEXT,
  opt_in_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(tenant_id, wa_phone_e164)
);
SELECT 'Tabela contacts criada com wa_phone_e164!' as status;

-- BLOCO 6: Criar tabela conversations
SELECT 'Criando tabela conversations...' as status;
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'open',
  session_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
SELECT 'Tabela conversations criada' as status;

-- BLOCO 7: Criar tabela messages
SELECT 'Criando tabela messages...' as status;
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
SELECT 'Tabela messages criada' as status;

-- BLOCO 8: Criar tabela events_raw
SELECT 'Criando tabela events_raw...' as status;
CREATE TABLE IF NOT EXISTS public.events_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
SELECT 'Tabela events_raw criada' as status;

-- BLOCO 9: Inserir dados de teste
SELECT 'Inserindo dados de teste...' as status;
INSERT INTO public.tenants (id, name, slug, company_name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Coruss',
  'coruss',
  'Coruss'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, auth_user_id, email, full_name)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  'admin@coruss.com.br',
  'Admin Coruss'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tenant_users (tenant_id, user_id, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'owner'
) ON CONFLICT (tenant_id, user_id) DO NOTHING;

SELECT 'Dados de teste inseridos' as status;

-- BLOCO 10: Verificar tabelas criadas
SELECT 'Verificando tabelas criadas...' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tenants', 'users', 'tenant_users', 'contacts', 'conversations', 'messages', 'events_raw')
ORDER BY table_name;

-- BLOCO 11: Verificar coluna wa_phone_e164
SELECT 'Verificando coluna wa_phone_e164...' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'contacts' 
AND column_name = 'wa_phone_e164';
