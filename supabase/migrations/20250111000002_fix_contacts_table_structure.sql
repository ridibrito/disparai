-- Corrigir estrutura da tabela contacts
-- Padronizar campos para funcionar com a API

-- Adicionar campos que podem estar faltando
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS "group" TEXT;

ALTER TABLE public.contacts odando na porta 3000
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Adicionar campo organization_id se não existir
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_group ON public.contacts("group");
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON public.contacts(organization_id);

-- Comentários para documentação
COMMENT ON COLUMN public.contacts.email IS 'Email do contato';
COMMENT ON COLUMN public.contacts."group" IS 'Grupo do contato';
COMMENT ON COLUMN public.contacts.notes IS 'Notas sobre o contato';
COMMENT ON COLUMN public.contacts.organization_id IS 'ID da organização do contato';
