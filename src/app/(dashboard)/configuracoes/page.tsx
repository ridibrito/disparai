import Link from 'next/link';
import { Settings, User, CreditCard, Wifi, Shield, Bell, Download, Users } from 'lucide-react';

export const metadata = {
  title: 'Configurações - disparai',
  description: 'Configure sua conta e preferências',
};

export default function ConfiguracoesPage() {
  const settingsSections = [
    {
      title: 'Perfil',
      description: 'Gerencie suas informações pessoais',
      icon: User,
      href: '/configuracoes/perfil',
      color: 'text-blue-500'
    },
    {
      title: 'Assinatura',
      description: 'Gerencie seu plano e pagamentos',
      icon: CreditCard,
      href: '/configuracoes/assinatura',
      color: 'text-green-500'
    },
    {
      title: 'Conexão API',
      description: 'Configure sua API do WhatsApp',
      icon: Wifi,
      href: '/configuracoes/conexao-api',
      color: 'text-purple-500'
    },
    {
      title: 'Segurança',
      description: 'Configurações de segurança da conta',
      icon: Shield,
      href: '/configuracoes/seguranca',
      color: 'text-red-500'
    },
    {
      title: 'Notificações',
      description: 'Configure suas notificações',
      icon: Bell,
      href: '/configuracoes/notificacoes',
      color: 'text-yellow-500'
    },
    {
      title: 'Usuários',
      description: 'Gerencie membros da organização',
      icon: Users,
      href: '/configuracoes/usuarios',
      color: 'text-emerald-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações</h1>
        <p className="text-gray-600">Gerencie sua conta e personalize suas preferências.</p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Link
              key={section.title}
              href={section.href}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center mb-4">
                <div className={`p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors mr-3`}>
                  <IconComponent className={`w-6 h-6 ${section.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
              </div>
              <p className="text-gray-600">{section.description}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Exportar dados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-5 h-5 text-gray-500 mr-3" />
            <div className="text-left">
              <h3 className="font-medium text-gray-900">Exportar CSV</h3>
              <p className="text-sm text-gray-500">Baixe seus dados de contatos e campanhas</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
