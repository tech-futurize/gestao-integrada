# Spec: M13 Riscos — Lote 2 (R1–R5)

**Data:** 2026-05-28  
**Módulo:** 13 — Gestão de Riscos  
**Agente:** Builder A (sequencial)  
**Abordagem aprovada:** A — Implementação incremental

---

## Escopo

Cinco tasks sequenciais no módulo GestaoRiscos:

| ID | Descrição |
|----|-----------|
| R1 | Adicionar `impactos JSONB` multi-select (Escopo, Prazo, Valor) ao formulário de Riscos |
| R2 | Adicionar campos `escopo_texto`, `prazo_dias`, `valor_impacto` ao formulário de Riscos |
| R3 | Extrair constante `IMPACT_CATEGORIES` para `src/lib/constants.js`; importar em `MapaRegistroImpacto.jsx` e `RegistroForm.jsx` |
| R4 | Mover `PlanoAcao.jsx` para `/src/components/riscos/`; adicionar tabs em `GestaoRiscos.jsx`; migration SQL com novas FKs |
| R5 | Substituir `pleito_id` no formulário de PlanoAcao por seletor Risco/Mudança |

---

## R1 — `impactos JSONB` multi-select

### Decisão de design
O campo numérico `impacto` (1–5) é **mantido** para continuar alimentando a matriz 5×5 (Probabilidade × Impacto). O novo campo `impactos JSONB` é **adicionado** como dimensão qualitativa independente.

### Mudanças no banco
```sql
-- supabase-migration-m13-riscos.sql
ALTER TABLE riscos ADD COLUMN IF NOT EXISTS impactos JSONB DEFAULT '[]'::jsonb;
```

### Mudanças em `GestaoRiscos.jsx`

**`EMPTY_FORM`** — adicionar:
```js
impactos: [],
```

**`handleEdit`** — adicionar:
```js
impactos: risco.impactos || [],
```

**`handleSubmit`** — incluir `impactos` no payload (já presente via spread de `form`).

**Form (Dialog)** — nova seção após "Plano de Resposta":
```jsx
<div className="space-y-2 col-span-2">
  <Label>Dimensões de Impacto</Label>
  <div className="flex gap-3 flex-wrap">
    {["Escopo", "Prazo", "Valor"].map(dim => (
      <label key={dim} className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={form.impactos.includes(dim)}
          onCheckedChange={() => toggleImpacto(dim)}
        />
        <span className="text-sm">{dim}</span>
      </label>
    ))}
  </div>
</div>
```

**Handler** `toggleImpacto`:
```js
const toggleImpacto = (dim) =>
  setForm(f => ({
    ...f,
    impactos: f.impactos.includes(dim)
      ? f.impactos.filter(d => d !== dim)
      : [...f.impactos, dim],
  }));
```

**Tabela** — adicionar coluna "Impactos" após "Categoria", exibindo badges pequenos para cada dimensão selecionada.

---

## R2 — Campos de quantificação de impacto

### Mudanças no banco
```sql
ALTER TABLE riscos ADD COLUMN IF NOT EXISTS escopo_texto TEXT;
ALTER TABLE riscos ADD COLUMN IF NOT EXISTS prazo_dias   NUMERIC;
ALTER TABLE riscos ADD COLUMN IF NOT EXISTS valor_impacto NUMERIC;
```

### Mudanças em `GestaoRiscos.jsx`

**`EMPTY_FORM`** — adicionar:
```js
escopo_texto: "", prazo_dias: "", valor_impacto: "",
```

**`handleEdit`** — adicionar:
```js
escopo_texto:  risco.escopo_texto  || "",
prazo_dias:    risco.prazo_dias    ?? "",
valor_impacto: risco.valor_impacto ?? "",
```

**`handleSubmit`** — converter para número:
```js
prazo_dias:    form.prazo_dias    !== "" ? Number(form.prazo_dias)    : null,
valor_impacto: form.valor_impacto !== "" ? Number(form.valor_impacto) : null,
```

**Form (Dialog)** — campos condicionais renderizados dentro da mesma seção de R1, após os checkboxes:
- Se `form.impactos.includes("Escopo")`: Textarea `escopo_texto`
- Se `form.impactos.includes("Prazo")`: Input number `prazo_dias` (dias)
- Se `form.impactos.includes("Valor")`: Input number `valor_impacto` (R$)

---

## R3 — Constante compartilhada `IMPACT_CATEGORIES`

