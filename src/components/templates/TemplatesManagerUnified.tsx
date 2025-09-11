'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Search, 
  Filter,
  MessageSquare,
  Tag,
  Globe,
  CheckCircle,
  Clock,
  XCircle,
  Zap,
  Bot,
  Bell,
  FileText,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';

interface MessageTemplate {
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

interface TemplateFormData {
  name: string;
  content: string;
  category: string;
  shortcut: string;
  language: string;
  status: 'active' | 'inactive';
  template_type: 'quick_message' | 'campaign' | 'automation' | 'notification';
}

const TEMPLATE_TYPES = [
  { 
    value: 'quick_message', 
    label: 'Mensagens Rápidas', 
    description: 'Templates para uso em conversas individuais',
    icon: MessageSquare,
    color: 'text-blue-600'
  },
  { 
    value: 'campaign', 
    label: 'Disparos em Massa', 
    description: 'Templates para campanhas de marketing',
    icon: Zap,
    color: 'text-green-600'
  },
  { 
    value: 'automation', 
    label: 'Automações', 
    description: 'Templates para fluxos automatizados',
    icon: Bot,
    color: 'text-purple-600'
  },
  { 
    value: 'notification', 
    label: 'Notificações', 
    description: 'Templates para alertas e lembretes',
    icon: Bell,
    color: 'text-orange-600'
  }
];

const CATEGORIES = [
  { value: 'atendimento', label: 'Atendimento' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'utility', label: 'Utilitário' },
  { value: 'authentication', label: 'Autenticação' },
  { value: 'promocao', label: 'Promoção' },
  { value: 'lembrete', label: 'Lembrete' },
  { value: 'vendas', label: 'Vendas' },
  { value: 'suporte', label: 'Suporte' }
];

const LANGUAGES = [
  { value: 'pt_BR', label: 'Português (Brasil)' },
  { value: 'en_US', label: 'English (US)' },
  { value: 'es_ES', label: 'Español' }
];

export default function TemplatesManagerUnified() {
  const { supabase, user } = useAuth();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('quick_message');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    content: '',
    category: 'atendimento',
    shortcut: '',
    language: 'pt_BR',
    status: 'active',
    template_type: 'quick_message'
  });

  // Carregar templates
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    if (!supabase || !user) return;
    
    try {
      setLoading(true);
      
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
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTemplates(data || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;

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

      const templateData = {
        ...formData,
        organization_id: userData.organization_id,
        updated_at: new Date().toISOString()
      };

      if (editingTemplate) {
        // Atualizar template existente
        const { error } = await supabase
          .from('message_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Template atualizado com sucesso!');
      } else {
        // Criar novo template
        const { error } = await supabase
          .from('message_templates')
          .insert([{
            ...templateData,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;
        toast.success('Template criado com sucesso!');
      }

      setShowForm(false);
      setEditingTemplate(null);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error('Erro ao salvar template');
    }
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      category: template.category,
      shortcut: template.shortcut,
      language: template.language,
      status: template.status,
      template_type: template.template_type
    });
    setShowForm(true);
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      
      toast.success('Template excluído com sucesso!');
      fetchTemplates();
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast.error('Erro ao excluir template');
    }
  };

  const handleCopy = (template: MessageTemplate) => {
    setFormData({
      name: `${template.name} (Cópia)`,
      content: template.content,
      category: template.category,
      shortcut: `${template.shortcut}_copy`,
      language: template.language,
      status: 'active',
      template_type: template.template_type
    });
    setEditingTemplate(null);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      content: '',
      category: 'atendimento',
      shortcut: '',
      language: 'pt_BR',
      status: 'active',
      template_type: activeTab as any
    });
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    resetForm();
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTemplate(null);
    resetForm();
  };

  // Filtrar templates por tipo e outros filtros
  const getFilteredTemplates = (templateType: string) => {
    return templates.filter(template => {
      const matchesType = template.template_type === templateType;
      const matchesSearch = !searchTerm || 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.shortcut.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || template.status === statusFilter;
      
      return matchesType && matchesSearch && matchesCategory && matchesStatus;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'inactive':
        return 'Inativo';
      default:
        return 'Pendente';
    }
  };

  const getTemplateTypeInfo = (type: string) => {
    return TEMPLATE_TYPES.find(t => t.value === type) || TEMPLATE_TYPES[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Templates</h1>
          <p className="text-gray-600">Crie e gerencie templates para diferentes tipos de mensagens</p>
        </div>
        <Button onClick={handleNewTemplate} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {CATEGORIES.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Formulário */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingTemplate ? 'Editar Template' : 'Novo Template'}
            </CardTitle>
            <CardDescription>
              {editingTemplate ? 'Atualize as informações do template' : 'Crie um novo template personalizado'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Template</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Boas-vindas"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shortcut">Comando (shortcut)</Label>
                  <Input
                    id="shortcut"
                    value={formData.shortcut}
                    onChange={(e) => setFormData(prev => ({ ...prev, shortcut: e.target.value.toLowerCase() }))}
                    placeholder="Ex: boasvindas"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use este comando digitando /{formData.shortcut} nas conversas
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="content">Conteúdo da Mensagem</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Digite o conteúdo da mensagem..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="template_type">Tipo de Template</Label>
                  <Select value={formData.template_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, template_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Idioma</Label>
                  <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(language => (
                        <SelectItem key={language.value} value={language.value}>
                          {language.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  {editingTemplate ? 'Atualizar' : 'Criar'} Template
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabs de Tipos de Templates */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          {TEMPLATE_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <TabsTrigger key={type.value} value={type.value} className="flex items-center space-x-2">
                <Icon className={`w-4 h-4 ${type.color}`} />
                <span className="hidden sm:inline">{type.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {TEMPLATE_TYPES.map((type) => {
          const filteredTemplates = getFilteredTemplates(type.value);
          const typeInfo = getTemplateTypeInfo(type.value);
          const Icon = typeInfo.icon;

          return (
            <TabsContent key={type.value} value={type.value} className="space-y-4">
              {/* Header do Tipo */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-6 h-6 ${typeInfo.color}`} />
                    <div>
                      <h3 className="text-lg font-semibold">{typeInfo.label}</h3>
                      <p className="text-sm text-gray-600">{typeInfo.description}</p>
                    </div>
                    <div className="ml-auto">
                      <Badge variant="secondary">
                        {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Templates */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' 
                        ? 'Nenhum template encontrado' 
                        : `Nenhum template de ${typeInfo.label.toLowerCase()} criado ainda`}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                        ? 'Tente ajustar os filtros de busca'
                        : `Crie seu primeiro template para ${typeInfo.label.toLowerCase()}`}
                    </p>
                    {!searchTerm && categoryFilter === 'all' && statusFilter === 'all' && (
                      <Button onClick={handleNewTemplate} className="bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Primeiro Template
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredTemplates.map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                <Tag className="w-3 h-3 mr-1" />
                                {CATEGORIES.find(c => c.value === template.category)?.label || template.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <Globe className="w-3 h-3 mr-1" />
                                {template.language}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(template.status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                          {template.content}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Comando:</span> /{template.shortcut}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(template)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopy(template)}
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(template.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
