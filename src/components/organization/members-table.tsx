'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

type MemberRow = {
  user_id: string;
  role: string;
  users: { id: string; full_name: string | null; avatar_url: string | null } | null;
  is_active?: boolean;
};

type MembersTableProps = {
  initialMembers: MemberRow[];
  organizationId: string;
  userLimit: number;
  currentUsersCount: number;
};

export function MembersTable({ initialMembers, organizationId, userLimit, currentUsersCount }: MembersTableProps) {
  const supabase = createClientComponentClient();
  const [members, setMembers] = useState<MemberRow[]>(initialMembers);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'agent' | 'viewer'>('agent');
  const [loading, setLoading] = useState(false);

  // Fechar menus quando clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      const menus = document.querySelectorAll('[id^="menu-"]');
      menus.forEach(menu => {
        if (menu instanceof HTMLElement) {
          menu.classList.add('hidden');
        }
      });
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Função para atualizar a lista de membros
  const refreshMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          user_id, 
          role, 
          is_active,
          users!inner (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('organization_id', organizationId);
      
      if (error) throw error;
      if (data) setMembers(data as any);
    } catch (err) {
      console.error('Erro ao atualizar lista:', err);
    }
  };

  const invite = async () => {
    if (!email) return;
    
    // Verificar se ainda há espaço para novos usuários
    if (currentUsersCount >= userLimit) {
      toast.error(`Limite de usuários atingido! Seu plano permite apenas ${userLimit} usuário${userLimit > 1 ? 's' : ''}. Para adicionar mais usuários, faça upgrade do seu plano ou entre em contato para cobrança extra.`);
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/organizations/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, organizationId, redirectTo: window.location.origin + '/login' }),
      });
      const payload = await res.json();
      
      if (!res.ok) {
        if (payload.error === 'Usuário já é membro desta organização') {
          toast.error('Este usuário já é membro da organização');
        } else {
          throw new Error(payload.error || 'Erro no convite');
        }
        return;
      }
      
      // Sucesso
      setName('');
      setEmail('');
      
      if (payload.isNewUser) {
        toast.success('Convite enviado e usuário adicionado à organização!');
      } else {
        toast.success('Usuário existente adicionado à organização!');
      }
      
      // Atualizar lista de membros automaticamente
      await refreshMembers();
      
    } catch (err) {
      console.error(err);
      toast.error('Erro ao convidar usuário');
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('organization_id', organizationId)
        .eq('user_id', userId);
      if (error) throw error;
      setMembers((m) => m.map((r) => (r.user_id === userId ? { ...r, role: newRole } : r)));
      toast.success('Papel atualizado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar papel');
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from('organization_members')
        .update({ is_active: newStatus })
        .eq('organization_id', organizationId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      setMembers((m) => m.map((r) => 
        r.user_id === userId ? { ...r, is_active: newStatus } : r
      ));
      
      toast.success(`Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao alterar status do usuário');
    }
  };

  const removeMember = async (userId: string) => {
    // Verificar se o usuário realmente quer remover
    if (!window.confirm('Tem certeza que deseja remover este membro? Esta ação não pode ser desfeita.')) return;
    
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', organizationId)
        .eq('user_id', userId);
      if (error) throw error;
      setMembers((m) => m.filter((r) => r.user_id !== userId));
      toast.success('Membro removido com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover membro');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2 md:items-end">
        <div className="flex-1">
          <label className="block text-sm text-gray-700 mb-1">Nome</label>
          <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do usuário" />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-700 mb-1">Email</label>
          <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@empresa.com" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Papel</label>
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white" value={role} onChange={(e) => setRole(e.target.value as any)}>
            <option value="admin">Administrador</option>
            <option value="agent">Agente</option>
            <option value="viewer">Leitor</option>
          </select>
        </div>
        <Button type="button" onClick={invite} disabled={loading} className="text-white" style={{ backgroundColor: '#4bca59' }}>
          {loading ? 'Enviando...' : 'Convidar'}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Usuário</th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Status</th>
              <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Papel</th>
              <th className="text-right py-4 px-6 font-semibold text-gray-700 text-sm">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((m) => (
              <tr key={m.user_id} className={`hover:bg-gray-50 transition-colors ${m.is_active === false ? 'opacity-60 bg-gray-50' : ''}`}>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                      {m.users?.avatar_url ? (
                        <Image src={m.users.avatar_url} alt="" width={40} height={40} className="w-10 h-10 object-cover" />
                      ) : (
                        <span>{m.users?.full_name?.charAt(0)?.toUpperCase() || 'U'}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {m.users?.full_name || 'Nome não informado'}
                      </div>
                      <div className="text-xs text-gray-500">ID: {m.user_id.slice(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    m.is_active === false 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {m.is_active === false ? '❌ Desativado' : '✅ Ativo'}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <select 
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors" 
                    value={m.role} 
                    onChange={(e) => updateRole(m.user_id, e.target.value)}
                  >
                    <option value="owner">👑 Owner</option>
                    <option value="admin">⚡ Admin</option>
                    <option value="agent">👤 Agente</option>
                    <option value="viewer">👁️ Leitor</option>
                  </select>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="relative inline-block text-left">
                    <div className="relative">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          const menu = document.getElementById(`menu-${m.user_id}`);
                          if (menu) {
                            menu.classList.toggle('hidden');
                          }
                        }}
                      >
                        <span className="sr-only">Abrir opções</span>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>

                    <div
                      id={`menu-${m.user_id}`}
                      className="hidden origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
                    >
                      <div className="py-1" role="menu">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleUserStatus(m.user_id, m.is_active !== false);
                            // Fechar menu após ação
                            const menu = document.getElementById(`menu-${m.user_id}`);
                            if (menu) menu.classList.add('hidden');
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          role="menuitem"
                        >
                          {m.is_active === false ? '✅ Ativar Usuário' : '⏸️ Desativar Usuário'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMember(m.user_id);
                            // Fechar menu após ação
                            const menu = document.getElementById(`menu-${m.user_id}`);
                            if (menu) menu.classList.add('hidden');
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100 hover:text-red-900"
                          role="menuitem"
                        >
                          🗑️ Remover Usuário
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {members.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum membro encontrado</h3>
            <p className="text-gray-500">Comece adicionando o primeiro membro da sua organização.</p>
          </div>
        )}
      </div>
    </div>
  );
}


