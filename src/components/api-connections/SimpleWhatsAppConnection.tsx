'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle, AlertCircle, Smartphone, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SimpleWhatsAppConnectionProps {
  userId: string;
  userName: string;
  onConnected?: () => void;
  onError?: (error: string) => void;
}

interface ConnectionData {
  connectionId: string;
  instanceKey: string;
  status: string;
  qrCode?: string;
  nextStep: string;
}

export default function SimpleWhatsAppConnection({ 
  userId, 
  userName, 
  onConnected, 
  onError 
}: SimpleWhatsAppConnectionProps) {
  const [connectionData, setConnectionData] = useState<ConnectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [step, setStep] = useState<'loading' | 'qr' | 'connected' | 'error'>('loading');

  // Criar instância automaticamente quando o componente montar
  useEffect(() => {
    createInstanceAutomatically();
  }, []);

  const createInstanceAutomatically = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/auto-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userName
        })
      });

      const result = await response.json();

      if (result.success) {
        setConnectionData(result.data);
        
        if (result.data.status === 'pending_server') {
          setStep('error');
          toast.error('Servidor temporariamente indisponível. Tente novamente em alguns minutos.');
        } else if (result.data.qrCode) {
          setStep('qr');
          toast.success('Instância criada! Escaneie o QR Code para conectar.');
        } else {
          setStep('qr');
          // Gerar QR Code se não veio automaticamente
          generateQRCode();
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao criar instância:', error);
      setStep('error');
      toast.error('Erro ao criar instância: ' + error.message);
      onError?.(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Gerar QR Code
  const generateQRCode = async () => {
    if (!connectionData) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/disparai/instance?instanceKey=${connectionData.instanceKey}&userId=${userId}`);
      const result = await response.json();

      if (result.success) {
        setConnectionData(prev => prev ? { ...prev, qrCode: result.data.qrCode } : null);
        setStep('qr');
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao gerar QR Code:', error);
      toast.error('Erro ao gerar QR Code: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar status da conexão
  const checkConnectionStatus = async () => {
    if (!connectionData) return;
    
    setIsCheckingStatus(true);
    try {
      const response = await fetch('/api/disparai/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          instanceKey: connectionData.instanceKey, 
          userId 
        })
      });
      
      const result = await response.json();

      if (result.success) {
        if (result.data.status === 'connected') {
          setStep('connected');
          toast.success('WhatsApp conectado com sucesso!');
          onConnected?.();
        }
      }
    } catch (error: any) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Verificar status automaticamente a cada 3 segundos quando aguardando conexão
  useEffect(() => {
    if (step === 'qr' && connectionData) {
      const interval = setInterval(checkConnectionStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [step, connectionData]);

  if (step === 'loading') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Configurando seu WhatsApp
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Criando sua instância automaticamente...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'error') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Servidor Indisponível
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                O servidor está temporariamente fora do ar. Tente novamente em alguns minutos.
              </p>
            </div>
            <Button 
              onClick={createInstanceAutomatically}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'connected') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                WhatsApp Conectado!
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Sua conta está pronta para enviar mensagens em massa.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Zap className="w-5 h-5 text-green-500" />
          Conectar WhatsApp
        </CardTitle>
        <div className="flex justify-center">
          <Badge variant="outline" className="text-green-600 border-green-200">
            Aguardando Conexão
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Escaneie o QR Code com seu WhatsApp para conectar
          </p>
          
          {connectionData?.qrCode ? (
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
              <img 
                src={connectionData.qrCode} 
                alt="QR Code para conectar WhatsApp"
                className="w-48 h-48 mx-auto"
              />
            </div>
          ) : (
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
              {isLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              ) : (
                <span className="text-gray-400">QR Code não disponível</span>
              )}
            </div>
          )}
        </div>

        <div className="text-center">
          <Button 
            onClick={generateQRCode}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando QR Code...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Gerar Novo QR Code
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center pt-4 border-t">
          <p><strong>Como conectar:</strong></p>
          <p>1. Abra o WhatsApp no seu celular</p>
          <p>2. Toque em Menu → Dispositivos conectados</p>
          <p>3. Toque em "Conectar um dispositivo"</p>
          <p>4. Escaneie este QR Code</p>
        </div>
      </CardContent>
    </Card>
  );
}
