-- Migração para tabelas de etiquetas WhatsApp
-- Execute: supabase db push

-- Criar tabela para armazenar etiquetas WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_key TEXT NOT NULL,
  label_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#FF6B6B',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que cada usuário tenha apenas uma etiqueta por ID por instância
  UNIQUE(user_id, instance_key, label_id)
);

-- Criar tabela para armazenar associações de etiquetas com chats
CREATE TABLE IF NOT EXISTS whatsapp_label_associations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_key TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  label_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que cada chat tenha apenas uma associação por etiqueta
  UNIQUE(user_id, instance_key, chat_id, label_id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_labels_user_id ON whatsapp_labels(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_labels_instance_key ON whatsapp_labels(instance_key);
CREATE INDEX IF NOT EXISTS idx_whatsapp_labels_label_id ON whatsapp_labels(label_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_label_associations_user_id ON whatsapp_label_associations(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_label_associations_instance_key ON whatsapp_label_associations(instance_key);
CREATE INDEX IF NOT EXISTS idx_whatsapp_label_associations_chat_id ON whatsapp_label_associations(chat_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_label_associations_label_id ON whatsapp_label_associations(label_id);

-- Habilitar RLS
ALTER TABLE whatsapp_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_label_associations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para whatsapp_labels
CREATE POLICY "Users can view own labels" ON whatsapp_labels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own labels" ON whatsapp_labels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own labels" ON whatsapp_labels
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own labels" ON whatsapp_labels
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para whatsapp_label_associations
CREATE POLICY "Users can view own label associations" ON whatsapp_label_associations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own label associations" ON whatsapp_label_associations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own label associations" ON whatsapp_label_associations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own label associations" ON whatsapp_label_associations
  FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_whatsapp_labels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER trigger_update_whatsapp_labels_updated_at
  BEFORE UPDATE ON whatsapp_labels
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_labels_updated_at();

-- Comentários para documentação
COMMENT ON TABLE whatsapp_labels IS 'Etiquetas WhatsApp dos usuários';
COMMENT ON COLUMN whatsapp_labels.user_id IS 'ID do usuário proprietário das etiquetas';
COMMENT ON COLUMN whatsapp_labels.instance_key IS 'Chave da instância WhatsApp';
COMMENT ON COLUMN whatsapp_labels.label_id IS 'ID da etiqueta no WhatsApp';
COMMENT ON COLUMN whatsapp_labels.name IS 'Nome da etiqueta';
COMMENT ON COLUMN whatsapp_labels.color IS 'Cor da etiqueta (hex)';
COMMENT ON COLUMN whatsapp_labels.description IS 'Descrição da etiqueta';

COMMENT ON TABLE whatsapp_label_associations IS 'Associações entre chats e etiquetas WhatsApp';
COMMENT ON COLUMN whatsapp_label_associations.user_id IS 'ID do usuário proprietário das associações';
COMMENT ON COLUMN whatsapp_label_associations.instance_key IS 'Chave da instância WhatsApp';
COMMENT ON COLUMN whatsapp_label_associations.chat_id IS 'ID do chat no WhatsApp';
COMMENT ON COLUMN whatsapp_label_associations.label_id IS 'ID da etiqueta no WhatsApp';
