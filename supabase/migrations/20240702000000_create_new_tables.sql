-- Habilitar a extensão uuid-ossp se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela para gerenciar os planos de assinatura
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    contact_limit INTEGER NOT NULL,
    message_limit INTEGER NOT NULL,
    features JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para atualizar o campo updated_at automaticamente
CREATE TRIGGER set_updated_at_plans
BEFORE UPDATE ON plans
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Tabela de usuários, vinculada aos planos de assinatura
ALTER TABLE users
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id);

-- Tabela para armazenar as credenciais das APIs do WhatsApp
CREATE TABLE api_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'evolution' ou 'cloud_api'
    api_key TEXT NOT NULL,
    api_secret TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para atualizar o campo updated_at automaticamente
CREATE TRIGGER set_updated_at_api_connections
BEFORE UPDATE ON api_connections
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Tabela para armazenar as listas de contatos
CREATE TABLE contact_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para atualizar o campo updated_at automaticamente
CREATE TRIGGER set_updated_at_contact_lists
BEFORE UPDATE ON contact_lists
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Tabela de contatos individuais
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    list_id UUID REFERENCES contact_lists(id) ON DELETE CASCADE,
    phone VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    custom_fields JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para atualizar o campo updated_at automaticamente
CREATE TRIGGER set_updated_at_contacts
BEFORE UPDATE ON contacts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Tabela para gerenciar as campanhas de disparo
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    list_id UUID REFERENCES contact_lists(id),
    name VARCHAR(255) NOT NULL,
    message_content TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL, -- 'pending', 'sent', 'error'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para atualizar o campo updated_at automaticamente
CREATE TRIGGER set_updated_at_campaigns
BEFORE UPDATE ON campaigns
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Tabela para rastrear as conversas com os clientes
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ DEFAULT now(),
    status VARCHAR(50) NOT NULL, -- 'ai', 'human', 'resolved'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para atualizar o campo updated_at automaticamente
CREATE TRIGGER set_updated_at_conversations
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Tabela para armazenar as mensagens de cada conversa
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL, -- 'user', 'contact', 'ai'
    content TEXT NOT NULL,
    media_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Configurar políticas de segurança (RLS) para as novas tabelas
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas para plans (apenas administradores podem gerenciar)
CREATE POLICY "Admins can manage plans" ON plans
    USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

-- Políticas para api_connections (usuários só podem ver/gerenciar suas próprias conexões)
CREATE POLICY "Users can view their own API connections" ON api_connections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API connections" ON api_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API connections" ON api_connections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API connections" ON api_connections
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para contact_lists
CREATE POLICY "Users can view their own contact lists" ON contact_lists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contact lists" ON contact_lists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact lists" ON contact_lists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact lists" ON contact_lists
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para contacts
CREATE POLICY "Users can view their own contacts" ON contacts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts" ON contacts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" ON contacts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" ON contacts
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para campaigns
CREATE POLICY "Users can view their own campaigns" ON campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns" ON campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para conversations
CREATE POLICY "Users can view their own conversations" ON conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para messages
CREATE POLICY "Users can view messages from their conversations" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages to their conversations" ON messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    );

-- Inserir planos padrão
INSERT INTO plans (name, price, contact_limit, message_limit, features)
VALUES 
    ('Básico', 49.90, 500, 1000, '{"dispositivos": 1, "campanhas_simultaneas": 2, "suporte": "email"}'),
    ('Profissional', 99.90, 2000, 5000, '{"dispositivos": 3, "campanhas_simultaneas": 5, "suporte": "email,chat", "automacao": true}'),
    ('Empresarial', 199.90, 10000, 20000, '{"dispositivos": 10, "campanhas_simultaneas": 20, "suporte": "email,chat,telefone", "automacao": true, "api_acesso": true}');