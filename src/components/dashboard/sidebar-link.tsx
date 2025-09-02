'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type SidebarLinkProps = React.PropsWithChildren<{
  href: string;
  title?: string;
  className?: string;
}>;

export function SidebarLink({ href, title, className, children }: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      title={title}
      className={cn(
        'flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors group sidebar-link',
        isActive && 'active',
        className
      )}
    >
      {children}
    </Link>
  );
}


