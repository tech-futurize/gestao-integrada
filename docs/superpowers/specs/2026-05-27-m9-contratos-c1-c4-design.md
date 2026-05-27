---
name: m9-contratos-c1-c4
description: Spec de implementação das tasks C1–C4 do Módulo 9 (Adm. Contratual) — contratos e medições
metadata:
  type: project
---

# Spec — M9 Adm. Contratual: C1–C4 (Contratos + Medições)

**Data:** 2026-05-27  
**Aprovado por:** PO  
**Arquivos principais afetados:** `src/pages/Contratos.jsx`, `src/components/contratos/*`, `src/pages/AdminContratual/Medicoes.jsx`

---

## Contexto

O módulo de Adm. Contratual tem 4 tarefas pendentes que cobrem correções de dados, UI de Aditivos, vínculo entre Contratos e Medições, e limpeza do formulário de Medições.

### Estado atual relevante

| Arquivo | Problema |
|---------|----------|
| `ContratoForm.jsx` | Status: Ativo/Em Revisão/Suspenso/Encerrado/Cancelado (errado) · Tipo: inclui "Misto" (obsoleto) · valor como `type="number"` sem formatação BR |
| `contratos` (schema) | CHECK constraints com valores antigos |
| `aditivos` (schema) | Colunas `valor_adicional`/`dias_adicionais` em vez de `valor`/`prazo_dias`; sem `escopo_texto` |
| `MedicaoForm.jsx` | Campos obsoletos: `elaborador`, `valor_bruto`, `valor_retencao`, `valor_liquido` |
| `medicoes` (schema) | Idem — colunas antigas no banco |
| `ContratoDetalhes.jsx` | Recebe `medicoes={[]}` hardcoded; `onNovaMedicao` não implementado |

---

## C1 — Contratos: tipo, status e formatação BR

### Status

| Antes | Depois |
|-------|--------|
| Ativo | Em andamento |
| Em Revisão | — (removido) |
| Suspenso | — (removido) |
| Encerrado | Concluído |
| Cancelado | Paralisado |
| — | A iniciar (novo) |

Mapeamento de migração de dados:
- `'Ativo'` → `'Em andamento'`
- `'Em Revisão'` → `'Em andamento'`
- `'Suspenso'` → `'Paralisado'`
- `'Encerrado'` → `'Concluído'`
- `'Cancelado'` → `'Paralisado'`

### Tipo

| Antes | Depois |
|-------|--------|
| Misto | Fornecimento + Serviço |
| Serviços | Serviços (mantido) |
| Fornecimento | Fornecimento (mantido) |

### Formatação BR de valores

- `valor_total` no form: campo de texto com máscara (ponto milhar, vírgula decimal). Ao salvar, converte para float antes de persistir.
- Pattern: `formatBR(v)` para exibição → `parseBR(s)` para salvar. Usar `Intl.NumberFormat("pt-BR")` para formatar e regex para parsear.

### Cores de status (ContratosList + ContratoDetalhes)

```js
const STATUS_COLORS = {
  "A iniciar":    "bg-muted text-muted-foreground",
  "Em andamento": "bg-status-positive/15 text-status-positive",
  "Concluído":    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Paralisado":   "bg-status-critical/15 text-status-critical",
};
```

---

## C2 — Aditivos UI + cálculo dinâmico de datas

### Schema migration (aditivos)

```sql
ALTER TABLE aditivos
  ADD COLUMN IF NOT EXISTS escopo_texto TEXT,
  ADD COLUMN IF NOT EXISTS prazo_dias INTEGER,
  ADD COLUMN IF NOT EXISTS valor NUMERIC;

UPDATE aditivos SET prazo_dias = dias_adicionais::INTEGER WHERE dias_adicionais IS NOT NULL;
UPDATE aditivos SET valor = valor_adicional WHERE valor_adicional IS NOT NULL;

ALTER TABLE aditivos
  DROP COLUMN IF EXISTS dias_adicionais,
  DROP COLUMN IF EXISTS valor_adicional;
```

### Novos componentes

**`AditivoForm.jsx`** — modal de criação/edição de aditivos:

Campos:
- Número (text)
- Tipo: Select `['Prazo', 'Valor', 'Prazo e Valor']`
- Escopo (textarea — `escopo_texto`)
- Prazo (número inteiro — `prazo_dias`)
- Valor R$ (formatação BR — `valor`)
- Justificativa (textarea)
- Data de Assinatura (date)
- Status: Select `['Pendente', 'Assinado', 'Cancelado']`

**`AditivosList.jsx`** — tabela inline dentro de `ContratoDetalhes`:

Colunas: Nº · Tipo · Escopo · Prazo (dias) · Valor · Status · Ações (Editar / Excluir)

Empty state: "Nenhum aditivo registrado."

### Integração em `ContratoDetalhes.jsx`

- Recebe `aditivos[]` como prop adicional
- Exibe seção "Aditivos" com `AditivosList` + botão `+ Aditivo`
- Exibe `inicio_atual` e `termino_atual` calculados:

```js
const totalDias = aditivos
  .filter(a => a.status === 'Assinado' && a.prazo_dias)
  .reduce((s, a) => s + a.prazo_dias, 0);

const terminoAtual = contrato.data_fim
  ? addDays(new Date(contrato.data_fim), totalDias)
  : null;
// inicio_atual = data_inicio original (não muda com aditivos)
```

