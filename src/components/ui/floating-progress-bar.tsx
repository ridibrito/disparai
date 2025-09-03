'use client';

import { useImport } from '@/contexts/import-context';
import { X, Upload } from 'lucide-react';
import { Button } from './button';

export function FloatingProgressBar() {
  const { importProgress, cancelImport, resetImport } = useImport();

  if (!importProgress.isProcessing) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 z-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">
            Importando contatos
          </span>
        </div>
        <button
          onClick={resetImport}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nome do arquivo */}
      <p className="text-xs text-gray-600 mb-2 truncate">
        {importProgress.fileName}
      </p>

      {/* Barra de progresso */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${importProgress.progress}%` }}
        ></div>
      </div>

      {/* Status e progresso */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-gray-600">
          {importProgress.processedRows} de {importProgress.totalRows} linhas
        </span>
        <span className="text-xs font-medium text-blue-600">
          {importProgress.progress}%
        </span>
      </div>

      {/* Mensagem de status */}
      <p className="text-xs text-gray-700 mb-3 line-clamp-2">
        {importProgress.step}
      </p>

      {/* Botão de cancelar */}
      {importProgress.canCancel && (
        <Button
          onClick={cancelImport}
          variant="outline"
          size="sm"
          className="w-full border-red-300 text-red-600 hover:bg-red-50 text-xs"
        >
          Cancelar Importação
        </Button>
      )}

      {/* Indicador de conclusão */}
      {importProgress.progress === 100 && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-green-600 text-sm">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            Processamento concluído!
          </div>
        </div>
      )}
    </div>
  );
}
