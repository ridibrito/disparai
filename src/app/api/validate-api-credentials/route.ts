import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    // Criar cliente do Supabase
    const supabase = await createServerClient();
    
    // Verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Obter dados do corpo da requisição
    const { provider, api_key, api_secret, phone_number_id } = await req.json();
    
    // Validar dados obrigatórios
    if (!provider || !api_key) {
      return NextResponse.json(
        { valid: false, message: 'Dados incompletos' },
        { status: 400 }
      );
    }
    
    // Verificar se o usuário tem acesso a este recurso com base no plano
    const { data: user } = await supabase
      .from('users')
      .select('plan_id, plans(features)')
      .eq('id', session.user.id)
      .single();
    
    if (!user || !user.plans || !user.plans.features || !user.plans.features.api_personalizada) {
      return NextResponse.json(
        { valid: false, message: 'Recurso não disponível no seu plano' },
        { status: 403 }
      );
    }
    
    // Validar as credenciais com base no provedor
    let isValid = false;
    let validationMessage = '';
    
    switch (provider) {
      case 'whatsapp_business':
        // Validar credenciais da API do WhatsApp Business
        isValid = await validateWhatsAppBusinessCredentials(api_key, phone_number_id);
        validationMessage = isValid ? 'Credenciais válidas' : 'Credenciais inválidas para WhatsApp Business API';
        break;
        
      case 'whatsapp_cloud':
        // Validar credenciais da API do WhatsApp Cloud
        isValid = await validateWhatsAppCloudCredentials(api_key, api_secret, phone_number_id);
        validationMessage = isValid ? 'Credenciais válidas' : 'Credenciais inválidas para WhatsApp Cloud API';
        break;
        
      case 'twilio':
        // Validar credenciais do Twilio
        isValid = await validateTwilioCredentials(api_key, api_secret);
        validationMessage = isValid ? 'Credenciais válidas' : 'Credenciais inválidas para Twilio';
        break;
        
      case 'custom':
        // Para API personalizada, apenas verificamos se a chave foi fornecida
        isValid = api_key.length > 5;
        validationMessage = isValid ? 'Credenciais válidas' : 'Chave de API inválida';
        break;
        
      default:
        return NextResponse.json(
          { valid: false, message: 'Provedor não suportado' },
          { status: 400 }
        );
    }
    
    return NextResponse.json(
      { valid: isValid, message: validationMessage },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao validar credenciais:', error);
    return NextResponse.json(
      { valid: false, message: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// Funções de validação para cada provedor
// Estas funções seriam implementadas com chamadas reais às APIs

async function validateWhatsAppBusinessCredentials(apiKey: string, phoneNumberId: string): Promise<boolean> {
  // Simulação de validação - em produção, faria uma chamada real à API
  try {
    // Verificar se a chave e o ID do número de telefone são válidos
    if (!apiKey || !phoneNumberId) return false;
    
    // Em um ambiente real, faríamos uma chamada à API do WhatsApp Business
    // para verificar se as credenciais são válidas
    
    // Simulação: consideramos válido se a chave tiver pelo menos 10 caracteres
    // e o ID do número de telefone tiver pelo menos 5 caracteres
    return apiKey.length >= 10 && phoneNumberId.length >= 5;
  } catch (error) {
    console.error('Erro ao validar credenciais do WhatsApp Business:', error);
    return false;
  }
}

async function validateWhatsAppCloudCredentials(apiKey: string, apiSecret: string, phoneNumberId: string): Promise<boolean> {
  // Simulação de validação - em produção, faria uma chamada real à API
  try {
    // Verificar se a chave, o segredo e o ID do número de telefone são válidos
    if (!apiKey || !apiSecret || !phoneNumberId) return false;
    
    // Em um ambiente real, faríamos uma chamada à API do WhatsApp Cloud
    // para verificar se as credenciais são válidas
    
    // Simulação: consideramos válido se a chave e o segredo tiverem pelo menos 10 caracteres
    // e o ID do número de telefone tiver pelo menos 5 caracteres
    return apiKey.length >= 10 && apiSecret.length >= 10 && phoneNumberId.length >= 5;
  } catch (error) {
    console.error('Erro ao validar credenciais do WhatsApp Cloud:', error);
    return false;
  }
}

async function validateTwilioCredentials(apiKey: string, apiSecret: string): Promise<boolean> {
  // Simulação de validação - em produção, faria uma chamada real à API
  try {
    // Verificar se a chave e o segredo são válidos
    if (!apiKey || !apiSecret) return false;
    
    // Em um ambiente real, faríamos uma chamada à API do Twilio
    // para verificar se as credenciais são válidas
    
    // Simulação: consideramos válido se a chave e o segredo tiverem pelo menos 10 caracteres
    return apiKey.length >= 10 && apiSecret.length >= 10;
  } catch (error) {
    console.error('Erro ao validar credenciais do Twilio:', error);
    return false;
  }
}