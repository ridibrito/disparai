'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Send,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { WhatsAppAnalyticsServiceInstance, type AnalyticsData, type ReportConfig } from '@/lib/whatsapp-analytics';
import toast from 'react-hot-toast';

interface WhatsAppAnalyticsDashboardProps {
  instanceKey: string;
  instanceName?: string;
}

export function WhatsAppAnalyticsDashboard({ instanceKey, instanceName }: WhatsAppAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    period: 'month',
    groupBy: 'day'
  });

  // Carregar dados de análise
  useEffect(() => {
    loadAnalytics();
  }, [instanceKey, reportConfig]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const result = await WhatsAppAnalyticsServiceInstance.getAnalytics(instanceKey, reportConfig);
      
      if (result.success && result.data) {
        setAnalytics(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao carregar análise:', error);
      toast.error(error.message || 'Erro ao carregar dados de análise');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      const result = await WhatsAppAnalyticsServiceInstance.generateReport(instanceKey, reportConfig);
      
      if (result.success) {
        toast.success('Relatório gerado com sucesso!');
        // Aqui você pode implementar o download do relatório
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      toast.error(error.message || 'Erro ao gerar relatório');
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'day': return 'Último dia';
      case 'week': return 'Última semana';
      case 'month': return 'Último mês';
      case 'year': return 'Último ano';
      default: return period;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Send className="h-4 w-4 text-blue-500" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'read': return <Eye className="h-4 w-4 text-purple-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading && !analytics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Carregando dados de análise...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dashboard de Análise
          </CardTitle>
          <CardDescription>
            Acompanhe métricas e performance da sua instância WhatsApp
            {instanceName && (
              <Badge variant="secondary" className="ml-2">
                {instanceName}
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <Select
                value={reportConfig.period}
                onValueChange={(value) => setReportConfig(prev => ({ ...prev, period: value as any }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Último dia</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                  <SelectItem value="year">Último ano</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={reportConfig.groupBy}
                onValueChange={(value) => setReportConfig(prev => ({ ...prev, groupBy: value as any }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Agrupar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hour">Hora</SelectItem>
                  <SelectItem value="day">Dia</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={loadAnalytics} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Atualizar
              </Button>
              
              <Button onClick={generateReport}>
                <Download className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {analytics && (
        <>
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Mensagens</p>
                    <p className="text-2xl font-bold text-blue-600">{analytics.messages.total}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-500" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-gray-500">
                    {analytics.messages.sent} enviadas, {analytics.messages.received} recebidas
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taxa de Entrega</p>
                    <p className="text-2xl font-bold text-green-600">
                      {analytics.performance.deliveryRate.toFixed(1)}%
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-gray-500">
                    {analytics.messages.delivered} de {analytics.messages.sent} entregues
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taxa de Leitura</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {analytics.performance.readRate.toFixed(1)}%
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-purple-500" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-gray-500">
                    {analytics.messages.read} de {analytics.messages.sent} lidas
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Chats Ativos</p>
                    <p className="text-2xl font-bold text-orange-600">{analytics.chats.active}</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-500" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-gray-500">
                    {analytics.chats.total} total, {analytics.chats.archived} arquivados
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status das Mensagens */}
          <Card>
            <CardHeader>
              <CardTitle>Status das Mensagens</CardTitle>
              <CardDescription>
                Distribuição por status das mensagens enviadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  {getStatusIcon('sent')}
                  <div>
                    <p className="font-medium">Enviadas</p>
                    <p className="text-2xl font-bold text-blue-600">{analytics.messages.sent}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  {getStatusIcon('delivered')}
                  <div>
                    <p className="font-medium">Entregues</p>
                    <p className="text-2xl font-bold text-green-600">{analytics.messages.delivered}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  {getStatusIcon('read')}
                  <div>
                    <p className="font-medium">Lidas</p>
                    <p className="text-2xl font-bold text-purple-600">{analytics.messages.read}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  {getStatusIcon('failed')}
                  <div>
                    <p className="font-medium">Falharam</p>
                    <p className="text-2xl font-bold text-red-600">{analytics.messages.failed}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo de Contatos */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Contatos</CardTitle>
              <CardDescription>
                Estatísticas dos seus contatos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {analytics.contacts.total}
                  </div>
                  <div className="text-sm text-gray-500">Total de Contatos</div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {analytics.contacts.new}
                  </div>
                  <div className="text-sm text-gray-500">Novos (30 dias)</div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {analytics.contacts.active}
                  </div>
                  <div className="text-sm text-gray-500">Ativos (30 dias)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          {analytics.timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Timeline de Atividade</CardTitle>
                <CardDescription>
                  Atividade ao longo do tempo - {getPeriodLabel(reportConfig.period)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.timeline.slice(-10).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {new Date(item.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{item.messages}</span>
                          <span className="text-sm text-gray-500">mensagens</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-500" />
                          <span className="font-medium">{item.chats}</span>
                          <span className="text-sm text-gray-500">chats</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
