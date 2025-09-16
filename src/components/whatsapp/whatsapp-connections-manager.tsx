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

interface WhatsAppInstance {
  id: string;
  organization_id: string;
  instance_key: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface WhatsAppConnectionsManagerProps {
  organizationInfo?: any;
}

export function WhatsAppConnectionsManager({ organizationInfo }: WhatsAppConnectionsManagerProps) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ApiConnection[]>([]);
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [activeTab, setActiveTab] = useState('disparai');
  const [showDisparaiConnection, setShowDisparaiConnection] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isLoadingInstances, setIsLoadingInstances] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [currentInstanceKey, setCurrentInstanceKey] = useState<string | null>(null);
  
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

  // Função para formatar número do WhatsApp para máscara brasileira
  const formatWhatsAppNumber = (whatsappId: string): string => {
    const number = whatsappId.replace('@s.whatsapp.net', '');
    const cleanNumber = number.startsWith('55') ? number.substring(2) : number;

    if (cleanNumber.length === 11) {
      return `(${cleanNumber.substring(0, 2)}) ${cleanNumber.substring(2, 7)}-${cleanNumber.substring(7)}`;
    } else if (cleanNumber.length === 10) {
      return `(${cleanNumber.substring(0, 2)}) ${cleanNumber.substring(2, 6)}-${cleanNumber.substring(6)}`;
    }
    
    return cleanNumber;
  };

  // Carregar conexões
  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);

  // Listener para abrir modal de nova conexão
  useEffect(() => {
    const handleOpenNewConnectionModal = () => {
      setIsModalOpen(true);
    };

    window.addEventListener('openNewConnectionModal', handleOpenNewConnectionModal);
    
    return () => {
      window.removeEventListener('openNewConnectionModal', handleOpenNewConnectionModal);
    };
  }, []);

  const loadConnections = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/connections');
      if (response.ok) {
        const data = await response.json();
        // A API retorna { connections: [...] }
        const connectionsArray = data.connections || [];
        setConnections(connectionsArray);
      }
    } catch (error) {
      console.error('Erro ao carregar conexões:', error);
      toast.error('Erro ao carregar conexões');
      setConnections([]); // Garantir que sempre seja um array
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
      case 'inactive':
        return <X className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Conectado</Badge>;
      case 'disconnected':
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Desconectado</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Erro</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'whatsapp_disparai':
        return <Zap className="h-4 w-4 text-green-600" />;
      case 'whatsapp_cloud':
        return <MessageCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Bot className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'whatsapp_disparai':
        return 'Disparai API (Unofficial)';
      case 'whatsapp_cloud':
        return 'WhatsApp Cloud API';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">Carregando conexões...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Botão de Nova Conexão */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Conexões WhatsApp</h3>
          <p className="text-sm text-gray-600">Gerencie suas conexões com WhatsApp</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 hover:bg-green-700"
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma conexão encontrada
              </h3>
              <p className="text-gray-500 mb-6">
                Crie sua primeira conexão WhatsApp para começar a usar o sistema.
              </p>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Conexão
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
                    <CardTitle className="text-sm font-medium">
                      {connection.name}
                    </CardTitle>
                  </div>
                  {getStatusIcon(connection.status)}
                </div>
                <CardDescription className="text-xs">
                  {getTypeLabel(connection.type)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Status:</span>
                    {getStatusBadge(connection.status)}
                  </div>

                  {/* Número do Telefone */}
                  {connection.phoneNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Telefone:</span>
                      <span className="text-xs font-mono">
                        {formatWhatsAppNumber(connection.phoneNumber)}
                      </span>
                    </div>
                  )}

                  {/* Instance Key */}
                  {connection.instance_key && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Instance:</span>
                      <span className="text-xs font-mono">
                        {connection.instance_key.slice(0, 8)}...
                      </span>
                    </div>
                  )}

                  {/* Estatísticas */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Mensagens:</span>
                    <span className="text-xs">
                      {connection.messageCount || 0} / {connection.monthlyLimit || '∞'}
                    </span>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedConnection(connection);
                        setShowQRModal(true);
                      }}
                    >
                      <QrCode className="h-3 w-3 mr-1" />
                      QR Code
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedConnection(connection);
                        setShowDeleteConfirm(true);
                      }}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
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
        onSubmit={handleCreateConnection}
        isLoading={isCreatingInstance}
      />

      {/* Modal de QR Code */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code da Conexão</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code com seu WhatsApp para conectar
            </DialogDescription>
          </DialogHeader>
          {selectedConnection && (
            <div className="text-center">
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <QrCode className="h-16 w-16 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {selectedConnection.name} - {getTypeLabel(selectedConnection.type)}
              </p>
              <Button 
                variant="outline" 
                onClick={() => setShowQRModal(false)}
                className="w-full"
              >
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover esta conexão? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {selectedConnection && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                <strong>{selectedConnection.name}</strong> - {getTypeLabel(selectedConnection.type)}
              </p>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(false)}
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
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash className="h-4 w-4 mr-2" />
              )}
              Remover
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Progresso */}
      <Dialog open={showProgressModal} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criando Conexão</DialogTitle>
            <DialogDescription>
              Aguarde enquanto criamos sua nova conexão...
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-green-600" />
              <span className="text-sm text-gray-600">{progressMessage}</span>
            </div>
            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progressStep / 2) * 100}%` }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
