'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  QrCode, 
  Key,
  AlertCircle,
  CheckCircle,
  Clock,
  Battery,
  Signal
} from 'lucide-react';
import { whatsappMonitoringService, InstanceStatus } from '@/lib/whatsapp-monitoring';

interface WhatsAppConnectionManagerProps {
  instanceKey: string;
  instanceName: string;
  instanceType: 'whatsapp_disparai' | 'whatsapp_cloud';
  isActive: boolean;
}

export function WhatsAppConnectionManager({ 
  instanceKey, 
  instanceName, 
  instanceType,
  isActive 
}: WhatsAppConnectionManagerProps) {
  const [status, setStatus] = useState<InstanceStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoMonitoring, setAutoMonitoring] = useState(false);

  // Auto-start monitoring when instance is active
  useEffect(() => {
    if (isActive && !autoMonitoring) {
      console.log('🚀 Iniciando monitoramento automático para:', instanceKey);
      startAutoMonitoring();
    }
  }, [isActive, instanceKey, autoMonitoring]);

  const startAutoMonitoring = async () => {
    try {
      setAutoMonitoring(true);
      setLoading(true);
      
      // Load initial status
      await loadStatus();
      
      // Start continuous monitoring
      whatsappMonitoringService.startMonitoring(instanceKey, 10000); // Check every 10 seconds
      whatsappMonitoringService.onStatusChange(handleStatusChange);
      
      console.log('✅ Monitoramento automático iniciado');
    } catch (error) {
      console.error('❌ Erro ao iniciar monitoramento:', error);
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
        return <Activity className="h-4 w-4 text-yellow-500 animate-pulse" />;
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Smartphone className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {instanceName || `Instância ${instanceKey.slice(0, 8)}`}
              </CardTitle>
              <CardDescription>
                {instanceType === 'whatsapp_disparai' ? 'Disparai API' : 'WhatsApp Cloud'}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge className={getStatusColor()}>
              {getStatusText()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Details */}
        {status && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {status.phoneNumber && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Smartphone className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Telefone</p>
                  <p className="text-sm font-medium">{status.phoneNumber}</p>
                </div>
              </div>
            )}
            
            {status.isOnline !== undefined && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Signal className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Online</p>
                  <p className="text-sm font-medium">
                    {status.isOnline ? 'Sim' : 'Não'}
                  </p>
                </div>
              </div>
            )}
            
            {status.batteryLevel !== undefined && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Battery className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Bateria</p>
                  <p className="text-sm font-medium">{status.batteryLevel}%</p>
                </div>
              </div>
            )}
            
            {status.lastSeen && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Clock className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Última vez</p>
                  <p className="text-sm font-medium">
                    {new Date(status.lastSeen).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Connection Actions */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={loadStatus}
            disabled={loading}
          >
            <Activity className="h-4 w-4 mr-2" />
            {loading ? 'Verificando...' : 'Atualizar Status'}
          </Button>
          
          {status?.status === 'disconnected' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/configuracoes/conexao-api', '_blank')}
            >
              <Wifi className="h-4 w-4 mr-2" />
              Reconectar
            </Button>
          )}
          
          {status?.qrCode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Show QR Code modal
                console.log('Mostrar QR Code:', status.qrCode);
              }}
            >
              <QrCode className="h-4 w-4 mr-2" />
              Ver QR Code
            </Button>
          )}
          
          {status?.pairingCode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Show pairing code
                console.log('Código de pareamento:', status.pairingCode);
              }}
            >
              <Key className="h-4 w-4 mr-2" />
              Código de Pareamento
            </Button>
          )}
        </div>

        {/* Auto-monitoring indicator */}
        {autoMonitoring && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
            <Activity className="h-4 w-4 animate-pulse" />
            Monitoramento automático ativo
          </div>
        )}
      </CardContent>
    </Card>
  );
}
