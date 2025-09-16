import { WhatsAppFormingLoading } from '@/components/ui/whatsapp-loading';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <WhatsAppFormingLoading 
        size="lg" 
        text="Carregando aplicação..." 
      />
    </div>
  );
}


