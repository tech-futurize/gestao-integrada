# Spec: Padronização de Formato de Datas

**Data:** 2026-06-02
**Status:** Aprovado

---

## Objetivo

Padronizar a exibição de datas em todo o sistema para o formato `dd/MM/yy` (ex: `02/06/25`) e `dd/MM/yy HH:mm` para data+hora (ex: `02/06/25 14:30`), eliminando a exibição de strings ISO brutas (`AAAA-mm-dd`) e inconsistências entre `dd/MM/yyyy` e `dd/MM/yy`.

---

## Abordagem Escolhida

**Opção A — Estender `src/lib/dateUtils.js`**

Adicionar duas funções de display ao arquivo utilitário de datas já existente. O projeto já usa `date-fns` como dependência, portanto sem novas libs.

---

## Novos Helpers (`src/lib/dateUtils.js`)

```js
// Retorna "02/06/25" — aceita string ISO, Date object, null/undefined
export function formatDate(val) {
  if (!val) return "";
  const d = typeof val === "string" ? new Date(val.includes("T") ? val : val + "T00:00:00") : val;
  return format(d, "dd/MM/yy");
}

// Retorna "02/06/25 14:30" — mesma assinatura
export function formatDateTime(val) {
  if (!val) return "";
  const d = typeof val === "string" ? new Date(val.includes("T") ? val : val + "T00:00:00") : val;
  return format(d, "dd/MM/yy HH:mm");
}
```

**Nota:** Strings ISO sem timezone (ex: `"2025-06-02"` do Supabase) recebem `T00:00:00` para evitar off-by-one de fuso horário — padrão já adotado no projeto.

---

## Escopo de Substituições

### Padrões que serão substituídos (display ao usuário)

| Padrão atual | Substituído por |
|---|---|
| `new Date(d).toLocaleDateString("pt-BR")` | `formatDate(d)` |
| `new Date(d + "T00:00:00").toLocaleDateString("pt-BR")` | `formatDate(d)` |
| `format(new Date(d), "dd/MM/yyyy")` | `formatDate(d)` |
| `format(new Date(d + "T00:00:00"), "dd/MM/yyyy")` | `formatDate(d)` |
| `format(new Date(d), "dd/MM/yy")` | `formatDate(d)` |
| `format(new Date(d + "T00:00:00"), "dd/MM/yy")` | `formatDate(d)` |
| `format(new Date(d), "dd/MM/yyyy HH:mm")` | `formatDateTime(d)` |
| `d.split("-").reverse().join("/")` | `formatDate(d)` |
| `{campo_data}` (ISO bruto renderizado diretamente) | `{formatDate(campo_data)}` |

### Padrões que NÃO serão tocados (processamento interno)

| Padrão | Motivo |
|---|---|
| `toISOString().split("T")[0]` | Valor para comparação/storage, não exibição |
| `format(date, "yyyy-MM")` | Chave interna do histograma (`"2025-03"`) |
| `format(w, "dd/MM")` | Label de gráfico intencional (sem ano) |
| `format(date, "MMM/yy")` | Label de gráfico intencional (`"jun/25"`) |
| `format(d, "23 jun")` via `toLocaleDateString` com `month: "short"` | Label de gráfico intencional |
| `input type="date"` | Controlado pelo browser — não mexer |
| `toDateInput`, `toUtcIso`, `toDatetimeLocal` | Helpers de storage já existentes |

---

## Arquivos Afetados (17 total)

### Utilitário central
- `src/lib/dateUtils.js` — adicionar `formatDate` e `formatDateTime`

### Componentes
- `src/components/contratos/ContratosList.jsx`
- `src/components/contratos/ContratoDetalhes.jsx`
- `src/components/planejamento/AdicionarCronogramaModal.jsx`
- `src/components/cronograma/ViewTarefaModal.jsx`
- `src/components/pleitos/PleitosList.jsx`
- `src/components/pleitos/PleitoDetalhes.jsx`
- `src/components/pleitos/RegistrosList.jsx`
- `src/components/pleitos/RDOsList.jsx`
- `src/components/pleitos/HeatmapDrilldown.jsx`
- `src/components/engenharia/DocDetalhe.jsx`
- `src/components/rdo/RDOModule.jsx`
- `src/components/rdo/RDODetail.jsx`
- `src/components/rdo/VincularAtividadesDialog.jsx`
- `src/components/riscos/PlanoAcao.jsx`

### Páginas
- `src/pages/RiscosMudancas/GestaoMudancas.jsx`
- `src/pages/Configuracoes/GerenciarProjeto.jsx`
- `src/pages/Engenharia/Documentos.jsx`
- `src/pages/AdminContratual/Registros.jsx`

---

## Critérios de Sucesso

1. Nenhum campo de data exibe formato `AAAA-mm-dd` ao usuário
2. Todos os campos de data exibem `dd/MM/yy`
3. Todos os campos de data+hora exibem `dd/MM/yy HH:mm`
4. Campos `null`/`undefined` exibem string vazia (sem erro)
5. Nenhuma lógica de negócio ou comparação de datas foi alterada
6. `dateUtils.js` é a única fonte de verdade para formatação de display

---

## O que esta spec não cobre

- Campos `input type="date"` (browser controla a exibição)
- Labels de gráficos com formato intencional (`dd/MM`, `MMM/yy`, `"23 jun"`)
- Lógica de conversão de fuso horário (helpers `toUtcIso`, `toDatetimeLocal`)
