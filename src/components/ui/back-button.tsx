'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
}

export function BackButton({ 
  href = '/configuracoes', 
  label = 'Voltar às Configurações',
  className = ''
}: BackButtonProps) {
  return (
    <Link href={href}>
      <Button variant="outline" size="sm" className={`${className}`}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        {label}
      </Button>
    </Link>
  );
}
