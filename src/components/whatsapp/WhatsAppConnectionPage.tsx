'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Smartphone,
  MessageSquare,
  Users,
  BarChart3
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import SimpleWhatsAppConnection from '../api-connections/SimpleWhatsAppConnection';

interface WhatsAppConnection {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  instanceId: string;
  createdAt: string;
  messageCount: number;
}

interface WhatsAppConnectionPageProps {
  userId: string;
  userName: string;
}

export default function WhatsAppConnectionPage({ userId, userName }: WhatsAppConnectionPageProps) {
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConnection, setShowConnection] = useState(false);

  useEffect(() => {
    loadWhatsAppConnection();
  }, []);

  const loadWhatsAppConnection = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/connections');
      const result = await response.json();

      if (result.success) {
        const whatsappConnection = result.data.find(
          (conn: any) => conn.type === 'whatsapp_disparai'
        );

        if (whatsappConnection) {
          setConnection({
            id: whatsappConnection.id,
            name: whatsappConnection.name,
            status: whatsappConnection.status === 'connected' ? 'connected' : 'disconnected',
            instanceId: whatsappConnection.instance_id,
            createdAt: whatsappConnection.created_at,
            messageCount: whatsappConnection.message_count || 0
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar conexão WhatsApp:', error);
      toast.error('Erro ao carregar conexão WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnected = () => {
    toast.success('WhatsApp conectado com sucesso!');
    loadWhatsAppConnection();
    setShowConnection(false);
  };

  const handleConnectClick = () => {
    setShowConnection(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (showConnection) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Conectar WhatsApp
            </h1>
            <p className="text-gray-600">
              Conecte seu WhatsApp para começar a enviar mensagens em massa
            </p>
          </div>

          <SimpleWhatsAppConnection
            userId={userId}
            userName={userName}
            onConnected={handleConnected}
            onError={(error) => {
              toast.error('Erro: ' + error);
            }}
          />

          <div className="text-center mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowConnection(false)}
            >
              Voltar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            WhatsApp Business
          </h1>
          <p className="text-gray-600 text-lg">
            Conecte seu WhatsApp e comece a enviar mensagens em massa
          </p>
        </div>

        {/* Status da Conexão */}
        {connection ? (
          <div className="space-y-6">
            <Card className={connection.status === 'connected' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {connection.status === 'connected' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  )}
                  {connection.name}
                </CardTitle>
                <CardDescription>
                  {connection.status === 'connected' 
                    ? 'WhatsApp conectado e pronto para uso'
                    : 'WhatsApp desconectado - reconecte para continuar'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant="outline" 
                      className={connection.status === 'connected' 
                        ? 'text-green-600 border-green-200' 
                        : 'text-yellow-600 border-yellow-200'
                      }
                    >
                      {connection.status === 'connected' ? 'Conectado' : 'Desconectado'}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {connection.messageCount} mensagens enviadas
                    </span>
                  </div>
                  <Button 
                    onClick={handleConnectClick}
                    variant={connection.status === 'connected' ? 'outline' : 'default'}
                  >
                    {connection.status === 'connected' ? 'Reconectar' : 'Conectar'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            {connection.status === 'connected' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{connection.messageCount}</p>
                        <p className="text-sm text-gray-600">Mensagens Enviadas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">∞</p>
                        <p className="text-sm text-gray-600">Contatos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">100%</p>
                        <p className="text-sm text-gray-600">Taxa de Entrega</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Card de Boas-vindas */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-900 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Bem-vindo ao WhatsApp Business!
                </CardTitle>
                <CardDescription className="text-green-700">
                  Conecte seu WhatsApp e comece a enviar mensagens em massa de forma fácil e rápida.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-900">O que você pode fazer:</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• Enviar mensagens em massa</li>
                        <li>• Enviar mídia (imagens, vídeos, documentos)</li>
                        <li>• Gerenciar contatos</li>
                        <li>• Acompanhar entregas</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-900">Como funciona:</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• Conexão automática e segura</li>
                        <li>• Apenas escaneie um QR Code</li>
                        <li>• Pronto para usar em segundos</li>
                        <li>• Suporte 24/7</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botão de Conectar */}
            <div className="text-center">
              <Button 
                onClick={handleConnectClick}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
              >
                <Zap className="w-5 h-5 mr-2" />
                Conectar WhatsApp
              </Button>
              <p className="text-sm text-gray-600 mt-3">
                É rápido, fácil e seguro. Apenas escaneie o QR Code!
              </p>
            </div>

            {/* Instruções */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-gray-600" />
                  Como conectar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-blue-600 font-bold">1</span>
                    </div>
                    <h4 className="font-medium">Clique em Conectar</h4>
                    <p className="text-sm text-gray-600">
                      Clique no botão "Conectar WhatsApp" acima
                    </p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-green-600 font-bold">2</span>
                    </div>
                    <h4 className="font-medium">Escaneie o QR Code</h4>
                    <p className="text-sm text-gray-600">
                      Abra o WhatsApp e escaneie o código que aparece
                    </p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-purple-600 font-bold">3</span>
                    </div>
                    <h4 className="font-medium">Pronto!</h4>
                    <p className="text-sm text-gray-600">
                      Seu WhatsApp está conectado e pronto para usar
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
