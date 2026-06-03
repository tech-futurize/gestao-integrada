# Medições e Contratos — Melhorias UI

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Melhorar a UI dos módulos de Medições e Contratos com ajustes de cores, remoção de setas em inputs numéricos, fluxo exportar/importar PQP no modal de medição, datas e valores ajustados por aditivos assinados, e botões verdes consistentes.

**Architecture:** Mudanças exclusivamente na camada de apresentação (componentes React). Nenhuma alteração de banco ou API. `addDaysToDate` é extraída para `dateUtils.js` para reutilização em dois componentes. `ImportExportDialog` ganha prop `exportColumns` para separar colunas de exportação das de importação. `ContratosList` passa a receber `aditivos` como prop e calcula valores/datas ajustados inline.

**Tech Stack:** React 18.2, Tailwind CSS 3.x, Radix UI/shadcn, Lucide React, Vitest (testes de utilidades), Vite dev server para verificação visual.

---

## Mapa de Arquivos

| Arquivo | Tipo | Mudança |
|---------|------|---------|
| `src/lib/dateUtils.js` | Modify | Adicionar `addDaysToDate` exportada |
| `src/components/planejamento/PqpEditor.jsx` | Modify | Setas; botão renomeado; colunas e handler por modo |
| `src/components/ui/import-export-dialog.jsx` | Modify | Nova prop `exportColumns` |
| `src/components/contratos/ContratoDetalhes.jsx` | Modify | Cores; datas ajustadas; badge aditivos; importar `addDaysToDate` |
| `src/components/contratos/ContratoPQP.jsx` | Modify | `variant="save"` no botão |
| `src/components/contratos/ContratoMedicoes.jsx` | Modify | `variant="save"` no botão |
| `src/components/contratos/ContratoAditivos.jsx` | Modify | `variant="save"` no botão |
| `src/pages/Contratos.jsx` | Modify | Label filtro; lógica período; query aditivos; passar prop |
| `src/components/contratos/ContratosList.jsx` | Modify | Valor verde + aditivos; datas ajustadas; contador |

---

## Task 1: Extrair `addDaysToDate` para `dateUtils.js`

**Files:**
- Modify: `src/lib/dateUtils.js`

> `addDaysToDate` está definida localmente em `ContratoDetalhes.jsx` (linhas 20–25). Precisamos dela em `ContratosList.jsx` também. Extrair para o módulo de utilidades de datas evita duplicação.

- [ ] **Step 1: Adicionar `addDaysToDate` em `dateUtils.js`**

Ao final do arquivo `src/lib/dateUtils.js`, adicionar:

```js
// Soma `days` dias a uma data ISO (YYYY-MM-DD). Retorna string YYYY-MM-DD ou null.
export function addDaysToDate(dateStr, days) {
  if (!dateStr || !days) return null;
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
```

- [ ] **Step 2: Verificar que a função não existe ainda**

```bash
grep -n "addDaysToDate" src/lib/dateUtils.js
```
Esperado: sem resultado (confirma que não há duplicata).

- [ ] **Step 3: Commit**

```bash
git add src/lib/dateUtils.js
git commit -m "feat(dateUtils): exportar addDaysToDate como utilitário compartilhado"
```

---

## Task 2: PqpEditor — Remover setas do input "Qtd. medida"

**Files:**
- Modify: `src/components/planejamento/PqpEditor.jsx` (linhas ~196–201)

> O campo `<Input type="number">` exibe setas nativas do browser (spin buttons). Adicionamos classes Tailwind para suprimi-las apenas neste input específico.

- [ ] **Step 1: Localizar o input de `qtd_medida` no modo medição**

```bash
grep -n "qtd_medida" src/components/planejamento/PqpEditor.jsx
```
Esperado: linha ~197 com `onChange={(e) => editLeaf(node.item, "qtd_medida", e.target.value)}`.

- [ ] **Step 2: Adicionar classes para suprimir setas**

Localizar o `<Input>` de `qtd_medida` (dentro do bloco `isMedicao`, célula `bg-amber-50`):

