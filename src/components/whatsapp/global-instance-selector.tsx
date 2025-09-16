'use client';

import React from 'react';
import { useWhatsAppInstance } from '@/contexts/WhatsAppInstanceContext';
import { WhatsAppInstanceSelector } from './whatsapp-instance-selector';
import { WhatsAppLoading } from '@/components/ui/whatsapp-loading';

interface GlobalInstanceSelectorProps {
  className?: string;
  showDetails?: boolean;
  isAdmin?: boolean;
}

export function GlobalInstanceSelector({ 
  className = '', 
  showDetails = true, 
  isAdmin = true 
}: GlobalInstanceSelectorProps) {
  const { activeInstance, instances, setActiveInstance, refreshInstances, loading } = useWhatsAppInstance();

  const handleInstanceChange = (instance: any) => {
    setActiveInstance(instance);
  };

  if (loading) {
    return (
      <WhatsAppLoading 
        size="sm" 
        text="Carregando instâncias..." 
        className={`p-4 ${className}`}
      />
    );
  }

  if (instances.length === 0) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-2">Nenhuma instância WhatsApp encontrada</div>
          <div className="text-xs text-gray-400">
            <a 
              href="/configuracoes/central-whatsapp" 
              className="text-green-600 hover:text-green-700 underline"
            >
              Conectar instância
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <WhatsAppInstanceSelector
      onInstanceChange={handleInstanceChange}
      className={className}
      showDetails={showDetails}
      isAdmin={isAdmin}
    />
  );
}
