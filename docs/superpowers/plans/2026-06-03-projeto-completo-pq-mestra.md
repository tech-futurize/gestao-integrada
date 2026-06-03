# Cadastro de Projeto Completo + PQ-mestra Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enriquecer o cadastro de projeto com 4 blocos de dados EPC (comercial, orçamento, localização, equipe) e uma PQ-mestra por projeto que semeia o primeiro faturamento.

**Architecture:** A tabela `projetos` recebe 18 novas colunas nullable (incluindo `pqp_mestra` jsonb). O formulário `GerenciarProjeto` extrai o `FormDialog` para um `ProjetoForm` organizado em abas. A `pqp_mestra` é editada via o `PqpEditor` já existente (mode="definicao") e, no primeiro faturamento de um projeto, `FaturamentoForm` semeia os `itens` a partir da `pqp_mestra` do projeto ativo.

**Tech Stack:** React 18 JSX, Supabase MCP (apply_migration), TanStack React Query 5, PqpEditor + pqpUtils já existentes, shadcn/ui Tabs.

---

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `docs/database/supabase-migration-m19-projeto-completo.sql` | Criar | SQL espelho da migration |
| `docs/architecture/DATABASE.md` | Modificar | Documentar novas colunas de `projetos` |
| `src/components/projeto/ProjetoPqpMestra.jsx` | Criar | Wrapper PqpEditor para PQ-mestra do projeto |
| `src/components/projeto/ProjetoForm.jsx` | Criar | FormDialog em abas extraído de GerenciarProjeto |
| `src/pages/Configuracoes/GerenciarProjeto.jsx` | Modificar | Usa ProjetoForm; EMPTY_FORM/handleEdit/payload expandidos |
| `src/components/planejamento/FaturamentoForm.jsx` | Modificar | Recebe `pqpMestra` prop; usa para semear 1º faturamento |
| `src/pages/Planejamento/Faturamento.jsx` | Modificar | Busca projeto ativo; passa `pqp_mestra` ao FaturamentoForm |

---

## Task 1: Migration do banco de dados

**Files:**
- Create: `docs/database/supabase-migration-m19-projeto-completo.sql`

- [ ] **Step 1: Aplicar migration via Supabase MCP**

Usar a ferramenta `mcp__supabase-integrada__apply_migration` com o seguinte SQL:

```sql
-- Migration m19: Cadastro de projeto completo (dados principais EPC + PQ-mestra)
ALTER TABLE projetos
  ADD COLUMN IF NOT EXISTS cliente_cnpj            TEXT,
  ADD COLUMN IF NOT EXISTS cliente_contato         TEXT,
  ADD COLUMN IF NOT EXISTS contrato_objeto         TEXT,
  ADD COLUMN IF NOT EXISTS moeda                   TEXT DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS regime_execucao         TEXT,
  ADD COLUMN IF NOT EXISTS data_base_orcamento     DATE,
  ADD COLUMN IF NOT EXISTS bdi_percentual          NUMERIC,
  ADD COLUMN IF NOT EXISTS encargos_sociais_percentual NUMERIC,
  ADD COLUMN IF NOT EXISTS regime_tributario       TEXT,
  ADD COLUMN IF NOT EXISTS retencao_percentual     NUMERIC,
  ADD COLUMN IF NOT EXISTS local_cidade            TEXT,
  ADD COLUMN IF NOT EXISTS local_uf                TEXT,
  ADD COLUMN IF NOT EXISTS local_endereco          TEXT,
  ADD COLUMN IF NOT EXISTS prazo_contratual_dias   INTEGER,
  ADD COLUMN IF NOT EXISTS data_inicio_efetivo     DATE,
  ADD COLUMN IF NOT EXISTS gestor_contrato         TEXT,
  ADD COLUMN IF NOT EXISTS projeto_pai_id          UUID REFERENCES projetos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pqp_mestra              JSONB DEFAULT '[]'::jsonb;
```

