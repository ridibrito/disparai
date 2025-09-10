-- Adicionar colunas para rastrear a última mensagem da conversa
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS last_message_content TEXT,
ADD COLUMN IF NOT EXISTS last_message_created_at TIMESTAMPTZ;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_created_at 
ON public.conversations(last_message_created_at DESC);

-- Adicionar colunas para status da conversa
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_conversations_unread_count 
ON public.conversations(unread_count);

CREATE INDEX IF NOT EXISTS idx_conversations_is_archived 
ON public.conversations(is_archived);

CREATE INDEX IF NOT EXISTS idx_conversations_is_favorite 
ON public.conversations(is_favorite);

-- Adicionar colunas para status das mensagens
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent',
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'text';

-- Criar índices para os novos campos de mensagens
CREATE INDEX IF NOT EXISTS idx_messages_status 
ON public.messages(status);

CREATE INDEX IF NOT EXISTS idx_messages_type 
ON public.messages(type);
