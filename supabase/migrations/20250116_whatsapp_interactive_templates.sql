-- Migração para tabela de templates interativos WhatsApp
-- Execute: supabase db push

-- Criar tabela para armazenar templates de mensagens interativas
CREATE TABLE IF NOT EXISTS whatsapp_interactive_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_key TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_type TEXT CHECK (template_type IN ('button', 'list', 'template', 'poll')) NOT NULL,
  template_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que cada usuário tenha apenas um template com o mesmo nome por instância
  UNIQUE(user_id, instance_key, template_name)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_interactive_templates_user_id ON whatsapp_interactive_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_interactive_templates_instance_key ON whatsapp_interactive_templates(instance_key);
CREATE INDEX IF NOT EXISTS idx_whatsapp_interactive_templates_type ON whatsapp_interactive_templates(template_type);

-- Habilitar RLS
ALTER TABLE whatsapp_interactive_templates ENABLE ROW LEVEL SECURITY;

-- Política RLS: usuários podem ver apenas seus próprios templates
CREATE POLICY "Users can view own interactive templates" ON whatsapp_interactive_templates
  FOR SELECT USING (auth.uid() = user_id);

-- Política RLS: usuários podem inserir seus próprios templates
CREATE POLICY "Users can insert own interactive templates" ON whatsapp_interactive_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política RLS: usuários podem atualizar seus próprios templates
CREATE POLICY "Users can update own interactive templates" ON whatsapp_interactive_templates
  FOR UPDATE USING (auth.uid() = user_id);

-- Política RLS: usuários podem deletar seus próprios templates
CREATE POLICY "Users can delete own interactive templates" ON whatsapp_interactive_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_whatsapp_interactive_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER trigger_update_whatsapp_interactive_templates_updated_at
  BEFORE UPDATE ON whatsapp_interactive_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_interactive_templates_updated_at();

-- Comentários para documentação
COMMENT ON TABLE whatsapp_interactive_templates IS 'Templates de mensagens interativas WhatsApp dos usuários';
COMMENT ON COLUMN whatsapp_interactive_templates.user_id IS 'ID do usuário proprietário dos templates';
COMMENT ON COLUMN whatsapp_interactive_templates.instance_key IS 'Chave da instância WhatsApp';
COMMENT ON COLUMN whatsapp_interactive_templates.template_name IS 'Nome do template';
COMMENT ON COLUMN whatsapp_interactive_templates.template_type IS 'Tipo do template (button, list, template, poll)';
COMMENT ON COLUMN whatsapp_interactive_templates.template_data IS 'Dados do template em formato JSON';
