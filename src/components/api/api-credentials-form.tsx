'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database } from '@/lib/supabase';

type ApiCredential = Database['public']['Tables']['api_credentials']['Row'];

const apiCredentialsSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  provider: z.enum(['whatsapp', 'twilio', 'messagebird', 'zenvia', 'infobip'], {
    required_error: 'Selecione um provedor',
  }),
  api_key: z.string().min(5, { message: 'Chave de API inválida' }),
  api_secret: z.string().optional(),
  phone_number_id: z.string().optional(),
  webhook_url: z.string().url({ message: 'URL de webhook inválida' }).optional().or(z.literal('')),
});

type ApiCredentialsFormValues = z.infer<typeof apiCredentialsSchema>;

type ApiCredentialsFormProps = {
  credential?: ApiCredential;
  onSuccess?: () => void;
};

export function ApiCredentialsForm({ credential, onSuccess }: ApiCredentialsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{ valid: boolean; message: string } | null>(null);
  const supabase = createClientComponentClient<Database>();
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ApiCredentialsFormValues>({
    resolver: zodResolver(apiCredentialsSchema),
    defaultValues: {
      name: credential?.name || '',
      provider: credential?.provider || 'whatsapp',
      api_key: credential?.api_key || '',
      api_secret: credential?.api_secret || '',
      phone_number_id: credential?.phone_number_id || '',
      webhook_url: credential?.webhook_url || '',
    },
  });
  
  const selectedProvider = watch('provider');
  
  // Função para validar as credenciais antes de salvar
  const validateCredentials = async (data: ApiCredentialsFormValues) => {
    setIsValidating(true);
    setValidationStatus(null);
    
    try {
      const validationResponse = await fetch('/api/credentials/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: data.provider,
          api_key: data.api_key,
          api_secret: data.api_secret,
          phone_number_id: data.phone_number_id,
        }),
      });
      
      const validationResult = await validationResponse.json();
      
      setValidationStatus({
        valid: validationResult.valid,
        message: validationResult.message || (validationResult.valid ? 'Credenciais válidas' : 'Credenciais inválidas')
      });
      
      if (!validationResult.valid) {
        toast.error(validationResult.message || 'Credenciais inválidas');
        return false;
      }
      
      toast.success(validationResult.message || 'Credenciais validadas com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao validar credenciais:', error);
      toast.error('Erro ao validar credenciais');
      setValidationStatus({
        valid: false,
        message: error instanceof Error ? error.message : 'Erro ao validar credenciais'
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  };
  
  const onSubmit = async (data: ApiCredentialsFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Validar as credenciais com a API externa
      const isValid = await validateCredentials(data);
      if (!isValid) {
        return;
      }
      
      // Salvar ou atualizar as credenciais
      const method = credential ? 'PUT' : 'POST';
      const body = credential ? { ...data, id: credential.id } : data;
      
      const response = await fetch('/api/credentials', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        toast.error(result.error || 'Erro ao salvar credenciais');
        return;
      }
      
      toast.success(result.message || 'Credenciais salvas com sucesso!');
      reset();
      setValidationStatus(null);
      
      // Chamar callback de sucesso se fornecido
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao processar credenciais:', error);
      toast.error('Erro ao processar credenciais');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para obter descrição do provedor
  const getProviderDescription = (provider: string) => {
    switch (provider) {
      case 'whatsapp':
        return 'Conecte-se à API do WhatsApp Business para enviar mensagens programadas.';
      case 'twilio':
        return 'Integre com o Twilio para envio de mensagens SMS e WhatsApp.';
      case 'messagebird':
        return 'Utilize a MessageBird para comunicação omnichannel.';
      case 'zenvia':
        return 'Conecte-se à Zenvia para envio de mensagens via WhatsApp e SMS.';
      case 'infobip':
        return 'Integre com a Infobip para comunicação global via múltiplos canais.';
      default:
        return '';
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configuração de API</CardTitle>
        <CardDescription>
          Configure suas credenciais para integração com serviços de mensagens.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name" className="block text-sm font-medium mb-1">
                Nome da Conexão *
              </Label>
              <Input
                id="name"
                placeholder="Ex: WhatsApp Principal"
                disabled={isSubmitting}
                {...register('name')}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="provider" className="block text-sm font-medium mb-1">
                Provedor *
              </Label>
              <Select 
                defaultValue={selectedProvider}
                onValueChange={(value) => {
                  setValue('provider', value as any);
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Selecione um provedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp Business API</SelectItem>
                  <SelectItem value="twilio">Twilio</SelectItem>
                  <SelectItem value="messagebird">MessageBird</SelectItem>
                  <SelectItem value="zenvia">Zenvia</SelectItem>
                  <SelectItem value="infobip">Infobip</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" {...register('provider')} />
              {errors.provider && (
                <p className="mt-1 text-sm text-destructive">{errors.provider.message}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {getProviderDescription(selectedProvider)}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="api_key" className="block text-sm font-medium mb-1">
                Chave de API *
              </Label>
              <Input
                id="api_key"
                type="password"
                placeholder="Sua chave de API"
                disabled={isSubmitting}
                {...register('api_key')}
              />
              {errors.api_key && (
                <p className="mt-1 text-sm text-destructive">{errors.api_key.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="api_secret" className="block text-sm font-medium mb-1">
                Segredo da API {selectedProvider === 'twilio' ? '*' : ''}
              </Label>
              <Input
                id="api_secret"
                type="password"
                placeholder="Seu segredo de API"
                disabled={isSubmitting}
                {...register('api_secret')}
              />
              {errors.api_secret && (
                <p className="mt-1 text-sm text-destructive">{errors.api_secret.message}</p>
              )}
            </div>
          </div>
          
          {selectedProvider === 'whatsapp' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="phone_number_id" className="block text-sm font-medium mb-1">
                  ID do Número de Telefone *
                </Label>
                <Input
                  id="phone_number_id"
                  placeholder="ID do número de telefone"
                  disabled={isSubmitting}
                  {...register('phone_number_id')}
                />
                {errors.phone_number_id && (
                  <p className="mt-1 text-sm text-destructive">{errors.phone_number_id.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="webhook_url" className="block text-sm font-medium mb-1">
                  URL de Webhook
                </Label>
                <Input
                  id="webhook_url"
                  placeholder="https://seu-webhook.com/api/whatsapp"
                  disabled={isSubmitting}
                  {...register('webhook_url')}
                />
                {errors.webhook_url && (
                  <p className="mt-1 text-sm text-destructive">{errors.webhook_url.message}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  URL para receber notificações de eventos (opcional).
                </p>
              </div>
            </div>
          )}
          
          {validationStatus && (
            <div className={`p-3 rounded-md ${validationStatus.valid ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {validationStatus.message}
            </div>
          )}
          
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setValidationStatus(null);
              }}
              disabled={isSubmitting || isValidating}
            >
              Cancelar
            </Button>
            
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => validateCredentials(watch())}
                disabled={isSubmitting || isValidating}
              >
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validando...
                  </>
                ) : (
                  'Validar Credenciais'
                )}
              </Button>
              
              <Button
                type="submit"
                disabled={isSubmitting || isValidating}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  credential ? 'Atualizar Credenciais' : 'Salvar Credenciais'
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}