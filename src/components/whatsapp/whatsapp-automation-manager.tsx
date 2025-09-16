'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bot, 
  Plus, 
  Trash2, 
  Save, 
  Play, 
  Pause,
  Loader2,
  Settings,
  Clock,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  BarChart3
} from 'lucide-react';
import { whatsappAutomationService, type WorkflowRule } from '@/lib/whatsapp-automation';
import toast from 'react-hot-toast';

interface WhatsAppAutomationManagerProps {
  instanceKey: string;
  instanceName?: string;
}

export function WhatsAppAutomationManager({ instanceKey, instanceName }: WhatsAppAutomationManagerProps) {
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stats, setStats] = useState<any>(null);
  
  // Estados para criação de workflow
  const [newWorkflow, setNewWorkflow] = useState<Partial<WorkflowRule>>({
    name: '',
    trigger: 'message_received',
    conditions: [],
    actions: [],
    enabled: true
  });

  // Carregar workflows e estatísticas
  useEffect(() => {
    loadWorkflows();
    loadStats();
  }, [instanceKey]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const result = await whatsappAutomationService.listWorkflows(instanceKey);
      
      if (result.success && result.data) {
        setWorkflows(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await whatsappAutomationService.getWorkflowStats(instanceKey);
      
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const createWorkflow = async () => {
    try {
      setSaving(true);
      
      if (!newWorkflow.name) {
        toast.error('Nome do workflow é obrigatório');
        return;
      }

      const result = await whatsappAutomationService.createWorkflow(instanceKey, {
        name: newWorkflow.name,
        trigger: newWorkflow.trigger || 'message_received',
        conditions: newWorkflow.conditions || [],
        actions: newWorkflow.actions || [],
        enabled: newWorkflow.enabled || true
      });

      if (result.success) {
        toast.success('Workflow criado com sucesso!');
        setShowCreateForm(false);
        setNewWorkflow({
          name: '',
          trigger: 'message_received',
          conditions: [],
          actions: [],
          enabled: true
        });
        await loadWorkflows();
        await loadStats();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao criar workflow:', error);
      toast.error(error.message || 'Erro ao criar workflow');
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkflow = async (workflowId: string, enabled: boolean) => {
    try {
      const result = await whatsappAutomationService.toggleWorkflow(workflowId, enabled);
      
      if (result.success) {
        toast.success(result.message);
        await loadWorkflows();
        await loadStats();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao alternar workflow:', error);
      toast.error(error.message || 'Erro ao alternar workflow');
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    if (!confirm('Tem certeza que deseja deletar este workflow?')) {
      return;
    }

    try {
      const result = await whatsappAutomationService.deleteWorkflow(workflowId);
      
      if (result.success) {
        toast.success('Workflow deletado com sucesso!');
        await loadWorkflows();
        await loadStats();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao deletar workflow:', error);
      toast.error(error.message || 'Erro ao deletar workflow');
    }
  };

  const executeWorkflow = async (workflowId: string) => {
    try {
      const result = await whatsappAutomationService.executeWorkflow(instanceKey, workflowId, {
        manual: true,
        timestamp: new Date().toISOString()
      });
      
      if (result.success) {
        toast.success('Workflow executado com sucesso!');
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao executar workflow:', error);
      toast.error(error.message || 'Erro ao executar workflow');
    }
  };

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'message_received': return <MessageSquare className="h-4 w-4" />;
      case 'message_sent': return <MessageSquare className="h-4 w-4" />;
      case 'status_changed': return <AlertCircle className="h-4 w-4" />;
      case 'time_based': return <Clock className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case 'message_received': return 'Mensagem Recebida';
      case 'message_sent': return 'Mensagem Enviada';
      case 'status_changed': return 'Status Alterado';
      case 'time_based': return 'Baseado em Tempo';
      default: return trigger;
    }
  };

  if (loading && workflows.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Carregando workflows...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Estatísticas de Automação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.enabled}</div>
                <div className="text-sm text-gray-500">Ativos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.disabled}</div>
                <div className="text-sm text-gray-500">Inativos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Object.keys(stats.byTrigger).length}
                </div>
                <div className="text-sm text-gray-500">Tipos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Workflows de Automação
          </CardTitle>
          <CardDescription>
            Automatize respostas e ações baseadas em eventos
            {instanceName && (
              <Badge variant="secondary" className="ml-2">
                {instanceName}
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} configurado{workflows.length !== 1 ? 's' : ''}
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Workflow
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Criação */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Workflow</CardTitle>
            <CardDescription>
              Configure um novo workflow de automação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome do Workflow</label>
              <Input
                value={newWorkflow.name}
                onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Resposta automática de boas-vindas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Gatilho</label>
              <Select
                value={newWorkflow.trigger}
                onValueChange={(value) => setNewWorkflow(prev => ({ ...prev, trigger: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gatilho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="message_received">Mensagem Recebida</SelectItem>
                  <SelectItem value="message_sent">Mensagem Enviada</SelectItem>
                  <SelectItem value="status_changed">Status Alterado</SelectItem>
                  <SelectItem value="time_based">Baseado em Tempo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={newWorkflow.enabled}
                onCheckedChange={(checked) => setNewWorkflow(prev => ({ ...prev, enabled: checked }))}
              />
              <label className="text-sm font-medium">Ativar workflow</label>
            </div>

            <div className="flex gap-2">
              <Button onClick={createWorkflow} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Criar Workflow
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Workflows */}
      {workflows.length > 0 ? (
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${workflow.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div>
                      <h3 className="font-medium">{workflow.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {getTriggerIcon(workflow.trigger)}
                        <span>{getTriggerLabel(workflow.trigger)}</span>
                        <Badge variant={workflow.enabled ? "default" : "secondary"}>
                          {workflow.enabled ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => executeWorkflow(workflow.id)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Executar
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleWorkflow(workflow.id, !workflow.enabled)}
                    >
                      {workflow.enabled ? (
                        <Pause className="h-4 w-4 mr-1" />
                      ) : (
                        <Play className="h-4 w-4 mr-1" />
                      )}
                      {workflow.enabled ? 'Pausar' : 'Ativar'}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteWorkflow(workflow.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Deletar
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-500">
                  <div>Criado em: {new Date(workflow.created_at).toLocaleDateString()}</div>
                  <div>Condições: {workflow.conditions.length}</div>
                  <div>Ações: {workflow.actions.length}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum workflow configurado
              </h3>
              <p className="text-gray-500 mb-4">
                Crie seu primeiro workflow de automação para começar
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Workflow
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
