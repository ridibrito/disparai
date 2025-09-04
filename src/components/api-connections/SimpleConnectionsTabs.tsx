'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Zap, 
  Plus, 
  CheckCircle, 
  AlertCircle,
  Loader2
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

export default function SimpleConnectionsTabs() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ApiConnection[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('disparai');
  const [showDisparaiConnection, setShowDisparaiConnection] = useState(false);

  // Carregar conexões ao montar o componente
  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/connections');
      const data = await response.json();
      
      if (response.ok) {
        setConnections(data.connections || []);
      } else {
        toast.error('Erro ao carregar conexões');
      }
    } catch (error) {
      console.error('Error loading connections:', error);
      toast.error('Erro ao carregar conexões');
    } finally {
      setIsLoading(false);
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

  const handleConnected = () => {
    toast.success('WhatsApp conectado com sucesso!');
    loadConnections();
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

        {/* Debug */}
        <div className="mb-4 p-4 bg-yellow-100 rounded-lg">
          <p className="text-sm mb-2">Debug: Aba ativa = <strong>{activeTab}</strong></p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setActiveTab('disparai')}
            >
              Forçar API Disparai
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setActiveTab('cloud')}
            >
              Forçar Cloud API
            </Button>
          </div>
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
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-900">Vantagens:</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• Conexão automática e segura</li>
                        <li>• Mensagens ilimitadas</li>
                        <li>• Envio de mídia completo</li>
                        <li>• Suporte 24/7</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-900">Como funciona:</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• Apenas escaneie um QR Code</li>
                        <li>• Pronto para usar em segundos</li>
                        <li>• Sem configurações complexas</li>
                        <li>• Ideal para usuários leigos</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conexão Disparai */}
            {disparaiConnections.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Suas Conexões API Disparai
                </h3>
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
                          className={connection.status === 'connected' 
                            ? 'text-green-600 border-green-200' 
                            : 'text-yellow-600 border-yellow-200'
                          }
                        >
                          {connection.status === 'connected' ? 'Conectado' : 'Desconectado'}
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
                      onClick={() => {
                        console.log('Clicou em Conectar WhatsApp');
                        setShowDisparaiConnection(true);
                      }}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      Conectar WhatsApp
                    </Button>
                  </div>
                </div>
                
                {user && showDisparaiConnection && (
                  <div className="mt-6">
                    <SimpleWhatsAppConnection
                      userId={user.id}
                      userName={user.email || 'Usuário'}
                      onConnected={handleConnected}
                      onError={(error) => {
                        toast.error('Erro: ' + error);
                      }}
                    />
                  </div>
                )}
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

        {/* Modal para WhatsApp Cloud API */}
        <NewConnectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveConnection}
        />
      </div>
    </div>
  );
}
