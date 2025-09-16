'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Battery, 
  BatteryLow, 
  BatteryMedium, 
  BatteryFull,
  QrCode,
  Smartphone,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { whatsappMonitoringService, type InstanceStatus } from '@/lib/whatsapp-monitoring';
import toast from 'react-hot-toast';

interface WhatsAppMonitoringProps {
  instanceKey: string;
  instanceName?: string;
}

export function WhatsAppMonitoring({ instanceKey, instanceName }: WhatsAppMonitoringProps) {
  const [status, setStatus] = useState<InstanceStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showPairingCode, setShowPairingCode] = useState(false);

  // Carregar status inicial
  useEffect(() => {
    loadStatus();
  }, [instanceKey]);

  // Configurar monitoramento
  useEffect(() => {
    if (monitoring) {
      whatsappMonitoringService.startMonitoring(instanceKey, 5000);
      whatsappMonitoringService.onStatusChange(handleStatusChange);
    } else {
      whatsappMonitoringService.stopMonitoring();
      whatsappMonitoringService.removeStatusCallback(handleStatusChange);
    }

    return () => {
      whatsappMonitoringService.stopMonitoring();
      whatsappMonitoringService.removeStatusCallback(handleStatusChange);
    };
  }, [monitoring, instanceKey]);

  const handleStatusChange = (newStatus: InstanceStatus) => {
    setStatus(newStatus);
    
    // Salvar no banco local
    whatsappMonitoringService.saveInstanceStatus(instanceKey, newStatus);
    
    // Notificar mudanças importantes
    if (newStatus.status === 'connected' && status?.status !== 'connected') {
      toast.success('Instância conectada com sucesso!');
    } else if (newStatus.status === 'disconnected' && status?.status === 'connected') {
      toast.error('Instância desconectada!');
    }
  };

  const loadStatus = async () => {
    try {
      setLoading(true);
      const result = await whatsappMonitoringService.loadInstanceStatus(instanceKey);
      
      if (result.success && result.data) {
        setStatus({
          instanceKey,
          status: result.data.status,
          qrCode: result.data.qr_code,
          pairingCode: result.data.pairing_code,
          lastSeen: result.data.last_seen,
          batteryLevel: result.data.battery_level,
          isOnline: result.data.is_online,
          phoneNumber: result.data.phone_number,
          profileName: result.data.profile_name,
          profilePicture: result.data.profile_picture
        });
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    try {
      setLoading(true);
      const result = await whatsappMonitoringService.getInstanceStatus(instanceKey);
      
      if (result.success && result.data) {
        const newStatus: InstanceStatus = {
          instanceKey,
          status: result.data.status || 'disconnected',
          qrCode: result.data.qrCode,
          pairingCode: result.data.pairingCode,
          lastSeen: result.data.lastSeen,
          batteryLevel: result.data.batteryLevel,
          isOnline: result.data.isOnline,
          phoneNumber: result.data.phoneNumber,
          profileName: result.data.profileName,
          profilePicture: result.data.profilePicture
        };
        
        setStatus(newStatus);
        await whatsappMonitoringService.saveInstanceStatus(instanceKey, newStatus);
        toast.success('Status atualizado!');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast.error(error.message || 'Erro ao atualizar status');
    } finally {
      setLoading(false);
    }
  };

  const getQRCode = async () => {
    try {
      const result = await whatsappMonitoringService.getQRCode(instanceKey);
      
      if (result.success && result.data) {
        setStatus(prev => prev ? { ...prev, qrCode: result.data.qrCode } : null);
        setShowQRCode(true);
        toast.success('QR Code obtido!');
      }
    } catch (error: any) {
      console.error('Erro ao obter QR Code:', error);
      toast.error(error.message || 'Erro ao obter QR Code');
    }
  };

  const getPairingCode = async () => {
    try {
      const result = await whatsappMonitoringService.getPairingCode(instanceKey);
      
      if (result.success && result.data) {
        setStatus(prev => prev ? { ...prev, pairingCode: result.data.pairingCode } : null);
        setShowPairingCode(true);
        toast.success('Código de pareamento obtido!');
      }
    } catch (error: any) {
      console.error('Erro ao obter código de pareamento:', error);
      toast.error(error.message || 'Erro ao obter código de pareamento');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <Wifi className="h-4 w-4" />;
      case 'connecting': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <WifiOff className="h-4 w-4" />;
    }
  };

  const getBatteryIcon = (level?: number) => {
    if (!level) return <Battery className="h-4 w-4" />;
    
    if (level <= 25) return <BatteryLow className="h-4 w-4 text-red-500" />;
    if (level <= 50) return <BatteryMedium className="h-4 w-4 text-yellow-500" />;
    if (level <= 75) return <BatteryMedium className="h-4 w-4 text-yellow-500" />;
    return <BatteryFull className="h-4 w-4 text-green-500" />;
  };

  if (loading && !status) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Carregando status...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Monitoramento em Tempo Real
          </CardTitle>
          <CardDescription>
            Acompanhe o status da sua instância WhatsApp
          </CardDescription>
          {instanceName && (
            <div className="mt-2">
              <Badge variant="secondary">
                {instanceName}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Principal */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(status?.status || 'disconnected')}`} />
              <span className="font-medium">
                Status: {status?.status || 'Desconectado'}
              </span>
              {getStatusIcon(status?.status || 'disconnected')}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshStatus}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Atualizar
              </Button>
              
              <Button
                variant={monitoring ? "destructive" : "default"}
                size="sm"
                onClick={() => setMonitoring(!monitoring)}
              >
                {monitoring ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Parar Monitoramento
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Iniciar Monitoramento
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Informações da Instância */}
          {status && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Informações da Instância</h4>
                <div className="space-y-1 text-sm">
                  {status.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <span>{status.phoneNumber}</span>
                    </div>
                  )}
                  {status.profileName && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Nome:</span>
                      <span>{status.profileName}</span>
                    </div>
                  )}
                  {status.lastSeen && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Última vez visto:</span>
                      <span>{new Date(status.lastSeen).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Status do Dispositivo</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Online:</span>
                    <Badge variant={status.isOnline ? "default" : "secondary"}>
                      {status.isOnline ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                  {status.batteryLevel !== undefined && (
                    <div className="flex items-center gap-2">
                      {getBatteryIcon(status.batteryLevel)}
                      <span className="font-medium">Bateria:</span>
                      <span>{status.batteryLevel}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Ações de Conexão */}
          {status?.status === 'disconnected' && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Conectar Instância</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={getQRCode}
                  disabled={loading}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Obter QR Code
                </Button>
                
                <Button
                  variant="outline"
                  onClick={getPairingCode}
                  disabled={loading}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Código de Pareamento
                </Button>
              </div>
            </div>
          )}

          {/* QR Code Modal */}
          {showQRCode && status?.qrCode && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">QR Code para Conexão</h4>
              <div className="flex justify-center">
                <img 
                  src={status.qrCode} 
                  alt="QR Code" 
                  className="max-w-48 max-h-48"
                />
              </div>
              <p className="text-sm text-gray-500 text-center mt-2">
                Escaneie este QR Code com seu WhatsApp
              </p>
            </div>
          )}

          {/* Código de Pareamento Modal */}
          {showPairingCode && status?.pairingCode && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Código de Pareamento</h4>
              <div className="text-center">
                <div className="text-2xl font-mono font-bold bg-gray-100 p-4 rounded-lg">
                  {status.pairingCode}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Digite este código no WhatsApp > Dispositivos conectados
                </p>
              </div>
            </div>
          )}

          {/* Indicador de Monitoramento */}
          {monitoring && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Monitoramento ativo - Atualizações a cada 5 segundos
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
