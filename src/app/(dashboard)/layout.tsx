import Link from 'next/link';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { createServerClient } from '@/lib/supabaseServer';
import { Settings, Home, Users, MessageSquare, Zap } from 'lucide-react';
import { SidebarToggle } from '@/components/dashboard/sidebar-toggle';
import { UserDropdown } from '@/components/ui/user-dropdown';
import { SidebarLink } from '@/components/dashboard/sidebar-link';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  
  // Obter dados do usuário
  let userName = 'Usuário';
  let avatarUrl: string | null = null;
  if (user?.id) {
    const { data: userData } = await supabase
      .from('users')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();
    
    userName = ((userData as unknown as { full_name?: string } | null)?.full_name) || user.email || 'Usuário';
    avatarUrl = (userData as unknown as { avatar_url?: string | null } | null)?.avatar_url ?? null;
  }

  // Obter status de trial da organização (id == user.id no seed/trigger)
  const { data: org } = await supabase
    .from('organizations')
    .select('trial_starts_at, trial_ends_at, trial_status, created_at')
    .eq('id', user.id)
    .single();

  let trialBanner: React.ReactNode = null;
  if (org) {
    let days = 0;
    if (org.trial_status === 'active') {
      if (org.trial_ends_at) {
        const ends = new Date(org.trial_ends_at as unknown as string);
        const now = new Date();
        const diffMs = ends.getTime() - now.getTime();
        days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      } else if (org.created_at) {
        // Fallback: se não há trial_ends_at, considerar 3 dias a partir da criação
        const created = new Date(org.created_at as unknown as string);
        const ends = new Date(created.getTime() + 3 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const diffMs = ends.getTime() - now.getTime();
        days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      }
    }
    if (days > 0) {
      trialBanner = (
        <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Seu período de teste termina em <strong>{days} {days === 1 ? 'dia' : 'dias'}</strong>.{' '}
          <a href="/configuracoes/assinatura" className="underline">Ative um plano</a> para não interromper o serviço.
        </div>
      );
    }
  }
  
  return (
    <div className="dashboard-layout bg-gray-50">
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center">
              <Image
                src="/logo.png"
                alt="disparai Logo"
                width={180}
                height={40}
                className="h-6 w-auto logo-full"
                priority
              />
            </div>
            <SidebarToggle />
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              <li>
                <SidebarLink href="/dashboard" title="Início">
                  <Home className="w-5 h-5 mr-3 group-hover:text-green-600" />
                  <span className="sidebar-label">Início</span>
                </SidebarLink>
              </li>
              <li>
                <SidebarLink href="/disparos" title="Disparos">
                  <Zap className="w-5 h-5 mr-3 text-[#4bca59]" />
                  <span className="sidebar-label">Disparos</span>
                </SidebarLink>
              </li>
              <li>
                <SidebarLink href="/contatos" title="Contatos">
                  <Users className="w-5 h-5 mr-3 group-hover:text-green-600" />
                  <span className="sidebar-label">Contatos</span>
                </SidebarLink>
              </li>
              <li>
                <SidebarLink href="/conversas" title="Conversas">
                  <MessageSquare className="w-5 h-5 mr-3 group-hover:text-green-600" />
                  <span className="sidebar-label">Conversas</span>
                </SidebarLink>
              </li>
            </ul>
          </nav>
          
          {/* Footer - Configurações */}
          <div className="p-4 border-t border-gray-200">
            <SidebarLink href="/configuracoes" title="Configurações">
              <Settings className="w-5 h-5 mr-3 group-hover:text-green-600" />
              <span className="sidebar-label">Configurações</span>
            </SidebarLink>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="dashboard-main">
        {/* Fixed Header */}
        <header className="dashboard-header">
          <div className="flex items-center justify-end h-16 px-6">
            <UserDropdown 
              userName={userName}
              userInitial={userName?.charAt(0).toUpperCase()}
              avatarUrl={avatarUrl}
            />
          </div>
        </header>
        
        {/* Page Content */}
        <main className="dashboard-content">
          {trialBanner}
          {children}
        </main>
      </div>
    </div>
  );
}
