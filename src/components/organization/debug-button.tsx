'use client';

export function DebugButton() {
  const handleDebug = async () => {
    try {
      const response = await fetch('/api/debug/organization-structure');
      const result = await response.json();
      console.log('🔍 Debug API Result:', result);

      // Mostrar detalhes específicos
      if (result.success && result.debug) {
        console.log('📊 Detalhes do Debug:');
        console.log('👤 User ID:', result.debug.userId);
        console.log('👥 Members encontrados:', result.debug.members);
        console.log('👤 User data:', result.debug.users);
        console.log('🔗 Relacionamento:', result.debug.membersWithUsers);
        console.log('❌ Erros:', result.debug.errors);

        // Verificar se há membros
        if (result.debug.members && result.debug.members.length > 0) {
          console.log('✅ Encontrados membros:', result.debug.members.length);
        } else {
          console.log('❌ Nenhum membro encontrado na tabela organization_members');
        }

        // Verificar se há usuários
        if (result.debug.users && result.debug.users.length > 0) {
          console.log('✅ Encontrados usuários:', result.debug.users.length);
        } else {
          console.log('❌ Nenhum usuário encontrado na tabela users');
        }
      }

      alert('Verifique o console para detalhes da estrutura');
    } catch (error) {
      console.error('Erro no debug:', error);
      alert('Erro ao executar debug');
    }
  };

  const handleAddIsActiveColumn = async () => {
    try {
      const response = await fetch('/api/debug/add-is-active-column', {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        alert('✅ Coluna is_active adicionada com sucesso! Recarregue a página.');
        window.location.reload();
      } else {
        alert('❌ Erro ao adicionar coluna: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao adicionar coluna:', error);
      alert('Erro ao executar migração');
    }
  };

  const handleCreateOrganizations = async () => {
    try {
      const response = await fetch('/api/debug/create-organizations-table', {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Estrutura de organizações criada com sucesso!\n\nOrganization ID: ${result.organizationId}\n\nRecarregue a página.`);
        window.location.reload();
      } else {
        alert('❌ Erro ao criar organizações: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao criar organizações:', error);
      alert('Erro ao executar migração');
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleDebug}
        className="inline-flex items-center px-3 py-1.5 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-md transition-colors border border-transparent hover:border-orange-200"
      >
        🐛 Debug
      </button>
      
      <button
        onClick={handleAddIsActiveColumn}
        className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors border border-transparent hover:border-blue-200"
      >
        🔧 Add is_active
      </button>

      <button
        onClick={handleCreateOrganizations}
        className="inline-flex items-center px-3 py-1.5 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors border border-transparent hover:border-green-200"
      >
        🏢 Criar Organizações
      </button>
    </div>
  );
}
