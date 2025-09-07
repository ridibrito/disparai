'use client';

import { AlertCircle, X } from 'lucide-react';
import { useState } from 'react';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
  className?: string;
}

export default function ErrorMessage({ 
  message, 
  onDismiss, 
  type = 'error',
  className = "" 
}: ErrorMessageProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  const getStyles = () => {
    switch (type) {
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: 'text-yellow-600',
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-600',
        };
      default: // error
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'text-red-600',
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`mb-6 p-4 text-sm border rounded-md flex items-start space-x-3 ${styles.container} ${className}`}>
      <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
      <div className="flex-1">
        <p className="font-medium">Ops! Algo deu errado</p>
        <p className="mt-1">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={handleDismiss}
          className={`flex-shrink-0 ${styles.icon} hover:opacity-70 transition-opacity`}
          aria-label="Fechar mensagem de erro"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
