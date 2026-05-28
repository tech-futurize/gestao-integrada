# M11 Registros REG-1 + REG-2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar filtros Responsabilidade + Período, remover campo Hora e implementar upload de anexos + modal "Vincular Atividades" no módulo Registros.

**Architecture:** Migração de schema adiciona `tipo_registro` e `responsabilidade` à tabela `registros` e cria o bucket `registros-anexos`. As mudanças de UI ficam concentradas em dois arquivos: `Registros.jsx` (página/filtros) e `RegistroForm.jsx` (formulário). O upload usa `supabase.storage` diretamente; URLs e metadados são persistidos no campo JSONB `anexos`. A vinculação de atividades usa o campo JSONB `atividades_vinculadas` já existente.

**Tech Stack:** React 18, TanStack React Query 5, Supabase JS Client (Auth + Storage), shadcn/ui (Dialog, Checkbox, Badge), date-fns, Lucide React

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `docs/database/supabase-migration-m11-registros.sql` | Criar | SQL de migração de schema + bucket storage |
| `src/pages/AdminContratual/Registros.jsx` | Editar | Filtros Responsabilidade/Período, query de tarefas, chips nos cards |
| `src/components/pleitos/RegistroForm.jsx` | Editar | Campo date-only, seção de anexos, modal "Vincular Atividades" |

---

## Task 1: Migração de Schema e Bucket de Storage

**Files:**
- Create: `docs/database/supabase-migration-m11-registros.sql`

### Contexto

A tabela `registros` no banco não tem as colunas `tipo_registro` nem `responsabilidade` que o código já referencia. O bucket de storage `registros-anexos` também ainda não existe. Esta task cria ambos.

- [ ] **Step 1.1: Criar o arquivo SQL de migração**

Criar `docs/database/supabase-migration-m11-registros.sql` com o seguinte conteúdo:

```sql
-- M11 Registros: adiciona colunas ausentes e cria bucket de storage
-- Execute APENAS UMA VEZ via Supabase SQL Editor ou apply_migration

-- 1. Colunas de schema
ALTER TABLE registros ADD COLUMN IF NOT EXISTS tipo_registro TEXT DEFAULT 'Ata de Reunião';
ALTER TABLE registros ADD COLUMN IF NOT EXISTS responsabilidade TEXT;

-- 2. Bucket de storage para anexos de registros
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'registros-anexos',
  'registros-anexos',
  true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp','application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de storage
CREATE POLICY "registros-anexos: upload autenticado"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'registros-anexos');

CREATE POLICY "registros-anexos: leitura pública"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'registros-anexos');

CREATE POLICY "registros-anexos: deleção autenticada"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'registros-anexos');
```

- [ ] **Step 1.2: Aplicar a migração no Supabase**

Usar o Supabase MCP tool `apply_migration` com `project_id = "wkehlydccqrvybbblyeh"` e o conteúdo do arquivo SQL acima.

- [ ] **Step 1.3: Verificar as colunas foram criadas**

Executar via `execute_sql`:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'registros'
  AND column_name IN ('tipo_registro', 'responsabilidade')
