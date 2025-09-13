-- ========================================
-- TESTE: Verificar se as tabelas foram criadas
-- ========================================
-- Execute este SQL após a migração para verificar

-- 1. Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ai_agents', 'agent_instance_configs', 'agent_responses');

-- 2. Verificar estrutura da tabela ai_agents
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ai_agents' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar se os agentes padrão foram inseridos
SELECT id, name, type, is_active, created_at
FROM ai_agents
ORDER BY created_at;

-- 4. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('ai_agents', 'agent_instance_configs', 'agent_responses');

-- ========================================
-- Se tudo estiver correto, você verá:
-- - 3 tabelas listadas
-- - Estrutura completa da tabela ai_agents
-- - 3 agentes padrão inseridos
-- - Políticas RLS configuradas
-- ========================================
