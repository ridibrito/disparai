import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithServiceRole } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 API de configuração de webhook chamada - VERSÃO SIMPLIFICADA');
    
    const body = await request.json();
    console.log('📦 Dados recebidos:', body);
    
    const { instanceKey } = body;

    if (!instanceKey) {
      return NextResponse.json({ error: 'instanceKey é obrigatório' }, { status: 400 });
    }

    // URL do webhook para mensagens
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/whatsapp-messages`;

    console.log('🔧 Configurando webhook na MegaAPI...');
    
    // Configurar webhook na MegaAPI
    const megaApiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mega/configure-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instanceKey,
        webhookUrl
      })
    });

    const megaApiResult = await megaApiResponse.json();
    
    if (!megaApiResponse.ok) {
      console.error('❌ Erro ao configurar webhook na MegaAPI:', megaApiResult);
      return NextResponse.json({ 
        error: 'Erro ao configurar webhook na MegaAPI',
        details: megaApiResult.error || megaApiResult.details
      }, { status: megaApiResponse.status });
    }

    console.log('✅ Webhook configurado na MegaAPI:', megaApiResult);

    // Atualizar webhook URL no banco de dados
    const supabase = createServerClientWithServiceRole();
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({ 
        webhook_url: webhookUrl,
        updated_at: new Date().toISOString()
      })
      .eq('instance_key', instanceKey);

    if (updateError) {
      console.error('❌ Erro ao atualizar webhook URL:', updateError);
      return NextResponse.json({ 
        error: 'Erro ao atualizar webhook URL no banco de dados',
        details: updateError.message
      }, { status: 500 });
    }

    console.log('✅ Webhook configurado e atualizado no banco de dados');

    return NextResponse.json({ 
      success: true, 
      webhookUrl,
      message: 'Webhook configurado com sucesso na MegaAPI e banco de dados',
      instanceKey,
      megaApiResult,
      instructions: {
        step1: 'Webhook configurado na MegaAPI para: ' + webhookUrl,
        step2: 'Webhook atualizado no banco de dados',
        step3: 'Teste enviando uma mensagem do WhatsApp para o número conectado',
        step4: 'As mensagens aparecerão automaticamente na página de conversas'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

// Adicionar método GET para teste
export async function GET() {
  return NextResponse.json({ 
    message: 'API de configuração de webhook funcionando',
    timestamp: new Date().toISOString()
  });
}