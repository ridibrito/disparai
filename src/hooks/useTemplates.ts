import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  shortcut: string;
  language: string;
  status: 'active' | 'inactive';
  template_type: 'quick_message' | 'campaign' | 'automation' | 'notification';
  created_at: string;
  updated_at: string;
  organization_id: string;
}

export function useTemplates() {
  const { supabase, user } = useAuth();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    if (!supabase || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Buscar organization_id do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('Erro ao buscar dados do usuário');
      }

      // Buscar templates da organização
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('organization_id', userData.organization_id)
        .eq('status', 'active') // Apenas templates ativos
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      setTemplates(data || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      setError('Erro ao carregar templates');
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (templateData: Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at' | 'organization_id'>) => {
    if (!supabase || !user) return null;

    try {
      // Buscar organization_id do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('Erro ao buscar dados do usuário');
      }

      const { data, error } = await supabase
        .from('message_templates')
        .insert([{
          ...templateData,
          organization_id: userData.organization_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      setTemplates(prev => [data, ...prev]);
      toast.success('Template criado com sucesso!');
      return data;
    } catch (error) {
      console.error('Erro ao criar template:', error);
      toast.error('Erro ao criar template');
      return null;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<MessageTemplate>) => {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('message_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTemplates(prev => prev.map(template => 
        template.id === id ? data : template
      ));
      toast.success('Template atualizado com sucesso!');
      return data;
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      toast.error('Erro ao atualizar template');
      return null;
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTemplates(prev => prev.filter(template => template.id !== id));
      toast.success('Template excluído com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast.error('Erro ao excluir template');
      return false;
    }
  };

  const getTemplateByShortcut = (shortcut: string): MessageTemplate | undefined => {
    return templates.find(template => 
      template.shortcut.toLowerCase() === shortcut.toLowerCase() && 
      template.status === 'active'
    );
  };

  const searchTemplates = (query: string): MessageTemplate[] => {
    if (!query.trim()) return templates;
    
    const lowercaseQuery = query.toLowerCase();
    return templates.filter(template =>
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.content.toLowerCase().includes(lowercaseQuery) ||
      template.shortcut.toLowerCase().includes(lowercaseQuery) ||
      template.category.toLowerCase().includes(lowercaseQuery)
    );
  };

  const getQuickMessageTemplates = (): MessageTemplate[] => {
    return templates.filter(template => template.template_type === 'quick_message');
  };

  const getCampaignTemplates = (): MessageTemplate[] => {
    return templates.filter(template => template.template_type === 'campaign');
  };

  const getAutomationTemplates = (): MessageTemplate[] => {
    return templates.filter(template => template.template_type === 'automation');
  };

  const getNotificationTemplates = (): MessageTemplate[] => {
    return templates.filter(template => template.template_type === 'notification');
  };

  useEffect(() => {
    fetchTemplates();
  }, [supabase, user]);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplateByShortcut,
    searchTemplates,
    getQuickMessageTemplates,
    getCampaignTemplates,
    getAutomationTemplates,
    getNotificationTemplates
  };
}
