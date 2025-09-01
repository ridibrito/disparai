-- Criar tabela de campanhas
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  target_groups TEXT[],
  api_credential_id UUID REFERENCES api_credentials(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Criar tabela de mensagens da campanha
CREATE TABLE IF NOT EXISTS campaign_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  message_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Criar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS campaigns_user_id_idx ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS campaigns_status_idx ON campaigns(status);
CREATE INDEX IF NOT EXISTS campaign_messages_campaign_id_idx ON campaign_messages(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_messages_contact_id_idx ON campaign_messages(contact_id);
CREATE INDEX IF NOT EXISTS campaign_messages_status_idx ON campaign_messages(status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_messages ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança para campanhas
-- Política para SELECT: usuários só podem ver suas próprias campanhas
CREATE POLICY "Users can view their own campaigns" 
  ON campaigns FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para INSERT: usuários só podem inserir campanhas associadas a eles mesmos
CREATE POLICY "Users can insert their own campaigns" 
  ON campaigns FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários só podem atualizar suas próprias campanhas
CREATE POLICY "Users can update their own campaigns" 
  ON campaigns FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política para DELETE: usuários só podem excluir suas próprias campanhas
CREATE POLICY "Users can delete their own campaigns" 
  ON campaigns FOR DELETE 
  USING (auth.uid() = user_id);

-- Criar políticas de segurança para mensagens de campanha
-- Política para SELECT: usuários só podem ver mensagens de suas próprias campanhas
CREATE POLICY "Users can view their own campaign messages" 
  ON campaign_messages FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = campaign_messages.campaign_id
    AND campaigns.user_id = auth.uid()
  ));

-- Política para INSERT: usuários só podem inserir mensagens para suas próprias campanhas
CREATE POLICY "Users can insert their own campaign messages" 
  ON campaign_messages FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = campaign_messages.campaign_id
    AND campaigns.user_id = auth.uid()
  ));

-- Política para UPDATE: usuários só podem atualizar mensagens de suas próprias campanhas
CREATE POLICY "Users can update their own campaign messages" 
  ON campaign_messages FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = campaign_messages.campaign_id
    AND campaigns.user_id = auth.uid()
  ));

-- Política para DELETE: usuários só podem excluir mensagens de suas próprias campanhas
CREATE POLICY "Users can delete their own campaign messages" 
  ON campaign_messages FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = campaign_messages.campaign_id
    AND campaigns.user_id = auth.uid()
  ));

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_campaigns_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o campo updated_at automaticamente para campanhas
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON campaigns
FOR EACH ROW
EXECUTE FUNCTION update_campaigns_updated_at_column();

-- Trigger para atualizar o campo updated_at automaticamente para mensagens de campanha
CREATE TRIGGER update_campaign_messages_updated_at
BEFORE UPDATE ON campaign_messages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Atualizar a tabela de planos para incluir o limite de mensagens por plano
UPDATE plans
SET features = jsonb_set(
  COALESCE(features, '{}'::JSONB),
  '{campaign_message_limit}',
  '100'::JSONB
)
WHERE name = 'Básico';

UPDATE plans
SET features = jsonb_set(
  COALESCE(features, '{}'::JSONB),
  '{campaign_message_limit}',
  '1000'::JSONB
)
WHERE name = 'Profissional';

UPDATE plans
SET features = jsonb_set(
  COALESCE(features, '{}'::JSONB),
  '{campaign_message_limit}',
  '10000'::JSONB
)
WHERE name = 'Empresarial';