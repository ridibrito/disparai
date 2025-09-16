'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, MessageCircle, CheckCircle, AlertCircle, Loader2, X, Circle, Copy, Phone, Trash, Settings, Bot, Wifi, WifiOff, QrCode, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SimpleWhatsAppConnection from '@/components/api-connections/SimpleWhatsAppConnection';
import MegaApiConnectionModal from '@/components/whatsapp/mega-api-connection-modal';
import AgentInstanceConfig from '@/components/ai-agents/agent-instance-config';
import { WhatsAppLoading } from '@/components/ui/whatsapp-loading';
import toast from 'react-hot-toast';

interface ApiConnection {
  id: string;
  name: string;
  type: 'whatsapp_cloud' | 'whatsapp_disparai';
  status: 'active' | 'inactive' | 'error' | 'connected' | 'disconnected';
  phoneNumber?: string;
  instanceId?: string;
}

interface WhatsAppConnectionsSimpleProps {
  organizationInfo?: any;
}

export function WhatsAppConnectionsSimple({ organizationInfo }: WhatsAppConnectionsSimpleProps) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ApiConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressStep, setProgressStep] = useState(1);
  const [progressMessage, setProgressMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<ApiConnection | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
      setShowProgressModal(true);
      setProgressStep(1);
      setProgressMessage('Salvando conexão...');
      
      console.log('💾 Salvando conexão:', connectionData);
      
      // Salvar a conexão na tabela api_connections
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: connectionData.name || 'Instância Disparai',
          type: connectionData.type || 'whatsapp_disparai',
          status: connectionData.status || 'active',
          instance_id: connectionData.instance_key,
          phone_number: connectionData.phone_number || null,
          is_active: true
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Conexão salva com sucesso:', result);
        
        setProgressStep(2);
        setProgressMessage('Conexão salva com sucesso!');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        toast.success('Conexão criada e salva com sucesso!');
        
        setShowProgressModal(false);
        setIsModalOpen(false);
        loadConnections();
      } else {
        const errorData = await response.json();
        console.error('❌ Erro ao salvar conexão:', errorData);
        throw new Error(errorData.error || 'Erro ao salvar conexão');
      }
    } catch (error) {
      console.error('Erro ao criar conexão:', error);
      toast.error('Erro ao criar conexão: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsCreatingInstance(false);
      setShowProgressModal(false);
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    try {
      setIsProcessing(true);
      
      const response = await fetch(`/api/connections?id=${connectionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Conexão excluída com sucesso!');
        setShowDeleteConfirm(false);
        setSelectedConnection(null);
        loadConnections();
      } else {
        throw new Error('Erro ao excluir conexão');
      }
    } catch (error) {
      console.error('Erro ao excluir conexão:', error);
      toast.error('Erro ao excluir conexão');
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
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
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
      <div className="flex items-center justify-center p-12 border border-gray-200 rounded-lg bg-white">
        <WhatsAppLoading 
          size="lg" 
          text="Carregando conexões WhatsApp..." 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
      {connections.length === 0 ? (
        <div style={{ 
          backgroundColor: 'white', 
          border: '1px solid #e9ecef', 
          borderRadius: '8px', 
          padding: '48px', 
          textAlign: 'center' 
        }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 16px auto' 
          }}>
            <MessageCircle size={32} color="#6c757d" />
          </div>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#495057', 
            margin: '0 0 8px 0' 
          }}>
            Nenhuma conexão WhatsApp
          </h3>
          <p style={{ 
            color: '#6c757d', 
            margin: '0 0 24px 0' 
          }}>
            Conecte sua primeira instância WhatsApp para começar a usar a Central WhatsApp.
            <br />
            <strong>Use o botão "Nova Conexão" acima para conectar uma instância.</strong>
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ 
              backgroundColor: '#25D366', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 auto'
            }}
          >
            <Plus size={16} />
            Conectar WhatsApp
          </button>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '16px' 
        }}>
          {connections.map((connection) => (
            <div 
              key={connection.id} 
              style={{ 
                backgroundColor: 'white', 
                border: '1px solid #e9ecef', 
                borderRadius: '8px', 
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginBottom: '12px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageCircle size={20} color="#25D366" />
                  <div>
                    <h3 style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      margin: '0 0 4px 0',
                      color: '#212529'
                    }}>
                      {connection.name}
                    </h3>
                    <p style={{ 
                      fontSize: '12px', 
                      color: '#6c757d', 
                      margin: '0' 
                    }}>
                      {connection.type === 'whatsapp_cloud' ? 'Cloud API' : 'Disparai API'}
                    </p>
                  </div>
                </div>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontSize: '12px',
                  fontWeight: '500',
                  ...(connection.status === 'connected' || connection.status === 'active' 
                    ? { backgroundColor: '#d1f2d9', color: '#0f5132' }
                    : { backgroundColor: '#f8d7da', color: '#721c24' }
                  )
                }}>
                  {getStatusText(connection.status)}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {connection.phoneNumber && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    fontSize: '14px', 
                    color: '#6c757d' 
                  }}>
                    <span>{connection.phoneNumber}</span>
                  </div>
                )}
                {connection.instanceId && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    fontSize: '14px', 
                    color: '#6c757d' 
                  }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {connection.instanceId}
                    </span>
                  </div>
                )}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '14px', 
                  color: '#6c757d' 
                }}>
                  {getStatusIcon(connection.status)}
                  <span>Status: {getStatusText(connection.status)}</span>
                </div>
              </div>
              
              {/* Botões de Ação */}
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                marginTop: '16px' 
              }}>
                <button
                  onClick={() => {
                    setSelectedConnection(connection);
                    setShowDeleteConfirm(true);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #dc3545',
                    color: '#dc3545',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Trash size={14} />
                  Excluir
                </button>
                <button
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #6c757d',
                    color: '#6c757d',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flex: 1
                  }}
                >
                  <Settings size={14} />
                  Gerenciar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Nova Conexão - Mega API */}
      <MegaApiConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnected={handleCreateConnection}
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
