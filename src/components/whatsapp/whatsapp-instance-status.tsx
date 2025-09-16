'use client';

import React from 'react';
import { WhatsAppInstanceSelector } from './whatsapp-instance-selector';

interface WhatsAppInstanceStatusProps {
  onInstanceChange?: (instance: any) => void;
  className?: string;
  compact?: boolean;
  isAdmin?: boolean;
}

export function WhatsAppInstanceStatus({ 
  onInstanceChange,
  className = '',
  compact = false,
  isAdmin = true
}: WhatsAppInstanceStatusProps) {
  return (
    <WhatsAppInstanceSelector
      onInstanceChange={onInstanceChange}
      showDetails={!compact}
      isAdmin={isAdmin}
      className={className}
    />
  );
}
