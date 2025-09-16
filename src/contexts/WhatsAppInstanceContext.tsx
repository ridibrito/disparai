'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface WhatsAppInstance {
  id: string;
  instance_id: string;
  phone_number: string;
  name: string;
  type: 'whatsapp_disparai' | 'whatsapp_cloud';
  is_active: boolean;
  created_at: string;
}

interface WhatsAppInstanceContextType {
  activeInstance: WhatsAppInstance | null;
  instances: WhatsAppInstance[];
  setActiveInstance: (instance: WhatsAppInstance | null) => void;
  refreshInstances: () => Promise<void>;
  loading: boolean;
}

const WhatsAppInstanceContext = createContext<WhatsAppInstanceContextType | undefined>(undefined);

export function WhatsAppInstanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeInstance, setActiveInstance] = useState<WhatsAppInstance | null>(null);
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInstances = async () => {
    if (!user) {
      setInstances([]);
      setActiveInstance(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/connections');
      if (response.ok) {
        const data = await response.json();
        const whatsappInstances = data.connections?.filter((conn: any) => 
          conn.type === 'whatsapp_disparai' || conn.type === 'whatsapp_cloud'
        ) || [];
        
        setInstances(whatsappInstances);
        
        // Se não há instância ativa e há instâncias disponíveis, selecionar a primeira ativa
        if (!activeInstance && whatsappInstances.length > 0) {
          const firstActive = whatsappInstances.find((inst: WhatsAppInstance) => inst.is_active);
          if (firstActive) {
            setActiveInstance(firstActive);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar instâncias:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshInstances = async () => {
    await fetchInstances();
  };

  useEffect(() => {
    fetchInstances();
  }, [user]);

  // Escutar eventos de nova instância criada
  useEffect(() => {
    const handleNewInstance = () => {
      refreshInstances();
    };

    window.addEventListener('whatsapp-instance-created', handleNewInstance);
    return () => {
      window.removeEventListener('whatsapp-instance-created', handleNewInstance);
    };
  }, []);

  return (
    <WhatsAppInstanceContext.Provider
      value={{
        activeInstance,
        instances,
        setActiveInstance,
        refreshInstances,
        loading
      }}
    >
      {children}
    </WhatsAppInstanceContext.Provider>
  );
}

export function useWhatsAppInstance() {
  const context = useContext(WhatsAppInstanceContext);
  if (context === undefined) {
    throw new Error('useWhatsAppInstance must be used within a WhatsAppInstanceProvider');
  }
  return context;
}