ORDER BY column_name;
```
Resultado esperado: 2 linhas (`responsabilidade text null`, `tipo_registro text 'Ata de Reunião'`).

- [ ] **Step 1.4: Verificar bucket foi criado**

Executar via `execute_sql`:
```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'registros-anexos';
```
Resultado esperado: 1 linha com `public = true`.

- [ ] **Step 1.5: Commit**

```bash
git add docs/database/supabase-migration-m11-registros.sql
git commit -m "feat(M11): migração schema registros + bucket registros-anexos"
```

---

## Task 2: REG-1 — Campo Data (sem Hora) no RegistroForm

**Files:**
- Modify: `src/components/pleitos/RegistroForm.jsx`

### Contexto

O campo `data_hora` no formulário usa `datetime-local` (data + hora). A spec pede que exiba apenas data. O utilitário `toDateInput` já existe em `@/lib/dateUtils` e converte um timestamp UTC para `YYYY-MM-DD`. O `toUtcIso` continua funcionando com strings de data pura (`new Date("2026-05-28")` → UTC midnight).

- [ ] **Step 2.1: Atualizar import de dateUtils**

Em `src/components/pleitos/RegistroForm.jsx`, linha 2, o import atual é:
```js
import { toDatetimeLocal, toUtcIso } from "@/lib/dateUtils";
```

Trocar por:
```js
import { toDateInput, toUtcIso } from "@/lib/dateUtils";
```

- [ ] **Step 2.2: Atualizar o estado inicial de data_hora**

Em `src/components/pleitos/RegistroForm.jsx`, dentro do `useState` do `formData` (linha ~22), o campo `data_hora` está assim:
```js
data_hora: toDatetimeLocal(incidente?.data_hora) || toDatetimeLocal(new Date()),
```

Trocar por:
```js
data_hora: toDateInput(incidente?.data_hora) || new Date().toISOString().slice(0, 10),
```

- [ ] **Step 2.3: Atualizar o input de data no JSX**

Em `src/components/pleitos/RegistroForm.jsx`, o bloco do campo data (linhas ~113–117) está assim:
```jsx
<div className="space-y-2">
  <Label>Data e Hora *</Label>
  <Input type="datetime-local" value={formData.data_hora}
    onChange={(e) => set("data_hora", e.target.value)} required />
</div>
```

Trocar por:
```jsx
<div className="space-y-2">
  <Label>Data *</Label>
  <Input type="date" value={formData.data_hora}
    onChange={(e) => set("data_hora", e.target.value)} required />
