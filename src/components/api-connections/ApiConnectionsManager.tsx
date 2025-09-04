'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Zap, 
  Plus, 
  Settings, 
  Trash2, 
  AlertCircle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import NewConnectionModal from './NewConnectionModal';
import toast from 'react-hot-toast';

interface ApiConnection {
  id: string;
  name: string;
  type: 'whatsapp_cloud' | 'whatsapp_disparai';
  status: 'active' | 'inactive' | 'error';
  phoneNumber?: string;
  instanceId?: string;
  createdAt: string;
  lastUsed?: string;
  messageCount: number;
  monthlyLimit: number;
}


export default function ApiConnectionsManager() {
  const [connections, setConnections] = useState<ApiConnection[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar conexões ao montar o componente
  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/connections');
      const data = await response.json();
      
      if (response.ok) {
        setConnections(data.connections || []);
      } else {
        toast.error('Erro ao carregar conexões');
      }
    } catch (error) {
      console.error('Error loading connections:', error);
      toast.error('Erro ao carregar conexões');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConnection = async (newConnection: ApiConnection) => {
    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConnection),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Conexão criada com sucesso!');
        await loadConnections(); // Recarregar lista
      } else {
        toast.error(data.error || 'Erro ao criar conexão');
      }
    } catch (error) {
      console.error('Error saving connection:', error);
      toast.error('Erro ao salvar conexão');
    }
  };

  const handleTestConnection = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}/test`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }

      // Recarregar conexões para atualizar status
      await loadConnections();
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Erro ao testar conexão');
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (!confirm('Tem certeza que deseja remover esta conexão?')) {
      return;
    }

    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Conexão removida com sucesso!');
        await loadConnections(); // Recarregar lista
      } else {
        toast.error(data.error || 'Erro ao remover conexão');
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
      toast.error('Erro ao remover conexão');
    }
  };

  const getConnectionTypeInfo = (type: string) => {
    switch (type) {
      case 'whatsapp_cloud':
        return {
          name: 'WhatsApp Cloud API',
          description: 'API oficial do Meta para WhatsApp Business',
          icon: MessageCircle,
          color: 'bg-blue-500',
          features: ['Mensagens em massa', 'Webhooks', 'Templates aprovados', 'Suporte oficial']
        };
      case 'whatsapp_disparai':
        return {
          name: 'WhatsApp Disparai',
          description: 'Solução avançada para disparos em massa',
          icon: Zap,
          color: 'bg-green-500',
          features: ['Disparos ilimitados', 'Automação avançada', 'Relatórios detalhados', 'Suporte 24/7']
        };
      default:
        return {
          name: 'Desconhecido',
          description: 'Tipo de conexão não identificado',
          icon: AlertCircle,
          color: 'bg-gray-500',
          features: []
        };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Ativo</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inativo</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Erro</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Desconhecido</Badge>;
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conexões API</h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas conexões com WhatsApp Cloud API e WhatsApp Disparai
          </p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Conexão
        </Button>
      </div>

      {/* Conexões */}
      <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Carregando conexões...</span>
            </div>
          ) : connections.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {connections.map((connection) => {
              const typeInfo = getConnectionTypeInfo(connection.type);
              const Icon = typeInfo.icon;
              const usagePercentage = getUsagePercentage(connection.messageCount, connection.monthlyLimit);
              
              return (
                <Card key={connection.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${typeInfo.color}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{connection.name}</CardTitle>
                          <CardDescription>{typeInfo.description}</CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(connection.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Informações da conexão */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Tipo</p>
                        <p className="font-medium">{typeInfo.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Criada em</p>
                        <p className="font-medium">{new Date(connection.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                      {connection.phoneNumber && (
                        <div>
                          <p className="text-gray-600">Telefone</p>
                          <p className="font-medium">{connection.phoneNumber}</p>
                        </div>
                      )}
                      {connection.instanceId && (
                        <div>
                          <p className="text-gray-600">Instance ID</p>
                          <p className="font-medium">{connection.instanceId}</p>
                        </div>
                      )}
                    </div>

                    {/* Uso mensal */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Uso mensal</span>
                        <span className="font-medium">
                          {connection.messageCount.toLocaleString()} / {connection.monthlyLimit.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${getUsageColor(usagePercentage)}`}
                          style={{ width: `${usagePercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Recursos incluídos:</p>
                      <div className="flex flex-wrap gap-2">
                        {typeInfo.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex space-x-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="w-4 h-4 mr-2" />
                        Configurar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleTestConnection(connection.id)}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Testar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteConnection(connection.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
              })}
            </div>
          ) : null}

          {/* Botão Nova Conexão */}
          <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Adicionar Nova Conexão</h3>
                  <p className="text-gray-600 mt-1">
                    Conecte uma nova API para expandir suas capacidades de envio
                  </p>
                </div>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Conexão
                </Button>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Modal para nova conexão */}
      <NewConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveConnection}
      />
    </div>
  );
}
