-- Adiciona a coluna qualification_status à tabela contacts
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS qualification_status TEXT DEFAULT 'pending';

-- Adiciona um índice para melhorar a performance em consultas por status de qualificação
CREATE INDEX IF NOT EXISTS idx_contacts_qualification_status ON public.contacts(qualification_status);

-- Opcional: Atualiza o status de qualificação para contatos existentes (se necessário)
-- UPDATE public.contacts SET qualification_status = 'pending' WHERE qualification_status IS NULL;
