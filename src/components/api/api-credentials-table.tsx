'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';
import { Trash2, Edit, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ApiCredential = {
  id: string;
  name: string;
  provider: string;
  api_key: string;
  api_secret?: string;
  phone_number_id?: string;
  webhook_url?: string;
  created_at: string;
  updated_at: string;
};

type ApiCredentialsTableProps = {
  initialCredentials: ApiCredential[];
  onEdit?: (credential: ApiCredential) => void;
};

export default function ApiCredentialsTable({
  initialCredentials,
  onEdit,
}: ApiCredentialsTableProps) {
  const [credentials, setCredentials] = useState<ApiCredential[]>(initialCredentials);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();

  // Função para formatar o nome do provedor
  const formatProviderName = (provider: string) => {
    const providerMap: Record<string, string> = {
      whatsapp_business: 'WhatsApp Business',
      whatsapp_cloud: 'WhatsApp Cloud',
      twilio: 'Twilio',
      custom: 'API Personalizada',
    };

    return providerMap[provider] || provider;
  };

  // Função para atualizar a lista de credenciais
  const refreshCredentials = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/api-credentials');
      if (!response.ok) {
        throw new Error('Erro ao buscar credenciais');
      }
      const data = await response.json();
      setCredentials(data.credentials);
      toast.success('Lista de credenciais atualizada');
    } catch (error) {
      console.error('Erro ao atualizar credenciais:', error);
      toast.error('Erro ao atualizar lista de credenciais');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para excluir uma credencial
  const deleteCredential = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta credencial?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/api-credentials?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir credencial');
      }

      // Atualizar a lista local removendo a credencial excluída
      setCredentials(credentials.filter((cred) => cred.id !== id));
      toast.success('Credencial excluída com sucesso');
    } catch (error) {
      console.error('Erro ao excluir credencial:', error);
      toast.error('Erro ao excluir credencial');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para mascarar a chave de API
  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Credenciais de API Configuradas</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshCredentials}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {credentials.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            Nenhuma credencial de API configurada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Nome</th>
                  <th className="text-left py-3 px-4">Provedor</th>
                  <th className="text-left py-3 px-4">Chave API</th>
                  <th className="text-left py-3 px-4">Última Atualização</th>
                  <th className="text-right py-3 px-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {credentials.map((credential) => (
                  <tr key={credential.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">{credential.name}</td>
                    <td className="py-3 px-4">{formatProviderName(credential.provider)}</td>
                    <td className="py-3 px-4 font-mono">{maskApiKey(credential.api_key)}</td>
                    <td className="py-3 px-4">
                      {new Date(credential.updated_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit?.(credential)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCredential(credential.id)}
                          title="Excluir"
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}