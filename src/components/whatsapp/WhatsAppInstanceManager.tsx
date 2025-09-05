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
  X,
  QrCode
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

export default function WhatsAppInstanceManager() {
  const { user } = useAuth();
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentQRCode, setCurrentQRCode] = useState<string | null>(null);
  const [currentInstance, setCurrentInstance] = useState<WhatsAppInstance | null>(null);

  // Carregar instâncias
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

  // Configurar sincronização em tempo real
  useEffect(() => {
    if (!user) return;

    loadInstances();

    const supabase = createClient();
    
    // Inscrever-se nas mudanças da tabela whatsapp_instances
    const subscription = supabase
      .channel('whatsapp_instances_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances'
        },
        (payload) => {
          console.log('🔄 Mudança detectada na tabela whatsapp_instances:', payload);
          
          if (payload.eventType === 'INSERT') {
            setInstances(prev => [payload.new as WhatsAppInstance, ...prev]);
            toast.success('Nova instância criada!');
          } else if (payload.eventType === 'UPDATE') {
            setInstances(prev => 
              prev.map(instance => 
                instance.id === payload.new.id ? payload.new as WhatsAppInstance : instance
              )
            );
            
            // Se o status mudou para 'ativo', mostrar sucesso
            if (payload.old.status === 'pendente' && payload.new.status === 'ativo') {
              toast.success('WhatsApp conectado com sucesso!');
              setShowQRModal(false);
              setCurrentQRCode(null);
            }
          } else if (payload.eventType === 'DELETE') {
            setInstances(prev => prev.filter(instance => instance.id !== payload.old.id));
            toast.success('Instância removida!');
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Criar nova instância
  const handleCreateInstance = async () => {
    try {
      setIsLoading(true);
      
      // Buscar organization_id do usuário
      const supabase = createClient();
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user?.id)
        .single();
      
      if (!userData?.organization_id) {
        toast.error('Usuário não possui organização');
        return;
      }
      
      // Chamar API para criar instância
      const response = await fetch('/api/create-whatsapp-instance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationId: userData.organization_id
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Instância criada com sucesso!');
        setCurrentQRCode(result.instance.qr_code);
        setCurrentInstance(result.instance);
        setShowCreateModal(false);
        setShowQRModal(true);
      } else {
        toast.error('Erro ao criar instância: ' + result.error);
      }
    } catch (error: any) {
      console.error('Erro ao criar instância:', error);
      toast.error('Erro ao criar instância: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Deletar instância
  const handleDeleteInstance = async (instance: WhatsAppInstance) => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', instance.id);
      
      if (error) {
        console.error('Erro ao deletar instância:', error);
        toast.error('Erro ao deletar instância');
        return;
      }
      
      toast.success('Instância deletada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao deletar instância:', error);
      toast.error('Erro ao deletar instância: ' + error.message);
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-900">Instâncias WhatsApp</h2>
          <p className="text-gray-600">Gerencie suas instâncias do WhatsApp</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Instância
        </Button>
      </div>

      {/* Lista de instâncias */}
      <div className="grid gap-4">
        {instances.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma instância encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                Crie sua primeira instância do WhatsApp para começar
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Instância
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
                    <CardDescription>
                      Criada em {new Date(instance.created_at).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(instance.status)}>
                    {getStatusIcon(instance.status)}
                    <span className="ml-1 capitalize">{instance.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteInstance(instance)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Deletar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal para criar instância */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Instância WhatsApp</DialogTitle>
            <DialogDescription>
              Uma nova instância será criada e você receberá um QR Code para conectar
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateInstance}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Criar Instância
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
            {currentQRCode ? (
              <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                <img 
                  src={currentQRCode} 
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
              <p>1. Abra o WhatsApp no seu celular</p>
              <p>2. Toque em <strong>Menu</strong> ou <strong>Configurações</strong></p>
              <p>3. Toque em <strong>Dispositivos conectados</strong></p>
              <p>4. Toque em <strong>Conectar um dispositivo</strong></p>
              <p>5. Escaneie este QR Code</p>
            </div>
            
            <div className="text-center text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
              <p><strong>Aguarde...</strong> O status será atualizado automaticamente quando você escanear o QR Code</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
