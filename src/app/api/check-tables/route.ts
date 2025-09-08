import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente admin para operações que precisam de mais permissões
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 [CHECK] Verificando tabelas...');

    // Verificar se as tabelas existem tentando acessá-las diretamente
    const tableTests = {};
    const existingTableNames = [];

    // Testar tabela contacts
    try {
      const { data, error } = await supabaseAdmin
        .from('contacts')
        .select('count')
        .limit(1);
      
      tableTests.contacts = {
        exists: !error,
        error: error?.message
      };
      
      if (!error) {
        existingTableNames.push('contacts');
      }
    } catch (e: any) {
      tableTests.contacts = {
        exists: false,
        error: e.message
      };
    }

    // Testar tabela conversations
    try {
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .select('count')
        .limit(1);
      
      tableTests.conversations = {
        exists: !error,
        error: error?.message
      };
      
      if (!error) {
        existingTableNames.push('conversations');
      }
    } catch (e: any) {
      tableTests.conversations = {
        exists: false,
        error: e.message
      };
    }

    // Testar tabela messages
    try {
      const { data, error } = await supabaseAdmin
        .from('messages')
        .select('count')
        .limit(1);
      
      tableTests.messages = {
        exists: !error,
        error: error?.message
      };
      
      if (!error) {
        existingTableNames.push('messages');
      }
    } catch (e: any) {
      tableTests.messages = {
        exists: false,
        error: e.message
      };
    }

    console.log('📋 [CHECK] Resultados dos testes:', tableTests);

    return NextResponse.json({
      success: true,
      tables_exist: existingTableNames,
      table_tests: tableTests,
      missing_tables: ['conversations', 'messages', 'contacts'].filter(t => !existingTableNames.includes(t))
    });

  } catch (error: any) {
    console.error('Erro ao verificar tabelas:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
}