'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClientComponentClient } from '@/lib/supabase';
import { AIAgent, AgentInstanceConfig, AgentType } from '@/types/ai-agents';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Settings, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AgentInstanceConfigProps {
  whatsappInstanceId: string;
  instanceName: string;
}

export default function AgentInstanceConfig({ 
  whatsappInstanceId, 
  instanceName 
}: AgentInstanceConfigProps) {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [configs, setConfigs] = useState<AgentInstanceConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && whatsappInstanceId) {
      loadData();
    }
  }, [user, whatsappInstanceId]);

  const loadData = async () => {
    try {
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

      const organizationId = userData?.organization_id || user.id;
      
      // Carregar agentes disponíveis
      console.log('🔍 Buscando agentes com organization_id:', organizationId);
      const { data: agentsData, error: agentsError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name');
      
      console.log('📊 Resultado da query de agentes:', { agentsData, agentsError });

      if (agentsError) throw agentsError;

      // Carregar configurações existentes
      const { data: configsData, error: configsError } = await supabase
        .from('agent_instance_configs')
        .select(`
          *,
          ai_agents (*)
        `)
        .eq('whatsapp_instance_id', whatsappInstanceId);

      if (configsError) throw configsError;

      setAgents(agentsData || []);
      setConfigs(configsData || []);
      
      console.log('✅ Dados carregados:', {
        agents: agentsData?.length || 0,
        configs: configsData?.length || 0,
        agentsData: agentsData,
        organizationId: organizationId
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar configurações', {
        description: 'Não foi possível carregar as configurações de agentes. Recarregue a página.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAgent = async (agentId: string, enabled: boolean) => {
    console.log('🔄 Toggle agente:', { agentId, enabled });
    
    try {
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

      const organizationId = userData?.organization_id || user.id;
      
      if (enabled) {
        // Ativar agente
        const { error } = await supabase
          .from('agent_instance_configs')
          .insert({
            organization_id: organizationId,
            whatsapp_instance_id: whatsappInstanceId,
            agent_id: agentId,
            is_enabled: true
          });

        if (error) throw error;
        
        const agentName = agents.find(a => a.id === agentId)?.name || 'Agente';
        toast.success('Agente ativado com sucesso!', {
          description: `${agentName} agora responderá automaticamente nesta instância WhatsApp.`
        });
      } else {
        // Desativar agente
        const { error } = await supabase
          .from('agent_instance_configs')
          .delete()
          .eq('whatsapp_instance_id', whatsappInstanceId)
          .eq('agent_id', agentId);

        if (error) throw error;
        
        const agentName = agents.find(a => a.id === agentId)?.name || 'Agente';
        toast.success('Agente desativado com sucesso!', {
          description: `${agentName} não responderá mais automaticamente nesta instância.`
        });
      }

      loadData();
    } catch (error) {
      console.error('Erro ao alterar configuração:', error);
      toast.error('Erro ao alterar configuração', {
        description: 'Não foi possível ativar/desativar o agente. Tente novamente.'
      });
    }
  };

  const isAgentEnabled = (agentId: string) => {
    return configs.some(config => config.agent_id === agentId && config.is_enabled);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-green-500" />
          <CardTitle>Configuração de Agentes - {instanceName}</CardTitle>
        </div>
        <CardDescription>
          Configure quais agentes de IA devem responder automaticamente nesta instância WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum agente disponível
            </h3>
            <p className="text-gray-600 mb-4">
              Crie agentes de IA primeiro para configurá-los nesta instância
            </p>
            <Button 
              onClick={() => window.location.href = '/configuracoes/agentes'}
              className="bg-green-500 hover:bg-green-600"
            >
              <Bot className="h-4 w-4 mr-2" />
              Gerenciar Agentes
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {console.log('🔄 Renderizando agentes:', agents.length)}
            {agents.map((agent) => {
              const isEnabled = isAgentEnabled(agent.id);
              console.log('🔄 Renderizando agente:', agent.name, 'enabled:', isEnabled);
              
              return (
                <div 
                  key={agent.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-green-500" />
                      <div>
                        <h4 className="font-medium text-gray-900">{agent.name}</h4>
                        <p className="text-sm text-gray-600">{agent.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {agent.type}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {isEnabled ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-600">
                        {isEnabled ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleToggleAgent(agent.id, checked)}
                      className="data-[state=checked]:bg-green-500 border-2 border-gray-300 data-[state=unchecked]:bg-white data-[state=unchecked]:border-gray-400"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {configs.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h4 className="font-medium text-green-900">Agentes Ativos</h4>
            </div>
            <p className="text-sm text-green-700">
              {configs.filter(c => c.is_enabled).length} agente(s) configurado(s) para responder automaticamente nesta instância
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
