import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api/supabaseEntities';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Code2, Plus, Wrench } from 'lucide-react';
import RowActions from '@/components/ui/RowActions';
import ToolEditor from './ToolEditor';

export default function ToolsList() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allTools = [], isPending, isError } = useQuery({
    queryKey: ['agente-tools'],
    queryFn: () => entities.AgenteTool.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (form) => {
      const { id, ...data } = form;
      return id
        ? entities.AgenteTool.update(id, { ...data, updated_at: new Date().toISOString() })
        : entities.AgenteTool.create({ ...data, is_system: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agente-tools'] });
      setEditorOpen(false);
      setEditingTool(null);
      toast({ title: 'Tool salva!', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Erro ao salvar tool', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.AgenteTool.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agente-tools'] });
      queryClient.invalidateQueries({ queryKey: ['agente-tool-links'] });
      toast({ title: 'Tool excluída', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' }),
  });

  const handleEdit = (tool) => {
    setEditingTool(tool);
    setEditorOpen(true);
  };

  const handleNew = () => {
    setEditingTool(null);
    setEditorOpen(true);
  };

  if (isPending) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
      </div>
    );
  }

  if (isError) {
    return <p className="text-destructive text-sm text-center py-8">Erro ao carregar tools. Tente recarregar.</p>;
  }

  // Sistema primeiro, depois SQL por nome
  const sorted = [...allTools].sort((a, b) => {
    if (a.is_system === b.is_system) return a.nome.localeCompare(b.nome);
    return a.is_system ? -1 : 1;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Tools disponíveis</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {allTools.filter(t => t.is_system).length} de sistema · {allTools.filter(t => !t.is_system).length} SQL customizadas
          </p>
        </div>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleNew}>
          <Plus size={14} className="mr-1.5" /> Nova tool
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
          <Code2 size={24} className="mx-auto mb-2 opacity-30" />
          <p>Nenhuma tool encontrada.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((tool) => (
            <Card key={tool.id} className={`border-0 shadow-sm ${tool.is_system ? 'bg-muted/30' : ''}`}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  tool.is_system ? 'bg-blue-500/10' : 'bg-muted'
                }`}>
                  {tool.is_system
                    ? <Wrench size={15} className="text-blue-600 dark:text-blue-400" />
                    : <Code2 size={16} className="text-muted-foreground" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-sm font-semibold">{tool.nome}</span>
                    {tool.is_system
                      ? <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-300 border-0">Sistema</Badge>
                      : <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-0">SQL</Badge>
                    }
                    {!tool.ativo && <Badge variant="secondary" className="text-xs">Inativa</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">{tool.descricao}</p>
                  {!tool.is_system && tool.parametros?.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {tool.parametros.map((p, i) => (
                        <Badge key={i} variant="outline" className="text-xs font-mono">
                          ${i + 1}: {p.nome} ({p.tipo})
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <RowActions
                  onEdit={() => handleEdit(tool)}
                  onDelete={tool.is_system ? undefined : () => deleteMutation.mutate(tool.id)}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ToolEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        tool={editingTool}
        onSave={(form) => saveMutation.mutate({ ...form, id: editingTool?.id })}
        saving={saveMutation.isPending}
      />
    </div>
  );
}
