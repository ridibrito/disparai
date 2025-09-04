'use client';

import { useAuth } from '@/contexts/AuthContext';
import WhatsAppConnectionPage from './WhatsAppConnectionPage';

export default function WhatsAppConnectionPageWithUser() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-600">Usuário não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <WhatsAppConnectionPage 
      userId={user.id}
      userName={user.email || 'Usuário'}
    />
  );
}
