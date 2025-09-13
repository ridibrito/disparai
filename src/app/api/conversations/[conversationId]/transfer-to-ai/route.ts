import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { conversationId } = params;
    console.log('🔄 API transfer-to-ai chamada para conversa:', conversationId);

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Criar cliente Supabase
    const supabase = await createServerClient();

    // Buscar usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('👤 User auth result:', { user: user?.id, error: authError });
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar dados do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verificar se a conversa existe e pertence à organização
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Atualizar conversa para voltar para IA
    const { data: updatedConversation, error: updateError } = await supabase
      .from('conversations')
      .update({
        status: 'ai', // Voltar para IA
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar conversa:', updateError);
      return NextResponse.json({ error: 'Failed to transfer conversation to AI' }, { status: 500 });
    }

    console.log('✅ Conversa transferida para IA com sucesso:', updatedConversation);

    return NextResponse.json({
      success: true,
      conversation: updatedConversation
    });

  } catch (error) {
    console.error('Error in transfer-to-ai API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
