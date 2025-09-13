-- ========================================
-- MIGRAÇÃO SIMPLES: Apenas as tabelas essenciais
-- ========================================

-- 1. Criar tabela ai_agents
CREATE TABLE ai_agents (
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

-- 2. Criar tabela agent_instance_configs
CREATE TABLE agent_instance_configs (
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

-- 3. Criar tabela agent_responses
CREATE TABLE agent_responses (
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

-- 4. Habilitar RLS
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_instance_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_responses ENABLE ROW LEVEL SECURITY;

-- 5. Políticas básicas (permitir tudo para usuários autenticados)
CREATE POLICY "Enable all for authenticated users" ON ai_agents FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON agent_instance_configs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON agent_responses FOR ALL USING (auth.role() = 'authenticated');

-- 6. Inserir agente padrão
INSERT INTO ai_agents (organization_id, name, type, description, system_prompt) VALUES
(
    (SELECT id FROM organizations LIMIT 1),
    'Agente SDR',
    'sdr',
    'Agente especializado em qualificação de leads e primeiros contatos',
    'Você é um Agente SDR especializado em qualificar leads e fazer primeiros contatos. Seu objetivo é identificar se o lead tem interesse real no produto/serviço, coletar informações básicas sobre necessidades e orçamento, e agendar reuniões com o time de vendas quando apropriado. Sempre seja educado, objetivo e focado em ajudar o lead a entender como podemos resolver seus problemas.'
);

-- ========================================
-- MIGRAÇÃO SIMPLES CONCLUÍDA!
-- ========================================