```jsx
// ANTES
<Input
  type="number"
  value={node.qtd_medida ?? ""}
  onChange={(e) => editLeaf(node.item, "qtd_medida", e.target.value)}
  className="h-7 w-24 text-right text-xs ml-auto"
/>

// DEPOIS
<Input
  type="number"
  value={node.qtd_medida ?? ""}
  onChange={(e) => editLeaf(node.item, "qtd_medida", e.target.value)}
  className="h-7 w-24 text-right text-xs ml-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
/>
```

- [ ] **Step 3: Verificar visualmente no browser**

```bash
npm run dev
```
Abrir o app, navegar para um contrato com PQP definida → aba "Medições" → "Nova Medição". Confirmar que o campo "Qtd. medida" não exibe mais setas de incremento/decremento.

- [ ] **Step 4: Commit**

```bash
git add src/components/planejamento/PqpEditor.jsx
git commit -m "fix(pqp): remover setas do input qtd_medida no modo medicao"
```

---

## Task 3: ImportExportDialog — Prop `exportColumns`

**Files:**
- Modify: `src/components/ui/import-export-dialog.jsx`

> `ImportExportDialog` atualmente usa `columns` tanto para gerar colunas da exportação quanto para o mapping de importação. No modo medição do PqpEditor, precisamos exportar mais colunas (item, desc, unidade, qtd_contratual, qtd_acumulada, qtd_medida) mas importar apenas duas (item, qtd_medida). A prop `exportColumns` desacopla as duas responsabilidades.

- [ ] **Step 1: Adicionar `exportColumns` na assinatura da função**

Em `src/components/ui/import-export-dialog.jsx`, na linha da assinatura:

```jsx
// ANTES
export function ImportExportDialog({
  open,
  onOpenChange,
  onImport,
  onExport,
  exportFileName = "export",
  columns = [],
  title = "Importar / Exportar",
  exportOnly = false,
}) {

// DEPOIS
export function ImportExportDialog({
  open,
  onOpenChange,
  onImport,
  onExport,
  exportFileName = "export",
  columns = [],
  exportColumns,
  title = "Importar / Exportar",
  exportOnly = false,
}) {
```

- [ ] **Step 2: Usar `exportColumns` (com fallback para `columns`) em `handleExport`**

Ainda em `import-export-dialog.jsx`, localizar a função `handleExport`:

```js
// ANTES
async function handleExport(format) {
  const data = onExport();
  if (!data || data.length === 0) return;

  const exportData = data.map((item) => {
    const row = {};
    columns.forEach(({ key, label }) => {
      row[label] = item[key] ?? "";
    });
    return row;
  });

// DEPOIS
async function handleExport(format) {
  const data = onExport();
  if (!data || data.length === 0) return;

  const colsForExport = exportColumns ?? columns;
  const exportData = data.map((item) => {
    const row = {};
    colsForExport.forEach(({ key, label }) => {
      row[label] = item[key] ?? "";
    });
    return row;
  });
```

- [ ] **Step 3: Confirmar que nenhum caller existente passou `exportColumns`**

```bash
grep -rn "exportColumns" src/
```
Esperado: apenas as duas linhas que acabamos de escrever (assinatura + uso). Nenhum caller externo ainda — comportamento existente preservado via fallback `exportColumns ?? columns`.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/import-export-dialog.jsx
git commit -m "feat(import-export-dialog): adicionar prop exportColumns para desacoplar exportacao de importacao"
```

---

## Task 4: PqpEditor — Botão "Exportar/Importar" + colunas e handler por modo

**Files:**
- Modify: `src/components/planejamento/PqpEditor.jsx`

> No modo medição: o botão muda de nome, o export inclui todas as colunas de referência (+ qtd_medida em branco), e o import só atualiza `qtd_medida` nos nós existentes (sem reconstruir a árvore). No modo definição: tudo permanece idêntico.

- [ ] **Step 1: Adicionar as constantes de colunas para modo medição**

Logo após `PQP_IMPORT_COLUMNS` (linha ~23 de `PqpEditor.jsx`), adicionar:

```js
const MEDICAO_IMPORT_COLUMNS = [
  { key: "item",       label: "Item (EAP)",  type: "string", required: true },
  { key: "qtd_medida", label: "Qtd. medida", type: "number" },
];

