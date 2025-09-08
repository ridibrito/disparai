-- Conectar campanhas com instâncias WhatsApp
-- Adicionar campos necessários para integração com sistema de disparos

-- Adicionar campo para referenciar a instância WhatsApp ativa
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS whatsapp_instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL;

-- Adicionar campo para referenciar a conexão API ativa
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS api_connection_id UUID REFERENCES public.api_connections(id) ON DELETE SET NULL;

-- Adicionar campo para armazenar o ID da mensagem no WhatsApp
ALTER TABLE public.campaign_messages 
ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT;

-- Adicionar campo para armazenar o número de telefone do destinatário
ALTER TABLE public.campaign_messages 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Adicionar campo para armazenar o nome do destinatário
ALTER TABLE public.campaign_messages 
ADD COLUMN IF NOT EXISTS recipient_name TEXT;

-- Adicionar campo para armazenar dados da mensagem (conteúdo, mídia, etc.)
ALTER TABLE public.campaign_messages 
ADD COLUMN IF NOT EXISTS message_data JSONB;

-- Adicionar campo para armazenar tentativas de envio
ALTER TABLE public.campaign_messages 
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Adicionar campo para armazenar próxima tentativa
ALTER TABLE public.campaign_messages 
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE;

-- Adicionar campo para armazenar delay entre mensagens (em segundos)
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS message_delay INTEGER DEFAULT 1;

-- Adicionar campo para armazenar configurações de envio
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS send_settings JSONB DEFAULT '{}';

-- Adicionar campo para armazenar estatísticas da campanha
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS statistics JSONB DEFAULT '{
  "total_recipients": 0,
  "sent": 0,
  "delivered": 0,
  "read": 0,
  "failed": 0,
  "pending": 0
}';

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_campaigns_whatsapp_instance_id ON public.campaigns(whatsapp_instance_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_api_connection_id ON public.campaigns(api_connection_id);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_whatsapp_message_id ON public.campaign_messages(whatsapp_message_id);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_phone_number ON public.campaign_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_retry_count ON public.campaign_messages(retry_count);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_next_retry_at ON public.campaign_messages(next_retry_at);

-- Comentários para documentação
COMMENT ON COLUMN public.campaigns.whatsapp_instance_id IS 'ID da instância WhatsApp que será usada para enviar as mensagens';
COMMENT ON COLUMN public.campaigns.api_connection_id IS 'ID da conexão API ativa para envio';
COMMENT ON COLUMN public.campaigns.message_delay IS 'Delay em segundos entre o envio de cada mensagem';
COMMENT ON COLUMN public.campaigns.send_settings IS 'Configurações específicas de envio (horários, limites, etc.)';
COMMENT ON COLUMN public.campaigns.statistics IS 'Estatísticas da campanha (total, enviadas, entregues, etc.)';

COMMENT ON COLUMN public.campaign_messages.whatsapp_message_id IS 'ID da mensagem no WhatsApp (retornado pela API)';
COMMENT ON COLUMN public.campaign_messages.phone_number IS 'Número de telefone do destinatário';
COMMENT ON COLUMN public.campaign_messages.recipient_name IS 'Nome do destinatário';
COMMENT ON COLUMN public.campaign_messages.message_data IS 'Dados da mensagem (conteúdo, mídia, formatação)';
COMMENT ON COLUMN public.campaign_messages.retry_count IS 'Número de tentativas de envio';
COMMENT ON COLUMN public.campaign_messages.next_retry_at IS 'Próxima tentativa de envio (para mensagens com falha)';

-- Função para atualizar estatísticas da campanha automaticamente
CREATE OR REPLACE FUNCTION update_campaign_statistics()
RETURNS TRIGGER AS $$
DECLARE
  campaign_uuid UUID;
  stats JSONB;
BEGIN
  -- Determinar o ID da campanha
  IF TG_OP = 'DELETE' THEN
    campaign_uuid := OLD.campaign_id;
  ELSE
    campaign_uuid := NEW.campaign_id;
  END IF;

  -- Calcular estatísticas
  SELECT jsonb_build_object(
    'total_recipients', COUNT(*),
    'sent', COUNT(*) FILTER (WHERE status = 'sent'),
    'delivered', COUNT(*) FILTER (WHERE status = 'delivered'),
    'read', COUNT(*) FILTER (WHERE status = 'read'),
    'failed', COUNT(*) FILTER (WHERE status = 'failed'),
    'pending', COUNT(*) FILTER (WHERE status = 'pending')
  ) INTO stats
  FROM public.campaign_messages
  WHERE campaign_id = campaign_uuid;

  -- Atualizar estatísticas na campanha
  UPDATE public.campaigns
  SET statistics = stats
  WHERE id = campaign_uuid;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estatísticas automaticamente
CREATE TRIGGER update_campaign_statistics_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.campaign_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_statistics();

-- Função para obter instância WhatsApp ativa do usuário
CREATE OR REPLACE FUNCTION get_active_whatsapp_instance(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  instance_id UUID;
BEGIN
  -- Buscar instância ativa do usuário
  SELECT wi.id INTO instance_id
  FROM public.whatsapp_instances wi
  JOIN public.api_connections ac ON ac.instance_id = wi.instance_key
  WHERE ac.user_id = user_uuid 
    AND wi.status = 'ativo'
    AND ac.is_active = true
    AND ac.status = 'active'
  ORDER BY wi.created_at DESC
  LIMIT 1;

  RETURN instance_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter conexão API ativa do usuário
CREATE OR REPLACE FUNCTION get_active_api_connection(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  connection_id UUID;
BEGIN
  -- Buscar conexão ativa do usuário
  SELECT id INTO connection_id
  FROM public.api_connections
  WHERE user_id = user_uuid 
    AND is_active = true
    AND status = 'active'
    AND provider = 'disparai'
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN connection_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
