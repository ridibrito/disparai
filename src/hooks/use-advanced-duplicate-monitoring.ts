import { useState, useEffect, useRef, useCallback } from 'react';
import { useDuplicateDetection, type Contact } from './use-duplicate-detection';

type MonitoringStrategy = 'realtime' | 'periodic' | 'on-demand' | 'smart';

type AdvancedDuplicateMonitoringOptions = {
  strategy: MonitoringStrategy;
  intervalMinutes?: number;
  enabled?: boolean;
  silentMode?: boolean;
  maxDuplicatesThreshold?: number; // Alertar quando exceder este número
  onDuplicatesFound?: (duplicates: any[], stats: any) => void;
  onThresholdExceeded?: (duplicates: any[], threshold: number) => void;
};

export function useAdvancedDuplicateMonitoring(
  contacts: Contact[],
  options: AdvancedDuplicateMonitoringOptions
) {
  const {
    strategy = 'smart',
    intervalMinutes = 30,
    enabled = true,
    silentMode = false,
    maxDuplicatesThreshold = 10,
    onDuplicatesFound,
    onThresholdExceeded
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<Date | null>(null);
  const checkCountRef = useRef(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastAlertTime, setLastAlertTime] = useState<Date | null>(null);
  
  const { duplicates, hasDuplicates, duplicateStats } = useDuplicateDetection(contacts);

  // Estratégia inteligente: ajusta o intervalo baseado na quantidade de duplicados
  const getSmartInterval = useCallback(() => {
    if (!duplicateStats) return intervalMinutes;
    
    const duplicateCount = duplicateStats.totalDuplicates;
    const totalContacts = duplicateStats.totalContacts;
    const duplicatePercentage = duplicateStats.duplicatePercentage;
    
    // Se há muitos duplicados, verificar mais frequentemente
    if (duplicatePercentage > 20 || duplicateCount > 50) {
      return 5; // 5 minutos
    } else if (duplicatePercentage > 10 || duplicateCount > 20) {
      return 15; // 15 minutos
    } else if (duplicateCount > 5) {
      return 30; // 30 minutos
    } else {
      return 60; // 1 hora
    }
  }, [duplicateStats, intervalMinutes]);

  // Função principal de verificação
  const runCheck = useCallback(() => {
    if (!enabled || !contacts.length) return;

    const now = new Date();
    lastCheckRef.current = now;
    checkCountRef.current++;

    // Verificar se excedeu o threshold
    if (duplicateStats && duplicateStats.totalDuplicates > maxDuplicatesThreshold) {
      if (onThresholdExceeded) {
        onThresholdExceeded(duplicates, maxDuplicatesThreshold);
      }
      
      if (!silentMode) {
        console.warn(`⚠️ THRESHOLD EXCEDIDO: ${duplicateStats.totalDuplicates} duplicados (limite: ${maxDuplicatesThreshold})`);
      }
    }

    // Se encontrou duplicados
    if (hasDuplicates && duplicateStats) {
      if (onDuplicatesFound) {
        onDuplicatesFound(duplicates, duplicateStats);
      }
      
      if (!silentMode) {
        console.log(`🔍 [${now.toLocaleTimeString()}] Verificação #${checkCountRef.current}: ${duplicates.length} grupos de duplicados encontrados`);
        console.log(`   📊 Estatísticas: ${duplicateStats.totalDuplicates} contatos duplicados (${duplicateStats.duplicatePercentage}%)`);
      }
    } else if (!silentMode) {
      console.log(`🔍 [${now.toLocaleTimeString()}] Verificação #${checkCountRef.current}: Nenhum duplicado encontrado`);
    }
  }, [enabled, contacts.length, hasDuplicates, duplicates, duplicateStats, maxDuplicatesThreshold, onDuplicatesFound, onThresholdExceeded, silentMode]);

  // Iniciar monitoramento baseado na estratégia
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsMonitoring(false);
      return;
    }

    let currentInterval = intervalMinutes;

    // Ajustar intervalo baseado na estratégia
    if (strategy === 'smart') {
      currentInterval = getSmartInterval();
    } else if (strategy === 'realtime') {
      currentInterval = 1; // 1 minuto
    } else if (strategy === 'on-demand') {
      currentInterval = 0; // Sem verificação automática
    }

    // Executar verificação imediatamente
    runCheck();

    // Configurar intervalo se necessário
    if (currentInterval > 0) {
      const intervalMs = currentInterval * 60 * 1000;
      intervalRef.current = setInterval(runCheck, intervalMs);
      setIsMonitoring(true);

      if (!silentMode) {
        console.log(`🚀 Monitoramento iniciado: estratégia "${strategy}", intervalo: ${currentInterval} minutos`);
      }
    } else {
      setIsMonitoring(false);
      if (!silentMode) {
        console.log(`🚀 Monitoramento iniciado: estratégia "${strategy}" (sem verificação automática)`);
      }
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsMonitoring(false);
        if (!silentMode) {
          console.log('🛑 Monitoramento parado');
        }
      }
    };
  }, [enabled, strategy, intervalMinutes, getSmartInterval, runCheck, silentMode]);

  // Função para forçar verificação manual
  const forceCheck = useCallback(() => {
    console.log('🔍 Verificação manual solicitada');
    runCheck();
  }, [runCheck]);

  // Função para parar monitoramento
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsMonitoring(false);
      console.log('🛑 Monitoramento parado manualmente');
    }
  }, []);

  // Função para reiniciar monitoramento
  const restartMonitoring = useCallback(() => {
    stopMonitoring();
    
    if (enabled) {
      const currentInterval = strategy === 'smart' ? getSmartInterval() : intervalMinutes;
      if (currentInterval > 0) {
        const intervalMs = currentInterval * 60 * 1000;
        intervalRef.current = setInterval(runCheck, intervalMs);
        setIsMonitoring(true);
        console.log(`🚀 Monitoramento reiniciado: intervalo ${currentInterval} minutos`);
      }
    }
  }, [enabled, strategy, intervalMinutes, getSmartInterval, runCheck, stopMonitoring]);

  // Função para alterar estratégia
  const changeStrategy = useCallback((newStrategy: MonitoringStrategy) => {
    console.log(`🔄 Alterando estratégia de "${strategy}" para "${newStrategy}"`);
    // O useEffect vai detectar a mudança e reconfigurar automaticamente
  }, [strategy]);

  return {
    // Estado atual
    isMonitoring,
    strategy,
    lastCheck: lastCheckRef.current,
    nextCheck: lastCheckRef.current && intervalRef.current ? 
      new Date(lastCheckRef.current.getTime() + (getSmartInterval() * 60 * 1000)) : null,
    checkCount: checkCountRef.current,
    
    // Controles
    forceCheck,
    stopMonitoring,
    restartMonitoring,
    changeStrategy,
    
    // Estatísticas
    duplicates,
    hasDuplicates,
    duplicateStats,
    thresholdExceeded: duplicateStats ? duplicateStats.totalDuplicates > maxDuplicatesThreshold : false,
    
    // Configurações
    intervalMinutes: strategy === 'smart' ? getSmartInterval() : intervalMinutes,
    enabled,
    silentMode,
    maxDuplicatesThreshold
  };
}
