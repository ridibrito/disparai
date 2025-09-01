'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { Database } from '@/lib/supabase';

const contactSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres' }),
  phone: z
    .string()
    .min(10, { message: 'O telefone deve ter pelo menos 10 dígitos' })
    .regex(/^\+?[0-9]+$/, { message: 'Formato de telefone inválido' }),
  email: z.string().email({ message: 'Email inválido' }).optional().or(z.literal('')),
  group: z.string().optional(),
  notes: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

type ContactFormProps = {
  userId: string;
  contactId?: string;
  initialData?: ContactFormValues;
};

export function ContactForm({ userId, contactId, initialData }: ContactFormProps) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      
      // Formatar o telefone (remover espaços, parênteses, etc)
      const formattedPhone = data.phone.replace(/\s+/g, '').replace(/[()\-]/g, '');
      
      // Adicionar o prefixo '+' se não existir
      const phoneWithPrefix = formattedPhone.startsWith('+') 
        ? formattedPhone 
        : `+${formattedPhone}`;
      
      const contactData = {
        ...data,
        phone: phoneWithPrefix,
        user_id: userId,
      };
      
      if (contactId) {
        // Atualizar contato existente
        const { error } = await supabase
          .from('contacts')
          .update(contactData)
          .eq('id', contactId)
          .eq('user_id', userId);
        
        if (error) throw error;
        toast.success('Contato atualizado com sucesso!');
      } else {
        // Criar novo contato
        const { error } = await supabase
          .from('contacts')
          .insert(contactData);
        
        if (error) throw error;
        toast.success('Contato adicionado com sucesso!');
      }
      
      // Redirecionar para a lista de contatos
      router.push('/dashboard/contacts');
      router.refresh();
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
          <Input
            id="phone"
            placeholder="+5511999999999"
            {...register('phone')}
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && (
            <p className="text-red-500 text-sm">{errors.phone.message}</p>
          )}
          <p className="text-xs text-gray-500">Formato: +País DDD Número (ex: +5511999999999)</p>
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
          onClick={() => router.push('/dashboard/contacts')}
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