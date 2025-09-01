'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function TestAuthPage() {
  const { user, session, isLoading } = useAuth();

  useEffect(() => {
    console.log('TestAuthPage - Estado atual:', {
      user: user?.email,
      session: !!session,
      isLoading
    });
  }, [user, session, isLoading]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Teste de Autenticação</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Estado da Autenticação</h2>
        
        <div className="space-y-2">
          <p><strong>Carregando:</strong> {isLoading ? 'Sim' : 'Não'}</p>
          <p><strong>Usuário:</strong> {user?.email || 'Nenhum'}</p>
          <p><strong>Sessão:</strong> {session ? 'Ativa' : 'Inativa'}</p>
          <p><strong>ID do Usuário:</strong> {user?.id || 'Nenhum'}</p>
        </div>
        
        <div className="mt-6">
          <h3 className="text-md font-semibold mb-2">Ações</h3>
          <div className="space-x-4">
            <a 
              href="/dashboard" 
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Ir para Dashboard
            </a>
            <a 
              href="/login" 
              className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Ir para Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
