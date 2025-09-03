'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Play, Pause, RotateCcw, AlertTriangle } from 'lucide-react';
import { usePeriodicDuplicateCheck } from '@/hooks/use-periodic-duplicate-check';
import { type Contact } from '@/hooks/use-duplicate-detection';

type DuplicateCheckStatusProps = {
  contacts: Contact[];
  onDuplicatesFound?: (duplicates: any[]) => void;
  compact?: boolean;
};

export function DuplicateCheckStatus({ 
  contacts, 
  onDuplicatesFound, 
  compact = false 
}: DuplicateCheckStatusProps) {
  const [intervalMinutes, setIntervalMinutes] = useState(30);
  const [isEnabled, setIsEnabled] = useState(true);
  
  const {
    isRunning,
    lastCheck,
    nextCheck,
    forceCheck,
    stopPeriodicCheck,
    restartPeriodicCheck,
    hasDuplicates,
    duplicateStats
  } = usePeriodicDuplicateCheck(contacts, {
    intervalMinutes,
    enabled: isEnabled,
    onDuplicatesFound,
    silent: false
  });

  const formatTime = (date: Date | null) => {
    if (!date) return 'Nunca';
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes === 1) return '1 minuto atrás';
    if (diffMinutes < 60) return `${diffMinutes} minutos atrás`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hora atrás';
    if (diffHours < 24) return `${diffHours} horas atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 dia atrás';
    return `${diffDays} dias atrás`;
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 text-gray-600 bg-gray-50 px-2 py-1 rounded-md text-xs">
        <Clock className="h-3 w-3" />
        <span>
          {isRunning ? 'Verificando...' : 'Parado'}
        </span>
        {hasDuplicates && (
          <span className="text-orange-600">
            • {duplicateStats?.uniquePhones} duplicados
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-blue-600" />
            <h4 className="text-sm font-medium text-blue-800">
              Verificação Periódica de Duplicados
            </h4>
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs ${
              isRunning 
                ? 'text-green-600 bg-green-100' 
                : 'text-gray-600 bg-gray-100'
            }`}>
              {isRunning ? '🟢 Ativo' : '🔴 Parado'}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-blue-700 mb-4">
            <div>
              <p className="font-medium">Status:</p>
              <p>{isRunning ? 'Verificando automaticamente' : 'Verificação parada'}</p>
            </div>
            
            <div>
              <p className="font-medium">Intervalo:</p>
              <p>A cada {intervalMinutes} minutos</p>
            </div>
            
            <div>
              <p className="font-medium">Última verificação:</p>
              <p>{formatTime(lastCheck)} ({formatTimeAgo(lastCheck)})</p>
            </div>
            
            <div>
              <p className="font-medium">Próxima verificação:</p>
              <p>{nextCheck ? formatTime(nextCheck) : 'N/A'}</p>
            </div>
          </div>

          {hasDuplicates && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  Duplicados detectados na última verificação
                </span>
              </div>
              <p className="text-sm text-orange-700">
                {duplicateStats?.uniquePhones} telefones com múltiplos contatos 
                ({duplicateStats?.totalDuplicates} contatos duplicados)
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-blue-700 font-medium">
                Intervalo (minutos):
              </label>
              <select
                value={intervalMinutes}
                onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                className="h-8 rounded border border-blue-300 px-2 text-sm bg-white"
                disabled={isRunning}
              >
                <option value={5}>5 min</option>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={60}>1 hora</option>
                <option value={120}>2 horas</option>
                <option value={240}>4 horas</option>
                <option value={480}>8 horas</option>
                <option value={1440}>24 horas</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-blue-700 font-medium">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="mr-2"
                />
                Habilitado
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 ml-4">
          <Button
            onClick={forceCheck}
            size="sm"
            variant="outline"
            className="border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Verificar Agora
          </Button>

          {isRunning ? (
            <Button
              onClick={stopPeriodicCheck}
              size="sm"
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <Pause className="h-4 w-4 mr-2" />
              Parar
            </Button>
          ) : (
            <Button
              onClick={restartPeriodicCheck}
              size="sm"
              variant="outline"
              className="border-green-300 text-green-600 hover:bg-green-50"
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 text-xs text-blue-600 bg-blue-100 p-2 rounded">
        💡 A verificação periódica ajuda a manter sua base de contatos limpa, 
        detectando duplicados que podem surgir ao longo do tempo.
      </div>
    </div>
  );
}
