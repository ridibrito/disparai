'use client';

import { useState } from 'react';

export function TestPlanButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePlan = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test/update-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Plano alterado:', result);
        alert('✅ Plano alterado para Empresarial com sucesso!\n\nRecarregando...');
        window.location.reload();
      } else {
        alert('❌ Erro: ' + result.error);
      }
    } catch (error) {
      alert('❌ Erro na requisição: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleUpdatePlan}
      disabled={isLoading}
      className="ml-2 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? '🔄 Processando...' : '🧪 Teste: Plano Empresarial'}
    </button>
  );
}
