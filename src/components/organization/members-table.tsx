'use client';

import { useState } from 'react';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';

type MemberRow = {
  user_id: string;
  role: string;
  users: { id: string; full_name: string | null; avatar_url: string | null } | null;
};

type MembersTableProps = {
  initialMembers: MemberRow[];
  organizationId: string;
};

export function MembersTable({ initialMembers, organizationId }: MembersTableProps) {
  const supabase = createClientComponentClient();
  const [members, setMembers] = useState<MemberRow[]>(initialMembers);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'agent' | 'viewer'>('agent');
  const [loading, setLoading] = useState(false);

  const invite = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch('/api/organizations/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, organizationId, redirectTo: window.location.origin + '/login' }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Erro no convite');
      setName('');
      setEmail('');
      // Opcional: atualizar lista
      const { data } = await supabase
        .from('organization_members')
        .select('user_id, role, users ( full_name, avatar_url, id )')
        .eq('organization_id', organizationId);
      if (data) setMembers(data as any);
    } catch (err) {
      console.error(err);
      alert('Erro ao convidar usuário');
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
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar papel');
    }
  };

  const removeMember = async (userId: string) => {
    if (!confirm('Remover este membro?')) return;
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', organizationId)
        .eq('user_id', userId);
      if (error) throw error;
      setMembers((m) => m.filter((r) => r.user_id !== userId));
    } catch (err) {
      console.error(err);
      alert('Erro ao remover membro');
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
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Usuário</th>
              <th className="text-left py-3 px-4">Papel</th>
              <th className="text-right py-3 px-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.user_id} className="border-b">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                      {m.users?.avatar_url && (
                        <Image src={m.users.avatar_url} alt="" width={32} height={32} className="w-8 h-8 object-cover" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{m.users?.full_name || m.users?.id}</div>
                      <div className="text-xs text-gray-500">{m.user_id}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <select className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white" value={m.role} onChange={(e) => updateRole(m.user_id, e.target.value)}>
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="agent">Agent</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </td>
                <td className="py-3 px-4 text-right">
                  <Button variant="outline" onClick={() => removeMember(m.user_id)}>Remover</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


