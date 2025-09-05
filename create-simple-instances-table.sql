-- Criar tabela simplificada para gerenciar instâncias WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id TEXT NOT NULL,
  instance_key TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'ativo', 'desconectado')),
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_organization_id ON whatsapp_instances(organization_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_instance_key ON whatsapp_instances(instance_key);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON whatsapp_instances(status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Política simples para permitir todas as operações (temporária para teste)
CREATE POLICY "Allow all operations for testing" ON whatsapp_instances
  FOR ALL USING (true) WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_whatsapp_instances_updated_at 
  BEFORE UPDATE ON whatsapp_instances 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
