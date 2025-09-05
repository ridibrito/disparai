'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface WhatsAppInstance {
  id: string;
  organization_id: string;
  instance_key: string;
  token: string;
  status: 'pendente' | 'ativo' | 'desconectado';
  webhook_url: string;
  created_at: string;
  updated_at: string;
}

export default function InstancesList() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadInstances = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/instances');
      const result = await response.json();
      
      if (result.success) {
        setInstances(result.instances);
        console.log('📋 Instâncias carregadas:', result.instances.length);
      } else {
        toast.error('Erro ao carregar instâncias: ' + result.error);
      }
    } catch (error: any) {
      console.error('Erro ao carregar instâncias:', error);
      toast.error('Erro ao carregar instâncias: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInstances();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'desconectado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativo':
        return <CheckCircle className="w-4 h-4" />;
      case 'pendente':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'desconectado':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando instâncias...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Instâncias Criadas</h3>
        <Button
          onClick={loadInstances}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {instances.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma instância encontrada
            </h4>
            <p className="text-gray-600">
              Crie uma instância do WhatsApp para vê-la aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {instances.map((instance) => (
            <Card key={instance.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-green-600" />
                      {instance.instance_key}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Criada em {new Date(instance.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <Badge className={getStatusColor(instance.status)}>
                    {getStatusIcon(instance.status)}
                    <span className="ml-1 capitalize">{instance.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>ID:</strong> {instance.id}
                  </p>
                  <p className="text-sm">
                    <strong>Organization ID:</strong> {instance.organization_id}
                  </p>
                  <p className="text-sm">
                    <strong>Webhook URL:</strong> {instance.webhook_url}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