- [ ] **Step 2: Verificar colunas criadas**

Usar `mcp__supabase-integrada__execute_sql`:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'projetos'
  AND column_name IN (
    'cliente_cnpj','moeda','bdi_percentual','encargos_sociais_percentual',
    'pqp_mestra','projeto_pai_id','local_cidade','gestor_contrato'
  )
ORDER BY column_name;
```
Esperado: 8 linhas, cada uma com a coluna e o tipo correto.

- [ ] **Step 3: Criar arquivo espelho SQL**

Criar `docs/database/supabase-migration-m19-projeto-completo.sql` com o conteúdo do Step 1.

- [ ] **Step 4: Commit**

```bash
git add docs/database/supabase-migration-m19-projeto-completo.sql
git commit -m "feat(db): migration m19 — cadastro completo de projeto + pqp_mestra"
```

---

## Task 2: Atualizar DATABASE.md

**Files:**
- Modify: `docs/architecture/DATABASE.md`

- [ ] **Step 1: Adicionar seção de novas colunas**

Localizar a seção que descreve a tabela `projetos` em `docs/architecture/DATABASE.md` e adicionar/atualizar para incluir as novas colunas. Adicionar após o bloco existente de projetos:

```markdown
### Tabela `projetos` — colunas adicionadas (m19)

| Coluna | Tipo | Bloco | Observação |
|---|---|---|---|
| `cliente_cnpj` | text | Comercial | |
| `cliente_contato` | text | Comercial | |
| `contrato_objeto` | text | Comercial | Objeto/escopo do contrato |
| `moeda` | text | Comercial | Default 'BRL' |
| `regime_execucao` | text | Comercial | EPC / EPCM / Turnkey / Outro |
| `data_base_orcamento` | date | Comercial | |
| `bdi_percentual` | numeric | Orçamento | BDI em % (ex: 25.50) |
| `encargos_sociais_percentual` | numeric | Orçamento | Encargos sociais em % |
| `regime_tributario` | text | Orçamento | Lucro Real / Presumido / Simples |
| `retencao_percentual` | numeric | Orçamento | Retenção contratual em % |
| `local_cidade` | text | Local/Prazo | |
| `local_uf` | text | Local/Prazo | Sigla UF (2 chars) |
| `local_endereco` | text | Local/Prazo | |
| `prazo_contratual_dias` | integer | Local/Prazo | |
| `data_inicio_efetivo` | date | Local/Prazo | Data de início efetivo (pode diferir de data_inicio) |
| `gestor_contrato` | text | Equipe | |
| `projeto_pai_id` | uuid | Vínculos | FK → projetos(id) ON DELETE SET NULL; para lotes |
| `pqp_mestra` | jsonb | PQ-mestra | Default '[]'; árvore EAP — mesma estrutura de contratos.itens |
```

- [ ] **Step 2: Commit**

```bash
git add docs/architecture/DATABASE.md
git commit -m "docs(db): documentar novas colunas de projetos (m19)"
```

---

## Task 3: ProjetoPqpMestra component

**Files:**
- Create: `src/components/projeto/ProjetoPqpMestra.jsx`

`PqpEditor` em `mode="definicao"` já inclui internamente o botão Import/Export (ImportExportDialog). Este componente é um wrapper fino para uso na aba PQ-mestra do `ProjetoForm`.

- [ ] **Step 1: Criar o componente**

```jsx
import PqpEditor from "@/components/planejamento/PqpEditor";

