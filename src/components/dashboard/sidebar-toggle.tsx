'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import Image from 'next/image';

export function SidebarToggle() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sidebar-collapsed') : null;
    if (saved === '1') collapse();
  }, []);

  const collapse = () => {
    document.documentElement.style.setProperty('--sidebar-width', '4rem');
    document.documentElement.classList.add('sidebar-collapsed');
    document.querySelector('.dashboard-sidebar')?.classList.add('collapsed');
    document.querySelector('.dashboard-main')?.classList.add('expanded');
    document.querySelector('.dashboard-header')?.classList.add('expanded');
    localStorage.setItem('sidebar-collapsed', '1');
    setCollapsed(true);
  };

  const expand = () => {
    document.documentElement.style.setProperty('--sidebar-width', '16rem');
    document.documentElement.classList.remove('sidebar-collapsed');
    document.querySelector('.dashboard-sidebar')?.classList.remove('collapsed');
    document.querySelector('.dashboard-main')?.classList.remove('expanded');
    document.querySelector('.dashboard-header')?.classList.remove('expanded');
    localStorage.setItem('sidebar-collapsed', '0');
    setCollapsed(false);
  };

  const toggle = () => (collapsed ? expand() : collapse());

  if (collapsed) {
    return (
      <button onClick={toggle} className="p-1 rounded-md hover:bg-gray-100 transition" title="Abrir menu">
        <Image src="/icone.png" alt="Abrir menu" width={28} height={28} className="w-7 h-7" />
      </button>
    );
  }

  return (
    <button onClick={toggle} className="p-2 rounded-md hover:bg-gray-100 transition" title="Recolher menu">
      <ChevronLeft className="w-5 h-5" />
    </button>
  );
}


