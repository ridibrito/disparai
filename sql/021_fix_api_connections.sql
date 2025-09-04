-- Script para corrigir a tabela api_connections existente
-- Execute: psql "$DATABASE_URL" -f sql/021_fix_api_connections.sql

-- Adicionar colunas que estão faltando na tabela api_connections
ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error'));

ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;

ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS monthly_limit INTEGER DEFAULT 5000;

ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS last_tested_at TIMESTAMPTZ;

ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now() NOT NULL;

ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;

-- Adicionar colunas que podem estar faltando
ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('whatsapp_cloud', 'whatsapp_disparai'));

ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS instance_id TEXT;

ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS api_key TEXT;

ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS api_secret TEXT;

ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS webhook_url TEXT;

ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.api_connections 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_api_connections_user_id ON public.api_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_api_connections_type ON public.api_connections(type);
CREATE INDEX IF NOT EXISTS idx_api_connections_status ON public.api_connections(status);
CREATE INDEX IF NOT EXISTS idx_api_connections_active ON public.api_connections(is_active);

-- Criar tabela de logs se não existir
CREATE TABLE IF NOT EXISTS public.connection_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES public.api_connections(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'send_message', 'test_connection', 'webhook_received'
  success BOOLEAN NOT NULL,
  message_count INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_connection_usage_logs_connection_id ON public.connection_usage_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_connection_usage_logs_created_at ON public.connection_usage_logs(created_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_api_connections_updated_at ON public.api_connections;
CREATE TRIGGER update_api_connections_updated_at
  BEFORE UPDATE ON public.api_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS se não estiver habilitado
ALTER TABLE public.api_connections ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS se não existirem
DROP POLICY IF EXISTS "Users can view own connections" ON public.api_connections;
CREATE POLICY "Users can view own connections" ON public.api_connections
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own connections" ON public.api_connections;
CREATE POLICY "Users can insert own connections" ON public.api_connections
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own connections" ON public.api_connections;
CREATE POLICY "Users can update own connections" ON public.api_connections
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own connections" ON public.api_connections;
CREATE POLICY "Users can delete own connections" ON public.api_connections
  FOR DELETE USING (user_id = auth.uid());

-- RLS para logs
ALTER TABLE public.connection_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own connection logs" ON public.connection_usage_logs;
CREATE POLICY "Users can view own connection logs" ON public.connection_usage_logs
  FOR SELECT USING (
    connection_id IN (
      SELECT id FROM public.api_connections WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert connection logs" ON public.connection_usage_logs;
CREATE POLICY "System can insert connection logs" ON public.connection_usage_logs
  FOR INSERT WITH CHECK (true);

-- Função helper para obter conexão ativa por tipo
CREATE OR REPLACE FUNCTION public.get_active_connection(
  p_user_id UUID,
  p_type TEXT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  phone_number TEXT,
  instance_id TEXT,
  api_key TEXT,
  api_secret TEXT,
  webhook_url TEXT,
  status TEXT
)
LANGUAGE SQL STABLE
AS $$
  SELECT 
    ac.id,
    ac.name,
    ac.type,
    ac.phone_number,
    ac.instance_id,
    ac.api_key,
    ac.api_secret,
    ac.webhook_url,
    ac.status
  FROM public.api_connections ac
  WHERE ac.user_id = p_user_id
    AND ac.type = p_type
    AND ac.is_active = true
    AND ac.status = 'active'
  ORDER BY ac.created_at DESC
  LIMIT 1;
$$;

-- Função para registrar uso da conexão
CREATE OR REPLACE FUNCTION public.log_connection_usage(
  p_connection_id UUID,
  p_action TEXT,
  p_success BOOLEAN,
  p_message_count INTEGER DEFAULT 0,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.connection_usage_logs (
    connection_id,
    action,
    success,
    message_count,
    error_message,
    metadata
  ) VALUES (
    p_connection_id,
    p_action,
    p_success,
    p_message_count,
    p_error_message,
    p_metadata
  ) RETURNING id INTO log_id;

  -- Atualizar contador de mensagens se for sucesso
  IF p_success AND p_message_count > 0 THEN
    UPDATE public.api_connections
    SET message_count = message_count + p_message_count
    WHERE id = p_connection_id;
  END IF;

  RETURN log_id;
END;
$$;

-- Atualizar tabela wa_accounts para referenciar api_connections
ALTER TABLE public.wa_accounts 
ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES public.api_connections(id) ON DELETE SET NULL;

-- Verificar se a tabela foi criada corretamente
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'api_connections' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