const MEDICAO_EXPORT_COLUMNS = [
  { key: "item",           label: "Item (EAP)"      },
  { key: "descricao",      label: "Descrição"       },
  { key: "unidade",        label: "Unidade"         },
  { key: "qtd_contratual", label: "Qtd. Contratual" },
  { key: "qtd_acumulada",  label: "Qtd. Acumulada"  },
  { key: "qtd_medida",     label: "Qtd. medida"     },
];
```

- [ ] **Step 2: Adicionar handler de importação para modo medição**

Localizar `handleImportRow` (linha ~87) e adicionar o handler de medição logo após:

```js
// Handler existente — modo definição (preservado)
const handleImportRow = async (row) => {
  importBuffer.current.push(row);
  onChange?.(buildTreeFromFlat(importBuffer.current));
};

// Novo handler — modo medição: atualiza qtd_medida nos nós existentes
const handleImportRowMedicao = (row) => {
  importBuffer.current.push(row);
  let updated = itens;
  importBuffer.current.forEach((r) => {
    updated = updateNode(updated, r.item, { qtd_medida: r.qtd_medida ?? 0 });
  });
  onChange?.(updated);
};
```

- [ ] **Step 3: Substituir referências no `<ImportExportDialog>` dentro de PqpEditor**

Localizar a renderização do `{showImport && <ImportExportDialog ...>}` no final de PqpEditor e substituir:

```jsx
// ANTES
{showImport && (
  <ImportExportDialog
    open={showImport}
    onOpenChange={setShowImport}
    title="Importar PQP"
    exportOnly={false}
    exportFileName="pqp"
    columns={PQP_IMPORT_COLUMNS}
    onExport={() =>
      flattenLeaves(itens).map((f) => ({
        item: f.item, descricao: f.descricao, unidade: f.unidade,
        qtd_contratual: f.qtd_contratual, preco_unitario: f.preco_unitario,
      }))
    }
    onImport={handleImportRow}
  />
)}

// DEPOIS
{showImport && (
  <ImportExportDialog
    open={showImport}
    onOpenChange={setShowImport}
    title={isMedicao ? "Exportar / Importar Medição" : "Importar PQP"}
    exportOnly={false}
    exportFileName={isMedicao ? "medicao" : "pqp"}
    columns={isMedicao ? MEDICAO_IMPORT_COLUMNS : PQP_IMPORT_COLUMNS}
    exportColumns={isMedicao ? MEDICAO_EXPORT_COLUMNS : undefined}
    onExport={() =>
      flattenLeaves(itens).map((f) => ({
        item: f.item,
        descricao: f.descricao,
        unidade: f.unidade,
        qtd_contratual: f.qtd_contratual,
        preco_unitario: f.preco_unitario,
        qtd_acumulada: f.qtd_acumulada ?? 0,
        qtd_medida: f.qtd_medida ?? 0,
      }))
    }
    onImport={isMedicao ? handleImportRowMedicao : handleImportRow}
  />
)}
```

- [ ] **Step 4: Renomear o botão de abertura do dialog**

Localizar o botão "Importar Excel/CSV" (linha ~99) e alterar label e ícone:

```jsx
// ANTES
<Button type="button" size="sm" variant="outline" onClick={openImport}>
  <Upload className="w-3.5 h-3.5 mr-1.5" /> Importar Excel/CSV
</Button>

// DEPOIS
<Button type="button" size="sm" variant="outline" onClick={openImport}>
  <Download className="w-3.5 h-3.5 mr-1.5" /> Exportar / Importar
</Button>
```

Verificar que `Download` já está no import de `lucide-react` no topo do arquivo:

```bash
grep "import.*lucide" src/components/planejamento/PqpEditor.jsx
```

Se `Download` não estiver listado, adicionar ao import existente.

- [ ] **Step 5: Fazer o mesmo para o botão no empty-state (linha ~130)**

```jsx
// ANTES
<Button type="button" size="sm" variant="outline" onClick={openImport}>
  <Upload className="w-3.5 h-3.5 mr-1.5" /> Importar Excel/CSV
</Button>

// DEPOIS
<Button type="button" size="sm" variant="outline" onClick={openImport}>
  <Download className="w-3.5 h-3.5 mr-1.5" /> Exportar / Importar
