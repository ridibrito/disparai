import Link from 'next/link';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { createServerClient } from '@/lib/supabaseServer';
import { Settings, Home, Users, MessageSquare, Zap } from 'lucide-react';
import { SidebarToggle } from '@/components/dashboard/sidebar-toggle';
import { UserDropdown } from '@/components/ui/user-dropdown';

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
  if (user?.id) {
    const { data: userData } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single();
    
    userName = (userData as { full_name?: string })?.full_name || user.email || 'Usuário';
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
                alt="DisparaMaker Logo"
                width={180}
                height={40}
                className="h-8 w-auto logo-full"
                priority
              />
            </div>
            <SidebarToggle />
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/dashboard" 
                  className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors group sidebar-link"
                  title="Início"
                >
                  <Home className="w-5 h-5 mr-3 group-hover:text-green-600" />
                  <span className="sidebar-label">Início</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/disparos" 
                  className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors group sidebar-link"
                  title="Disparos"
                >
                  <Zap className="w-5 h-5 mr-3 group-hover:text-green-600" />
                  <span className="sidebar-label">Disparos</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/contatos" 
                  className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors group sidebar-link"
                  title="Contatos"
                >
                  <Users className="w-5 h-5 mr-3 group-hover:text-green-600" />
                  <span className="sidebar-label">Contatos</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/conversas" 
                  className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors group sidebar-link"
                  title="Conversas"
                >
                  <MessageSquare className="w-5 h-5 mr-3 group-hover:text-green-600" />
                  <span className="sidebar-label">Conversas</span>
                </Link>
              </li>
            </ul>
          </nav>
          
          {/* Footer - Configurações */}
          <div className="p-4 border-t border-gray-200">
            <Link 
              href="/configuracoes" 
              className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors group sidebar-link"
              title="Configurações"
            >
              <Settings className="w-5 h-5 mr-3 group-hover:text-green-600" />
              <span className="sidebar-label">Configurações</span>
            </Link>
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
            />
          </div>
        </header>
        
        {/* Page Content */}
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}
