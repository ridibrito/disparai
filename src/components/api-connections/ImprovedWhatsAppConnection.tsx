'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  QrCode,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

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

interface ConnectionData {
  connectionId?: string;
  instanceKey?: string;
  status: string;
  qrCode?: string;
}

export default function ImprovedWhatsAppConnection() {
  const { user } = useAuth();
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [currentInstanceKey, setCurrentInstanceKey] = useState<string | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  // Função para atualizar progresso
  const updateProgress = (step: number, message: string) => {
    setProgressStep(step);
    setProgressMessage(message);
  };

  // Carregar instâncias do Supabase
  const loadInstances = async () => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao carregar instâncias:', error);
        toast.error('Erro ao carregar instâncias');
        return;
      }
      
      setInstances(data || []);
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
      toast.error('Erro ao carregar instâncias');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para criar nova instância usando a API melhorada
  const createNewInstance = async () => {
    if (!user) return;
    
    setIsCreatingInstance(true);
    setShowProgressModal(true);
    setProgressStep(0);
    
    try {
      // Buscar organization_id do usuário
      const supabase = createClient();
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      
      const organizationId = userData?.organization_id || 'default-org';
      
      // Etapa 1: Criando instância
      updateProgress(1, 'Criando nova instância Disparai no servidor...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay visual
      
      // Usar a API melhorada que evita duplicações
      const createResponse = await fetch('/api/create-whatsapp-instance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationId: organizationId
        })
      });
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('❌ Erro ao criar instância:', errorText);
        updateProgress(2, 'Erro ao criar instância - verifique os logs');
        toast.error('Erro ao criar instância no servidor');
        return;
      }
      
      const createResult = await createResponse.json();
      console.log('✅ Instância criada/verificada:', createResult);
      
      if (createResult.already_exists) {
        updateProgress(2, 'Instância já existe - verificando status...');
        toast.info('Instância já existe, verificando status...');
      } else {
        updateProgress(2, 'Instância criada com sucesso!');
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Armazenar o instanceKey para uso posterior
      setCurrentInstanceKey(createResult.instance_key);
      
      // Etapa 3: Gerando QR Code
      updateProgress(3, 'Gerando QR Code para conectar WhatsApp...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('📱 Gerando QR Code para instância:', createResult.instance_key);
      await generateQRCode(createResult.instance_key);
      
      // Etapa 4: Finalizando
      updateProgress(4, 'Instância pronta! Leia o QR Code e comece a disparar!');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setShowProgressModal(false);
      toast.success('🎉 Instância pronta!');
      
      // Recarregar instâncias
      await loadInstances();
    } catch (error) {
      updateProgress(0, 'Erro inesperado. Tente novamente.');
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowProgressModal(false);
      toast.error('Erro ao criar instância no servidor');
    } finally {
      setIsCreatingInstance(false);
    }
  };

  // Função para gerar QR Code usando a nova API
  const generateQRCode = async (instanceKey: string) => {
    try {
      console.log('🔍 Gerando QR Code via API:', instanceKey);
      
      const response = await fetch('/api/generate-qr-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceKey: instanceKey
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ QR Code gerado:', result);
        
        if (result.success && result.qr_code) {
          console.log('📱 QR Code recebido com sucesso!');
          setQrCodeData(result.qr_code);
          setShowQRModal(true);
          toast.success('📱 QR Code gerado! Escaneie com seu WhatsApp');
        } else {
          console.log('❌ QR Code não gerado:', result);
          toast.error('❌ QR Code não disponível: ' + (result.error || 'Erro desconhecido'));
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Erro ao gerar QR Code:', errorText);
        toast.error('❌ Erro ao gerar QR Code: ' + errorText);
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast.error('❌ Erro ao gerar QR Code: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  // Função para verificar status da instância
  const checkInstanceStatus = async (instanceKey: string) => {
    try {
      const response = await fetch('/api/check-instance-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceKey: instanceKey
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ Status verificado:', result.status);
          // Recarregar instâncias para atualizar o status
          await loadInstances();
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  // Função para conectar instância existente
  const handleConnectInstance = async (instance: WhatsAppInstance) => {
    setCurrentInstanceKey(instance.instance_key);
    await generateQRCode(instance.instance_key);
  };

  // Carregar instâncias ao montar o componente
  useEffect(() => {
    loadInstances();
  }, []);

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'desconectado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativo':
        return <CheckCircle className="w-4 h-4" />;
      case 'pendente':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'desconectado':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando instâncias...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Conexão WhatsApp Disparai</h2>
          <p className="text-gray-600">Conecte seu WhatsApp de forma simples e rápida</p>
        </div>
        <Button
          onClick={createNewInstance}
          disabled={isCreatingInstance}
          className="bg-green-600 hover:bg-green-700"
        >
          {isCreatingInstance ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Conectar WhatsApp
        </Button>
      </div>

      {/* Lista de instâncias */}
      <div className="grid gap-4">
        {instances.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Zap className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma instância encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                Conecte seu WhatsApp para começar a enviar mensagens
              </p>
              <Button
                onClick={createNewInstance}
                disabled={isCreatingInstance}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Conectar WhatsApp
              </Button>
            </CardContent>
          </Card>
        ) : (
          instances.map((instance) => (
            <Card key={instance.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-green-600" />
                      {instance.instance_key}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Criada em {new Date(instance.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Badge className={getStatusColor(instance.status)}>
                    {getStatusIcon(instance.status)}
                    <span className="ml-1 capitalize">{instance.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {instance.status === 'ativo' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateQRCode(instance.instance_key)}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <QrCode className="w-4 h-4 mr-1" />
                        Novo QR Code
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => checkInstanceStatus(instance.instance_key)}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Verificar Status
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleConnectInstance(instance)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Conectar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal para QR Code */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-green-600" />
              Conectar WhatsApp
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR Code abaixo com seu WhatsApp para conectar a instância
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4">
            {qrCodeData ? (
              <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                <img 
                  src={qrCodeData} 
                  alt="QR Code para conectar WhatsApp"
                  className="w-64 h-64 mx-auto"
                />
              </div>
            ) : (
              <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            )}
            
            <div className="text-center text-sm text-gray-600">
              <p><strong>Como conectar:</strong></p>
              <p>1. Abra o WhatsApp no seu celular</p>
              <p>2. Toque em <strong>Menu</strong> ou <strong>Configurações</strong></p>
              <p>3. Toque em <strong>Dispositivos conectados</strong></p>
              <p>4. Toque em <strong>Conectar um dispositivo</strong></p>
              <p>5. Escaneie este QR Code</p>
            </div>
            
            <div className="flex gap-2 w-full">
              <Button 
                variant="outline" 
                onClick={() => setShowQRModal(false)}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Fechar
              </Button>
              <Button 
                onClick={() => {
                  setShowQRModal(false);
                  if (currentInstanceKey) {
                    checkInstanceStatus(currentInstanceKey);
                  }
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Conectado
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
              <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
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
                <span>{Math.round((progressStep / 4) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(progressStep / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Etapas */}
            <div className="space-y-3">
              {[
                { step: 1, text: 'Criando nova instância Disparai no servidor...', icon: '🚀' },
                { step: 2, text: 'Instância criada/verificada com sucesso!', icon: '✅' },
                { step: 3, text: 'Gerando QR Code para conectar WhatsApp...', icon: '📱' },
                { step: 4, text: 'Instância pronta! Leia o QR Code e comece a disparar!', icon: '🎉' }
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
                    <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
                  )}
                </div>
              ))}
            </div>

            {/* Mensagem Atual */}
            {progressMessage && (
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 font-medium">{progressMessage}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
