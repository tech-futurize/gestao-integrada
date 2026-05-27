# M9 Adm. Contratual C1–C4 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir tipo/status/formatação dos contratos, implementar UI de Aditivos com datas calculadas dinamicamente, vincular Medições ao detalhe do Contrato, e limpar o formulário de Medições com integração de Import/Export.

**Architecture:** `Contratos.jsx` é o orquestrador — centraliza queries e mutations de contratos, aditivos e medições (quando um contrato está selecionado). `ContratoDetalhes.jsx` é puramente presentacional, recebendo dados e callbacks via props. Dois novos componentes (`AditivoForm.jsx`, `AditivosList.jsx`) encapsulam a UI de Aditivos. A migration SQL alinha o banco com o DATABASE.md antes de qualquer alteração de UI.

**Tech Stack:** React 18 + JSX, TanStack React Query 5, Supabase JS, Tailwind CSS, shadcn/ui (Radix), Lucide React, `Intl.NumberFormat("pt-BR")` para formatação BR.

---

## Mapa de arquivos

| Ação | Arquivo | Responsabilidade |
|------|---------|-----------------|
| CRIAR | `docs/database/supabase-migration-m9-contratos.sql` | Migration: atualiza constraints e colunas |
| CRIAR | `src/components/contratos/AditivoForm.jsx` | Modal de criação/edição de aditivos |
| CRIAR | `src/components/contratos/AditivosList.jsx` | Tabela inline de aditivos |
| MODIFICAR | `src/components/contratos/ContratoForm.jsx` | Novos status, tipo, valor BR |
| MODIFICAR | `src/components/contratos/ContratosList.jsx` | Mapa de cores dos novos status |
| MODIFICAR | `src/components/contratos/ContratoDetalhes.jsx` | Seção aditivos + termino_atual + medições reais |
| MODIFICAR | `src/components/contratos/MedicaoForm.jsx` | Remove elaborador/valor_bruto/retenção; valor read-only |
| MODIFICAR | `src/components/contratos/MedicoesList.jsx` | Usa `m.valor` |
| MODIFICAR | `src/pages/Contratos.jsx` | Queries/mutations aditivos + medições wired |
| MODIFICAR | `src/pages/AdminContratual/Medicoes.jsx` | ImportExportDialog integrado |

---

## Task 1: Migration SQL — alinha schema com DATABASE.md

**Files:**
- Create: `docs/database/supabase-migration-m9-contratos.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```sql
-- supabase-migration-m9-contratos.sql
-- M9 Adm. Contratual — alinha contratos, aditivos e medicoes com DATABASE.md

-- ─────────────────────────────────────────
-- CONTRATOS: atualizar dados de status
-- ─────────────────────────────────────────
UPDATE contratos SET status = CASE
  WHEN status = 'Ativo'       THEN 'Em andamento'
  WHEN status = 'Em Revisão'  THEN 'Em andamento'
  WHEN status = 'Suspenso'    THEN 'Paralisado'
  WHEN status = 'Encerrado'   THEN 'Concluído'
  WHEN status = 'Cancelado'   THEN 'Paralisado'
  ELSE status
END;

-- CONTRATOS: atualizar dados de tipo
UPDATE contratos SET tipo = 'Fornecimento + Serviço' WHERE tipo = 'Misto';

-- CONTRATOS: recriar CHECK constraints com novos valores
ALTER TABLE contratos DROP CONSTRAINT IF EXISTS contratos_status_check;
ALTER TABLE contratos ADD CONSTRAINT contratos_status_check
  CHECK (status IN ('A iniciar','Em andamento','Concluído','Paralisado'));

ALTER TABLE contratos DROP CONSTRAINT IF EXISTS contratos_tipo_check;
ALTER TABLE contratos ADD CONSTRAINT contratos_tipo_check
  CHECK (tipo IN ('Serviços','Fornecimento','Fornecimento + Serviço'));

-- ─────────────────────────────────────────
-- ADITIVOS: renomear colunas + adicionar escopo_texto
-- ─────────────────────────────────────────
ALTER TABLE aditivos RENAME COLUMN dias_adicionais TO prazo_dias;
ALTER TABLE aditivos RENAME COLUMN valor_adicional TO valor;
ALTER TABLE aditivos ALTER COLUMN prazo_dias TYPE INTEGER USING prazo_dias::INTEGER;
ALTER TABLE aditivos ADD COLUMN IF NOT EXISTS escopo_texto TEXT;

-- ─────────────────────────────────────────
-- MEDICOES: adicionar coluna valor + remover campos obsoletos
-- ─────────────────────────────────────────
ALTER TABLE medicoes ADD COLUMN IF NOT EXISTS valor NUMERIC;
UPDATE medicoes SET valor = COALESCE(valor_liquido, valor_bruto, 0) WHERE valor IS NULL;
ALTER TABLE medicoes DROP COLUMN IF EXISTS elaborador;
ALTER TABLE medicoes DROP COLUMN IF EXISTS valor_bruto;
ALTER TABLE medicoes DROP COLUMN IF EXISTS valor_retencao;
ALTER TABLE medicoes DROP COLUMN IF EXISTS valor_liquido;
```

- [ ] **Step 2: Aplicar a migration no Supabase**

No painel Supabase → SQL Editor → cole o conteúdo acima → Execute.

Ou via MCP supabase se disponível:
```
mcp: apply_migration com o conteúdo do arquivo
```

- [ ] **Step 3: Verificar no Supabase**

```sql
-- Checar constraints de contratos
SELECT conname, consrc FROM pg_constraint WHERE conrelid = 'contratos'::regclass AND contype = 'c';

