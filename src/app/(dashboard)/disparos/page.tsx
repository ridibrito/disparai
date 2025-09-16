import { Suspense } from 'react';
import DisparosPage from '@/components/disparos/DisparosPage';
import { WhatsAppLoading } from '@/components/ui/whatsapp-loading';

export default function Disparos() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <WhatsAppLoading 
          size="lg" 
          text="Carregando disparos..." 
        />
      </div>
    }>
      <DisparosPage />
    </Suspense>
  );
}