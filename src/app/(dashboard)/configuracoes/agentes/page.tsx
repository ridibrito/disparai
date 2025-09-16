import AgentsManager from '@/components/ai-agents/agents-manager';
import { BackButton } from '@/components/ui/back-button';

export default function AgentesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agentes de IA</h1>
          <p className="text-gray-600">Configure agentes para respostas automáticas</p>
        </div>
        <BackButton />
      </div>
      <AgentsManager />
    </div>
  );
}
