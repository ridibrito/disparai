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
  Phone
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

  // Função para formatar número do WhatsApp para máscara brasileira
  const formatWhatsAppNumber = (whatsappId: string): string => {
    // Remove o @s.whatsapp.net e extrai apenas o número
    const number = whatsappId.replace('@s.whatsapp.net', '');
    
    // Remove o código do país (55) se presente
    const cleanNumber = number.startsWith('55') ? number.substring(2) : number;
    
    // Aplica máscara brasileira: (XX) XXXXX-XXXX
    if (cleanNumber.length === 11) {
      return `(${cleanNumber.substring(0, 2)}) ${cleanNumber.substring(2, 7)}-${cleanNumber.substring(7)}`;
    } else if (cleanNumber.length === 10) {
      return `(${cleanNumber.substring(0, 2)}) ${cleanNumber.substring(2, 6)}-${cleanNumber.substring(6)}`;
    }
    
    return cleanNumber; // Retorna o número limpo se não conseguir formatar
  };

  // Função para buscar número do WhatsApp conectado
  const fetchWhatsAppNumber = async (instanceKey: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/mega/status?instanceKey=${instanceKey}`);
      if (response.ok) {
        const result = await response.json();
        if (result.ok && result.data?.instance?.user?.id) {
          return result.data.instance.user.id;
        }
      }
    } catch (error) {
      console.error('Erro ao buscar número do WhatsApp:', error);
    }
    return null;
  };

  // Função para verificar status da instância periodicamente
  const checkInstanceStatus = async (instanceKey: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/mega/status?instanceKey=${instanceKey}`);

      if (response.ok) {
        const result = await response.json();
        console.log('📊 Status da instância:', result.data?.instance?.status);
        
        if (result.ok && result.data?.instance?.status === 'connected') {
          console.log('✅ WhatsApp conectado! Fechando QR Code...');
          setShowQRModal(false);
          await updateConnectionStatusAfterQR(instanceKey);
          return true;
        }
      } else {
        console.error('❌ Erro ao verificar status:', response.status);
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
      console.log('🔄 Atualizando status da conexão após QR Code:', instanceKey);
      
      // Atualizar status na api_connections para 'active' quando conecta
      const response = await fetch('/api/update-instance-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey: instanceKey,
          status: 'active' // Status para api_connections quando conecta
        }),
      });

      const result = await response.json();

      if (result.ok) {
        console.log('✅ Status da conexão atualizado:', result);
        toast.success('WhatsApp conectado com sucesso!');
        await loadConnections(); // Recarregar lista
      } else {
        console.error('❌ Erro ao atualizar status:', result.error);
        toast.error('Erro ao atualizar status da conexão');
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status da conexão');
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
    if (!user) {
      console.error('❌ Usuário não está logado');
      toast.error('Você precisa estar logado para criar uma instância');
      return;
    }
    
    console.log('👤 Usuário logado:', {
      id: user.id,
      email: user.email,
      organization_id: (user as any).organization_id
    });
    
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
          organizationId: (user as any).organization_id || user.id
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
      
      const response = await fetch(`/api/mega/qrcode?instanceKey=${instanceKey}`);
      
      console.log('📡 Resposta do QR Code:', {
        status: response.status,
        statusText: response.statusText
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Resposta do QR Code:', result);
        
        if (result.ok && result.qrcode) {
          setQrCodeData(result.qrcode);
          console.log('📱 QR Code recebido com sucesso!');
          toast.success('📱 QR Code gerado! Escaneie com seu WhatsApp');
        } else {
          console.error('❌ QR Code não gerado:', result);
          toast.error('❌ QR Code não disponível: ' + (result.error || 'Erro desconhecido'));
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Erro ao gerar QR Code:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        toast.error('❌ Erro ao gerar QR Code: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('❌ Erro ao gerar QR Code:', error);
      toast.error('❌ Erro ao gerar QR Code: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      if (!isMounted) return;
      
        console.log('🔄 useEffect executado - carregando dados iniciais');
        
        try {
        // Forçar reload das conexões para garantir dados atualizados
          await loadConnections();
        await loadInstances();
        
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
      
      // Buscar instâncias WhatsApp da tabela whatsapp_instances (PRINCIPAL)
      const instancesResponse = await fetch(`/api/list-instances?t=${Date.now()}`);
      
      console.log('🔍 [DEBUG] Resposta da API list-instances:', {
        status: instancesResponse.status,
        ok: instancesResponse.ok
      });
      
      let allConnections: ApiConnection[] = [];
      
      if (instancesResponse.ok) {
        const instancesData = await instancesResponse.json();
        console.log('📱 [DEBUG] Dados completos da API:', instancesData);
        console.log('📱 Instâncias WhatsApp encontradas:', instancesData.instances?.length || 0);
        
        // Buscar conexões da tabela api_connections para verificar status de conexão (com timestamp para evitar cache)
        const connectionsResponse = await fetch(`/api/connections-v2?t=${Date.now()}`);
        let apiConnections: any[] = [];
        
        if (connectionsResponse.ok) {
          const connectionsData = await connectionsResponse.json();
          apiConnections = connectionsData.data || [];
          console.log('🔗 [DEBUG] Conexões API encontradas:', apiConnections.length);
        }
        
        // Converter instâncias WhatsApp para formato de conexões
        const whatsappConnections = await Promise.all((instancesData.instances || []).map(async (instance: any) => {
          // Verificar se existe uma conexão ativa correspondente na api_connections
          const correspondingConnection = apiConnections.find(conn => {
            const matchByInstanceId = conn.instance_id === instance.instance_key;
            const matchByName = conn.name?.includes(instance.instance_key);
            // Log apenas se não encontrar correspondência
            if (!matchByInstanceId && !matchByName) {
              console.log(`⚠️ [DEBUG] Nenhuma correspondência encontrada para ${instance.instance_key}:`, {
                conn_instance_id: conn.instance_id,
                conn_name: conn.name
              });
            }
            return matchByInstanceId || matchByName;
          });
          
          // Log resumido da correspondência
          console.log(`🔍 [DEBUG] ${instance.instance_key}:`, {
            found_corresponding: !!correspondingConnection,
            corresponding_status: correspondingConnection?.status || 'none'
          });
          
          // Determinar status baseado em ambas as tabelas
          let finalStatus = 'disconnected';
          if (instance.status === 'ativo') {
            if (correspondingConnection && correspondingConnection.status === 'active') {
              finalStatus = 'connected'; // WhatsApp conectado via QR Code
            } else {
              finalStatus = 'active'; // Instância ativa mas não conectada
            }
          }
          
          console.log(`✅ [DEBUG] ${instance.instance_key}: ${instance.status} + ${correspondingConnection?.status || 'none'} = ${finalStatus}`);
          
          // Buscar número do WhatsApp se estiver conectado
          let whatsappNumber = null;
          if (finalStatus === 'connected') {
            whatsappNumber = await fetchWhatsAppNumber(instance.instance_key);
          }
          
          return {
            id: instance.id,
            name: instance.instance_key,
            type: 'whatsapp_disparai',
            status: finalStatus,
            instance_key: instance.instance_key,
            createdAt: instance.created_at,
            lastUsed: instance.updated_at,
            messageCount: 0,
            monthlyLimit: 1000,
            is_whatsapp_instance: true,
            whatsapp_status: instance.status,
            api_connection_status: correspondingConnection?.status,
            webhook_url: instance.webhook_url,
            whatsapp_number: whatsappNumber
          };
        }));
        
        console.log('🔄 [DEBUG] Conexões WhatsApp convertidas:', whatsappConnections);
        
        allConnections = whatsappConnections;
        console.log('🔄 [DEBUG] Apenas instâncias WhatsApp (sem duplicatas):', allConnections);
      }
      
      setConnections(allConnections);
      console.log('📋 Total de conexões carregadas:', allConnections.length);
      console.log('📋 [DEBUG] Estado das conexões após setState:', allConnections);
      
    } catch (error) {
      console.error('Error loading connections:', error);
      setConnections([]);
    } finally {
      setIsLoading(false);
      console.log('✅ [DEBUG] Loading definido como false');
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

  // Função para conectar instância existente (gerar QR Code)
  const handleConnectInstance = async (connection: any) => {
    try {
      console.log('🔗 Conectando instância:', connection.instance_key);
      
      setCurrentInstanceKey(connection.instance_key);
      setShowQRModal(true);
      
      // Gerar QR Code
      await generateQRCode(connection.instance_key);
      
      // Iniciar verificação de status
      startStatusPolling(connection.instance_key);
      
    } catch (error) {
      console.error('Erro ao conectar instância:', error);
      toast.error('Erro ao conectar instância');
    }
  };

  // Função para desconectar instância
  const handleDisconnectInstance = async (connection: any) => {
    try {
      console.log('🔌 Desconectando instância:', connection.instance_key);
      
      // Atualizar status na api_connections para 'pending'
      const response = await fetch('/api/update-instance-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceKey: connection.instance_key,
          status: 'pending'
        }),
      });

      if (response.ok) {
        toast.success('Instância desconectada com sucesso!');
        await loadConnections(); // Recarregar lista
      } else {
        toast.error('Erro ao desconectar instância');
      }
      
    } catch (error) {
      console.error('Erro ao desconectar instância:', error);
      toast.error('Erro ao desconectar instância');
    }
  };

  // Função para copiar webhook URL
  const handleCopyWebhook = async (webhookUrl: string) => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success('Webhook copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar webhook:', error);
      toast.error('Erro ao copiar webhook');
    }
  };

  // Filtrar conexões por tipo
  const disparaiConnections = connections.filter(conn => conn.type === 'whatsapp_disparai');
  const cloudConnections = connections.filter(conn => conn.type === 'whatsapp_cloud');
  
  console.log('🔍 [DEBUG] Conexões Disparai filtradas:', disparaiConnections);
  console.log('🔍 [DEBUG] Conexões Cloud filtradas:', cloudConnections);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'active':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'disconnected':
      case 'inactive':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: string, connection?: any) => {
    switch (status) {
      case 'connected':
        return (
          <div className="flex flex-col items-center space-y-1">
            <Badge className="bg-green-100 text-green-800 border-green-200">WhatsApp Conectado</Badge>
            {connection?.whatsapp_number && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {formatWhatsAppNumber(connection.whatsapp_number)}
              </span>
            )}
          </div>
        );
      case 'active':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">Instância Ativa</Badge>
        );
      case 'disconnected':
      case 'inactive':
        return (
          <div className="flex flex-col items-center space-y-1">
            <Badge className="bg-red-100 text-red-800 border-red-200">Desconectado</Badge>
            <span className="text-xs text-red-600">⚠️ Conecte um WhatsApp</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center space-y-1">
            <Badge className="bg-red-100 text-red-800 border-red-200">Erro</Badge>
            <span className="text-xs text-red-600">❌ Verifique a conexão</span>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center space-y-1">
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>
            <span className="text-xs text-yellow-600">⏳ Aguardando...</span>
          </div>
        );
    }
  };

  // Função para botões de ação baseados no status
  const getActionButtons = (connection: any) => {
    const buttons = [];

    switch (connection.status) {
      case 'connected':
        // Conectado: mostrar botão Desconectar
        buttons.push(
          <Button
            key="disconnect"
            variant="outline"
            size="sm"
            onClick={() => handleDisconnectInstance(connection)}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Desconectar WhatsApp
          </Button>
        );
        break;
        
      case 'active':
        // Ativo: mostrar botão Conectar (QR Code)
        buttons.push(
          <Button
            key="connect"
            variant="outline"
            size="sm"
            onClick={() => handleConnectInstance(connection)}
            className="text-green-600 border-green-200 hover:bg-green-50"
          >
            Conectar WhatsApp
          </Button>
        );
        break;
        
      case 'disconnected':
        // Desconectado: mostrar botões Conectar e Deletar
        buttons.push(
          <Button
            key="connect"
            variant="outline"
            size="sm"
            onClick={() => handleConnectInstance(connection)}
            className="text-green-600 border-green-200 hover:bg-green-50"
          >
            Conectar WhatsApp
          </Button>
        );
        break;
    }

    // Sempre mostrar botão Deletar (exceto quando conectado)
    if (connection.status !== 'connected') {
      buttons.push(
        <Button
          key="delete"
          variant="outline"
          size="sm"
          onClick={() => handleDeleteConnection(connection.id)}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          Cancelar Instância
        </Button>
      );
    }

    return buttons;
  };

  console.log('🔄 [DEBUG] Estado do componente - isLoading:', isLoading, 'connections:', connections.length);

  if (isLoading) {
    console.log('🔄 [DEBUG] Mostrando tela de loading');
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
          <h2 className="text-2xl font-semibold text-gray-900">Conexões de API</h2>
          <p className="text-gray-600 mt-1">Gerencie suas integrações com WhatsApp</p>
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
              <div className="space-y-6">
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
          {disparaiConnections.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Conexões WhatsApp</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {disparaiConnections.map((connection) => (
                  <Card key={connection.id} className="border border-gray-200 hover:border-gray-300 transition-colors">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {/* Header com status e ícone */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(connection.status)}
                            <div className="flex flex-col">
                              <h4 className="font-medium text-sm">{connection.name}</h4>
                              <span className="text-xs text-gray-500">
                                Criado em: {new Date(connection.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                          {getStatusBadge(connection.status, connection)}
                        </div>
                        
                        {/* Webhook URL com botão copiar */}
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600 font-medium">Webhook:</p>
                          <div className="flex items-center space-x-2">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                              {connection.webhook_url || 'http://localhost:3000/api/webhooks/whatsapp/...'}
                            </code>
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyWebhook(connection.webhook_url || 'http://localhost:3000/api/webhooks/whatsapp/...')}
                              className="h-6 px-2 text-xs"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Botões de ação */}
                        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                          {getActionButtons(connection)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Zap className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Nenhuma conexão WhatsApp</h3>
                    <p className="text-gray-500 mt-1">
                      Clique em "Conectar WhatsApp" acima para criar sua primeira instância
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
            {cloudConnections.length > 0 ? (
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
                        {getActionButtons(connection)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                        <div>
                    <h3 className="text-lg font-medium text-gray-900">Nenhuma conexão WhatsApp Business</h3>
                    <p className="text-gray-500 mt-1">
                      Clique em "Conectar WhatsApp Business" acima para criar sua primeira conexão
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
          userName={(user as any).full_name || user.email || 'Usuário'}
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
