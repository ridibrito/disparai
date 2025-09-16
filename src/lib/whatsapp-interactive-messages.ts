// Serviço para mensagens interativas WhatsApp via Mega API
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface ButtonMessage {
  to: string;
  body: string;
  buttons: Array<{
    id: string;
    title: string;
  }>;
}

export interface ListMessage {
  to: string;
  body: string;
  buttonText: string;
  sections: Array<{
    title: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>;
}

export interface TemplateMessage {
  to: string;
  templateName: string;
  language: string;
  components?: Array<{
    type: 'header' | 'body' | 'footer' | 'button';
    parameters?: Array<{
      type: 'text' | 'image' | 'document' | 'video';
      text?: string;
      image?: { link: string };
      document?: { link: string; filename: string };
      video?: { link: string };
    }>;
  }>;
}

export interface PollMessage {
  to: string;
  name: string;
  options: string[];
  selectableCount: number;
}

export interface InteractiveResult {
  success: boolean;
  message: string;
  data?: any;
}

class WhatsAppInteractiveMessagesService {
  private supabase = createClientComponentClient();

  /**
   * Enviar mensagem com botões
   */
  async sendButtonMessage(instanceKey: string, message: ButtonMessage): Promise<InteractiveResult> {
    try {
      console.log('🔘 Enviando mensagem com botões:', { instanceKey, message });

      const response = await fetch('/api/mega/send-button-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          ...message
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar mensagem com botões');
      }

      console.log('✅ Mensagem com botões enviada');
      return {
        success: true,
        message: 'Mensagem com botões enviada com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem com botões:', error);
      return {
        success: false,
        message: error.message || 'Erro ao enviar mensagem com botões'
      };
    }
  }

  /**
   * Enviar mensagem com lista
   */
  async sendListMessage(instanceKey: string, message: ListMessage): Promise<InteractiveResult> {
    try {
      console.log('📋 Enviando mensagem com lista:', { instanceKey, message });

      const response = await fetch('/api/mega/send-list-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          ...message
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar mensagem com lista');
      }

      console.log('✅ Mensagem com lista enviada');
      return {
        success: true,
        message: 'Mensagem com lista enviada com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem com lista:', error);
      return {
        success: false,
        message: error.message || 'Erro ao enviar mensagem com lista'
      };
    }
  }

  /**
   * Enviar mensagem template
   */
  async sendTemplateMessage(instanceKey: string, message: TemplateMessage): Promise<InteractiveResult> {
    try {
      console.log('📄 Enviando mensagem template:', { instanceKey, message });

      const response = await fetch('/api/mega/send-template-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          ...message
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar mensagem template');
      }

      console.log('✅ Mensagem template enviada');
      return {
        success: true,
        message: 'Mensagem template enviada com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem template:', error);
      return {
        success: false,
        message: error.message || 'Erro ao enviar mensagem template'
      };
    }
  }

  /**
   * Enviar enquete
   */
  async sendPollMessage(instanceKey: string, message: PollMessage): Promise<InteractiveResult> {
    try {
      console.log('📊 Enviando enquete:', { instanceKey, message });

      const response = await fetch('/api/mega/send-poll-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          ...message
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar enquete');
      }

      console.log('✅ Enquete enviada');
      return {
        success: true,
        message: 'Enquete enviada com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao enviar enquete:', error);
      return {
        success: false,
        message: error.message || 'Erro ao enviar enquete'
      };
    }
  }

  /**
   * Salvar template de mensagem interativa
   */
  async saveInteractiveTemplate(instanceKey: string, template: any): Promise<InteractiveResult> {
    try {
      console.log('💾 Salvando template interativo:', { instanceKey, template });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await this.supabase
        .from('whatsapp_interactive_templates')
        .upsert({
          user_id: user.id,
          instance_key: instanceKey,
          template_name: template.name,
          template_type: template.type,
          template_data: template.data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Template interativo salvo');
      return {
        success: true,
        message: 'Template salvo com sucesso'
      };
    } catch (error: any) {
      console.error('❌ Erro ao salvar template:', error);
      return {
        success: false,
        message: error.message || 'Erro ao salvar template'
      };
    }
  }

  /**
   * Carregar templates salvos
   */
  async loadInteractiveTemplates(instanceKey: string): Promise<InteractiveResult> {
    try {
      console.log('📂 Carregando templates interativos:', { instanceKey });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await this.supabase
        .from('whatsapp_interactive_templates')
        .select('*')
        .eq('user_id', user.id)
        .eq('instance_key', instanceKey)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Templates interativos carregados');
      return {
        success: true,
        message: 'Templates carregados com sucesso',
        data: data || []
      };
    } catch (error: any) {
      console.error('❌ Erro ao carregar templates:', error);
      return {
        success: false,
        message: error.message || 'Erro ao carregar templates'
      };
    }
  }

  /**
   * Deletar template
   */
  async deleteInteractiveTemplate(templateId: string): Promise<InteractiveResult> {
    try {
      console.log('🗑️ Deletando template:', { templateId });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await this.supabase
        .from('whatsapp_interactive_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Template deletado');
      return {
        success: true,
        message: 'Template deletado com sucesso'
      };
    } catch (error: any) {
      console.error('❌ Erro ao deletar template:', error);
      return {
        success: false,
        message: error.message || 'Erro ao deletar template'
      };
    }
  }
}

export const whatsappInteractiveMessagesService = new WhatsAppInteractiveMessagesService();
