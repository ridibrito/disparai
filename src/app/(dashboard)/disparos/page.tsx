import { Suspense } from 'react';
import DisparosPage from '@/components/disparos/DisparosPage';

export default function Disparos() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Carregando...</div>}>
        <DisparosPage />
      </Suspense>
    </div>
  );
}