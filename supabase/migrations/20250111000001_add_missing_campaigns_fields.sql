-- Adicionar campos que estão faltando na tabela campaigns
-- Para suportar a funcionalidade completa de disparos

-- Adicionar campo target_contacts para armazenar lista de contatos selecionados
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS target_contacts JSONB DEFAULT '[]';

-- Adicionar campo message_delay se não existir
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS message_delay INTEGER DEFAULT 1;

-- Adicionar campo send_settings se não existir
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS send_settings JSONB DEFAULT '{}';

-- Adicionar campo statistics se não existir
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS statistics JSONB DEFAULT '{
  "total_recipients": 0,
  "sent": 0,
  "delivered": 0,
  "read": 0,
  "failed": 0,
  "pending": 0
}';

-- Adicionar campo whatsapp_instance_id se não existir
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS whatsapp_instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL;

-- Adicionar campo api_connection_id se não existir
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS api_connection_id UUID REFERENCES public.api_connections(id) ON DELETE SET NULL;

-- Adicionar campo started_at se não existir
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- Adicionar campo completed_at se não existir
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Adicionar campo target_groups se não existir
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS target_groups TEXT[];

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_campaigns_target_contacts ON public.campaigns USING GIN(target_contacts);
CREATE INDEX IF NOT EXISTS idx_campaigns_whatsapp_instance_id ON public.campaigns(whatsapp_instance_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_api_connection_id ON public.campaigns(api_connection_id);

-- Comentários para documentação
COMMENT ON COLUMN public.campaigns.target_contacts IS 'Lista de contatos selecionados para o disparo (JSONB array)';
COMMENT ON COLUMN public.campaigns.message_delay IS 'Delay em segundos entre o envio de cada mensagem';
COMMENT ON COLUMN public.campaigns.send_settings IS 'Configurações específicas de envio (horários, limites, etc.)';
COMMENT ON COLUMN public.campaigns.statistics IS 'Estatísticas da campanha (total, enviadas, entregues, etc.)';
COMMENT ON COLUMN public.campaigns.whatsapp_instance_id IS 'ID da instância WhatsApp que será usada para enviar as mensagens';
COMMENT ON COLUMN public.campaigns.api_connection_id IS 'ID da conexão API ativa para envio';
