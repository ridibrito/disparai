-- =====================================================
-- MIGRAÇÃO MANUAL PARA TABELA api_connections
-- Execute este código no SQL Editor do Supabase
-- =====================================================

-- 1. Adicionar campo name para identificar a conexão
ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS name TEXT;

-- 2. Adicionar campo instance_id para armazenar a chave da instância
ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS instance_id TEXT;

-- 3. Adicionar campo is_active para controlar se a conexão está ativa
ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- 4. Adicionar campo status para controlar o status da conexão
ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 5. Adicionar campo description para descrição da conexão
ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 6. Adicionar campo webhook_url para URL do webhook
ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS webhook_url TEXT;

-- 7. Adicionar campo phone_number_id para ID do número de telefone
ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS phone_number_id TEXT;

-- 8. Adicionar campo provider para identificar o provedor (disparai, evolution, etc.)
ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'disparai';

-- 9. Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_api_connections_instance_id ON public.api_connections(instance_id);
CREATE INDEX IF NOT EXISTS idx_api_connections_status ON public.api_connections(status);
CREATE INDEX IF NOT EXISTS idx_api_connections_is_active ON public.api_connections(is_active);
CREATE INDEX IF NOT EXISTS idx_api_connections_provider ON public.api_connections(provider);

-- 10. Atualizar registros existentes para ter valores padrão
UPDATE public.api_connections 
SET 
  name = COALESCE(name, 'Conexão WhatsApp'),
  status = COALESCE(status, 'pending'),
  is_active = COALESCE(is_active, false),
  provider = COALESCE(provider, 'disparai')
WHERE name IS NULL OR status IS NULL OR is_active IS NULL OR provider IS NULL;

-- 11. Adicionar comentários para documentação
COMMENT ON COLUMN public.api_connections.name IS 'Nome identificador da conexão';
COMMENT ON COLUMN public.api_connections.instance_id IS 'ID da instância no servidor Disparai';
COMMENT ON COLUMN public.api_connections.is_active IS 'Indica se a conexão está ativa';
COMMENT ON COLUMN public.api_connections.status IS 'Status da conexão (pending, connected, disconnected, error)';
COMMENT ON COLUMN public.api_connections.description IS 'Descrição da conexão';
COMMENT ON COLUMN public.api_connections.webhook_url IS 'URL do webhook para receber eventos';
COMMENT ON COLUMN public.api_connections.phone_number_id IS 'ID do número de telefone no WhatsApp';
COMMENT ON COLUMN public.api_connections.provider IS 'Provedor da API (disparai, evolution, etc.)';

-- =====================================================
-- VERIFICAÇÃO - Execute este código para verificar se funcionou
-- =====================================================

-- Verificar se os campos foram adicionados
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'api_connections' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se os índices foram criados
SELECT 
  indexname, 
  indexdef
FROM pg_indexes 
WHERE tablename = 'api_connections' 
  AND schemaname = 'public';

-- =====================================================
-- INSTRUÇÕES DE EXECUÇÃO:
-- =====================================================
-- 1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
-- 2. Selecione seu projeto: doriuzvietifszgipexy
-- 3. Vá em SQL Editor
-- 4. Cole este código completo
-- 5. Clique em "Run" para executar
-- 6. Verifique se não há erros na execução
-- =====================================================
