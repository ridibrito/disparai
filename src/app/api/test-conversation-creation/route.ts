import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabaseServer';
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    console.log('🧪 [TEST] Iniciando teste de criação de conversa');
    
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('❌ [TEST] Usuário não autenticado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('✅ [TEST] Usuário autenticado:', user.id);

    // Buscar um contato para teste
    console.log('🔍 [TEST] Buscando contatos do usuário...');
    const { data: contacts, error: contactsError } = await supabaseAdmin
      .from('contacts')
      .select('id, name, phone')
      .eq('user_id', user.id)
      .limit(1);

    if (contactsError) {
      console.log('❌ [TEST] Erro ao buscar contatos:', contactsError);
      return NextResponse.json({ 
        error: 'Erro ao buscar contatos',
        details: contactsError.message 
      }, { status: 500 });
    }

    if (!contacts || contacts.length === 0) {
      console.log('❌ [TEST] Nenhum contato encontrado');
      return NextResponse.json({ 
        error: 'Nenhum contato encontrado para teste' 
      }, { status: 404 });
    }

    const testContact = contacts[0];
    console.log('✅ [TEST] Contato encontrado:', testContact);

    // Verificar se já existe uma conversa com este contato
    console.log('🔍 [TEST] Verificando conversa existente...');
    const { data: existingConversation, error: existingError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('contact_id', testContact.id)
      .eq('user_id', user.id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      console.log('❌ [TEST] Erro ao verificar conversa existente:', existingError);
      return NextResponse.json({ 
        error: 'Erro ao verificar conversa existente',
        details: existingError.message 
      }, { status: 500 });
    }

    if (existingConversation) {
      console.log('⚠️ [TEST] Conversa já existe:', existingConversation);
      return NextResponse.json({ 
        error: 'Conversa já existe com este contato',
        existing_conversation: existingConversation
      }, { status: 400 });
    }

    // Criar nova conversa
    console.log('🔍 [TEST] Criando nova conversa...');
    const { data: conversation, error: conversationError } = await supabaseAdmin
      .from('conversations')
      .insert({
        contact_id: testContact.id,
        user_id: user.id,
        status: 'active'
      })
      .select(`
        id,
        contact_id,
        user_id,
        status,
        created_at,
        updated_at,
        contacts!inner(
          id,
          name,
          phone
        )
      `)
      .single();

    if (conversationError) {
      console.log('❌ [TEST] Erro ao criar conversa:', conversationError);
      return NextResponse.json({ 
        error: 'Erro ao criar conversa',
        details: conversationError.message 
      }, { status: 500 });
    }

    console.log('✅ [TEST] Conversa criada com sucesso:', conversation);

    // Limpar o teste
    console.log('🧹 [TEST] Limpando conversa de teste...');
    await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', conversation.id);

    console.log('✅ [TEST] Teste concluído com sucesso');

    return NextResponse.json({
      success: true,
      message: 'Teste de criação de conversa bem-sucedido',
      test_data: {
        contact: testContact,
        conversation_created: conversation
      }
    });

  } catch (error: any) {
    console.error('Erro no teste de conversa:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}
