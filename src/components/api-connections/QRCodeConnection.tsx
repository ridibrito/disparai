'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle, AlertCircle, Smartphone } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface QRCodeConnectionProps {
  instanceKey: string;
  userId: string;
  onConnected?: () => void;
  onError?: (error: string) => void;
}

interface ConnectionStatus {
  status: 'waiting_qr' | 'waiting_connection' | 'connected' | 'error';
  qrCode?: string;
  message?: string;
  expiresAt?: string;
  user?: any;
}

export default function QRCodeConnection({ 
  instanceKey, 
  userId, 
  onConnected, 
  onError 
}: QRCodeConnectionProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'waiting_qr'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Gerar QR Code inicial
  const generateQRCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/disparai/instance?instanceKey=${instanceKey}&userId=${userId}`);
      const result = await response.json();

      if (result.success) {
        setConnectionStatus({
          status: 'waiting_qr',
          qrCode: result.data.qrCode,
          expiresAt: result.data.expiresAt,
          message: 'Escaneie o QR Code com seu WhatsApp'
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao gerar QR Code:', error);
      toast.error('Erro ao gerar QR Code: ' + error.message);
      onError?.(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar status da conexão
  const checkConnectionStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const response = await fetch('/api/disparai/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceKey, userId })
      });
      
      const result = await response.json();

      if (result.success) {
        setConnectionStatus({
          status: result.data.status,
          message: result.data.message,
          user: result.data.user
        });

        if (result.data.status === 'connected') {
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

  // Verificar status automaticamente a cada 3 segundos
  useEffect(() => {
    if (connectionStatus.status === 'waiting_connection') {
      const interval = setInterval(checkConnectionStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [connectionStatus.status]);

  // Gerar QR Code quando o componente montar
  useEffect(() => {
    generateQRCode();
  }, []);

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'waiting_qr':
        return <Smartphone className="w-5 h-5 text-blue-500" />;
      case 'waiting_connection':
        return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Smartphone className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus.status) {
      case 'waiting_qr':
        return <Badge variant="outline" className="text-blue-600 border-blue-200">Aguardando QR Code</Badge>;
      case 'waiting_connection':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200">Aguardando Conexão</Badge>;
      case 'connected':
        return <Badge variant="outline" className="text-green-600 border-green-200">Conectado</Badge>;
      case 'error':
        return <Badge variant="outline" className="text-red-600 border-red-200">Erro</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          {getStatusIcon()}
          Conectar WhatsApp
        </CardTitle>
        <div className="flex justify-center">
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {connectionStatus.status === 'waiting_qr' && (
          <>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                {connectionStatus.message}
              </p>
              
              {connectionStatus.qrCode ? (
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                  <img 
                    src={connectionStatus.qrCode} 
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
          </>
        )}

        {connectionStatus.status === 'waiting_connection' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-yellow-600 animate-spin" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">
                {connectionStatus.message}
              </p>
              <p className="text-xs text-gray-500">
                Verificando conexão automaticamente...
              </p>
            </div>
            <Button 
              onClick={checkConnectionStatus}
              disabled={isCheckingStatus}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {isCheckingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Verificar Status'
              )}
            </Button>
          </div>
        )}

        {connectionStatus.status === 'connected' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">
                WhatsApp conectado com sucesso!
              </p>
              {connectionStatus.user && (
                <p className="text-xs text-gray-500">
                  Conectado como: {connectionStatus.user.name || connectionStatus.user.id}
                </p>
              )}
            </div>
          </div>
        )}

        {connectionStatus.status === 'error' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Erro na conexão
              </p>
              <p className="text-xs text-gray-500">
                {connectionStatus.message}
              </p>
            </div>
            <Button 
              onClick={generateQRCode}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center pt-4 border-t">
          <p>1. Abra o WhatsApp no seu celular</p>
          <p>2. Toque em Menu → Dispositivos conectados</p>
          <p>3. Toque em "Conectar um dispositivo"</p>
          <p>4. Escaneie este QR Code</p>
        </div>
      </CardContent>
    </Card>
  );
}
