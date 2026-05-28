# M10 RDO — Reescrita Completa Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reescrever o módulo RDO usando a tabela dedicada `rdo` (nova migration), desacoplando-o de `registros`; implementar clima independente, MO/Equipamentos com novos campos, VincularAtividadesDialog multi-seleção, upload de evidências e importação em massa.

**Architecture:** Criar tabela `rdo` no banco + entidade `Rdo` em supabaseEntities.js. Extrair `RDOForm`, `RDODetail` e `VincularAtividadesDialog` para arquivos próprios; `RDOModule.jsx` vira orquestrador de estado com lista, filtros e `ImportExportDialog`. Nenhum dado de `registros` é migrado (não há RDOs reais lá).

**Tech Stack:** React 18 + JSX, TanStack React Query 5, Supabase JS Client, Supabase Storage bucket `rdo-evidencias`, `ImportExportDialog` / `ColumnMappingDialog` existentes em `src/components/ui/`.

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `docs/database/supabase-migration-m10-rdo.sql` | Criar | DDL da tabela `rdo` + RLS + index |
| `src/api/supabaseEntities.js` | Modificar | Adicionar `Rdo: 'rdo'` ao TABLE_MAP |
| `src/components/rdo/VincularAtividadesDialog.jsx` | Criar | Dialog de seleção múltipla de tarefas do cronograma |
| `src/components/rdo/RDOForm.jsx` | Criar | Formulário criar/editar com todos os campos do novo schema |
| `src/components/rdo/RDODetail.jsx` | Criar | Modal de visualização detalhada |
| `src/components/rdo/RDOModule.jsx` | Reescrever | Orquestrador: lista, filtros, ImportExportDialog |

> `src/components/pleitos/RDOsList.jsx` — componente órfão (não importado em nenhum lugar), não precisa ser atualizado.

---

## Task 1: Migration SQL — criar tabela `rdo`

**Files:**
- Create: `docs/database/supabase-migration-m10-rdo.sql`

- [ ] **Step 1: Criar o arquivo de migration**

Crie `docs/database/supabase-migration-m10-rdo.sql` com o conteúdo:

```sql
-- M10: tabela rdo dedicada, desacoplada de registros
-- Bucket de storage: criar manualmente em Supabase Dashboard → Storage → New bucket "rdo-evidencias" (public: false)

CREATE TABLE IF NOT EXISTS rdo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  numero TEXT,
  data DATE NOT NULL,
  area TEXT,
  disciplinas JSONB DEFAULT '[]',
  clima JSONB DEFAULT '{}',
  mao_de_obra JSONB DEFAULT '[]',
  equipamentos JSONB DEFAULT '[]',
  atividades_vinculadas JSONB DEFAULT '[]',
  ocorrencias JSONB DEFAULT '[]',
  evidencias JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE rdo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated full access rdo"
  ON rdo FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS rdo_projeto_data_idx ON rdo (projeto_id, data DESC);
```

- [ ] **Step 2: Aplicar a migration via Supabase MCP**

Execute o SQL no projeto `wkehlydccqrvybbblyeh` usando a ferramenta `mcp__plugin_supabase_supabase__apply_migration`.

- [ ] **Step 3: Verificar que a tabela foi criada**

Execute: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'rdo' ORDER BY ordinal_position;`

Esperado: ~12 colunas listadas (`id`, `projeto_id`, `numero`, `data`, `area`, `disciplinas`, `clima`, `mao_de_obra`, `equipamentos`, `atividades_vinculadas`, `ocorrencias`, `evidencias`, `created_at`, `updated_at`).

- [ ] **Step 4: Criar bucket de storage**

No Supabase Dashboard → Storage → "New bucket":
- Nome: `rdo-evidencias`
- Public: desativado (signed URLs)

Alternativa via SQL:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('rdo-evidencias', 'rdo-evidencias', false)
ON CONFLICT DO NOTHING;
```

- [ ] **Step 5: Commit**

```bash
git add docs/database/supabase-migration-m10-rdo.sql
git commit -m "feat(M10): migration SQL tabela rdo + RLS + index"
```

---

## Task 2: Adicionar entidade Rdo em supabaseEntities.js

**Files:**
- Modify: `src/api/supabaseEntities.js:3-24`

- [ ] **Step 1: Adicionar Rdo ao TABLE_MAP**

Em `src/api/supabaseEntities.js`, linha 22 (após `Risco: 'riscos',`), adicione:

```js
const TABLE_MAP = {
  Projeto: 'projetos',
  Registro: 'registros',
  Pleito: 'pleitos',
  Acao: 'acoes',
  Financeiro: 'financeiros',
  Histograma: 'histogramas',
  AvancoFisico: 'avanco_fisico',
  MudancaContratual: 'mudancas_contratuais',
  Contrato: 'contratos',
  Medicao: 'medicoes',
  Aditivo: 'aditivos',
  TarefaCronograma: 'tarefas_cronograma',
  Commodity: 'commodities',
  LancamentoCommodity: 'lancamentos_commodity',
  ItemMAS: 'itens_mas',
  UnidadeMedida: 'unidades_medida',
  DocumentoEngenharia: 'documentos_engenharia',
  Item6WLA: 'itens_6wla',
  Risco: 'riscos',
  Usuario: 'usuarios',
  Rdo: 'rdo',
};
```

