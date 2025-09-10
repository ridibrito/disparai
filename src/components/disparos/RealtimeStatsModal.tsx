'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  X
} from 'lucide-react';

interface RealtimeStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  campaignName: string;
}

interface CampaignStats {
  total: number;
  pending: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  deliveryRate: number;
  readRate: number;
  failureRate: number;
}

interface CampaignData {
  campaign: {
    id: string;
    name: string;
    status: string;
    started_at: string;
    completed_at?: string;
    progress: number;
  };
  statistics: CampaignStats;
  failedMessages: Array<{
    error_message: string;
    sent_at: string;
  }>;
  estimatedTimeRemaining?: number;
  lastUpdated: string;
}

export function RealtimeStatsModal({ isOpen, onClose, campaignId, campaignName }: RealtimeStatsModalProps) {
  const [data, setData] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/campaigns/${campaignId}/realtime-stats`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Erro ao carregar estatísticas');
      }
    } catch (err: any) {
      setError('Erro ao carregar estatísticas');
      console.error('Erro ao buscar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && campaignId) {
      fetchStats();
    }
  }, [isOpen, campaignId]);

  useEffect(() => {
    if (!isOpen || !autoRefresh || !data) return;

    const interval = setInterval(() => {
      fetchStats();
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, autoRefresh, data]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sending':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'sent':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!data) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Estatísticas em Tempo Real</DialogTitle>
            <DialogDescription>
              Carregando estatísticas para {campaignName}...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
              <p>Carregando estatísticas...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Estatísticas em Tempo Real
              </DialogTitle>
              <DialogDescription>
                {campaignName} - Atualizado em {new Date(data.lastUpdated).toLocaleString('pt-BR')}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-50 text-green-700' : ''}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto
              </Button>
              <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Status e Progresso */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Status da Campanha</span>
                <Badge className={getStatusColor(data.campaign.status)}>
                  {data.campaign.status === 'in_progress' ? 'Enviando' :
                   data.campaign.status === 'sent' ? 'Concluída' :
                   data.campaign.status === 'failed' ? 'Falhou' :
                   data.campaign.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Barra de Progresso */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progresso Geral</span>
                    <span>{data.campaign.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${data.campaign.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Informações de Tempo */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Iniciado:</span>
                    <p className="font-medium">
                      {new Date(data.campaign.started_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  {data.campaign.completed_at && (
                    <div>
                      <span className="text-gray-600">Concluído:</span>
                      <p className="font-medium">
                        {new Date(data.campaign.completed_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}
                  {data.estimatedTimeRemaining && (
                    <div>
                      <span className="text-gray-600">Tempo Restante:</span>
                      <p className="font-medium text-blue-600">
                        {formatTime(data.estimatedTimeRemaining)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{data.statistics.total}</p>
                    <p className="text-sm text-gray-600">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{data.statistics.sent}</p>
                    <p className="text-sm text-gray-600">Enviadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{data.statistics.delivered}</p>
                    <p className="text-sm text-gray-600">Entregues</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <XCircle className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{data.statistics.failed}</p>
                    <p className="text-sm text-gray-600">Falhas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Taxas de Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Taxas de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {data.statistics.deliveryRate}%
                  </div>
                  <p className="text-sm text-gray-600">Taxa de Entrega</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {data.statistics.readRate}%
                  </div>
                  <p className="text-sm text-gray-600">Taxa de Leitura</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {data.statistics.failureRate}%
                  </div>
                  <p className="text-sm text-gray-600">Taxa de Falha</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mensagens com Falha */}
          {data.failedMessages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  Mensagens com Falha ({data.failedMessages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {data.failedMessages.map((msg, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-sm text-red-800">{msg.error_message}</p>
                      <p className="text-xs text-red-600 mt-1">
                        {new Date(msg.sent_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
