'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Settings,
  RefreshCw
} from 'lucide-react';
import { whatsappMonitoringService, InstanceStatus } from '@/lib/whatsapp-monitoring';

interface WhatsAppStatusIndicatorProps {
  instanceKey: string;
  instanceName?: string;
  showDetails?: boolean;
  isAdmin?: boolean;
  className?: string;
}

export function WhatsAppStatusIndicator({ 
  instanceKey, 
  instanceName,
  showDetails = false,
  isAdmin = false,
  className = ''
}: WhatsAppStatusIndicatorProps) {
  const [status, setStatus] = useState<InstanceStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoMonitoring, setAutoMonitoring] = useState(false);

  // Auto-start monitoring
  useEffect(() => {
    if (instanceKey && !autoMonitoring) {
      console.log('🚀 Iniciando monitoramento automático para status:', instanceKey);
      startAutoMonitoring();
    }
  }, [instanceKey, autoMonitoring]);

  const startAutoMonitoring = async () => {
    try {
      setAutoMonitoring(true);
      setLoading(true);
      
      // Load initial status
      await loadStatus();
      
      // Start continuous monitoring (less frequent for status indicator)
      whatsappMonitoringService.startMonitoring(instanceKey, 15000); // Check every 15 seconds
      whatsappMonitoringService.onStatusChange(handleStatusChange);
      
      console.log('✅ Monitoramento automático iniciado para status');
    } catch (error) {
      console.error('❌ Erro ao iniciar monitoramento de status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatus = async () => {
    try {
      const result = await whatsappMonitoringService.getInstanceStatus(instanceKey);
      if (result.success && result.data) {
        setStatus(result.data);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar status:', error);
    }
  };

  const handleStatusChange = (newStatus: InstanceStatus) => {
    setStatus(newStatus);
  };

  const getStatusIcon = () => {
    if (!status) return <Clock className="h-4 w-4 text-gray-400" />;
    
    switch (status.status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'connecting':
        return <Wifi className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    if (!status) return 'bg-gray-100 text-gray-600';
    
    switch (status.status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = () => {
    if (!status) return 'Verificando...';
    
    switch (status.status) {
      case 'connected':
        return 'Conectado';
      case 'disconnected':
        return 'Desconectado';
      case 'connecting':
        return 'Conectando...';
      default:
        return 'Status desconhecido';
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadStatus();
    setLoading(false);
  };

  const handleManageConnection = () => {
    window.open('/configuracoes/whatsapp-gestao', '_blank');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Status Icon and Badge */}
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <Badge className={getStatusColor()}>
          {getStatusText()}
        </Badge>
      </div>

      {/* Instance Name (if provided) */}
      {instanceName && (
        <span className="text-sm text-gray-600 hidden sm:inline">
          {instanceName}
        </span>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        {/* Refresh Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="h-6 w-6 p-0"
          title="Atualizar status"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>

        {/* Manage Button (Admin only) */}
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManageConnection}
            className="h-6 w-6 p-0"
            title="Gerenciar conexão"
          >
            <Settings className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Detailed Status (if enabled) */}
      {showDetails && status && (
        <div className="hidden lg:flex items-center gap-4 text-xs text-gray-500">
          {status.phoneNumber && (
            <span>📱 {status.phoneNumber}</span>
          )}
          {status.isOnline !== undefined && (
            <span className={status.isOnline ? 'text-green-600' : 'text-red-600'}>
              {status.isOnline ? '🟢 Online' : '🔴 Offline'}
            </span>
          )}
          {status.batteryLevel !== undefined && (
            <span>🔋 {status.batteryLevel}%</span>
          )}
        </div>
      )}

      {/* Auto-monitoring indicator (only for admin) */}
      {isAdmin && autoMonitoring && (
        <div className="hidden sm:flex items-center gap-1 text-xs text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Auto</span>
        </div>
      )}
    </div>
  );
}
