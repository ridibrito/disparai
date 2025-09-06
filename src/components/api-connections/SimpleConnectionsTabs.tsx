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
  token: string;
  status: 'pendente' | 'ativo' | 'desconectado';
  webhook_url: string;
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
  const checkInstanceStatus = async (instanceKey: string) => {
    try {
      const megaApiToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';
      
      const response = await fetch(`https://teste8.megaapi.com.br/rest/instance/${instanceKey}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${megaApiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Status da instância:', data.instance?.status);
        
        if (data.instance?.status === 'connected') {
          console.log('✅ WhatsApp conectado! Fechando QR Code...');
          
          // Atualizar status no backend
          await updateConnectionStatusAfterQR(instanceKey);
          
          // Fechar modal do QR Code
          setShowQRModal(false);
          setQrCodeData(null);
          setCurrentInstanceKey(null);
          
          toast.success('🎉 WhatsApp conectado automaticamente!');
          return true; // Conectado
        }
      }
      
      return false; // Ainda não conectado
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      return false;
    }
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
          instance_key: instanceKey,
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
    if (!user) return;
    
    setIsLoadingInstances(true);
    try {
      const megaApiToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';
      
      const response = await fetch('https://teste8.megaapi.com.br/rest/instance/list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${megaApiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data && Array.isArray(result.data)) {
          setInstances(result.data);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
    } finally {
      setIsLoadingInstances(false);
    }
  };

  // Função para criar nova instância no servidor MegaAPI
  const createNewInstance = async () => {
    if (!user) return;
    
    setIsCreatingInstance(true);
    setShowProgressModal(true);
    setProgressStep(0);
    
    try {
      const megaApiToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';
      const instanceKey = `disparai_${Date.now()}`;
      const webhookUrl = `${window.location.origin}/api/webhook/whatsapp`;
      
      // Armazenar o instanceKey para uso posterior
      setCurrentInstanceKey(instanceKey);
      
      console.log('🔍 Debug - webhookUrl:', webhookUrl);
      console.log('🔍 Debug - instanceKey:', instanceKey);
      
      // Etapa 1: Criando instância
      updateProgress(1, 'Criando nova instância Disparai no servidor...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay visual
      
      console.log('🚀 Verificando/Criando instância no MegaAPI:', {
        url: `https://teste8.megaapi.com.br/rest/instance/init?instance_key=${instanceKey}`,
        instanceKey: instanceKey,
        webhook: webhookUrl,
        body: {
          messageData: {
            webhookUrl: webhookUrl,
            webhookEnabled: true
          }
        }
      });
      
      // Passo 1: Criar instância no MegaAPI
      console.log('📝 Criando instância no MegaAPI...');
      const createResponse = await fetch(`https://teste8.megaapi.com.br/rest/instance/init?instance_key=${instanceKey}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${megaApiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageData: {
            webhookUrl: webhookUrl,
            webhookEnabled: true
          }
        })
      });

      console.log('📡 Resposta da criação:', {
        status: createResponse.status,
        statusText: createResponse.statusText
      });
      
      if (createResponse.ok) {
        const createResult = await createResponse.json();
        console.log('✅ Instância criada com sucesso:', createResult);
        updateProgress(2, 'Instância criada com sucesso!');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Etapa 2: Salvando instância WhatsApp
        updateProgress(3, 'Salvando instância WhatsApp no banco...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const whatsappInstanceResponse = await fetch('/api/create-whatsapp-instance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            instanceName: instanceKey
          })
        });
        
        if (whatsappInstanceResponse.ok) {
          const whatsappResult = await whatsappInstanceResponse.json();
          console.log('✅ Instância WhatsApp salva:', whatsappResult);
          updateProgress(4, 'Instância WhatsApp salva!');
        } else {
          const errorText = await whatsappInstanceResponse.text();
          console.error('❌ Erro ao salvar instância WhatsApp:', {
            status: whatsappInstanceResponse.status,
            statusText: whatsappInstanceResponse.statusText,
            error: errorText
          });
          updateProgress(4, 'Erro ao salvar instância - verifique os logs');
        }
      } else {
        // Erro na criação da instância no MegaAPI
        const errorText = await createResponse.text();
        console.error('❌ Erro ao criar instância no MegaAPI:', {
          status: createResponse.status,
          statusText: createResponse.statusText,
          error: errorText
        });
        updateProgress(2, 'Erro ao criar instância - verifique os logs');
        toast.error('Erro ao criar instância no servidor');
        return;
      }
        
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Etapa 3: Gerando QR Code
        updateProgress(5, 'Gerando QR Code para conectar WhatsApp...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('📱 Gerando QR Code para instância:', instanceKey);
        await generateQRCode(instanceKey);
        
        // Etapa 4: Finalizando
        updateProgress(6, 'Instância criada! Leia o QR Code e comece a disparar!');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setShowProgressModal(false);
        toast.success('🎉 Instância criada com sucesso!');
    } catch (error) {
      updateProgress(0, 'Erro inesperado. Tente novamente.');
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowProgressModal(false);
      toast.error('Erro ao criar instância no servidor');
    } finally {
      setIsCreatingInstance(false);
    }
  };

  // Função para gerar QR Code
  const generateQRCode = async (instanceKey: string) => {
    try {
      const megaApiToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';
      
      console.log('🔍 Fazendo requisição para QR Code:', `https://teste8.megaapi.com.br/rest/instance/qrcode_base64/${instanceKey}`);
      
      const response = await fetch(`https://teste8.megaapi.com.br/rest/instance/qrcode_base64/${instanceKey}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${megaApiToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Resposta do QR Code:', {
        status: response.status,
        statusText: response.statusText
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Resposta do QR Code:', result);
        
        if (result.qrcode) {
          console.log('📱 QR Code recebido com sucesso!');
          setQrCodeData(result.qrcode);
          setShowQRModal(true);
          setCurrentInstanceKey(instanceKey);
          toast.success('📱 QR Code gerado! Escaneie com seu WhatsApp');
          
          // Iniciar verificação periódica do status
          startStatusPolling(instanceKey);
        } else {
          console.log('❌ QR Code não encontrado na resposta:', result);
          toast.error('❌ QR Code não disponível');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Erro ao gerar QR Code:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        toast.error('❌ Erro ao gerar QR Code');
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast.error('❌ Erro ao gerar QR Code');
    }
  };

  // Função para desconectar instância
  const handleDisconnect = async (instanceKey: string) => {
    try {
      const megaApiToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';
      
      const response = await fetch(`https://teste8.megaapi.com.br/rest/instance/logout/${instanceKey}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${megaApiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Instância desconectada com sucesso!');
        // Recarregar instâncias
        await loadInstances();
      } else {
        toast.error('Erro ao desconectar instância');
      }
    } catch (error) {
      console.error('Erro ao desconectar instância:', error);
      toast.error('Erro ao desconectar instância');
    }
  };

  // Carregar conexões e instâncias ao montar o componente
  useEffect(() => {
    let isMounted = true;
    let hasLoaded = false;
    
    const loadData = async () => {
      if (isMounted && !hasLoaded) {
        hasLoaded = true;
        console.log('🔄 useEffect executado - carregando dados iniciais');
        
        // Carregar instâncias primeiro
        await loadInstances();
        try {
          await loadConnections();
        } catch (error) {
          console.error('Erro ao carregar dados iniciais:', error);
        } finally {
          if (isMounted) {
            setIsLoading(false); // Garantir que sempre saia do loading
            setIsInitialized(true);
          }
        }
      }
    };
    
    loadData();
    
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
        await loadConnections();
      } else {
        toast.error(data.error || 'Erro ao criar conexão');
      }
    } catch (error) {
      console.error('Error saving connection:', error);
      toast.error('Erro ao salvar conexão');
    }
  };

  const handleConnected = async () => {
    toast.success('WhatsApp conectado com sucesso!');
    
    // Configurar webhook automaticamente após conectar
    try {
      const instanceKey = 'disparai'; // Usar a instância padrão
      const webhookUrl = `${window.location.origin}/api/webhook/whatsapp`;
      
      console.log('🔗 Configurando webhook automaticamente...');
      
      const response = await fetch(`https://teste8.megaapi.com.br/rest/webhook/${instanceKey}`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webhookUrl: webhookUrl
        })
      });
      
      const result = await response.json();
      console.log('📡 Resposta da configuração automática do webhook:', result);
      
      if (!result.error) {
        toast.success('Webhook configurado automaticamente!');
        console.log('✅ Webhook configurado automaticamente:', webhookUrl);
      } else {
        console.log('⚠️ Webhook não configurado automaticamente:', result.message);
      }
    } catch (error) {
      console.log('⚠️ Erro ao configurar webhook automaticamente:', error);
    }
    
    loadConnections();
    setShowDisparaiConnection(false);
    setQrCodeData(null); // Limpar QR Code
    setShowQRModal(false); // Fechar modal
  };

  const handleCloseQRModal = () => {
    setShowQRModal(false);
    setQrCodeData(null);
  };

  const handleConnectInstance = async (instance: WhatsAppInstance) => {
    try {
      console.log('🔗 Conectando instância:', instance.instance_key);
      
      const megaApiToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';
      
      // Gerar QR Code
      const qrResponse = await fetch(`https://teste8.megaapi.com.br/rest/instance/qrcode/${instance.instance_key}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${megaApiToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const qrResult = await qrResponse.json();
      
      if (qrResult.error) {
        toast.error('Erro ao gerar QR Code: ' + qrResult.message);
        return;
      }
      
      if (qrResult.qrcode) {
        setQrCodeData(qrResult.qrcode);
        setShowQRModal(true);
        toast.success('QR Code gerado com sucesso!');
      } else {
        toast.error('QR Code não foi gerado');
      }
      
    } catch (error: any) {
      console.error('Erro ao conectar instância:', error);
      toast.error('Erro ao conectar instância: ' + error.message);
    }
  };

  const handleEditInstance = async (instance: WhatsAppInstance) => {
    toast.success('Função de edição será implementada em breve');
  };

  const handleDisconnectInstance = async (instance: WhatsAppInstance) => {
    try {
      console.log('🔌 Desconectando instância:', instance.instance_key);
      
      const megaApiToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs';
      
      // Desconectar instância
      const disconnectResponse = await fetch(`https://teste8.megaapi.com.br/rest/instance/${instance.instance_key}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${megaApiToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const disconnectResult = await disconnectResponse.json();
      
      if (disconnectResult.error) {
        toast.error('Erro ao desconectar: ' + disconnectResult.message);
        return;
      }
      
      toast.success('Instância desconectada com sucesso!');
      loadInstances(); // Recarregar lista
      
    } catch (error: any) {
      console.error('Erro ao desconectar instância:', error);
      toast.error('Erro ao desconectar instância: ' + error.message);
    }
  };

  const handleConfigureWebhook = async (connection: ApiConnection) => {
    try {
      const instanceKey = connection.instanceId || 'disparai';
      console.log('🔗 Configurando webhook para instância:', instanceKey);
      
      // URL do webhook (você pode configurar isso no seu domínio)
      const webhookUrl = `${window.location.origin}/api/webhook/whatsapp`;
      
      // Usar o endpoint correto da MegaAPI
      const response = await fetch(`https://teste8.megaapi.com.br/rest/webhook/${instanceKey}`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webhookUrl: webhookUrl
        })
      });
      
      const result = await response.json();
      console.log('📡 Resposta da configuração do webhook:', result);
      
      if (!result.error) {
        toast.success('Webhook configurado com sucesso!');
        console.log('✅ Webhook configurado:', webhookUrl);
      } else {
        toast.error('Erro ao configurar webhook: ' + (result.message || 'Erro desconhecido'));
        console.error('❌ Erro na configuração:', result);
      }
      
    } catch (error: any) {
      console.error('Erro ao configurar webhook:', error);
      toast.error('Erro ao configurar webhook: ' + error.message);
    }
  };


  const handleConnect = async (connection: ApiConnection) => {
    try {
      const instanceKey = connection.instanceId || 'disparai';
      console.log('🔌 Conectando instância:', instanceKey);
      
      // Gerar QR Code para conectar a instância
      const response = await fetch(`https://teste8.megaapi.com.br/rest/instance/qrcode/${instanceKey}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNC8wOS8yMDI1IiwibmFtZSI6IlRlc3RlIDgiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzU3MTAyOTU0fQ.R-h4NQDJBVnxlyInlC51rt_cW9_S3A1ZpffqHt-GWBs',
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      console.log('🔍 Resposta da API:', result);
      
      if (!result.error && result.qrcode) {
        console.log('✅ QR Code recebido:', result.qrcode.substring(0, 50) + '...');
        toast.success('QR Code gerado! Escaneie para conectar o WhatsApp.');
        // Armazenar o QR Code e abrir o modal
        // A API já retorna com o prefixo data:image/png;base64,
        setQrCodeData(result.qrcode);
        setShowQRModal(true);
      } else {
        toast.error('Erro ao gerar QR Code: ' + (result.message || 'Erro desconhecido'));
      }
    } catch (error: any) {
      console.error('Erro ao conectar:', error);
      toast.error('Erro ao conectar: ' + error.message);
    }
  };

  const handleEdit = (connection: ApiConnection) => {
    console.log('✏️ Editando conexão:', connection.id);
    toast.success('Funcionalidade de edição será implementada em breve');
  };


  // Filtrar conexões por tipo
  const disparaiConnections = connections.filter(conn => conn.type === 'whatsapp_disparai');
  const cloudConnections = connections.filter(conn => conn.type === 'whatsapp_cloud');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" />
          <p className="text-gray-600">Carregando conexões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Conexões API
          </h1>
          <p className="text-gray-600">
            Gerencie suas conexões com WhatsApp Cloud API e API Disparai
          </p>
        </div>


        {/* Navegação das Abas */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => {
                console.log('Clicou em API Disparai');
                setActiveTab('disparai');
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'disparai'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Zap className="w-4 h-4" />
              API Disparai
            </button>
            <button
              onClick={() => {
                console.log('Clicou em Cloud API');
                setActiveTab('cloud');
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'cloud'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Cloud API
            </button>
          </div>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'disparai' && (
          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-900 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  API Disparai (Recomendado)
                </CardTitle>
                <CardDescription className="text-green-700">
                  Conexão automática e simplificada. Apenas escaneie o QR Code para conectar.
                </CardDescription>
              </CardHeader>
             
            </Card>

            {/* Conexão Disparai */}
            {instances.length > 0 || disparaiConnections.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Suas Instâncias WhatsApp
                </h3>
                
                {/* Listar instâncias da MegaAPI */}
                {instances.map((instance) => (
                  <Card key={instance.instance_key}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Zap className="w-5 h-5 text-green-600" />
                          <div>
                            <CardTitle className="text-lg">{instance.instance_key}</CardTitle>
                            <CardDescription>
                              API Disparai • {instance.status}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={instance.status === 'ativo' 
                            ? 'text-green-600 border-green-200' 
                            : instance.status === 'pendente'
                            ? 'text-yellow-600 border-yellow-200'
                            : 'text-red-600 border-red-200'
                          }
                        >
                          {instance.status === 'ativo' ? 'Ativo' : 
                           instance.status === 'pendente' ? 'Pendente' : 'Desconectado'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Status</p>
                          <p className="text-lg font-bold text-gray-900">{instance.status}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Criada em</p>
                          <p className="text-sm text-gray-600">
                            {new Date(instance.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      {/* Botões de ação baseados no status */}
                      <div className="flex gap-2 pt-4 border-t">
                        {instance.status === 'ativo' ? (
                          <>
                            <Button 
                              onClick={() => generateQRCode(instance.instance_key)}
                              size="sm"
                              variant="outline"
                              className="border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Gerar QR Code
                            </Button>
                            <Button 
                              onClick={() => handleDisconnect(instance.instance_key)}
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Desconectar
                            </Button>
                          </>
                        ) : instance.status === 'pendente' ? (
                          <Button 
                            onClick={() => generateQRCode(instance.instance_key)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            Conectar
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => generateQRCode(instance.instance_key)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            Reconectar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Listar conexões do banco de dados */}
                {disparaiConnections.map((connection) => (
                  <Card key={connection.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Zap className="w-5 h-5 text-green-600" />
                          <div>
                            <CardTitle className="text-lg">{connection.name}</CardTitle>
                            <CardDescription>
                              API Disparai • {connection.instanceId}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={connection.status === 'active' 
                            ? 'text-green-600 border-green-200' 
                            : 'text-yellow-600 border-yellow-200'
                          }
                        >
                          {connection.status === 'active' ? 'Conectado' : 'Desconectado'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Mensagens Enviadas</p>
                          <p className="text-2xl font-bold text-gray-900">{connection.messageCount}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Limite Mensal</p>
                          <p className="text-2xl font-bold text-gray-900">{connection.monthlyLimit}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Último Uso</p>
                          <p className="text-sm text-gray-600">
                            {connection.lastUsed 
                              ? new Date(connection.lastUsed).toLocaleDateString('pt-BR')
                              : 'Nunca'
                            }
                          </p>
                        </div>
                      </div>
                      
                      {/* Botões de ação */}
                      <div className="flex gap-2 pt-4 border-t">
                        {connection.status === 'inactive' ? (
                          <Button 
                            onClick={() => handleConnect(connection)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={isCreatingInstance}
                          >
                            {isCreatingInstance ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Zap className="w-4 h-4 mr-2" />
                            )}
                            {isCreatingInstance ? 'Criando...' : 'Conectar'}
                          </Button>
                        ) : (
                          <>
                            <Button 
                              onClick={() => handleEdit(connection)}
                              size="sm"
                              variant="outline"
                            >
                              Editar
                            </Button>
                            <Button 
                              onClick={() => handleConfigureWebhook(connection)}
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <Zap className="w-4 h-4 mr-1" />
                              Webhook
                            </Button>
                            <Button 
                              onClick={() => handleDisconnect(connection.instanceId || 'disparai')}
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              Desconectar
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Mostrar componente de conexão se solicitado */}
                {user && showDisparaiConnection && (
                  <div className="mt-6">
                    <SimpleWhatsAppConnection
                      userId={user.id}
                      userName={user.email || 'Usuário'}
                      qrCodeData={qrCodeData}
                      onConnected={handleConnected}
                      onError={(error) => {
                        toast.error('Erro: ' + error);
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Conecte seu WhatsApp
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Conecte seu WhatsApp para começar a enviar mensagens em massa
                  </p>
                  
                  {/* Botão de conexão destacado */}
                  <div className="mb-6">
                    <Button 
                      onClick={createNewInstance}
                      disabled={isCreatingInstance}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                    >
                      {isCreatingInstance ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <Zap className="w-5 h-5 mr-2" />
                      )}
                      {isCreatingInstance ? 'Conectando...' : 'Conectar WhatsApp'}
                    </Button>
                  </div>
                </div>
                
              </div>
            )}
          </div>
        )}

        {activeTab === 'cloud' && (
          <div className="space-y-6">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp Cloud API (Oficial)
                </CardTitle>
                <CardDescription className="text-blue-700">
                  API oficial do Meta para WhatsApp Business. Requer configuração manual.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-900">Requisitos:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Conta no Meta Business Manager</li>
                        <li>• App criado no Facebook Developers</li>
                        <li>• Token com permissões específicas</li>
                        <li>• Phone Number ID válido</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-900">Características:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• API oficial do Meta</li>
                        <li>• Templates aprovados</li>
                        <li>• Integração com Facebook Business</li>
                        <li>• Relatórios detalhados</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conexões Cloud API */}
            {cloudConnections.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Suas Conexões WhatsApp Cloud API
                </h3>
                {cloudConnections.map((connection) => (
                  <Card key={connection.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <MessageCircle className="w-5 h-5 text-blue-600" />
                          <div>
                            <CardTitle className="text-lg">{connection.name}</CardTitle>
                            <CardDescription>
                              WhatsApp Cloud API • {connection.phoneNumber}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={connection.status === 'active' 
                            ? 'text-green-600 border-green-200' 
                            : 'text-yellow-600 border-yellow-200'
                          }
                        >
                          {connection.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Mensagens Enviadas</p>
                          <p className="text-2xl font-bold text-gray-900">{connection.messageCount}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Limite Mensal</p>
                          <p className="text-2xl font-bold text-gray-900">{connection.monthlyLimit}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Último Uso</p>
                          <p className="text-sm text-gray-600">
                            {connection.lastUsed 
                              ? new Date(connection.lastUsed).toLocaleDateString('pt-BR')
                              : 'Nunca'
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Configurar WhatsApp Cloud API
                </h3>
                <p className="text-gray-600 mb-6">
                  Configure sua conexão com a API oficial do WhatsApp
                </p>
                <Button 
                  onClick={() => {
                    console.log('Clicou em Nova Conexão');
                    setIsModalOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Conexão
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Seção de Instâncias Criadas */}
        {activeTab === 'disparai' && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Instâncias Criadas</h3>
              <Button
                onClick={loadInstances}
                variant="outline"
                size="sm"
                disabled={isLoadingInstances}
              >
                {isLoadingInstances ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Atualizar
              </Button>
            </div>

            {isLoadingInstances ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Carregando instâncias...</span>
              </div>
            ) : instances.length > 0 ? (
              <div className="grid gap-4">
                {instances.map((instance) => (
                  <Card key={instance.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-green-600" />
                            {instance.instance_key}
                          </CardTitle>
                          <CardDescription>
                            Criada em {new Date(instance.created_at).toLocaleString('pt-BR')}
                          </CardDescription>
                        </div>
                        <Badge 
                          className={
                            instance.status === 'ativo' 
                              ? 'bg-green-100 text-green-800' 
                              : instance.status === 'pendente'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {instance.status === 'ativo' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {instance.status === 'pendente' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                          {instance.status === 'desconectado' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {instance.status === 'ativo' ? 'Conectado' : 
                           instance.status === 'pendente' ? 'Pendente' : 'Desconectado'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm">
                            <strong>ID:</strong> {instance.id}
                          </p>
                          <p className="text-sm">
                            <strong>Webhook:</strong> {instance.webhook_url}
                          </p>
                          <p className="text-sm">
                            <strong>Atualizada:</strong> {new Date(instance.updated_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        
                        {/* Botões condicionais baseados no status */}
                        <div className="flex gap-2 flex-wrap">
                          {instance.status === 'desconectado' && (
                            <Button
                              onClick={() => handleConnectInstance(instance)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Zap className="w-4 h-4 mr-2" />
                              Conectar
                            </Button>
                          )}
                          
                          {instance.status === 'ativo' && (
                            <>
                              <Button
                                onClick={() => handleEditInstance(instance)}
                                size="sm"
                                variant="outline"
                              >
                                Editar
                              </Button>
                              <Button
                                onClick={() => handleDisconnectInstance(instance)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                Desconectar
                              </Button>
                            </>
                          )}
                          
                          {instance.status === 'pendente' && (
                            <Button
                              onClick={() => handleConnectInstance(instance)}
                              size="sm"
                              className="bg-yellow-600 hover:bg-yellow-700"
                            >
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Aguardando Conexão
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhuma instância encontrada
                </h3>
                <p className="text-gray-600">
                  Crie uma instância do WhatsApp para vê-la aqui
                </p>
              </div>
            )}
          </div>
        )}

        {/* Modal para WhatsApp Cloud API */}
        <NewConnectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveConnection}
        />

        {/* Modal para QR Code do WhatsApp */}
        <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-600" />
                Conectar WhatsApp
              </DialogTitle>
              <DialogDescription>
                Escaneie o QR Code abaixo com seu WhatsApp para conectar a instância.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center space-y-4">
              {qrCodeData ? (
                <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                  <img 
                    src={qrCodeData} 
                    alt="QR Code para conectar WhatsApp"
                    className="w-64 h-64 mx-auto"
                    onLoad={() => console.log('✅ QR Code carregado com sucesso')}
                    onError={(e) => console.error('❌ Erro ao carregar QR Code:', e)}
                  />
                </div>
              ) : (
                <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}
              
              <div className="text-center text-sm text-gray-600">
                <p>1. Abra o WhatsApp no seu celular</p>
                <p>2. Toque em <strong>Menu</strong> ou <strong>Configurações</strong></p>
                <p>3. Toque em <strong>Dispositivos conectados</strong></p>
                <p>4. Toque em <strong>Conectar um dispositivo</strong></p>
                <p>5. Escaneie este QR Code</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  ⏳ O modal fechará automaticamente quando o WhatsApp conectar
                </p>
                <Button 
                  onClick={handleCloseQRModal}
                  variant="outline"
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Progresso */}
        <Dialog open={showProgressModal} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                Criando Instância WhatsApp
              </DialogTitle>
              <DialogDescription>
                Aguarde enquanto configuramos sua instância...
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Barra de Progresso */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span>{Math.round((progressStep / 6) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(progressStep / 6) * 100}%` }}
                  />
                </div>
              </div>

              {/* Etapas */}
              <div className="space-y-3">
                {[
                  { step: 1, text: 'Criando nova instância Disparai no servidor...', icon: '🚀' },
                  { step: 2, text: 'Instância criada com sucesso!', icon: '✅' },
                  { step: 3, text: 'Salvando instância WhatsApp no banco...', icon: '💾' },
                  { step: 4, text: 'Instância WhatsApp salva!', icon: '✅' },
                  { step: 5, text: 'Gerando QR Code para conectar WhatsApp...', icon: '📱' },
                  { step: 6, text: 'Instância criada! Leia o QR Code e comece a disparar!', icon: '🎉' }
                ].map((item, index) => (
                  <div 
                    key={item.step}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                      progressStep >= item.step 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className={`text-lg ${progressStep >= item.step ? 'opacity-100' : 'opacity-50'}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        progressStep >= item.step ? 'text-green-800' : 'text-gray-600'
                      }`}>
                        {item.text}
                      </p>
                    </div>
                    {progressStep > item.step && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {progressStep === item.step && (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    )}
                  </div>
                ))}
              </div>

              {/* Mensagem Atual */}
              {progressMessage && (
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium">{progressMessage}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
