// Serviço para gerenciar etiquetas WhatsApp via Mega API
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface LabelAssociation {
  chatId: string;
  labelId: string;
}

export interface LabelsResult {
  success: boolean;
  message: string;
  data?: any;
}

class WhatsAppLabelsService {
  private supabase = createClientComponentClient();

  /**
   * Sincronizar todas as etiquetas e associações
   */
  async syncLabels(instanceKey: string): Promise<LabelsResult> {
    try {
      console.log('🔄 Sincronizando etiquetas:', { instanceKey });

      const response = await fetch('/api/mega/sync-labels', {
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
        throw new Error(result.error || 'Erro ao sincronizar etiquetas');
      }

      console.log('✅ Etiquetas sincronizadas com sucesso');
      return {
        success: true,
        message: 'Etiquetas sincronizadas com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao sincronizar etiquetas:', error);
      return {
        success: false,
        message: error.message || 'Erro ao sincronizar etiquetas'
      };
    }
  }

  /**
   * Obter todas as etiquetas
   */
  async getLabels(instanceKey: string): Promise<LabelsResult> {
    try {
      console.log('🏷️ Obtendo etiquetas:', { instanceKey });

      const response = await fetch('/api/mega/get-labels', {
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
        throw new Error(result.error || 'Erro ao obter etiquetas');
      }

      console.log('✅ Etiquetas obtidas com sucesso');
      return {
        success: true,
        message: 'Etiquetas obtidas com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao obter etiquetas:', error);
      return {
        success: false,
        message: error.message || 'Erro ao obter etiquetas'
      };
    }
  }

  /**
   * Obter associações de etiquetas
   */
  async getLabelAssociations(instanceKey: string): Promise<LabelsResult> {
    try {
      console.log('🔗 Obtendo associações de etiquetas:', { instanceKey });

      const response = await fetch('/api/mega/get-label-associations', {
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
        throw new Error(result.error || 'Erro ao obter associações');
      }

      console.log('✅ Associações obtidas com sucesso');
      return {
        success: true,
        message: 'Associações obtidas com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao obter associações:', error);
      return {
        success: false,
        message: error.message || 'Erro ao obter associações'
      };
    }
  }

  /**
   * Criar nova etiqueta
   */
  async createLabel(instanceKey: string, name: string, color?: string): Promise<LabelsResult> {
    try {
      console.log('➕ Criando etiqueta:', { instanceKey, name, color });

      const response = await fetch('/api/mega/create-label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          name,
          color
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar etiqueta');
      }

      console.log('✅ Etiqueta criada com sucesso');
      return {
        success: true,
        message: 'Etiqueta criada com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao criar etiqueta:', error);
      return {
        success: false,
        message: error.message || 'Erro ao criar etiqueta'
      };
    }
  }

  /**
   * Editar/Deletar etiqueta
   */
  async editLabel(instanceKey: string, labelId: string, name?: string, color?: string, deleteLabel: boolean = false): Promise<LabelsResult> {
    try {
      console.log('✏️ Editando etiqueta:', { instanceKey, labelId, name, color, deleteLabel });

      const response = await fetch('/api/mega/edit-label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          labelId,
          name,
          color,
          delete: deleteLabel
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao editar etiqueta');
      }

      console.log('✅ Etiqueta editada com sucesso');
      return {
        success: true,
        message: deleteLabel ? 'Etiqueta deletada com sucesso' : 'Etiqueta editada com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao editar etiqueta:', error);
      return {
        success: false,
        message: error.message || 'Erro ao editar etiqueta'
      };
    }
  }

  /**
   * Obter etiquetas de um chat específico
   */
  async getChatLabels(instanceKey: string, chatId: string): Promise<LabelsResult> {
    try {
      console.log('🏷️ Obtendo etiquetas do chat:', { instanceKey, chatId });

      const response = await fetch('/api/mega/get-chat-labels', {
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
        throw new Error(result.error || 'Erro ao obter etiquetas do chat');
      }

      console.log('✅ Etiquetas do chat obtidas com sucesso');
      return {
        success: true,
        message: 'Etiquetas do chat obtidas com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao obter etiquetas do chat:', error);
      return {
        success: false,
        message: error.message || 'Erro ao obter etiquetas do chat'
      };
    }
  }

  /**
   * Definir etiquetas de um chat
   */
  async setChatLabels(instanceKey: string, chatId: string, labelIds: string[]): Promise<LabelsResult> {
    try {
      console.log('🏷️ Definindo etiquetas do chat:', { instanceKey, chatId, labelIds });

      const response = await fetch('/api/mega/set-chat-labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          chatId,
          labelIds
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao definir etiquetas do chat');
      }

      console.log('✅ Etiquetas do chat definidas com sucesso');
      return {
        success: true,
        message: 'Etiquetas do chat definidas com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao definir etiquetas do chat:', error);
      return {
        success: false,
        message: error.message || 'Erro ao definir etiquetas do chat'
      };
    }
  }

  /**
   * Salvar etiquetas no banco local
   */
  async saveLabels(instanceKey: string, labels: Label[]): Promise<LabelsResult> {
    try {
      console.log('💾 Salvando etiquetas:', { instanceKey, labelsCount: labels.length });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Deletar etiquetas existentes para esta instância
      await this.supabase
        .from('whatsapp_labels')
        .delete()
        .eq('user_id', user.id)
        .eq('instance_key', instanceKey);

      // Inserir novas etiquetas
      if (labels.length > 0) {
        const labelsToInsert = labels.map(label => ({
          user_id: user.id,
          instance_key: instanceKey,
          label_id: label.id,
          name: label.name,
          color: label.color,
          description: label.description
        }));

        const { error } = await this.supabase
          .from('whatsapp_labels')
          .insert(labelsToInsert);

        if (error) {
          throw new Error(error.message);
        }
      }

      console.log('✅ Etiquetas salvas com sucesso');
      return {
        success: true,
        message: 'Etiquetas salvas com sucesso'
      };
    } catch (error: any) {
      console.error('❌ Erro ao salvar etiquetas:', error);
      return {
        success: false,
        message: error.message || 'Erro ao salvar etiquetas'
      };
    }
  }

  /**
   * Carregar etiquetas do banco local
   */
  async loadLabels(instanceKey: string): Promise<LabelsResult> {
    try {
      console.log('📂 Carregando etiquetas:', { instanceKey });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await this.supabase
        .from('whatsapp_labels')
        .select('*')
        .eq('user_id', user.id)
        .eq('instance_key', instanceKey)
        .order('name');

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Etiquetas carregadas com sucesso');
      return {
        success: true,
        message: 'Etiquetas carregadas com sucesso',
        data: data || []
      };
    } catch (error: any) {
      console.error('❌ Erro ao carregar etiquetas:', error);
      return {
        success: false,
        message: error.message || 'Erro ao carregar etiquetas'
      };
    }
  }

  /**
   * Salvar associações de etiquetas no banco local
   */
  async saveLabelAssociations(instanceKey: string, associations: LabelAssociation[]): Promise<LabelsResult> {
    try {
      console.log('💾 Salvando associações:', { instanceKey, associationsCount: associations.length });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Deletar associações existentes para esta instância
      await this.supabase
        .from('whatsapp_label_associations')
        .delete()
        .eq('user_id', user.id)
        .eq('instance_key', instanceKey);

      // Inserir novas associações
      if (associations.length > 0) {
        const associationsToInsert = associations.map(assoc => ({
          user_id: user.id,
          instance_key: instanceKey,
          chat_id: assoc.chatId,
          label_id: assoc.labelId
        }));

        const { error } = await this.supabase
          .from('whatsapp_label_associations')
          .insert(associationsToInsert);

        if (error) {
          throw new Error(error.message);
        }
      }

      console.log('✅ Associações salvas com sucesso');
      return {
        success: true,
        message: 'Associações salvas com sucesso'
      };
    } catch (error: any) {
      console.error('❌ Erro ao salvar associações:', error);
      return {
        success: false,
        message: error.message || 'Erro ao salvar associações'
      };
    }
  }

  /**
   * Carregar associações de etiquetas do banco local
   */
  async loadLabelAssociations(instanceKey: string): Promise<LabelsResult> {
    try {
      console.log('📂 Carregando associações:', { instanceKey });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await this.supabase
        .from('whatsapp_label_associations')
        .select('*')
        .eq('user_id', user.id)
        .eq('instance_key', instanceKey);

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Associações carregadas com sucesso');
      return {
        success: true,
        message: 'Associações carregadas com sucesso',
        data: data || []
      };
    } catch (error: any) {
      console.error('❌ Erro ao carregar associações:', error);
      return {
        success: false,
        message: error.message || 'Erro ao carregar associações'
      };
    }
  }
}

export const whatsappLabelsService = new WhatsAppLabelsService();
