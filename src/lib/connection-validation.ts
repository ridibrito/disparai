import axios from 'axios';

export interface ValidationResult {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

// Validar credenciais do WhatsApp Cloud API
export async function validateWhatsAppCloudCredentials(
  phoneNumberId: string,
  accessToken: string
): Promise<ValidationResult> {
  try {
    // Primeiro, verificar se o token é válido testando o endpoint de debug
    const debugResponse = await axios.get(
      'https://graph.facebook.com/debug_token',
      {
        params: {
          input_token: accessToken,
          access_token: accessToken,
        },
      }
    );

    if (debugResponse.data.data.is_valid === false) {
      return {
        success: false,
        message: 'Token de acesso inválido ou expirado',
        error: 'Invalid or expired access token',
        details: {
          helpText: 'Gere um novo token no Facebook Developers Console.',
          requirements: [
            'Conta no Meta Business Manager',
            'App criado no Facebook Developers',
            'Token de acesso válido'
          ]
        },
      };
    }

    // Verificar permissões necessárias
    const requiredPermissions = ['whatsapp_business_messaging', 'whatsapp_business_management'];
    const tokenPermissions = debugResponse.data.data.scopes || [];
    
    const missingPermissions = requiredPermissions.filter(
      permission => !tokenPermissions.includes(permission)
    );

    if (missingPermissions.length > 0) {
      return {
        success: false,
        message: `Permissões insuficientes. Faltam: ${missingPermissions.join(', ')}`,
        error: `Missing permissions: ${missingPermissions.join(', ')}`,
        details: {
          required: requiredPermissions,
          current: tokenPermissions,
          missing: missingPermissions,
          helpText: 'Adicione as permissões necessárias no Facebook Developers Console.',
          requirements: [
            'whatsapp_business_messaging - Para enviar mensagens',
            'whatsapp_business_management - Para gerenciar contas'
          ]
        },
      };
    }

    // Testar se conseguimos acessar o número de telefone
    const response = await axios.get(
      `https://graph.facebook.com/v20.0/${phoneNumberId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (response.status === 200) {
      // Verificar se o número está verificado
      const phoneData = response.data;
      const isVerified = phoneData.verified_name_status === 'VERIFIED' || phoneData.verified_name_status === 'APPROVED';
      
      return {
        success: true,
        message: isVerified ? 'Credenciais WhatsApp Cloud API válidas e verificadas!' : 'Credenciais válidas, mas número não verificado',
        details: {
          phoneNumberId,
          status: 'active',
          verified: isVerified,
          displayName: phoneData.display_phone_number,
          qualityRating: phoneData.quality_rating,
          verifiedNameStatus: phoneData.verified_name_status,
          permissions: tokenPermissions,
          requirements: [
            'Conta no Meta Business Manager ✓',
            'App no Facebook Developers ✓',
            'Token com permissões corretas ✓',
            'Phone Number ID válido ✓',
            isVerified ? 'Número verificado ✓' : 'Número precisa ser verificado'
          ]
        },
      };
    } else {
      return {
        success: false,
        message: 'Falha na validação das credenciais',
        error: `Status: ${response.status}`,
      };
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    const errorCode = error.response?.data?.error?.code;
    
    // Mapear erros comuns para mensagens mais amigáveis
    let friendlyMessage = 'Erro ao validar credenciais';
    let helpText = '';
    let requirements = [
      'Conta no Meta Business Manager',
      'App criado no Facebook Developers',
      'Token de acesso válido',
      'Phone Number ID correto'
    ];
    
    if (errorMessage.includes('Invalid OAuth access token') || errorCode === 190) {
      friendlyMessage = 'Token de acesso inválido ou expirado';
      helpText = 'Gere um novo token no Facebook Developers Console.';
    } else if (errorMessage.includes('phone_number_id') || errorCode === 100) {
      friendlyMessage = 'ID do número de telefone inválido';
      helpText = 'Verifique se o Phone Number ID está correto no Facebook Business Manager.';
    } else if (errorMessage.includes('permission') || errorCode === 200) {
      friendlyMessage = 'Permissões insuficientes';
      helpText = 'Adicione as permissões whatsapp_business_messaging e whatsapp_business_management.';
    } else if (errorCode === 368) {
      friendlyMessage = 'Acesso temporariamente bloqueado';
      helpText = 'Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.';
    } else if (errorCode === 190) {
      friendlyMessage = 'Token expirado';
      helpText = 'Gere um novo token de acesso no Facebook Developers.';
    }

    return {
      success: false,
      message: friendlyMessage,
      error: errorMessage,
      details: {
        errorCode,
        helpText,
        requirements,
        fullError: error.response?.data,
      },
    };
  }
}

// Validar credenciais da API Disparai (não oficial)
export async function validateWhatsAppDisparaiCredentials(
  instanceKey: string,
  apiToken: string
): Promise<ValidationResult> {
  try {
    // Validar credenciais da API Disparai usando o endpoint de status da instância
    const response = await axios.get(
      `https://apibusiness1.megaapi.com.br/rest/instance/${instanceKey}`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.error === false && response.data.instance?.status === 'connected') {
      return {
        success: true,
        message: 'Credenciais API Disparai válidas e instância conectada!',
        details: {
          instanceKey,
          status: response.data.instance.status,
          verified: true,
          user: response.data.instance.user,
          features: [
            'Mensagens ilimitadas',
            'Envio de mídia',
            'Webhooks em tempo real',
            'Download de mídia',
            'Relatórios detalhados'
          ],
          requirements: [
            'Conta Disparai ativa ✓',
            'Instance Key válida ✓',
            'Token de acesso válido ✓',
            'Instância conectada ✓'
          ]
        },
      };
    } else {
      return {
        success: false,
        message: 'Instância não está conectada ou credenciais inválidas',
        error: response.data.message || 'Instance not connected',
        details: {
          helpText: 'Verifique se a instância está ativa no painel da Disparai.',
          requirements: [
            'Conta Disparai ativa',
            'Instance Key correta',
            'Token de acesso válido',
            'Instância conectada no WhatsApp'
          ]
        },
      };
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message;
    const statusCode = error.response?.status;
    
    let friendlyMessage = 'Erro ao validar credenciais da API Disparai';
    let helpText = '';
    let requirements = [
      'Conta Disparai ativa',
      'Instance Key correta',
      'Token de acesso válido'
    ];
    
    if (statusCode === 401) {
      friendlyMessage = 'Token de acesso inválido ou expirado';
      helpText = 'Verifique se o token está correto no painel da Disparai.';
    } else if (statusCode === 404) {
      friendlyMessage = 'Instance Key não encontrada';
      helpText = 'Verifique se a Instance Key está correta no painel da Disparai.';
    } else if (statusCode === 403) {
      friendlyMessage = 'Acesso negado';
      helpText = 'Verifique as permissões da sua conta Disparai.';
    } else if (errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED')) {
      friendlyMessage = 'Erro de conexão com a API Disparai';
      helpText = 'Verifique sua conexão com a internet e tente novamente.';
    }

    return {
      success: false,
      message: friendlyMessage,
      error: errorMessage,
      details: {
        statusCode,
        helpText,
        requirements,
        fullError: error.response?.data,
      },
    };
  }
}