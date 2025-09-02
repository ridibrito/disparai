'use client';

import * as React from 'react';
import { NewContactModal } from './new-contact-modal';

export function NewContactButton({ userId }: { userId: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center h-11 px-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-primary-light)]"
      >
        Novo contato
      </button>
      <NewContactModal open={open} onClose={() => setOpen(false)} userId={userId} />
    </>
  );
}