-- Checar colunas de aditivos
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'aditivos' ORDER BY ordinal_position;

-- Checar colunas de medicoes
SELECT column_name FROM information_schema.columns
WHERE table_name = 'medicoes' ORDER BY ordinal_position;
```

Esperado: `contratos` com CHECK de 4 status e 3 tipos; `aditivos` com `prazo_dias`, `valor`, `escopo_texto`; `medicoes` sem `elaborador`/`valor_bruto`/`valor_retencao`/`valor_liquido`, com `valor`.

- [ ] **Step 4: Commit**

```bash
git add docs/database/supabase-migration-m9-contratos.sql
git commit -m "feat(M9): migration — status/tipo contratos, colunas aditivos/medicoes"
```

---

## Task 2: C1 — ContratoForm.jsx (status, tipo, valor BR)

**Files:**
- Modify: `src/components/contratos/ContratoForm.jsx`

- [ ] **Step 1: Substituir o arquivo completo**

```jsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CloseButton from "@/components/ui/CloseButton";

const TIPOS = ["Serviços", "Fornecimento", "Fornecimento + Serviço"];
const STATUS = ["A iniciar", "Em andamento", "Concluído", "Paralisado"];

const formatBR = (v) => {
  if (v === "" || v == null) return "";
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/\./g, "").replace(",", "."));
  if (isNaN(n)) return "";
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};

const parseBRFloat = (s) => {
  if (!s) return 0;
  return parseFloat(String(s).replace(/\./g, "").replace(",", ".")) || 0;
};

