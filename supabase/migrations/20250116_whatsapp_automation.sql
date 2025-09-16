-- Migração para sistema de automação WhatsApp
-- Execute: supabase db push

-- Criar tabela para workflows de automação
CREATE TABLE IF NOT EXISTS whatsapp_automation_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_key TEXT NOT NULL,
  name TEXT NOT NULL,
  trigger TEXT CHECK (trigger IN ('message_received', 'message_sent', 'status_changed', 'time_based')) NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela para templates de automação
CREATE TABLE IF NOT EXISTS whatsapp_automation_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_key TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que cada usuário tenha apenas um template com o mesmo nome por instância
  UNIQUE(user_id, instance_key, template_name)
);

-- Criar tabela para logs de execução de workflows
CREATE TABLE IF NOT EXISTS whatsapp_automation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES whatsapp_automation_workflows(id) ON DELETE CASCADE,
  instance_key TEXT NOT NULL,
  context JSONB,
  results JSONB,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_workflows_user_id ON whatsapp_automation_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_workflows_instance_key ON whatsapp_automation_workflows(instance_key);
CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_workflows_trigger ON whatsapp_automation_workflows(trigger);
CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_workflows_enabled ON whatsapp_automation_workflows(enabled);

CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_templates_user_id ON whatsapp_automation_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_templates_instance_key ON whatsapp_automation_templates(instance_key);

CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_logs_workflow_id ON whatsapp_automation_logs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_logs_instance_key ON whatsapp_automation_logs(instance_key);
CREATE INDEX IF NOT EXISTS idx_whatsapp_automation_logs_executed_at ON whatsapp_automation_logs(executed_at);

-- Habilitar RLS
ALTER TABLE whatsapp_automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_automation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_automation_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para workflows
CREATE POLICY "Users can view own automation workflows" ON whatsapp_automation_workflows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own automation workflows" ON whatsapp_automation_workflows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own automation workflows" ON whatsapp_automation_workflows
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own automation workflows" ON whatsapp_automation_workflows
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para templates
CREATE POLICY "Users can view own automation templates" ON whatsapp_automation_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own automation templates" ON whatsapp_automation_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own automation templates" ON whatsapp_automation_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own automation templates" ON whatsapp_automation_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para logs
CREATE POLICY "Users can view own automation logs" ON whatsapp_automation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM whatsapp_automation_workflows 
      WHERE id = whatsapp_automation_logs.workflow_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert automation logs" ON whatsapp_automation_logs
  FOR INSERT WITH CHECK (true);

-- Funções para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_whatsapp_automation_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_whatsapp_automation_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER trigger_update_whatsapp_automation_workflows_updated_at
  BEFORE UPDATE ON whatsapp_automation_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_automation_workflows_updated_at();

CREATE TRIGGER trigger_update_whatsapp_automation_templates_updated_at
  BEFORE UPDATE ON whatsapp_automation_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_automation_templates_updated_at();

-- Comentários para documentação
COMMENT ON TABLE whatsapp_automation_workflows IS 'Workflows de automação WhatsApp dos usuários';
COMMENT ON COLUMN whatsapp_automation_workflows.user_id IS 'ID do usuário proprietário do workflow';
COMMENT ON COLUMN whatsapp_automation_workflows.instance_key IS 'Chave da instância WhatsApp';
COMMENT ON COLUMN whatsapp_automation_workflows.name IS 'Nome do workflow';
COMMENT ON COLUMN whatsapp_automation_workflows.trigger IS 'Tipo de gatilho do workflow';
COMMENT ON COLUMN whatsapp_automation_workflows.conditions IS 'Condições para execução do workflow';
COMMENT ON COLUMN whatsapp_automation_workflows.actions IS 'Ações a serem executadas';
COMMENT ON COLUMN whatsapp_automation_workflows.enabled IS 'Se o workflow está ativo';

COMMENT ON TABLE whatsapp_automation_templates IS 'Templates de workflows de automação';
COMMENT ON COLUMN whatsapp_automation_templates.user_id IS 'ID do usuário proprietário do template';
COMMENT ON COLUMN whatsapp_automation_templates.instance_key IS 'Chave da instância WhatsApp';
COMMENT ON COLUMN whatsapp_automation_templates.template_name IS 'Nome do template';
COMMENT ON COLUMN whatsapp_automation_templates.template_data IS 'Dados do template em formato JSON';

COMMENT ON TABLE whatsapp_automation_logs IS 'Logs de execução de workflows';
COMMENT ON COLUMN whatsapp_automation_logs.workflow_id IS 'ID do workflow executado';
COMMENT ON COLUMN whatsapp_automation_logs.instance_key IS 'Chave da instância WhatsApp';
COMMENT ON COLUMN whatsapp_automation_logs.context IS 'Contexto da execução';
COMMENT ON COLUMN whatsapp_automation_logs.results IS 'Resultados das ações executadas';
COMMENT ON COLUMN whatsapp_automation_logs.executed_at IS 'Data e hora da execução';