export default function ProjetoPqpMestra({ itens = [], onChange, readOnly = false }) {
  return (
    <PqpEditor
      mode="definicao"
      itens={itens}
      onChange={onChange}
      readOnly={readOnly}
    />
  );
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```
Esperado: zero erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/projeto/ProjetoPqpMestra.jsx
git commit -m "feat(projeto): ProjetoPqpMestra — wrapper PqpEditor para PQ-mestra do projeto"
```

---

## Task 4: ProjetoForm — FormDialog em abas

**Files:**
- Create: `src/components/projeto/ProjetoForm.jsx`

Este componente recebe `form`, `onChange`, `projetos` (lista completa para o select de projeto-pai), `editing`, `onSave`, `onClose`, `saving` e renderiza o `FormDialog` com 6 abas. Os campos obrigatórios (nome, cliente) ficam na aba Geral.

- [ ] **Step 1: Criar ProjetoForm.jsx**

```jsx
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
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```
Esperado: zero erros. Se faltar o componente `Tabs` em `@/components/ui/tabs`, instalar via:
```bash
npx shadcn-ui@latest add tabs
```
e re-rodar o build.

- [ ] **Step 3: Commit**

```bash
git add src/components/projeto/ProjetoForm.jsx
git commit -m "feat(projeto): ProjetoForm — FormDialog em abas com 4 blocos de dados EPC"
```

---

## Task 5: Refatorar GerenciarProjeto para usar ProjetoForm

**Files:**
- Modify: `src/pages/Configuracoes/GerenciarProjeto.jsx`

- [ ] **Step 1: Expandir EMPTY_FORM e imports**

Substituir o bloco de imports e `EMPTY_FORM` atual (linhas 1-33) por:

```jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Plus, CheckCircle, Clock, PauseCircle, XCircle } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import RowActions from "@/components/ui/RowActions";
import DetailDialog from "@/components/ui/DetailDialog";
import PageHeader from "@/components/ui/PageHeader";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useProject } from "@/lib/ProjectContext";
import ProjetoForm from "@/components/projeto/ProjetoForm";

const STATUS_OPTIONS = ["Planejamento", "Em Andamento", "Pausado", "Concluído", "Cancelado"];

const STATUS_CFG = {
  Planejamento: { icon: Clock, color: "#3b82f6", bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  "Em Andamento": { icon: CheckCircle, color: "#16a34a", bg: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  Pausado: { icon: PauseCircle, color: "#d97706", bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  Concluído: { icon: CheckCircle, color: "#6b7280", bg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  Cancelado: { icon: XCircle, color: "#ef4444", bg: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

const EMPTY_FORM = {
  // Geral
  nome: "", descricao: "", status: "Planejamento",
  data_inicio: "", data_fim_prevista: "",
  cliente: "", responsavel: "", contrato_numero: "", valor_contrato: "",
  // Comercial
  cliente_cnpj: "", cliente_contato: "", contrato_objeto: "",
  moeda: "BRL", regime_execucao: "", data_base_orcamento: "",
  // Orçamento
  bdi_percentual: "", encargos_sociais_percentual: "",
  regime_tributario: "", retencao_percentual: "",
  // Local/Prazo
  local_cidade: "", local_uf: "", local_endereco: "",
  prazo_contratual_dias: "", data_inicio_efetivo: "",
  // Equipe/Vínculo
  gestor_contrato: "", projeto_pai_id: "",
  // PQ-mestra
  pqp_mestra: [],
};

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
```

- [ ] **Step 2: Expandir handleEdit (substituir linhas 77-91)**

```jsx
const handleEdit = (projeto) => {
  setEditing(projeto);
  setForm({
    // Geral
    nome: projeto.nome || "",
    descricao: projeto.descricao || "",
    status: projeto.status || "Planejamento",
    data_inicio: projeto.data_inicio || "",
    data_fim_prevista: projeto.data_prevista_termino || "",
    cliente: projeto.cliente || "",
    responsavel: projeto.responsavel_geral || "",
    contrato_numero: projeto.contrato_numero || "",
    valor_contrato: projeto.valor_contrato ?? "",
    // Comercial
    cliente_cnpj: projeto.cliente_cnpj || "",
    cliente_contato: projeto.cliente_contato || "",
    contrato_objeto: projeto.contrato_objeto || "",
    moeda: projeto.moeda || "BRL",
    regime_execucao: projeto.regime_execucao || "",
    data_base_orcamento: projeto.data_base_orcamento || "",
    // Orçamento
    bdi_percentual: projeto.bdi_percentual ?? "",
    encargos_sociais_percentual: projeto.encargos_sociais_percentual ?? "",
    regime_tributario: projeto.regime_tributario || "",
    retencao_percentual: projeto.retencao_percentual ?? "",
    // Local/Prazo
    local_cidade: projeto.local_cidade || "",
    local_uf: projeto.local_uf || "",
    local_endereco: projeto.local_endereco || "",
    prazo_contratual_dias: projeto.prazo_contratual_dias ?? "",
    data_inicio_efetivo: projeto.data_inicio_efetivo || "",
    // Equipe/Vínculo
    gestor_contrato: projeto.gestor_contrato || "",
    projeto_pai_id: projeto.projeto_pai_id || "",
    // PQ-mestra
    pqp_mestra: projeto.pqp_mestra || [],
  });
  setShowForm(true);
};
```

- [ ] **Step 3: Expandir payload em handleSubmit (substituir linhas 102-112)**

```jsx
const payload = {
  // Geral
  nome: form.nome.trim(),
  descricao: form.descricao,
  status: form.status,
  data_inicio: form.data_inicio || null,
  data_prevista_termino: form.data_fim_prevista || null,
  cliente: form.cliente.trim(),
  responsavel_geral: form.responsavel,
  contrato_numero: form.contrato_numero,
  valor_contrato: parseFloat(form.valor_contrato) || 0,
  // Comercial
  cliente_cnpj: form.cliente_cnpj || null,
  cliente_contato: form.cliente_contato || null,
  contrato_objeto: form.contrato_objeto || null,
  moeda: form.moeda || "BRL",
  regime_execucao: form.regime_execucao || null,
  data_base_orcamento: form.data_base_orcamento || null,
  // Orçamento
  bdi_percentual: form.bdi_percentual !== "" ? parseFloat(form.bdi_percentual) : null,
  encargos_sociais_percentual: form.encargos_sociais_percentual !== "" ? parseFloat(form.encargos_sociais_percentual) : null,
  regime_tributario: form.regime_tributario || null,
  retencao_percentual: form.retencao_percentual !== "" ? parseFloat(form.retencao_percentual) : null,
  // Local/Prazo
  local_cidade: form.local_cidade || null,
  local_uf: form.local_uf || null,
  local_endereco: form.local_endereco || null,
  prazo_contratual_dias: form.prazo_contratual_dias !== "" ? parseInt(form.prazo_contratual_dias) : null,
  data_inicio_efetivo: form.data_inicio_efetivo || null,
  // Equipe/Vínculo
  gestor_contrato: form.gestor_contrato || null,
  projeto_pai_id: form.projeto_pai_id || null,
  // PQ-mestra
  pqp_mestra: form.pqp_mestra || [],
};
```

- [ ] **Step 4: Substituir o bloco FormDialog (linhas 186-248) por ProjetoForm**

Remover o bloco `<FormDialog ...>...</FormDialog>` das linhas 186-248 do JSX e substituir por:

```jsx
{showForm && (
  <ProjetoForm
    form={form}
    onChange={setForm}
    projetos={projetos}
    editing={editing}
    onSave={handleSubmit}
    onClose={() => { setShowForm(false); setEditing(null); }}
    saving={createMut.isPending || updateMut.isPending}
    onDelete={() => { deleteMut.mutate(editing.id); setShowForm(false); setEditing(null); }}
  />
)}
```

- [ ] **Step 5: Atualizar os cards para exibir novos campos (substituir o grid de info do card)**

No bloco dos cards (linhas 161-166), atualizar o grid de informações para incluir dados novos relevantes:

```jsx
<div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
  {p.data_inicio && <div><span className="font-medium">Início:</span> {formatDate(p.data_inicio)}</div>}
  {p.data_prevista_termino && <div><span className="font-medium">Fim Prev.:</span> {formatDate(p.data_prevista_termino)}</div>}
  {p.responsavel_geral && <div className="col-span-2"><span className="font-medium">Resp.:</span> {p.responsavel_geral}</div>}
  {p.valor_contrato > 0 && <div className="col-span-2"><span className="font-medium">Valor:</span> {fmt(p.valor_contrato)}</div>}
  {p.regime_execucao && <div><span className="font-medium">Regime:</span> {p.regime_execucao}</div>}
  {p.bdi_percentual != null && <div><span className="font-medium">BDI:</span> {p.bdi_percentual}%</div>}
  {p.local_cidade && <div className="col-span-2"><span className="font-medium">Local:</span> {p.local_cidade}{p.local_uf ? `/${p.local_uf}` : ""}</div>}
</div>
```

- [ ] **Step 6: Atualizar DetailDialog (substituir linhas 254-263)**

```jsx
sections={[
  { label: "Nome", value: viewItem.nome },
  { label: "Status", value: viewItem.status },
  { label: "Cliente", value: viewItem.cliente },
  { label: "CNPJ", value: viewItem.cliente_cnpj },
  { label: "Responsável", value: viewItem.responsavel_geral },
  { label: "Gestor do Contrato", value: viewItem.gestor_contrato },
  { label: "Início", value: formatDate(viewItem.data_inicio) },
  { label: "Início Efetivo", value: formatDate(viewItem.data_inicio_efetivo) },
  { label: "Fim previsto", value: formatDate(viewItem.data_prevista_termino) },
  { label: "Prazo (dias)", value: viewItem.prazo_contratual_dias },
  { label: "Regime", value: viewItem.regime_execucao },
  { label: "Regime Tributário", value: viewItem.regime_tributario },
  { label: "BDI (%)", value: viewItem.bdi_percentual },
  { label: "Encargos (%)", value: viewItem.encargos_sociais_percentual },
  { label: "Retenção (%)", value: viewItem.retencao_percentual },
  { label: "Local", value: [viewItem.local_endereco, viewItem.local_cidade, viewItem.local_uf].filter(Boolean).join(", ") },
  { label: "Objeto", value: viewItem.contrato_objeto, full: true },
  { label: "Descrição", value: viewItem.descricao, full: true },
]}
```

- [ ] **Step 7: Verificar build**

```bash
npm run build
```
Esperado: zero erros.

- [ ] **Step 8: Commit**

```bash
git add src/pages/Configuracoes/GerenciarProjeto.jsx
git commit -m "feat(projeto): cadastro completo em abas com BDI, encargos, local, PQ-mestra"
```

---

## Task 6: Integração com Faturamento

**Files:**
- Modify: `src/components/planejamento/FaturamentoForm.jsx`
- Modify: `src/pages/Planejamento/Faturamento.jsx`

### 6a — FaturamentoForm: semear da PQ-mestra

- [ ] **Step 1: Adicionar prop `pqpMestra` e atualizar `initialItens`**

Em `FaturamentoForm.jsx`, atualizar a assinatura da função e o `useMemo` de `initialItens`:

Substituir a linha `export default function FaturamentoForm({ faturamento, faturamentos = [], onSave, onClose }) {` por:
```jsx
export default function FaturamentoForm({ faturamento, faturamentos = [], pqpMestra = [], onSave, onClose }) {
```

Substituir o `useMemo` de `initialItens` (linhas 23-30) por:
```jsx
const initialItens = useMemo(() => {
  if (faturamento) return faturamento.itens || [];
  const ordenados = [...faturamentos].sort(
    (a, b) => (b.mes_referencia || "").localeCompare(a.mes_referencia || "")
  );
  const ultimo = ordenados[0];
  if (ultimo?.itens?.length) {
    const anteriores = faturamentos.filter((f) => f.status === "Concluído");
    return zerarMedida(recalcAcumulado(ultimo.itens, anteriores));
  }
  // Sem período anterior: semeia da PQ-mestra do projeto ativo
  if (pqpMestra?.length) return zerarMedida(pqpMestra);
  return [];
}, [faturamento, faturamentos, pqpMestra]);
```

### 6b — Faturamento.jsx: buscar projeto ativo e passar pqp_mestra

- [ ] **Step 2: Adicionar query do projeto ativo em Faturamento.jsx**

Após a query de `faturamentos` (linha 41-45), adicionar:

```jsx
const { data: projetoAtivo } = useQuery({
  queryKey: ["projeto", selectedProjectId],
  queryFn: () =>
    entities.Projeto.filter({ id: selectedProjectId }).then((r) => r[0] || null),
  enabled: !!selectedProjectId,
});
```

- [ ] **Step 3: Passar pqpMestra ao FaturamentoForm**

Localizar o `<FaturamentoForm ...>` (linhas 169-176) e adicionar a prop `pqpMestra`:

```jsx
{showForm && (
  <FaturamentoForm
    key={editItem?.id || "new-faturamento"}
    faturamento={editItem}
    faturamentos={faturamentos}
    pqpMestra={projetoAtivo?.pqp_mestra || []}
    onSave={handleSave}
    onClose={() => { setShowForm(false); setEditItem(null); }}
  />
)}
```

- [ ] **Step 4: Verificar build**

```bash
npm run build
```
Esperado: zero erros.

- [ ] **Step 5: Commit**

```bash
git add src/components/planejamento/FaturamentoForm.jsx src/pages/Planejamento/Faturamento.jsx
git commit -m "feat(faturamento): semear PQP do 1º faturamento a partir da pqp_mestra do projeto"
```

---

## Task 7: Verificação end-to-end

- [ ] **Step 1: Rodar testes unitários**

```bash
npm run test
```
Esperado: todos os testes de `pqpUtils` passando (nenhum teste novo precisa ser adicionado — os cálculos `zerarMedida` e `recalcAcumulado` já têm cobertura).

- [ ] **Step 2: Verificar DB**

Usando `mcp__supabase-integrada__execute_sql`:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'projetos' AND column_name = 'pqp_mestra';
```
Esperado: 1 linha com `pqp_mestra`.

- [ ] **Step 3: Testar cadastro completo no app**

1. Abrir `/configuracoes/gerenciar-projeto`
2. Criar novo projeto → preencher todas as 6 abas com dados de teste
3. Aba PQ-mestra: adicionar 2 itens na planilha (ex: "1 — Serviços Civis" e "2 — Montagem Mecânica") com qtd e preço
4. Salvar → toast de sucesso
5. Editar o mesmo projeto → confirmar que todos os campos persistiram, incluindo a PQ-mestra com os itens

- [ ] **Step 4: Testar semeio do faturamento**

1. Selecionar o projeto criado no Step 3 (com PQ-mestra preenchida)
2. Ir para `/planejamento/faturamento`
3. Clicar "Novo Faturamento" → a planilha no form deve aparecer pré-preenchida com os itens da PQ-mestra, todos com `qtd_medida = 0`
4. Em projeto **sem** PQ-mestra (pqp_mestra vazia): ao criar o 1º faturamento, a planilha deve aparecer vazia (sem crash)
5. Em projeto **com** faturamento anterior (Concluído): ao criar o 2º faturamento, deve herdar do período anterior (comportamento existente, sem regressão)

- [ ] **Step 5: Confirmar Avanço Financeiro sem regressão**

Ir para `/planejamento/avanço-financeiro` com o projeto ativo → confirmar que a linha "Real" ainda é derivada dos faturamentos (não quebrou a derivação).

- [ ] **Step 6: Commit final de verificação (se houver ajustes)**

```bash
git add -p  # adicionar apenas os arquivos com ajustes pós-verificação
git commit -m "fix(projeto): ajustes pós-verificação cadastro completo + pqp_mestra"
```
