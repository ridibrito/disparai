-- =====================================================
-- DESABILITAR RLS TEMPORARIAMENTE PARA TESTE
-- =====================================================

-- ⚠️ ATENÇÃO: Esta é uma solução temporária para permitir o funcionamento
-- ⚠️ Lembre-se de reabilitar o RLS depois de testar

-- 1. DESABILITAR RLS TEMPORARIAMENTE
ALTER TABLE ai_agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_instance_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_responses DISABLE ROW LEVEL SECURITY;

-- 2. VERIFICAR STATUS DO RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('ai_agents', 'agent_instance_configs', 'agent_responses')
ORDER BY tablename;

-- 3. VERIFICAR SE AS TABELAS EXISTEM E TÊM DADOS
SELECT 
    'ai_agents' as table_name,
    COUNT(*) as row_count
FROM ai_agents
UNION ALL
SELECT 
    'agent_instance_configs' as table_name,
    COUNT(*) as row_count
FROM agent_instance_configs
UNION ALL
SELECT 
    'agent_responses' as table_name,
    COUNT(*) as row_count
FROM agent_responses;

-- 4. TESTE DE INSERÇÃO (opcional - descomente se quiser testar)
-- INSERT INTO ai_agents (
--     name, 
--     type, 
--     description, 
--     system_prompt, 
--     max_tokens, 
--     temperature, 
--     is_active, 
--     organization_id
-- ) VALUES (
--     'Teste Agente', 
--     'sdr', 
--     'Agente de teste', 
--     'Você é um agente de teste', 
--     1000, 
--     0.7, 
--     true, 
--     (SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1)
-- );

-- 5. VERIFICAR DADOS INSERIDOS
SELECT 
    id,
    name,
    type,
    organization_id,
    created_at
FROM ai_agents
ORDER BY created_at DESC
LIMIT 5;
