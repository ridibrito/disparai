'use client';

import { ImportProvider } from '@/contexts/import-context';
import { WhatsAppInstanceProvider } from '@/contexts/WhatsAppInstanceContext';
import { FloatingProgressBar } from '@/components/ui/floating-progress-bar';

export function DashboardClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ImportProvider>
      <WhatsAppInstanceProvider>
        {children}
        <FloatingProgressBar />
      </WhatsAppInstanceProvider>
    </ImportProvider>
  );
}
