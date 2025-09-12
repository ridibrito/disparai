'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Bell, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'message' | 'success' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  conversationId?: string;
  contactName?: string;
  contactPhone?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Limitar a 50 notificações para não sobrecarregar
    setNotifications(current => current.slice(0, 50));

    // Tocar som de notificação (opcional)
    if (typeof window !== 'undefined' && 'Audio' in window) {
      try {
        const audio = new Audio('/notification.mp3'); // Você pode adicionar um arquivo de som
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Ignorar erro se não conseguir tocar o som
        });
      } catch (error) {
        // Ignorar erro de áudio
      }
    }

    console.log('🔔 Nova notificação adicionada:', newNotification);
    console.log('🔔 Total de notificações agora:', notifications.length + 1);
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Auto-remover notificações antigas (mais de 24 horas)
  useEffect(() => {
    const interval = setInterval(() => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      setNotifications(prev => 
        prev.filter(notification => notification.timestamp > oneDayAgo)
      );
    }, 60 * 60 * 1000); // Verificar a cada hora

    return () => clearInterval(interval);
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Função auxiliar para obter ícone da notificação
export function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'message':
      return MessageSquare;
    case 'success':
      return CheckCircle;
    case 'error':
      return AlertCircle;
    case 'info':
      return Bell;
    default:
      return Bell;
  }
}

// Função auxiliar para obter cor da notificação
export function getNotificationColor(type: Notification['type']) {
  switch (type) {
    case 'message':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'success':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'error':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'info':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}
