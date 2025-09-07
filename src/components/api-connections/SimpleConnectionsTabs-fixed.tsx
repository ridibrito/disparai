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
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SimpleWhatsAppConnection from './SimpleWhatsAppConnection';
import NewConnectionModal from './NewConnectionModal';
import toast from 'react-hot-toast';

interface ApiConnection {
  id: string;
  name: string;
  type: 'whatsapp_cloud' | 'whatsapp_disparai';
  status: 'active' | 'inactive' | 'error' | 'connected' | 'disconnected';
  phoneNumber?: string;
  instanceId?: string;
  createdAt: string;
  lastUsed?: string;
  messageCount: number;
  monthlyLimit: number;
}

interface WhatsAppInstance {
  id: string;
  organization_id: string;
  instance_key: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function SimpleConnectionsTabs() {
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

  // Função para atualizar progresso
  const updateProgress = (step: number, message: string) => {
    setProgressStep(step);
    setProgressMessage(message);
  };

  // Função para verificar status da instância periodicamente
  const checkInstanceStatus = async (instanceKey: string): Promise<boolean> => {
    try {
      const response = await fetch(`https://teste8.megaapi.com.br/rest/instance/${instanceKey}`, {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pciI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Status da instância:', data.instance?.status);
        
        if (data.instance?.status === 'connected') {
          console.log('✅ WhatsApp conectado! Fechando QR Code...');
          setShowQRModal(false);
          await updateConnectionStatusAfterQR(instanceKey);
          return true;
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
    return false;
  };

  // Função para iniciar verificação periódica do status
  const startStatusPolling = (instanceKey: string) => {
    console.log('🔄 Iniciando verificação periódica para:', instanceKey);
    
    const interval = setInterval(async () => {
      const isConnected = await checkInstanceStatus(instanceKey);
      
      if (isConnected) {
        clearInterval(interval);
        console.log('✅ Verificação periódica finalizada - WhatsApp conectado');
      }
    }, 3000); // Verificar a cada 3 segundos

    // Limpar intervalo após 5 minutos (timeout de segurança)
    setTimeout(() => {
      clearInterval(interval);
      console.log('⏰ Timeout da verificação periódica');
    }, 300000); // 5 minutos
  };

  // Função para atualizar status da conexão após conectar com QR Code
  const updateConnectionStatusAfterQR = async (instanceKey: string) => {
    try {
      console.log('🔄 Atualizando status da instância:', instanceKey);
      
      const response = await fetch('/api/update-instance-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey: instanceKey,
          status: 'ativo'
        }),
      });

      const result = await response.json();

      if (result.ok) {
        console.log('✅ Status da instância atualizado:', result);
        await loadConnections(); // Recarregar lista
      } else {
        console.error('❌ Erro ao atualizar status:', result.error);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
    }
  };

  // Função para carregar instâncias da MegaAPI
  const loadInstances = async () => {
    try {
      setIsLoadingInstances(true);
      const response = await fetch('/api/list-instances');
      const data = await response.json();
      
      if (data.success) {
        setInstances(data.instances || []);
        console.log('📱 Instâncias carregadas:', data.instances?.length || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
    } finally {
      setIsLoadingInstances(false);
    }
  };

  // Função para criar nova instância usando nossa API
  const createNewInstance = async () => {
    if (!user) return;
    
    setIsCreatingInstance(true);
    setShowProgressModal(true);
    setProgressStep(0);
    
    try {
      // Etapa 1: Criando instância via nossa API
      updateProgress(1, 'Criando nova instância Disparai...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay visual
      
      console.log('🚀 Criando instância via API interna...');
      
      // Usar nossa API que já tem a lógica correta de nomenclatura e webhook
      const createResponse = await fetch('/api/create-whatsapp-instance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Não passar instanceName para usar o padrão baseado na organização
          organizationId: user.organization_id || user.id
        })
      });

      console.log('📡 Resposta da criação:', {
        status: createResponse.status,
        statusText: createResponse.statusText
      });
      
      if (createResponse.ok) {
        const createResult = await createResponse.json();
        console.log('✅ Instância criada com sucesso:', createResult);
        
        // Armazenar o instanceKey para uso posterior
        setCurrentInstanceKey(createResult.instance_key);
        
        updateProgress(2, 'Instância criada com sucesso!');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Etapa 2: Gerar QR Code
        updateProgress(3, 'Gerando QR Code...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await generateQRCode(createResult.instance_key);
        
        updateProgress(4, 'QR Code gerado!');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Etapa 3: Iniciar verificação de status
        updateProgress(5, 'Iniciando verificação de conexão...');
        startStatusPolling(createResult.instance_key);
        
        // Fechar modal de progresso e abrir QR Code
        setShowProgressModal(false);
        setShowQRModal(true);
        
        toast.success('Instância criada com sucesso! Escaneie o QR Code para conectar.');
      } else {
        // Erro na criação da instância
        const errorText = await createResponse.text();
        console.error('❌ Erro ao criar instância:', {
          status: createResponse.status,
          statusText: createResponse.statusText,
          error: errorText
        });
        updateProgress(2, 'Erro ao criar instância - verifique os logs');
        toast.error('Erro ao criar instância no servidor');
        return;
      }
    } catch (error) {
      console.error('❌ Erro geral:', error);
      toast.error('Erro ao criar instância');
    } finally {
      setIsCreatingInstance(false);
      setShowProgressModal(false);
    }
  };

  // Função para gerar QR Code
  const generateQRCode = async (instanceKey: string) => {
    try {
      console.log('📱 Gerando QR Code para instância:', instanceKey);
      
      const response = await fetch(`https://teste8.megaapi.com.br/rest/instance/qrcode_base64/${instanceKey}`, {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pciI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs'
        }
      });

      console.log('📡 Resposta do QR Code:', {
        status: response.status,
        statusText: response.statusText
      });

      if (response.ok) {
        const qrData = await response.json();
        console.log('✅ Resposta do QR Code:', qrData);
        
        if (qrData.qrcode) {
          setQrCodeData(qrData.qrcode);
          console.log('📱 QR Code recebido com sucesso!');
        } else {
          console.error('❌ QR Code não encontrado na resposta');
          toast.error('Erro ao gerar QR Code');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Erro ao gerar QR Code:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        toast.error('Erro ao gerar QR Code');
      }
    } catch (error) {
      console.error('❌ Erro ao gerar QR Code:', error);
      toast.error('Erro ao gerar QR Code');
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      if (!isMounted) return;
      
      console.log('🔄 useEffect executado - carregando dados iniciais');
      
      try {
        await Promise.all([
          loadConnections(),
          loadInstances()
        ]);
        
        if (!isInitialized) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
      }
    };

    loadInitialData();
    
    return () => {
      isMounted = false;
    };
  }, []); // Array vazio para executar apenas uma vez

  const loadConnections = async () => {
    try {
      console.log('🔄 loadConnections chamado');
      
      // Buscar conexões da tabela api_connections
      const connectionsResponse = await fetch('/api/connections-v2');
      
      if (!connectionsResponse.ok) {
        throw new Error(`HTTP error! status: ${connectionsResponse.status}`);
      }
      
      const connectionsData = await connectionsResponse.json();
      let allConnections = connectionsData.data || [];
      
      // Buscar instâncias WhatsApp da tabela whatsapp_instances
      const instancesResponse = await fetch('/api/list-instances');
      
      if (instancesResponse.ok) {
        const instancesData = await instancesResponse.json();
        console.log('📱 Instâncias WhatsApp encontradas:', instancesData.instances?.length || 0);
        
        // Converter instâncias WhatsApp para formato de conexões
        const whatsappConnections = instancesData.instances?.map((instance: any) => ({
          id: instance.id,
          name: `WhatsApp Disparai - ${instance.instance_key}`,
          type: 'whatsapp_disparai',
          status: instance.status === 'ativo' ? 'connected' : 'disconnected',
          instance_key: instance.instance_key,
          created_at: instance.created_at,
          updated_at: instance.updated_at,
          is_whatsapp_instance: true // Flag para identificar que veio da tabela whatsapp_instances
        })) || [];
        
        // Combinar conexões existentes com instâncias WhatsApp
        allConnections = [...allConnections, ...whatsappConnections];
      }
      
      setConnections(allConnections);
      console.log('📋 Total de conexões carregadas:', allConnections.length);
      
    } catch (error) {
      console.error('Error loading connections:', error);
      // Não mostrar toast de erro para não poluir a interface
      setConnections([]); // Definir array vazio em caso de erro
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
    if (!confirm('Tem certeza que deseja excluir esta conexão?')) {
      return;
    }

    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Conexão excluída com sucesso!');
        await loadConnections(); // Recarregar lista
      } else {
        toast.error(data.error || 'Erro ao excluir conexão');
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
      toast.error('Erro ao excluir conexão');
    }
  };

  const handleConnected = () => {
    toast.success('WhatsApp conectado com sucesso!');
    loadConnections();
  };

  // Filtrar conexões por tipo
  const disparaiConnections = connections.filter(conn => conn.type === 'whatsapp_disparai');
  const cloudConnections = connections.filter(conn => conn.type === 'whatsapp_cloud');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected':
      case 'inactive':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
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
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando conexões...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Conexões de API</h2>
          <p className="text-gray-600">Gerencie suas integrações com WhatsApp</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Conexão
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('disparai')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'disparai'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-2 text-green-500" />
            Disparai API (Unofficial)
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cloud'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-2 text-blue-500" />
            WhatsApp Cloud API
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'disparai' && (
        <div className="space-y-4">
          {/* Botão para criar nova instância */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-green-500" />
                Disparai API (Unofficial)
              </CardTitle>
              <CardDescription>
                Conecte sua conta WhatsApp usando a API não oficial do Disparai
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={createNewInstance}
                disabled={isCreatingInstance}
                className="w-full"
              >
                {isCreatingInstance ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando Instância...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Conectar WhatsApp
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Lista de conexões Disparai */}
          {disparaiConnections.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Conexões Ativas</h3>
              {disparaiConnections.map((connection) => (
                <Card key={connection.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(connection.status)}
                        <div>
                          <h4 className="font-medium">{connection.name}</h4>
                          <p className="text-sm text-gray-500">
                            Criado em: {new Date(connection.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(connection.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestConnection(connection.id)}
                        >
                          Testar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteConnection(connection.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'cloud' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-blue-500" />
                WhatsApp Cloud API
              </CardTitle>
              <CardDescription>
                Conecte sua conta WhatsApp Business usando a API oficial do Meta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowDisparaiConnection(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Conectar WhatsApp Business
              </Button>
            </CardContent>
          </Card>

          {/* Lista de conexões Cloud */}
          {cloudConnections.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Conexões Ativas</h3>
              {cloudConnections.map((connection) => (
                <Card key={connection.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(connection.status)}
                        <div>
                          <h4 className="font-medium">{connection.name}</h4>
                          <p className="text-sm text-gray-500">
                            Criado em: {new Date(connection.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(connection.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestConnection(connection.id)}
                        >
                          Testar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteConnection(connection.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Nova Conexão */}
      <NewConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveConnection}
      />

      {/* Modal de Progresso */}
      <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criando Instância WhatsApp</DialogTitle>
            <DialogDescription>
              Aguarde enquanto criamos sua instância...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{progressMessage}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progressStep / 5) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">
              Etapa {progressStep} de 5
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de QR Code */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code com seu WhatsApp para conectar
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {qrCodeData ? (
              <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                <img 
                  src={qrCodeData} 
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64"
                />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gerando QR Code...</span>
              </div>
            )}
            <p className="text-sm text-gray-500 text-center">
              Abra o WhatsApp no seu celular, toque em Menu ou Configurações e selecione "Dispositivos conectados"
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Componente de Conexão WhatsApp */}
      {showDisparaiConnection && user && (
        <SimpleWhatsAppConnection
          userId={user.id}
          userName={user.full_name || user.email || 'Usuário'}
          qrCodeData={qrCodeData}
          onConnected={handleConnected}
          onError={(error) => {
            console.error('Erro na conexão:', error);
            toast.error(error);
          }}
        />
      )}
    </div>
  );
}
