-- Adicionar colunas que faltam nas tabelas existentes
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

-- 2. Verificar se a tabela contacts existe, se não, criar
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  wa_phone_e164 TEXT NOT NULL,
  name TEXT,
  opt_in_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Verificar se a tabela tenants existe, se não, criar
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Verificar se a tabela tenant_users existe, se não, criar
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  user_id UUID,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Verificar se a tabela conversations existe, se não, criar
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  contact_id UUID,
  status TEXT DEFAULT 'open',
  session_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Verificar se a tabela messages existe, se não, criar
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

-- 7. Verificar se a tabela events_raw existe, se não, criar
CREATE TABLE IF NOT EXISTS public.events_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. Adicionar foreign keys se não existirem
DO $$ 
BEGIN
  -- Adicionar FK contacts.tenant_id -> tenants.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contacts_tenant_id_fkey'
  ) THEN
    ALTER TABLE public.contacts ADD CONSTRAINT contacts_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    RAISE NOTICE 'FK contacts.tenant_id -> tenants.id adicionada';
  END IF;
  
  -- Adicionar FK tenant_users.tenant_id -> tenants.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tenant_users_tenant_id_fkey'
  ) THEN
    ALTER TABLE public.tenant_users ADD CONSTRAINT tenant_users_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    RAISE NOTICE 'FK tenant_users.tenant_id -> tenants.id adicionada';
  END IF;
  
  -- Adicionar FK tenant_users.user_id -> users.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tenant_users_user_id_fkey'
  ) THEN
    ALTER TABLE public.tenant_users ADD CONSTRAINT tenant_users_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'FK tenant_users.user_id -> users.id adicionada';
  END IF;
  
  -- Adicionar FK conversations.tenant_id -> tenants.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversations_tenant_id_fkey'
  ) THEN
    ALTER TABLE public.conversations ADD CONSTRAINT conversations_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    RAISE NOTICE 'FK conversations.tenant_id -> tenants.id adicionada';
  END IF;
  
  -- Adicionar FK conversations.contact_id -> contacts.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversations_contact_id_fkey'
  ) THEN
    ALTER TABLE public.conversations ADD CONSTRAINT conversations_contact_id_fkey 
    FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;
    RAISE NOTICE 'FK conversations.contact_id -> contacts.id adicionada';
  END IF;
  
  -- Adicionar FK messages.conversation_id -> conversations.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_conversation_id_fkey'
  ) THEN
    ALTER TABLE public.messages ADD CONSTRAINT messages_conversation_id_fkey 
    FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
    RAISE NOTICE 'FK messages.conversation_id -> conversations.id adicionada';
  END IF;
END $$;

-- 9. Inserir dados de teste (apenas se não existirem)
INSERT INTO public.tenants (id, name, slug, company_name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Coruss',
  'coruss',
  'Coruss'
) ON CONFLICT (id) DO NOTHING;

-- 10. Verificar se as tabelas foram criadas
SELECT 'Verificando tabelas criadas...' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tenants', 'users', 'tenant_users', 'contacts', 'conversations', 'messages', 'events_raw')
ORDER BY table_name;

-- 11. Verificar se a coluna wa_phone_e164 existe
SELECT 'Verificando coluna wa_phone_e164...' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'contacts' 
AND column_name = 'wa_phone_e164';
