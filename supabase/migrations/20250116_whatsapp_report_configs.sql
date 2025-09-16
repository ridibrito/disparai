-- Migração para configurações de relatórios WhatsApp
-- Execute: supabase db push

-- Criar tabela para configurações de relatórios
CREATE TABLE IF NOT EXISTS whatsapp_report_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_key TEXT NOT NULL,
  config_name TEXT NOT NULL,
  config_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que cada usuário tenha apenas uma configuração com o mesmo nome por instância
  UNIQUE(user_id, instance_key, config_name)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_report_configs_user_id ON whatsapp_report_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_report_configs_instance_key ON whatsapp_report_configs(instance_key);

-- Habilitar RLS
ALTER TABLE whatsapp_report_configs ENABLE ROW LEVEL SECURITY;

-- Política RLS: usuários podem ver apenas suas próprias configurações
CREATE POLICY "Users can view own report configs" ON whatsapp_report_configs
  FOR SELECT USING (auth.uid() = user_id);

-- Política RLS: usuários podem inserir suas próprias configurações
CREATE POLICY "Users can insert own report configs" ON whatsapp_report_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política RLS: usuários podem atualizar suas próprias configurações
CREATE POLICY "Users can update own report configs" ON whatsapp_report_configs
  FOR UPDATE USING (auth.uid() = user_id);

-- Política RLS: usuários podem deletar suas próprias configurações
CREATE POLICY "Users can delete own report configs" ON whatsapp_report_configs
  FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_whatsapp_report_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER trigger_update_whatsapp_report_configs_updated_at
  BEFORE UPDATE ON whatsapp_report_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_report_configs_updated_at();

-- Comentários para documentação
COMMENT ON TABLE whatsapp_report_configs IS 'Configurações de relatórios WhatsApp dos usuários';
COMMENT ON COLUMN whatsapp_report_configs.user_id IS 'ID do usuário proprietário da configuração';
COMMENT ON COLUMN whatsapp_report_configs.instance_key IS 'Chave da instância WhatsApp';
COMMENT ON COLUMN whatsapp_report_configs.config_name IS 'Nome da configuração';
COMMENT ON COLUMN whatsapp_report_configs.config_data IS 'Dados da configuração em formato JSON';