</Button>
```

- [ ] **Step 6: Verificar visualmente**

```bash
npm run dev
```
1. Navegar para contrato com PQP → aba PQP → botão deve ler "Exportar / Importar"
2. Clicar → exportar Excel → confirmar que inclui colunas: Item, Descrição, Unidade, Qtd. Contratual, Qtd. Acumulada, Qtd. medida
3. Navegar para aba Medições → Nova Medição → botão também deve ler "Exportar / Importar"
4. Exportar medição → planilha deve ter as mesmas 6 colunas
5. Preencher qtd_medida na planilha → reimportar → confirmar que só atualiza qtd_medida, mantendo estrutura

- [ ] **Step 7: Commit**

```bash
git add src/components/planejamento/PqpEditor.jsx
git commit -m "feat(pqp): renomear botão exportar/importar e separar lógica de importação por modo"
```

---

## Task 5: ContratoDetalhes — Extrair dependência + cores + datas + badge

**Files:**
- Modify: `src/components/contratos/ContratoDetalhes.jsx`

> Agrupa 4 mudanças relacionadas no mesmo arquivo: (a) substituir `addDaysToDate` local pela importação de `dateUtils`, (b) cor verde no valor total, (c) saldo sempre vermelho + label datas sem "Original", (d) badge com contagem de aditivos assinados.

- [ ] **Step 1: Atualizar import para incluir `addDaysToDate` de dateUtils**

Na linha de imports do `ContratoDetalhes.jsx` (linha ~10):

```jsx
// ANTES
import { formatDate } from "@/lib/dateUtils";

