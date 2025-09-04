-- Verificar tabelas existentes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar se a extensão uuid-ossp existe
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';
