-- Adicionar coluna template_type se ela não existir
DO $$ 
BEGIN
    -- Verificar se a coluna template_type não existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'message_templates' 
        AND column_name = 'template_type'
    ) THEN
        -- Adicionar a coluna template_type
        ALTER TABLE public.message_templates 
        ADD COLUMN template_type TEXT DEFAULT 'quick_message' 
        CHECK (template_type IN ('quick_message', 'campaign', 'automation', 'notification'));
        
        -- Atualizar registros existentes para ter o tipo padrão
        UPDATE public.message_templates 
        SET template_type = 'quick_message' 
        WHERE template_type IS NULL;
        
        -- Criar índice para a nova coluna
        CREATE INDEX IF NOT EXISTS idx_message_templates_type ON public.message_templates(template_type);
        
        -- Atualizar a constraint UNIQUE para incluir template_type
        ALTER TABLE public.message_templates 
        DROP CONSTRAINT IF EXISTS message_templates_organization_id_shortcut_language_key;
        
        ALTER TABLE public.message_templates 
        ADD CONSTRAINT message_templates_organization_id_shortcut_language_template_type_key 
        UNIQUE(organization_id, shortcut, language, template_type);
    END IF;
END $$;
