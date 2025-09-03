import { useEffect, useRef, useCallback } from 'react';
import { useDuplicateDetection, type Contact } from './use-duplicate-detection';

type PeriodicDuplicateCheckOptions = {
  intervalMinutes?: number; // Intervalo em minutos
  enabled?: boolean; // Se deve executar ou não
  onDuplicatesFound?: (duplicates: any[]) => void; // Callback quando duplicados são encontrados
  silent?: boolean; // Se deve mostrar notificações ou não
};

export function usePeriodicDuplicateCheck(
  contacts: Contact[],
  options: PeriodicDuplicateCheckOptions = {}
) {
  const {
    intervalMinutes = 30, // Verificar a cada 30 minutos por padrão
    enabled = true,
    onDuplicatesFound,
    silent = false
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<Date | null>(null);
  const { duplicates, hasDuplicates, duplicateStats } = useDuplicateDetection(contacts);

  // Função para executar a verificação
  const runCheck = useCallback(() => {
    if (!enabled || !contacts.length) return;

    const now = new Date();
    lastCheckRef.current = now;

    // Se encontrou duplicados e não é silencioso
    if (hasDuplicates && !silent) {
      console.log(`[${now.toLocaleTimeString()}] Verificação periódica: ${duplicates.length} grupos de duplicados encontrados`);
      
      // Callback personalizado se fornecido
      if (onDuplicatesFound) {
        onDuplicatesFound(duplicates);
      }
    } else if (hasDuplicates) {
      console.log(`[${now.toLocaleTimeString()}] Verificação periódica: ${duplicates.length} grupos de duplicados encontrados (silencioso)`);
    } else {
      console.log(`[${now.toLocaleTimeString()}] Verificação periódica: Nenhum duplicado encontrado`);
    }
  }, [enabled, contacts.length, hasDuplicates, duplicates, silent, onDuplicatesFound]);

  // Iniciar verificação periódica
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Executar verificação imediatamente na primeira vez
    runCheck();

    // Configurar intervalo
    const intervalMs = intervalMinutes * 60 * 1000;
    intervalRef.current = setInterval(runCheck, intervalMs);

    console.log(`🔍 Verificação periódica de duplicados iniciada: a cada ${intervalMinutes} minutos`);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('🔍 Verificação periódica de duplicados parada');
      }
    };
  }, [enabled, intervalMinutes, runCheck]);

  // Função para forçar uma verificação manual
  const forceCheck = useCallback(() => {
    console.log('🔍 Verificação manual de duplicados solicitada');
    runCheck();
  }, [runCheck]);

  // Função para parar a verificação periódica
  const stopPeriodicCheck = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('🔍 Verificação periódica de duplicados parada manualmente');
    }
  }, []);

  // Função para reiniciar a verificação periódica
  const restartPeriodicCheck = useCallback(() => {
    stopPeriodicCheck();
    
    if (enabled) {
      const intervalMs = intervalMinutes * 60 * 1000;
      intervalRef.current = setInterval(runCheck, intervalMs);
      console.log(`🔍 Verificação periódica de duplicados reiniciada: a cada ${intervalMinutes} minutos`);
    }
  }, [enabled, intervalMinutes, runCheck, stopPeriodicCheck]);

  return {
    // Estado atual
    isRunning: !!intervalRef.current,
    lastCheck: lastCheckRef.current,
    nextCheck: lastCheckRef.current ? new Date(lastCheckRef.current.getTime() + (intervalMinutes * 60 * 1000)) : null,
    
    // Controles
    forceCheck,
    stopPeriodicCheck,
    restartPeriodicCheck,
    
    // Estatísticas da verificação
    duplicates,
    hasDuplicates,
    duplicateStats,
    
    // Configurações
    intervalMinutes,
    enabled
  };
}
