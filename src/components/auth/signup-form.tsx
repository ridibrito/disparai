'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import PasswordInput from '@/components/ui/password-input';

export function SignupForm() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (!formData.companyName.trim()) {
      toast.error('Nome da empresa é obrigatório');
      return;
    }

    if (!formData.ownerName.trim()) {
      toast.error('Nome do proprietário é obrigatório');
      return;
    }

    setLoading(true);
    
    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.ownerName,
            company_name: formData.companyName
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Criar registro na tabela users
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            full_name: formData.ownerName,
            email: formData.email
          });

        if (userError) throw userError;

        // 3. Criar organização básica
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: formData.companyName,
            slug: formData.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            company_name: formData.companyName,
            owner_name: formData.ownerName,
            owner_email: formData.email
          })
          .select('id')
          .single();

        if (orgError) throw orgError;

        // 4. Atualizar usuário com organization_id
        const { error: updateError } = await supabase
          .from('users')
          .update({ organization_id: orgData.id })
          .eq('id', authData.user.id);

        if (updateError) throw updateError;

        // 5. Criar registro em organization_members como owner
        const { error: memberError } = await supabase
          .from('organization_members')
          .insert({
            user_id: authData.user.id,
            organization_id: orgData.id,
            role: 'owner',
            is_active: true
          });

        if (memberError) throw memberError;

        toast.success(`✅ Conta criada com sucesso!\n\nEmpresa: ${formData.companyName}\nProprietário: ${formData.ownerName}\n\nVerifique seu email para confirmar a conta.`);
        
        // Limpar formulário
        setFormData({
          companyName: '',
          ownerName: '',
          email: '',
          password: '',
          confirmPassword: ''
        });

      } else {
        toast.error('Erro ao criar conta');
      }

    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      toast.error(error.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex w-full">
      {/* Lado Esquerdo - Formulário */}
      <div className="flex items-center justify-center p-12" style={{ width: '30%', minWidth: '400px' }}>
        <div className="w-full max-w-md space-y-8">
          {/* Header with Logo */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Image
                src="/logo.png"
                alt="disparai Logo"
                width={150}
                height={45}
                className="h-10 w-auto"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Criar sua conta</h1>
            <p className="text-lg text-gray-600">Configure sua empresa no disparai</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-6 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
            {/* Nome da Empresa */}
            <div className="space-y-2">
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Nome da Empresa
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-gray-400 transition-colors"
                style={{ '--tw-ring-color': '#4bca59' } as any}
                placeholder="Ex: Minha Empresa Ltda"
                disabled={loading}
                required
              />
            </div>

            {/* Nome do Proprietário */}
            <div className="space-y-2">
              <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
                Nome do Proprietário
              </label>
              <input
                id="ownerName"
                name="ownerName"
                type="text"
                value={formData.ownerName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-gray-400 transition-colors"
                style={{ '--tw-ring-color': '#4bca59' } as any}
                placeholder="Ex: João Silva"
                disabled={loading}
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-gray-400 transition-colors"
                style={{ '--tw-ring-color': '#4bca59' } as any}
                placeholder="seu@email.com"
                disabled={loading}
                required
              />
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                disabled={loading}
                style={{ '--tw-ring-color': '#4bca59' } as any}
                autoComplete="new-password"
              />
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Senha
              </label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                disabled={loading}
                style={{ '--tw-ring-color': '#4bca59' } as any}
                autoComplete="new-password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ 
                backgroundColor: '#4bca59',
                '--tw-ring-color': '#4bca59'
              } as any}
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{' '}
                <Link 
                  href="/login" 
                  className="hover:underline font-medium transition-colors"
                  style={{ color: '#4bca59' }}
                >
                  Faça login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Lado Direito - Visual Chamativo */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#4bca59] to-[#2da643] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center text-white p-12">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-6">
              Comece sua jornada de <span className="text-green-200">vendas</span>
            </h2>
            <p className="text-xl text-green-100 mb-8">
              Crie sua conta e comece a transformar conversas em resultados. Configure sua empresa e equipe em minutos.
            </p>
            
            {/* Features */}
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-200 rounded-full"></div>
                <span className="text-green-100">Configuração rápida e fácil</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-200 rounded-full"></div>
                <span className="text-green-100">Organização criada automaticamente</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-200 rounded-full"></div>
                <span className="text-green-100">Acesso imediato a todas as funcionalidades</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-200 rounded-full"></div>
                <span className="text-green-100">Suporte completo da nossa equipe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
