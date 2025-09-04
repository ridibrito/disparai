'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal, 
  Play, 
  Pause, 
  Trash2, 
  Eye, 
  Copy,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DisparoActionsProps {
  disparo: {
    id: string;
    name: string;
    status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'partial' | 'failed';
    message: string;
    created_at: string;
    scheduled_at?: string;
    started_at?: string;
    completed_at?: string;
  };
  onStatusChange?: () => void;
}

export function DisparoActions({ disparo, onStatusChange }: DisparoActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'sending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'partial':
        return <CheckCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Rascunho';
      case 'scheduled':
        return 'Agendada';
      case 'sending':
        return 'Enviando';
      case 'sent':
        return 'Enviada';
      case 'partial':
        return 'Parcial';
      case 'failed':
        return 'Falhou';
      default:
        return 'Desconhecido';
    }
  };

  const handleSendDisparo = async () => {
    if (disparo.status === 'sending') {
      toast.error('Disparo já está sendo enviado');
      return;
    }

    if (disparo.status === 'sent') {
      toast.error('Disparo já foi enviado');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/disparos/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          disparoId: disparo.id
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar disparo');
      }

      toast.success(`Disparo enviado! ${result.data.successCount} mensagens enviadas com sucesso.`);
      
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error: any) {
      console.error('Erro ao enviar disparo:', error);
      toast.error(error.message || 'Erro ao enviar disparo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDisparo = () => {
    // Implementar visualização do disparo
    toast.info('Visualização do disparo em desenvolvimento');
  };

  const handleDuplicateDisparo = () => {
    // Implementar duplicação do disparo
    toast.info('Duplicação de disparo em desenvolvimento');
  };

  const handleDeleteDisparo = async () => {
    if (!confirm('Tem certeza que deseja excluir este disparo?')) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/disparos/${disparo.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Erro ao excluir disparo');
      }

      toast.success('Disparo excluído com sucesso');
      
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error: any) {
      console.error('Erro ao excluir disparo:', error);
      toast.error(error.message || 'Erro ao excluir disparo');
    } finally {
      setIsLoading(false);
    }
  };

  const canSend = disparo.status === 'draft' || disparo.status === 'scheduled';
  const canDelete = disparo.status === 'draft' || disparo.status === 'failed';

  return (
    <div className="flex items-center gap-2">
      {/* Status Badge */}
      <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100">
        {getStatusIcon(disparo.status)}
        <span>{getStatusText(disparo.status)}</span>
      </div>

      {/* Send Button */}
      {canSend && (
        <Button
          onClick={handleSendDisparo}
          disabled={isLoading}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Play className="w-4 h-4 mr-1" />
          {isLoading ? 'Enviando...' : 'Enviar'}
        </Button>
      )}

      {/* Actions Menu */}
      <div className="relative" ref={menuRef}>
        <Button 
          variant="ghost" 
          size="sm" 
          disabled={isLoading}
          onClick={() => setShowMenu(!showMenu)}
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
        
        {showMenu && (
          <div className="absolute right-0 top-8 z-10 w-48 bg-white rounded-md shadow-lg border border-gray-200">
            <div className="py-1">
              <button
                onClick={() => {
                  setShowMenu(false);
                  handleViewDisparo();
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Eye className="w-4 h-4 mr-2" />
                Visualizar
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  handleDuplicateDisparo();
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </button>
              {canDelete && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleDeleteDisparo();
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
