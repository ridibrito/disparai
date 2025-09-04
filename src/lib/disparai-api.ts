import axios from 'axios';

export interface DisparaiAPIConfig {
  instanceKey: string;
  apiToken: string;
  baseUrl?: string;
}

export interface DisparaiAPIMessage {
  to: string;
  message: string;
  messageType?: 'text' | 'media';
  mediaType?: 'image' | 'audio' | 'video' | 'document';
  mediaUrl?: string;
  caption?: string;
}

export interface DisparaiAPIResponse {
  error: boolean;
  message: string;
  data?: any;
}

export class DisparaiAPIClient {
  private config: DisparaiAPIConfig;
  private baseUrl: string;

  constructor(config: DisparaiAPIConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://apibusiness1.megaapi.com.br';
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.config.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Criar nova instância no servidor
   */
  async createInstance(instanceName: string): Promise<DisparaiAPIResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/rest/instance/create`,
        {
          instanceName,
          qr: true, // Gerar QR code automaticamente
        },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      return {
        error: true,
        message: error.response?.data?.message || error.message,
        data: error.response?.data
      };
    }
  }

  /**
   * Gerar QR Code para conectar a instância
   */
  async generateQRCode(): Promise<DisparaiAPIResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/rest/instance/connect/${this.config.instanceKey}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      return {
        error: true,
        message: error.response?.data?.message || error.message,
        data: error.response?.data
      };
    }
  }

  /**
   * Verificar status da instância
   */
  async getInstanceStatus(): Promise<DisparaiAPIResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/rest/instance/${this.config.instanceKey}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      return {
        error: true,
        message: error.response?.data?.message || error.message,
        data: error.response?.data
      };
    }
  }

  /**
   * Deletar instância
   */
  async deleteInstance(): Promise<DisparaiAPIResponse> {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/rest/instance/delete/${this.config.instanceKey}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      return {
        error: true,
        message: error.response?.data?.message || error.message,
        data: error.response?.data
      };
    }
  }

  /**
   * Enviar mensagem de texto
   */
  async sendTextMessage(to: string, message: string): Promise<DisparaiAPIResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/rest/instance/sendMessage/${this.config.instanceKey}`,
        {
          to,
          message
        },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      return {
        error: true,
        message: error.response?.data?.message || error.message,
        data: error.response?.data
      };
    }
  }

  /**
   * Enviar mídia (imagem, vídeo, áudio, documento)
   */
  async sendMediaMessage(
    to: string,
    mediaType: 'image' | 'audio' | 'video' | 'document',
    mediaUrl: string,
    caption?: string
  ): Promise<DisparaiAPIResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/rest/instance/sendMedia/${this.config.instanceKey}`,
        {
          to,
          mediaType,
          mediaUrl,
          caption
        },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      return {
        error: true,
        message: error.response?.data?.message || error.message,
        data: error.response?.data
      };
    }
  }

  /**
   * Download de mídia recebida via webhook
   */
  async downloadMediaMessage(
    messageType: string,
    mediaKey: string,
    directPath: string,
    url: string,
    mimetype: string
  ): Promise<DisparaiAPIResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/rest/instance/downloadMediaMessage/${this.config.instanceKey}`,
        {
          messageType,
          mediaKey,
          directPath,
          url,
          mimetype
        },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      return {
        error: true,
        message: error.response?.data?.message || error.message,
        data: error.response?.data
      };
    }
  }

  /**
   * Enviar mensagem genérica (texto ou mídia)
   */
  async sendMessage(messageData: DisparaiAPIMessage): Promise<DisparaiAPIResponse> {
    if (messageData.messageType === 'media' && messageData.mediaType && messageData.mediaUrl) {
      return this.sendMediaMessage(
        messageData.to,
        messageData.mediaType,
        messageData.mediaUrl,
        messageData.caption
      );
    } else {
      return this.sendTextMessage(messageData.to, messageData.message);
    }
  }

  /**
   * Método simplificado para envio de mensagens (usado nas campanhas)
   */
  async sendMessage(params: {
    instanceKey: string;
    phoneNumber: string;
    message: string;
  }): Promise<DisparaiAPIResponse> {
    try {
      // Formatar número de telefone
      const formattedPhone = formatPhoneToE164(params.phoneNumber);
      
      const response = await axios.post(
        `${this.baseUrl}/rest/instance/sendMessage/${params.instanceKey}`,
        {
          to: formattedPhone,
          message: params.message
        },
        { headers: this.getHeaders() }
      );
      
      return {
        error: false,
        message: 'Mensagem enviada com sucesso',
        data: {
          messageId: response.data?.messageId || response.data?.id,
          status: response.data?.status || 'sent'
        }
      };
    } catch (error: any) {
      return {
        error: true,
        message: error.response?.data?.message || error.message,
        data: error.response?.data
      };
    }
  }
}

/**
 * Função helper para criar cliente API Disparai
 */
export function createDisparaiAPIClient(instanceKey: string, apiToken: string): DisparaiAPIClient {
  return new DisparaiAPIClient({ instanceKey, apiToken });
}

/**
 * Função helper para validar formato de número de telefone
 */
export function validatePhoneNumber(phone: string): boolean {
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Verifica se tem pelo menos 10 dígitos (formato mínimo)
  if (cleanPhone.length < 10) return false;
  
  // Verifica se tem no máximo 15 dígitos (padrão internacional)
  if (cleanPhone.length > 15) return false;
  
  return true;
}

/**
 * Função helper para formatar número de telefone para E164
 */
export function formatPhoneToE164(phone: string): string {
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Se não começar com código do país, adiciona +55 (Brasil)
  if (cleanPhone.length === 11 && cleanPhone.startsWith('11')) {
    return `+55${cleanPhone}`;
  } else if (cleanPhone.length === 10) {
    return `+55${cleanPhone}`;
  } else if (cleanPhone.startsWith('55')) {
    return `+${cleanPhone}`;
  } else if (cleanPhone.startsWith('+')) {
    return cleanPhone;
  } else {
    return `+55${cleanPhone}`;
  }
}
