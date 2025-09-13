-- Script para aplicar campos avançados aos agentes de IA
-- Execute este script no SQL Editor do Supabase Dashboard

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
