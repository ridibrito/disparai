'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Zap, Smartphone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import SimpleWhatsAppConnection from '../api-connections/SimpleWhatsAppConnection';

interface AutoWhatsAppSetupProps {
  userId: string;
  userName: string;
  onSetupComplete?: () => void;
}

export default function AutoWhatsAppSetup({ 
  userId, 
  userName, 
  onSetupComplete 
}: AutoWhatsAppSetupProps) {
  const [setupStatus, setSetupStatus] = useState<'checking' | 'creating' | 'qr' | 'connected' | 'error'>('checking');
  const [hasExistingConnection, setHasExistingConnection] = useState(false);

  useEffect(() => {
    checkExistingConnection();
  }, []);

  const checkExistingConnection = async () => {
    try {
      const response = await fetch('/api/connections');
      const result = await response.json();

      if (result.success) {
        const whatsappConnection = result.data.find(
          (conn: any) => conn.type === 'whatsapp_disparai' && conn.status === 'connected'
        );

        if (whatsappConnection) {
          setHasExistingConnection(true);
          setSetupStatus('connected');
          onSetupComplete?.();
        } else {
          // Não tem conexão ativa, criar automaticamente
          createInstanceAutomatically();
        }
      } else {
        createInstanceAutomatically();
      }
    } catch (error) {
      console.error('Erro ao verificar conexão existente:', error);
      createInstanceAutomatically();
    }
  };

  const createInstanceAutomatically = async () => {
    setSetupStatus('creating');
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
        if (result.data.status === 'pending_server') {
          setSetupStatus('error');
          toast.error('Servidor temporariamente indisponível. Você pode conectar depois.');
        } else {
          setSetupStatus('qr');
          toast.success('Instância criada! Conecte seu WhatsApp para começar.');
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao criar instância:', error);
      setSetupStatus('error');
      toast.error('Erro ao configurar WhatsApp: ' + error.message);
    }
  };

  const handleConnected = () => {
    setSetupStatus('connected');
    setHasExistingConnection(true);
    toast.success('WhatsApp conectado com sucesso!');
    onSetupComplete?.();
  };

  if (setupStatus === 'checking') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Verificando sua conta
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Verificando se você já tem WhatsApp conectado...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (setupStatus === 'creating') {
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

  if (setupStatus === 'connected' && hasExistingConnection) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                WhatsApp Já Conectado!
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Sua conta está pronta para enviar mensagens em massa.
              </p>
            </div>
            <div className="flex justify-center">
              <Badge variant="outline" className="text-green-600 border-green-200">
                <Zap className="w-3 h-3 mr-1" />
                Conectado
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (setupStatus === 'error') {
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
                O servidor está temporariamente fora do ar. Você pode conectar seu WhatsApp depois.
              </p>
            </div>
            <Button 
              onClick={createInstanceAutomatically}
              className="w-full"
            >
              <Zap className="w-4 h-4 mr-2" />
              Tentar Conectar WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-900 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Conectar WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 text-sm">
            Conecte seu WhatsApp para começar a enviar mensagens em massa. 
            É rápido e fácil!
          </p>
        </CardContent>
      </Card>

      <SimpleWhatsAppConnection
        userId={userId}
        userName={userName}
        onConnected={handleConnected}
        onError={(error) => {
          setSetupStatus('error');
          toast.error('Erro: ' + error);
        }}
      />
    </div>
  );
}
