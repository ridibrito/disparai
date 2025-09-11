// Serviço para integração com API do WhatsApp (Disparai API)
// Este é um exemplo de como integrar com a API real

interface WhatsAppMessage {
  to: string;
  message: string;
  type?: 'text' | 'image' | 'document';
  mediaUrl?: string;
  filename?: string;
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface MessageStatus {
  messageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
}

class WhatsAppAPIService {
  private baseUrl: string;
  private apiKey: string;
  private instanceId: string;

  constructor() {
    // Configuração da API real do Disparai
    this.baseUrl = process.env.NEXT_PUBLIC_WHATSAPP_API_URL || 'https://api.disparai.com';
    this.apiKey = process.env.NEXT_PUBLIC_WHATSAPP_API_KEY || '';
    this.instanceId = process.env.NEXT_PUBLIC_WHATSAPP_INSTANCE_ID || '';
  }

  // Método para definir a instância ativa
  setActiveInstance(instanceKey: string) {
    this.instanceId = instanceKey;
  }

  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    try {
      // Verificar se temos a instância configurada
      if (!this.instanceId) {
        console.warn('Instância WhatsApp não configurada, usando modo simulação');
        // Modo simulação para desenvolvimento
        await new Promise(resolve => setTimeout(resolve, 1500));
        const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        console.log(`[WhatsApp API - SIMULAÇÃO] Mensagem enviada para ${message.to}: ${message.message} (ID: ${messageId})`);
        return { success: true, messageId };
      }

      // Usar MegaAPI para envio
      const host = process.env.MEGA_HOST || 'https://teste8.megaapi.com.br';
      const token = process.env.MEGA_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';

      const payload: any = {
        number: message.to,
        text: message.message
      };

      if (message.type === 'image' && message.mediaUrl) {
        payload.image = message.mediaUrl;
      } else if (message.type === 'document' && message.mediaUrl) {
        payload.document = message.mediaUrl;
      }

      const response = await fetch(`${host}/rest/sendMessage/${this.instanceId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      const messageId = data.key?.id || data.id || `msg_${Date.now()}`;
      
      console.log(`[WhatsApp API] Mensagem enviada para ${message.to}: ${message.message} (ID: ${messageId})`);
      
      return {
        success: true,
        messageId,
      };
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  async getMessageStatus(messageId: string): Promise<MessageStatus> {
    try {
      // Simular verificação de status
      await new Promise(resolve => setTimeout(resolve, 500));

      // Em produção, faria a chamada real para a API
      const response = await fetch(`${this.baseUrl}/message-status/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        messageId,
        status: data.status || 'sent',
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Erro ao verificar status da mensagem:', error);
      return {
        messageId,
        status: 'failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async uploadMedia(file: File): Promise<{ success: boolean; mediaUrl?: string; error?: string }> {
    try {
      // Verificar se temos as credenciais necessárias
      if (!this.apiKey || !this.instanceId) {
        console.warn('Credenciais da API não configuradas, usando modo simulação');
        // Modo simulação para desenvolvimento
        await new Promise(resolve => setTimeout(resolve, 2000));
        const mediaUrl = `https://mock-cdn.com/${file.name}-${Date.now()}`;
        console.log(`[WhatsApp API - SIMULAÇÃO] Mídia ${file.name} uploaded: ${mediaUrl}`);
        return { success: true, mediaUrl };
      }

      // Upload real para a API do Disparai
      const formData = new FormData();
      formData.append('file', file);
      formData.append('instanceId', this.instanceId);

      const response = await fetch(`${this.baseUrl}/upload-media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log(`[WhatsApp API] Mídia ${file.name} uploaded: ${data.mediaUrl}`);
      
      return {
        success: true,
        mediaUrl: data.mediaUrl || data.url,
      };
    } catch (error) {
      console.error('Erro ao fazer upload da mídia:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  // Simular status de entrega para demonstração
  async simulateMessageDelivery(messageId: string): Promise<void> {
    // Simular progressão do status: sent -> delivered -> read
    setTimeout(() => {
      this.updateMessageStatus(messageId, 'delivered');
    }, 2000);

    setTimeout(() => {
      this.updateMessageStatus(messageId, 'read');
    }, 5000);
  }

  private updateMessageStatus(messageId: string, status: 'sent' | 'delivered' | 'read' | 'failed'): void {
    // Em produção, isso seria um evento real da API
    // Por enquanto, apenas logamos
    console.log(`Message ${messageId} status updated to: ${status}`);
  }
}

export const whatsappAPI = new WhatsAppAPIService();
export type { WhatsAppMessage, WhatsAppResponse, MessageStatus };
