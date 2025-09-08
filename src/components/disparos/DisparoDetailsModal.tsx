'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Trash2, 
  Users, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Disparo {
  id: string;
  name: string;
  message?: string;
  message_content?: string;
  target_contacts?: any[];
  target_lists?: string[];
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'paused';
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  statistics: {
    total_recipients: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    pending: number;
  };
}

interface DisparoDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  disparo: Disparo;
}

interface CampaignMessage {
  id: string;
  contact_id: string;
  status: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  error_message?: string;
  whatsapp_message_id?: string;
  phone_number?: string;
  recipient_name?: string;
  retry_count: number;
}

export default function DisparoDetailsModal({ isOpen, onClose, disparo }: DisparoDetailsModalProps) {
  const [messages, setMessages] = useState<CampaignMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Carregar mensagens do disparo
  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/campaigns/${disparo.id}`);
      const data = await response.json();

      if (data.success) {
        console.log('Modal - Campaign data received:', {
          campaign: data.campaign,
          target_contacts: data.campaign.target_contacts,
          target_lists: data.campaign.target_lists,
          message_content: data.campaign.message_content
        });
        setMessages(data.campaign.campaign_messages || []);
      } else {
        toast.error('Erro ao carregar mensagens');
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  // Carregar estatísticas
  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch(`/api/campaigns/${disparo.id}/stats`);
      const data = await response.json();

      if (response.ok && data.statistics) {
        // Transformar a estrutura simples da API na estrutura complexa esperada pelo componente
        const transformedStats = {
          overview: {
            total_recipients: data.statistics.total_recipients,
            sent: data.statistics.sent,
            delivered: data.statistics.delivered,
            read: data.statistics.read,
            failed: data.statistics.failed,
            pending: data.statistics.pending
          },
          rates: {
            delivery_rate: data.statistics.total_recipients > 0 
              ? Math.round((data.statistics.delivered / data.statistics.total_recipients) * 100) 
              : 0,
            read_rate: data.statistics.total_recipients > 0 
              ? Math.round((data.statistics.read / data.statistics.total_recipients) * 100) 
              : 0,
            failure_rate: data.statistics.total_recipients > 0 
              ? Math.round((data.statistics.failed / data.statistics.total_recipients) * 100) 
              : 0
          },
          timing: {
            avg_delivery_time_seconds: 0, // Não disponível na API atual
            avg_read_time_seconds: 0 // Não disponível na API atual
          }
        };
        setStats(transformedStats);
      } else {
        console.error('Erro ao carregar estatísticas:', data.error || 'Resposta inválida');
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && disparo) {
      loadMessages();
      loadStats();
    }
  }, [isOpen, disparo]);

  // Função para obter badge de status
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'secondary' as const },
      scheduled: { label: 'Agendado', variant: 'outline' as const },
      in_progress: { label: 'Enviando', variant: 'default' as const },
      completed: { label: 'Concluído', variant: 'default' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const },
      paused: { label: 'Pausado', variant: 'secondary' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  // Função para obter badge de status da mensagem
  const getMessageStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
      sent: { label: 'Enviada', variant: 'outline' as const, icon: MessageSquare },
      delivered: { label: 'Entregue', variant: 'default' as const, icon: CheckCircle },
      read: { label: 'Lida', variant: 'default' as const, icon: Eye },
      failed: { label: 'Falhou', variant: 'destructive' as const, icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  // Função para iniciar disparo
  const startDisparo = async () => {
    try {
      const response = await fetch(`/api/campaigns/${disparo.id}/start`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Disparo iniciado com sucesso!');
        onClose();
      } else {
        toast.error(data.error || 'Erro ao iniciar disparo');
      }
    } catch (error) {
      console.error('Erro ao iniciar disparo:', error);
      toast.error('Erro ao iniciar disparo');
    }
  };

  // Função para pausar disparo
  const pauseDisparo = async () => {
    try {
      const response = await fetch(`/api/campaigns/${disparo.id}/pause`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Disparo pausado com sucesso!');
        onClose();
      } else {
        toast.error(data.error || 'Erro ao pausar disparo');
      }
    } catch (error) {
      console.error('Erro ao pausar disparo:', error);
      toast.error('Erro ao pausar disparo');
    }
  };

  // Função para retomar disparo
  const resumeDisparo = async () => {
    try {
      const response = await fetch(`/api/campaigns/${disparo.id}/resume`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Disparo retomado com sucesso!');
        onClose();
      } else {
        toast.error(data.error || 'Erro ao retomar disparo');
      }
    } catch (error) {
      console.error('Erro ao retomar disparo:', error);
      toast.error('Erro ao retomar disparo');
    }
  };

  // Função para excluir disparo
  const deleteDisparo = async () => {
    if (!confirm('Tem certeza que deseja excluir este disparo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/campaigns/${disparo.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Disparo excluído com sucesso!');
        onClose();
      } else {
        toast.error(data.error || 'Erro ao excluir disparo');
      }
    } catch (error) {
      console.error('Erro ao excluir disparo:', error);
      toast.error('Erro ao excluir disparo');
    }
  };

  // Função para obter ações disponíveis
  const getActions = () => {
    const actions = [];

    switch (disparo.status) {
      case 'draft':
        actions.push(
          <Button key="start" onClick={startDisparo}>
            <Play className="w-4 h-4 mr-2" />
            Iniciar
          </Button>
        );
        break;
      case 'in_progress':
        actions.push(
          <Button key="pause" variant="outline" onClick={pauseDisparo}>
            <Pause className="w-4 h-4 mr-2" />
            Pausar
          </Button>
        );
        break;
      case 'paused':
        actions.push(
          <Button key="resume" onClick={resumeDisparo}>
            <Play className="w-4 h-4 mr-2" />
            Retomar
          </Button>
        );
        break;
    }

    // Sempre mostrar excluir (exceto se estiver enviando)
    if (disparo.status !== 'in_progress') {
      actions.push(
        <Button key="delete" variant="destructive" onClick={deleteDisparo}>
          <Trash2 className="w-4 h-4 mr-2" />
          Excluir
        </Button>
      );
    }

    return actions;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{disparo.name}</DialogTitle>
              <DialogDescription className="mt-1">
                Criado em {new Date(disparo.created_at).toLocaleDateString('pt-BR')}
              </DialogDescription>
            </div>
            {getStatusBadge(disparo.status)}
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="message">Mensagem</TabsTrigger>
            <TabsTrigger value="recipients">Destinatários</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Estatísticas
                  {statsLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats ? (
                  <div className="space-y-4">
                    {/* Estatísticas Principais */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {stats.overview.total_recipients}
                        </div>
                        <div className="text-sm text-gray-500">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {stats.overview.sent}
                        </div>
                        <div className="text-sm text-gray-500">Enviadas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700">
                          {stats.overview.delivered}
                        </div>
                        <div className="text-sm text-gray-500">Entregues</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-700">
                          {stats.overview.read}
                        </div>
                        <div className="text-sm text-gray-500">Lidas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {stats.overview.failed}
                        </div>
                        <div className="text-sm text-gray-500">Falhas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">
                          {stats.overview.pending}
                        </div>
                        <div className="text-sm text-gray-500">Pendentes</div>
                      </div>
                    </div>

                    {/* Taxas de Performance */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {stats.rates.delivery_rate}%
                        </div>
                        <div className="text-xs text-gray-500">Taxa de Entrega</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {stats.rates.read_rate}%
                        </div>
                        <div className="text-xs text-gray-500">Taxa de Leitura</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">
                          {stats.rates.failure_rate}%
                        </div>
                        <div className="text-xs text-gray-500">Taxa de Falha</div>
                      </div>
                    </div>

                    {/* Tempos Médios */}
                    {(stats.timing.avg_delivery_time_seconds > 0 || stats.timing.avg_read_time_seconds > 0) && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        {stats.timing.avg_delivery_time_seconds > 0 && (
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">
                              {Math.round(stats.timing.avg_delivery_time_seconds / 60)}min
                            </div>
                            <div className="text-xs text-gray-500">Tempo Médio de Entrega</div>
                          </div>
                        )}
                        {stats.timing.avg_read_time_seconds > 0 && (
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {Math.round(stats.timing.avg_read_time_seconds / 60)}min
                            </div>
                            <div className="text-xs text-gray-500">Tempo Médio de Leitura</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Carregando estatísticas...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações do Disparo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  {getStatusBadge(disparo.status)}
                </div>
                {disparo.scheduled_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agendado para:</span>
                    <span>{new Date(disparo.scheduled_at).toLocaleString('pt-BR')}</span>
                  </div>
                )}
                {disparo.started_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Iniciado em:</span>
                    <span>{new Date(disparo.started_at).toLocaleString('pt-BR')}</span>
                  </div>
                )}
                {disparo.completed_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Concluído em:</span>
                    <span>{new Date(disparo.completed_at).toLocaleString('pt-BR')}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="flex justify-end space-x-2">
              {getActions()}
            </div>
          </TabsContent>

          <TabsContent value="message" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mensagem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">
                    {disparo.message || disparo.message_content || 'Nenhuma mensagem definida'}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recipients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Destinatários</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Carregando...</p>
                  </div>
                ) : (() => {
                  console.log('Rendering recipients:', {
                    messagesLength: messages.length,
                    targetContacts: disparo.target_contacts,
                    targetContactsLength: disparo.target_contacts?.length,
                    disparo: disparo
                  });
                  return messages.length > 0 || (disparo.target_contacts && disparo.target_contacts.length > 0);
                })() ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {/* Mostrar mensagens se existirem */}
                    {messages.length > 0 ? (
                      messages.map((message) => (
                        <div key={message.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">
                              {message.recipient_name || 'Nome não disponível'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {message.phone_number}
                            </div>
                            {message.error_message && (
                              <div className="text-sm text-red-600 mt-1">
                                Erro: {message.error_message}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {getMessageStatusBadge(message.status)}
                            {message.retry_count > 0 && (
                              <Badge variant="outline">
                                {message.retry_count} tentativas
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      /* Mostrar contatos salvos na campanha */
                      disparo.target_contacts?.map((contact, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">
                              {contact.name || 'Nome não disponível'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {contact.phone}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">Pendente</Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum destinatário encontrado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
