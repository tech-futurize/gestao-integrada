import { Settings } from "lucide-react";
import { FormDialog } from "@/components/ui/FormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjetoPqpMestra from "@/components/projeto/ProjetoPqpMestra";

const STATUS_OPTIONS = ["Planejamento", "Em Andamento", "Pausado", "Concluído", "Cancelado"];
const REGIME_OPTIONS = ["EPC", "EPCM", "Turnkey", "Outro"];
const TRIBUTARIO_OPTIONS = ["Lucro Real", "Lucro Presumido", "Simples Nacional"];
const MOEDA_OPTIONS = ["BRL", "USD", "EUR"];

export default function ProjetoForm({
  form,
  onChange,
  projetos = [],
  editing,
  onSave,
  onClose,
  saving,
  onDelete,
}) {
  const set = (k, v) => onChange((f) => ({ ...f, [k]: v }));

  return (
    <FormDialog
      open={true}
      onOpenChange={(open) => { if (!open) onClose(); }}
      icon={Settings}
      title={editing ? "Editar Projeto" : "Novo Projeto"}
      subtitle={editing ? editing.nome : "Configurar novo projeto"}
      maxWidth="max-w-4xl"
      onClose={onClose}
      onSave={onSave}
      saving={saving}
      saveLabel={editing ? "Salvar" : "Criar Projeto"}
      footer={
        <>
          {editing && (
            <Button variant="destructive" onClick={onDelete}>
              Excluir
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="save" onClick={onSave} disabled={saving}>
            {editing ? "Salvar" : "Criar Projeto"}
          </Button>
        </>
      }
    >
      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="mb-4 flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="comercial">Comercial</TabsTrigger>
          <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
          <TabsTrigger value="local">Local & Prazos</TabsTrigger>
          <TabsTrigger value="equipe">Equipe & Vínculos</TabsTrigger>
          <TabsTrigger value="pqp">PQ-mestra</TabsTrigger>
        </TabsList>

        {/* ABA GERAL */}
        <TabsContent value="geral">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2">
              <Label>Nome do Projeto *</Label>
              <Input
                value={form.nome}
                onChange={(e) => set("nome", e.target.value)}
                placeholder="Ex: Planta Industrial XYZ"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Descrição</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => set("descricao", e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <Label>Cliente *</Label>
              <Input
                value={form.cliente}
                onChange={(e) => set("cliente", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Responsável Geral</Label>
              <Input
                value={form.responsavel}
                onChange={(e) => set("responsavel", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Data de Início</Label>
              <Input
                type="date"
                value={form.data_inicio}
                onChange={(e) => set("data_inicio", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Data Fim Prevista</Label>
              <Input
                type="date"
                value={form.data_fim_prevista}
                onChange={(e) => set("data_fim_prevista", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Nº do Contrato</Label>
              <Input
                value={form.contrato_numero}
                onChange={(e) => set("contrato_numero", e.target.value)}
                placeholder="CT-2026-001"
              />
            </div>
            <div className="space-y-1">
              <Label>Valor do Contrato (R$)</Label>
              <Input
                type="number"
                value={form.valor_contrato}
                onChange={(e) => set("valor_contrato", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        {/* ABA COMERCIAL */}
        <TabsContent value="comercial">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>CNPJ do Cliente</Label>
              <Input
                value={form.cliente_cnpj}
                onChange={(e) => set("cliente_cnpj", e.target.value)}
                placeholder="00.000.000/0001-00"
              />
            </div>
            <div className="space-y-1">
              <Label>Contato do Cliente</Label>
              <Input
                value={form.cliente_contato}
                onChange={(e) => set("cliente_contato", e.target.value)}
                placeholder="Nome / e-mail / telefone"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Objeto do Contrato</Label>
              <Textarea
                value={form.contrato_objeto}
                onChange={(e) => set("contrato_objeto", e.target.value)}
                rows={2}
                placeholder="Descrição do escopo contratado"
              />
            </div>
            <div className="space-y-1">
              <Label>Moeda</Label>
              <Select value={form.moeda || "BRL"} onValueChange={(v) => set("moeda", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MOEDA_OPTIONS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Regime de Execução</Label>
              <Select value={form.regime_execucao || ""} onValueChange={(v) => set("regime_execucao", v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  {REGIME_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Data-base do Orçamento</Label>
              <Input
                type="date"
                value={form.data_base_orcamento}
                onChange={(e) => set("data_base_orcamento", e.target.value)}
              />
            </div>
          </div>
        </TabsContent>

        {/* ABA ORÇAMENTO */}
        <TabsContent value="orcamento">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>BDI (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.bdi_percentual}
                onChange={(e) => set("bdi_percentual", e.target.value)}
                placeholder="Ex: 25.50"
              />
            </div>
            <div className="space-y-1">
              <Label>Encargos Sociais (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.encargos_sociais_percentual}
                onChange={(e) => set("encargos_sociais_percentual", e.target.value)}
                placeholder="Ex: 68.00"
              />
            </div>
            <div className="space-y-1">
              <Label>Regime Tributário</Label>
              <Select value={form.regime_tributario || ""} onValueChange={(v) => set("regime_tributario", v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  {TRIBUTARIO_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Retenção Contratual (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.retencao_percentual}
                onChange={(e) => set("retencao_percentual", e.target.value)}
                placeholder="Ex: 5.00"
              />
            </div>
          </div>
        </TabsContent>

        {/* ABA LOCAL & PRAZOS */}
        <TabsContent value="local">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Cidade</Label>
              <Input
                value={form.local_cidade}
                onChange={(e) => set("local_cidade", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>UF</Label>
              <Input
                value={form.local_uf}
                onChange={(e) => set("local_uf", e.target.value.toUpperCase().slice(0, 2))}
                placeholder="SP"
                maxLength={2}
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Endereço da Obra</Label>
              <Input
                value={form.local_endereco}
                onChange={(e) => set("local_endereco", e.target.value)}
                placeholder="Rodovia / Município / CEP"
              />
            </div>
            <div className="space-y-1">
              <Label>Prazo Contratual (dias)</Label>
              <Input
                type="number"
                value={form.prazo_contratual_dias}
                onChange={(e) => set("prazo_contratual_dias", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Data de Início Efetivo</Label>
              <Input
                type="date"
                value={form.data_inicio_efetivo}
                onChange={(e) => set("data_inicio_efetivo", e.target.value)}
              />
            </div>
          </div>
        </TabsContent>

        {/* ABA EQUIPE & VÍNCULOS */}
        <TabsContent value="equipe">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Gestor do Contrato</Label>
              <Input
                value={form.gestor_contrato}
                onChange={(e) => set("gestor_contrato", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Projeto-pai (lote)</Label>
              <Select
                value={form.projeto_pai_id || "none"}
                onValueChange={(v) => set("projeto_pai_id", v === "none" ? "" : v)}
              >
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {projetos
                    .filter((p) => p.id !== editing?.id)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        {/* ABA PQ-MESTRA */}
        <TabsContent value="pqp">
          <p className="text-xs text-muted-foreground mb-3">
            Planilha de Quantidades e Preços do projeto (receita). Usada como base para o primeiro faturamento.
          </p>
          <ProjetoPqpMestra
            itens={form.pqp_mestra || []}
            onChange={(itens) => set("pqp_mestra", itens)}
          />
        </TabsContent>
      </Tabs>
    </FormDialog>
  );
}
