'use client';

import { useState } from 'react';
import Image from 'next/image';
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

// Validação apenas dos dados existentes no schema atual (tabela public.users)
const profileFormSchema = z.object({
  full_name: z.string().min(3, {
    message: 'O nome deve ter pelo menos 3 caracteres',
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

type ProfileFormProps = {
  userId: string;
  userEmail: string;
  initialData?: any;
};

export function ProfileForm({ userId, userEmail, initialData }: ProfileFormProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData?.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Configurar o formulário
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: initialData?.full_name || '',
    },
  });
  
  // Função para enviar o formulário
  const onSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);
    
    try {
      // Atualizar apenas campos existentes na tabela public.users
      const { error } = await supabase
        .from('users')
        .update({ full_name: values.full_name, updated_at: new Date().toISOString(), avatar_url: avatarUrl })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success('Perfil atualizado com sucesso!');
      router.refresh();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-8">
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-md">
            <h2 className="text-sm font-medium text-gray-500">Email</h2>
            <p className="mt-1">{userEmail}</p>
            <p className="mt-2 text-xs text-gray-500">
              O email não pode ser alterado e é usado para login na plataforma.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" width={64} height={64} className="w-16 h-16 object-cover" />
              ) : (
                <span className="text-gray-500 text-sm">Sem foto</span>
              )}
            </div>
            <div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="avatar-input"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setUploading(true);
                    const fileExt = file.name.split('.').pop();
                    const filePath = `avatars/${userId}.${fileExt}`;
                    const { error: upErr } = await supabase.storage.from('public').upload(filePath, file, { upsert: true });
                    if (upErr) throw upErr;
                    const { data } = supabase.storage.from('public').getPublicUrl(filePath);
                    setAvatarUrl(data.publicUrl);
                    toast.success('Avatar atualizado');
                  } catch (err) {
                    console.error(err);
                    toast.error('Erro ao enviar avatar');
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              <label htmlFor="avatar-input">
                <Button type="button" disabled={uploading} className="text-white" style={{ backgroundColor: '#4bca59' }}>
                  {uploading ? 'Enviando...' : 'Alterar foto'}
                </Button>
              </label>
            </div>
          </div>
          
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Seu nome completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading} className="text-white" style={{ backgroundColor: '#4bca59' }}>
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </Form>
    
    <div className="mt-8 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Alterar senha</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          disabled={isChangingPassword}
          className="text-white"
          style={{ backgroundColor: '#4bca59' }}
          onClick={async () => {
            if (newPassword.length < 6) {
              toast.error('A senha deve ter pelo menos 6 caracteres');
              return;
            }
            if (newPassword !== confirmPassword) {
              toast.error('As senhas não conferem');
              return;
            }
            try {
              setIsChangingPassword(true);
              const { error } = await supabase.auth.updateUser({ password: newPassword });
              if (error) throw error;
              toast.success('Senha alterada com sucesso');
              setNewPassword('');
              setConfirmPassword('');
            } catch (err) {
              console.error('Erro ao alterar senha:', err);
              toast.error('Não foi possível alterar a senha');
            } finally {
              setIsChangingPassword(false);
            }
          }}
        >
          {isChangingPassword ? 'Alterando...' : 'Alterar senha'}
        </Button>
      </div>
    </div>
    </div>
  );
}