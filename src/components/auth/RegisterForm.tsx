'use client';

import { useAuth } from '@/contexts/AuthContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import Image from 'next/image';
import PasswordInput from '@/components/ui/password-input';
import ErrorMessage from '@/components/ui/error-message';
import { getAuthErrorMessage } from '@/lib/auth-errors';

const registerSchema = z.object({
  fullName: z.string().min(3, 'Nome completo deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'A confirmação de senha deve ter pelo menos 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      await signUp(data.email, data.password, data.fullName);
    } catch (error: any) {
      console.error('Erro ao registrar:', error);
      setError(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
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
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Criar Conta</h1>
            <p className="text-lg text-gray-600">Registre-se para começar a usar o disparai</p>
          </div>

          {/* Error Message */}
          {error && (
            <ErrorMessage 
              message={error} 
              onDismiss={() => setError(null)}
            />
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
            {/* Full Name Field */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Nome Completo
              </label>
              <input
                id="fullName"
                type="text"
                {...register('fullName')}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-gray-400 transition-colors"
                style={{ '--tw-ring-color': '#4bca59' } as any}
                placeholder="Seu nome completo"
                disabled={isLoading}
              />
              {errors.fullName && (
                <p className="text-sm text-red-600 mt-1">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-gray-400 transition-colors"
                style={{ '--tw-ring-color': '#4bca59' } as any}
                placeholder="seu@email.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <PasswordInput
                id="password"
                {...register('password')}
                placeholder="••••••••"
                disabled={isLoading}
                style={{ '--tw-ring-color': '#4bca59' } as any}
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Senha
              </label>
              <PasswordInput
                id="confirmPassword"
                {...register('confirmPassword')}
                placeholder="••••••••"
                disabled={isLoading}
                style={{ '--tw-ring-color': '#4bca59' } as any}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ 
                backgroundColor: '#4bca59',
                '--tw-ring-color': '#4bca59'
              } as any}
            >
              {isLoading ? 'Registrando...' : 'Criar Conta'}
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
              Comece seu <span className="text-green-200">teste grátis</span>
            </h2>
            <p className="text-xl text-green-100 mb-8">
              Teste por 3 dias sem compromisso. Configure sua conta e veja como o Disparai pode transformar suas vendas.
            </p>
            
            {/* Benefits */}
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-200 rounded-full"></div>
                <span className="text-green-100">3 dias de teste grátis</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-200 rounded-full"></div>
                <span className="text-green-100">Setup personalizado incluído</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-200 rounded-full"></div>
                <span className="text-green-100">Suporte especializado</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-200 rounded-full"></div>
                <span className="text-green-100">Sem cartão de crédito</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}