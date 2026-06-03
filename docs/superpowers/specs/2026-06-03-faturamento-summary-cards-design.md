# Spec: Cards de Resumo — Módulo de Faturamento

**Data:** 2026-06-03
**Módulo:** Planejamento > Faturamento
**Autor:** Agent_Builder

---

## Objetivo

Adicionar um painel de cards de resumo na tela de Faturamento, posicionado abaixo da toolbar de filtros e acima da lista de faturamentos. Os valores dos cards devem refletir os dados já filtrados pelo usuário (período, status, busca).

---

## Layout

Duas linhas de cards responsivos (`grid` com `gap`):

### Linha 1 — Contagens (3 cards)

| Card | Valor principal | Subtexto |
|------|----------------|----------|
| Total de medições | nº de registros filtrados | "faturamentos no período" |
| Total concluído | nº de concluídos | R$ somado dos concluídos |
| Total em elaboração | nº em elaboração | R$ somado dos em elaboração |

### Linha 2 — Financeiro (4 cards)

| Card | Valor principal | Subtexto | Observação |
|------|----------------|----------|------------|
| Valor do contrato | `projetoAtivo.valor_contrato` formatado em R$ | "valor contratado" | Fixo, não filtrado |
| Valor total medido | soma de `valor_medido` dos filtrados | "medido no período" | |
| Percentual medido | `(medido / contrato) * 100` em % | "do contrato medido" | Exibe "—" se contrato = 0 ou null |
| Saldo a medir | `contrato - medido` em R$ | "saldo restante" | Exibe "—" se contrato = 0 ou null |

---

## Arquitetura

### Novo arquivo
`src/components/planejamento/FaturamentoSummary.jsx`

**Props recebidas:**
```js
{
  faturamentos: Array,    // já filtrados (vem de `filtrados` em Faturamento.jsx)
  valorContrato: number,  // projetoAtivo?.valor_contrato ?? 0
}
```

**Lógica interna (useMemo):**
- `totalCount` = `faturamentos.length`
- `concluidos` = filtrar por `status === "Concluído"`
- `elaboracao` = filtrar por `status === "Elaboração"`
- `totalMedido` = `sum(faturamentos.valor_medido)`
- `percentual` = `valorContrato > 0 ? (totalMedido / valorContrato) * 100 : null`
- `saldo` = `valorContrato > 0 ? valorContrato - totalMedido : null`

**Sem dependência de contexto** — recebe tudo via props, sem chamar `useProject()` ou `useQuery()` internamente.

### Alteração em `Faturamento.jsx`
Adicionar `<FaturamentoSummary>` entre `</FilterToolbar>` e `<FaturamentoList>`, passando `filtrados` e `projetoAtivo?.valor_contrato`.

---

## Visual dos Cards

Padrão `KpiCard` similar ao `DashboardExecutivo.jsx`:
- `Card` + `CardContent` do shadcn/ui
- Ícone com fundo colorido (`bg-color/10`)
- Label em uppercase pequeno
- Valor em `text-2xl font-bold`
- Subtexto em `text-xs text-muted-foreground`

Ícones sugeridos (lucide-react):
- Total medições → `FileText`
- Concluído → `CheckCircle2` (verde)
- Elaboração → `Clock` (âmbar)
- Valor contrato → `Building2` (azul)
- Valor medido → `DollarSign` (verde)
- Percentual → `Percent` (roxo)
- Saldo → `TrendingUp` (cinza/slate)

---

## Estados de Edge Case

- `valor_contrato = 0` ou `null`: percentual e saldo exibem "—"
- `faturamentos` vazio (sem dados no filtro): todos os valores numéricos mostram `0` ou `R$ 0,00`
- `projetoAtivo` ainda carregando: `valorContrato` recebe `0` (fallback seguro)

---

## Fora de Escopo

- Não criar componente `KpiCard` em `ui/` (escopo maior que o necessário)
- Não alterar lógica de filtros existente
- Não adicionar novos filtros
- Não modificar `FaturamentoList`
