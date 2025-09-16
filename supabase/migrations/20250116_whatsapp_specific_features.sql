-- Migração para funcionalidades específicas WhatsApp
-- Execute: supabase db push

-- Criar tabela para validações de números WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_number_validations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_key TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  is_on_whatsapp BOOLEAN NOT NULL,
  is_business BOOLEAN DEFAULT false,
  profile_name TEXT,
  profile_picture TEXT,
  last_seen TIMESTAMP WITH TIME ZONE,
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que cada usuário tenha apenas uma validação por número por instância
  UNIQUE(user_id, instance_key, phone_number)
);

-- Criar tabela para downloads de mídia
CREATE TABLE IF NOT EXISTS whatsapp_media_downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_key TEXT NOT NULL,
  message_id TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'audio', 'document', 'sticker')) NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  download_url TEXT NOT NULL,
  thumbnail_url TEXT,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_number_validations_user_id ON whatsapp_number_validations(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_number_validations_instance_key ON whatsapp_number_validations(instance_key);
CREATE INDEX IF NOT EXISTS idx_whatsapp_number_validations_phone_number ON whatsapp_number_validations(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_number_validations_is_on_whatsapp ON whatsapp_number_validations(is_on_whatsapp);

CREATE INDEX IF NOT EXISTS idx_whatsapp_media_downloads_user_id ON whatsapp_media_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_media_downloads_instance_key ON whatsapp_media_downloads(instance_key);
CREATE INDEX IF NOT EXISTS idx_whatsapp_media_downloads_message_id ON whatsapp_media_downloads(message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_media_downloads_media_type ON whatsapp_media_downloads(media_type);

-- Habilitar RLS
ALTER TABLE whatsapp_number_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_media_downloads ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para validações de números
CREATE POLICY "Users can view own number validations" ON whatsapp_number_validations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own number validations" ON whatsapp_number_validations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own number validations" ON whatsapp_number_validations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own number validations" ON whatsapp_number_validations
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para downloads de mídia
CREATE POLICY "Users can view own media downloads" ON whatsapp_media_downloads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own media downloads" ON whatsapp_media_downloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media downloads" ON whatsapp_media_downloads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own media downloads" ON whatsapp_media_downloads
  FOR DELETE USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE whatsapp_number_validations IS 'Validações de números WhatsApp dos usuários';
COMMENT ON COLUMN whatsapp_number_validations.user_id IS 'ID do usuário proprietário da validação';
COMMENT ON COLUMN whatsapp_number_validations.instance_key IS 'Chave da instância WhatsApp';
COMMENT ON COLUMN whatsapp_number_validations.phone_number IS 'Número de telefone validado';
COMMENT ON COLUMN whatsapp_number_validations.is_on_whatsapp IS 'Se o número está no WhatsApp';
COMMENT ON COLUMN whatsapp_number_validations.is_business IS 'Se é uma conta business';
COMMENT ON COLUMN whatsapp_number_validations.profile_name IS 'Nome do perfil WhatsApp';
COMMENT ON COLUMN whatsapp_number_validations.profile_picture IS 'URL da foto do perfil';
COMMENT ON COLUMN whatsapp_number_validations.last_seen IS 'Última vez visto online';
COMMENT ON COLUMN whatsapp_number_validations.validated_at IS 'Data e hora da validação';

COMMENT ON TABLE whatsapp_media_downloads IS 'Downloads de mídia WhatsApp dos usuários';
COMMENT ON COLUMN whatsapp_media_downloads.user_id IS 'ID do usuário proprietário do download';
COMMENT ON COLUMN whatsapp_media_downloads.instance_key IS 'Chave da instância WhatsApp';
COMMENT ON COLUMN whatsapp_media_downloads.message_id IS 'ID da mensagem de origem';
COMMENT ON COLUMN whatsapp_media_downloads.media_type IS 'Tipo de mídia (image, video, audio, document, sticker)';
COMMENT ON COLUMN whatsapp_media_downloads.file_name IS 'Nome do arquivo';
COMMENT ON COLUMN whatsapp_media_downloads.file_size IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN whatsapp_media_downloads.mime_type IS 'Tipo MIME do arquivo';
COMMENT ON COLUMN whatsapp_media_downloads.download_url IS 'URL de download do arquivo';
COMMENT ON COLUMN whatsapp_media_downloads.thumbnail_url IS 'URL da miniatura (se aplicável)';
COMMENT ON COLUMN whatsapp_media_downloads.downloaded_at IS 'Data e hora do download';
