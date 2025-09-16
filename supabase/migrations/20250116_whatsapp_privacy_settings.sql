-- Migração para tabela de configurações de privacidade WhatsApp
-- Execute: supabase db push

-- Criar tabela para armazenar configurações de privacidade WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_privacy_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_key TEXT NOT NULL,
  last_seen TEXT CHECK (last_seen IN ('everyone', 'contacts', 'contacts_except', 'nobody')),
  online TEXT CHECK (online IN ('everyone', 'contacts', 'contacts_except', 'nobody')),
  profile_picture TEXT CHECK (profile_picture IN ('everyone', 'contacts', 'contacts_except', 'nobody')),
  status TEXT CHECK (status IN ('everyone', 'contacts', 'contacts_except', 'nobody')),
  read_receipts BOOLEAN DEFAULT true,
  groups_add TEXT CHECK (groups_add IN ('everyone', 'contacts', 'contacts_except', 'nobody')),
  call_add TEXT CHECK (call_add IN ('everyone', 'contacts', 'contacts_except', 'nobody')),
  disappearing_mode BOOLEAN DEFAULT false,
  disappearing_time INTEGER DEFAULT 86400, -- em segundos (24 horas)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que cada usuário tenha apenas uma configuração por instância
  UNIQUE(user_id, instance_key)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_privacy_settings_user_id ON whatsapp_privacy_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_privacy_settings_instance_key ON whatsapp_privacy_settings(instance_key);

-- Habilitar RLS
ALTER TABLE whatsapp_privacy_settings ENABLE ROW LEVEL SECURITY;

-- Política RLS: usuários podem ver apenas suas próprias configurações
CREATE POLICY "Users can view own privacy settings" ON whatsapp_privacy_settings
  FOR SELECT USING (auth.uid() = user_id);

-- Política RLS: usuários podem inserir suas próprias configurações
CREATE POLICY "Users can insert own privacy settings" ON whatsapp_privacy_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política RLS: usuários podem atualizar suas próprias configurações
CREATE POLICY "Users can update own privacy settings" ON whatsapp_privacy_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Política RLS: usuários podem deletar suas próprias configurações
CREATE POLICY "Users can delete own privacy settings" ON whatsapp_privacy_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_whatsapp_privacy_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER trigger_update_whatsapp_privacy_settings_updated_at
  BEFORE UPDATE ON whatsapp_privacy_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_privacy_settings_updated_at();

-- Comentários para documentação
COMMENT ON TABLE whatsapp_privacy_settings IS 'Configurações de privacidade WhatsApp dos usuários';
COMMENT ON COLUMN whatsapp_privacy_settings.user_id IS 'ID do usuário proprietário das configurações';
COMMENT ON COLUMN whatsapp_privacy_settings.instance_key IS 'Chave da instância WhatsApp';
COMMENT ON COLUMN whatsapp_privacy_settings.last_seen IS 'Quem pode ver quando você esteve online por último';
COMMENT ON COLUMN whatsapp_privacy_settings.online IS 'Quem pode ver quando você está online';
COMMENT ON COLUMN whatsapp_privacy_settings.profile_picture IS 'Quem pode ver sua foto do perfil';
COMMENT ON COLUMN whatsapp_privacy_settings.status IS 'Quem pode ver seu status';
COMMENT ON COLUMN whatsapp_privacy_settings.read_receipts IS 'Enviar confirmações de leitura';
COMMENT ON COLUMN whatsapp_privacy_settings.groups_add IS 'Quem pode adicionar você a grupos';
COMMENT ON COLUMN whatsapp_privacy_settings.call_add IS 'Quem pode adicionar você a chamadas';
COMMENT ON COLUMN whatsapp_privacy_settings.disappearing_mode IS 'Modo de mensagens temporárias ativado';
COMMENT ON COLUMN whatsapp_privacy_settings.disappearing_time IS 'Tempo para mensagens temporárias (em segundos)';
