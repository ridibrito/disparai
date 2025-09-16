'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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
import { WhatsAppLoading } from '@/components/ui/whatsapp-loading';

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
  
  // Verificar status de autenticação
  React.useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('🔐 Status de autenticação no ProfileForm:', {
        isAuthenticated: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        error: error?.message
      });
    };
    checkAuth();
  }, [supabase.auth]);
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
  
  // Estados para avatar da empresa
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(organizationData?.company_logo_url || null);
  const [pendingCompanyLogoFile, setPendingCompanyLogoFile] = useState<File | null>(null);
  const [tempCompanyLogoUrl, setTempCompanyLogoUrl] = useState<string | null>(null);
  const companyLogoInputRef = useRef<HTMLInputElement | null>(null);
  
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
          let newCompanyLogoUrl: string | null = null;
          
          // Upload do avatar pessoal
          if (pendingAvatarFile) {
            setUploading(true);
            try {
              const fileExt = pendingAvatarFile.name.split('.').pop();
              const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`;
              
              console.log('📤 Fazendo upload do avatar pessoal:', filePath);
              console.log('📤 Arquivo avatar:', {
                name: pendingAvatarFile.name,
                size: pendingAvatarFile.size,
                type: pendingAvatarFile.type
              });
              
              // Tentar upload com retry e timeout maior
              let uploadSuccess = false;
              let retryCount = 0;
              const maxRetries = 2;
              
              while (!uploadSuccess && retryCount <= maxRetries) {
                try {
                  console.log(`⏳ Tentativa ${retryCount + 1} de upload do avatar...`);
                  
                  // Timeout maior (30 segundos) e retry
                  const uploadPromise = supabase.storage.from('avatars').upload(filePath, pendingAvatarFile, { upsert: true });
                  const uploadTimeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Timeout: upload do avatar demorou mais de 30 segundos')), 30000);
                  });
                  
                  const { error: upErr } = await Promise.race([uploadPromise, uploadTimeoutPromise]) as any;
                  
                  if (upErr) {
                    throw upErr;
                  }
                  
                  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
                  newAvatarPublicUrl = data.publicUrl + `?v=${Date.now()}`;
                  console.log('✅ Avatar pessoal enviado com sucesso:', newAvatarPublicUrl);
                  uploadSuccess = true;
                  
                } catch (uploadError) {
                  retryCount++;
                  console.log(`⚠️ Tentativa ${retryCount} falhou:`, uploadError.message);
                  
                  if (retryCount > maxRetries) {
                    console.log('❌ Todas as tentativas de upload falharam, continuando sem avatar');
                    toast.error('Erro ao fazer upload do avatar. Os dados serão salvos sem o avatar.');
                    // Não fazer throw, continuar sem o avatar
                    newAvatarPublicUrl = null;
                    break;
                  } else {
                    console.log('🔄 Tentando novamente em 2 segundos...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                  }
                }
              }
            } catch (uploadError) {
              console.error('❌ Erro geral no upload do avatar pessoal:', uploadError);
              toast.error('Erro ao fazer upload do avatar. Os dados serão salvos sem o avatar.');
              // Não fazer throw, continuar sem o avatar
              newAvatarPublicUrl = null;
            } finally {
              setUploading(false);
            }
          }
          
          // Upload do logo da empresa
          if (pendingCompanyLogoFile) {
            setUploading(true);
            try {
              const fileExt = pendingCompanyLogoFile.name.split('.').pop();
              const filePath = `${userId}/company_logo_${Date.now()}.${fileExt}`;
              
              console.log('📤 Fazendo upload do logo da empresa:', filePath);
              console.log('📤 Arquivo:', {
                name: pendingCompanyLogoFile.name,
                size: pendingCompanyLogoFile.size,
                type: pendingCompanyLogoFile.type
              });
              
              // Tentar upload com retry e timeout maior
              let uploadSuccess = false;
              let retryCount = 0;
              const maxRetries = 2;
              
              while (!uploadSuccess && retryCount <= maxRetries) {
                try {
                  console.log(`⏳ Tentativa ${retryCount + 1} de upload do logo...`);
                  
                  // Timeout maior (30 segundos) e retry
                  const uploadPromise = supabase.storage.from('avatars').upload(filePath, pendingCompanyLogoFile, { upsert: true });
                  const uploadTimeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Timeout: upload do logo demorou mais de 30 segundos')), 30000);
                  });
                  
                  const { error: upErr } = await Promise.race([uploadPromise, uploadTimeoutPromise]) as any;
                  
                  if (upErr) {
                    throw upErr;
                  }
                  
                  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
                  newCompanyLogoUrl = data.publicUrl + `?v=${Date.now()}`;
                  console.log('✅ Logo da empresa enviado com sucesso:', newCompanyLogoUrl);
                  uploadSuccess = true;
                  
                } catch (uploadError) {
                  retryCount++;
                  console.log(`⚠️ Tentativa ${retryCount} falhou:`, uploadError.message);
                  
                  if (retryCount > maxRetries) {
                    console.log('❌ Todas as tentativas de upload falharam, continuando sem logo');
                    toast.error('Erro ao fazer upload do logo. Os dados serão salvos sem o logo.');
                    // Não fazer throw, continuar sem o logo
                    newCompanyLogoUrl = null;
                    break;
                  } else {
                    console.log('🔄 Tentando novamente em 2 segundos...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                  }
                }
              }
            } catch (uploadError) {
              console.error('❌ Erro geral no upload do logo da empresa:', uploadError);
              toast.error('Erro ao fazer upload do logo. Os dados serão salvos sem o logo.');
              // Não fazer throw, continuar sem o logo
              newCompanyLogoUrl = null;
            } finally {
              setUploading(false);
            }
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
        values.company_country !== (organizationData.company_country || 'Brasil') ||
        pendingCompanyLogoFile
      ) : false;

      console.log('🔍 Verificação de mudanças:', {
        personalDataChanged,
        companyDataChanged,
        pendingAvatarFile: !!pendingAvatarFile,
        pendingCompanyLogoFile: !!pendingCompanyLogoFile,
        canEditCompany,
        hasOrganizationData: !!organizationData
      });

      if (!personalDataChanged && !companyDataChanged) {
        console.log('⏭️ Nada para salvar, cancelando operação');
        toast.success('Nada para salvar');
        setIsEditingPersonal(false);
        setIsEditingCompany(false);
        setIsLoading(false);
        return;
      }

      console.log('✅ Há mudanças para salvar, continuando...');

      // Atualizar dados do usuário
      console.log('📝 Atualizando dados do usuário...');
      console.log('📝 Dados para update:', { 
        full_name: values.full_name,
        phone: values.phone || null,
        bio: values.bio || null,
        updated_at: new Date().toISOString(),
        avatar_url: newAvatarPublicUrl ?? lastSaved.avatarUrl ?? avatarUrl,
        userId: userId
      });
      
      // Adicionar timeout para evitar travamento
      const updatePromise = supabase
        .from('users')
        .update({ 
          full_name: values.full_name,
          phone: values.phone || null,
          bio: values.bio || null,
          updated_at: new Date().toISOString(),
          avatar_url: newAvatarPublicUrl ?? lastSaved.avatarUrl ?? avatarUrl 
        })
        .eq('id', userId)
        .select();
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: operação demorou mais de 10 segundos')), 10000);
      });
      
      const { data: userUpdateResult, error: userError } = await Promise.race([updatePromise, timeoutPromise]) as any;
      
      if (userError) {
        console.error('❌ Erro ao atualizar usuário:', userError);
        console.error('❌ Detalhes do erro:', {
          message: userError.message,
          details: userError.details,
          hint: userError.hint,
          code: userError.code
        });
        throw userError;
      }
      console.log('✅ Dados do usuário atualizados com sucesso:', userUpdateResult);

      // Atualizar dados da empresa (apenas se o usuário tem permissão)
      if (canEditCompany && organizationData) {
        console.log('🏢 Atualizando dados da empresa...');
        console.log('🏢 Dados para update da empresa:', {
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
          company_logo_url: newCompanyLogoUrl ?? companyLogoUrl,
          organizationId: organizationData.id
        });
        
        // Adicionar timeout para evitar travamento
        const orgUpdatePromise = supabase
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
            company_logo_url: newCompanyLogoUrl ?? companyLogoUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', organizationData.id)
          .select();
        
        const orgTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout: operação da organização demorou mais de 10 segundos')), 10000);
        });
        
        const { data: orgUpdateResult, error: orgError } = await Promise.race([orgUpdatePromise, orgTimeoutPromise]) as any;
        
        if (orgError) {
          console.error('❌ Erro ao atualizar organização:', orgError);
          console.error('❌ Detalhes do erro da organização:', {
            message: orgError.message,
            details: orgError.details,
            hint: orgError.hint,
            code: orgError.code
          });
          throw orgError;
        }
        console.log('✅ Dados da empresa atualizados com sucesso:', orgUpdateResult);
      }
      
      console.log('🎉 Salvamento concluído com sucesso!');
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
      
      if (newCompanyLogoUrl) {
        setCompanyLogoUrl(newCompanyLogoUrl);
        if (tempCompanyLogoUrl) {
          try { URL.revokeObjectURL(tempCompanyLogoUrl); } catch {}
        }
        setTempCompanyLogoUrl(null);
        setPendingCompanyLogoFile(null);
      }
      
      // Reset do formulário com os novos valores
      form.reset({ 
        full_name: values.full_name, 
        phone: maskedPhone, 
        bio: values.bio || '',
        // Dados da empresa
        company_name: values.company_name || '',
        company_description: values.company_description || '',
        company_website: values.company_website || '',
        company_sector: values.company_sector || '',
        company_phone: values.company_phone || '',
        company_email: values.company_email || '',
        company_address: values.company_address || '',
        company_city: values.company_city || '',
        company_state: values.company_state || '',
        company_zip_code: values.company_zip_code || '',
        company_country: values.company_country || 'Brasil',
      });
      
      setIsEditingPersonal(false);
      setIsEditingCompany(false);
      setRecentlySaved(true);
      
      // Mostrar feedback visual por mais tempo
      setTimeout(() => setRecentlySaved(false), 4000);
      
      console.log('✅ Estados atualizados, sem reload da página');
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      console.log('🏁 Finalizando processo de salvamento...');
      setIsLoading(false);
      setUploading(false);
      console.log('✅ Estados de loading resetados');
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
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Empresa
          </TabsTrigger>
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
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Perfil salvo com sucesso!
              </div>
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
                <Button type="submit" disabled={isLoading} className="text-white flex items-center gap-2" style={{ backgroundColor: '#4bca59' }}>
                  {isLoading ? (
                    <>
                      <WhatsAppLoading size="sm" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          
            </div>
          </form>
        </Form>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          {!canEditCompany && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Permissão limitada
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Você não tem permissão para editar as informações da empresa. Apenas administradores e proprietários podem fazer alterações.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
              <div className="space-y-4">
                  {/* Logo da empresa */}
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-lg bg-gray-200 overflow-hidden flex items-center justify-center ring-1 ring-gray-200">
                      {companyLogoUrl ? (
                        <Image src={companyLogoUrl} alt="Logo da empresa" width={96} height={96} className="w-24 h-24 object-cover" />
                      ) : (
                        <Building2 className="w-8 h-8 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <input
                        ref={companyLogoInputRef}
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
                          if (tempCompanyLogoUrl) {
                            try { URL.revokeObjectURL(tempCompanyLogoUrl); } catch {}
                          }
                          const localUrl = URL.createObjectURL(file);
                          setTempCompanyLogoUrl(localUrl);
                          setCompanyLogoUrl(localUrl);
                          setPendingCompanyLogoFile(file);
                          setIsEditingCompany(true);
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
                        onClick={() => companyLogoInputRef.current?.click()}
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
                  <div className="flex items-center justify-between pt-4">
                    {recentlySaved && activeTab === 'company' ? (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Empresa salva com sucesso!
                      </div>
                    ) : <span />}
                    <div className="flex gap-2">
                      {!isEditingCompany ? (
                        <Button 
                          type="button" 
                          onClick={() => canEditCompany && setIsEditingCompany(true)} 
                          disabled={!canEditCompany}
                          className={`text-white ${!canEditCompany ? 'opacity-50 cursor-not-allowed' : ''}`} 
                          style={{ backgroundColor: '#4bca59' }}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          {canEditCompany ? 'Editar' : 'Sem permissão'}
                        </Button>
                      ) : (
                        <>
                          <Button
                            type="button"
                            className="border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                            onClick={() => setIsEditingCompany(false)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={isLoading} className="text-white flex items-center gap-2" style={{ backgroundColor: '#4bca59' }}>
                            {isLoading ? (
                              <>
                                <WhatsAppLoading size="sm" />
                                Salvando...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                Salvar Alterações
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </TabsContent>
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