### Arquivo novo: `src/lib/constants.js`
```js
export const IMPACT_CATEGORIES = [
  "Engenharia", "Suprimentos", "Liberação de Área",
  "Escopo", "Planejamento", "Gestão & Comunicação",
  "Recursos", "Produtividade", "Segurança", "Qualidade"
];
```

### `MapaRegistroImpacto.jsx`
- Remover linhas 11–15 (`const CATEGORIES = [...]`)
- Adicionar: `import { IMPACT_CATEGORIES as CATEGORIES } from "@/lib/constants";`

### `RegistroForm.jsx`
- Remover linhas 17–21 (`const IMPACTO_CATEGORIES = [...]`)
- Adicionar: `import { IMPACT_CATEGORIES as IMPACTO_CATEGORIES } from "@/lib/constants";`

Zero mudança de comportamento.

---

## R4 — PlanoAcao dentro de Riscos + novas FKs

### Mudanças no banco
```sql
ALTER TABLE acoes
  ADD COLUMN IF NOT EXISTS projeto_id        UUID REFERENCES projetos(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS registro_risco_id UUID REFERENCES riscos(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS registro_mudanca_id UUID REFERENCES mudancas_contratuais(id) ON DELETE SET NULL;
```

`pleito_id` / `caso_id` existentes **não são removidos** (compatibilidade com dados históricos).

### Mover arquivo
`src/components/pleitos/PlanoAcao.jsx` → `src/components/riscos/PlanoAcao.jsx`

**`PleitoDetalhes.jsx`** atualmente usa `<PlanoAcao pleitoId={pleito.id} />` (linha 122). Como o componente migra para API `projectId`, **remover a aba/uso de PlanoAcao em PleitoDetalhes** — o Plano de Ação passa a ser gerenciado somente via GestaoRiscos. Remover o import e o JSX correspondente.

### `GestaoRiscos.jsx` — tabs

Adicionar state:
```js
const [tab, setTab] = useState("riscos");
```

Substituir o conteúdo atual por:
```jsx
{/* Tabs */}
<div className="flex gap-1 border-b border-border px-6">
  {["riscos", "plano-acao"].map(t => (
    <button
      key={t}
      onClick={() => setTab(t)}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        tab === t
          ? "border-emerald-600 text-emerald-700"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {t === "riscos" ? "Riscos" : "Plano de Ação"}
    </button>
  ))}
</div>

{tab === "riscos" && <RiscosView ... />}
{tab === "plano-acao" && <PlanoAcao projectId={selectedProjectId} />}
```

O conteúdo atual de GestaoRiscos (KPIs, matriz, filtros, tabela, modal) é extraído para componente interno `RiscosView` ou mantido inline com renderização condicional `{tab === "riscos" && ...}`.

### `PlanoAcao.jsx` refatorado — props e query

```js
// Antes
export default function PlanoAcao({ pleitoId }) {
  const { data: acoes = [] } = useQuery({
    queryKey: ["acoes", pleitoId],
    queryFn: () => entities.Acao.filter({ pleito_id: pleitoId }),
    enabled: !!pleitoId,
  });
  ...
  mutationFn: (data) => entities.Acao.create({ ...data, pleito_id: pleitoId }),

// Depois
export default function PlanoAcao({ projectId }) {
  const { data: acoes = [] } = useQuery({
    queryKey: ["acoes", projectId],
    queryFn: () => entities.Acao.filter({ projeto_id: projectId }),
    enabled: !!projectId,
  });
  ...
  mutationFn: (data) => entities.Acao.create({ ...data, projeto_id: projectId }),
```

A listagem de ações exibe nova coluna "Vínculo" mostrando o código/título do risco ou mudança vinculada.

---

## R5 — Seletor de Risco/Mudança no form de PlanoAcao

### Queries adicionais no `PlanoAcao.jsx`
```js
const { data: riscos = [] } = useQuery({
  queryKey: ["riscos", projectId],
  queryFn: () => entities.Risco.filter({ projeto_id: projectId }),
  enabled: !!projectId,
});
const { data: mudancas = [] } = useQuery({
  queryKey: ["mudancas_contratuais", projectId],
  queryFn: () => entities.MudancaContratual.filter({ projeto_id: projectId }),
  enabled: !!projectId,
});
```

### State local no form
```js
const [vinculoTipo, setVinculoTipo] = useState("risco"); // "risco" | "mudanca"
```

Ao **editar** uma ação existente, inicializar `vinculoTipo` corretamente:
```js
// dentro do handler handleEdit (ou equivalente ao abrir form para edição)
setVinculoTipo(acao.registro_mudanca_id ? "mudanca" : "risco");
setFormData({
  ...acao,
  registro_risco_id:   acao.registro_risco_id   || null,
  registro_mudanca_id: acao.registro_mudanca_id || null,
  // demais campos já presentes
});
```

