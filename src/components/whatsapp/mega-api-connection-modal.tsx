'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle, AlertCircle, QrCode, Zap, Smartphone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { WhatsAppLoading } from '@/components/ui/whatsapp-loading';

interface MegaApiConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (connection: any) => void;
}

export default function MegaApiConnectionModal({ 
  isOpen, 
  onClose, 
  onConnected 
}: MegaApiConnectionModalProps) {
  const { user } = useAuth();
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentInstanceKey, setCurrentInstanceKey] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'connecting'>('disconnected');

  // Função para atualizar progresso
  const updateProgress = (step: number, message: string) => {
    setProgressStep(step);
    setProgressMessage(message);
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

  // Função para verificar status da conexão
  const checkConnectionStatus = async (instanceKey: string) => {
    setIsCheckingStatus(true);
    try {
      console.log('🔍 Verificando status da instância:', instanceKey);
      
      const response = await fetch(`/api/mega/get-instance-status?instanceKey=${instanceKey}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📊 Status da instância:', result);
        
        if (result.success && result.data?.instance) {
          const status = result.data.instance.status;
          
          if (status === 'connected') {
            setConnectionStatus('connected');
            toast.success('WhatsApp conectado com sucesso!');
            onConnected({
              type: 'whatsapp_disparai',
              status: 'connected',
              instance_key: instanceKey,
              name: result.data.instance.instanceName || 'Instância Disparai'
            });
            setShowQRModal(false);
            onClose();
          } else if (status === 'disconnected') {
            setConnectionStatus('disconnected');
          } else {
            setConnectionStatus('connecting');
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Função para iniciar polling de status
  const startStatusPolling = (instanceKey: string) => {
    const interval = setInterval(() => {
      checkConnectionStatus(instanceKey);
    }, 3000);

    // Limpar interval após 5 minutos
    setTimeout(() => {
      clearInterval(interval);
    }, 300000);
  };

  // Limpar estados quando modal fecha
  useEffect(() => {
    if (!isOpen) {
      setQrCodeData(null);
      setShowQRModal(false);
      setCurrentInstanceKey(null);
      setConnectionStatus('disconnected');
      setProgressStep(0);
      setProgressMessage('');
    }
  }, [isOpen]);

  return (
    <>
      {/* Modal Principal */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-500" />
              Conectar WhatsApp - Disparai API
            </DialogTitle>
            <DialogDescription>
              Conecte seu WhatsApp usando a Disparai API (Mega API)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações sobre a conexão */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-900 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Disparai API (Mega API)
                </CardTitle>
                <CardDescription className="text-green-700">
                  Conecte seu WhatsApp para enviar mensagens em massa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Conexão Automática
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-green-900">Recursos incluídos:</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Mensagens ilimitadas</li>
                      <li>• Envio de mídia (imagens, vídeos, documentos)</li>
                      <li>• Conexão automática e segura</li>
                      <li>• Pronto para usar em segundos</li>
                      <li>• Suporte 24/7</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botão de conexão */}
            <div className="flex justify-center">
              <Button
                onClick={createNewInstance}
                disabled={isCreatingInstance}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
              >
                {isCreatingInstance ? (
                  <>
                    <WhatsAppLoading size="sm" />
                    Criando Instância...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Conectar WhatsApp
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Progresso */}
      <Dialog open={showProgressModal} onOpenChange={() => {}}>
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
                style={{ width: `${(progressStep / 5) * 100}%` }}
              />
            </div>
            <div className="text-center text-sm text-gray-600">
              Etapa {progressStep} de 5
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de QR Code */}
      <Dialog open={showQRModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-green-500" />
              Escaneie o QR Code
            </DialogTitle>
            <DialogDescription>
              Abra o WhatsApp no seu celular e escaneie o código abaixo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {qrCodeData ? (
              <div className="flex justify-center">
                <img 
                  src={qrCodeData} 
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64 border border-gray-200 rounded-lg"
                />
              </div>
            ) : (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            )}
            
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Status: <span className="font-medium">{connectionStatus === 'connected' ? 'Conectado' : 'Aguardando conexão...'}</span>
              </p>
              
              {isCheckingStatus && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <WhatsAppLoading size="sm" />
                  Verificando conexão...
                </div>
              )}
            </div>
            
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowQRModal(false);
                  onClose();
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => currentInstanceKey && checkConnectionStatus(currentInstanceKey)}
                disabled={isCheckingStatus}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isCheckingStatus ? (
                  <WhatsAppLoading size="sm" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Verificar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
