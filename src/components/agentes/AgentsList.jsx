import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { entities } from '@/api/supabaseEntities';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import AgentCard from './AgentCard';
import AgentEditor from './AgentEditor';

export default function AgentsList() {
  const [editingAgent, setEditingAgent] = useState(null); // null = listagem, {} = novo, agent = edição
  const [showEditor, setShowEditor] = useState(false);

  const { data: agentes = [], isPending, isError } = useQuery({
    queryKey: ['agentes'],
    queryFn: () => entities.Agente.list({}, { pageSize: 100 }),
  });

  const { data: systemToolsData = [] } = useQuery({
    queryKey: ['agente-system-tools'],
    queryFn: () => entities.AgenteSystemTool.list(),
  });

  const getToolCount = (agentId) =>
    systemToolsData.filter(st => st.agente_id === agentId).length;

  const getSystemTools = (agentId) =>
    systemToolsData.filter(st => st.agente_id === agentId).map(st => st.tool_id);

  const handleEdit = (agent) => {
    setEditingAgent({ ...agent, _systemTools: getSystemTools(agent.id) });
    setShowEditor(true);
  };

  const handleNew = () => {
    setEditingAgent(null);
    setShowEditor(true);
  };

  const handleSaved = () => {
    setShowEditor(false);
    setEditingAgent(null);
  };

  if (showEditor) {
    return (
      <AgentEditor
        agent={editingAgent}
        systemTools={editingAgent?._systemTools ?? []}
        onCancel={() => setShowEditor(false)}
        onSaved={handleSaved}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Agentes configurados</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Gerencie os agentes de IA do sistema</p>
        </div>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleNew}>
          <Plus size={14} className="mr-1.5" /> Novo agente
        </Button>
      </div>

      {isPending ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-destructive text-sm">
          Erro ao carregar agentes. Tente recarregar a página.
        </div>
      ) : agentes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Nenhum agente cadastrado. Clique em "Novo agente" para começar.
        </div>
      ) : (
        <div className="space-y-3">
          {agentes.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              toolCount={getToolCount(agent.id)}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
