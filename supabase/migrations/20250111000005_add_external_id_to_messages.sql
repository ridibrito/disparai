-- Adicionar campo external_id à tabela messages se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' 
    AND table_name='messages' 
    AND column_name='external_id'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN external_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_messages_external_id ON public.messages(external_id);
  END IF;
END $$;