</div>
```

- [ ] **Step 2.4: Verificar que handleSubmit já funciona com date-only**

O `handleSubmit` chama `toUtcIso(formData.data_hora)`. A função `toUtcIso` faz `new Date(val).toISOString()`. Com valor `"2026-05-28"`, `new Date("2026-05-28")` é interpretado como UTC midnight → `"2026-05-28T00:00:00.000Z"`. Comportamento correto — nenhuma mudança necessária em `handleSubmit`.

- [ ] **Step 2.5: Commit**

```bash
git add src/components/pleitos/RegistroForm.jsx
git commit -m "fix(M11-REG1): campo data_hora usa date-only no RegistroForm"
```

---

## Task 3: REG-1 — Filtros Responsabilidade e Período no Registros.jsx

**Files:**
- Modify: `src/pages/AdminContratual/Registros.jsx`

### Contexto

`Registros.jsx` já tem um `FilterBar` com filtros de Tipo e Status. Precisa adicionar: (1) filtro de Responsabilidade via `FilterBar`, (2) dois inputs de data (período), (3) lógica de filtragem correspondente no `useMemo`, (4) exibição de data sem hora nos cards.

- [ ] **Step 3.1: Adicionar imports de CalendarRange**

No topo de `src/pages/AdminContratual/Registros.jsx`, o import do Lucide está assim:
```js
import { Plus, AlertTriangle, Search, Edit, Trash2 } from "lucide-react";
```

Trocar por:
```js
import { Plus, AlertTriangle, Search, Edit, Trash2, CalendarRange } from "lucide-react";
```

- [ ] **Step 3.2: Adicionar estado de período**

Em `src/pages/AdminContratual/Registros.jsx`, logo após as declarações de estado existentes (após `const [filtros, setFiltros] = useState({});`), adicionar:

```js
const [dateFrom, setDateFrom] = useState("");
const [dateTo, setDateTo] = useState("");
```

- [ ] **Step 3.3: Atualizar o useMemo filtered**

O `filtered` useMemo atual (linhas ~84–100) está assim:
```js
const filtered = useMemo(() => {
  const tp = filtros.tipo || [];
  const st = filtros.status || [];
  return baseList.filter((inc) => {
    if (tp.length > 0 && !tp.includes(inc.tipo_registro)) return false;
    if (st.length > 0 && !st.includes(inc.status)) return false;
    const needle = searchText.toLowerCase();
    if (needle) {
      const matchText =
        (inc.descricao || "").toLowerCase().includes(needle) ||
        (inc.tipo_registro || "").toLowerCase().includes(needle) ||
        (inc.responsavel_registro || "").toLowerCase().includes(needle);
      if (!matchText) return false;
    }
    return true;
  });
}, [baseList, filtros, searchText]);
```

Substituir por:
```js
const filtered = useMemo(() => {
  const tp = filtros.tipo || [];
  const st = filtros.status || [];
  const resp = filtros.responsabilidade || [];
  return baseList.filter((inc) => {
    if (tp.length > 0 && !tp.includes(inc.tipo_registro)) return false;
    if (st.length > 0 && !st.includes(inc.status)) return false;
    if (resp.length > 0 && !resp.includes(inc.responsabilidade)) return false;
    if (dateFrom && inc.data_hora && new Date(inc.data_hora) < new Date(dateFrom)) return false;
    if (dateTo && inc.data_hora && new Date(inc.data_hora) > new Date(dateTo + "T23:59:59")) return false;
    const needle = searchText.toLowerCase();
    if (needle) {
      const matchText =
        (inc.descricao || "").toLowerCase().includes(needle) ||
        (inc.tipo_registro || "").toLowerCase().includes(needle) ||
        (inc.responsavel_registro || "").toLowerCase().includes(needle);
      if (!matchText) return false;
    }
    return true;
  });
}, [baseList, filtros, searchText, dateFrom, dateTo]);
```

- [ ] **Step 3.4: Adicionar filtro Responsabilidade ao FilterBar e inputs de período**

Localizar o bloco `{/* Filters */}` (linhas ~167–185). Está assim:
```jsx
{/* Filters */}
<div className="flex flex-col gap-3">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    <Input
      className="pl-9"
      placeholder="Buscar por descrição, tipo ou responsável..."
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
    />
  </div>
  <FilterBar
    storageKey="registros-filtros"
    filters={[
      { key: "tipo", label: "Tipo", options: ["Ata de Reunião", "E-mail", "Notificação"] },
      { key: "status", label: "Status", options: ["Registrado", "Em Análise", "Resolvido"] },
    ]}
    onChange={setFiltros}
  />
</div>
```

Substituir por:
```jsx
{/* Filters */}
<div className="flex flex-col gap-3">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    <Input
      className="pl-9"
      placeholder="Buscar por descrição, tipo ou responsável..."
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
    />
  </div>
  <div className="flex flex-wrap gap-3 items-end">
    <div className="flex-1 min-w-0">
      <FilterBar
        storageKey="registros-filtros"
        filters={[
          { key: "tipo", label: "Tipo", options: ["Ata de Reunião", "E-mail", "Notificação"] },
          { key: "status", label: "Status", options: ["Registrado", "Em Análise", "Resolvido"] },
          { key: "responsabilidade", label: "Responsabilidade", options: ["Contratada", "Contratante"] },
        ]}
        onChange={setFiltros}
      />
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <CalendarRange className="w-4 h-4 text-muted-foreground" />
      <Input
        type="date"
        className="w-36 text-sm"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        title="Data inicial"
      />
      <span className="text-muted-foreground text-sm">até</span>
      <Input
        type="date"
        className="w-36 text-sm"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        title="Data final"
      />
    </div>
  </div>
</div>
```

- [ ] **Step 3.5: Atualizar exibição de data nos cards (sem hora)**

No mapa de cards (linha ~222), a linha de formatação está assim:
```js
const dataFormatada = inc.data_hora
  ? format(new Date(inc.data_hora), "dd/MM/yyyy HH:mm", { locale: ptBR })
  : "—";
