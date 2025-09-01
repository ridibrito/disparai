-- Este script combina as migrações existentes para facilitar a criação das tabelas no Supabase Studio

-- Habilitar a extensão uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  avatar_url TEXT,
  billing_address JSONB,
  payment_method JSONB,
  is_admin BOOLEAN DEFAULT false
);

-- Tabela para gerenciar os planos de assinatura
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    contact_limit INTEGER NOT NULL,
    message_limit INTEGER NOT NULL,
    features JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar coluna plan_id à tabela users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  metadata JSONB,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de preços
CREATE TABLE IF NOT EXISTS public.prices (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL,
  description TEXT,
  unit_amount BIGINT,
  currency TEXT DEFAULT 'brl' NOT NULL,
  type TEXT DEFAULT 'recurring' NOT NULL,
  interval TEXT,
  interval_count INTEGER,
  trial_period_days INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de assinaturas
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  price_id TEXT REFERENCES public.prices(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  cancel_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- Tabela para armazenar as credenciais das APIs do WhatsApp
CREATE TABLE IF NOT EXISTS public.api_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'evolution' ou 'cloud_api'
    api_key TEXT NOT NULL,
    api_secret TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para armazenar as listas de contatos
CREATE TABLE IF NOT EXISTS public.contact_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de contatos individuais
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    list_id UUID REFERENCES contact_lists(id) ON DELETE CASCADE,
    phone VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    custom_fields JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de grupos de contatos
CREATE TABLE IF NOT EXISTS public.contact_groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de relação entre contatos e grupos
CREATE TABLE IF NOT EXISTS public.contact_group_members (
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES public.contact_groups(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  PRIMARY KEY (contact_id, group_id)
);

-- Tabela para gerenciar as campanhas de disparo
CREATE TABLE IF NOT EXISTS public.campaigns (
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

-- Tabela de destinatários de campanhas
CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'sent', 'delivered', 'read', 'failed'
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela para rastrear as conversas com os clientes
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ DEFAULT now(),
    status VARCHAR(50) NOT NULL, -- 'ai', 'human', 'resolved'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para armazenar as mensagens de cada conversa
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL, -- 'user', 'contact', 'ai'
    content TEXT NOT NULL,
    media_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de dispositivos
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  device_id TEXT NOT NULL,
  status TEXT DEFAULT 'offline' NOT NULL, -- 'online', 'offline', 'connecting'
  last_connected TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Triggers para atualizar o campo updated_at automaticamente
CREATE TRIGGER set_updated_at_users
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_products
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_prices
BEFORE UPDATE ON public.prices
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_plans
BEFORE UPDATE ON public.plans
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_api_connections
BEFORE UPDATE ON public.api_connections
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_contact_lists
BEFORE UPDATE ON public.contact_lists
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_contacts
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_contact_groups
BEFORE UPDATE ON public.contact_groups
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_campaigns
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_campaign_recipients
BEFORE UPDATE ON public.campaign_recipients
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_conversations
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_devices
BEFORE UPDATE ON public.devices
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Função para criar um registro de usuário público quando um novo usuário é criado no auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar um registro de usuário público quando um novo usuário é criado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Configurar políticas de segurança (RLS) para todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can view their own user data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own user data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para products (apenas visualização)
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (active = true);

-- Políticas para prices (apenas visualização)
CREATE POLICY "Anyone can view active prices" ON public.prices
  FOR SELECT USING (active = true);

-- Políticas para subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Políticas para plans (apenas administradores podem gerenciar)
CREATE POLICY "Admins can manage plans" ON public.plans
  USING (auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true));

CREATE POLICY "Anyone can view plans" ON public.plans
  FOR SELECT USING (true);

-- Políticas para api_connections
CREATE POLICY "Users can view their own API connections" ON public.api_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API connections" ON public.api_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API connections" ON public.api_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API connections" ON public.api_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para contact_lists
CREATE POLICY "Users can view their own contact lists" ON public.contact_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contact lists" ON public.contact_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact lists" ON public.contact_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact lists" ON public.contact_lists
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para contacts
CREATE POLICY "Users can view their own contacts" ON public.contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts" ON public.contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" ON public.contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" ON public.contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para contact_groups
CREATE POLICY "Users can view their own contact groups" ON public.contact_groups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contact groups" ON public.contact_groups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact groups" ON public.contact_groups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact groups" ON public.contact_groups
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para contact_group_members
CREATE POLICY "Users can view their own contact group members" ON public.contact_group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contact_groups
      WHERE id = group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own contact group members" ON public.contact_group_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contact_groups
      WHERE id = group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own contact group members" ON public.contact_group_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.contact_groups
      WHERE id = group_id AND user_id = auth.uid()
    )
  );

-- Políticas para campaigns
CREATE POLICY "Users can view their own campaigns" ON public.campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON public.campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON public.campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para campaign_recipients
CREATE POLICY "Users can view their own campaign recipients" ON public.campaign_recipients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own campaign recipients" ON public.campaign_recipients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own campaign recipients" ON public.campaign_recipients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own campaign recipients" ON public.campaign_recipients
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND user_id = auth.uid()
    )
  );

-- Políticas para conversations
CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON public.conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para messages
CREATE POLICY "Users can view messages from their conversations" ON public.messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

-- Políticas para devices
CREATE POLICY "Users can view their own devices" ON public.devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices" ON public.devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices" ON public.devices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices" ON public.devices
  FOR DELETE USING (auth.uid() = user_id);

-- Inserir planos padrão
INSERT INTO public.plans (name, price, contact_limit, message_limit, features)
VALUES 
    ('Básico', 49.90, 500, 1000, '{"dispositivos": 1, "campanhas_simultaneas": 2, "suporte": "email"}'),
    ('Profissional', 99.90, 2000, 5000, '{"dispositivos": 3, "campanhas_simultaneas": 5, "suporte": "email,chat", "automacao": true}'),
    ('Empresarial', 199.90, 10000, 20000, '{"dispositivos": 10, "campanhas_simultaneas": 20, "suporte": "email,chat,telefone", "automacao": true, "api_acesso": true}');