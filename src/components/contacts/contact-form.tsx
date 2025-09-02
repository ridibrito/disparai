'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabase';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { Database } from '@/lib/supabase';

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function formatBrazilPhone(input: string): string {
  const digits = onlyDigits(input).slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

const contactSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres' }),
  // Armazenar apenas dígitos; aceitar vazio para validação controlada
  phone: z
    .string()
    .transform((val) => onlyDigits(val || ''))
    .refine((val) => val.length === 10 || val.length === 11, { message: 'Telefone inválido' }),
  email: z.string().email({ message: 'Email inválido' }).optional().or(z.literal('')),
  group: z.string().optional(),
  notes: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

type ContactFormProps = {
  userId: string;
  contactId?: string;
  initialData?: ContactFormValues;
  onSaved?: () => void;
};

export function ContactForm({ userId, contactId, initialData, onSaved }: ContactFormProps) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayPhone, setDisplayPhone] = useState<string>(initialData?.phone ? formatBrazilPhone(initialData.phone) : '');
  
  // Sem dependência de contact_lists para evitar erros de RLS/recursão
  const ensureOrganization = async (): Promise<string> => {
    // Verifica se já existe uma organização com id == userId
    const { data: org, error: selErr } = await supabase
      .from('organizations' as any)
      .select('id')
      .eq('id', userId as any)
      .maybeSingle();
    if (!selErr && org?.id) return org.id as any;

    // Tenta criar (política: usuário pode criar sua própria organização)
    const { data: inserted, error: insErr } = await supabase
      .from('organizations' as any)
      .insert({ id: userId as any, owner_id: userId as any, name: 'Conta' })
      .select('id')
      .single();
    if (insErr) throw insErr;
    return inserted.id as any;
  };
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: initialData || {
      name: '',
      phone: '',
      email: '',
      group: '',
      notes: '',
    },
  });
  
  // Buscar grupos existentes
  const [groups, setGroups] = useState<string[]>([]);
  
  // Função para salvar o contato
  const onSubmit = async (data: ContactFormValues) => {
    try {
      setIsSubmitting(true);
      
      // data.phone já vem apenas com dígitos; adiciona prefixo '+'
      const phoneWithPrefix = `+${data.phone}`;
      const customFields: Record<string, any> = {};
      if (data.group) customFields.group = data.group;
      if (data.notes) customFields.notes = data.notes;
      if (data.email) customFields.email = data.email;

      // Garante que exista a organização do usuário
      const orgId = await ensureOrganization();

      const contactInsert: Record<string, any> = {
        user_id: userId,
        organization_id: orgId,
        phone: phoneWithPrefix,
        name: data.name || null,
        custom_fields: Object.keys(customFields).length ? customFields : undefined,
      };
      
      if (contactId) {
        // Atualizar contato existente
        const { error } = await supabase
          .from('contacts')
          .update({
            phone: phoneWithPrefix,
            name: data.name || null,
            custom_fields: Object.keys(customFields).length ? customFields : {}
          })
          .eq('id', contactId)
          .eq('user_id', userId);
        
        if (error) throw error;
        toast.success('Contato atualizado com sucesso!');
      } else {
        // Criar novo contato
        const { error } = await supabase
          .from('contacts')
          .insert(contactInsert);
        
        if (error) throw error;
        toast.success('Contato adicionado com sucesso!');
      }
      
      // Atualizar lista e fechar modal (se fornecido)
      try {
        document.dispatchEvent(new CustomEvent('contacts:refresh'));
      } catch {}
      router.refresh();
      onSaved?.();
    } catch (error: any) {
      console.error('Erro ao salvar contato:', error);
      toast.error(error.message || 'Erro ao salvar contato. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nome <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            placeholder="Nome completo"
            {...register('name')}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone <span className="text-red-500">*</span></Label>
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                value={displayPhone}
                onChange={(e) => {
                  const masked = formatBrazilPhone(e.target.value);
                  setDisplayPhone(masked);
                  field.onChange(onlyDigits(masked));
                }}
                className={errors.phone ? 'border-red-500' : ''}
              />
            )}
          />
          {errors.phone && (
            <p className="text-red-500 text-sm">{errors.phone.message}</p>
          )}
          <p className="text-xs text-gray-500">Formato: (11) 99999-9999 • Salvamos apenas números com + no banco</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="email@exemplo.com"
            {...register('email')}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="group">Grupo</Label>
          <Input
            id="group"
            placeholder="Nome do grupo"
            {...register('group')}
          />
          <p className="text-xs text-gray-500">Opcional: Categorize seus contatos</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          placeholder="Informações adicionais sobre o contato"
          {...register('notes')}
          rows={4}
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/contatos')}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : contactId ? 'Atualizar Contato' : 'Adicionar Contato'}
        </Button>
      </div>
    </form>
  );
}