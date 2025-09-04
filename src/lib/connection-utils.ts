import { supabaseAdmin } from './supabase';
import axios from 'axios';
import { env } from './env';

// Interface para conexão dinâmica
export interface WhatsAppConnection {
  id: string;
  type: 'whatsapp_cloud' | 'whatsapp_disparai';
  phone_number?: string;
  instance_id?: string;
  api_key: string;
  api_secret?: string;
  webhook_url?: string;
  status: string;
}

// Função para criar cliente axios dinâmico
export function createWhatsAppClient(connection: WhatsAppConnection) {
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

// Função para obter conexão ativa
export async function getActiveConnection(userId: string, type: 'whatsapp_cloud' | 'whatsapp_disparai' = 'whatsapp_cloud'): Promise<WhatsAppConnection | null> {
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

// Função para obter todas as conexões ativas
export async function getActiveConnections(userId: string): Promise<WhatsAppConnection[]> {
  try {
    const { data: connections, error } = await supabaseAdmin
      .from('api_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching connections:', error);
      return [];
    }

    return connections || [];
  } catch (error) {
    console.error('Error fetching connections:', error);
    return [];
  }
}

// Função para testar conexão
export async function testConnection(connectionId: string): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    const { data: connection, error } = await supabaseAdmin
      .from('api_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (error || !connection) {
      return { success: false, message: 'Conexão não encontrada' };
    }

    const client = createWhatsAppClient(connection);
    
    if (connection.type === 'whatsapp_cloud') {
      // Testar WhatsApp Cloud API
      const response = await client.get(`/${connection.phone_number}`);
      return {
        success: true,
        message: 'Conexão WhatsApp Cloud API testada com sucesso!',
        details: { status: 'active', verified: true }
      };
    } else if (connection.type === 'whatsapp_disparai') {
      // Testar WhatsApp Disparai
      const response = await client.get('/status');
      return {
        success: true,
        message: 'Conexão WhatsApp Disparai testada com sucesso!',
        details: { status: response.data.status || 'active', verified: true }
      };
    }

    return { success: false, message: 'Tipo de conexão não suportado' };
  } catch (error: any) {
    return {
      success: false,
      message: 'Erro ao testar conexão',
      details: { error: error.message }
    };
  }
}

// Função para registrar uso da conexão
export async function logConnectionUsage(
  connectionId: string,
  action: string,
  success: boolean,
  messageCount: number = 0,
  errorMessage?: string,
  metadata?: any
): Promise<void> {
  try {
    await supabaseAdmin.rpc('log_connection_usage', {
      p_connection_id: connectionId,
      p_action: action,
      p_success: success,
      p_message_count: messageCount,
      p_error_message: errorMessage,
      p_metadata: metadata
    });
  } catch (error) {
    console.error('Error logging connection usage:', error);
  }
}

// Função para obter conexão por phone_number_id (para webhooks)
export async function getConnectionByPhoneNumber(phoneNumberId: string): Promise<WhatsAppConnection | null> {
  try {
    const { data: connection, error } = await supabaseAdmin
      .from('api_connections')
      .select('*')
      .eq('phone_number', phoneNumberId)
      .eq('type', 'whatsapp_cloud')
      .eq('is_active', true)
      .eq('status', 'active')
      .single();

    if (error || !connection) {
      console.warn(`No active connection found for phone number ${phoneNumberId}`);
      return null;
    }

    return connection;
  } catch (error) {
    console.error('Error fetching connection by phone number:', error);
    return null;
  }
}
