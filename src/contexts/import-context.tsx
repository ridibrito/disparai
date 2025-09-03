'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ImportProgress {
  isProcessing: boolean;
  progress: number;
  step: string;
  totalRows: number;
  processedRows: number;
  canCancel: boolean;
  fileName: string;
}

interface ImportContextType {
  importProgress: ImportProgress;
  startImport: (fileName: string, totalRows: number) => void;
  updateProgress: (progress: number, step: string, processedRows: number) => void;
  completeImport: () => void;
  cancelImport: () => void;
  resetImport: () => void;
}

const ImportContext = createContext<ImportContextType | undefined>(undefined);

export function ImportProvider({ children }: { children: ReactNode }) {
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    isProcessing: false,
    progress: 0,
    step: '',
    totalRows: 0,
    processedRows: 0,
    canCancel: false,
    fileName: '',
  });

  const startImport = (fileName: string, totalRows: number) => {
    setImportProgress({
      isProcessing: true,
      progress: 10,
      step: 'Analisando estrutura do arquivo...',
      totalRows,
      processedRows: 0,
      canCancel: true,
      fileName,
    });
  };

  const updateProgress = (progress: number, step: string, processedRows: number) => {
    setImportProgress(prev => ({
      ...prev,
      progress,
      step,
      processedRows,
    }));
  };

  const completeImport = () => {
    setImportProgress(prev => ({
      ...prev,
      progress: 100,
      step: 'Processamento concluído!',
      isProcessing: false,
      canCancel: false,
    }));
  };

  const cancelImport = () => {
    setImportProgress(prev => ({
      ...prev,
      isProcessing: false,
      canCancel: false,
      step: 'Cancelando...',
    }));
  };

  const resetImport = () => {
    setImportProgress({
      isProcessing: false,
      progress: 0,
      step: '',
      totalRows: 0,
      processedRows: 0,
      canCancel: false,
      fileName: '',
    });
  };

  return (
    <ImportContext.Provider value={{
      importProgress,
      startImport,
      updateProgress,
      completeImport,
      cancelImport,
      resetImport,
    }}>
      {children}
    </ImportContext.Provider>
  );
}

export function useImport() {
  const context = useContext(ImportContext);
  if (context === undefined) {
    throw new Error('useImport must be used within an ImportProvider');
  }
  return context;
}
