'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClientComponentClient } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type UsersUpdate = Database['public']['Tables']['users']['Update'];
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Pencil, Save, X, Building2, Globe, MapPin, Phone, Mail, User } from 'lucide-react';
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

// Helpers de telefone (BR)
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

// Validação do formulário
const profileFormSchema = z.object({
  full_name: z.string().min(3, {
    message: 'O nome deve ter pelo menos 3 caracteres',
  }),
  // Sempre string; normaliza para dígitos. Aceita vazio.
  phone: z
    .string()
    .transform((val) => onlyDigits(val || ''))
    .refine((val) => val === '' || val.length === 10 || val.length === 11, {
      message: 'Telefone inválido',
    }),
  bio: z.string().max(280, { message: 'Bio deve ter no máximo 280 caracteres' }).optional().or(z.literal('')),
  // Campos da empresa (opcionais)
  company_name: z.string().min(2, {
    message: 'O nome da empresa deve ter pelo menos 2 caracteres',
  }).optional(),
  company_description: z.string().optional(),
  company_website: z.string().url().optional().or(z.literal('')),
  company_sector: z.string().optional(),
  company_phone: z
    .string()
    .transform((val) => onlyDigits(val || ''))
    .refine((val) => val === '' || val.length === 10 || val.length === 11, {
      message: 'Telefone da empresa inválido',
    }),
  company_email: z.string().email().optional().or(z.literal('')),
  company_address: z.string().optional(),
  company_city: z.string().optional(),
  company_state: z.string().optional(),
  company_zip_code: z.string().optional(),
  company_country: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

type ProfileFormProps = {
  userId: string;
  userEmail: string;
  initialData?: any;
  organizationData?: any;
  canEditCompany?: boolean;
};

export function ProfileForm({ userId, userEmail, initialData, organizationData, canEditCompany = false }: ProfileFormProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData?.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [tempAvatarUrl, setTempAvatarUrl] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [recentlySaved, setRecentlySaved] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  
  // Configurar o formulário
  const maskedInitialPhone = formatBrazilPhone(initialData?.phone || '');
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: initialData?.full_name || '',
      phone: maskedInitialPhone,
      bio: initialData?.bio || '',
      // Dados da empresa
      company_name: organizationData?.company_name || '',
      company_description: organizationData?.company_description || '',
      company_website: organizationData?.company_website || '',
      company_sector: organizationData?.company_sector || '',
      company_phone: formatBrazilPhone(organizationData?.company_phone || ''),
      company_email: organizationData?.company_email || '',
      company_address: organizationData?.company_address || '',
      company_city: organizationData?.company_city || '',
      company_state: organizationData?.company_state || '',
      company_zip_code: organizationData?.company_zip_code || '',
      company_country: organizationData?.company_country || 'Brasil',
    },
  });

  const [lastSaved, setLastSaved] = useState({
    full_name: initialData?.full_name || '',
    phone: maskedInitialPhone,
    bio: initialData?.bio || '',
    avatarUrl: initialData?.avatar_url || null as string | null,
  });
  
  // Função para enviar o formulário
  const onSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);
    
    console.log('=== DEBUG PROFILE FORM ===');
    console.log('Active tab:', activeTab);
    console.log('Can edit company:', canEditCompany);
    console.log('Organization data:', organizationData);
    console.log('Form values:', values);
    console.log('========================');
    
    try {
      let newAvatarPublicUrl: string | null = null;
      if (pendingAvatarFile) {
        setUploading(true);
        const fileExt = pendingAvatarFile.name.split('.').pop();
        const filePath = `${userId}/${Date.now()}.${fileExt}`;
        const { error: upErr } = await supabase.storage.from('avatars').upload(filePath, pendingAvatarFile, { upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        newAvatarPublicUrl = data.publicUrl + `?v=${Date.now()}`;
      }

      // Evita salvar se nada mudou (apenas para dados pessoais)
      const personalDataChanged =
        values.full_name !== lastSaved.full_name ||
        formatBrazilPhone(values.phone || '') !== lastSaved.phone ||
        (values.bio || '') !== (lastSaved.bio || '') ||
        pendingAvatarFile;

      // Verifica se dados da empresa mudaram (se aplicável)
      const companyDataChanged = canEditCompany && organizationData ? (
        values.company_name !== (organizationData.company_name || '') ||
        values.company_description !== (organizationData.company_description || '') ||
        values.company_website !== (organizationData.company_website || '') ||
        values.company_sector !== (organizationData.company_sector || '') ||
        values.company_phone !== (organizationData.company_phone || '') ||
        values.company_email !== (organizationData.company_email || '') ||
        values.company_address !== (organizationData.company_address || '') ||
        values.company_city !== (organizationData.company_city || '') ||
        values.company_state !== (organizationData.company_state || '') ||
        values.company_zip_code !== (organizationData.company_zip_code || '') ||
        values.company_country !== (organizationData.company_country || 'Brasil')
      ) : false;

      if (!personalDataChanged && !companyDataChanged) {
        toast.success('Nada para salvar');
        setIsEditingPersonal(false);
        setIsEditingCompany(false);
        setIsLoading(false);
        return;
      }

      // Atualizar dados do usuário
      const { error: userError } = await (supabase as any)
        .from('users')
        .update({ 
          full_name: values.full_name,
          phone: values.phone || null,
          bio: values.bio || null,
          updated_at: new Date().toISOString(),
          avatar_url: newAvatarPublicUrl ?? lastSaved.avatarUrl ?? avatarUrl 
        })
        .eq('id', userId);
      
      if (userError) throw userError;

      // Atualizar dados da empresa (apenas se o usuário tem permissão)
      if (canEditCompany && organizationData) {
        const { error: orgError } = await (supabase as any)
          .from('organizations')
          .update({
            company_name: values.company_name || null,
            company_description: values.company_description || null,
            company_website: values.company_website || null,
            company_sector: values.company_sector || null,
            company_phone: values.company_phone || null,
            company_email: values.company_email || null,
            company_address: values.company_address || null,
            company_city: values.company_city || null,
            company_state: values.company_state || null,
            company_zip_code: values.company_zip_code || null,
            company_country: values.company_country || 'Brasil',
            updated_at: new Date().toISOString(),
          })
          .eq('id', organizationData.id);
        
        if (orgError) throw orgError;
      }
      
      toast.success('Perfil atualizado com sucesso!');
      // Atualiza estado de última gravação e desliga modo edição
      const maskedPhone = formatBrazilPhone(values.phone || '');
      setLastSaved({
        full_name: values.full_name,
        phone: maskedPhone,
        bio: values.bio || '',
        avatarUrl: newAvatarPublicUrl ?? lastSaved.avatarUrl ?? avatarUrl,
      });
      if (newAvatarPublicUrl) {
        setAvatarUrl(newAvatarPublicUrl);
        if (tempAvatarUrl) {
          try { URL.revokeObjectURL(tempAvatarUrl); } catch {}
        }
        setTempAvatarUrl(null);
        setPendingAvatarFile(null);
      }
      form.reset({ full_name: values.full_name, phone: maskedPhone, bio: values.bio || '' });
      setIsEditingPersonal(false);
      setIsEditingCompany(false);
      setRecentlySaved(true);
      setTimeout(() => setRecentlySaved(false), 2000);
      router.refresh();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
      setUploading(false);
    }
  };
  
  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Pessoal
          </TabsTrigger>
          {canEditCompany && (
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Empresa
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <div className="space-y-4">
          {/* Avatar no topo */}
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center ring-1 ring-gray-200">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" width={96} height={96} className="w-24 h-24 object-cover" />
              ) : (
                <span className="text-gray-500 text-sm">Sem foto</span>
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  // Validações básicas
                  const maxBytes = 5 * 1024 * 1024; // 5MB
                  if (file.size > maxBytes) {
                    toast.error('Imagem muito grande (máx. 5MB)');
                    return;
                  }
                  if (!file.type.startsWith('image/')) {
                    toast.error('Envie um arquivo de imagem válido');
                    return;
                  }
                  // Preview local e upload só ao salvar
                  if (tempAvatarUrl) {
                    try { URL.revokeObjectURL(tempAvatarUrl); } catch {}
                  }
                  const localUrl = URL.createObjectURL(file);
                  setTempAvatarUrl(localUrl);
                  setAvatarUrl(localUrl);
                  setPendingAvatarFile(file);
                  setIsEditingPersonal(true);
                  // limpa o valor para permitir reupload do mesmo arquivo
                  if (e.target) {
                    try { e.target.value = ''; } catch {}
                  }
                }}
              />
              <Button
                type="button"
                disabled={uploading}
                variant="ghost"
                className="inline-flex items-center gap-2 h-10 px-3 border-2 border-dashed border-gray-300 text-gray-700 bg-transparent hover:bg-transparent"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                Alterar foto
              </Button>
              <p className="text-xs text-gray-500 mt-1">PNG/JPG até 5MB • A foto será atualizada ao salvar</p>
            </div>
          </div>
          {/* Campos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome completo" {...field} disabled={!isEditingPersonal} className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(11) 99999-9999"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(formatBrazilPhone(e.target.value))}
                      disabled={!isEditingPersonal}
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Email junto aos demais, bloqueado para edição */}
            <div className="md:col-span-2">
              <FormLabel>Email</FormLabel>
              <Input value={userEmail} disabled className="h-11 bg-gray-50 text-gray-700" />
              <p className="text-xs text-gray-500 mt-1">Usado para login. Não é possível alterar.</p>
            </div>
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Fale brevemente sobre você (máx. 280 caracteres)" {...field} disabled={!isEditingPersonal} className="min-h-[120px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Barra de ações do formulário */}
          <div className="flex items-center justify-between">
            {recentlySaved ? (
              <span className="text-sm text-green-600">Salvo</span>
            ) : <span />}
            {!isEditingPersonal ? (
              <div className="flex gap-2">
                <Button type="button" onClick={() => setIsEditingPersonal(true)} className="text-white" style={{ backgroundColor: '#4bca59' }}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                  onClick={() => {
                    // Volta aos últimos valores salvos
                    form.reset({ full_name: lastSaved.full_name, phone: lastSaved.phone, bio: lastSaved.bio });
                    setAvatarUrl(lastSaved.avatarUrl);
                    setIsEditingPersonal(false);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="text-white" style={{ backgroundColor: '#4bca59' }}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            )}
          </div>

          
            </div>
          </form>
        </Form>
        </TabsContent>

        {canEditCompany && (
          <TabsContent value="company" className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
                <div className="space-y-4">
                  {/* Logo da empresa */}
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-lg bg-gray-200 overflow-hidden flex items-center justify-center ring-1 ring-gray-200">
                      {organizationData?.company_logo_url ? (
                        <Image src={organizationData.company_logo_url} alt="Logo da empresa" width={96} height={96} className="w-24 h-24 object-cover" />
                      ) : (
                        <Building2 className="w-8 h-8 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <Button
                        type="button"
                        disabled={uploading}
                        variant="ghost"
                        className="inline-flex items-center gap-2 h-10 px-3 border-2 border-dashed border-gray-300 text-gray-700 bg-transparent hover:bg-transparent"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4" />
                        Alterar logo
                      </Button>
                      <p className="text-xs text-gray-500 mt-1">PNG/JPG até 5MB • O logo será atualizado ao salvar</p>
                    </div>
                  </div>

                  {/* Campos da empresa */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="company_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Empresa</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da sua empresa" {...field} disabled={!isEditingCompany} className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="company_sector"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Setor</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Tecnologia, Varejo, Serviços" {...field} disabled={!isEditingCompany} className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="company_website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://suaempresa.com" {...field} disabled={!isEditingCompany} className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="company_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail da Empresa</FormLabel>
                          <FormControl>
                            <Input placeholder="contato@suaempresa.com" {...field} disabled={!isEditingCompany} className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="company_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição da Empresa</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva brevemente sua empresa e seus serviços..." 
                            {...field} 
                            disabled={!isEditingCompany} 
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Botões de ação */}
                  <div className="flex justify-end pt-4">
                    {!isEditingCompany ? (
                      <Button type="button" onClick={() => setIsEditingCompany(true)} className="text-white" style={{ backgroundColor: '#4bca59' }}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          className="border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                          onClick={() => setIsEditingCompany(false)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading} className="text-white" style={{ backgroundColor: '#4bca59' }}>
                          <Save className="w-4 h-4 mr-2" />
                          {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </TabsContent>
        )}
      </Tabs>
    
    <div className="mt-10 max-w-2xl bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Alterar senha</h2>
        <p className="text-sm text-gray-500">Atualize sua senha de acesso. Mínimo de 6 caracteres.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" className="h-11" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" className="h-11" />
        </div>
      </div>
      <div className="flex justify-end mt-4">
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