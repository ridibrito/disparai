'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  MessageCircle,
  Zap,
  Plus,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Circle,
  Copy,
  Phone,
  Trash,
  Settings,
  Bot,
  Wifi,
  WifiOff,
  QrCode,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SimpleWhatsAppConnection from '@/components/api-connections/SimpleWhatsAppConnection';
import NewConnectionModal from '@/components/api-connections/NewConnectionModal';
import AgentInstanceConfig from '@/components/ai-agents/agent-instance-config';
import toast from 'react-hot-toast';

interface ApiConnection {
  id: string;
  name: string;
  type: 'whatsapp_cloud' | 'whatsapp_disparai';
  status: 'active' | 'inactive' | 'error' | 'connected' | 'disconnected';
  phoneNumber?: string;
  instanceId?: string;
  instance_key?: string;
  createdAt: string;
  lastUsed?: string;
  messageCount: number;
  monthlyLimit: number;
  webhook_url?: string;
  is_whatsapp_instance?: boolean;
  whatsapp_status?: string;
  api_connection_status?: string;
}

interface WhatsAppConnectionsIntegratedProps {
  organizationInfo?: any;
}

export function WhatsAppConnectionsIntegrated({ organizationInfo }: WhatsAppConnectionsIntegratedProps) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ApiConnection[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  
  // Estados para modais de confirmação
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Função para atualizar progresso
  const updateProgress = (step: number, message: string) => {
    setProgressStep(step);
    setProgressMessage(message);
  };

  // Carregar conexões
  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);

  const loadConnections = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/connections');
      if (response.ok) {
        const data = await response.json();
        const connectionsArray = data.connections || [];
        setConnections(connectionsArray);
      }
    } catch (error) {
      console.error('Erro ao carregar conexões:', error);
      toast.error('Erro ao carregar conexões');
      setConnections([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateConnection = async (connectionData: any) => {
    try {
      setIsCreatingInstance(true);
      updateProgress(1, 'Criando nova conexão...');
      setShowProgressModal(true);

      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connectionData),
      });

      if (response.ok) {
        updateProgress(2, 'Conexão criada com sucesso!');
        await loadConnections();
        setIsModalOpen(false);
        toast.success('Conexão criada com sucesso!');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar conexão');
      }
    } catch (error: any) {
      console.error('Erro ao criar conexão:', error);
      toast.error(error.message || 'Erro ao criar conexão');
    } finally {
      setIsCreatingInstance(false);
      setShowProgressModal(false);
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    try {
      setIsProcessing(true);
      toast.info('Removendo conexão...');
      
      const response = await fetch(`/api/connections?id=${connectionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        await loadConnections();
        setShowDeleteConfirm(false);
        setSelectedConnection(null);
        toast.success(result.message || 'Conexão removida com sucesso!');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao remover conexão');
      }
    } catch (error: any) {
      console.error('Erro ao remover conexão:', error);
      toast.error(error.message || 'Erro ao remover conexão');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'whatsapp_disparai':
        return <MessageCircle className="h-5 w-5 text-green-600" />;
      case 'whatsapp_cloud':
        return <Zap className="h-5 w-5 text-blue-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'disconnected':
      case 'inactive':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'error':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return 'Conectado';
      case 'disconnected':
      case 'inactive':
        return 'Desconectado';
      case 'error':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Carregando conexões...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Botão de Nova Conexão */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Conexões WhatsApp</h2>
          <p className="text-gray-600">Gerencie suas instâncias WhatsApp conectadas</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Conexão
        </Button>
      </div>

      {/* Lista de Conexões */}
      {!Array.isArray(connections) || connections.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Nenhuma conexão WhatsApp
              </h3>
              <p className="text-gray-500 text-center mb-6">
                Conecte sua primeira instância WhatsApp para começar a usar a Central WhatsApp.
              </p>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Conectar WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.isArray(connections) && connections.map((connection) => (
            <Card key={connection.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(connection.type)}
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {connection.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {connection.type === 'whatsapp_cloud' ? 'Cloud API' : 'Disparai API'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(connection.status)}>
                    {getStatusText(connection.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {connection.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{connection.phoneNumber}</span>
                    </div>
                  )}
                  {connection.instanceId && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Settings className="h-4 w-4" />
                      <span className="font-mono text-xs">{connection.instanceId}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {getStatusIcon(connection.status)}
                    <span>Status: {getStatusText(connection.status)}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedConnection(connection);
                      setShowDeleteConfirm(true);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gray-200"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Gerenciar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Nova Conexão */}
      <NewConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateConnection={handleCreateConnection}
        isCreating={isCreatingInstance}
      />

      {/* Modal de Progresso */}
      <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criando Conexão</DialogTitle>
            <DialogDescription>
              {progressMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progressStep / 2) * 100}%` }}
              />
            </div>
            <div className="text-center text-sm text-gray-600">
              Passo {progressStep} de 2
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a conexão "{selectedConnection?.name}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setSelectedConnection(null);
              }}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedConnection && handleDeleteConnection(selectedConnection.id)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash className="w-4 h-4 mr-2" />
                  Excluir
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
