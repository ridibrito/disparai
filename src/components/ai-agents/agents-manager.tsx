'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WhatsAppLoading } from '@/components/ui/whatsapp-loading';
import { createClientComponentClient } from '@/lib/supabase';
import { AIAgent, AgentType, AGENT_TYPES, DEFAULT_AGENT_PROMPTS } from '@/types/ai-agents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Bot, Settings, Activity, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import PromptAssistant from './prompt-assistant';
import AdvancedAgentCreator from './advanced-agent-creator';

export default function AgentsManager() {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<AIAgent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPromptAssistant, setShowPromptAssistant] = useState(false);
  const [showAdvancedCreator, setShowAdvancedCreator] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'sdr' as AgentType,
    description: '',
    system_prompt: '',
    max_tokens: 1000,
    temperature: 0.7,
    is_active: true
  });

  useEffect(() => {
    if (user) {
      loadAgents();
    }
  }, [user]);

  const loadAgents = async () => {
    try {
      console.log('🔄 Carregando agentes...');
      console.log('👤 Usuário atual:', user);
      
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Resultado da query:', { data, error });

      if (error) throw error;
      setAgents(data || []);
      console.log('✅ Agentes carregados:', data?.length || 0);
    } catch (error) {
      console.error('❌ Erro ao carregar agentes:', error);
      toast.error('Erro ao carregar agentes', {
        description: 'Não foi possível carregar a lista de agentes. Recarregue a página.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Iniciando criação de agente...');
    console.log('📝 Dados do formulário:', formData);
    console.log('👤 Usuário:', user);
    
    try {
      if (editingAgent) {
        // Atualizar agente existente
        const { error } = await supabase
          .from('ai_agents')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAgent.id);

        if (error) throw error;
        toast.success('Agente atualizado com sucesso!', {
          description: `O agente "${formData.name}" foi atualizado com as novas configurações.`
        });
      } else {
        // Criar novo agente
        console.log('🆕 Criando novo agente...');
        console.log('🏢 Organization ID:', user?.organization_id);
        
        // Buscar organization_id do usuário
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('❌ Erro ao buscar organization_id:', userError);
          throw new Error('Não foi possível identificar a organização do usuário');
        }

        let organizationId = userData?.organization_id || user.id; // Fallback para user.id
        
        // Se ainda não tiver organization_id, usar o user.id
        if (!organizationId) {
          console.log('⚠️ Usando user.id como organization_id');
          organizationId = user.id;
        }
        
        const insertData = {
          ...formData,
          organization_id: organizationId
        };
        
        console.log('💾 Dados para inserção:', insertData);
        console.log('🏢 Organization ID final:', organizationId);
        
        const { error } = await supabase
          .from('ai_agents')
          .insert(insertData);

        if (error) {
          console.error('❌ Erro na inserção:', error);
          throw error;
        }
        
        console.log('✅ Agente criado com sucesso!');
        console.log('🎉 Chamando toast de sucesso...');
        toast.success('Agente criado com sucesso!', {
          description: `O agente "${formData.name}" está pronto para responder automaticamente.`
        });
        console.log('🎉 Toast chamado!');
      }

      setShowForm(false);
      setEditingAgent(null);
      resetForm();
      loadAgents();
    } catch (error) {
      console.error('Erro ao salvar agente:', error);
      toast.error('Erro ao salvar agente', {
        description: 'Não foi possível salvar o agente. Verifique os dados e tente novamente.'
      });
    }
  };

  const handleEdit = (agent: AIAgent) => {
    // Redirecionar para página de edição
    window.location.href = `/configuracoes/agentes/editar/${agent.id}`;
  };

  const handleDeleteClick = (agent: AIAgent) => {
    setAgentToDelete(agent);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!agentToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', agentToDelete.id);

      if (error) throw error;
      
      toast.success('Agente excluído com sucesso!', {
        description: `O agente "${agentToDelete.name}" foi removido permanentemente.`
      });
      
      setShowDeleteModal(false);
      setAgentToDelete(null);
      loadAgents();
    } catch (error) {
      console.error('Erro ao excluir agente:', error);
      toast.error('Erro ao excluir agente', {
        description: 'Não foi possível excluir o agente. Tente novamente.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setAgentToDelete(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'sdr',
      description: '',
      system_prompt: '',
      max_tokens: 1000,
      temperature: 0.7,
      is_active: true
    });
  };

  const handleTypeChange = (type: AgentType) => {
    setFormData(prev => ({
      ...prev,
      type,
      system_prompt: DEFAULT_AGENT_PROMPTS[type]
    }));
  };

  const handlePromptGenerated = (prompt: string) => {
    setFormData(prev => ({
      ...prev,
      system_prompt: prompt
    }));
    setShowPromptAssistant(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <WhatsAppLoading 
          size="lg" 
          text="Carregando agentes..." 
        />
      </div>
    );
  }

  console.log('🎯 Renderizando AgentsManager - showForm:', showForm, 'agents:', agents.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agentes de IA</h1>
          <p className="text-gray-600">Configure agentes para responder automaticamente às mensagens</p>
        </div>
        <Link href="/configuracoes/agentes/novo">
          <Button className="bg-green-500 hover:bg-green-600">
            <Plus className="h-4 w-4 mr-2" />
            Novo Agente
          </Button>
        </Link>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingAgent ? 'Editar Agente' : 'Novo Agente'}
            </CardTitle>
            <CardDescription>
              Configure as características e comportamento do agente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Agente</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Agente SDR"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Tipo de Agente</Label>
                  <Select value={formData.type} onValueChange={handleTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(AGENT_TYPES).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span>{config.icon}</span>
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Breve descrição do agente"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="system_prompt">Prompt do Sistema</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPromptAssistant(true)}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Criar com IA
                  </Button>
                </div>
                <Textarea
                  id="system_prompt"
                  value={formData.system_prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
                  placeholder="Instruções para o comportamento do agente"
                  rows={8}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Este prompt define como o agente deve se comportar e responder. Use o assistente de IA para criar um prompt personalizado!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="max_tokens">Máximo de Tokens</Label>
                  <Input
                    id="max_tokens"
                    type="number"
                    value={formData.max_tokens}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
                    min="100"
                    max="4000"
                  />
                </div>
                
                <div>
                  <Label htmlFor="temperature">Temperatura</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    min="0"
                    max="2"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Ativo</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => console.log('🔘 Botão clicado!')}
                >
                  {editingAgent ? 'Atualizar' : 'Criar'} Agente
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAgent(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Card key={agent.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                </div>
                <Badge variant={agent.is_active ? "default" : "secondary"}>
                  {agent.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <CardDescription>
                {AGENT_TYPES[agent.type]?.description || 'Agente personalizado'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Settings className="h-4 w-4" />
                  <span>Tokens: {agent.max_tokens}</span>
                  <span>•</span>
                  <span>Temp: {agent.temperature}</span>
                </div>
                
                {agent.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {agent.description}
                  </p>
                )}
                
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(agent)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteClick(agent)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {agents.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum agente configurado
            </h3>
            <p className="text-gray-600 mb-4">
              Crie seu primeiro agente de IA para começar a automatizar respostas
            </p>
            <Link href="/configuracoes/agentes/novo">
              <Button className="bg-green-500 hover:bg-green-600">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Agente
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Esta ação é <strong>irreversível</strong> e removerá permanentemente o agente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Bot className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-800">
                    Agente: <span className="font-semibold">{agentToDelete?.name}</span>
                  </p>
                  <p className="text-sm text-red-700">
                    Tipo: <span className="font-medium">{AGENT_TYPES[agentToDelete?.type || 'sdr']?.label}</span>
                  </p>
                  <p className="text-sm text-red-700">
                    Tem certeza que deseja excluir este agente? Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={handleDeleteCancel}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Definitivamente
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal do Assistente de Prompts */}
      <Dialog open={showPromptAssistant} onOpenChange={setShowPromptAssistant}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <PromptAssistant
            onPromptGenerated={handlePromptGenerated}
            onClose={() => setShowPromptAssistant(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal do Criador Avançado */}
      {showAdvancedCreator && (
        <AdvancedAgentCreator
          onClose={() => setShowAdvancedCreator(false)}
          onSuccess={() => {
            setShowAdvancedCreator(false);
            loadAgents();
          }}
          editingAgent={editingAgent}
        />
      )}
    </div>
  );
}
