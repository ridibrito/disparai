-- ========================================
-- MIGRAÇÃO: Sistema de Agentes de IA
-- ========================================
-- Execute este SQL no Supabase Dashboard → SQL Editor

-- 1. Criar tabela de agentes de IA
CREATE TABLE IF NOT EXISTS ai_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    max_tokens INTEGER DEFAULT 1000,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de configurações de agentes por instância
CREATE TABLE IF NOT EXISTS agent_instance_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    whatsapp_instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    escalation_rules JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(whatsapp_instance_id, agent_id)
);

-- 3. Criar tabela de histórico de respostas automáticas
CREATE TABLE IF NOT EXISTS agent_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    agent_response TEXT NOT NULL,
    response_time_ms INTEGER,
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_agents_organization_id ON ai_agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_type ON ai_agents(type);
CREATE INDEX IF NOT EXISTS idx_agent_instance_configs_organization_id ON agent_instance_configs(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_instance_configs_instance_id ON agent_instance_configs(whatsapp_instance_id);
CREATE INDEX IF NOT EXISTS idx_agent_responses_conversation_id ON agent_responses(conversation_id);
CREATE INDEX IF NOT EXISTS idx_agent_responses_created_at ON agent_responses(created_at);

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_instance_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_responses ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para ai_agents
CREATE POLICY "Users can view ai_agents from their organization" ON ai_agents
    FOR SELECT USING (organization_id IN (
        SELECT id FROM organizations WHERE id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can insert ai_agents in their organization" ON ai_agents
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT id FROM organizations WHERE id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can update ai_agents in their organization" ON ai_agents
    FOR UPDATE USING (organization_id IN (
        SELECT id FROM organizations WHERE id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can delete ai_agents in their organization" ON ai_agents
    FOR DELETE USING (organization_id IN (
        SELECT id FROM organizations WHERE id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    ));

-- 7. Políticas RLS para agent_instance_configs
CREATE POLICY "Users can view agent_instance_configs from their organization" ON agent_instance_configs
    FOR SELECT USING (organization_id IN (
        SELECT id FROM organizations WHERE id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can insert agent_instance_configs in their organization" ON agent_instance_configs
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT id FROM organizations WHERE id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can update agent_instance_configs in their organization" ON agent_instance_configs
    FOR UPDATE USING (organization_id IN (
        SELECT id FROM organizations WHERE id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can delete agent_instance_configs in their organization" ON agent_instance_configs
    FOR DELETE USING (organization_id IN (
        SELECT id FROM organizations WHERE id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    ));

-- 8. Políticas RLS para agent_responses
CREATE POLICY "Users can view agent_responses from their organization" ON agent_responses
    FOR SELECT USING (organization_id IN (
        SELECT id FROM organizations WHERE id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can insert agent_responses in their organization" ON agent_responses
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT id FROM organizations WHERE id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    ));

-- 9. Inserir agentes padrão
INSERT INTO ai_agents (organization_id, name, type, description, system_prompt) VALUES
(
    (SELECT id FROM organizations LIMIT 1),
    'Agente SDR',
    'sdr',
    'Agente especializado em qualificação de leads e primeiros contatos',
    'Você é um Agente SDR (Sales Development Representative) especializado em qualificar leads e fazer primeiros contatos. Seu objetivo é:

1. Identificar se o lead tem interesse real no produto/serviço
2. Coletar informações básicas sobre necessidades e orçamento
3. Agendar reuniões com o time de vendas quando apropriado
4. Manter um tom profissional mas amigável
5. Fazer perguntas abertas para entender melhor o lead

Sempre seja educado, objetivo e focado em ajudar o lead a entender como podemos resolver seus problemas.'
),
(
    (SELECT id FROM organizations LIMIT 1),
    'Agente de Atendimento',
    'atendimento',
    'Agente especializado em atendimento ao cliente e suporte',
    'Você é um Agente de Atendimento ao Cliente especializado em resolver dúvidas e fornecer suporte. Seu objetivo é:

1. Responder perguntas sobre produtos/serviços de forma clara
2. Resolver problemas e dúvidas dos clientes
3. Manter um tom cordial e prestativo
4. Escalar para um humano quando necessário
5. Coletar feedback e sugestões

Sempre seja paciente, prestativo e focado em resolver o problema do cliente da melhor forma possível.'
),
(
    (SELECT id FROM organizations LIMIT 1),
    'Agente de Vendas',
    'vendas',
    'Agente especializado em vendas e fechamento de negócios',
    'Você é um Agente de Vendas especializado em identificar oportunidades e fechar negócios. Seu objetivo é:

1. Identificar necessidades específicas do cliente
2. Apresentar soluções adequadas
3. Superar objeções de forma educada
4. Criar urgência quando apropriado
5. Fechar negócios ou agendar reuniões de fechamento

Sempre seja consultivo, focado em valor e respeitoso com o tempo do cliente.'
);

-- 10. Comentários nas tabelas
COMMENT ON TABLE ai_agents IS 'Tabela de agentes de IA configuráveis por organização';
COMMENT ON TABLE agent_instance_configs IS 'Configuração de quais agentes estão ativos em cada instância WhatsApp';
COMMENT ON TABLE agent_responses IS 'Histórico de respostas automáticas dos agentes de IA';

-- ========================================
-- MIGRAÇÃO CONCLUÍDA!
-- ========================================
-- Agora você pode acessar:
-- - /configuracoes/agentes (gerenciar agentes)
-- - /configuracoes/conexao-api (configurar agentes por instância)
-- ========================================
