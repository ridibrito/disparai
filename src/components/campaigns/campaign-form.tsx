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
const campaignFormSchema = z.object({
  name: z.string().min(3, {
    message: 'O nome da campanha deve ter pelo menos 3 caracteres',
  }),
  message: z.string().min(5, {
    message: 'A mensagem deve ter pelo menos 5 caracteres',
  }),
  api_credential_id: z.string().uuid({
    message: 'Selecione uma credencial de API válida',
  }),
  target_groups: z.array(z.string()).optional(),
  schedule: z.boolean().default(false),
  scheduled_at: z.string().optional(),
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

type ApiCredential = {
  id: string;
  name: string;
  provider: string;
};

type ContactGroup = {
  name: string;
  count: number;
};

type CampaignFormProps = {
  userId: string;
  initialData?: any;
  isEditing?: boolean;
};

export function CampaignForm({ userId, initialData, isEditing = false }: CampaignFormProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [apiCredentials, setApiCredentials] = useState<ApiCredential[]>([]);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const [messageLimit, setMessageLimit] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  
  // Configurar o formulário
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: initialData || {
      name: '',
      message: '',
      api_credential_id: '',
      target_groups: [],
      schedule: false,
      scheduled_at: '',
    },
  });
  
  // Observar o campo de agendamento
  const scheduleEnabled = form.watch('schedule');
  
  // Carregar credenciais de API e grupos de contatos
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
        
        // Buscar grupos de contatos únicos
        const { data: groups, error: groupsError } = await supabase
          .from('contacts')
          .select('group')
          .eq('user_id', userId)
          .not('group', 'is', null);
        
        if (groupsError) throw groupsError;
        
        // Contar contatos por grupo
        const uniqueGroups = [...new Set(groups.map(g => g.group).filter(Boolean))];
        const groupsWithCount: ContactGroup[] = [];
        
        for (const group of uniqueGroups) {
          const { count, error } = await supabase
            .from('contacts')
            .select('id', { count: 'exact' })
            .eq('user_id', userId)
            .eq('group', group);
          
          if (!error) {
            groupsWithCount.push({
              name: group,
              count: count || 0
            });
          }
        }
        
        setContactGroups(groupsWithCount);
        
        // Verificar limite de mensagens
        const { data: userPlan } = await supabase
          .from('user_plans')
          .select('*, plans(*)')
          .eq('user_id', userId)
          .single();
        
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
  const calculateMessageCount = async (selectedGroups: string[]) => {
    if (!selectedGroups || selectedGroups.length === 0) return 0;
    
    try {
      const { count } = await supabase
        .from('contacts')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .in('group', selectedGroups);
      
      return count || 0;
    } catch (error) {
      console.error('Erro ao calcular contagem de mensagens:', error);
      return 0;
    }
  };
  
  // Função para enviar o formulário
  const onSubmit = async (values: CampaignFormValues) => {
    if (hasReachedLimit) {
      toast.error('Você atingiu o limite de mensagens do seu plano.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Calcular o número de mensagens que serão enviadas
      const messageCount = await calculateMessageCount(values.target_groups || []);
      
      if (messageCount + messageCount > messageLimit) {
        toast.error(`Esta campanha enviará ${messageCount} mensagens, o que excede seu limite disponível.`);
        setIsLoading(false);
        return;
      }
      
      // Preparar dados da campanha
      const campaignData = {
        user_id: userId,
        name: values.name,
        message: values.message,
        api_credential_id: values.api_credential_id,
        target_groups: values.target_groups || [],
        status: values.schedule ? 'scheduled' : 'draft',
        scheduled_at: values.schedule ? new Date(values.scheduled_at || '').toISOString() : null,
      };
      
      let campaignId;
      
      if (isEditing && initialData?.id) {
        // Atualizar campanha existente
        const { data, error } = await supabase
          .from('campaigns')
          .update(campaignData)
          .eq('id', initialData.id)
          .select()
          .single();
        
        if (error) throw error;
        campaignId = data.id;
        toast.success('Campanha atualizada com sucesso!');
      } else {
        // Criar nova campanha
        const { data, error } = await supabase
          .from('campaigns')
          .insert(campaignData)
          .select()
          .single();
        
        if (error) throw error;
        campaignId = data.id;
        toast.success('Campanha criada com sucesso!');
      }
      
      // Redirecionar para a página de detalhes da campanha
      router.push(`/dashboard/campaigns/${campaignId}`);
      router.refresh();
    } catch (error) {
      console.error('Erro ao salvar campanha:', error);
      toast.error('Erro ao salvar campanha. Tente novamente.');
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
                  <FormLabel>Nome da Campanha</FormLabel>
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
              <FormLabel>Grupos de Contatos</FormLabel>
              <Card className="mt-2">
                <CardContent className="pt-6">
                  {contactGroups.length > 0 ? (
                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="target_groups"
                        render={() => (
                          <FormItem>
                            {contactGroups.map((group) => (
                              <FormField
                                key={group.name}
                                control={form.control}
                                name="target_groups"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={group.name}
                                      className="flex flex-row items-start space-x-3 space-y-0 py-1"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(group.name)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value || [], group.name])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== group.name
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel className="cursor-pointer">
                                          {group.name} <span className="text-gray-500 text-sm">({group.count} contatos)</span>
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
                    <p className="text-sm text-gray-500">Nenhum grupo de contatos disponível</p>
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
              {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Campanha' : 'Criar Campanha'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}