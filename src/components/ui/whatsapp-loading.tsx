'use client';

import React from 'react';
import { Zap } from 'lucide-react';

interface WhatsAppLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function WhatsAppLoading({ 
  size = 'md', 
  text = 'Carregando...', 
  className = '' 
}: WhatsAppLoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const containerSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <div className="relative">
        {/* Container para o ícone Zap sendo desenhado */}
        <div className={`${containerSizeClasses[size]} relative flex items-center justify-center`}>
          {/* Ícone Zap sendo desenhado progressivamente */}
          <Zap 
            className={`${sizeClasses[size]} text-green-500`}
            style={{
              strokeDasharray: '100',
              strokeDashoffset: '100',
              animation: 'whatsapp-zap-draw 2s ease-in-out infinite'
            }}
          />
        </div>
      </div>
      
      {text && (
        <span className={`${textSizeClasses[size]} text-gray-600 font-medium`}>
          {text}
        </span>
      )}
      
      <style jsx>{`
        @keyframes whatsapp-zap-draw {
          0% {
            stroke-dashoffset: 100;
            opacity: 0.3;
          }
          50% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          100% {
            stroke-dashoffset: -100;
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}

// Componente de loading mais elaborado com múltiplos ícones Zap sendo desenhados
export function WhatsAppFormingLoading({ 
  size = 'md', 
  text = 'Conectando WhatsApp...', 
  className = '' 
}: WhatsAppLoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const containerSizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className="relative">
        {/* Container principal */}
        <div className={`${containerSizeClasses[size]} relative flex items-center justify-center`}>
          {/* Múltiplos ícones Zap sendo desenhados em sequência */}
          <Zap 
            className={`${sizeClasses[size]} text-green-500 absolute`}
            style={{
              strokeDasharray: '100',
              strokeDashoffset: '100',
              animation: 'whatsapp-zap-draw-1 2s ease-in-out infinite'
            }}
          />
          
          <Zap 
            className={`${sizeClasses[size]} text-green-400 absolute`}
            style={{
              strokeDasharray: '100',
              strokeDashoffset: '100',
              animation: 'whatsapp-zap-draw-2 2s ease-in-out infinite 0.3s'
            }}
          />
          
          <Zap 
            className={`${sizeClasses[size]} text-green-300 absolute`}
            style={{
              strokeDasharray: '100',
              strokeDashoffset: '100',
              animation: 'whatsapp-zap-draw-3 2s ease-in-out infinite 0.6s'
            }}
          />
        </div>
      </div>
      
      {text && (
        <div className="text-center">
          <span className={`${textSizeClasses[size]} text-gray-600 font-medium block`}>
            {text}
          </span>
          <div className="flex items-center justify-center gap-1 mt-2">
            <div 
              className="w-1 h-1 bg-green-500 rounded-full animate-bounce"
              style={{ animationDelay: '0s' }}
            />
            <div 
              className="w-1 h-1 bg-green-500 rounded-full animate-bounce"
              style={{ animationDelay: '0.1s' }}
            />
            <div 
              className="w-1 h-1 bg-green-500 rounded-full animate-bounce"
              style={{ animationDelay: '0.2s' }}
            />
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes whatsapp-zap-draw-1 {
          0% {
            stroke-dashoffset: 100;
            opacity: 0.2;
            transform: scale(0.8);
          }
          50% {
            stroke-dashoffset: 0;
            opacity: 1;
            transform: scale(1);
          }
          100% {
            stroke-dashoffset: -100;
            opacity: 0.2;
            transform: scale(0.8);
          }
        }
        
        @keyframes whatsapp-zap-draw-2 {
          0% {
            stroke-dashoffset: 100;
            opacity: 0.2;
            transform: scale(0.8);
          }
          50% {
            stroke-dashoffset: 0;
            opacity: 0.8;
            transform: scale(1);
          }
          100% {
            stroke-dashoffset: -100;
            opacity: 0.2;
            transform: scale(0.8);
          }
        }
        
        @keyframes whatsapp-zap-draw-3 {
          0% {
            stroke-dashoffset: 100;
            opacity: 0.2;
            transform: scale(0.8);
          }
          50% {
            stroke-dashoffset: 0;
            opacity: 0.6;
            transform: scale(1);
          }
          100% {
            stroke-dashoffset: -100;
            opacity: 0.2;
            transform: scale(0.8);
          }
        }
      `}</style>
    </div>
  );
}

