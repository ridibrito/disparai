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

    // Testar se as tabelas existem
    const tests = [];

    // Teste 1: Verificar se tabela conversations existe
    try {
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .select('count')
        .limit(1);
      
      tests.push({
        test: 'conversations_table_exists',
        success: !error,
        error: error?.message
      });
    } catch (e: any) {
      tests.push({
        test: 'conversations_table_exists',
        success: false,
        error: e.message
      });
    }

    // Teste 2: Verificar se tabela messages existe
    try {
      const { data, error } = await supabaseAdmin
        .from('messages')
        .select('count')
        .limit(1);
      
      tests.push({
        test: 'messages_table_exists',
        success: !error,
        error: error?.message
      });
    } catch (e: any) {
      tests.push({
        test: 'messages_table_exists',
        success: false,
        error: e.message
      });
    }

    // Teste 3: Verificar se tabela contacts existe
    try {
      const { data, error } = await supabaseAdmin
        .from('contacts')
        .select('count')
        .limit(1);
      
      tests.push({
        test: 'contacts_table_exists',
        success: !error,
        error: error?.message
      });
    } catch (e: any) {
      tests.push({
        test: 'contacts_table_exists',
        success: false,
        error: e.message
      });
    }

    // Teste 4: Tentar criar uma conversa de teste
    try {
      const { data: contacts } = await supabaseAdmin
        .from('contacts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (contacts && contacts.length > 0) {
        const { data, error } = await supabaseAdmin
          .from('conversations')
          .insert({
            contact_id: contacts[0].id,
            user_id: user.id,
            status: 'active'
          })
          .select('id')
          .single();

        tests.push({
          test: 'create_conversation',
          success: !error,
          error: error?.message,
          data: data
        });

        // Limpar o teste
        if (data) {
          await supabaseAdmin
            .from('conversations')
            .delete()
            .eq('id', data.id);
        }
      } else {
        tests.push({
          test: 'create_conversation',
          success: false,
          error: 'Nenhum contato encontrado para teste'
        });
      }
    } catch (e: any) {
      tests.push({
        test: 'create_conversation',
        success: false,
        error: e.message
      });
    }

    return NextResponse.json({
      success: true,
      user_id: user.id,
      tests
    });

  } catch (error: any) {
    console.error('Erro no teste de conversas:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}
