-- =====================================================
-- CORREÇÃO DAS POLÍTICAS RLS PARA AGENTES DE IA
-- =====================================================

-- 1. Remover políticas existentes (se existirem)
DROP POLICY IF EXISTS "Users can view their organization's ai_agents" ON ai_agents;
DROP POLICY IF EXISTS "Users can insert ai_agents for their organization" ON ai_agents;
DROP POLICY IF EXISTS "Users can update their organization's ai_agents" ON ai_agents;
DROP POLICY IF EXISTS "Users can delete their organization's ai_agents" ON ai_agents;

-- 2. Criar políticas RLS mais permissivas
CREATE POLICY "Enable read access for organization members" ON ai_agents
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for organization members" ON ai_agents
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Enable update for organization members" ON ai_agents
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Enable delete for organization members" ON ai_agents
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- 3. Políticas para agent_instance_configs
DROP POLICY IF EXISTS "Users can view their organization's agent_instance_configs" ON agent_instance_configs;
DROP POLICY IF EXISTS "Users can insert agent_instance_configs for their organization" ON agent_instance_configs;
DROP POLICY IF EXISTS "Users can update their organization's agent_instance_configs" ON agent_instance_configs;
DROP POLICY IF EXISTS "Users can delete their organization's agent_instance_configs" ON agent_instance_configs;

CREATE POLICY "Enable read access for organization members" ON agent_instance_configs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ai_agents 
            WHERE ai_agents.id = agent_instance_configs.agent_id 
            AND ai_agents.organization_id IN (
                SELECT organization_id 
                FROM users 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Enable insert for organization members" ON agent_instance_configs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ai_agents 
            WHERE ai_agents.id = agent_instance_configs.agent_id 
            AND ai_agents.organization_id IN (
                SELECT organization_id 
                FROM users 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Enable update for organization members" ON agent_instance_configs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM ai_agents 
            WHERE ai_agents.id = agent_instance_configs.agent_id 
            AND ai_agents.organization_id IN (
                SELECT organization_id 
                FROM users 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Enable delete for organization members" ON agent_instance_configs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM ai_agents 
            WHERE ai_agents.id = agent_instance_configs.agent_id 
            AND ai_agents.organization_id IN (
                SELECT organization_id 
                FROM users 
                WHERE id = auth.uid()
            )
        )
    );

-- 4. Políticas para agent_responses
DROP POLICY IF EXISTS "Users can view their organization's agent_responses" ON agent_responses;
DROP POLICY IF EXISTS "Users can insert agent_responses for their organization" ON agent_responses;
DROP POLICY IF EXISTS "Users can update their organization's agent_responses" ON agent_responses;
DROP POLICY IF EXISTS "Users can delete their organization's agent_responses" ON agent_responses;

CREATE POLICY "Enable read access for organization members" ON agent_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ai_agents 
            WHERE ai_agents.id = agent_responses.agent_id 
            AND ai_agents.organization_id IN (
                SELECT organization_id 
                FROM users 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Enable insert for organization members" ON agent_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ai_agents 
            WHERE ai_agents.id = agent_responses.agent_id 
            AND ai_agents.organization_id IN (
                SELECT organization_id 
                FROM users 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Enable update for organization members" ON agent_responses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM ai_agents 
            WHERE ai_agents.id = agent_responses.agent_id 
            AND ai_agents.organization_id IN (
                SELECT organization_id 
                FROM users 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Enable delete for organization members" ON agent_responses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM ai_agents 
            WHERE ai_agents.id = agent_responses.agent_id 
            AND ai_agents.organization_id IN (
                SELECT organization_id 
                FROM users 
                WHERE id = auth.uid()
            )
        )
    );

-- 5. Verificar se RLS está habilitado
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_instance_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_responses ENABLE ROW LEVEL SECURITY;

-- 6. Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('ai_agents', 'agent_instance_configs', 'agent_responses')
ORDER BY tablename, policyname;
