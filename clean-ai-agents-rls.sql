-- =====================================================
-- LIMPEZA E RECRIAÇÃO DAS POLÍTICAS RLS PARA AGENTES DE IA
-- =====================================================

-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Enable read access for organization members" ON ai_agents;
DROP POLICY IF EXISTS "Enable insert for organization members" ON ai_agents;
DROP POLICY IF EXISTS "Enable update for organization members" ON ai_agents;
DROP POLICY IF EXISTS "Enable delete for organization members" ON ai_agents;
DROP POLICY IF EXISTS "Users can view ai_agents from their organization" ON ai_agents;
DROP POLICY IF EXISTS "Users can insert ai_agents in their organization" ON ai_agents;
DROP POLICY IF EXISTS "Users can update ai_agents in their organization" ON ai_agents;
DROP POLICY IF EXISTS "Users can delete ai_agents in their organization" ON ai_agents;

-- 2. CRIAR POLÍTICAS SIMPLES E EFICAZES
CREATE POLICY "ai_agents_select_policy" ON ai_agents
    FOR SELECT USING (
        organization_id = (
            SELECT organization_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "ai_agents_insert_policy" ON ai_agents
    FOR INSERT WITH CHECK (
        organization_id = (
            SELECT organization_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "ai_agents_update_policy" ON ai_agents
    FOR UPDATE USING (
        organization_id = (
            SELECT organization_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "ai_agents_delete_policy" ON ai_agents
    FOR DELETE USING (
        organization_id = (
            SELECT organization_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- 3. LIMPAR E RECRIAR POLÍTICAS PARA agent_instance_configs
DROP POLICY IF EXISTS "Enable read access for organization members" ON agent_instance_configs;
DROP POLICY IF EXISTS "Enable insert for organization members" ON agent_instance_configs;
DROP POLICY IF EXISTS "Enable update for organization members" ON agent_instance_configs;
DROP POLICY IF EXISTS "Enable delete for organization members" ON agent_instance_configs;

CREATE POLICY "agent_instance_configs_select_policy" ON agent_instance_configs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ai_agents 
            WHERE ai_agents.id = agent_instance_configs.agent_id 
            AND ai_agents.organization_id = (
                SELECT organization_id 
                FROM users 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "agent_instance_configs_insert_policy" ON agent_instance_configs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ai_agents 
            WHERE ai_agents.id = agent_instance_configs.agent_id 
            AND ai_agents.organization_id = (
                SELECT organization_id 
                FROM users 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "agent_instance_configs_update_policy" ON agent_instance_configs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM ai_agents 
            WHERE ai_agents.id = agent_instance_configs.agent_id 
            AND ai_agents.organization_id = (
                SELECT organization_id 
                FROM users 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "agent_instance_configs_delete_policy" ON agent_instance_configs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM ai_agents 
            WHERE ai_agents.id = agent_instance_configs.agent_id 
            AND ai_agents.organization_id = (
                SELECT organization_id 
                FROM users 
                WHERE id = auth.uid()
            )
        )
    );

-- 4. LIMPAR E RECRIAR POLÍTICAS PARA agent_responses
DROP POLICY IF EXISTS "Enable read access for organization members" ON agent_responses;
DROP POLICY IF EXISTS "Enable insert for organization members" ON agent_responses;
DROP POLICY IF EXISTS "Enable update for organization members" ON agent_responses;
DROP POLICY IF EXISTS "Enable delete for organization members" ON agent_responses;

CREATE POLICY "agent_responses_select_policy" ON agent_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ai_agents 
            WHERE ai_agents.id = agent_responses.agent_id 
            AND ai_agents.organization_id = (
                SELECT organization_id 
                FROM users 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "agent_responses_insert_policy" ON agent_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ai_agents 
            WHERE ai_agents.id = agent_responses.agent_id 
            AND ai_agents.organization_id = (
                SELECT organization_id 
                FROM users 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "agent_responses_update_policy" ON agent_responses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM ai_agents 
            WHERE ai_agents.id = agent_responses.agent_id 
            AND ai_agents.organization_id = (
                SELECT organization_id 
                FROM users 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "agent_responses_delete_policy" ON agent_responses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM ai_agents 
            WHERE ai_agents.id = agent_responses.agent_id 
            AND ai_agents.organization_id = (
                SELECT organization_id 
                FROM users 
                WHERE id = auth.uid()
            )
        )
    );

-- 5. GARANTIR QUE RLS ESTÁ HABILITADO
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_instance_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_responses ENABLE ROW LEVEL SECURITY;

-- 6. VERIFICAR POLÍTICAS CRIADAS
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename IN ('ai_agents', 'agent_instance_configs', 'agent_responses')
ORDER BY tablename, policyname;

-- 7. TESTE DE DEBUG - VERIFICAR ORGANIZATION_ID DO USUÁRIO
SELECT 
    'Current User Info' as info,
    auth.uid() as user_id,
    u.organization_id,
    u.email
FROM users u 
WHERE u.id = auth.uid();