Incluir em `emptyForm`:
```js
registro_risco_id: null,
registro_mudanca_id: null,
```

Ao fechar/cancelar o form, resetar `vinculoTipo` para `"risco"` junto com `setFormData(emptyForm)`.

### Substituição no formulário

Onde estava o campo `pleito_id` (ou onde seria adicionado o campo "Finalidade"), entrar:

```jsx
{/* Tipo de vínculo */}
<div className="space-y-2 md:col-span-2">
  <Label>Vincular a</Label>
  <div className="flex gap-4">
    {["risco", "mudanca"].map(tipo => (
      <label key={tipo} className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="vinculo-tipo"
          value={tipo}
          checked={vinculoTipo === tipo}
          onChange={() => {
            setVinculoTipo(tipo);
            setFormData(f => ({ ...f, registro_risco_id: null, registro_mudanca_id: null }));
          }}
        />
        <span className="text-sm capitalize">{tipo === "risco" ? "Risco" : "Mudança"}</span>
      </label>
    ))}
  </div>

  <Select
    value={vinculoTipo === "risco" ? formData.registro_risco_id || "__none__" : formData.registro_mudanca_id || "__none__"}
    onValueChange={(v) => {
      const id = v === "__none__" ? null : v;
      setFormData(f => vinculoTipo === "risco"
        ? { ...f, registro_risco_id: id, registro_mudanca_id: null }
        : { ...f, registro_risco_id: null, registro_mudanca_id: id }
      );
    }}
  >
    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
    <SelectContent>
      <SelectItem value="__none__">Nenhum</SelectItem>
      {(vinculoTipo === "risco" ? riscos : mudancas).map(item => (
        <SelectItem key={item.id} value={item.id}>
          {item.codigo || item.titulo || item.descricao || item.id}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

### `handleSubmit` — limpar FK não usada
```js
const payload = {
  ...formData,
  projeto_id: projectId,
  registro_risco_id:   vinculoTipo === "risco"   ? formData.registro_risco_id   : null,
  registro_mudanca_id: vinculoTipo === "mudanca" ? formData.registro_mudanca_id : null,
};
```

---

## Migration SQL consolidada

Arquivo: `docs/database/supabase-migration-m13-riscos.sql`

```sql
-- M13 — Gestão de Riscos: novos campos
ALTER TABLE riscos ADD COLUMN IF NOT EXISTS impactos      JSONB  DEFAULT '[]'::jsonb;
ALTER TABLE riscos ADD COLUMN IF NOT EXISTS escopo_texto  TEXT;
ALTER TABLE riscos ADD COLUMN IF NOT EXISTS prazo_dias    NUMERIC;
ALTER TABLE riscos ADD COLUMN IF NOT EXISTS valor_impacto NUMERIC;

-- M13 — PlanoAcao: FKs para Risco e Mudança
ALTER TABLE acoes
  ADD COLUMN IF NOT EXISTS projeto_id          UUID REFERENCES projetos(id)              ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS registro_risco_id   UUID REFERENCES riscos(id)               ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS registro_mudanca_id UUID REFERENCES mudancas_contratuais(id) ON DELETE SET NULL;
```

---

## Arquivos modificados

| Arquivo | Tipo de mudança |
|---------|----------------|
| `src/pages/RiscosMudancas/GestaoRiscos.jsx` | Tabs, novos campos R1/R2, import constants |
| `src/components/pleitos/PlanoAcao.jsx` | Movido → `src/components/riscos/PlanoAcao.jsx`; removido de PleitoDetalhes |
| `src/components/riscos/PlanoAcao.jsx` | Props, queries, form R4+R5 |
| `src/components/pleitos/MapaRegistroImpacto.jsx` | Import constants R3 |
| `src/components/pleitos/RegistroForm.jsx` | Import constants R3 |
| `src/components/pleitos/PleitoDetalhes.jsx` | Remove uso de PlanoAcao (import + JSX) |
| `src/lib/constants.js` | Novo — `IMPACT_CATEGORIES` |
| `docs/database/supabase-migration-m13-riscos.sql` | Novo — migration SQL |

---

## Fora de escopo

- Designer tasks (cards por categoria, padronização de botões verdes) — serão feitas pelo Designer separadamente
- Drop de `pleito_id` / `caso_id` da tabela `acoes` — preservados para compatibilidade histórica
- Gestão de Mudanças (R6+) — Lote separado