- [ ] **Step 2: Verificar no browser**

Abra o console do browser com `npm run dev` já rodando e execute:
```js
import { entities } from '/src/api/supabaseEntities.js'
typeof entities.Rdo.filter // deve ser 'function'
```

Ou simplesmente rode `npm run dev` e confirme que não há erros de compilação.

- [ ] **Step 3: Commit**

```bash
git add src/api/supabaseEntities.js
git commit -m "feat(M10): adicionar entidade Rdo ao supabaseEntities"
```

---

## Task 3: Criar VincularAtividadesDialog.jsx

**Files:**
- Create: `src/components/rdo/VincularAtividadesDialog.jsx`

- [ ] **Step 1: Criar o componente**

Crie `src/components/rdo/VincularAtividadesDialog.jsx`:

```jsx
import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DISCIPLINAS = ["Mecânica", "Elétrica", "Estrutura Metálica", "Tubulação", "Instrumentação", "Civil", "Pintura"];

export function VincularAtividadesDialog({ open, onClose, onConfirm, tarefas = [], selectedIds = [] }) {
  const [search, setSearch] = useState("");
  const [disciplinaFiltro, setDisciplinaFiltro] = useState("");
  const [checked, setChecked] = useState(new Set());

  useEffect(() => {
    if (open) {
      setSearch("");
      setDisciplinaFiltro("");
      setChecked(new Set(selectedIds));
    }
  }, [open]);

  const filtered = useMemo(() =>
    tarefas.filter(t => {
      const nome = t.nome || t.titulo || t.descricao || "";
      const matchSearch = !search || nome.toLowerCase().includes(search.toLowerCase());
      const matchDisc = !disciplinaFiltro || (t.disciplina || "") === disciplinaFiltro;
      return matchSearch && matchDisc;
    }),
    [tarefas, search, disciplinaFiltro]
  );

  const toggle = (id) => setChecked(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleConfirm = () => {
    onConfirm([...checked]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 gap-0">
        <div className="px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-bold text-foreground">Vincular Atividades ao Cronograma</h2>
        </div>
        <div className="px-6 py-3 border-b border-border shrink-0 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              className="w-full border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Buscar tarefa..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground"
            value={disciplinaFiltro}
            onChange={e => setDisciplinaFiltro(e.target.value)}
          >
            <option value="">Todas as disciplinas</option>
            {DISCIPLINAS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1 min-h-0">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma tarefa encontrada</p>
          )}
          {filtered.map(t => {
            const nome = t.nome || t.titulo || t.descricao || t.id;
            const isChecked = checked.has(t.id);
            const inicio = t.data_inicio_planejada;
            const fim = t.data_fim_planejada;
            return (
              <label
                key={t.id}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isChecked ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-muted"}`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 accent-blue-600 shrink-0"
                  checked={isChecked}
                  onChange={() => toggle(t.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{nome}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.disciplina && <span className="mr-2">{t.disciplina}</span>}
                    {inicio && fim && (
                      <span>
                        {format(new Date(inicio + "T00:00:00"), "dd/MM/yy", { locale: ptBR })}
                        {" → "}
                        {format(new Date(fim + "T00:00:00"), "dd/MM/yy", { locale: ptBR })}
                      </span>
                    )}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
        <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{checked.size} selecionada(s)</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleConfirm}>Confirmar Vínculo</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verificar compilação**

Execute `npm run dev` e confirme que não há erros de compilação relacionados ao novo arquivo.

- [ ] **Step 3: Commit**

```bash
git add src/components/rdo/VincularAtividadesDialog.jsx
git commit -m "feat(M10): VincularAtividadesDialog — multi-seleção com busca e filtro"
```

---

## Task 4: Criar RDOForm.jsx

**Files:**
- Create: `src/components/rdo/RDOForm.jsx`

- [ ] **Step 1: Criar o componente**

Crie `src/components/rdo/RDOForm.jsx`:

```jsx
import { useState, useEffect, useRef } from "react";
import { entities } from "@/api/supabaseEntities";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  X, Plus, ChevronDown, ChevronUp, Sun, Cloud, CloudRain,
  CheckCircle, XCircle, Upload, Link2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { VincularAtividadesDialog } from "./VincularAtividadesDialog";

const DISCIPLINAS = ["Mecânica", "Elétrica", "Estrutura Metálica", "Tubulação", "Instrumentação", "Civil", "Pintura"];
const CARGOS = ["Encarregado", "Soldador", "Caldeireiro", "Eletricista", "Instrumentista", "Ajudante", "Operador de Máquina", "Pedreiro"];
const EQUIPAMENTOS_LISTA = ["Guindaste", "Retroescavadeira", "Compressor", "Andaime", "Caminhão", "Gerador", "Perfuratriz", "Munck"];
const CATEGORIAS_OCORRENCIA = ["Engenharia", "Suprimentos", "Planejamento", "Construção", "Contratos", "Qualidade/SSMA"];

const inputCls = "w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-background text-foreground";

const EMPTY_TURNO = { ativo: false, condicao: "", praticabilidade: "" };

function emptyRdo() {
  return {
    numero: "",
    data: new Date().toISOString().split("T")[0],
    area: "",
    disciplinas: [],
    clima: {
      manha: { ...EMPTY_TURNO },
      tarde: { ...EMPTY_TURNO },
      noite: { ...EMPTY_TURNO },
    },
    mao_de_obra: [],
    equipamentos: [],
    atividades_vinculadas: [],
    ocorrencias: [],
    evidencias: [],
  };
}

function ClimaBtn({ label, icon: Icon, active, onClick, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${active ? "border-transparent text-white" : "border-border text-muted-foreground bg-background"}`}
      style={active ? { backgroundColor: color } : {}}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}{label}
    </button>
  );
}

