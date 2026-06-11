import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { entities } from '@/api/supabaseEntities';
import * as Icons from 'lucide-react';
import AgenteChat from '@/components/agentes/AgenteChat';
import PageHeader from '@/components/ui/PageHeader';

export default function AgenteViewer() {
  const { slug } = useParams();

  const { data: agentes = [], isPending, isError } = useQuery({
    queryKey: ['agentes'],
    queryFn: () => entities.Agente.list({}, { pageSize: 100 }),
  });

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <p className="text-sm text-destructive">Erro ao carregar o agente. Recarregue a página.</p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <div className="w-7 h-7 border-4 border-border border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  const agente = agentes.find(a => a.slug === slug);

  if (!agente) return <Navigate to="/dashboard" replace />;
  if (!agente.ativo) return <Navigate to="/dashboard" replace />;

  const IconComp = Icons[agente.icone] ?? Icons.Bot;

  const agentConfig = {
    id: agente.slug,
    name: agente.nome,
    icon: IconComp,
    iconColor: 'text-foreground',
    iconBg: 'bg-muted',
    description: agente.descricao || '',
    suggestions: agente.sugestoes || [],
    modelo: agente.modelo,
    provider: agente.provider,
    cor: agente.cor,
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader />
      <div className="flex-1 overflow-hidden">
        <AgenteChat agent={agentConfig} />
      </div>
    </div>
  );
}
