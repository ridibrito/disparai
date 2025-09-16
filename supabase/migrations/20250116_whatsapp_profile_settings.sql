-- Migração para tabela de configurações de perfil WhatsApp
-- Execute: supabase db push

-- Criar tabela para armazenar configurações de perfil WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_profile_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_key TEXT NOT NULL,
  profile_name TEXT,
  profile_status TEXT,
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que cada usuário tenha apenas uma configuração por instância
  UNIQUE(user_id, instance_key)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_profile_settings_user_id ON whatsapp_profile_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_profile_settings_instance_key ON whatsapp_profile_settings(instance_key);

-- Habilitar RLS
ALTER TABLE whatsapp_profile_settings ENABLE ROW LEVEL SECURITY;

-- Política RLS: usuários podem ver apenas suas próprias configurações
CREATE POLICY "Users can view own profile settings" ON whatsapp_profile_settings
  FOR SELECT USING (auth.uid() = user_id);

-- Política RLS: usuários podem inserir suas próprias configurações
CREATE POLICY "Users can insert own profile settings" ON whatsapp_profile_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política RLS: usuários podem atualizar suas próprias configurações
CREATE POLICY "Users can update own profile settings" ON whatsapp_profile_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Política RLS: usuários podem deletar suas próprias configurações
CREATE POLICY "Users can delete own profile settings" ON whatsapp_profile_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_whatsapp_profile_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER trigger_update_whatsapp_profile_settings_updated_at
  BEFORE UPDATE ON whatsapp_profile_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_profile_settings_updated_at();

-- Comentários para documentação
COMMENT ON TABLE whatsapp_profile_settings IS 'Configurações de perfil WhatsApp dos usuários';
COMMENT ON COLUMN whatsapp_profile_settings.user_id IS 'ID do usuário proprietário das configurações';
COMMENT ON COLUMN whatsapp_profile_settings.instance_key IS 'Chave da instância WhatsApp';
COMMENT ON COLUMN whatsapp_profile_settings.profile_name IS 'Nome do perfil WhatsApp';
COMMENT ON COLUMN whatsapp_profile_settings.profile_status IS 'Status do perfil WhatsApp';
COMMENT ON COLUMN whatsapp_profile_settings.profile_picture_url IS 'URL da foto do perfil WhatsApp';
