// Serviço para automação e workflows WhatsApp via Mega API
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface WorkflowRule {
  id: string;
  name: string;
  trigger: 'message_received' | 'message_sent' | 'status_changed' | 'time_based';
  conditions: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex';
    value: string;
  }>;
  actions: Array<{
    type: 'send_message' | 'forward_message' | 'edit_message' | 'react_message' | 'delay' | 'add_label' | 'remove_label';
    config: any;
  }>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationResult {
  success: boolean;
  message: string;
  data?: any;
}

class WhatsAppAutomationService {
  private supabase = createClientComponentClient();

  /**
   * Criar workflow de automação
   */
  async createWorkflow(instanceKey: string, workflow: Omit<WorkflowRule, 'id' | 'created_at' | 'updated_at'>): Promise<AutomationResult> {
    try {
      console.log('🤖 Criando workflow:', { instanceKey, workflow });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await this.supabase
        .from('whatsapp_automation_workflows')
        .insert({
          user_id: user.id,
          instance_key: instanceKey,
          name: workflow.name,
          trigger: workflow.trigger,
          conditions: workflow.conditions,
          actions: workflow.actions,
          enabled: workflow.enabled
        });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Workflow criado');
      return {
        success: true,
        message: 'Workflow criado com sucesso'
      };
    } catch (error: any) {
      console.error('❌ Erro ao criar workflow:', error);
      return {
        success: false,
        message: error.message || 'Erro ao criar workflow'
      };
    }
  }

  /**
   * Listar workflows
   */
  async listWorkflows(instanceKey: string): Promise<AutomationResult> {
    try {
      console.log('📋 Listando workflows:', { instanceKey });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await this.supabase
        .from('whatsapp_automation_workflows')
        .select('*')
        .eq('user_id', user.id)
        .eq('instance_key', instanceKey)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Workflows listados');
      return {
        success: true,
        message: 'Workflows listados com sucesso',
        data: data || []
      };
    } catch (error: any) {
      console.error('❌ Erro ao listar workflows:', error);
      return {
        success: false,
        message: error.message || 'Erro ao listar workflows'
      };
    }
  }

  /**
   * Atualizar workflow
   */
  async updateWorkflow(workflowId: string, updates: Partial<WorkflowRule>): Promise<AutomationResult> {
    try {
      console.log('✏️ Atualizando workflow:', { workflowId, updates });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await this.supabase
        .from('whatsapp_automation_workflows')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Workflow atualizado');
      return {
        success: true,
        message: 'Workflow atualizado com sucesso'
      };
    } catch (error: any) {
      console.error('❌ Erro ao atualizar workflow:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar workflow'
      };
    }
  }

  /**
   * Deletar workflow
   */
  async deleteWorkflow(workflowId: string): Promise<AutomationResult> {
    try {
      console.log('🗑️ Deletando workflow:', { workflowId });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await this.supabase
        .from('whatsapp_automation_workflows')
        .delete()
        .eq('id', workflowId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Workflow deletado');
      return {
        success: true,
        message: 'Workflow deletado com sucesso'
      };
    } catch (error: any) {
      console.error('❌ Erro ao deletar workflow:', error);
      return {
        success: false,
        message: error.message || 'Erro ao deletar workflow'
      };
    }
  }

  /**
   * Ativar/desativar workflow
   */
  async toggleWorkflow(workflowId: string, enabled: boolean): Promise<AutomationResult> {
    try {
      console.log('🔄 Alternando workflow:', { workflowId, enabled });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await this.supabase
        .from('whatsapp_automation_workflows')
        .update({
          enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Workflow alternado');
      return {
        success: true,
        message: `Workflow ${enabled ? 'ativado' : 'desativado'} com sucesso`
      };
    } catch (error: any) {
      console.error('❌ Erro ao alternar workflow:', error);
      return {
        success: false,
        message: error.message || 'Erro ao alternar workflow'
      };
    }
  }

  /**
   * Executar workflow manualmente
   */
  async executeWorkflow(instanceKey: string, workflowId: string, context: any): Promise<AutomationResult> {
    try {
      console.log('▶️ Executando workflow:', { instanceKey, workflowId, context });

      const response = await fetch('/api/mega/execute-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey,
          workflowId,
          context
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao executar workflow');
      }

      console.log('✅ Workflow executado');
      return {
        success: true,
        message: 'Workflow executado com sucesso',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erro ao executar workflow:', error);
      return {
        success: false,
        message: error.message || 'Erro ao executar workflow'
      };
    }
  }

  /**
   * Obter estatísticas de workflows
   */
  async getWorkflowStats(instanceKey: string): Promise<AutomationResult> {
    try {
      console.log('📊 Obtendo estatísticas de workflows:', { instanceKey });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await this.supabase
        .from('whatsapp_automation_workflows')
        .select('*')
        .eq('user_id', user.id)
        .eq('instance_key', instanceKey);

      if (error) {
        throw new Error(error.message);
      }

      const stats = {
        total: data?.length || 0,
        enabled: data?.filter(w => w.enabled).length || 0,
        disabled: data?.filter(w => !w.enabled).length || 0,
        byTrigger: data?.reduce((acc, w) => {
          acc[w.trigger] = (acc[w.trigger] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {}
      };

      console.log('✅ Estatísticas obtidas');
      return {
        success: true,
        message: 'Estatísticas obtidas com sucesso',
        data: stats
      };
    } catch (error: any) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return {
        success: false,
        message: error.message || 'Erro ao obter estatísticas'
      };
    }
  }

  /**
   * Salvar template de workflow
   */
  async saveWorkflowTemplate(instanceKey: string, template: any): Promise<AutomationResult> {
    try {
      console.log('💾 Salvando template de workflow:', { instanceKey, template });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await this.supabase
        .from('whatsapp_automation_templates')
        .upsert({
          user_id: user.id,
          instance_key: instanceKey,
          template_name: template.name,
          template_data: template.data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Template de workflow salvo');
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
   * Carregar templates de workflow
   */
  async loadWorkflowTemplates(instanceKey: string): Promise<AutomationResult> {
    try {
      console.log('📂 Carregando templates de workflow:', { instanceKey });

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await this.supabase
        .from('whatsapp_automation_templates')
        .select('*')
        .eq('user_id', user.id)
        .eq('instance_key', instanceKey)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Templates de workflow carregados');
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
}

export const whatsappAutomationService = new WhatsAppAutomationService();
