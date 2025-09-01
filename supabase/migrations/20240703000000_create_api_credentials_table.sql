-- Criar tabela para armazenar credenciais de API
CREATE TABLE IF NOT EXISTS api_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  api_key TEXT NOT NULL,
  api_secret TEXT,
  phone_number_id TEXT,
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar índice para consultas por usuário
CREATE INDEX IF NOT EXISTS api_credentials_user_id_idx ON api_credentials(user_id);

-- Adicionar política RLS para proteger os dados
ALTER TABLE api_credentials ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas suas próprias credenciais
CREATE POLICY "Users can view their own api credentials"
  ON api_credentials
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para permitir que usuários insiram suas próprias credenciais
CREATE POLICY "Users can insert their own api credentials"
  ON api_credentials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem suas próprias credenciais
CREATE POLICY "Users can update their own api credentials"
  ON api_credentials
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política para permitir que usuários excluam suas próprias credenciais
CREATE POLICY "Users can delete their own api credentials"
  ON api_credentials
  FOR DELETE
  USING (auth.uid() = user_id);

-- Atualizar a tabela de planos para incluir o recurso de API personalizada
ALTER TABLE plans
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}'::JSONB;

-- Atualizar os planos existentes para incluir o recurso de API personalizada
UPDATE plans
SET features = jsonb_set(
  COALESCE(features, '{}'::JSONB),
  '{api_personalizada}',
  'false'::JSONB
)
WHERE name = 'Básico';

UPDATE plans
SET features = jsonb_set(
  COALESCE(features, '{}'::JSONB),
  '{api_personalizada}',
  'true'::JSONB
)
WHERE name IN ('Profissional', 'Empresarial');

-- Adicionar limite de APIs por plano
UPDATE plans
SET features = jsonb_set(
  COALESCE(features, '{}'::JSONB),
  '{api_limit}',
  '0'::JSONB
)
WHERE name = 'Básico';

UPDATE plans
SET features = jsonb_set(
  COALESCE(features, '{}'::JSONB),
  '{api_limit}',
  '1'::JSONB
)
WHERE name = 'Profissional';

UPDATE plans
SET features = jsonb_set(
  COALESCE(features, '{}'::JSONB),
  '{api_limit}',
  '3'::JSONB
)
WHERE name = 'Empresarial';