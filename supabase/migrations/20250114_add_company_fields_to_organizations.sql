-- Adicionar campos de empresa à tabela organizations

-- Adicionar campos de empresa
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_description TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS company_sector TEXT,
ADD COLUMN IF NOT EXISTS company_logo_url TEXT,
ADD COLUMN IF NOT EXISTS company_phone TEXT,
ADD COLUMN IF NOT EXISTS company_email TEXT,
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS company_city TEXT,
ADD COLUMN IF NOT EXISTS company_state TEXT,
ADD COLUMN IF NOT EXISTS company_zip_code TEXT,
ADD COLUMN IF NOT EXISTS company_country TEXT DEFAULT 'Brasil';

-- Atualizar organizações existentes com dados padrão
UPDATE public.organizations 
SET 
  company_name = COALESCE(company_name, name),
  company_description = COALESCE(company_description, ''),
  company_website = COALESCE(company_website, ''),
  company_sector = COALESCE(company_sector, ''),
  company_phone = COALESCE(company_phone, ''),
  company_email = COALESCE(company_email, ''),
  company_address = COALESCE(company_address, ''),
  company_city = COALESCE(company_city, ''),
  company_state = COALESCE(company_state, ''),
  company_zip_code = COALESCE(company_zip_code, ''),
  company_country = COALESCE(company_country, 'Brasil')
WHERE company_name IS NULL;

-- Adicionar políticas RLS para os novos campos
-- As políticas existentes já cobrem a tabela organizations, então não precisamos adicionar novas
