-- Adicionar colunas de atendimento à tabela conversations
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS attendance_type VARCHAR(50) DEFAULT 'ai' CHECK (attendance_type IN ('ai', 'transferred', 'human')),
ADD COLUMN IF NOT EXISTS attendance_status VARCHAR(50) DEFAULT 'pending' CHECK (attendance_status IN ('pending', 'active', 'resolved')),
ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Adicionar coluna organization_id se não existir
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_conversations_attendance_type ON conversations(attendance_type);
CREATE INDEX IF NOT EXISTS idx_conversations_attendance_status ON conversations(attendance_status);
CREATE INDEX IF NOT EXISTS idx_conversations_organization_id ON conversations(organization_id);
