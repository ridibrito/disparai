import { Suspense } from 'react';
import DisparosPage from '@/components/disparos/DisparosPage';

export default function Disparos() {
  return (
    <div className="space-y-6">
      <Suspense fallback={
        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Disparos</h1>
          <p className="text-gray-600">Carregando...</p>
        </div>
      }>
        <DisparosPage />
      </Suspense>
    </div>
  );
}