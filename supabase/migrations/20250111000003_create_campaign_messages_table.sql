-- Criar tabela campaign_messages se não existir
CREATE TABLE IF NOT EXISTS public.campaign_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    message_content TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_campaign_messages_campaign_id ON public.campaign_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_contact_id ON public.campaign_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_status ON public.campaign_messages(status);

-- Habilitar RLS
ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;

-- Política RLS: usuários só podem ver suas próprias mensagens de campanha
CREATE POLICY "Users can view their own campaign messages" ON public.campaign_messages
    FOR SELECT USING (
        campaign_id IN (
            SELECT id FROM public.campaigns WHERE user_id = auth.uid()
        )
    );

-- Política RLS: usuários só podem inserir mensagens em suas próprias campanhas
CREATE POLICY "Users can insert messages to their own campaigns" ON public.campaign_messages
    FOR INSERT WITH CHECK (
        campaign_id IN (
            SELECT id FROM public.campaigns WHERE user_id = auth.uid()
        )
    );

-- Política RLS: usuários só podem atualizar mensagens de suas próprias campanhas
CREATE POLICY "Users can update their own campaign messages" ON public.campaign_messages
    FOR UPDATE USING (
        campaign_id IN (
            SELECT id FROM public.campaigns WHERE user_id = auth.uid()
        )
    );

-- Política RLS: usuários só podem deletar mensagens de suas próprias campanhas
CREATE POLICY "Users can delete their own campaign messages" ON public.campaign_messages
    FOR DELETE USING (
        campaign_id IN (
            SELECT id FROM public.campaigns WHERE user_id = auth.uid()
        )
    );
