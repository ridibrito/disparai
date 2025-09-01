'use client';

import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type PlanLimitAlertProps = {
  title: string;
  message: string;
  showUpgradeButton?: boolean;
};

export function PlanLimitAlert({ title, message, showUpgradeButton = true }: PlanLimitAlertProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <span>{message}</span>
        {showUpgradeButton && (
          <Link href="/dashboard/plans" className="shrink-0">
            <Button variant="outline" size="sm" className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600">
              Fazer Upgrade
            </Button>
          </Link>
        )}
      </AlertDescription>
    </Alert>
  );
}