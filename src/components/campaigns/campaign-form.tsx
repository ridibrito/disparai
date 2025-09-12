'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { PlanLimitAlert } from '@/components/plan/plan-limit-alert';

// Definir o esquema de validação
const disparoFormSchema = z.object({
  name: z.string().min(3, {
    message: 'O nome do disparo deve ter pelo menos 3 caracteres',
  }),
  message: z.string().min(5, {
    message: 'A mensagem deve ter pelo menos 5 caracteres',
  }),
  // Permitir disparos sem credencial (MVP/Sandbox) usando '' ou 'no-credentials'
  api_credential_id: z
    .string()
    .uuid({ message: 'Selecione uma credencial de API válida' })
    .or(z.literal(''))
    .or(z.literal('no-credentials')),
  target_lists: z.array(z.string()).optional(),
  schedule: z.boolean().default(false),
  scheduled_at: z.string().optional(),
});

type DisparoFormValues = z.infer<typeof disparoFormSchema>;

type ApiCredential = {
  id: string;
  name: string;
  provider: string;
};

type ContactList = {
  name: string;
  count: number;
};

type DisparoFormProps = {
  userId: string;
  initialData?: any;
  isEditing?: boolean;
};

export function DisparoForm({ userId, initialData, isEditing = false }: DisparoFormProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [apiCredentials, setApiCredentials] = useState<ApiCredential[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const [messageLimit, setMessageLimit] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  
  // Configurar o formulário
  const form = useForm<DisparoFormValues>({
    resolver: zodResolver(disparoFormSchema),
    defaultValues: initialData || {
      name: '',
      message: '',
      api_credential_id: '',
      target_lists: [],
      schedule: false,
      scheduled_at: '',
    },
  });
  
  // Observar o campo de agendamento
  const scheduleEnabled = form.watch('schedule');
  
  // Carregar credenciais de API e listas de contatos
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // Buscar credenciais de API
        const { data: credentials, error: credentialsError } = await supabase
          .from('api_credentials')
          .select('id, name, provider')
          .eq('user_id', userId);
        
        if (credentialsError) throw credentialsError;
        setApiCredentials(credentials || []);
        
        // Buscar listas de contatos únicas
        const { data: lists, error: listsError } = await supabase
          .from('contacts')
          .select('list')
          .eq('user_id', userId)
          .not('list', 'is', null);
        
        if (listsError) throw listsError;
        
        // Contar contatos por lista
        const uniqueLists = [...new Set(lists.map(l => l.list).filter(Boolean))];
        const listsWithCount: ContactList[] = [];
        
        for (const list of uniqueLists) {
          const { count, error } = await supabase
            .from('contacts')
            .select('id', { count: 'exact' })
            .eq('user_id', userId)
            .eq('list', list);
          
          if (!error) {
            listsWithCount.push({
              name: list,
              count: count || 0
            });
          }
        }
        
        setContactLists(listsWithCount);
        
        // Verificar limite de mensagens
        const { data: user } = await supabase
          .from('users')
          .select('*, plans(*)')
          .eq('id', userId)
          .single();
        
        const userPlan = user;
        
        const limit = userPlan?.plans?.features?.campaign_message_limit || 100;
        setMessageLimit(limit);
        
        // Buscar contagem atual de mensagens
        const { count: currentCount } = await supabase
          .from('campaign_messages')
          .select('id', { count: 'exact' })
          .eq('user_id', userId);
        
        setMessageCount(currentCount || 0);
        setHasReachedLimit(currentCount >= limit);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [userId, supabase]);
  
  // Função para calcular o número de mensagens que serão enviadas
  const calculateMessageCount = async (selectedLists: string[]) => {
    if (!selectedLists || selectedLists.length === 0) return 0;
    
    try {
      const { count } = await supabase
        .from('contacts')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .in('list', selectedLists);
      
      return count || 0;
    } catch (error) {
      console.error('Erro ao calcular contagem de mensagens:', error);
      return 0;
    }
  };
  
  // Função para enviar o formulário
  const onSubmit = async (values: DisparoFormValues) => {
    if (hasReachedLimit) {
      toast.error('Você atingiu o limite de mensagens do seu plano.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Calcular o número de mensagens que serão enviadas
      const toSendCount = await calculateMessageCount(values.target_lists || []);
      
      if ((messageCount + toSendCount) > messageLimit) {
        toast.error(`Este disparo enviará ${toSendCount} mensagens, o que excede seu limite disponível.`);
        setIsLoading(false);
        return;
      }
      
      // Preparar dados do disparo
      const disparoData = {
        user_id: userId,
        name: values.name,
        message: values.message,
        api_credential_id:
          values.api_credential_id && values.api_credential_id !== 'no-credentials'
            ? values.api_credential_id
            : null,
        target_lists: values.target_lists || [],
        status: values.schedule ? 'scheduled' : 'draft',
        scheduled_at: values.schedule ? new Date(values.scheduled_at || '').toISOString() : null,
      };
      
      let disparoId;
      
      if (isEditing && initialData?.id) {
        // Atualizar disparo existente
        const { data, error } = await supabase
          .from('disparos')
          .update(disparoData)
          .eq('id', initialData.id)
          .select()
          .single();
        
        if (error) throw error;
        disparoId = data.id;
        toast.success('Disparo atualizado com sucesso!');
      } else {
        // Criar novo disparo
        const { data, error } = await supabase
          .from('disparos')
          .insert(disparoData)
          .select()
          .single();
        
        if (error) throw error;
        disparoId = data.id;
        toast.success('Disparo criado com sucesso!');
      }
      
      // Criar mensagens pendentes para os contatos das listas selecionadas
      try {
        if ((values.target_lists || []).length > 0) {
          const { data: targetContacts, error: targetContactsError } = await supabase
            .from('contacts')
            .select('id')
            .eq('user_id', userId)
            .in('list', values.target_lists as string[]);

          if (targetContactsError) throw targetContactsError;

          const messagesToInsert = (targetContacts || []).map((c) => ({
            disparo_id: disparoId,
            contact_id: c.id,
            status: 'pending' as const,
          }));

          if (messagesToInsert.length > 0) {
            const { error: insertMessagesError } = await supabase
              .from('disparo_messages')
              .insert(messagesToInsert);

            if (insertMessagesError) throw insertMessagesError;
          }
        }
      } catch (messagesError) {
        console.error('Erro ao criar mensagens do disparo:', messagesError);
        toast.error('Disparo criado, mas houve erro ao gerar mensagens.');
      }

      // Redirecionar para a lista de disparos
      router.push(`/disparos`);
      router.refresh();
    } catch (error) {
      console.error('Erro ao salvar disparo:', error);
      toast.error('Erro ao salvar disparo. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (hasReachedLimit && !isEditing) {
    return (
      <PlanLimitAlert
        title="Limite de mensagens atingido"
        description={`Você atingiu o limite de ${messageLimit} mensagens do seu plano. Faça upgrade para enviar mais mensagens.`}
        actionLink="/dashboard/plans"
        actionText="Ver planos disponíveis"
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Disparo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Promoção de Julho" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Digite a mensagem que será enviada para os contatos"
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="api_credential_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credencial de API</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma credencial" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {apiCredentials.length > 0 ? (
                        apiCredentials.map((credential) => (
                          <SelectItem key={credential.id} value={credential.id}>
                            {credential.name} ({credential.provider})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-credentials" disabled>
                          Nenhuma credencial disponível
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>Listas de Contatos</FormLabel>
              <Card className="mt-2">
                <CardContent className="pt-6">
                  {contactLists.length > 0 ? (
                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="target_lists"
                        render={() => (
                          <FormItem>
                            {contactLists.map((list) => (
                              <FormField
                                key={list.name}
                                control={form.control}
                                name="target_lists"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={list.name}
                                      className="flex flex-row items-start space-x-3 space-y-0 py-1"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(list.name)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value || [], list.name])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== list.name
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel className="cursor-pointer">
                                          {list.name} <span className="text-gray-500 text-sm">({list.count} contatos)</span>
                                        </FormLabel>
                                      </div>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Nenhuma lista de contatos disponível</p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <FormField
              control={form.control}
              name="schedule"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Agendar envio</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            {scheduleEnabled && (
              <FormField
                control={form.control}
                name="scheduled_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data e hora de envio</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Disparo' : 'Criar Disparo'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}