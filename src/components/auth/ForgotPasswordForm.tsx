'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Aqui você implementaria a lógica de recuperação de senha
      // Por exemplo, enviar email de reset
      console.log('Recuperação de senha para:', data.email);
      
      // Simular sucesso
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar recuperação de senha');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="DisparaMaker Logo"
              width={200}
              height={60}
              className="h-12 w-auto"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Enviado</h1>
          <p className="text-gray-600">Verifique sua caixa de entrada para instruções de recuperação.</p>
        </div>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-sm font-medium transition-colors"
            style={{ color: '#4bca59' }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
      {/* Header with Logo */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo.png"
            alt="DisparaMaker Logo"
            width={200}
            height={60}
            className="h-12 w-auto"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Recuperar Senha</h1>
        <p className="text-gray-600">Digite seu email para receber instruções de recuperação</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('email')}
              type="email"
              id="email"
              placeholder="seu@email.com"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:border-gray-400 transition-colors"
              style={{ '--tw-ring-color': '#4bca59' } as any}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#4bca59' }}
        >
          {isLoading ? 'Enviando...' : 'Enviar Email de Recuperação'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center text-sm font-medium transition-colors"
          style={{ color: '#4bca59' }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