// DEPOIS
import { formatDate, addDaysToDate } from "@/lib/dateUtils";
```

- [ ] **Step 2: Remover a definição local de `addDaysToDate`**

Apagar as linhas 20–25 (função local):

```js
// REMOVER este bloco inteiro:
function addDaysToDate(dateStr, days) {
  if (!dateStr || !days) return null;
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
```

- [ ] **Step 3: Alterar cor do valor total de `text-ocre` para `text-status-positive`**

```jsx
// ANTES (linha ~71)
<p className="text-2xl font-bold text-ocre">{fmt(contrato.valor_total)}</p>

// DEPOIS
<p className="text-2xl font-bold text-status-positive">{fmt(contrato.valor_total)}</p>
```

- [ ] **Step 4: Alterar saldo para sempre vermelho + corrigir label de datas**

Localizar o bloco do grid de 4 colunas (`grid-cols-2 md:grid-cols-4`, linha ~76):

```jsx
// ANTES — bloco da data (linha ~92–99)
<div className="flex items-center gap-2">
  <Calendar className="w-4 h-4 text-muted-foreground" />
  <div>
    <p className="text-xs text-muted-foreground">Início → Término Original</p>
    <p className="text-sm font-semibold text-foreground">{(formatDate(contrato.data_inicio) || "—")} → {(formatDate(contrato.data_fim) || "—")}</p>
    {terminoAtual !== contrato.data_fim && (
      <p className="text-xs text-status-attention font-semibold">Término Atual: {(formatDate(terminoAtual) || "—")}</p>
    )}
  </div>
</div>

// DEPOIS
<div className="flex items-center gap-2">
  <Calendar className="w-4 h-4 text-muted-foreground" />
  <div>
    <p className="text-xs text-muted-foreground">Início → Término</p>
    <p className="text-sm font-semibold text-foreground">{(formatDate(contrato.data_inicio) || "—")} → {(formatDate(terminoAtual) || "—")}</p>
  </div>
</div>
```

```jsx
// ANTES — bloco do saldo (linha ~101–107)
<div className="flex items-center gap-2">
  <DollarSign className="w-4 h-4 text-muted-foreground" />
  <div>
    <p className="text-xs text-muted-foreground">Saldo</p>
    <p className={`text-sm font-semibold ${saldo >= 0 ? "text-status-positive" : "text-status-critical"}`}>{fmt(saldo)}</p>
  </div>
</div>

// DEPOIS
<div className="flex items-center gap-2">
  <DollarSign className="w-4 h-4 text-muted-foreground" />
  <div>
    <p className="text-xs text-muted-foreground">Saldo</p>
    <p className="text-sm font-semibold text-status-critical">{fmt(saldo)}</p>
    {aditivos.filter((a) => a.status === "Assinado").length > 0 && (
      <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">
        <span className="font-semibold text-foreground">
          {aditivos.filter((a) => a.status === "Assinado").length}
        </span>
        {" "}aditivo{aditivos.filter((a) => a.status === "Assinado").length !== 1 ? "s" : ""} assinado{aditivos.filter((a) => a.status === "Assinado").length !== 1 ? "s" : ""}
      </span>
    )}
  </div>
</div>
```

- [ ] **Step 5: Verificar visualmente**

```bash
npm run dev
```
Abrir um contrato → confirmar:
- Valor total exibido em verde
- Saldo exibido em vermelho
- Label mostra "Início → Término" (sem "Original")
- Término exibe a data ajustada (se houver aditivos com prazo assinados)
- Badge "N aditivos assinados" aparece no bloco do saldo quando houver aditivos assinados

- [ ] **Step 6: Commit**

```bash
git add src/components/contratos/ContratoDetalhes.jsx
git commit -m "fix(contratos): cores verde/vermelho no card-resumo, datas ajustadas e badge de aditivos"
```

---

## Task 6: Botões primários verdes (`variant="save"`)

**Files:**
- Modify: `src/components/contratos/ContratoPQP.jsx` (linha 28)
- Modify: `src/components/contratos/ContratoMedicoes.jsx` (linha 52)
- Modify: `src/components/contratos/ContratoAditivos.jsx` (linha 55)

> O variant `"save"` já está definido no design system (`bg-action-save` = verde) e é usado no FormDialog. Aplicar o mesmo padrão nos botões de ação primária que ainda estão como `default` (navy) ou `outline` (sem fill).

- [ ] **Step 1: ContratoPQP.jsx — botão "Salvar PQP"**

```jsx
// ANTES (linha ~28)
<Button size="sm" disabled={!dirty || mut.isPending} onClick={() => mut.mutate(itens)}>
  <Save className="w-4 h-4 mr-1.5" /> Salvar PQP
</Button>

// DEPOIS
<Button size="sm" variant="save" disabled={!dirty || mut.isPending} onClick={() => mut.mutate(itens)}>
  <Save className="w-4 h-4 mr-1.5" /> Salvar PQP
</Button>
```

- [ ] **Step 2: ContratoMedicoes.jsx — botão "Nova Medição"**

```jsx
// ANTES (linha ~52)
<Button size="sm" variant="outline" onClick={() => { setEdit(null); setShowForm(true); }}>
  <Plus className="w-3.5 h-3.5 mr-1.5" /> Nova Medição
</Button>

// DEPOIS
<Button size="sm" variant="save" onClick={() => { setEdit(null); setShowForm(true); }}>
  <Plus className="w-3.5 h-3.5 mr-1.5" /> Nova Medição
</Button>
```

- [ ] **Step 3: ContratoAditivos.jsx — botão "Novo Aditivo"**

```jsx
// ANTES (linha ~55)
<Button size="sm" variant="outline" onClick={() => { setEdit(null); setShowForm(true); }}>
  <Plus className="w-3.5 h-3.5 mr-1.5" /> Novo Aditivo
</Button>

// DEPOIS
<Button size="sm" variant="save" onClick={() => { setEdit(null); setShowForm(true); }}>
  <Plus className="w-3.5 h-3.5 mr-1.5" /> Novo Aditivo
</Button>
```

- [ ] **Step 4: Verificar visualmente**

```bash
npm run dev
```
Abrir um contrato → confirmar que "Salvar PQP", "Nova Medição" e "Novo Aditivo" estão todos em verde.

- [ ] **Step 5: Commit**

```bash
git add src/components/contratos/ContratoPQP.jsx src/components/contratos/ContratoMedicoes.jsx src/components/contratos/ContratoAditivos.jsx
git commit -m "fix(contratos): padronizar botoes primarios com variant=save (verde)"
```

---

## Task 7: Contratos.jsx — Filtro "Período" + query de aditivos

**Files:**
- Modify: `src/pages/Contratos.jsx`

> Duas mudanças independentes no mesmo arquivo: (1) renomear label e corrigir lógica do DateRangePicker para interseção de período; (2) adicionar query de aditivos do projeto para passar ao ContratosList.

- [ ] **Step 1: Renomear label do DateRangePicker**

```jsx
// ANTES (linha ~182)
<DateRangePicker label="Data Início" value={periodo} onChange={setPeriodo} onClear={() => setPeriodo(null)} />

// DEPOIS
<DateRangePicker label="Período" value={periodo} onChange={setPeriodo} onClear={() => setPeriodo(null)} />
```

- [ ] **Step 2: Corrigir lógica de filtro por período (interseção)**

Localizar o bloco de filtro por `periodo` em `filteredContratos` (linhas ~75–82):

```js
// ANTES
if (periodo?.from) {
  const fromStr = periodo.from.toISOString().split("T")[0];
  r = r.filter((c) => c.data_inicio && c.data_inicio >= fromStr);
}
if (periodo?.to) {
  const toStr = periodo.to.toISOString().split("T")[0];
  r = r.filter((c) => c.data_inicio && c.data_inicio <= toStr);
}

// DEPOIS — filtro por interseção de período
if (periodo?.from) {
  const fromStr = periodo.from.toISOString().split("T")[0];
  // contrato não terminou antes do início do filtro
  r = r.filter((c) => !c.data_fim || c.data_fim >= fromStr);
}
if (periodo?.to) {
  const toStr = periodo.to.toISOString().split("T")[0];
  // contrato não começou depois do fim do filtro
  r = r.filter((c) => !c.data_inicio || c.data_inicio <= toStr);
}
```

- [ ] **Step 3: Adicionar query de aditivos do projeto**

Logo após a query de `contratos` (linha ~54), adicionar:

```js
const { data: todosAditivos = [] } = useQuery({
  queryKey: ["aditivos", "projeto", selectedProjectId],
  queryFn: () => entities.Aditivo.filter({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId,
});
```

- [ ] **Step 4: Passar `aditivos` como prop para `<ContratosList>`**

```jsx
// ANTES (linha ~194)
<ContratosList
  contratos={filteredContratos}
  isLoading={loadingContratos}
  onSelect={(c) => setSelectedId(c.id)}
  onEdit={(c) => { setEditContrato(c); setShowContratoForm(true); }}
  onDelete={(id) => deleteContrato.mutate(id)}
/>

// DEPOIS
<ContratosList
  contratos={filteredContratos}
  aditivos={todosAditivos}
  isLoading={loadingContratos}
  onSelect={(c) => setSelectedId(c.id)}
  onEdit={(c) => { setEditContrato(c); setShowContratoForm(true); }}
  onDelete={(id) => deleteContrato.mutate(id)}
/>
```

- [ ] **Step 5: Verificar filtro no browser**

```bash
npm run dev
```
1. Abrir módulo Contratos → label do filtro deve mostrar "Período"
2. Selecionar um intervalo de datas (ex: jan–mar 2025)
3. Confirmar que aparecem contratos com `data_inicio` anterior ao filtro mas `data_fim` dentro do intervalo (ou seja, contratos que estavam ativos naquele período)

- [ ] **Step 6: Commit**

```bash
git add src/pages/Contratos.jsx
git commit -m "feat(contratos): filtro por periodo com interseccao + query aditivos do projeto"
```

---

## Task 8: ContratosList — Valor verde + datas e valores com aditivos + contador

**Files:**
- Modify: `src/components/contratos/ContratosList.jsx`

> ContratosList passa a receber `aditivos` e, para cada card, calcula inline o valor ajustado (contrato + aditivos assinados) e a data de término ajustada. Exibe valor em verde e adiciona linha com contagem de aditivos assinados.

- [ ] **Step 1: Adicionar import de `addDaysToDate` e `formatDate`**

Verificar imports atuais:

```bash
head -10 src/components/contratos/ContratosList.jsx
```

Adicionar `addDaysToDate` ao import de dateUtils:

```jsx
// ANTES
import { formatDate } from "@/lib/dateUtils";

// DEPOIS
import { formatDate, addDaysToDate } from "@/lib/dateUtils";
```

- [ ] **Step 2: Adicionar prop `aditivos` à assinatura do componente**

```jsx
// ANTES
export default function ContratosList({ contratos, isLoading, onSelect, onEdit, onDelete }) {

// DEPOIS
export default function ContratosList({ contratos, aditivos = [], isLoading, onSelect, onEdit, onDelete }) {
```

- [ ] **Step 3: Calcular valores e datas ajustados por card + atualizar renderização**

Localizar o `{contratos.map(c => (` (linha ~28) e substituir o interior do Card:

```jsx
{contratos.map(c => {
  const aditivosDoContrato = aditivos.filter(
    (a) => a.contrato_id === c.id && a.status === "Assinado"
  );
  const valorAjustado = (c.valor_total || 0) + aditivosDoContrato.reduce((s, a) => s + (a.valor || 0), 0);
  const prazoDias = aditivosDoContrato.reduce((s, a) => s + (a.prazo_dias || 0), 0);
  const terminoAjustado = prazoDias > 0 ? addDaysToDate(c.data_fim, prazoDias) : c.data_fim;
  const qtdAditivosAssinados = aditivosDoContrato.length;

  return (
    <Card key={c.id} className="bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelect(c)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {c.numero && <span className="text-xs font-mono text-muted-foreground">{c.numero}</span>}
              <StatusBadge status={c.status} />
              {c.tipo && <Badge variant="outline" className="text-xs">{c.tipo}</Badge>}
            </div>
            <p className="font-semibold text-sm text-foreground">{c.objeto}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{c.fornecedor} {c.cnpj && <span className="text-xs text-muted-foreground/70">· {c.cnpj}</span>}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-base text-status-positive">{fmt(valorAjustado)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{(formatDate(c.data_inicio) || "—")} → {(formatDate(terminoAjustado) || "—")}</p>
            {qtdAditivosAssinados > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="font-semibold text-foreground">{qtdAditivosAssinados}</span>
                {" "}aditivo{qtdAditivosAssinados !== 1 ? "s" : ""} assinado{qtdAditivosAssinados !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">Gestor: {c.gestor || "—"}</span>
          <RowActions
            onView={() => onSelect(c)}
            onEdit={() => onEdit(c)}
            onDelete={() => onDelete(c.id)}
            deleteDescription="O contrato será excluído permanentemente."
            size="md"
          />
        </div>
      </CardContent>
    </Card>
  );
})}
```

> **Atenção:** A sintaxe do `.map` muda de `contratos.map(c => (<Card...>))` (arrow sem corpo) para `contratos.map(c => { const ...; return (<Card...>); })` (arrow com corpo) para comportar as declarações de variáveis locais.

- [ ] **Step 4: Verificar visualmente**

```bash
npm run dev
```
1. Abrir módulo Contratos
2. Confirmar que o valor exibido à direita de cada card está em verde
3. Para contrato com aditivos assinados: confirmar que o valor inclui os aditivos e a data de término está ajustada
4. Confirmar que aparece a linha "N aditivos assinados" abaixo das datas
5. Para contrato sem aditivos assinados: confirmar que a linha não aparece

- [ ] **Step 5: Commit**

```bash
git add src/components/contratos/ContratosList.jsx
git commit -m "feat(contratos): valor verde com aditivos, datas ajustadas e contador no card da lista"
```

---

## Self-Review

### Cobertura do spec

| Seção do spec | Task |
|---------------|------|
| 1. Setas qtd_medida | Task 2 |
| 2. Botão Exportar/Importar + colunas modo medição | Task 4 |
| 3. prop exportColumns no ImportExportDialog | Task 3 |
| 4. Cores card-resumo ContratoDetalhes | Task 5 |
| 5. Datas ajustadas ContratoDetalhes | Task 5 |
| 6. Badge aditivos ContratoDetalhes | Task 5 |
| 7. Botões variant="save" | Task 6 |
| 8. Filtro Período + query aditivos Contratos.jsx | Task 7 |
| 9. ContratosList valor verde + datas + contador | Task 8 |
| addDaysToDate extraída para dateUtils | Task 1 |

Cobertura: 100% ✓

### Consistência de tipos e nomes

- `addDaysToDate(dateStr: string, days: number): string | null` — definida em Task 1, usada em Task 5 e Task 8 com a mesma assinatura ✓
- `handleImportRowMedicao` — definida em Task 4, referenciada apenas em Task 4 ✓
- `MEDICAO_IMPORT_COLUMNS`, `MEDICAO_EXPORT_COLUMNS` — definidas e usadas em Task 4 ✓
- `exportColumns` — adicionada em Task 3, consumida em Task 4 ✓
- `aditivos` prop — adicionada em Task 7, consumida em Task 8 ✓

### Placeholders

Nenhum "TBD", "TODO" ou passo vago encontrado ✓
