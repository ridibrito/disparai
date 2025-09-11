-- Criar tabela para templates de mensagem personalizados
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'atendimento',
  shortcut TEXT NOT NULL,
  language TEXT DEFAULT 'pt_BR',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  template_type TEXT DEFAULT 'quick_message' CHECK (template_type IN ('quick_message', 'campaign', 'automation', 'notification')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(organization_id, shortcut, language, template_type)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_message_templates_organization_id ON public.message_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_category ON public.message_templates(category);
CREATE INDEX IF NOT EXISTS idx_message_templates_status ON public.message_templates(status);
CREATE INDEX IF NOT EXISTS idx_message_templates_shortcut ON public.message_templates(shortcut);
CREATE INDEX IF NOT EXISTS idx_message_templates_type ON public.message_templates(template_type);

-- Políticas RLS para message_templates
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuários podem ver templates da sua organização
CREATE POLICY "Users can view templates from their organization" ON public.message_templates
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Política para INSERT: usuários podem criar templates na sua organização
CREATE POLICY "Users can create templates in their organization" ON public.message_templates
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Política para UPDATE: usuários podem atualizar templates da sua organização
CREATE POLICY "Users can update templates from their organization" ON public.message_templates
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Política para DELETE: usuários podem excluir templates da sua organização
CREATE POLICY "Users can delete templates from their organization" ON public.message_templates
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Inserir alguns templates padrão para demonstração
INSERT INTO public.message_templates (organization_id, name, content, category, shortcut, language, status)
SELECT 
  o.id,
  'Boas-vindas',
  'Olá! Bem-vindo(a) ao nosso atendimento. Como posso ajudá-lo(a) hoje?',
  'atendimento',
  'boasvindas',
  'pt_BR',
  'active'
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.message_templates mt 
  WHERE mt.organization_id = o.id AND mt.shortcut = 'boasvindas'
);

INSERT INTO public.message_templates (organization_id, name, content, category, shortcut, language, status)
SELECT 
  o.id,
  'Agradecimento',
  'Obrigado pelo seu contato! Foi um prazer atendê-lo(a).',
  'atendimento',
  'obrigado',
  'pt_BR',
  'active'
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.message_templates mt 
  WHERE mt.organization_id = o.id AND mt.shortcut = 'obrigado'
);
