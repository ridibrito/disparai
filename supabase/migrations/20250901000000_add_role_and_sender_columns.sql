-- Adiciona colunas para papéis de usuário e rastreio de remetentes/agentes humanos

-- 1) users.role
ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'admin';

-- 2) conversations.human_agent_id
ALTER TABLE IF EXISTS public.conversations
  ADD COLUMN IF NOT EXISTS human_agent_id UUID REFERENCES public.users(id);

CREATE INDEX IF NOT EXISTS idx_conversations_human_agent_id
  ON public.conversations(human_agent_id);

-- 3) messages.sender_id
ALTER TABLE IF EXISTS public.messages
  ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.users(id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id
  ON public.messages(sender_id);


