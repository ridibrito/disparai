-- Migração para tabela de status das instâncias WhatsApp
-- Execute: supabase db push

-- Criar tabela para armazenar status das instâncias WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_instance_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_key TEXT NOT NULL,
  status TEXT CHECK (status IN ('connected', 'disconnected', 'connecting', 'error')) DEFAULT 'disconnected',
  qr_code TEXT,
  pairing_code TEXT,
  last_seen TIMESTAMP WITH TIME ZONE,
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  is_online BOOLEAN DEFAULT false,
  phone_number TEXT,
  profile_name TEXT,
  profile_picture TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que cada usuário tenha apenas um status por instância
  UNIQUE(user_id, instance_key)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_instance_status_user_id ON whatsapp_instance_status(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instance_status_instance_key ON whatsapp_instance_status(instance_key);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instance_status_status ON whatsapp_instance_status(status);

-- Habilitar RLS
ALTER TABLE whatsapp_instance_status ENABLE ROW LEVEL SECURITY;

-- Política RLS: usuários podem ver apenas seus próprios status
CREATE POLICY "Users can view own instance status" ON whatsapp_instance_status
  FOR SELECT USING (auth.uid() = user_id);

-- Política RLS: usuários podem inserir seus próprios status
CREATE POLICY "Users can insert own instance status" ON whatsapp_instance_status
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política RLS: usuários podem atualizar seus próprios status
CREATE POLICY "Users can update own instance status" ON whatsapp_instance_status
  FOR UPDATE USING (auth.uid() = user_id);

-- Política RLS: usuários podem deletar seus próprios status
CREATE POLICY "Users can delete own instance status" ON whatsapp_instance_status
  FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_whatsapp_instance_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER trigger_update_whatsapp_instance_status_updated_at
  BEFORE UPDATE ON whatsapp_instance_status
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_instance_status_updated_at();

-- Comentários para documentação
COMMENT ON TABLE whatsapp_instance_status IS 'Status das instâncias WhatsApp dos usuários';
COMMENT ON COLUMN whatsapp_instance_status.user_id IS 'ID do usuário proprietário do status';
COMMENT ON COLUMN whatsapp_instance_status.instance_key IS 'Chave da instância WhatsApp';
COMMENT ON COLUMN whatsapp_instance_status.status IS 'Status atual da instância';
COMMENT ON COLUMN whatsapp_instance_status.qr_code IS 'QR Code para conexão';
COMMENT ON COLUMN whatsapp_instance_status.pairing_code IS 'Código de pareamento';
COMMENT ON COLUMN whatsapp_instance_status.last_seen IS 'Última vez que a instância foi vista online';
COMMENT ON COLUMN whatsapp_instance_status.battery_level IS 'Nível de bateria do dispositivo (0-100)';
COMMENT ON COLUMN whatsapp_instance_status.is_online IS 'Se a instância está online';
COMMENT ON COLUMN whatsapp_instance_status.phone_number IS 'Número de telefone da instância';
COMMENT ON COLUMN whatsapp_instance_status.profile_name IS 'Nome do perfil WhatsApp';
COMMENT ON COLUMN whatsapp_instance_status.profile_picture IS 'URL da foto do perfil';
