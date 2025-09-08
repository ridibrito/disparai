import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabaseServer';
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se as tabelas existem
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['conversations', 'messages']);

    if (tablesError) {
      console.error('Erro ao verificar tabelas:', tablesError);
    }

    // Verificar estrutura da tabela conversations
    const { data: conversationsColumns, error: conversationsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'conversations');

    if (conversationsError) {
      console.error('Erro ao verificar colunas de conversations:', conversationsError);
    }

    // Verificar estrutura da tabela messages
    const { data: messagesColumns, error: messagesError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'messages');

    if (messagesError) {
      console.error('Erro ao verificar colunas de messages:', messagesError);
    }

    // Tentar buscar conversas existentes
    const { data: existingConversations, error: conversationsQueryError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .limit(5);

    if (conversationsQueryError) {
      console.error('Erro ao buscar conversas:', conversationsQueryError);
    }

    // Verificar contatos do usuário
    const { data: userContacts, error: contactsError } = await supabaseAdmin
      .from('contacts')
      .select('id, name, phone')
      .eq('user_id', user.id)
      .limit(5);

    if (contactsError) {
      console.error('Erro ao buscar contatos:', contactsError);
    }

    return NextResponse.json({
      success: true,
      debug: {
        user_id: user.id,
        tables_exist: tables?.map(t => t.table_name) || [],
        conversations_columns: conversationsColumns || [],
        messages_columns: messagesColumns || [],
        existing_conversations: existingConversations || [],
        user_contacts: userContacts || [],
        errors: {
          tables: tablesError?.message,
          conversations: conversationsError?.message,
          messages: messagesError?.message,
          conversations_query: conversationsQueryError?.message,
          contacts: contactsError?.message
        }
      }
    });

  } catch (error: any) {
    console.error('Erro no debug de conversas:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}
