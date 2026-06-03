import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Icons from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { entities } from '@/api/supabaseEntities';
import RowActions from '@/components/ui/RowActions';

export default function AgentCard({ agent, toolCount = 0, onEdit }) {
  const IconComp = Icons[agent.icone] ?? Icons.Bot;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const toggleMutation = useMutation({
    mutationFn: () =>
      entities.Agente.update(agent.id, {
        ativo: !agent.ativo,
        updated_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentes'] });
      toast({
        title: agent.ativo ? 'Agente desativado' : 'Agente ativado',
        variant: 'success',
      });
    },
    onError: (err) =>
      toast({ title: 'Erro ao alterar status', description: err.message, variant: 'destructive' }),
  });

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: agent.cor + '20' }}
        >
          <IconComp size={20} style={{ color: agent.cor }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-sm text-foreground">{agent.nome}</span>
            {!agent.ativo && (
              <Badge variant="secondary" className="text-xs">Inativo</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{agent.descricao}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs font-mono">
              {agent.provider}/{agent.modelo}
            </Badge>
            {toolCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {toolCount} tool{toolCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Switch
            checked={!!agent.ativo}
            onCheckedChange={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending}
            title={agent.ativo ? 'Desativar agente' : 'Ativar agente'}
          />
          <RowActions onEdit={() => onEdit(agent)} />
        </div>
      </CardContent>
    </Card>
  );
}
