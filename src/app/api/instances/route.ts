import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithServiceRole } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Listando instâncias WhatsApp...');
    
    const supabase = createServerClientWithServiceRole();
    
    const { data: instances, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao listar instâncias:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Erro ao listar instâncias',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }
    
    console.log('✅ Instâncias encontradas:', instances?.length || 0);
    console.log('📋 Dados das instâncias:', instances);
    
    return NextResponse.json({
      success: true,
      instances: instances || [],
      count: instances?.length || 0
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao listar instâncias:', error);
    
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
