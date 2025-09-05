import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    console.log('🧪 Testando endpoint...');
    
    // Testar conexão com Supabase
    const supabase = await createServerClient();
    
    // Testar se consegue acessar a tabela whatsapp_instances
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro ao acessar tabela:', error);
      return NextResponse.json({
        message: 'Endpoint funcionando, mas erro na tabela!',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      message: 'Endpoint funcionando!',
      supabase: 'Conectado com sucesso',
      table: 'Tabela acessível',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Erro no endpoint de teste:', error);
    
    return NextResponse.json(
      { 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📦 Body recebido:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Teste POST funcionando!',
      receivedData: body
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
