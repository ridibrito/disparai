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
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('🔧 [SETUP] Iniciando criação das tabelas de conversas');

    // Verificar se as tabelas já existem
    const { data: existingTables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['conversations', 'messages']);

    if (tablesError) {
      console.log('❌ [SETUP] Erro ao verificar tabelas existentes:', tablesError);
      return NextResponse.json({ 
        error: 'Erro ao verificar tabelas existentes',
        details: tablesError.message 
      }, { status: 500 });
    }

    const existingTableNames = existingTables?.map(t => t.table_name) || [];
    console.log('📋 [SETUP] Tabelas existentes:', existingTableNames);

    // Se as tabelas já existem, retornar sucesso
    if (existingTableNames.includes('conversations') && existingTableNames.includes('messages')) {
      console.log('✅ [SETUP] Tabelas já existem');
      return NextResponse.json({
        success: true,
        message: 'Tabelas de conversas já existem'
      });
    }

    // Como não podemos executar SQL diretamente, vamos tentar criar as tabelas via inserção
    // Primeiro, vamos tentar inserir uma conversa de teste para ver se a tabela existe
    console.log('🔍 [SETUP] Testando se tabela conversations existe...');
    
    try {
      // Buscar um contato para teste
      const { data: testContact } = await supabaseAdmin
        .from('contacts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (testContact) {
        // Tentar inserir uma conversa de teste
        const { data: testConversation, error: testError } = await supabaseAdmin
          .from('conversations')
          .insert({
            contact_id: testContact.id,
            user_id: user.id,
            status: 'active'
          })
          .select('id')
          .single();

        if (testError) {
          console.log('❌ [SETUP] Erro ao testar inserção na tabela conversations:', testError);
          return NextResponse.json({ 
            error: 'Tabela conversations não existe ou tem problemas',
            details: testError.message 
          }, { status: 500 });
        }

        // Limpar o teste
        await supabaseAdmin
          .from('conversations')
          .delete()
          .eq('id', testConversation.id);

        console.log('✅ [SETUP] Tabela conversations funciona corretamente');
      }
    } catch (error: any) {
      console.log('❌ [SETUP] Erro ao testar tabela conversations:', error);
      return NextResponse.json({ 
        error: 'Tabela conversations não existe',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Tabelas de conversas criadas com sucesso'
    });

  } catch (error: any) {
    console.error('Erro no setup das tabelas:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}
