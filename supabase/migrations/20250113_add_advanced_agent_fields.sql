-- Adicionar campos avançados à tabela ai_agents
ALTER TABLE ai_agents 
ADD COLUMN IF NOT EXISTS agent_name TEXT,
ADD COLUMN IF NOT EXISTS initial_message TEXT,
ADD COLUMN IF NOT EXISTS tone TEXT DEFAULT 'amigavel',
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt-BR',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo',
ADD COLUMN IF NOT EXISTS response_delay_ms INTEGER DEFAULT 2000,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_sector TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS company_description TEXT,
ADD COLUMN IF NOT EXISTS default_behavior TEXT;

-- Atualizar registros existentes com valores padrão
UPDATE ai_agents 
SET 
  agent_name = COALESCE(agent_name, name),
  tone = COALESCE(tone, 'amigavel'),
  language = COALESCE(language, 'pt-BR'),
  timezone = COALESCE(timezone, 'America/Sao_Paulo'),
  response_delay_ms = COALESCE(response_delay_ms, 2000),
  company_name = COALESCE(company_name, 'Sua Empresa'),
  company_sector = COALESCE(company_sector, 'Tecnologia'),
  company_description = COALESCE(company_description, 'Empresa focada em inovação e tecnologia'),
  default_behavior = COALESCE(default_behavior, 'Seja educado, profissional e prestativo. Responda de forma direta e eficiente.')
WHERE agent_name IS NULL;

-- Adicionar constraints
ALTER TABLE ai_agents 
ALTER COLUMN agent_name SET NOT NULL,
ALTER COLUMN tone SET NOT NULL,
ALTER COLUMN language SET NOT NULL,
ALTER COLUMN timezone SET NOT NULL,
ALTER COLUMN response_delay_ms SET NOT NULL,
ALTER COLUMN company_name SET NOT NULL,
ALTER COLUMN company_sector SET NOT NULL,
ALTER COLUMN company_description SET NOT NULL,
ALTER COLUMN default_behavior SET NOT NULL;

-- Adicionar check constraints para valores válidos
ALTER TABLE ai_agents 
ADD CONSTRAINT check_tone 
CHECK (tone IN ('formal', 'casual', 'amigavel', 'profissional', 'empolgado', 'calmo'));

ALTER TABLE ai_agents 
ADD CONSTRAINT check_language 
CHECK (language IN ('pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE'));

ALTER TABLE ai_agents 
ADD CONSTRAINT check_response_delay 
CHECK (response_delay_ms >= 0 AND response_delay_ms <= 10000);

-- Comentários para documentação
COMMENT ON COLUMN ai_agents.agent_name IS 'Nome que o agente usa para se apresentar aos clientes';
COMMENT ON COLUMN ai_agents.initial_message IS 'Mensagem inicial enviada quando uma conversa é iniciada';
COMMENT ON COLUMN ai_agents.tone IS 'Tom de voz do agente (formal, casual, amigavel, profissional, empolgado, calmo)';
COMMENT ON COLUMN ai_agents.language IS 'Idioma do agente (pt-BR, en-US, es-ES, fr-FR, de-DE)';
COMMENT ON COLUMN ai_agents.timezone IS 'Timezone do agente para horários locais';
COMMENT ON COLUMN ai_agents.response_delay_ms IS 'Delay de resposta em milissegundos (simula tempo humano)';
COMMENT ON COLUMN ai_agents.company_name IS 'Nome da empresa que o agente representa';
COMMENT ON COLUMN ai_agents.company_sector IS 'Setor/área de atuação da empresa';
COMMENT ON COLUMN ai_agents.company_website IS 'Website da empresa (para buscar informações)';
COMMENT ON COLUMN ai_agents.company_description IS 'Descrição da empresa para ajudar no atendimento';
COMMENT ON COLUMN ai_agents.default_behavior IS 'Comportamento padrão e regras do agente';
