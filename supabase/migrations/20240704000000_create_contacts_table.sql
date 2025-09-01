-- Criar tabela de contatos
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  group TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Criar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS contacts_user_id_idx ON contacts(user_id);
CREATE INDEX IF NOT EXISTS contacts_phone_idx ON contacts(phone);
CREATE INDEX IF NOT EXISTS contacts_group_idx ON contacts(group);

-- Habilitar RLS (Row Level Security)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
-- Política para SELECT: usuários só podem ver seus próprios contatos
CREATE POLICY "Users can view their own contacts" 
  ON contacts FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para INSERT: usuários só podem inserir contatos associados a eles mesmos
CREATE POLICY "Users can insert their own contacts" 
  ON contacts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários só podem atualizar seus próprios contatos
CREATE POLICY "Users can update their own contacts" 
  ON contacts FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política para DELETE: usuários só podem excluir seus próprios contatos
CREATE POLICY "Users can delete their own contacts" 
  ON contacts FOR DELETE 
  USING (auth.uid() = user_id);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o campo updated_at automaticamente
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON contacts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();