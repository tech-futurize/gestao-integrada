import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api/supabaseEntities';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Code2, Plus } from 'lucide-react';
import RowActions from '@/components/ui/RowActions';
import ToolEditor from './ToolEditor';

export default function ToolsList() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tools = [], isPending } = useQuery({
    queryKey: ['agente-tools'],
    queryFn: () => entities.AgenteTool.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (form) => {
      const { id, ...data } = form;
      return id
        ? entities.AgenteTool.update(id, { ...data, updated_at: new Date().toISOString() })
        : entities.AgenteTool.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agente-tools'] });
      setEditorOpen(false);
      setEditingTool(null);
      toast({ title: 'Tool salva!', variant: 'success' });
    },
    onError: err => toast({ title: 'Erro ao salvar tool', description: err.message, variant: 'destructive' }),
  });

  const handleEdit = (tool) => {
    setEditingTool(tool);
    setEditorOpen(true);
  };

  const handleNew = () => {
    setEditingTool(null);
    setEditorOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Tools SQL Customizadas</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Ferramentas SQL reutilizáveis pelos agentes</p>
        </div>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleNew}>
          <Plus size={14} className="mr-1.5" /> Nova tool
        </Button>
      </div>

      {isPending ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : tools.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Nenhuma tool customizada criada. Clique em "Nova tool" para começar.
        </div>
      ) : (
        <div className="space-y-3">
          {tools.map(tool => (
            <Card key={tool.id} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Code2 size={16} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-semibold">{tool.nome}</span>
                    {!tool.ativo && <Badge variant="secondary" className="text-xs">Inativa</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">{tool.descricao}</p>
                  {tool.parametros?.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {tool.parametros.map((p, i) => (
                        <Badge key={i} variant="outline" className="text-xs font-mono">
                          ${i + 1}: {p.nome} ({p.tipo})
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <RowActions onEdit={() => handleEdit(tool)} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ToolEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        tool={editingTool}
        onSave={form => saveMutation.mutate({ ...form, id: editingTool?.id })}
        saving={saveMutation.isPending}
      />
    </div>
  );
}
