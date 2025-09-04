-- Corrigir tabelas existentes - adicionar colunas que faltam
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. Adicionar coluna auth_user_id na tabela users (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN auth_user_id UUID;
    ALTER TABLE public.users ADD CONSTRAINT users_auth_user_id_unique UNIQUE (auth_user_id);
    RAISE NOTICE 'Coluna auth_user_id adicionada à tabela users';
  ELSE
    RAISE NOTICE 'Coluna auth_user_id já existe na tabela users';
  END IF;
END $$;

-- 2. Adicionar coluna tenant_id na tabela contacts (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contacts' 
    AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.contacts ADD COLUMN tenant_id UUID;
    RAISE NOTICE 'Coluna tenant_id adicionada à tabela contacts';
  ELSE
    RAISE NOTICE 'Coluna tenant_id já existe na tabela contacts';
  END IF;
END $$;

-- 3. Adicionar coluna wa_phone_e164 na tabela contacts (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contacts' 
    AND column_name = 'wa_phone_e164'
  ) THEN
    ALTER TABLE public.contacts ADD COLUMN wa_phone_e164 TEXT;
    RAISE NOTICE 'Coluna wa_phone_e164 adicionada à tabela contacts';
  ELSE
    RAISE NOTICE 'Coluna wa_phone_e164 já existe na tabela contacts';
  END IF;
END $$;

-- 4. Adicionar coluna opt_in_status na tabela contacts (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contacts' 
    AND column_name = 'opt_in_status'
  ) THEN
    ALTER TABLE public.contacts ADD COLUMN opt_in_status TEXT DEFAULT 'pending';
    RAISE NOTICE 'Coluna opt_in_status adicionada à tabela contacts';
  ELSE
    RAISE NOTICE 'Coluna opt_in_status já existe na tabela contacts';
  END IF;
END $$;

-- 5. Criar tabelas que não existem
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  user_id UUID,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  contact_id UUID,
  status TEXT DEFAULT 'open',
  session_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID,
  direction TEXT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB,
  wa_msg_id TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.events_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Inserir tenant padrão
INSERT INTO public.tenants (id, name, slug, company_name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Coruss',
  'coruss',
  'Coruss'
) ON CONFLICT (id) DO NOTHING;

-- 7. Verificar estrutura final
SELECT 'Estrutura final das tabelas:' as status;

SELECT 'Tabela users:' as table_name;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

SELECT 'Tabela contacts:' as table_name;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'contacts'
ORDER BY ordinal_position;

SELECT 'Tabelas criadas:' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tenants', 'users', 'tenant_users', 'contacts', 'conversations', 'messages', 'events_raw')
ORDER BY table_name;
