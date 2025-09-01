-- Extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários (estende a tabela auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  avatar_url TEXT,
  billing_address JSONB,
  payment_method JSONB
);

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

-- Tabela de contatos
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  metadata JSONB
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

-- Tabela de campanhas
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  message_template TEXT NOT NULL,
  status TEXT DEFAULT 'draft' NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  metadata JSONB
);

-- Tabela de destinatários de campanhas
CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de dispositivos conectados
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone_number TEXT,
  status TEXT DEFAULT 'disconnected' NOT NULL,
  last_connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  metadata JSONB
);

-- Triggers para atualizar os campos updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_prices_updated_at
BEFORE UPDATE ON public.prices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contact_groups_updated_at
BEFORE UPDATE ON public.contact_groups
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_campaign_recipients_updated_at
BEFORE UPDATE ON public.campaign_recipients
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_devices_updated_at
BEFORE UPDATE ON public.devices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Função para criar um registro de usuário quando um novo usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar um registro de usuário quando um novo usuário se registra
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS (Row Level Security) para proteger os dados
-- Habilitar RLS em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários
CREATE POLICY "Usuários podem ver seus próprios dados" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios dados" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para produtos e preços (visíveis para todos os usuários autenticados)
CREATE POLICY "Produtos visíveis para todos os usuários autenticados" ON public.products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Preços visíveis para todos os usuários autenticados" ON public.prices
  FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para assinaturas
CREATE POLICY "Usuários podem ver suas próprias assinaturas" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Políticas para contatos
CREATE POLICY "Usuários podem ver seus próprios contatos" ON public.contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios contatos" ON public.contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios contatos" ON public.contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios contatos" ON public.contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para grupos de contatos
CREATE POLICY "Usuários podem ver seus próprios grupos" ON public.contact_groups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios grupos" ON public.contact_groups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios grupos" ON public.contact_groups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios grupos" ON public.contact_groups
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para membros de grupos
CREATE POLICY "Usuários podem ver membros de seus próprios grupos" ON public.contact_group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contact_groups
      WHERE id = public.contact_group_members.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir membros em seus próprios grupos" ON public.contact_group_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contact_groups
      WHERE id = public.contact_group_members.group_id AND user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE id = public.contact_group_members.contact_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem excluir membros de seus próprios grupos" ON public.contact_group_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.contact_groups
      WHERE id = public.contact_group_members.group_id AND user_id = auth.uid()
    )
  );

-- Políticas para campanhas
CREATE POLICY "Usuários podem ver suas próprias campanhas" ON public.campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias campanhas" ON public.campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias campanhas" ON public.campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir suas próprias campanhas" ON public.campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para destinatários de campanhas
CREATE POLICY "Usuários podem ver destinatários de suas próprias campanhas" ON public.campaign_recipients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = public.campaign_recipients.campaign_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir destinatários em suas próprias campanhas" ON public.campaign_recipients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = public.campaign_recipients.campaign_id AND user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE id = public.campaign_recipients.contact_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar destinatários de suas próprias campanhas" ON public.campaign_recipients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = public.campaign_recipients.campaign_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem excluir destinatários de suas próprias campanhas" ON public.campaign_recipients
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = public.campaign_recipients.campaign_id AND user_id = auth.uid()
    )
  );

-- Políticas para dispositivos
CREATE POLICY "Usuários podem ver seus próprios dispositivos" ON public.devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios dispositivos" ON public.devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios dispositivos" ON public.devices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios dispositivos" ON public.devices
  FOR DELETE USING (auth.uid() = user_id);