import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Função para validar credenciais do WhatsApp Business API
async function validateWhatsAppCredentials(apiKey: string, phoneNumberId?: string) {
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Função para validar credenciais do Twilio
async function validateTwilioCredentials(apiKey: string, apiSecret: string) {
  try {
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${apiKey}.json`, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Função para validar credenciais genéricas (para outros provedores)
async function validateGenericCredentials(provider: string, apiKey: string) {
  // Para provedores como MessageBird, Zenvia, Infobip
  // Implementar validação específica conforme a documentação de cada provedor
  // Por enquanto, retornamos true se a chave não estiver vazia
  return apiKey && apiKey.length > 10;
}

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Verificar autenticação
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { provider, api_key, api_secret, phone_number_id } = body;
    
    // Validar campos obrigatórios
    if (!provider || !api_key) {
      return NextResponse.json(
        { error: 'Provedor e chave de API são obrigatórios' },
        { status: 400 }
      );
    }
    
    let isValid = false;
    
    // Validar credenciais baseado no provedor
    switch (provider) {
      case 'whatsapp':
        if (!phone_number_id) {
          return NextResponse.json(
            { error: 'ID do número de telefone é obrigatório para WhatsApp' },
            { status: 400 }
          );
        }
        isValid = await validateWhatsAppCredentials(api_key, phone_number_id);
        break;
        
      case 'twilio':
        if (!api_secret) {
          return NextResponse.json(
            { error: 'Secret é obrigatório para Twilio' },
            { status: 400 }
          );
        }
        isValid = await validateTwilioCredentials(api_key, api_secret);
        break;
        
      case 'messagebird':
      case 'zenvia':
      case 'infobip':
        isValid = await validateGenericCredentials(provider, api_key);
        break;
        
      default:
        return NextResponse.json(
          { error: 'Provedor não suportado' },
          { status: 400 }
        );
    }
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciais inválidas. Verifique as informações e tente novamente.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Credenciais validadas com sucesso', valid: true },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Erro ao validar credenciais:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}