import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithServiceRole } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    console.log('🏢 Configurando organização de teste...');
    
    const supabase = createServerClientWithServiceRole();
    
    // Verificar se a tabela organizations existe
    const { data: orgCheck, error: orgError } = await supabase
      .from('organizations')
      .select('count')
      .limit(1);
    
    if (orgError) {
      console.error('❌ Erro ao acessar tabela organizations:', orgError);
      return NextResponse.json({
        success: false,
        error: 'Tabela organizations não existe ou não é acessível',
        details: orgError.message
      });
    }
    
    console.log('✅ Tabela organizations acessível');
    
    // Criar organização de teste
    const testOrg = {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Organização de Teste',
      created_at: new Date().toISOString()
    };
    
    console.log('📝 Criando organização de teste:', testOrg);
    
    const { data: org, error: insertError } = await supabase
      .from('organizations')
      .upsert(testOrg, { onConflict: 'id' })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erro ao criar organização:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar organização',
        details: insertError.message,
        code: insertError.code
      });
    }
    
    console.log('✅ Organização criada/atualizada:', org);
    
    return NextResponse.json({
      success: true,
      message: 'Organização de teste configurada com sucesso!',
      organization: org
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao configurar organização:', error);
    
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
