// Serviço para gerenciar chats WhatsApp via Mega API
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface ChatAction {
  chatId: string;
  action: 'archive' | 'unarchive' | 'pin' | 'unpin' | 'mute' | 'unmute' | 'block' | 'unblock' | 'read' | 'unread' | 'delete' | 'clear' | 'star';
  value?: any;
}

export interface ChatManagementResult {
  success: boolean;
  message: string;
  data?: any;
}

class WhatsAppChatManagementService {
  private supabase = createClientComponentClient();

  /**
   * Obter todos os chats
   */
  async getChats(instanceKey: string): Promise<ChatManagementResult> {
    try {
      console.log('💬 Obtendo chats:', { instanceKey });

      const response = await fetch('/api/mega/get-chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao obter chats');
      }

      console.log('✅ Chats obtidos com sucesso');
      return {
        success: true,
        message: 'Chats obtidos com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao obter chats:', error);
      return {
        success: false,
        message: error.message || 'Erro ao obter chats'
      };
    }
  }

  /**
   * Arquivar/Desarquivar chat
   */
  async archiveChat(instanceKey: string, chatId: string, archive: boolean = true): Promise<ChatManagementResult> {
    try {
      console.log('📁 Arquivando/Desarquivando chat:', { instanceKey, chatId, archive });

      const response = await fetch('/api/mega/archive-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          chatId,
          archive
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao arquivar chat');
      }

      console.log('✅ Chat arquivado/desarquivado com sucesso');
      return {
        success: true,
        message: archive ? 'Chat arquivado com sucesso' : 'Chat desarquivado com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao arquivar chat:', error);
      return {
        success: false,
        message: error.message || 'Erro ao arquivar chat'
      };
    }
  }

  /**
   * Fixar/Desfixar chat
   */
  async pinChat(instanceKey: string, chatId: string, pin: boolean = true): Promise<ChatManagementResult> {
    try {
      console.log('📌 Fixando/Desfixando chat:', { instanceKey, chatId, pin });

      const response = await fetch('/api/mega/pin-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          chatId,
          pin
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao fixar chat');
      }

      console.log('✅ Chat fixado/desfixado com sucesso');
      return {
        success: true,
        message: pin ? 'Chat fixado com sucesso' : 'Chat desfixado com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao fixar chat:', error);
      return {
        success: false,
        message: error.message || 'Erro ao fixar chat'
      };
    }
  }

  /**
   * Silenciar/Desilenciar chat
   */
  async muteChat(instanceKey: string, chatId: string, mute: boolean = true, time?: number): Promise<ChatManagementResult> {
    try {
      console.log('🔇 Silenciando/Desilenciando chat:', { instanceKey, chatId, mute, time });

      const response = await fetch('/api/mega/mute-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          chatId,
          mute,
          time
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao silenciar chat');
      }

      console.log('✅ Chat silenciado/desilenciado com sucesso');
      return {
        success: true,
        message: mute ? 'Chat silenciado com sucesso' : 'Chat desilenciado com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao silenciar chat:', error);
      return {
        success: false,
        message: error.message || 'Erro ao silenciar chat'
      };
    }
  }

  /**
   * Bloquear/Desbloquear chat
   */
  async blockChat(instanceKey: string, chatId: string, block: boolean = true): Promise<ChatManagementResult> {
    try {
      console.log('🚫 Bloqueando/Desbloqueando chat:', { instanceKey, chatId, block });

      const response = await fetch('/api/mega/block-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          chatId,
          block
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao bloquear chat');
      }

      console.log('✅ Chat bloqueado/desbloqueado com sucesso');
      return {
        success: true,
        message: block ? 'Chat bloqueado com sucesso' : 'Chat desbloqueado com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao bloquear chat:', error);
      return {
        success: false,
        message: error.message || 'Erro ao bloquear chat'
      };
    }
  }

  /**
   * Marcar chat como lido/não lido
   */
  async readChat(instanceKey: string, chatId: string, read: boolean = true): Promise<ChatManagementResult> {
    try {
      console.log('👁️ Marcando chat como lido/não lido:', { instanceKey, chatId, read });

      const response = await fetch('/api/mega/read-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          chatId,
          read
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao marcar chat como lido');
      }

      console.log('✅ Chat marcado como lido/não lido com sucesso');
      return {
        success: true,
        message: read ? 'Chat marcado como lido' : 'Chat marcado como não lido',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao marcar chat como lido:', error);
      return {
        success: false,
        message: error.message || 'Erro ao marcar chat como lido'
      };
    }
  }

  /**
   * Deletar chat
   */
  async deleteChat(instanceKey: string, chatId: string): Promise<ChatManagementResult> {
    try {
      console.log('🗑️ Deletando chat:', { instanceKey, chatId });

      const response = await fetch('/api/mega/delete-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          chatId
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao deletar chat');
      }

      console.log('✅ Chat deletado com sucesso');
      return {
        success: true,
        message: 'Chat deletado com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao deletar chat:', error);
      return {
        success: false,
        message: error.message || 'Erro ao deletar chat'
      };
    }
  }

  /**
   * Limpar chat (deletar todas as mensagens)
   */
  async clearChat(instanceKey: string, chatId: string): Promise<ChatManagementResult> {
    try {
      console.log('🧹 Limpando chat:', { instanceKey, chatId });

      const response = await fetch('/api/mega/clear-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          chatId
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao limpar chat');
      }

      console.log('✅ Chat limpo com sucesso');
      return {
        success: true,
        message: 'Chat limpo com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao limpar chat:', error);
      return {
        success: false,
        message: error.message || 'Erro ao limpar chat'
      };
    }
  }

  /**
   * Deletar mensagem específica
   */
  async deleteMessage(instanceKey: string, chatId: string, messageId: string): Promise<ChatManagementResult> {
    try {
      console.log('🗑️ Deletando mensagem:', { instanceKey, chatId, messageId });

      const response = await fetch('/api/mega/delete-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          chatId,
          messageId
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao deletar mensagem');
      }

      console.log('✅ Mensagem deletada com sucesso');
      return {
        success: true,
        message: 'Mensagem deletada com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao deletar mensagem:', error);
      return {
        success: false,
        message: error.message || 'Erro ao deletar mensagem'
      };
    }
  }

  /**
   * Favoritar mensagem
   */
  async starMessage(instanceKey: string, chatId: string, messageId: string, star: boolean = true): Promise<ChatManagementResult> {
    try {
      console.log('⭐ Favoritando/Desfavoritando mensagem:', { instanceKey, chatId, messageId, star });

      const response = await fetch('/api/mega/star-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          chatId,
          messageId,
          star
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao favoritar mensagem');
      }

      console.log('✅ Mensagem favoritada/desfavoritada com sucesso');
      return {
        success: true,
        message: star ? 'Mensagem favoritada com sucesso' : 'Mensagem desfavoritada com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao favoritar mensagem:', error);
      return {
        success: false,
        message: error.message || 'Erro ao favoritar mensagem'
      };
    }
  }

  /**
   * Executar ação em lote
   */
  async executeBatchActions(instanceKey: string, actions: ChatAction[]): Promise<ChatManagementResult> {
    try {
      console.log('🔄 Executando ações em lote:', { instanceKey, actionsCount: actions.length });

      const results = [];
      const errors = [];

      for (const action of actions) {
        try {
          let result;
          switch (action.action) {
            case 'archive':
              result = await this.archiveChat(instanceKey, action.chatId, true);
              break;
            case 'unarchive':
              result = await this.archiveChat(instanceKey, action.chatId, false);
              break;
            case 'pin':
              result = await this.pinChat(instanceKey, action.chatId, true);
              break;
            case 'unpin':
              result = await this.pinChat(instanceKey, action.chatId, false);
              break;
            case 'mute':
              result = await this.muteChat(instanceKey, action.chatId, true, action.value);
              break;
            case 'unmute':
              result = await this.muteChat(instanceKey, action.chatId, false);
              break;
            case 'block':
              result = await this.blockChat(instanceKey, action.chatId, true);
              break;
            case 'unblock':
              result = await this.blockChat(instanceKey, action.chatId, false);
              break;
            case 'read':
              result = await this.readChat(instanceKey, action.chatId, true);
              break;
            case 'unread':
              result = await this.readChat(instanceKey, action.chatId, false);
              break;
            case 'delete':
              result = await this.deleteChat(instanceKey, action.chatId);
              break;
            case 'clear':
              result = await this.clearChat(instanceKey, action.chatId);
              break;
            default:
              throw new Error(`Ação não suportada: ${action.action}`);
          }
          
          results.push({ action: action.action, chatId: action.chatId, result });
        } catch (error: any) {
          errors.push({ action: action.action, chatId: action.chatId, error: error.message });
        }
      }

      console.log('✅ Ações em lote executadas:', { success: results.length, errors: errors.length });
      return {
        success: errors.length === 0,
        message: `${results.length} ações executadas com sucesso${errors.length > 0 ? `, ${errors.length} falharam` : ''}`,
        data: { results, errors }
      };
    } catch (error: any) {
      console.error('❌ Erro ao executar ações em lote:', error);
      return {
        success: false,
        message: error.message || 'Erro ao executar ações em lote'
      };
    }
  }
}

export const whatsappChatManagementService = new WhatsAppChatManagementService();
