-- Adicionar campos necessários à tabela api_connections
-- Para suportar integração com Disparai API (MegaAPI)

-- Adicionar campo name para identificar a conexão
ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Adicionar campo instance_id para armazenar a chave da instância
ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS instance_id TEXT;

-- Adicionar campo is_active para controlar se a conexão está ativa
ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Adicionar campo status para controlar o status da conexão
ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Adicionar campo description para descrição da conexão
ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Adicionar campo webhook_url para URL do webhook
ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS webhook_url TEXT;

-- Adicionar campo phone_number_id para ID do número de telefone
ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS phone_number_id TEXT;

-- Adicionar campo provider para identificar o provedor (disparai, evolution, etc.)
ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'disparai';

-- Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_api_connections_instance_id ON public.api_connections(instance_id);
CREATE INDEX IF NOT EXISTS idx_api_connections_status ON public.api_connections(status);
CREATE INDEX IF NOT EXISTS idx_api_connections_is_active ON public.api_connections(is_active);
CREATE INDEX IF NOT EXISTS idx_api_connections_provider ON public.api_connections(provider);

-- Atualizar registros existentes para ter valores padrão
UPDATE public.api_connections 
SET 
  name = COALESCE(name, 'Conexão WhatsApp'),
  status = COALESCE(status, 'pending'),
  is_active = COALESCE(is_active, false),
  provider = COALESCE(provider, 'disparai')
WHERE name IS NULL OR status IS NULL OR is_active IS NULL OR provider IS NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.api_connections.name IS 'Nome identificador da conexão';
COMMENT ON COLUMN public.api_connections.instance_id IS 'ID da instância no servidor Disparai';
COMMENT ON COLUMN public.api_connections.is_active IS 'Indica se a conexão está ativa';
COMMENT ON COLUMN public.api_connections.status IS 'Status da conexão (pending, connected, disconnected, error)';
COMMENT ON COLUMN public.api_connections.description IS 'Descrição da conexão';
COMMENT ON COLUMN public.api_connections.webhook_url IS 'URL do webhook para receber eventos';
COMMENT ON COLUMN public.api_connections.phone_number_id IS 'ID do número de telefone no WhatsApp';
COMMENT ON COLUMN public.api_connections.provider IS 'Provedor da API (disparai, evolution, etc.)';
