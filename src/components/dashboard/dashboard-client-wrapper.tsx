'use client';

import { ImportProvider } from '@/contexts/import-context';
import { FloatingProgressBar } from '@/components/ui/floating-progress-bar';

export function DashboardClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ImportProvider>
      {children}
      <FloatingProgressBar />
    </ImportProvider>
  );
}
