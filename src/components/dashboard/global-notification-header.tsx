'use client';

import { useGlobalNotificationSystem } from '@/hooks/useGlobalNotificationSystem';
import { NotificationBell } from '@/components/ui/notification-bell';

interface GlobalNotificationHeaderProps {
  children: React.ReactNode;
}

export function GlobalNotificationHeader({ children }: GlobalNotificationHeaderProps) {
  // Inicializar sistema de notificações globais
  useGlobalNotificationSystem();

  return (
    <>
      {children}
    </>
  );
}
