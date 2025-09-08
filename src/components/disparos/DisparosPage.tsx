'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  Eye,
  Calendar,
  Users,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import CreateDisparoModal from './CreateDisparoModal';
import DisparoDetailsModal from './DisparoDetailsModal';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface Disparo {
  id: string;
  name: string;
  message: string;
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'paused';
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  statistics?: {
    total_recipients: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    pending: number;
  };
}

export default function DisparosPage() {
  const { user } = useAuth();
  const [disparos, setDisparos] = useState<Disparo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDisparo, setSelectedDisparo] = useState<Disparo | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [disparoToDelete, setDisparoToDelete] = useState<Disparo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Carregar disparos
  const loadDisparos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/campaigns');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar disparos');
      }
      
      const data = await response.json();
      
      // A API retorna {success: true, campaigns: Array}
      let campaigns = [];
      if (data.success && Array.isArray(data.campaigns)) {
        campaigns = data.campaigns;
      } else if (Array.isArray(data)) {
        campaigns = data;
      } else {
        console.error('Dados inválidos recebidos:', data);
        toast.error('Erro ao carregar disparos');
        return;
      }
      
      // Carregar estatísticas para cada disparo
      const disparosComStats = await Promise.all(
        campaigns.map(async (disparo) => {
          try {
            const statsResponse = await fetch(`/api/campaigns/${disparo.id}/stats`);
            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              return {
                ...disparo,
                statistics: statsData.statistics
              };
            }
          } catch (error) {
            console.error(`Erro ao carregar stats do disparo ${disparo.id}:`, error);
          }
          
          // Se não conseguir carregar as stats, usar valores padrão
          return {
            ...disparo,
            statistics: {
              total_recipients: 0,
              sent: 0,
              delivered: 0,
              read: 0,
              failed: 0,
              pending: 0
            }
          };
        })
      );
      
      setDisparos(disparosComStats);
    } catch (error) {
      console.error('Erro ao carregar disparos:', error);
      toast.error('Erro ao carregar disparos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDisparos();
    }
  }, [user]);

  // Função para obter badge de status
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'secondary' as const, icon: Clock },
      scheduled: { label: 'Agendado', variant: 'outline' as const, icon: Calendar },
      in_progress: { label: 'Enviando', variant: 'default' as const, icon: Play },
      completed: { label: 'Concluído', variant: 'default' as const, icon: CheckCircle },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const, icon: XCircle },
      paused: { label: 'Pausado', variant: 'secondary' as const, icon: Pause }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  // Função para obter ações disponíveis
  const getActions = (disparo: Disparo) => {
    const actions = [];

    // Sempre mostrar visualizar
    actions.push(
      <Button
        key="view"
        variant="outline"
        size="sm"
        onClick={() => {
          setSelectedDisparo(disparo);
          setShowDetailsModal(true);
        }}
      >
        <Eye className="w-4 h-4 mr-2" />
        Ver
      </Button>
    );

    // Ações baseadas no status
    switch (disparo.status) {
      case 'draft':
        actions.push(
          <Button
            key="start"
            variant="default"
            size="sm"
            onClick={() => startDisparo(disparo.id)}
          >
            <Play className="w-4 h-4 mr-2" />
            Iniciar
          </Button>
        );
        break;
      case 'in_progress':
        actions.push(
          <Button
            key="pause"
            variant="outline"
            size="sm"
            onClick={() => pauseDisparo(disparo.id)}
          >
            <Pause className="w-4 h-4 mr-2" />
            Pausar
          </Button>
        );
        break;
      case 'paused':
        actions.push(
          <Button
            key="resume"
            variant="default"
            size="sm"
            onClick={() => resumeDisparo(disparo.id)}
          >
            <Play className="w-4 h-4 mr-2" />
            Retomar
          </Button>
        );
        break;
    }

    // Sempre mostrar excluir (exceto se estiver enviando)
    if (disparo.status !== 'in_progress') {
      actions.push(
        <Button
          key="delete"
          variant="destructive"
          size="sm"
          onClick={() => openDeleteDialog(disparo.id)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Excluir
        </Button>
      );
    }

    return actions;
  };

  // Função para iniciar disparo
  const startDisparo = async (id: string) => {
    try {
      const response = await fetch(`/api/campaigns/${id}/start`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Disparo iniciado com sucesso!');
        loadDisparos();
      } else {
        toast.error(data.error || 'Erro ao iniciar disparo');
      }
    } catch (error) {
      console.error('Erro ao iniciar disparo:', error);
      toast.error('Erro ao iniciar disparo');
    }
  };

  // Função para pausar disparo
  const pauseDisparo = async (id: string) => {
    try {
      const response = await fetch(`/api/campaigns/${id}/pause`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Disparo pausado com sucesso!');
        loadDisparos();
      } else {
        toast.error(data.error || 'Erro ao pausar disparo');
      }
    } catch (error) {
      console.error('Erro ao pausar disparo:', error);
      toast.error('Erro ao pausar disparo');
    }
  };

  // Função para retomar disparo
  const resumeDisparo = async (id: string) => {
    try {
      const response = await fetch(`/api/campaigns/${id}/resume`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Disparo retomado com sucesso!');
        loadDisparos();
      } else {
        toast.error(data.error || 'Erro ao retomar disparo');
      }
    } catch (error) {
      console.error('Erro ao retomar disparo:', error);
      toast.error('Erro ao retomar disparo');
    }
  };

  // Função para abrir modal de confirmação de exclusão
  const openDeleteDialog = (id: string) => {
    const disparo = disparos.find(d => d.id === id);
    if (disparo) {
      setDisparoToDelete(disparo);
      setShowDeleteDialog(true);
    }
  };

  // Função para excluir disparo
  const deleteDisparo = async () => {
    if (!disparoToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/campaigns/${disparoToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (response.ok) {
        toast.success('Disparo excluído com sucesso!');
        loadDisparos();
        setShowDeleteDialog(false);
        setDisparoToDelete(null);
      } else {
        toast.error(data.error || 'Erro ao excluir disparo');
      }
    } catch (error) {
      console.error('Erro ao excluir disparo:', error);
      toast.error('Erro ao excluir disparo');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Carregando disparos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-8 h-8 text-green-600" />
            Disparos
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie suas campanhas de mensagens WhatsApp
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Disparo
        </Button>
      </div>

      {/* Lista de Disparos */}
      {disparos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {disparos.map((disparo) => (
            <Card key={disparo.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{disparo.name}</CardTitle>
                    <CardDescription className="mt-1">
                      Criado em {new Date(disparo.created_at).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                  {getStatusBadge(disparo.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span>{disparo.statistics.total_recipients} contatos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-green-500" />
                      <span>{disparo.statistics.sent} enviadas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>{disparo.statistics.delivered} entregues</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span>{disparo.statistics.failed} falhas</span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    {getActions(disparo)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum disparo criado
            </h3>
            <p className="text-gray-500 mb-6">
              Crie seu primeiro disparo para começar a enviar mensagens
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Disparo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modais */}
      {showCreateModal && (
        <CreateDisparoModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadDisparos();
          }}
        />
      )}

      {showDetailsModal && selectedDisparo && (
        <DisparoDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedDisparo(null);
          }}
          disparo={selectedDisparo}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Excluir disparo"
        description={disparoToDelete ? `Tem certeza que deseja excluir o disparo "${disparoToDelete.name}"? Esta ação não pode ser desfeita.` : ''}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={deleteDisparo}
        isLoading={isDeleting}
      />
    </div>
  );
}