export default function ContratoForm({ contrato, onSave, onClose }) {
  const [form, setForm] = useState({
    numero: "", objeto: "", fornecedor: "", cnpj: "",
    data_inicio: "", data_fim: "", status: "A iniciar", tipo: "Serviços",
    centro_custo: "", gestor: "", observacoes: "",
    ...contrato,
    valor_total: contrato?.valor_total != null ? formatBR(contrato.valor_total) : "",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, valor_total: parseBRFloat(form.valor_total) });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "#e5e7eb" }}>
          <h2 className="text-lg font-bold" style={{ color: "#26405d" }}>
            {contrato ? "Editar Contrato" : "Novo Contrato"}
          </h2>
          <CloseButton onClick={onClose} />
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Número do Contrato</Label>
              <Input value={form.numero} onChange={e => set("numero", e.target.value)} placeholder="CT-001" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Objeto do Contrato *</Label>
            <Input required value={form.objeto} onChange={e => set("objeto", e.target.value)} placeholder="Descrição do objeto contratado" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fornecedor *</Label>
              <Input required value={form.fornecedor} onChange={e => set("fornecedor", e.target.value)} placeholder="Nome do fornecedor" />
            </div>
            <div>
              <Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={e => set("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => set("tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor Total (R$)</Label>
              <Input
                value={form.valor_total}
                onChange={e => set("valor_total", e.target.value)}
                onBlur={e => {
                  const f = formatBR(e.target.value);
                  if (f) set("valor_total", f);
                }}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data de Início</Label>
              <Input type="date" value={form.data_inicio} onChange={e => set("data_inicio", e.target.value)} />
            </div>
            <div>
              <Label>Data de Fim</Label>
              <Input type="date" value={form.data_fim} onChange={e => set("data_fim", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Centro de Custo</Label>
              <Input value={form.centro_custo} onChange={e => set("centro_custo", e.target.value)} placeholder="Ex: CC-001" />
            </div>
            <div>
              <Label>Gestor do Contrato</Label>
              <Input value={form.gestor} onChange={e => set("gestor", e.target.value)} placeholder="Nome do gestor" />
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <textarea
              value={form.observacoes}
              onChange={e => set("observacoes", e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2"
              placeholder="Observações gerais..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-brand-accent hover:opacity-90 text-white">
              {contrato ? "Atualizar" : "Criar Contrato"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar build sem erros**

```bash
npm run build 2>&1 | tail -20
```

Esperado: sem erros de compilação.

- [ ] **Step 3: Commit**

```bash
git add src/components/contratos/ContratoForm.jsx
git commit -m "feat(M9-C1): ContratoForm — novos status/tipo e formatação BR de valor"
```

---

## Task 3: C1 — ContratosList.jsx e ContratoDetalhes.jsx (cores de status)

**Files:**
- Modify: `src/components/contratos/ContratosList.jsx:8-14`
- Modify: `src/components/contratos/ContratoDetalhes.jsx:9-15`

- [ ] **Step 1: Atualizar STATUS_COLORS em ContratosList.jsx**

Substituir o bloco `STATUS_COLORS` (linhas 8–14):

```js
const STATUS_COLORS = {
  "A iniciar":    "bg-muted text-muted-foreground",
  "Em andamento": "bg-status-positive/15 text-status-positive",
  "Concluído":    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Paralisado":   "bg-status-critical/15 text-status-critical",
};
```

- [ ] **Step 2: Atualizar STATUS_COLORS em ContratoDetalhes.jsx**

Substituir o bloco `STATUS_COLORS` (linhas 9–15) pelo mesmo objeto:

```js
const STATUS_COLORS = {
  "A iniciar":    "bg-muted text-muted-foreground",
  "Em andamento": "bg-status-positive/15 text-status-positive",
  "Concluído":    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Paralisado":   "bg-status-critical/15 text-status-critical",
};
```

- [ ] **Step 3: Commit**

```bash
git add src/components/contratos/ContratosList.jsx src/components/contratos/ContratoDetalhes.jsx
git commit -m "feat(M9-C1): atualizar cores de status dos contratos"
```

---

## Task 4: C2 — AditivoForm.jsx (novo componente modal)

**Files:**
- Create: `src/components/contratos/AditivoForm.jsx`

- [ ] **Step 1: Criar o componente**

```jsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CloseButton from "@/components/ui/CloseButton";

const TIPOS = ["Prazo", "Valor", "Prazo e Valor"];
const STATUS_ADITIVO = ["Pendente", "Assinado", "Cancelado"];

const formatBR = (v) => {
  if (v === "" || v == null) return "";
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/\./g, "").replace(",", "."));
  if (isNaN(n)) return "";
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};

const parseBRFloat = (s) => {
  if (!s) return 0;
  return parseFloat(String(s).replace(/\./g, "").replace(",", ".")) || 0;
};

export default function AditivoForm({ aditivo, contratoId, projetoId, onSave, onClose }) {
  const [form, setForm] = useState({
    numero: "", tipo: "Prazo", escopo_texto: "",
    prazo_dias: "", justificativa: "", data_assinatura: "",
    status: "Pendente",
    ...aditivo,
    valor: aditivo?.valor != null ? formatBR(aditivo.valor) : "",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      contrato_id: contratoId,
      projeto_id: projetoId,
      prazo_dias: parseInt(form.prazo_dias) || 0,
      valor: parseBRFloat(form.valor),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "#e5e7eb" }}>
          <h2 className="text-lg font-bold" style={{ color: "#26405d" }}>
            {aditivo ? "Editar Aditivo" : "Novo Aditivo"}
          </h2>
          <CloseButton onClick={onClose} />
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Número</Label>
              <Input value={form.numero} onChange={e => set("numero", e.target.value)} placeholder="AD-001" />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={v => set("tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Escopo Alterado</Label>
            <textarea
              value={form.escopo_texto}
              onChange={e => set("escopo_texto", e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2"
              placeholder="Descreva o escopo alterado..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prazo Adicional (dias)</Label>
              <Input
                type="number"
                value={form.prazo_dias}
                onChange={e => set("prazo_dias", e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input
                value={form.valor}
                onChange={e => set("valor", e.target.value)}
                onBlur={e => {
                  const f = formatBR(e.target.value);
                  if (f) set("valor", f);
                }}
                placeholder="0,00"
              />
            </div>
          </div>

          <div>
            <Label>Justificativa</Label>
            <textarea
              value={form.justificativa}
              onChange={e => set("justificativa", e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2"
              placeholder="Justificativa do aditivo..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data de Assinatura</Label>
              <Input type="date" value={form.data_assinatura} onChange={e => set("data_assinatura", e.target.value)} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_ADITIVO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-brand-accent hover:opacity-90 text-white">
              {aditivo ? "Atualizar" : "Adicionar Aditivo"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build 2>&1 | tail -10
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/contratos/AditivoForm.jsx
git commit -m "feat(M9-C2): AditivoForm — modal de criação/edição de aditivos"
```

---

## Task 5: C2 — AditivosList.jsx (novo componente tabela)

**Files:**
- Create: `src/components/contratos/AditivosList.jsx`

- [ ] **Step 1: Criar o componente**

```jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Plus } from "lucide-react";
import ConfirmDeleteButton from "@/components/ui/ConfirmDeleteButton";

const fmt = (v) => v != null && v !== 0
  ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
  : "—";

const STATUS_COLORS = {
  Pendente:   "bg-status-attention/15 text-status-attention",
  Assinado:   "bg-status-positive/15 text-status-positive",
  Cancelado:  "bg-status-critical/15 text-status-critical",
};

const TIPO_COLORS = {
  Prazo:          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Valor:          "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "Prazo e Valor": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

export default function AditivosList({ aditivos, onAdd, onEdit, onDelete }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-foreground">Aditivos</span>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="w-3 h-3 mr-1" /> Aditivo
        </Button>
      </div>

      {aditivos.length === 0 ? (
        <p className="text-center text-muted-foreground py-6 text-sm">Nenhum aditivo registrado.</p>
      ) : (
        <div className="divide-y divide-border">
          {aditivos.map(a => (
            <div key={a.id} className="py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {a.numero && <span className="text-xs font-mono text-muted-foreground">{a.numero}</span>}
                  <Badge className={TIPO_COLORS[a.tipo] || "bg-muted text-muted-foreground"}>{a.tipo}</Badge>
                  <Badge className={STATUS_COLORS[a.status] || "bg-muted text-muted-foreground"}>{a.status}</Badge>
                </div>
                {a.escopo_texto && (
                  <p className="text-xs text-muted-foreground truncate">{a.escopo_texto}</p>
                )}
                <div className="flex items-center gap-4 mt-1">
                  {a.prazo_dias > 0 && (
                    <span className="text-xs text-muted-foreground">+{a.prazo_dias} dias</span>
                  )}
                  {a.valor > 0 && (
                    <span className="text-xs font-semibold text-ocre">{fmt(a.valor)}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => onEdit(a)}><Edit className="w-3 h-3" /></Button>
                <ConfirmDeleteButton size="sm" onConfirm={() => onDelete(a.id)} description="O aditivo será excluído permanentemente." />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add src/components/contratos/AditivosList.jsx
git commit -m "feat(M9-C2): AditivosList — tabela inline de aditivos"
```

---

## Task 6: C2+C3 — Contratos.jsx (queries/mutations de aditivos e medições)

**Files:**
- Modify: `src/pages/Contratos.jsx` (substituição completa)

- [ ] **Step 1: Substituir o arquivo completo**

```jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText, DollarSign } from "lucide-react";
import ContratosList from "@/components/contratos/ContratosList";
import ContratoForm from "@/components/contratos/ContratoForm";
import ContratoDetalhes from "@/components/contratos/ContratoDetalhes";
import AditivoForm from "@/components/contratos/AditivoForm";
import MedicaoForm from "@/components/contratos/MedicaoForm";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useProject } from "@/lib/ProjectContext";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function Contratos() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onErr = (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });

  const [showContratoForm, setShowContratoForm] = useState(false);
  const [editContrato, setEditContrato] = useState(null);
  const [selectedContrato, setSelectedContrato] = useState(null);

  const [showAditivoForm, setShowAditivoForm] = useState(false);
  const [editAditivo, setEditAditivo] = useState(null);

  const [showMedicaoForm, setShowMedicaoForm] = useState(false);

  // ── Contratos ──────────────────────────────────────────────────
  const { data: contratos = [], isLoading: loadingContratos } = useQuery({
    queryKey: ["contratos", selectedProjectId],
    queryFn: () => entities.Contrato.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createContrato = useMutation({
    mutationFn: (data) => entities.Contrato.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contratos"] }); setShowContratoForm(false); },
    onError: onErr,
  });

  const updateContrato = useMutation({
    mutationFn: ({ id, data }) => entities.Contrato.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      setShowContratoForm(false);
      setEditContrato(null);
    },
    onError: onErr,
  });

  const deleteContrato = useMutation({
    mutationFn: (id) => entities.Contrato.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contratos"] }); setSelectedContrato(null); },
    onError: onErr,
  });

  // ── Aditivos (ativo quando há contrato selecionado) ───────────
  const { data: aditivos = [] } = useQuery({
    queryKey: ["aditivos", selectedContrato?.id],
    queryFn: () => entities.Aditivo.filter({ contrato_id: selectedContrato.id }),
    enabled: !!selectedContrato?.id,
  });

  const createAditivo = useMutation({
    mutationFn: (data) => entities.Aditivo.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["aditivos"] }); setShowAditivoForm(false); },
    onError: onErr,
  });

  const updateAditivo = useMutation({
    mutationFn: ({ id, data }) => entities.Aditivo.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["aditivos"] }); setShowAditivoForm(false); setEditAditivo(null); },
    onError: onErr,
  });

  const deleteAditivo = useMutation({
    mutationFn: (id) => entities.Aditivo.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["aditivos"] }),
    onError: onErr,
  });

  // ── Medições (ativo quando há contrato selecionado) ───────────
  const { data: medicoes = [] } = useQuery({
    queryKey: ["medicoes", "contrato", selectedContrato?.id],
    queryFn: () => entities.Medicao.filter({ contrato_id: selectedContrato.id }),
    enabled: !!selectedContrato?.id,
  });

  const createMedicao = useMutation({
    mutationFn: (data) => entities.Medicao.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["medicoes"] }); setShowMedicaoForm(false); },
    onError: onErr,
  });

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState icon={FileText} description="Selecione um projeto no menu lateral para acessar os contratos." />
        </div>
      </div>
    );
  }

  const totalContratado = contratos.reduce((s, c) => s + (c.valor_total || 0), 0);
  const emAndamento = contratos.filter(c => c.status === "Em andamento").length;

  const handleSaveContrato = (data) => {
    if (editContrato) updateContrato.mutate({ id: editContrato.id, data });
    else createContrato.mutate({ ...data, projeto_id: selectedProjectId });
  };

  const handleSaveAditivo = (data) => {
    if (editAditivo) updateAditivo.mutate({ id: editAditivo.id, data });
    else createAditivo.mutate({ ...data, contrato_id: selectedContrato.id, projeto_id: selectedProjectId });
  };

  const handleSaveMedicao = (data) => {
    createMedicao.mutate({ ...data, contrato_id: selectedContrato.id, projeto_id: selectedProjectId });
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <Button onClick={() => { setEditContrato(null); setShowContratoForm(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Contrato
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Total Contratado", value: fmt(totalContratado), icon: DollarSign, color: "#26405d" },
            { label: "Em Andamento", value: emAndamento, icon: FileText, color: "#c35e1e" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="bg-card shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-lg font-bold text-foreground">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedContrato ? (
          <ContratoDetalhes
            contrato={selectedContrato}
            medicoes={medicoes}
            aditivos={aditivos}
            onBack={() => setSelectedContrato(null)}
            onEdit={(c) => { setEditContrato(c); setShowContratoForm(true); }}
            onDelete={(id) => deleteContrato.mutate(id)}
            onNovaMedicao={() => setShowMedicaoForm(true)}
            onAddAditivo={() => { setEditAditivo(null); setShowAditivoForm(true); }}
            onEditAditivo={(a) => { setEditAditivo(a); setShowAditivoForm(true); }}
            onDeleteAditivo={(id) => deleteAditivo.mutate(id)}
          />
        ) : (
          <ContratosList
            contratos={contratos}
            isLoading={loadingContratos}
            onSelect={setSelectedContrato}
            onEdit={(c) => { setEditContrato(c); setShowContratoForm(true); }}
            onDelete={(id) => deleteContrato.mutate(id)}
          />
        )}

        {showContratoForm && (
          <ContratoForm
            key={editContrato?.id || "new-contrato"}
            contrato={editContrato}
            onSave={handleSaveContrato}
            onClose={() => { setShowContratoForm(false); setEditContrato(null); }}
          />
        )}

        {showAditivoForm && (
          <AditivoForm
            key={editAditivo?.id || "new-aditivo"}
            aditivo={editAditivo}
            contratoId={selectedContrato?.id}
            projetoId={selectedProjectId}
            onSave={handleSaveAditivo}
            onClose={() => { setShowAditivoForm(false); setEditAditivo(null); }}
          />
        )}

        {showMedicaoForm && (
          <MedicaoForm
            key="new-medicao-from-contrato"
            medicao={null}
            contratos={contratos}
            defaultContratoId={selectedContrato?.id}
            onSave={handleSaveMedicao}
            onClose={() => setShowMedicaoForm(false)}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Contratos.jsx
git commit -m "feat(M9-C2+C3): Contratos.jsx — queries aditivos+medições, mutations wired"
```

---

## Task 7: C2+C3 — ContratoDetalhes.jsx (seção aditivos + termino_atual + medições reais)

**Files:**
- Modify: `src/components/contratos/ContratoDetalhes.jsx` (substituição completa)

- [ ] **Step 1: Substituir o arquivo completo**

```jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, DollarSign, Calendar, User, Building } from "lucide-react";
import AditivosList from "@/components/contratos/AditivosList";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

const STATUS_COLORS = {
  "A iniciar":    "bg-muted text-muted-foreground",
  "Em andamento": "bg-status-positive/15 text-status-positive",
  "Concluído":    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Paralisado":   "bg-status-critical/15 text-status-critical",
};

const MEDICAO_STATUS_COLORS = {
  Elaboração:      "bg-muted text-muted-foreground",
  "Em Revisão":    "bg-status-attention/15 text-status-attention",
  "Em Aprovação":  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Aprovada:        "bg-status-positive/15 text-status-positive",
  Paga:            "bg-status-positive/20 text-status-positive",
  Rejeitada:       "bg-status-critical/15 text-status-critical",
};

function addDaysToDate(dateStr, days) {
  if (!dateStr || !days) return null;
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function ContratoDetalhes({
  contrato, medicoes, aditivos,
  onBack, onEdit, onDelete, onNovaMedicao,
  onAddAditivo, onEditAditivo, onDeleteAditivo,
}) {
  const totalMedido = (medicoes || [])
    .filter(m => ["Aprovada", "Paga"].includes(m.status))
    .reduce((s, m) => s + (m.valor || 0), 0);
  const saldo = (contrato.valor_total || 0) - totalMedido;
  const percentMedido = contrato.valor_total ? (totalMedido / contrato.valor_total) * 100 : 0;

  const totalPrazoDias = (aditivos || [])
    .filter(a => a.status === "Assinado" && a.prazo_dias)
    .reduce((s, a) => s + (a.prazo_dias || 0), 0);

  const terminoAtual = totalPrazoDias > 0
    ? addDaysToDate(contrato.data_fim, totalPrazoDias)
    : contrato.data_fim;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
        <h2 className="text-lg font-bold flex-1 text-foreground">Detalhes do Contrato</h2>
        <Button size="sm" variant="outline" onClick={() => onEdit(contrato)}><Edit className="w-4 h-4 mr-1" /> Editar</Button>
        <Button size="sm" variant="outline" className="text-status-critical border-status-critical/30" onClick={() => onDelete(contrato.id)}><Trash2 className="w-4 h-4" /></Button>
      </div>

      <Card className="bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {contrato.numero && <span className="text-xs font-mono text-muted-foreground">{contrato.numero}</span>}
                <Badge className={STATUS_COLORS[contrato.status] || "bg-muted text-muted-foreground"}>{contrato.status}</Badge>
              </div>
              <h3 className="text-xl font-bold text-foreground">{contrato.objeto}</h3>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-ocre">{fmt(contrato.valor_total)}</p>
              <p className="text-sm text-muted-foreground">Valor Total</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-border">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Fornecedor</p>
                <p className="text-sm font-semibold text-foreground">{contrato.fornecedor}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Gestor</p>
                <p className="text-sm font-semibold text-foreground">{contrato.gestor || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Início → Término Original</p>
                <p className="text-sm font-semibold text-foreground">{fmtDate(contrato.data_inicio)} → {fmtDate(contrato.data_fim)}</p>
                {terminoAtual !== contrato.data_fim && (
                  <p className="text-xs text-status-attention font-semibold">Término Atual: {fmtDate(terminoAtual)}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className={`text-sm font-semibold ${saldo >= 0 ? "text-status-positive" : "text-status-critical"}`}>{fmt(saldo)}</p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Medido</span>
              <span className="text-xs font-semibold text-foreground">{percentMedido.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="h-2 rounded-full transition-all bg-ocre" style={{ width: `${Math.min(percentMedido, 100)}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">Pago/Aprovado: {fmt(totalMedido)}</span>
              <span className="text-xs text-muted-foreground">Total: {fmt(contrato.valor_total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Aditivos ─────────────────────────────────── */}
      <Card className="bg-card shadow-sm">
        <CardContent className="p-6">
          <AditivosList
            aditivos={aditivos || []}
            onAdd={onAddAditivo}
            onEdit={onEditAditivo}
            onDelete={onDeleteAditivo}
          />
        </CardContent>
      </Card>

      {/* ── Medições ─────────────────────────────────── */}
      <Card className="bg-card shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-foreground">Medições</CardTitle>
            <Button size="sm" onClick={onNovaMedicao}>+ Nova Medição</Button>
          </div>
        </CardHeader>
        <CardContent>
          {(medicoes || []).length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma medição registrada.</p>
          ) : (
            <div className="divide-y divide-border">
              {medicoes.map(m => (
                <div key={m.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-foreground">Medição {m.numero}</span>
                    <span className="text-xs text-muted-foreground ml-2">{m.periodo_inicio} → {m.periodo_fim}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm text-foreground">{fmt(m.valor)}</span>
                    <Badge className={MEDICAO_STATUS_COLORS[m.status] || "bg-muted text-muted-foreground"}>{m.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 3: Testar no browser**

```bash
npm run dev
```

Navegar para `/admin-contratual/contratos` → selecionar um contrato → verificar:
- Seção "Aditivos" visível com botão `+ Aditivo`
- "Término Atual" aparece quando há aditivos assinados com prazo_dias > 0
- Botão `+ Nova Medição` abre MedicaoForm
- Medições reais do contrato aparecem na lista

- [ ] **Step 4: Commit**

```bash
git add src/components/contratos/ContratoDetalhes.jsx
git commit -m "feat(M9-C2+C3): ContratoDetalhes — aditivos + termino_atual + medições reais"
```

---

## Task 8: C4 — MedicaoForm.jsx (remover campos + valor read-only)

**Files:**
- Modify: `src/components/contratos/MedicaoForm.jsx` (substituição completa)

- [ ] **Step 1: Substituir o arquivo completo**

```jsx
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import CloseButton from "@/components/ui/CloseButton";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function MedicaoForm({ medicao, contratos, defaultContratoId, onSave, onClose }) {
  const [form, setForm] = useState({
    numero: "", contrato_id: defaultContratoId || "", periodo_inicio: "", periodo_fim: "",
    status: "Elaboração", observacoes: "", itens: [],
    ...medicao,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addItem = () => set("itens", [...(form.itens || []), { descricao: "", unidade: "m²", quantidade: "", preco_unitario: "", valor_total: "" }]);
  const removeItem = (i) => set("itens", form.itens.filter((_, idx) => idx !== i));
  const updateItem = (i, k, v) => {
    const items = [...(form.itens || [])];
    items[i] = { ...items[i], [k]: v };
    if (k === "quantidade" || k === "preco_unitario") {
      const q = parseFloat(k === "quantidade" ? v : items[i].quantidade) || 0;
      const p = parseFloat(k === "preco_unitario" ? v : items[i].preco_unitario) || 0;
      items[i].valor_total = (q * p).toFixed(2);
    }
    set("itens", items);
  };

  const valorCalculado = useMemo(() =>
    (form.itens || []).reduce((s, item) => s + (parseFloat(item.valor_total) || 0), 0),
    [form.itens]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, valor: valorCalculado });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold" style={{ color: "#26405d" }}>{medicao ? "Editar Medição" : "Nova Medição"}</h2>
          <CloseButton onClick={onClose} />
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Contrato *</Label>
              <Select value={form.contrato_id} onValueChange={v => set("contrato_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {contratos.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.numero ? `${c.numero} - ` : ""}{c.objeto?.substring(0, 40)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Número da Medição *</Label>
              <Input required value={form.numero} onChange={e => set("numero", e.target.value)} placeholder="001" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Período Início</Label><Input type="date" value={form.periodo_inicio} onChange={e => set("periodo_inicio", e.target.value)} /></div>
            <div><Label>Período Fim</Label><Input type="date" value={form.periodo_fim} onChange={e => set("periodo_fim", e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Elaboração", "Em Revisão", "Em Aprovação", "Aprovada", "Paga", "Rejeitada"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input value={fmt(valorCalculado)} readOnly disabled className="bg-muted cursor-not-allowed" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Itens da Medição</Label>
              <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> Item</Button>
            </div>
            <div className="space-y-2">
              {(form.itens || []).map((item, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 items-center p-2 bg-gray-50 rounded-lg">
                  <Input className="col-span-2 text-xs" placeholder="Descrição" value={item.descricao} onChange={e => updateItem(i, "descricao", e.target.value)} />
                  <Input className="text-xs" placeholder="Un." value={item.unidade} onChange={e => updateItem(i, "unidade", e.target.value)} />
                  <Input className="text-xs" type="number" placeholder="Qtd" value={item.quantidade} onChange={e => updateItem(i, "quantidade", e.target.value)} />
                  <div className="flex gap-1">
                    <Input className="text-xs" type="number" placeholder="R$ unit." value={item.preco_unitario} onChange={e => updateItem(i, "preco_unitario", e.target.value)} />
                    <Button type="button" size="sm" variant="ghost" className="text-red-400 px-1" onClick={() => removeItem(i)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <textarea rows={2} className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none" value={form.observacoes} onChange={e => set("observacoes", e.target.value)} placeholder="Observações..." />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-brand-accent hover:opacity-90 text-white">
              {medicao ? "Atualizar" : "Criar Medição"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add src/components/contratos/MedicaoForm.jsx
git commit -m "feat(M9-C4): MedicaoForm — remover elaborador/bruto/retenção; valor calculado read-only"
```

---

## Task 9: C4 — MedicoesList.jsx (m.valor) + Medicoes.jsx (ImportExportDialog)

**Files:**
- Modify: `src/components/contratos/MedicoesList.jsx:50-51`
- Modify: `src/pages/AdminContratual/Medicoes.jsx` (substituição completa)

- [ ] **Step 1: Atualizar MedicoesList.jsx — usar m.valor**

Substituir as linhas que referenciam `m.valor_liquido || m.valor_bruto` e `m.valor_retencao`:

Na linha 50, substituir:
```jsx
<p className="font-bold text-ocre">{fmt(m.valor_liquido || m.valor_bruto)}</p>
{m.valor_retencao > 0 && <p className="text-xs text-muted-foreground">Retenção: {fmt(m.valor_retencao)}</p>}
```
por:
```jsx
<p className="font-bold text-ocre">{fmt(m.valor)}</p>
```

- [ ] **Step 2: Substituir Medicoes.jsx completo com ImportExportDialog**

```jsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList, Upload } from "lucide-react";
import MedicoesList from "@/components/contratos/MedicoesList";
import MedicaoForm from "@/components/contratos/MedicaoForm";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { useProject } from "@/lib/ProjectContext";
import { useToast, friendlyMessage } from "@/components/ui/use-toast";
import FilterBar from "@/components/ui/FilterBar";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";

const EXPORT_COLUMNS = [
  { key: "numero",         label: "Número",         type: "string", required: true },
  { key: "contrato_id",    label: "Contrato ID",     type: "string" },
  { key: "periodo_inicio", label: "Período Início",  type: "string" },
  { key: "periodo_fim",    label: "Período Fim",     type: "string" },
  { key: "valor",          label: "Valor",           type: "number" },
  { key: "status",         label: "Status",          type: "string" },
  { key: "observacoes",    label: "Observações",     type: "string" },
];

export default function Medicoes() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const onErr = (e) => toast({ title: "Erro ao salvar", description: friendlyMessage(e), variant: "destructive" });
  const [showForm, setShowForm] = useState(false);
  const [editMedicao, setEditMedicao] = useState(null);
  const [showImportExport, setShowImportExport] = useState(false);

  const { data: medicoes = [], isLoading } = useQuery({
    queryKey: ["medicoes", selectedProjectId],
    queryFn: () => entities.Medicao.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const [filtros, setFiltros] = useState({});

  const medicoesFiltradas = useMemo(() => {
    const st = filtros.status || [];
    if (st.length === 0) return medicoes;
    return medicoes.filter(m => st.includes(m.status));
  }, [medicoes, filtros]);

  const { data: contratos = [] } = useQuery({
    queryKey: ["contratos", selectedProjectId],
    queryFn: () => entities.Contrato.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createMedicao = useMutation({
    mutationFn: (data) => entities.Medicao.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["medicoes"] }); setShowForm(false); },
    onError: onErr,
  });

  const updateMedicao = useMutation({
    mutationFn: ({ id, data }) => entities.Medicao.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["medicoes"] }); setShowForm(false); setEditMedicao(null); },
    onError: onErr,
  });

  const deleteMedicao = useMutation({
    mutationFn: (id) => entities.Medicao.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["medicoes"] }),
    onError: onErr,
  });

  const handleSave = (data) => {
    if (editMedicao) updateMedicao.mutate({ id: editMedicao.id, data });
    else createMedicao.mutate({ ...data, projeto_id: selectedProjectId });
  };

  const handleImport = async (row) => {
    await entities.Medicao.create({
      projeto_id: selectedProjectId,
      numero:         String(row.numero || ""),
      contrato_id:    row.contrato_id || null,
      periodo_inicio: row.periodo_inicio || null,
      periodo_fim:    row.periodo_fim || null,
      valor:          Number(row.valor) || 0,
      status:         row.status || "Elaboração",
      observacoes:    row.observacoes || "",
      itens:          [],
    });
    queryClient.invalidateQueries({ queryKey: ["medicoes"] });
  };

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState icon={ClipboardList} description="Selecione um projeto no menu lateral para acessar as medições." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImportExport(true)}>
              <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
            </Button>
            <Button onClick={() => { setEditMedicao(null); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Nova Medição
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <FilterBar
          storageKey="medicoes-filtros"
          filters={[
            { key: "status", label: "Status", options: ["Elaboração", "Em Revisão", "Em Aprovação", "Aprovada", "Paga", "Rejeitada"] },
          ]}
          onChange={setFiltros}
        />
        <MedicoesList
          medicoes={medicoesFiltradas}
          contratos={contratos}
          isLoading={isLoading}
          onEdit={(m) => { setEditMedicao(m); setShowForm(true); }}
          onDelete={(id) => deleteMedicao.mutate(id)}
          onUpdateStatus={(id, status) => updateMedicao.mutate({ id, data: { status } })}
        />

        {showForm && (
          <MedicaoForm
            key={editMedicao?.id || "new-medicao"}
            medicao={editMedicao}
            contratos={contratos}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditMedicao(null); }}
          />
        )}

        <ImportExportDialog
          open={showImportExport}
          onOpenChange={setShowImportExport}
          title="Medições"
          exportFileName="medicoes"
          columns={EXPORT_COLUMNS}
          onExport={() => medicoes.map(m => ({
            numero:         m.numero,
            contrato_id:    m.contrato_id,
            periodo_inicio: m.periodo_inicio,
            periodo_fim:    m.periodo_fim,
            valor:          m.valor,
            status:         m.status,
            observacoes:    m.observacoes,
          }))}
          onImport={handleImport}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verificar build**

```bash
npm run build 2>&1 | tail -10
```

Esperado: sem erros.

- [ ] **Step 4: Testar no browser**

```bash
npm run dev
```

Navegar para `/admin-contratual/medicoes` → verificar:
- Botão "Importar / Exportar" no header abre o dialog
- Form de nova medição não tem mais "Elaborador", "Valor Bruto", "Retenção"
- Campo "Valor (R$)" é read-only e atualiza ao adicionar itens
- Export gera CSV/XLSX com colunas corretas

- [ ] **Step 5: Commit**

```bash
git add src/components/contratos/MedicoesList.jsx src/pages/AdminContratual/Medicoes.jsx
git commit -m "feat(M9-C4): MedicoesList + Medicoes — m.valor + ImportExportDialog integrado"
```

---

## Verificação final

- [ ] **Rodar build limpo**

```bash
npm run build 2>&1 | grep -E "error|warning" | head -20
```

Esperado: sem erros.

- [ ] **Testar fluxo completo no browser**

1. `/admin-contratual/contratos` → Novo Contrato: verificar status (A iniciar/Em andamento/Concluído/Paralisado), tipo (Fornecimento + Serviço), valor com formatação BR (ponto milhar + vírgula decimal)
2. Clicar num contrato → Detalhes: verificar seção Aditivos + botão "+ Aditivo"
3. Adicionar um aditivo com prazo_dias=30 e status=Assinado → verificar "Término Atual" calculado no card de vigência
4. Clicar "Nova Medição" no detalhe do contrato → form abre sem campos obsoletos → valor calculado ao adicionar itens
5. `/admin-contratual/medicoes` → "Importar / Exportar" → verificar dialog abre corretamente

- [ ] **Commit final de doc**

```bash
git add PLAN.md
git commit -m "docs(M9): marcar tasks C1-C4 como concluídas em PLAN.md"
```

Atualizar PLAN.md marcando as tasks do Módulo 9 (C1–C4) com `[x]`.