async function uploadFiles(projectId, rdoId, files) {
  const uploaded = [];
  for (const file of files) {
    const path = `${projectId}/${rdoId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from("rdo-evidencias")
      .upload(path, file, { upsert: false });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage
      .from("rdo-evidencias")
      .getPublicUrl(path);
    uploaded.push({ nome: file.name, url: publicUrl, tipo: file.type, tamanho: file.size });
  }
  return uploaded;
}

export function RDOForm({ rdo, selectedProjectId, casos, tarefas, onClose, onSaved }) {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [vincularDialog, setVincularDialog] = useState(null);
  const [openPanels, setOpenPanels] = useState({ mdo: true, equip: false, ativ: false, evid: false, ocorr: false });

  const [form, setForm] = useState(() => {
    if (!rdo) return emptyRdo();
    return {
      numero: rdo.numero || "",
      data: rdo.data || new Date().toISOString().split("T")[0],
      area: rdo.area || "",
      disciplinas: rdo.disciplinas || [],
      clima: rdo.clima ?? { manha: { ...EMPTY_TURNO }, tarde: { ...EMPTY_TURNO }, noite: { ...EMPTY_TURNO } },
      mao_de_obra: rdo.mao_de_obra || [],
      equipamentos: rdo.equipamentos || [],
      atividades_vinculadas: rdo.atividades_vinculadas || [],
      ocorrencias: rdo.ocorrencias || [],
      evidencias: rdo.evidencias || [],
    };
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const togglePanel = k => setOpenPanels(p => ({ ...p, [k]: !p[k] }));

  const toggleDisciplina = d => {
    const arr = form.disciplinas;
    set("disciplinas", arr.includes(d) ? arr.filter(x => x !== d) : [...arr, d]);
  };

  const setClimaTurno = (turno, field, value) =>
    set("clima", { ...form.clima, [turno]: { ...form.clima[turno], [field]: value } });

  const addMdo = () => set("mao_de_obra", [...form.mao_de_obra, { nome: "", funcao: "", quantidade: "1" }]);
  const setMdo = (i, k, v) => { const arr = [...form.mao_de_obra]; arr[i] = { ...arr[i], [k]: v }; set("mao_de_obra", arr); };
  const removeMdo = i => set("mao_de_obra", form.mao_de_obra.filter((_, j) => j !== i));

  const addEquip = () => set("equipamentos", [...form.equipamentos, { nome: "", identificacao: "", quantidade: "1" }]);
  const setEquip = (i, k, v) => { const arr = [...form.equipamentos]; arr[i] = { ...arr[i], [k]: v }; set("equipamentos", arr); };
  const removeEquip = i => set("equipamentos", form.equipamentos.filter((_, j) => j !== i));

  const addOcorrencia = () => set("ocorrencias", [
    ...form.ocorrencias,
    { id: crypto.randomUUID(), descricao: "", responsabilidade: "", categorias: [], pleito_id: null, atividades_vinculadas: [] },
  ]);
  const setOcorrencia = (i, k, v) => { const arr = [...form.ocorrencias]; arr[i] = { ...arr[i], [k]: v }; set("ocorrencias", arr); };
  const removeOcorrencia = i => set("ocorrencias", form.ocorrencias.filter((_, j) => j !== i));
  const toggleOcorrCategoria = (i, cat) => {
    const cats = form.ocorrencias[i].categorias || [];
    setOcorrencia(i, "categorias", cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat]);
  };

  const removePendingFile = idx => setPendingFiles(prev => prev.filter((_, i) => i !== idx));
  const removeExistingEvidencia = idx => set("evidencias", form.evidencias.filter((_, i) => i !== idx));

  const openVincular = field => {
    const currentIds = field === "root"
      ? form.atividades_vinculadas
      : (form.ocorrencias[field]?.atividades_vinculadas || []);
    setVincularDialog({ field, currentIds });
  };

  const confirmVincular = ids => {
    if (vincularDialog.field === "root") {
      set("atividades_vinculadas", ids);
    } else {
      setOcorrencia(vincularDialog.field, "atividades_vinculadas", ids);
    }
    setVincularDialog(null);
  };

  const atividadeNome = id => {
    const t = (tarefas || []).find(t => t.id === id);
    return t?.nome || t?.titulo || id;
  };

  const handleSave = async () => {
    if (!form.data) {
      toast({ title: "Data obrigatória", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      let novasEvidencias = [...form.evidencias];
      if (pendingFiles.length > 0) {
        const tempId = rdo?.id || crypto.randomUUID();
        const uploaded = await uploadFiles(selectedProjectId, tempId, pendingFiles);
        novasEvidencias = [...novasEvidencias, ...uploaded];
      }
      const data = { ...form, evidencias: novasEvidencias, projeto_id: selectedProjectId };
      if (rdo?.id) await entities.Rdo.update(rdo.id, data);
      else await entities.Rdo.create(data);
      onSaved();
    } catch (e) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const PanelHeader = ({ label, panelKey }) => (
    <button type="button" onClick={() => togglePanel(panelKey)}
      className="w-full flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {openPanels[panelKey] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-card z-10 flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">
            {rdo ? "Editar RDO" : "Novo Relatório Diário de Obra"}
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground hover:text-foreground" /></button>
        </div>

        <div className="p-6 space-y-5">

          {/* Cabeçalho */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nº RDO</label>
              <input className={inputCls} placeholder="RDO-001" value={form.numero} onChange={e => set("numero", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Data</label>
              <input type="date" className={inputCls} value={form.data} onChange={e => set("data", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Área</label>
              <input className={inputCls} placeholder="Área A" value={form.area} onChange={e => set("area", e.target.value)} />
            </div>
          </div>

          {/* Disciplinas */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Disciplinas</label>
            <div className="flex flex-wrap gap-2">
              {DISCIPLINAS.map(d => (
                <button key={d} type="button" onClick={() => toggleDisciplina(d)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${form.disciplinas.includes(d) ? "bg-blue-600 text-white border-transparent" : "border-border text-muted-foreground bg-background"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Condições Climáticas */}
          <div>
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Condições Climáticas por Turno</p>
            <div className="space-y-3">
              {[{ key: "manha", label: "Manhã" }, { key: "tarde", label: "Tarde" }, { key: "noite", label: "Noite" }].map(turno => {
                const t = form.clima[turno.key];
                return (
                  <div key={turno.key} className="p-3 border border-border rounded-xl space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 accent-blue-500"
                        checked={t.ativo}
                        onChange={e => setClimaTurno(turno.key, "ativo", e.target.checked)} />
                      <span className="text-sm font-medium text-foreground">{turno.label}</span>
                    </label>
                    {t.ativo && (
                      <div className="pl-6 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground w-20 shrink-0">Condição:</span>
                          <ClimaBtn label="Sol" icon={Sun} active={t.condicao === "Sol"} color="#f59e0b"
                            onClick={() => setClimaTurno(turno.key, "condicao", t.condicao === "Sol" ? "" : "Sol")} />
                          <ClimaBtn label="Nublado" icon={Cloud} active={t.condicao === "Nublado"} color="#6b7280"
                            onClick={() => setClimaTurno(turno.key, "condicao", t.condicao === "Nublado" ? "" : "Nublado")} />
                          <ClimaBtn label="Chuva" icon={CloudRain} active={t.condicao === "Chuva"} color="#3b82f6"
                            onClick={() => setClimaTurno(turno.key, "condicao", t.condicao === "Chuva" ? "" : "Chuva")} />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground w-20 shrink-0">Praticab.:</span>
                          <ClimaBtn label="Praticável" icon={CheckCircle} active={t.praticabilidade === "Praticável"} color="#16a34a"
                            onClick={() => setClimaTurno(turno.key, "praticabilidade", t.praticabilidade === "Praticável" ? "" : "Praticável")} />
                          <ClimaBtn label="Impraticável" icon={XCircle} active={t.praticabilidade === "Impraticável"} color="#dc2626"
                            onClick={() => setClimaTurno(turno.key, "praticabilidade", t.praticabilidade === "Impraticável" ? "" : "Impraticável")} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mão de Obra */}
          <div className="space-y-2">
            <PanelHeader label="👥 Mão de Obra" panelKey="mdo" />
            {openPanels.mdo && (
              <div className="border border-border rounded-xl p-4 space-y-2">
                {form.mao_de_obra.map((m, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input className={`${inputCls} flex-1`} placeholder="Nome ou empresa" value={m.nome}
                      onChange={e => setMdo(i, "nome", e.target.value)} />
                    <select className={`${inputCls} flex-1`} value={m.funcao}
                      onChange={e => setMdo(i, "funcao", e.target.value)}>
                      <option value="">Função...</option>
                      {CARGOS.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <input type="number" min={1} className={`${inputCls} w-20`} placeholder="Qtd" value={m.quantidade}
                      onChange={e => setMdo(i, "quantidade", e.target.value)} />
                    <button onClick={() => removeMdo(i)} className="text-red-400 hover:text-red-600 shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={addMdo} className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                  <Plus className="w-3 h-3" />Adicionar função
                </button>
              </div>
            )}
          </div>

          {/* Equipamentos */}
          <div className="space-y-2">
            <PanelHeader label="🚜 Equipamentos" panelKey="equip" />
            {openPanels.equip && (
              <div className="border border-border rounded-xl p-4 space-y-2">
                {form.equipamentos.map((eq, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select className={`${inputCls} flex-1`} value={eq.nome}
                      onChange={e => setEquip(i, "nome", e.target.value)}>
                      <option value="">Equipamento...</option>
                      {EQUIPAMENTOS_LISTA.map(e => <option key={e}>{e}</option>)}
                    </select>
                    <input className={`${inputCls} flex-1`} placeholder="TAG ou identificação" value={eq.identificacao}
                      onChange={e => setEquip(i, "identificacao", e.target.value)} />
                    <input type="number" min={1} className={`${inputCls} w-20`} placeholder="Qtd" value={eq.quantidade}
                      onChange={e => setEquip(i, "quantidade", e.target.value)} />
                    <button onClick={() => removeEquip(i)} className="text-red-400 hover:text-red-600 shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={addEquip} className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                  <Plus className="w-3 h-3" />Adicionar equipamento
                </button>
              </div>
            )}
          </div>

          {/* Atividades Produzidas */}
          <div className="space-y-2">
            <PanelHeader label="📋 Atividades Produzidas" panelKey="ativ" />
            {openPanels.ativ && (
              <div className="border border-border rounded-xl p-4 space-y-3">
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => openVincular("root")}>
                  <Link2 className="w-4 h-4" />Vincular Atividades
                </Button>
                {form.atividades_vinculadas.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.atividades_vinculadas.map((id, idx) => (
                      <span key={id} className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                        {atividadeNome(id)}
                        <button type="button"
                          onClick={() => set("atividades_vinculadas", form.atividades_vinculadas.filter((_, i) => i !== idx))}
                          className="ml-0.5 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ocorrências e Impactos */}
          <div className="space-y-2">
            <PanelHeader label="⚠️ Ocorrências e Impactos" panelKey="ocorr" />
            {openPanels.ocorr && (
              <div className="border border-border rounded-xl p-4 space-y-4">
                {form.ocorrencias.map((oc, i) => (
                  <div key={oc.id} className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Ocorrência {i + 1}</span>
                      <button onClick={() => removeOcorrencia(i)} className="text-red-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea className={inputCls} rows={3}
                      placeholder="Descreva o evento, anomalia ou interrupção..."
                      value={oc.descricao}
                      onChange={e => setOcorrencia(i, "descricao", e.target.value)} />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Responsabilidade</label>
                        <select className={inputCls} value={oc.responsabilidade}
                          onChange={e => setOcorrencia(i, "responsabilidade", e.target.value)}>
                          <option value="">Selecione...</option>
                          <option>Contratada</option>
                          <option>Contratante</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Vincular a Pleito</label>
                        <select className={inputCls} value={oc.pleito_id || ""}
                          onChange={e => setOcorrencia(i, "pleito_id", e.target.value || null)}>
                          <option value="">Nenhum</option>
                          {(casos || []).map(c => (
                            <option key={c.id} value={c.id}>{c.titulo?.substring(0, 40)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">Categorias de Impacto</label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIAS_OCORRENCIA.map(cat => (
                          <button key={cat} type="button" onClick={() => toggleOcorrCategoria(i, cat)}
                            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${(oc.categorias || []).includes(cat) ? "border-transparent bg-ocre text-white" : "border-border text-muted-foreground bg-background"}`}>
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => openVincular(i)}>
                        <Link2 className="w-4 h-4" />Vincular Atividades
                      </Button>
                      {(oc.atividades_vinculadas || []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {oc.atividades_vinculadas.map((id, idx) => (
                            <span key={id} className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                              {atividadeNome(id)}
                              <button type="button"
                                onClick={() => setOcorrencia(i, "atividades_vinculadas", oc.atividades_vinculadas.filter((_, j) => j !== idx))}
                                className="ml-0.5 hover:text-red-500">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <button onClick={addOcorrencia}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" />Adicionar Ocorrência
                </button>
              </div>
            )}
          </div>

          {/* Evidências */}
          <div className="space-y-2">
            <PanelHeader label="📷 Evidências" panelKey="evid" />
            {openPanels.evid && (
              <div className="border border-border rounded-xl p-4 space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Clique para anexar fotos ou arraste os arquivos</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, PDF até 10MB</p>
                </div>
                <input ref={fileInputRef} type="file" multiple accept="image/*,application/pdf"
                  className="hidden" onChange={e => setPendingFiles(prev => [...prev, ...Array.from(e.target.files)])} />
                {form.evidencias.map((ev, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border border-border rounded-lg">
                    <span className="text-xs flex-1 truncate text-foreground">{ev.nome}</span>
                    <button type="button" onClick={() => removeExistingEvidencia(i)}
                      className="text-red-400 hover:text-red-600 shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {pendingFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                    <span className="text-xs flex-1 truncate text-blue-700 dark:text-blue-300">
                      {f.name} <span className="text-blue-400">(pendente)</span>
                    </span>
                    <button type="button" onClick={() => removePendingFile(i)}
                      className="text-red-400 hover:text-red-600 shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="save" disabled={loading} onClick={handleSave}>
            {loading ? "Salvando..." : rdo ? "Salvar Alterações" : "Finalizar e Enviar RDO"}
          </Button>
        </div>
      </div>

      {vincularDialog && (
        <VincularAtividadesDialog
          open={true}
          onClose={() => setVincularDialog(null)}
          onConfirm={confirmVincular}
          tarefas={tarefas || []}
          selectedIds={vincularDialog.currentIds}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar compilação**

Execute `npm run dev`. Não deve haver erros de importação ou JSX.

- [ ] **Step 3: Commit**

```bash
git add src/components/rdo/RDOForm.jsx
git commit -m "feat(M10-RDO-1,2,3,4): RDOForm — nova tabela rdo, clima desacoplado, MO/equip padronizados, VincularAtividades, upload evidências"
```

---

## Task 5: Criar RDODetail.jsx

**Files:**
- Create: `src/components/rdo/RDODetail.jsx`

- [ ] **Step 1: Criar o componente**

Crie `src/components/rdo/RDODetail.jsx`:

```jsx
import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function ClimaDisplay({ turno }) {
  if (!turno?.ativo) return <span className="text-muted-foreground/40 text-xs">—</span>;
  return (
    <div>
      {turno.condicao && <p className="text-xs font-medium text-foreground">{turno.condicao}</p>}
      {turno.praticabilidade && (
        <p className={`text-xs font-medium ${turno.praticabilidade === "Praticável" ? "text-status-positive" : "text-blue-600 dark:text-blue-400"}`}>
          {turno.praticabilidade}
        </p>
      )}
    </div>
  );
}

export function RDODetail({ rdo, casos, tarefas, onClose }) {
  const atividadeNome = id => {
    const t = (tarefas || []).find(t => t.id === id);
    return t?.nome || t?.titulo || id;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        <div className="sticky top-0 bg-card z-10 flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground">
              {rdo.numero || "RDO"} —{" "}
              {rdo.data ? format(new Date(rdo.data + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : ""}
            </h2>
            {rdo.area && <p className="text-xs text-muted-foreground mt-0.5">Área: {rdo.area}</p>}
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="p-6 space-y-5 text-sm">

          {/* Disciplinas */}
          {rdo.disciplinas?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {rdo.disciplinas.map(d => (
                <span key={d} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">{d}</span>
              ))}
            </div>
          )}

          {/* Clima */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-2 text-muted-foreground">Condições Climáticas</p>
            <div className="grid grid-cols-3 gap-3">
              {[["Manhã", rdo.clima?.manha], ["Tarde", rdo.clima?.tarde], ["Noite", rdo.clima?.noite]].map(([label, t]) => (
                <div key={label} className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <ClimaDisplay turno={t} />
                </div>
              ))}
            </div>
          </div>

          {/* MO */}
          {rdo.mao_de_obra?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-2 text-muted-foreground">👥 Mão de Obra</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left py-2 px-3">Nome</th>
                    <th className="text-left py-2 px-3">Função</th>
                    <th className="text-left py-2 px-3">Qtd</th>
                  </tr>
                </thead>
                <tbody>
                  {rdo.mao_de_obra.map((m, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="py-2 px-3">{m.nome || "—"}</td>
                      <td className="py-2 px-3">{m.funcao || "—"}</td>
                      <td className="py-2 px-3 font-bold">{m.quantidade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Equipamentos */}
          {rdo.equipamentos?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-2 text-muted-foreground">🚜 Equipamentos</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left py-2 px-3">Equipamento</th>
                    <th className="text-left py-2 px-3">Identificação</th>
                    <th className="text-left py-2 px-3">Qtd</th>
                  </tr>
                </thead>
                <tbody>
                  {rdo.equipamentos.map((e, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="py-2 px-3">{e.nome}</td>
                      <td className="py-2 px-3">{e.identificacao || "—"}</td>
                      <td className="py-2 px-3 font-bold">{e.quantidade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Atividades Vinculadas */}
          {rdo.atividades_vinculadas?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-2 text-muted-foreground">📋 Atividades Produzidas</p>
              <div className="flex flex-wrap gap-2">
                {rdo.atividades_vinculadas.map(id => (
                  <span key={id} className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                    {atividadeNome(id)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ocorrências */}
          {rdo.ocorrencias?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-2 text-muted-foreground">⚠️ Ocorrências</p>
              <div className="space-y-3">
                {rdo.ocorrencias.map((oc, i) => {
                  const pleito = (casos || []).find(c => c.id === oc.pleito_id);
                  return (
                    <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                      <p className="text-foreground">{oc.descricao}</p>
                      {oc.responsabilidade && (
                        <p className="text-xs text-muted-foreground">
                          Responsabilidade: <span className="font-semibold">{oc.responsabilidade}</span>
                        </p>
                      )}
                      {oc.categorias?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {oc.categorias.map(c => (
                            <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-ocre/15 text-ocre">{c}</span>
                          ))}
                        </div>
                      )}
                      {oc.atividades_vinculadas?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {oc.atividades_vinculadas.map(id => (
                            <span key={id} className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                              {atividadeNome(id)}
                            </span>
                          ))}
                        </div>
                      )}
                      {pleito && (
                        <p className="text-xs text-blue-600 dark:text-blue-400">🔗 Pleito: {pleito.titulo}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Evidências */}
          {rdo.evidencias?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-2 text-muted-foreground">📷 Evidências</p>
              <div className="flex flex-wrap gap-2">
                {rdo.evidencias.map((ev, i) => (
                  <a key={i} href={ev.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg border border-border text-blue-600 dark:text-blue-400 hover:bg-muted transition-colors">
                    {ev.nome}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-muted border-t border-border px-6 py-3 flex gap-3 justify-end">
          <Button variant="outline" className="text-xs gap-1.5" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />Gerar PDF
          </Button>
          <Button onClick={onClose} className="text-xs">Fechar</Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/rdo/RDODetail.jsx
git commit -m "feat(M10): RDODetail — visualização com novo schema rdo"
```

---

## Task 6: Reescrever RDOModule.jsx

**Files:**
- Modify: `src/components/rdo/RDOModule.jsx` (reescrita completa)

- [ ] **Step 1: Substituir o conteúdo de RDOModule.jsx**

Reescreva `src/components/rdo/RDOModule.jsx` inteiro com:

```jsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Plus, Search, Eye, Trash2, Edit, Sun, CloudRain, Upload } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { RDOForm } from "./RDOForm";
import { RDODetail } from "./RDODetail";
import { ImportExportDialog } from "@/components/ui/import-export-dialog";

const RDO_COLUMNS = [
  { key: "numero", label: "Nº RDO", type: "string", required: true },
  { key: "data",   label: "Data",    type: "date",   required: true },
  { key: "area",   label: "Área",    type: "string", required: false },
];

export default function RDOModule({ selectedProjectId }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm]     = useState(false);
  const [editRDO, setEditRDO]       = useState(null);
  const [viewRDO, setViewRDO]       = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch]         = useState("");
  const [dateFrom, setDateFrom]     = useState("");
  const [dateTo, setDateTo]         = useState("");

  const { data: rdos = [], isLoading } = useQuery({
    queryKey: ["rdos", selectedProjectId],
    queryFn: () => entities.Rdo.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const { data: casos = [] } = useQuery({
    queryKey: ["pleitos", selectedProjectId],
    queryFn: () => entities.Pleito.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const { data: tarefas = [] } = useQuery({
    queryKey: ["tarefas_cronograma", selectedProjectId],
    queryFn: () => entities.TarefaCronograma.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const deleteMut = useMutation({
    mutationFn: id => entities.Rdo.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rdos"] }),
    onError: e => toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
  });

  const handleImport = async row => {
    await entities.Rdo.create({ ...row, projeto_id: selectedProjectId });
  };

  const onSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["rdos"] });
    setShowForm(false);
    setEditRDO(null);
  };

  const filtered = useMemo(() => {
    let result = rdos;
    if (search) result = result.filter(r =>
      (r.numero || r.area || "").toLowerCase().includes(search.toLowerCase())
    );
    if (dateFrom) result = result.filter(r => r.data && r.data >= dateFrom);
    if (dateTo)   result = result.filter(r => r.data && r.data <= dateTo);
    return result;
  }, [rdos, search, dateFrom, dateTo]);

  const climaCell = turno => {
    if (!turno?.ativo) return <span className="text-muted-foreground/40 text-xs">—</span>;
    const ok = turno.praticabilidade !== "Impraticável";
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${ok ? "text-status-positive" : "text-blue-700 dark:text-blue-400"}`}>
        {ok ? <Sun className="w-3 h-3" /> : <CloudRain className="w-3 h-3" />}
        {ok ? "Prat." : "Imprat."}
      </span>
    );
  };

  return (
    <div className="space-y-4">

      {/* Filtros */}
      <Card className="bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="text-xs text-muted-foreground mb-1 block">Busca</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  className="w-full border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm bg-background text-foreground"
                  placeholder="Nº RDO, área..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">De</label>
              <input type="date" className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground"
                value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Até</label>
              <input type="date" className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground"
                value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <Button variant="outline" onClick={() => setShowImport(true)} className="gap-1.5">
              <Upload className="w-4 h-4" />Importar
            </Button>
            <Button onClick={() => { setEditRDO(null); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-1" />Novo RDO
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted border-b border-border">
              {["Data", "Nº RDO", "Área", "Disciplinas", "Clima M/T/N", "MO", "Equip.", "Ocorrências", "Evidências", "Ações"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={10} className="py-12 text-center text-muted-foreground">Carregando...</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="py-16 text-center">
                  <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">Nenhum RDO registrado</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">Clique em "Novo RDO" para começar</p>
                </td>
              </tr>
            )}
            {filtered.map(rdo => {
              const nMdo   = (rdo.mao_de_obra  || []).reduce((s, m) => s + (parseInt(m.quantidade) || 0), 0);
              const nEquip = (rdo.equipamentos || []).reduce((s, e) => s + (parseInt(e.quantidade) || 0), 0);
              const nOcorr = (rdo.ocorrencias  || []).length;
              const nEvid  = (rdo.evidencias   || []).length;
              return (
                <tr key={rdo.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {rdo.data ? format(new Date(rdo.data + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono font-bold">{rdo.numero || "—"}</td>
                  <td className="px-4 py-3 text-xs max-w-24 truncate">{rdo.area || "—"}</td>
                  <td className="px-4 py-3">
                    {(rdo.disciplinas || []).length > 0
                      ? <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{rdo.disciplinas.join(", ")}</span>
                      : <span className="text-muted-foreground/50 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5">
                      {climaCell(rdo.clima?.manha)}
                      <span className="text-border text-xs">/</span>
                      {climaCell(rdo.clima?.tarde)}
                      <span className="text-border text-xs">/</span>
                      {climaCell(rdo.clima?.noite)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-bold">{nMdo > 0 ? nMdo : "—"}</td>
                  <td className="px-4 py-3 text-center text-xs font-bold">{nEquip > 0 ? nEquip : "—"}</td>
                  <td className="px-4 py-3 text-center">
                    {nOcorr > 0
                      ? <span className="text-xs bg-status-attention/15 text-status-attention px-2 py-0.5 rounded-full font-medium">{nOcorr}</span>
                      : <span className="text-muted-foreground/50 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {nEvid > 0
                      ? <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">{nEvid}</span>
                      : <span className="text-muted-foreground/50 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setViewRDO(rdo)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setEditRDO(rdo); setShowForm(true); }} className="p-1.5 text-muted-foreground hover:bg-muted rounded">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteMut.mutate(rdo.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <RDOForm
          rdo={editRDO}
          selectedProjectId={selectedProjectId}
          casos={casos}
          tarefas={tarefas}
          onClose={() => { setShowForm(false); setEditRDO(null); }}
          onSaved={onSaved}
        />
      )}

      {viewRDO && (
        <RDODetail rdo={viewRDO} casos={casos} tarefas={tarefas} onClose={() => setViewRDO(null)} />
      )}

      <ImportExportDialog
        open={showImport}
        onOpenChange={setShowImport}
        title="Importar / Exportar RDOs"
        exportFileName="rdos-export"
        columns={RDO_COLUMNS}
        onImport={handleImport}
        onExport={() => filtered}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verificar no browser**

Com `npm run dev` rodando, acesse `/admin-contratual/rdos`. Deve exibir:
- Barra de filtros com botões "Importar" e "Novo RDO"
- Tabela vazia com colunas: Data, Nº RDO, Área, Disciplinas, Clima M/T/N, MO, Equip., Ocorrências, Evidências, Ações
- Clicar em "Novo RDO" deve abrir o `RDOForm`
- Clicar em "Importar" deve abrir o `ImportExportDialog`
- Nenhum erro no console

- [ ] **Step 3: Teste funcional — criar um RDO**

1. Clique "Novo RDO"
2. Preencha: Nº `RDO-001`, Data (hoje), Área `Área A`
3. Ative turno Manhã → selecione Condição "Sol" e Praticabilidade "Praticável" (confirmar que são independentes: clicar em Sol não altera praticabilidade)
4. Adicione 1 item de Mão de Obra: Nome "Equipe A", Função "Soldador", Qtd 5
5. Adicione 1 Ocorrência: descrição "Chuva", responsabilidade "Contratante", categoria "Planejamento"
6. Clique "Finalizar e Enviar RDO"
7. Confirmar que o RDO aparece na tabela com os dados corretos

- [ ] **Step 4: Commit**

```bash
git add src/components/rdo/RDOModule.jsx
git commit -m "feat(M10): RDOModule reescrito — usa tabela rdo, ImportExportDialog, RDOForm/Detail extraídos"
```

---

## Task 7: Self-review de cobertura do spec

- [ ] **Step 1: Verificar RDO-1**
  - [ ] Botão "Anexar à Medição" removido: confirmar que `RDODetail.jsx` NÃO tem `Paperclip` nem "Anexar à Medição"
  - [ ] Label "Área / KM" → "Área": confirmar em `RDOForm.jsx` linha do campo `area`
  - [ ] Campo Data usa `type="date"` (não `datetime-local`): confirmar em `RDOForm.jsx`

- [ ] **Step 2: Verificar RDO-2**
  - [ ] Condição e Praticabilidade têm handlers separados (`setClimaTurno(turno.key, "condicao", ...)` e `setClimaTurno(turno.key, "praticabilidade", ...)`)
  - [ ] MO tem 3 campos: `nome` (input), `funcao` (select), `quantidade` (number)
  - [ ] Equipamentos tem 3 campos: `nome` (select), `identificacao` (input), `quantidade` (number) — sem campo "HM"

- [ ] **Step 3: Verificar RDO-3**
  - [ ] `VincularAtividadesDialog.jsx` existe em `src/components/rdo/`
  - [ ] Painel "Atividades Produzidas" tem botão "Vincular Atividades" que abre o dialog
  - [ ] Cada Ocorrência tem botão "Vincular Atividades" individual
  - [ ] Confirmar que selecionar atividades em um painel não afeta os outros (state isolado por `vincularDialog.field`)

- [ ] **Step 4: Verificar RDO-4**
  - [ ] Painel Evidências tem `<input type="file" multiple>` e exibe arquivos pendentes (azul) e salvos (border)
  - [ ] `RDOModule.jsx` tem botão "Importar" que abre `ImportExportDialog` com `RDO_COLUMNS`
  - [ ] `handleImport` chama `entities.Rdo.create`

- [ ] **Step 5: Commit final de ajustes**

Se foram necessários ajustes durante a verificação:
```bash
git add -p
git commit -m "fix(M10): ajustes de cobertura pós self-review"
```

Se não houve ajustes, não criar commit vazio.

---

## Verificação Final

- [ ] Abrir `/admin-contratual/rdos` no browser
- [ ] Criar RDO com todos os campos preenchidos (clima, MO, equipamentos, ocorrência com atividade vinculada, evidência)
- [ ] Salvar e confirmar que aparece na tabela com os dados corretos
- [ ] Abrir o detail (botão olho) e confirmar que todos os dados exibem corretamente
- [ ] Editar o RDO e confirmar que os dados carregam corretamente no formulário
- [ ] Testar importação: CSV com colunas "Nº RDO" e "Data" → confirmar que importa sem erros
- [ ] Confirmar ausência de erros no console do browser
