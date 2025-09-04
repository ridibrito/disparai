-- Verificar estrutura atual da tabela contacts
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'contacts'
ORDER BY ordinal_position;

-- Verificar se as colunas necessárias existem
SELECT 
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'tenant_id') as tenant_id_exists,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'wa_phone_e164') as wa_phone_e164_exists;