```

Trocar por:
```js
const dataFormatada = inc.data_hora
  ? format(new Date(inc.data_hora), "dd/MM/yyyy", { locale: ptBR })
  : "—";
```

- [ ] **Step 3.6: Commit**

```bash
git add src/pages/AdminContratual/Registros.jsx
git commit -m "feat(M11-REG1): filtros Responsabilidade + Período; data sem hora nos cards"
```

---

## Task 4: REG-2 — Seção de Anexos com Upload Supabase Storage no RegistroForm

**Files:**
- Modify: `src/components/pleitos/RegistroForm.jsx`

### Contexto

O campo `anexos` (JSONB) na tabela `registros` armazena um array de objetos `{ nome, url, tipo, tamanho }`. O upload usa `supabase.storage.from('registros-anexos').upload(path, file)`. O path usa `crypto.randomUUID()` para unicidade. Para deletar um arquivo, extrai-se o path da URL pública pelo trecho após `/registros-anexos/`.

- [ ] **Step 4.1: Adicionar imports necessários**

No topo de `src/components/pleitos/RegistroForm.jsx`, adicionar ao import do Lucide (que atualmente tem `Plus, Trash2`):
```js
import { Plus, Trash2, Paperclip, X as XIcon } from "lucide-react";
```

E adicionar logo após os outros imports:
```js
import { supabase } from "@/lib/supabaseClient";
```

- [ ] **Step 4.2: Adicionar novas props à assinatura da função**

A assinatura atual é:
```js
export default function RegistroForm({ incidente, casos, onSubmit, onCancel, isSubmitting }) {
```

Trocar por:
```js
export default function RegistroForm({ incidente, casos, onSubmit, onCancel, isSubmitting, tarefas = [], selectedProjectId = "" }) {
```

- [ ] **Step 4.3: Adicionar estados de anexos**

Dentro do componente `RegistroForm`, logo após as declarações de estado existentes (após `const [impactoOcorrencia, setImpactoOcorrencia] = useState(...)`), adicionar:

```js
const [newFiles, setNewFiles] = useState([]);
const [existingAnexos, setExistingAnexos] = useState(incidente?.anexos || []);
const [removedPaths, setRemovedPaths] = useState([]);
const [isUploading, setIsUploading] = useState(false);
```

- [ ] **Step 4.4: Atualizar handleSubmit para incluir upload e deleção**

O `handleSubmit` atual é:
```js
const handleSubmit = (e) => {
  e.preventDefault();
  onSubmit({
    ...formData,
    data_hora: toUtcIso(formData.data_hora),
    pleito_id: formData.pleito_id || null,
    mao_de_obra: isRDO ? maoDeObra.filter(r => r.quantidade || r.funcao) : [],
    equipamentos_rdo: isRDO ? equipamentosRdo.filter(r => r.quantidade || r.equipamento) : [],
    impacto_ocorrencia: impactoOcorrencia,
  });
};
```

Substituir por:
```js
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsUploading(true);

  try {
    // Upload de arquivos novos
    const uploaded = [];
    for (const file of newFiles) {
      const ext = file.name.split(".").pop();
      const path = `${selectedProjectId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("registros-anexos")
        .upload(path, file, { upsert: false });
      if (error) throw new Error(`Erro ao enviar ${file.name}: ${error.message}`);
      const { data: urlData } = supabase.storage
        .from("registros-anexos")
        .getPublicUrl(path);
      uploaded.push({
        nome: file.name,
        url: urlData.publicUrl,
        tipo: file.type,
        tamanho: file.size,
      });
    }

    // Deletar arquivos removidos do storage
    if (removedPaths.length > 0) {
      await supabase.storage.from("registros-anexos").remove(removedPaths);
    }

    onSubmit({
      ...formData,
      data_hora: toUtcIso(formData.data_hora),
      pleito_id: formData.pleito_id || null,
      mao_de_obra: isRDO ? maoDeObra.filter(r => r.quantidade || r.funcao) : [],
      equipamentos_rdo: isRDO ? equipamentosRdo.filter(r => r.quantidade || r.equipamento) : [],
      impacto_ocorrencia: impactoOcorrencia,
      anexos: [...existingAnexos, ...uploaded],
    });
  } catch (err) {
    // Re-lança para o onError da mutation tratar via toast
    throw err;
  } finally {
    setIsUploading(false);
  }
};
```

- [ ] **Step 4.5: Adicionar handlers de arquivo**

Após `const set = (field, value) => ...`, adicionar:

```js
const handleFileAdd = (e) => {
  const files = Array.from(e.target.files || []);
  setNewFiles(prev => [...prev, ...files]);
  e.target.value = "";
};

const handleRemoveNewFile = (idx) => {
  setNewFiles(prev => prev.filter((_, i) => i !== idx));
};

const handleRemoveExisting = (anexo) => {
  // Extrai o path após o bucket name na URL pública
  const path = anexo.url.split("/registros-anexos/")[1];
  if (path) setRemovedPaths(prev => [...prev, path]);
  setExistingAnexos(prev => prev.filter(a => a.url !== anexo.url));
};

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
```

- [ ] **Step 4.6: Adicionar UI da seção Anexos no JSX**

No JSX do form, localizar o bloco `{/* Associar Pleito */}` (que começa por volta da linha 304). **Antes** desse bloco, adicionar a seção de anexos:

```jsx
{/* Anexos */}
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <Label>Anexos</Label>
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => document.getElementById("registro-file-input").click()}
    >
      <Paperclip className="w-3 h-3 mr-1" />
      Adicionar arquivo
    </Button>
    <input
      id="registro-file-input"
      type="file"
      multiple
      className="hidden"
      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
      onChange={handleFileAdd}
    />
  </div>

  {existingAnexos.length === 0 && newFiles.length === 0 && (
    <p className="text-xs text-muted-foreground italic">Nenhum anexo adicionado.</p>
  )}

  {/* Anexos já salvos */}
  {existingAnexos.map((anexo, idx) => (
    <div key={`existing-${idx}`} className="flex items-center justify-between gap-2 p-2 bg-muted rounded-md">
      <a
        href={anexo.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 min-w-0 text-sm text-blue-600 hover:underline"
      >
        <Paperclip className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{anexo.nome}</span>
        <span className="text-muted-foreground text-xs shrink-0">{formatBytes(anexo.tamanho)}</span>
      </a>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-6 w-6 shrink-0"
        onClick={() => handleRemoveExisting(anexo)}
      >
        <XIcon className="w-3 h-3 text-muted-foreground" />
      </Button>
    </div>
  ))}

  {/* Novos arquivos selecionados */}
  {newFiles.map((file, idx) => (
    <div key={`new-${idx}`} className="flex items-center justify-between gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-2 min-w-0">
        <Paperclip className="w-3.5 h-3.5 shrink-0 text-blue-600" />
        <span className="text-sm truncate">{file.name}</span>
        <span className="text-muted-foreground text-xs shrink-0">{formatBytes(file.size)}</span>
      </div>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-6 w-6 shrink-0"
        onClick={() => handleRemoveNewFile(idx)}
      >
        <XIcon className="w-3 h-3 text-muted-foreground" />
      </Button>
    </div>
  ))}
</div>
```

- [ ] **Step 4.7: Atualizar o botão de submit para refletir upload em progresso**

Localizar o botão de submit (próximo à linha 320):
```jsx
<Button type="submit" variant="save" disabled={isSubmitting}>
  {isSubmitting ? "Salvando..." : "Salvar Registro"}
</Button>
```

Trocar por:
```jsx
<Button type="submit" variant="save" disabled={isSubmitting || isUploading}>
  {isUploading ? "Enviando arquivos..." : isSubmitting ? "Salvando..." : "Salvar Registro"}
</Button>
```

- [ ] **Step 4.8: Commit**

```bash
git add src/components/pleitos/RegistroForm.jsx
git commit -m "feat(M11-REG2): upload de anexos via Supabase Storage no RegistroForm"
```

---

## Task 5: REG-2 — Modal "Vincular Atividades" no RegistroForm

**Files:**
- Modify: `src/components/pleitos/RegistroForm.jsx`

### Contexto

O campo `atividades_vinculadas` (JSONB) armazena `[{ id: string, nome: string }]`. O modal usa o `Dialog` do shadcn/ui com uma lista de tarefas do cronograma. O usuário pode selecionar múltiplas tarefas com checkboxes e confirmar.

- [ ] **Step 5.1: Adicionar imports de Dialog, Badge e Link2**

No topo de `src/components/pleitos/RegistroForm.jsx`, após os imports existentes de `@/components/ui/`, adicionar:

```js
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Link2 } from "lucide-react";
```

(O `Link2` vai junto com os ícones Lucide já importados na linha do `import { Plus, Trash2, Paperclip, XIcon } from "lucide-react"`; adicionar `Link2` nessa mesma linha.)

- [ ] **Step 5.2: Adicionar estados do modal de atividades**

Logo após os estados de anexos (adicionados na Task 4), adicionar:

```js
const [atividadesVinculadas, setAtividadesVinculadas] = useState(incidente?.atividades_vinculadas || []);
const [showAtivModal, setShowAtivModal] = useState(false);
const [modalSearch, setModalSearch] = useState("");
const [modalSelected, setModalSelected] = useState(
  new Set((incidente?.atividades_vinculadas || []).map(a => a.id))
);
```

- [ ] **Step 5.3: Adicionar handler de confirmação do modal**

Após `const formatBytes = ...`, adicionar:

```js
const handleConfirmAtividades = () => {
  const selecionadas = tarefas
    .filter(t => modalSelected.has(t.id))
    .map(t => ({ id: t.id, nome: t.nome || t.titulo || t.descricao || t.id }));
  setAtividadesVinculadas(selecionadas);
  setShowAtivModal(false);
  setModalSearch("");
};

const toggleModalTarefa = (id) => {
  setModalSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
};

const tarefasFiltradas = tarefas.filter(t =>
  (t.nome || t.titulo || t.descricao || "").toLowerCase().includes(modalSearch.toLowerCase())
);
```

- [ ] **Step 5.4: Atualizar handleSubmit para incluir atividades_vinculadas**

No `handleSubmit` (adicionado na Task 4), dentro do `onSubmit({...})`, adicionar o campo ao payload. Localizar onde o objeto de submit é montado e adicionar:

```js
onSubmit({
  ...formData,
  data_hora: toUtcIso(formData.data_hora),
  pleito_id: formData.pleito_id || null,
  mao_de_obra: isRDO ? maoDeObra.filter(r => r.quantidade || r.funcao) : [],
  equipamentos_rdo: isRDO ? equipamentosRdo.filter(r => r.quantidade || r.equipamento) : [],
  impacto_ocorrencia: impactoOcorrencia,
  anexos: [...existingAnexos, ...uploaded],
  atividades_vinculadas: atividadesVinculadas,  // ← adicionar esta linha
});
```

- [ ] **Step 5.5: Adicionar botão "Vincular Atividades" no JSX**

Localizar a seção `{/* Ocorrências (shared) */}` no JSX (linhas ~253–257). **Após** essa seção (depois do Textarea de ocorrências), adicionar o botão e o modal:

```jsx
{/* Vincular Atividades */}
<div className="space-y-2">
  <Button
    type="button"
    variant="outline"
    onClick={() => {
      setModalSelected(new Set(atividadesVinculadas.map(a => a.id)));
      setShowAtivModal(true);
    }}
  >
    <Link2 className="w-4 h-4 mr-2" />
    Vincular Atividades
    {atividadesVinculadas.length > 0 && (
      <Badge variant="secondary" className="ml-2">{atividadesVinculadas.length}</Badge>
    )}
  </Button>

  {atividadesVinculadas.length > 0 && (
    <div className="flex flex-wrap gap-1">
      {atividadesVinculadas.map(a => (
        <Badge key={a.id} variant="outline" className="text-xs font-normal">
          {a.nome}
        </Badge>
      ))}
    </div>
  )}
</div>

{/* Modal de seleção de atividades */}
<Dialog open={showAtivModal} onOpenChange={setShowAtivModal}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>Vincular Atividades ao Cronograma</DialogTitle>
    </DialogHeader>

    <div className="space-y-3">
      <Input
        placeholder="Buscar tarefa..."
        value={modalSearch}
        onChange={(e) => setModalSearch(e.target.value)}
      />

      <div className="max-h-72 overflow-y-auto space-y-1 border rounded-md p-2">
        {tarefasFiltradas.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {tarefas.length === 0
              ? "Nenhuma tarefa no cronograma"
              : "Nenhuma tarefa encontrada"}
          </p>
        ) : (
          tarefasFiltradas.map(t => {
            const nome = t.nome || t.titulo || t.descricao || t.id;
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                onClick={() => toggleModalTarefa(t.id)}
              >
                <Checkbox
                  checked={modalSelected.has(t.id)}
                  onCheckedChange={() => toggleModalTarefa(t.id)}
                />
                <span className="text-sm">{nome}</span>
              </div>
            );
          })
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {modalSelected.size} {modalSelected.size === 1 ? "atividade selecionada" : "atividades selecionadas"}
      </p>
    </div>

    <DialogFooter>
      <Button type="button" variant="ghost" onClick={() => setShowAtivModal(false)}>
        Cancelar
      </Button>
      <Button type="button" onClick={handleConfirmAtividades}>
        Confirmar seleção
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

- [ ] **Step 5.6: Commit**

```bash
git add src/components/pleitos/RegistroForm.jsx
git commit -m "feat(M11-REG2): modal Vincular Atividades no RegistroForm"
```

---

## Task 6: REG-2 — Registros.jsx: Query de Tarefas + Chips nos Cards

**Files:**
- Modify: `src/pages/AdminContratual/Registros.jsx`

### Contexto

`Registros.jsx` precisa: (1) carregar as tarefas do cronograma via React Query, (2) passar `tarefas` e `selectedProjectId` ao `RegistroForm`, (3) exibir chips de contexto (`📎 N` e `🔗 N`) no footer de cada card quando houver anexos ou atividades vinculadas.

- [ ] **Step 6.1: Adicionar query de tarefas_cronograma**

Em `src/pages/AdminContratual/Registros.jsx`, após a query de `incidentes` (que termina por volta da linha 45), adicionar:

```js
const { data: tarefas = [] } = useQuery({
  queryKey: ["tarefas_cronograma", selectedProjectId],
  queryFn: () => entities.TarefaCronograma.filter({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId,
});
```

- [ ] **Step 6.2: Atualizar o RegistroForm no JSX para passar as novas props**

Localizar o `<RegistroForm ...>` (dentro do bloco `{showForm && (...)}`). Está assim:
```jsx
<RegistroForm
  key={editingRegistro?.id || "new-incidente"}
  incidente={editingRegistro}
  casos={[]}
  onSubmit={handleSubmit}
  onCancel={() => { setShowForm(false); setEditingRegistro(null); }}
  isSubmitting={createMutation.isPending || updateMutation.isPending}
/>
```

Trocar por:
```jsx
<RegistroForm
  key={editingRegistro?.id || "new-incidente"}
  incidente={editingRegistro}
  casos={[]}
  tarefas={tarefas}
  selectedProjectId={selectedProjectId}
  onSubmit={handleSubmit}
  onCancel={() => { setShowForm(false); setEditingRegistro(null); }}
  isSubmitting={createMutation.isPending || updateMutation.isPending}
/>
```

- [ ] **Step 6.3: Adicionar chips de contexto no footer dos cards**

No footer de cada card (dentro do `.map((inc) => {...})`), localizar o bloco que exibe responsavel_registro (linhas ~250–259):
```jsx
<div className="flex items-center gap-2 min-w-0">
  <Badge variant="outline" className={`text-xs ${statusClass} shrink-0`}>
    {inc.status || "—"}
  </Badge>
  {inc.responsavel_registro && (
    <span className="text-xs text-muted-foreground truncate">
      {inc.responsavel_registro}
    </span>
  )}
</div>
```

Substituir por:
```jsx
<div className="flex items-center gap-2 min-w-0 flex-wrap">
  <Badge variant="outline" className={`text-xs ${statusClass} shrink-0`}>
    {inc.status || "—"}
  </Badge>
  {inc.responsavel_registro && (
    <span className="text-xs text-muted-foreground truncate">
      {inc.responsavel_registro}
    </span>
  )}
  {inc.anexos?.length > 0 && (
    <span className="text-xs text-muted-foreground shrink-0" title={`${inc.anexos.length} anexo(s)`}>
      📎 {inc.anexos.length}
    </span>
  )}
  {inc.atividades_vinculadas?.length > 0 && (
    <span className="text-xs text-muted-foreground shrink-0" title={`${inc.atividades_vinculadas.length} atividade(s) vinculada(s)`}>
      🔗 {inc.atividades_vinculadas.length}
    </span>
  )}
</div>
```

- [ ] **Step 6.4: Commit**

```bash
git add src/pages/AdminContratual/Registros.jsx
git commit -m "feat(M11-REG2): query tarefas + chips de anexos e atividades nos cards"
```

---

## Self-Review do Plano

### Cobertura da Spec

| Requisito da Spec | Task |
|-------------------|------|
| Migração: `tipo_registro` + `responsabilidade` na tabela | Task 1 |
| Bucket `registros-anexos` + policies | Task 1 |
| Campo data sem hora no RegistroForm (linha 115) | Task 2 |
| Filtro Responsabilidade via FilterBar | Task 3 |
| Filtros de período (dateFrom / dateTo) | Task 3 |
| Exibição de data sem hora nos cards | Task 3 |
| Upload real via `supabase.storage` | Task 4 |
| Remoção de arquivos do storage | Task 4 |
| Schema `anexos: [{nome, url, tipo, tamanho}]` | Task 4 |
| Botão "Vincular Atividades" com modal | Task 5 |
| Busca no modal de tarefas | Task 5 |
| Multi-select de tarefas com Checkbox | Task 5 |
| Schema `atividades_vinculadas: [{id, nome}]` | Task 5 |
| Empty state no modal (sem tarefas) | Task 5 |
| Query de `tarefas_cronograma` em Registros.jsx | Task 6 |
| Props `tarefas` + `selectedProjectId` passadas ao form | Task 6 |
| Chips `📎 N` e `🔗 N` nos cards | Task 6 |

**Gaps encontrados:** Nenhum. Todos os requisitos têm task correspondente.

### Riscos

- **handleSubmit agora é async** (Task 4): a mutation chama `onSubmit` esperando função síncrona — mas React Query's `mutationFn` em `Registros.jsx` recebe `data` e chama `entities.Registro.create(data)`. O upload acontece dentro de `handleSubmit` antes de chamar `onSubmit`, então `onSubmit` recebe o payload já com as URLs. Sem problema.
- **Erro de upload**: `handleSubmit` lança `throw err` → o `onError` da mutation em Registros.jsx exibe o toast. Comportamento correto.
- **`crypto.randomUUID()`**: disponível em todos browsers modernos (Chrome 92+, Firefox 95+, Safari 15.4+). Sem dependência externa.
