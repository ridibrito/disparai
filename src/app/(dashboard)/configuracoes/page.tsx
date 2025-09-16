import Link from 'next/link';
import { Settings, User, CreditCard, Wifi, Bot, Users, FileText, MessageSquare } from 'lucide-react';

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
      title: 'Central WhatsApp',
      description: 'Gerencie todas as instâncias WhatsApp em um só lugar',
      icon: MessageSquare,
      href: '/configuracoes/central-whatsapp',
      color: 'text-green-500'
    },
    {
      title: 'Usuários',
      description: 'Gerencie membros da organização',
      icon: Users,
      href: '/configuracoes/usuarios',
      color: 'text-emerald-500'
    },
    {
      title: 'Templates',
      description: 'Gerencie templates de mensagens e campanhas',
      icon: FileText,
      href: '/configuracoes/templates',
      color: 'text-indigo-500'
    },
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

    </div>
  );
}
