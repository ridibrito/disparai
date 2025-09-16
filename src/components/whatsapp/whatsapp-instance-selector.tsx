'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings
} from 'lucide-react';
import Image from 'next/image';
import { whatsappMonitoringService, InstanceStatus } from '@/lib/whatsapp-monitoring';
import { Tooltip } from '@/components/ui/tooltip';
import { WhatsAppLoading } from '@/components/ui/whatsapp-loading';

interface WhatsAppInstance {
  id: string;
  instance_id: string;
  phone_number: string;
  name: string;
  type: 'whatsapp_disparai' | 'whatsapp_cloud';
  is_active: boolean;
  created_at: string;
}

interface WhatsAppInstanceSelectorProps {
  onInstanceChange?: (instance: WhatsAppInstance) => void;
  className?: string;
  showDetails?: boolean;
  isAdmin?: boolean;
  refreshTrigger?: number; // Para forçar refresh quando uma nova instância for criada
}

export function WhatsAppInstanceSelector({ 
  onInstanceChange,
  className = '',
  showDetails = true,
  isAdmin = true,
  refreshTrigger
}: WhatsAppInstanceSelectorProps) {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(null);
  const [instanceStatuses, setInstanceStatuses] = useState<Record<string, InstanceStatus>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Buscar instâncias do usuário
  useEffect(() => {
    fetchInstances();
  }, []);

  // Reagir ao refreshTrigger para atualizar instâncias
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchInstances();
    }
  }, [refreshTrigger]);

  // Monitorar status de todas as instâncias
  useEffect(() => {
    if (instances.length > 0) {
      startMonitoringAllInstances();
    }
  }, [instances]);

  const fetchInstances = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/connections');
      if (response.ok) {
        const data = await response.json();
        const whatsappInstances = data.connections?.filter((conn: any) => 
          conn.type === 'whatsapp_disparai' || conn.type === 'whatsapp_cloud'
        ) || [];
        
        setInstances(whatsappInstances);
        
        // Selecionar primeira instância ativa por padrão
        const activeInstance = whatsappInstances.find((inst: WhatsAppInstance) => inst.is_active);
        if (activeInstance) {
          setSelectedInstance(activeInstance);
          onInstanceChange?.(activeInstance);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar instâncias:', error);
    } finally {
      setLoading(false);
    }
  };

  const startMonitoringAllInstances = () => {
    instances.forEach(instance => {
      const instanceKey = instance.instance_id || instance.phone_number;
      if (instanceKey) {
        // Monitorar cada instância
        whatsappMonitoringService.startMonitoring(instanceKey, 20000); // 20s para múltiplas instâncias
        whatsappMonitoringService.onStatusChange((status: InstanceStatus) => {
          if (status.instanceKey === instanceKey) {
            setInstanceStatuses(prev => ({
              ...prev,
              [instanceKey]: status
            }));
          }
        });
      }
    });
  };

  const handleInstanceSelect = (instance: WhatsAppInstance) => {
    setSelectedInstance(instance);
    setIsOpen(false);
    onInstanceChange?.(instance);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInstances();
    setRefreshing(false);
  };

  const getStatusIcon = (instance: WhatsAppInstance) => {
    const instanceKey = instance.instance_id || instance.phone_number;
    const status = instanceStatuses[instanceKey];
    
    // Se não há status de monitoramento, usar o status da instância diretamente
    if (!status) {
      if (instance.is_active && (instance.status === 'active' || instance.status === 'connected')) {
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      }
      return <Clock className="h-4 w-4 text-gray-400" />;
    }
    
    switch (status.status) {
      case 'connected':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'connecting':
        return <Wifi className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (instance: WhatsAppInstance) => {
    const instanceKey = instance.instance_id || instance.phone_number;
    const status = instanceStatuses[instanceKey];
    
    // Se não há status de monitoramento, usar o status da instância diretamente
    if (!status) {
      if (instance.is_active && (instance.status === 'active' || instance.status === 'connected')) {
        return 'bg-[#25D366] text-white';
      }
      return 'bg-gray-100 text-gray-600';
    }
    
    switch (status.status) {
      case 'connected':
      case 'active':
        return 'bg-[#25D366] text-white';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (instance: WhatsAppInstance) => {
    const instanceKey = instance.instance_id || instance.phone_number;
    const status = instanceStatuses[instanceKey];
    
    // Se não há status de monitoramento, usar o status da instância diretamente
    if (!status) {
      if (instance.is_active && (instance.status === 'active' || instance.status === 'connected')) {
        return 'Conectado';
      }
      return 'Verificando...';
    }
    
    switch (status.status) {
      case 'connected':
      case 'active':
        return 'Conectado';
      case 'disconnected':
        return 'Desconectado';
      case 'connecting':
        return 'Conectando...';
      default:
        return 'Status desconhecido';
    }
  };

  const getStatusTooltip = (instance: WhatsAppInstance) => {
    const instanceKey = instance.instance_id || instance.phone_number;
    const status = instanceStatuses[instanceKey];
    
    // Se não há status de monitoramento, usar informações básicas da instância
    if (!status) {
      const details = [];
      if (instance.phone_number) details.push(`📱 ${instance.phone_number}`);
      if (instance.is_active) details.push('🟢 Ativa');
      details.push(`📊 Status: ${instance.status}`);
      return details.join('\n');
    }
    
    const details = [];
    if (status.phoneNumber) details.push(`📱 ${status.phoneNumber}`);
    if (status.isOnline !== undefined) details.push(status.isOnline ? '🟢 Online' : '🔴 Offline');
    if (status.batteryLevel !== undefined) details.push(`🔋 ${status.batteryLevel}%`);
    if (status.lastSeen) details.push(`👁️ Visto: ${new Date(status.lastSeen).toLocaleString()}`);
    
    return details.length > 0 ? details.join('\n') : 'Status básico disponível';
  };

  if (loading) {
    return (
      <WhatsAppLoading 
        size="sm" 
        text="Carregando instâncias..." 
        className={className}
      />
    );
  }

  if (instances.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Image 
          src="/whatsapp-icon.png" 
          alt="WhatsApp" 
          width={16} 
          height={16}
          className="opacity-50"
        />
        <span className="text-sm text-gray-600">Nenhuma instância encontrada</span>
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('/configuracoes/whatsapp-gestao', '_blank')}
            className="h-6 px-2 text-xs text-[#25D366] hover:bg-[#25D366] hover:text-white"
          >
            <Settings className="h-3 w-3 mr-1" />
            Configurar
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-8 px-3 text-sm border-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
      >
        <Image 
          src="/whatsapp-icon.png" 
          alt="WhatsApp" 
          width={16} 
          height={16}
          className="flex-shrink-0"
        />
        <span className="truncate max-w-[120px]">
          {selectedInstance?.name || 'Selecionar instância'}
        </span>
        {selectedInstance && (
          <div className="flex items-center gap-1">
            {getStatusIcon(selectedInstance)}
            <Badge className={`${getStatusColor(selectedInstance)} text-xs px-1 py-0`}>
              {getStatusText(selectedInstance)}
            </Badge>
          </div>
        )}
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Image 
                src="/whatsapp-icon.png" 
                alt="WhatsApp" 
                width={20} 
                height={20}
              />
              <h3 className="font-medium text-gray-900">Instâncias WhatsApp</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-6 w-6 p-0"
                title="Atualizar instâncias"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open('/configuracoes/whatsapp-gestao', '_blank')}
                  className="h-6 w-6 p-0"
                  title="Gerenciar instâncias"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Instances List */}
          <div className="max-h-64 overflow-y-auto">
            {instances.map((instance) => {
              const instanceKey = instance.instance_id || instance.phone_number;
              const isSelected = selectedInstance?.id === instance.id;
              const status = instanceStatuses[instanceKey];
              
              return (
                <Tooltip
                  key={instance.id}
                  content={getStatusTooltip(instance)}
                  position="right"
                  delay={300}
                >
                  <div
                    onClick={() => handleInstanceSelect(instance)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                      isSelected ? 'bg-[#25D366]/10 border-l-4 border-l-[#25D366]' : ''
                    }`}
                  >
                    <div className="space-y-2">
                      {/* Header com nome e status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(instance)}
                          <h4 className="font-medium text-gray-900">
                            {instance.name}
                          </h4>
                          {isSelected && (
                            <Badge className="bg-[#25D366] text-white text-xs">
                              Ativa
                            </Badge>
                          )}
                        </div>
                        <Badge className={getStatusColor(instance)}>
                          {getStatusText(instance)}
                        </Badge>
                      </div>
                      
                      {/* Informações da instância */}
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          📱 {instance.phone_number || instance.instance_id}
                        </p>
                        
                        {showDetails && status && (
                          <div className="space-y-1 text-xs text-gray-500">
                            {status.phoneNumber && status.phoneNumber !== (instance.phone_number || instance.instance_id) && (
                              <p>📞 {status.phoneNumber}</p>
                            )}
                            {status.isOnline !== undefined && (
                              <p className={status.isOnline ? 'text-green-600' : 'text-red-600'}>
                                {status.isOnline ? '🟢 Online' : '🔴 Offline'}
                              </p>
                            )}
                            {status.batteryLevel !== undefined && (
                              <p>🔋 Bateria: {status.batteryLevel}%</p>
                            )}
                            {status.lastSeen && (
                              <p>👁️ Visto: {new Date(status.lastSeen).toLocaleString('pt-BR')}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Tooltip>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-[#25D366]/5">
            <p className="text-xs text-gray-600 text-center">
              {instances.length} instância{instances.length !== 1 ? 's' : ''} encontrada{instances.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
