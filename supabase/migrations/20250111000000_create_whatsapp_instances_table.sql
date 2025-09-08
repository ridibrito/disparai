-- Criar tabela whatsapp_instances que está faltando
-- Esta tabela é referenciada em outras migrações mas não foi criada

CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  instance_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inativo' CHECK (status IN ('ativo', 'inativo', 'conectado', 'desconectado', 'erro')),
  phone_number TEXT,
  qr_code TEXT,
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_organization_id ON public.whatsapp_instances(organization_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_instance_key ON public.whatsapp_instances(instance_key);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON public.whatsapp_instances(status);

-- Habilitar RLS
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para whatsapp_instances
CREATE POLICY "Org members can select whatsapp instances" ON public.whatsapp_instances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = whatsapp_instances.organization_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can modify whatsapp instances" ON public.whatsapp_instances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = whatsapp_instances.organization_id AND m.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = whatsapp_instances.organization_id AND m.user_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_whatsapp_instances_updated_at
BEFORE UPDATE ON public.whatsapp_instances
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Comentários para documentação
COMMENT ON TABLE public.whatsapp_instances IS 'Instâncias WhatsApp conectadas ao sistema';
COMMENT ON COLUMN public.whatsapp_instances.instance_key IS 'Chave única da instância no servidor Disparai';
COMMENT ON COLUMN public.whatsapp_instances.status IS 'Status da instância: ativo (existe e funciona), conectado (ativo e conectado ao WhatsApp)';
COMMENT ON COLUMN public.whatsapp_instances.phone_number IS 'Número de telefone da instância WhatsApp';
COMMENT ON COLUMN public.whatsapp_instances.qr_code IS 'Código QR para conectar a instância';
COMMENT ON COLUMN public.whatsapp_instances.webhook_url IS 'URL do webhook para receber eventos da instância';
