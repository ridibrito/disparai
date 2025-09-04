'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Zap, 
  Plus, 
  Settings, 
  Trash2, 
  AlertCircle,
  ExternalLink,
  Loader2,
  CheckCircle
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

export default function ConnectionsWithTabs() {
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

  // Carregar conexões ao montar o componente
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

  // Filtrar conexões por tipo
  const disparaiConnections = connections.filter(conn => conn.type === 'whatsapp_disparai');
  const cloudConnections = connections.filter(conn => conn.type === 'whatsapp_cloud');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inactive':
      case 'disconnected':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
        return <Badge variant="outline" className="text-green-600 border-green-200">Ativo</Badge>;
      case 'inactive':
      case 'disconnected':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200">Inativo</Badge>;
      case 'error':
        return <Badge variant="outline" className="text-red-600 border-red-200">Erro</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const renderConnectionCard = (connection: ApiConnection) => (
    <Card key={connection.id} className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {connection.type === 'whatsapp_cloud' ? (
              <MessageCircle className="w-5 h-5 text-blue-600" />
            ) : (
              <Zap className="w-5 h-5 text-green-600" />
            )}
            <div>
              <CardTitle className="text-lg">{connection.name}</CardTitle>
              <CardDescription>
                {connection.type === 'whatsapp_cloud' ? 'WhatsApp Cloud API' : 'API Disparai'}
                {connection.phoneNumber && ` • ${connection.phoneNumber}`}
                {connection.instanceId && ` • ${connection.instanceId}`}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(connection.status)}
            {getStatusBadge(connection.status)}
          </div>
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
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestConnection(connection.id)}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Testar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteConnection(connection.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
          <div className="text-xs text-gray-500">
            Criado em {new Date(connection.createdAt).toLocaleDateString('pt-BR')}
          </div>
        </div>
      </CardContent>
    </Card>
  );

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

        {/* Debug e Teste */}
        <div className="mb-4 p-4 bg-gray-100 rounded-lg">
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

        {/* Tabs */}
        <div className="space-y-6">
          {/* Navegação manual das abas */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('disparai')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'disparai'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Zap className="w-4 h-4" />
              API Disparai
            </button>
            <button
              onClick={() => setActiveTab('cloud')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'cloud'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Cloud API
            </button>
          </div>

          {/* Tab API Disparai */}
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
                {disparaiConnections.map(renderConnectionCard)}
                
                {/* Botão para adicionar nova conexão */}
                <div className="text-center py-4">
                  <Button 
                    onClick={() => {
                      // Forçar recarregamento da página para mostrar nova conexão
                      window.location.reload();
                    }}
                    variant="outline"
                    className="border-green-200 text-green-600 hover:bg-green-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Conectar Outro WhatsApp
                  </Button>
                </div>
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
                      onClick={() => setShowDisparaiConnection(true)}
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

          {/* Tab WhatsApp Cloud API */}
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
                {cloudConnections.map(renderConnectionCard)}
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
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Conexão
                </Button>
              </div>
            )}
            </div>
          )}
        </div>

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
