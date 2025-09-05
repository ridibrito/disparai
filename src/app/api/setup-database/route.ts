import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Testando inserção na tabela...');
    
    const supabase = await createServerClient();
    
    // Tentar inserir um registro de teste
    const testData = {
      organization_id: 'test-org-setup',
      instance_key: `test_${Date.now()}`,
      token: 'test-token',
      status: 'pendente',
      webhook_url: 'http://localhost:3000/api/webhooks/whatsapp'
    };
    
    console.log('📝 Tentando inserir dados de teste:', testData);
    
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .insert(testData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao inserir dados de teste:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Erro ao inserir dados de teste',
          details: error.message,
          code: error.code,
          hint: error.hint
        },
        { status: 500 }
      );
    }
    
    console.log('✅ Dados de teste inseridos com sucesso:', data);
    
    // Limpar dados de teste
    await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', data.id);
    
    return NextResponse.json({
      success: true,
      message: 'Tabela funcionando corretamente!',
      testData: data,
      note: 'Dados de teste foram removidos'
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao testar tabela:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