Exibir `termino_atual` na seção de vigência, ao lado do `data_fim` original (com label "Término Atual").

### Integração em `Contratos.jsx`

- Adicionar query `["aditivos", contratoSelecionadoId]` ativa quando `selectedContrato` é set
- Mutations: `createAditivo`, `updateAditivo`, `deleteAditivo`
- State: `showAditivoForm`, `editAditivo`
- Passar `aditivos`, `onAddAditivo`, `onEditAditivo`, `onDeleteAditivo` para `ContratoDetalhes`

---

## C3 — Botão Medições: histórico + pop-up nova medição

### Integração em `Contratos.jsx`

- Adicionar query `["medicoes", "contrato", selectedContrato?.id]` (enabled quando `!!selectedContrato`)
- Mutation `createMedicaoFromContrato` que persiste com `contrato_id` e `projeto_id` pré-definidos
- State: `showMedicaoForm` (boolean)
- Passar `medicoes` reais + `onNovaMedicao` funcional para `ContratoDetalhes`

### `ContratoDetalhes.jsx` — seção Medições

- Já existe a seção de medições. Agora recebe dados reais.
- Botão `+ Nova Medição` → abre `MedicaoForm` com `defaultContratoId={contrato.id}`
- A lista de medições exibe: Nº · Período · Valor · Status
- Valor exibido: `m.valor ?? 0` (novo campo pós-C4)

---

## C4 — Medições: limpeza de campos + Import/Export

### Schema migration (medicoes)

```sql
ALTER TABLE medicoes
  ADD COLUMN IF NOT EXISTS valor NUMERIC;

-- popular valor a partir de valor_liquido ou valor_bruto existentes
UPDATE medicoes SET valor = COALESCE(valor_liquido, valor_bruto, 0);

ALTER TABLE medicoes
  DROP COLUMN IF EXISTS elaborador,
  DROP COLUMN IF EXISTS valor_bruto,
  DROP COLUMN IF EXISTS valor_retencao,
  DROP COLUMN IF EXISTS valor_liquido;
```

### `MedicaoForm.jsx` — campos removidos/alterados

**Remover:** `elaborador`, `valor_bruto` (Linha 75), `valor_retencao` (Linha 76)

**Alterar:**
- `valor_liquido` → `valor` (read-only, label "Valor (R$)")
- Calculado automaticamente como soma dos itens:
  ```js
  const valorCalculado = (form.itens || []).reduce(
    (s, item) => s + (parseFloat(item.valor_total) || 0), 0
  );
  ```
- Exibir como campo desabilitado com `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`

**Estado inicial:** remover `valor_bruto`, `valor_retencao`, `valor_liquido` do `useState`; adicionar `valor: ""`.

**`handleSubmit`:** `valor: valorCalculado`

### `MedicoesList.jsx`

- Substituir `m.valor_liquido || m.valor_bruto` → `m.valor`
- Remover exibição de `m.valor_retencao`

### `Medicoes.jsx` — ImportExportDialog

Adicionar no slot `actions` do `PageHeader`:

```jsx
<ImportExportDialog
  open={showImport}
  onOpenChange={setShowImport}
  onImport={handleImport}
  onExport={handleExport}
  exportFileName="medicoes"
  columns={[
    { key: "numero", label: "Número" },
    { key: "contrato_id", label: "Contrato ID" },
    { key: "periodo_inicio", label: "Período Início" },
    { key: "periodo_fim", label: "Período Fim" },
    { key: "valor", label: "Valor" },
    { key: "status", label: "Status" },
    { key: "observacoes", label: "Observações" },
  ]}
  data={medicoes}
/>
```

- `handleExport`: retorna `medicoes` com campos mapeados
- `handleImport`: cria medições em batch via `entities.Medicao.create`
- Botão de trigger: `<Download/Upload>` no PageHeader actions

---

## Migration consolidada

Arquivo: `docs/database/supabase-migration-m9-contratos.sql`

Ordem de operações:
1. Contratos: UPDATE status (dados) → DROP + ADD CHECK
2. Contratos: UPDATE tipo (dados) → DROP + ADD CHECK  
3. Aditivos: ADD colunas novas → migrate dados → DROP colunas antigas
4. Medicoes: ADD `valor` → migrate dados → DROP colunas obsoletas

---

## Arquivos a criar/modificar

| Ação | Arquivo |
|------|---------|
| CRIAR | `docs/database/supabase-migration-m9-contratos.sql` |
| CRIAR | `src/components/contratos/AditivoForm.jsx` |
| CRIAR | `src/components/contratos/AditivosList.jsx` |
| MODIFICAR | `src/components/contratos/ContratoForm.jsx` |
| MODIFICAR | `src/components/contratos/ContratosList.jsx` |
| MODIFICAR | `src/components/contratos/ContratoDetalhes.jsx` |
| MODIFICAR | `src/components/contratos/MedicaoForm.jsx` |
| MODIFICAR | `src/components/contratos/MedicoesList.jsx` |
| MODIFICAR | `src/pages/Contratos.jsx` |
| MODIFICAR | `src/pages/AdminContratual/Medicoes.jsx` |

---

## Sem mudanças necessárias em

- `supabaseEntities.js` — `Aditivo` já existe na linha 14
- Roteamento (`App.jsx`) — nenhuma nova rota
- `navigationConfig.js` — sem novos itens de nav
