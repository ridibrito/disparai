'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import QRCodeConnection from './QRCodeConnection';

interface AutoInstanceCreatorProps {
  userId: string;
  onInstanceCreated?: (instanceData: any) => void;
  onConnected?: () => void;
}

interface InstanceData {
  connectionId: string;
  instanceKey: string;
  apiToken: string;
  status: string;
  qrCode?: string;
  nextStep: string;
}

export default function AutoInstanceCreator({ 
  userId, 
  onInstanceCreated, 
  onConnected 
}: AutoInstanceCreatorProps) {
  const [instanceName, setInstanceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [instanceData, setInstanceData] = useState<InstanceData | null>(null);
  const [step, setStep] = useState<'form' | 'qr' | 'connected'>('form');

  const createInstance = async () => {
    if (!instanceName.trim()) {
      toast.error('Nome da instância é obrigatório');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/disparai/instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          instanceName: instanceName.trim()
        })
      });

      const result = await response.json();

      if (result.success) {
        setInstanceData(result.data);
        onInstanceCreated?.(result.data);
        
        if (result.data.qrCode) {
          setStep('qr');
          toast.success('Instância criada! Escaneie o QR Code para conectar.');
        } else {
          setStep('qr');
          toast.success('Instância criada! Gerando QR Code...');
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao criar instância:', error);
      toast.error('Erro ao criar instância: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleConnected = () => {
    setStep('connected');
    onConnected?.();
  };

  if (step === 'qr' && instanceData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-500" />
              Instância Criada com Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Nome:</strong> {instanceName}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Instance Key:</strong> {instanceData.instanceKey}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Status:</strong> {instanceData.status}
              </p>
            </div>
          </CardContent>
        </Card>

        <QRCodeConnection
          instanceKey={instanceData.instanceKey}
          userId={userId}
          onConnected={handleConnected}
        />
      </div>
    );
  }

  if (step === 'connected') {
    return (
      <Card>
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
                Sua instância está pronta para uso. Você pode começar a enviar mensagens.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-green-500" />
          Configurar WhatsApp
        </CardTitle>
        <p className="text-sm text-gray-600">
          Vamos criar automaticamente uma instância WhatsApp para você. 
          Você só precisará escanear um QR Code para conectar.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="instanceName">Nome da Instância *</Label>
          <Input
            id="instanceName"
            placeholder="Ex: Minha Empresa WhatsApp"
            value={instanceName}
            onChange={(e) => setInstanceName(e.target.value)}
            disabled={isCreating}
          />
          <p className="text-xs text-gray-500 mt-1">
            Um nome descritivo para identificar sua instância
          </p>
        </div>


        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            O que acontece em seguida:
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Uma instância será criada automaticamente no servidor</li>
            <li>• Um QR Code será gerado para você escanear</li>
            <li>• Você conectará seu WhatsApp escaneando o código</li>
            <li>• Sua conta estará pronta para enviar mensagens</li>
          </ul>
        </div>

        <Button 
          onClick={createInstance}
          disabled={isCreating || !instanceName.trim()}
          className="w-full"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Criando Instância...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Criar Instância WhatsApp
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
