'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useNativeNotifications } from '@/hooks/useNativeNotifications';

interface NotificationPermissionBannerProps {
  onPermissionGranted?: () => void;
}

export function NotificationPermissionBanner({ onPermissionGranted }: NotificationPermissionBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const { isSupported, permission, requestPermission } = useNativeNotifications();

  useEffect(() => {
    // Mostrar banner se:
    // 1. Navegador suporta notificações
    // 2. Permissão ainda não foi solicitada ou foi negada
    // 3. Banner não foi fechado pelo usuário
    const bannerDismissed = localStorage.getItem('notification-banner-dismissed');
    
    if (isSupported && permission === 'default' && !bannerDismissed) {
      setShowBanner(true);
    }
  }, [isSupported, permission]);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    
    try {
      const granted = await requestPermission();
      
      if (granted) {
        setShowBanner(false);
        onPermissionGranted?.();
        toast.success('Notificações ativadas! Você receberá alertas de novas mensagens.');
      } else {
        toast.error('Permissão para notificações negada. Você pode ativar depois nas configurações do navegador.');
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      toast.error('Erro ao ativar notificações');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('notification-banner-dismissed', 'true');
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-green-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Ativar notificações
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Receba notificações de novas mensagens do WhatsApp, igual ao app original.
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRequesting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {isRequesting ? 'Ativando...' : 'Ativar'}
              </button>
              
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-gray-600 text-sm rounded-md hover:bg-gray-100 transition-colors"
              >
                Agora não
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
