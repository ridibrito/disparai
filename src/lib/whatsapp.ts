import axios from 'axios';
import { env } from './env';
import { supabaseAdmin } from './supabase';
import type { WhatsAppTemplate, WhatsAppText, WhatsAppResponse } from '@/types/whatsapp';

// Interface para conexão dinâmica
interface WhatsAppConnection {
  id: string;
  type: 'whatsapp_cloud' | 'whatsapp_disparai';
  phone_number?: string;
  instance_id?: string;
  api_key: string;
  api_secret?: string;
  webhook_url?: string;
  status: string;
}

// Função para obter conexão ativa
async function getActiveConnection(userId: string, type: 'whatsapp_cloud' | 'whatsapp_disparai' = 'whatsapp_cloud'): Promise<WhatsAppConnection | null> {
  try {
    const { data: connection, error } = await supabaseAdmin
      .from('api_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('is_active', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !connection) {
      console.warn(`No active ${type} connection found for user ${userId}`);
      return null;
    }

    return connection;
  } catch (error) {
    console.error('Error fetching active connection:', error);
    return null;
  }
}

// Função para criar cliente axios dinâmico
function createWhatsAppClient(connection: WhatsAppConnection) {
  if (connection.type === 'whatsapp_cloud') {
    return axios.create({
      baseURL: `https://graph.facebook.com/${env.meta.apiVersion}/${connection.phone_number}`,
      headers: {
        Authorization: `Bearer ${connection.api_key}`,
        'Content-Type': 'application/json',
      },
    });
  } else if (connection.type === 'whatsapp_disparai') {
    return axios.create({
      baseURL: `https://api.disparai.com/instance/${connection.instance_id}`,
      headers: {
        Authorization: `Bearer ${connection.api_key}`,
        'Content-Type': 'application/json',
      },
    });
  }
  
  throw new Error(`Unsupported connection type: ${connection.type}`);
}

// Cliente padrão para compatibilidade (usando env vars)
const whatsappApi = axios.create({
  baseURL: `https://graph.facebook.com/${env.meta.apiVersion}/${env.meta.phoneNumberId}`,
  headers: {
    Authorization: `Bearer ${env.meta.accessToken}`,
    'Content-Type': 'application/json',
  },
});

export async function sendTemplate(
  to: string,
  templateName: string,
  language: string = 'pt_BR',
  components: any[] = [],
  userId?: string,
  connectionType: 'whatsapp_cloud' | 'whatsapp_disparai' = 'whatsapp_cloud'
): Promise<WhatsAppResponse> {
  let client = whatsappApi; // Cliente padrão para compatibilidade
  
  // Se userId fornecido, usar conexão dinâmica
  if (userId) {
    const connection = await getActiveConnection(userId, connectionType);
    if (connection) {
      client = createWhatsAppClient(connection);
    }
  }

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language,
      components,
    },
  };

  const response = await client.post('/messages', payload);
  return response.data;
}

export async function sendText(
  to: string, 
  text: string,
  userId?: string,
  connectionType: 'whatsapp_cloud' | 'whatsapp_disparai' = 'whatsapp_cloud'
): Promise<WhatsAppResponse> {
  let client = whatsappApi; // Cliente padrão para compatibilidade
  
  // Se userId fornecido, usar conexão dinâmica
  if (userId) {
    const connection = await getActiveConnection(userId, connectionType);
    if (connection) {
      client = createWhatsAppClient(connection);
    }
  }

  const payload: WhatsAppText = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: {
      body: text,
    },
  };

  const response = await client.post('/messages', payload);
  return response.data;
}

export async function sendInteractive(
  to: string,
  body: string,
  buttons: Array<{ id: string; title: string }>,
  userId?: string,
  connectionType: 'whatsapp_cloud' | 'whatsapp_disparai' = 'whatsapp_cloud'
): Promise<WhatsAppResponse> {
  // Se for MegaAPI/Disparai, usar função específica
  if (connectionType === 'whatsapp_disparai' && userId) {
    try {
      const connection = await getActiveConnection(userId, connectionType);
      if (connection) {
        const { createDisparaiAPIClient } = await import('@/lib/disparai-api');
        const disparaiClient = createDisparaiAPIClient(
          connection.instance_id,
          connection.api_token
        );
        
        const result = await disparaiClient.sendButtonMessage(to, body, buttons);
        
        if (result.error) {
          throw new Error(result.message || 'Erro ao enviar botões via MegaAPI');
        }
        
        return {
          messaging_product: 'whatsapp',
          contacts: [{ input: to, wa_id: to }],
          messages: [{ id: result.data?.messageId || 'unknown' }]
        };
      }
    } catch (error) {
      console.error('Erro ao enviar botões via MegaAPI:', error);
      // Fallback para texto simples
      return await sendText(to, `${body}\n\nResponda:\n${buttons.map(b => `• ${b.title}`).join('\n')}`, userId, connectionType);
    }
  }

  // WhatsApp Cloud API (formato original)
  let client = whatsappApi; // Cliente padrão para compatibilidade
  
  // Se userId fornecido, usar conexão dinâmica
  if (userId) {
    const connection = await getActiveConnection(userId, connectionType);
    if (connection) {
      client = createWhatsAppClient(connection);
    }
  }

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: body,
      },
      action: {
        buttons: buttons.map((button, index) => ({
          type: 'reply',
          reply: {
            id: button.id,
            title: button.title,
          },
        })),
      },
    },
  };

  const response = await client.post('/messages', payload);
  return response.data;
}

export async function sendList(
  to: string,
  body: string,
  buttonText: string,
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>,
  userId?: string,
  connectionType: 'whatsapp_cloud' | 'whatsapp_disparai' = 'whatsapp_cloud'
): Promise<WhatsAppResponse> {
  let client = whatsappApi; // Cliente padrão para compatibilidade
  
  // Se userId fornecido, usar conexão dinâmica
  if (userId) {
    const connection = await getActiveConnection(userId, connectionType);
    if (connection) {
      client = createWhatsAppClient(connection);
    }
  }

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: {
        text: body,
      },
      action: {
        button: buttonText,
        sections,
      },
    },
  };

  const response = await client.post('/messages', payload);
  return response.data;
}
