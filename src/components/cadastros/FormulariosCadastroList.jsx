import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { createEmptyDefinition } from "@/lib/formularios/formSchema";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function FormulariosCadastroList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');

  const { data: formularios = [], isPending, isError } = useQuery({
    queryKey: ['formularios_digitais'],
    queryFn: () => entities.FormularioDigital.list(),
  });

  const createMut = useMutation({
    mutationFn: () => entities.FormularioDigital.create({
      titulo: 'Formulário sem título',
      descricao: '',
      ativo: false,
      definicao: createEmptyDefinition(),
    }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['formularios_digitais'] });
      navigate(`/configuracoes/cadastros/formularios/${result.id}`);
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao criar formulário.' }),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, ativo }) => entities.FormularioDigital.update(id, { ativo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['formularios_digitais'] }),
    onError: () => toast({ variant: 'destructive', title: 'Erro ao atualizar formulário.' }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => entities.FormularioDigital.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios_digitais'] });
      queryClient.invalidateQueries({ queryKey: ['formularios_digitais', 'ativos'] });
      toast({ variant: 'success', title: 'Formulário excluído.' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao excluir formulário.' }),
  });

  const filtrados = formularios.filter(f =>
    f.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    (f.descricao || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-3">
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar formulário..."
          className="flex-1 max-w-sm border border-border rounded-lg px-3 py-2 text-sm bg-background"
        />
        <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
          <Plus className="w-4 h-4 mr-1" />
          {createMut.isPending ? 'Criando...' : 'Novo Formulário'}
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">Formulário</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">Criado em</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">Atualizado em</th>
              <th className="text-center px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">Ativo</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isPending && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Carregando...</td></tr>
            )}
            {isError && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-status-critical">Erro ao carregar formulários.</td></tr>
            )}
            {!isPending && !isError && filtrados.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Nenhum formulário encontrado.</td></tr>
            )}
            {filtrados.map(f => (
              <tr key={f.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div className="font-semibold">{f.titulo}</div>
                  {f.descricao && (
                    <div className="text-xs text-muted-foreground mt-0.5">{f.descricao}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(f.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(f.updated_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleMut.mutate({ id: f.id, ativo: f.ativo === false })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none ${
                      f.ativo ? 'bg-green-600' : 'bg-border'
                    }`}
                    title={f.ativo ? 'Ativo — clique para desativar' : 'Inativo — clique para ativar'}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      f.ativo ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 justify-end">
                    <button
                      onClick={() => navigate(`/configuracoes/cadastros/formularios/${f.id}?mode=view`)}
                      className="p-2 rounded-lg border border-border hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/configuracoes/cadastros/formularios/${f.id}`)}
                      className="p-2 rounded-lg border border-border hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="p-2 rounded-lg border border-border hover:bg-red-50 hover:border-red-200 text-muted-foreground hover:text-status-critical"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir formulário?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação excluirá permanentemente o formulário &quot;{f.titulo}&quot; e todas as respostas vinculadas. Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMut.mutate(f.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Formulários são globais (compartilhados entre projetos). Apenas os marcados como <strong>Ativo</strong> aparecem no módulo &quot;Formulários Digitais&quot; para preenchimento.
      </p>
    </div>
  );
}
