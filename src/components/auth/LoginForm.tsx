'use client';

import { useAuth } from '@/contexts/AuthContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import Image from 'next/image';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Tentando fazer login com:', data.email);
      await signIn(data.email, data.password);
      console.log('Login bem-sucedido, redirecionando...');
      // Redundância local para garantir navegação
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      setError(error.message || 'Email ou senha incorretos. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
      {/* Header with Logo */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo.png"
            alt="disparai Logo"
            width={200}
            height={60}
            className="h-12 w-auto"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo de volta</h1>
        <p className="text-gray-600">Entre na sua conta para continuar</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          <input
            id="password"
            type="password"
            {...register('password')}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-gray-400 transition-colors"
            style={{ '--tw-ring-color': '#4bca59' } as any}
            placeholder="••••••••"
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Forgot Password Link */}
        <div className="flex items-center justify-end">
          <Link 
            href="/forgot-password" 
            className="text-sm hover:underline transition-colors"
            style={{ color: '#4bca59' }}
          >
            Esqueceu sua senha?
          </Link>
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
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>

        {/* Register Link */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <Link 
              href="/signup" 
              className="hover:underline font-medium transition-colors"
              style={{ color: '#4bca59' }}
            >
              Registre-se
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}