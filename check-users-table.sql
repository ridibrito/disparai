-- Verificar estrutura atual da tabela users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Verificar se a coluna auth_user_id existe
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name = 'auth_user_id'
) as auth_user_id_exists;
