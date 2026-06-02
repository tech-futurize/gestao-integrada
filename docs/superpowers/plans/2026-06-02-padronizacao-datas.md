# Padronização de Formato de Datas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralizar toda formatação de datas de display em `formatDate` / `formatDateTime` e padronizar o sistema para `dd/MM/yy` (ex: `02/06/25`) e `dd/MM/yy HH:mm` (ex: `02/06/25 14:30`).

**Architecture:** Adicionar dois helpers de display em `src/lib/dateUtils.js` (que já existe com helpers de input/storage). Todos os 18 arquivos que hoje formatam datas inline passam a importar e usar esses helpers. Nenhuma lógica de negócio ou processamento interno é alterado.

**Tech Stack:** Vitest (testes), date-fns (já dependência do projeto), React JSX.

---

## Arquivo de referência: o que NÃO tocar

Estes padrões são **processamento interno** — nunca substituir por `formatDate`:

| Padrão | Motivo |
|---|---|
| `.toISOString().split("T")[0]` | Gera valor para storage/comparação |
| `format(date, "yyyy-MM")` | Chave interna do histograma |
| `format(w, "dd/MM")` | Label de gráfico sem ano (intencional) |
| `format(date, "MMM/yy")` | Label de gráfico abreviado (intencional) |
| `<input type="date">` | Browser controla exibição |
| `addDaysToDate()` em ContratoDetalhes | Calcula data futura para storage |

---

## Task 1: Adicionar helpers ao dateUtils.js + teste unitário

**Files:**
- Modify: `src/lib/dateUtils.js`
- Create: `src/lib/dateUtils.test.js`

- [ ] **Step 1: Escrever o teste antes da implementação**

Criar `src/lib/dateUtils.test.js`:

```js
import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime } from "./dateUtils";

describe("formatDate", () => {
  it("formata string ISO date-only como dd/MM/yy", () => {
    expect(formatDate("2025-06-02")).toBe("02/06/25");
  });

  it("formata string ISO datetime local como dd/MM/yy", () => {
    expect(formatDate("2025-06-02T14:30:00")).toBe("02/06/25");
  });

  it("formata objeto Date como dd/MM/yy", () => {
    expect(formatDate(new Date("2025-06-02T00:00:00"))).toBe("02/06/25");
  });

  it("retorna string vazia para null", () => {
    expect(formatDate(null)).toBe("");
  });

  it("retorna string vazia para undefined", () => {
    expect(formatDate(undefined)).toBe("");
  });

  it("retorna string vazia para string vazia", () => {
    expect(formatDate("")).toBe("");
  });
});

describe("formatDateTime", () => {
  it("formata string ISO datetime local como dd/MM/yy HH:mm", () => {
    expect(formatDateTime("2025-06-02T14:30:00")).toBe("02/06/25 14:30");
  });

  it("formata string ISO date-only como dd/MM/yy 00:00", () => {
    expect(formatDateTime("2025-06-02")).toBe("02/06/25 00:00");
  });

  it("retorna string vazia para null", () => {
    expect(formatDateTime(null)).toBe("");
  });

  it("retorna string vazia para undefined", () => {
    expect(formatDateTime(undefined)).toBe("");
  });
});
```

- [ ] **Step 2: Rodar teste para confirmar que falha**

```bash
npx vitest run src/lib/dateUtils.test.js
```

Esperado: FAIL — `formatDate is not a function`

- [ ] **Step 3: Implementar os helpers em dateUtils.js**

Adicionar `import { format } from "date-fns";` na primeira linha de `src/lib/dateUtils.js` e as duas funções no final do arquivo:

```js
import { format } from "date-fns";
```

Ao final do arquivo (após `toDateInput`):

```js
// Display date as "dd/MM/yy" (e.g. "02/06/25")
export function formatDate(val) {
  if (!val) return "";
  try {
    const d = typeof val === "string"
      ? new Date(val.includes("T") ? val : val + "T00:00:00")
      : val;
    if (isNaN(d.getTime())) return "";
    return format(d, "dd/MM/yy");
  } catch {
    return "";
  }
}

// Display date+time as "dd/MM/yy HH:mm" (e.g. "02/06/25 14:30")
export function formatDateTime(val) {
  if (!val) return "";
  try {
    const d = typeof val === "string"
      ? new Date(val.includes("T") ? val : val + "T00:00:00")
      : val;
    if (isNaN(d.getTime())) return "";
    return format(d, "dd/MM/yy HH:mm");
  } catch {
    return "";
  }
}
```

- [ ] **Step 4: Rodar teste para confirmar que passa**

```bash
npx vitest run src/lib/dateUtils.test.js
```

Esperado: PASS — todos os 10 testes verdes

- [ ] **Step 5: Commit**

```bash
git add src/lib/dateUtils.js src/lib/dateUtils.test.js
git commit -m "feat(dateUtils): adicionar formatDate e formatDateTime — dd/MM/yy"
```

---

## Task 2: Atualizar componentes de contratos

**Files:**
- Modify: `src/components/contratos/ContratosList.jsx`
- Modify: `src/components/contratos/ContratoDetalhes.jsx`

Ambos têm uma função `fmtDate` inline identica que deve ser removida.

- [ ] **Step 1: Atualizar ContratosList.jsx**

Remover a linha 9 (função inline):
```js
// REMOVER esta linha:
const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";
```

Adicionar import logo após os outros imports:
```js
import { formatDate } from "@/lib/dateUtils";
```

Substituir na JSX (linha 43):
```jsx
// DE:
{fmtDate(c.data_inicio)} → {fmtDate(c.data_fim)}
// PARA:
{formatDate(c.data_inicio) || "—"} → {formatDate(c.data_fim) || "—"}
```

- [ ] **Step 2: Atualizar ContratoDetalhes.jsx**

Remover a linha 10 (função inline):
```js
// REMOVER esta linha:
const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";
```

Adicionar import logo após os outros imports:
```js
import { formatDate } from "@/lib/dateUtils";
```

Substituir nas linhas 82 e 84:
```jsx
// DE:
<p className="text-sm font-semibold text-foreground">{fmtDate(contrato.data_inicio)} → {fmtDate(contrato.data_fim)}</p>
// PARA:
<p className="text-sm font-semibold text-foreground">{formatDate(contrato.data_inicio) || "—"} → {formatDate(contrato.data_fim) || "—"}</p>

// DE:
<p className="text-xs text-status-attention font-semibold">Término Atual: {fmtDate(terminoAtual)}</p>
// PARA:
<p className="text-xs text-status-attention font-semibold">Término Atual: {formatDate(terminoAtual) || "—"}</p>
```

**ATENÇÃO:** `addDaysToDate` usa `.toISOString().split("T")[0]` — é processamento interno, não tocar.

- [ ] **Step 3: Commit**

```bash
git add src/components/contratos/ContratosList.jsx src/components/contratos/ContratoDetalhes.jsx
git commit -m "refactor(contratos): usar formatDate centralizado"
```

---

## Task 3: Atualizar componentes cronograma e planejamento

**Files:**
- Modify: `src/components/cronograma/ViewTarefaModal.jsx`
- Modify: `src/components/planejamento/AdicionarCronogramaModal.jsx`

- [ ] **Step 1: Atualizar ViewTarefaModal.jsx**

Remover linhas 5–9 (função `fmtDate` local):
```js
// REMOVER este bloco:
function fmtDate(str) {
  if (!str) return "—";
  const d = new Date(str + "T00:00:00");
  return isNaN(d) ? "—" : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
```

Adicionar na linha 1 (antes dos outros imports):
```js
import { formatDate } from "@/lib/dateUtils";
```

Substituir todas as ocorrências de `fmtDate(` por `(formatDate(` + ` || "—")`:
- Buscar: `fmtDate(`
- Substituir por: `(formatDate(` e fechar com ` || "—")`

Resultado esperado (exemplo):
```jsx
// DE:
{fmtDate(tarefa.data_inicio)}
// PARA:
{formatDate(tarefa.data_inicio) || "—"}
```

- [ ] **Step 2: Atualizar AdicionarCronogramaModal.jsx**

Adicionar import antes dos imports existentes:
```js
import { formatDate } from "@/lib/dateUtils";
```

Substituir na linha 68:
```jsx
// DE:
{t.inicio_previsto && ` · ${new Date(t.inicio_previsto).toLocaleDateString("pt-BR")}`}
// PARA:
{t.inicio_previsto && ` · ${formatDate(t.inicio_previsto)}`}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/cronograma/ViewTarefaModal.jsx src/components/planejamento/AdicionarCronogramaModal.jsx
git commit -m "refactor(cronograma): usar formatDate centralizado"
```

---

## Task 4: Atualizar componentes de pleitos

**Files:**
- Modify: `src/components/pleitos/PleitosList.jsx`
- Modify: `src/components/pleitos/PleitoDetalhes.jsx`
- Modify: `src/components/pleitos/RegistrosList.jsx`
- Modify: `src/components/pleitos/RDOsList.jsx`
- Modify: `src/components/pleitos/HeatmapDrilldown.jsx`

- [ ] **Step 1: Atualizar PleitosList.jsx**

Remover imports de date-fns (linha 4–5) — são usados APENAS na formatação de data:
```js
// REMOVER:
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
```

Adicionar:
```js
import { formatDate } from "@/lib/dateUtils";
```

Substituir nas linhas 224–225:
```jsx
// DE:
{pleito.data_abertura
  ? format(new Date(pleito.data_abertura), "dd/MM/yyyy", { locale: ptBR })
  : ""}
// PARA:
{formatDate(pleito.data_abertura)}
```

- [ ] **Step 2: Atualizar PleitoDetalhes.jsx**

Remover imports de date-fns (linhas 8–9) — usados apenas nas linhas 35 e 127:
```js
// REMOVER:
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
```

Adicionar:
```js
import { formatDate, formatDateTime } from "@/lib/dateUtils";
```

Substituir linha 35:
```jsx
// DE:
{pleito.data_abertura && format(new Date(pleito.data_abertura), "dd/MM/yyyy", { locale: ptBR })}
// PARA:
{formatDate(pleito.data_abertura)}
```

Substituir linha 127:
```jsx
// DE:
{incidente.data_hora && format(new Date(incidente.data_hora), "dd/MM/yyyy HH:mm", { locale: ptBR })}
// PARA:
{formatDateTime(incidente.data_hora)}
```

- [ ] **Step 3: Atualizar RegistrosList.jsx**

Remover imports de date-fns (linhas 7–8) — usados apenas na linha 71:
```js
// REMOVER:
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
```

Adicionar:
```js
import { formatDateTime } from "@/lib/dateUtils";
```

Substituir linha 71:
```jsx
// DE:
{format(new Date(incidente.data_hora), "dd/MM/yyyy HH:mm", { locale: ptBR })}
// PARA:
{formatDateTime(incidente.data_hora)}
```

- [ ] **Step 4: Atualizar RDOsList.jsx**

Remover imports de date-fns (linha 7) — usados apenas na linha 78:
```js
// REMOVER:
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
```

Adicionar:
```js
import { formatDate } from "@/lib/dateUtils";
```

Substituir linha 78:
```jsx
// DE:
{rdo.data_hora && format(new Date(rdo.data_hora), "dd/MM/yyyy", { locale: ptBR })}
// PARA:
{formatDate(rdo.data_hora)}
```

- [ ] **Step 5: Atualizar HeatmapDrilldown.jsx**

Remover imports de date-fns (linha 2) — usados apenas nas linhas 43 e 207:
```js
// REMOVER:
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
```

Adicionar:
```js
import { formatDateTime } from "@/lib/dateUtils";
```

Substituir nas linhas 43 e 207 (mesmo padrão, duas ocorrências):
```jsx
// DE:
{format(new Date(registro.data_hora), "dd/MM/yyyy HH:mm", { locale: ptBR })}
// PARA:
{formatDateTime(registro.data_hora)}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/pleitos/PleitosList.jsx \
        src/components/pleitos/PleitoDetalhes.jsx \
        src/components/pleitos/RegistrosList.jsx \
        src/components/pleitos/RDOsList.jsx \
        src/components/pleitos/HeatmapDrilldown.jsx
git commit -m "refactor(pleitos): usar formatDate/formatDateTime centralizados"
```

---

## Task 5: Atualizar componentes de RDO

**Files:**
- Modify: `src/components/rdo/RDOModule.jsx`
- Modify: `src/components/rdo/RDODetail.jsx`
- Modify: `src/components/rdo/VincularAtividadesDialog.jsx`

- [ ] **Step 1: Atualizar RDOModule.jsx**

Remover imports de date-fns (linhas 11) — usados apenas na linha 193:
```js
// REMOVER:
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
```

Adicionar:
```js
import { formatDate } from "@/lib/dateUtils";
```

Substituir linha 193:
```jsx
// DE:
{rdo.data ? format(new Date(rdo.data + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "—"}
// PARA:
{formatDate(rdo.data) || "—"}
```

- [ ] **Step 2: Atualizar RDODetail.jsx**

Remover imports de date-fns (linhas 3–4) — usados apenas na linha 34:
```js
// REMOVER:
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
```

Adicionar:
```js
import { formatDate } from "@/lib/dateUtils";
```

Substituir linha 34:
```jsx
// DE:
{rdo.data ? format(new Date(rdo.data + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : ""}
// PARA:
{formatDate(rdo.data)}
```

- [ ] **Step 3: Atualizar VincularAtividadesDialog.jsx**

Remover imports de date-fns (linhas 5–6) — usados apenas nas linhas 95 e 97:
```js
// REMOVER:
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
```

Adicionar:
```js
import { formatDate } from "@/lib/dateUtils";
```

Substituir linha 95:
```jsx
// DE:
{format(new Date(inicio + "T00:00:00"), "dd/MM/yy", { locale: ptBR })}
// PARA:
{formatDate(inicio)}
```

Substituir linha 97:
```jsx
// DE:
{format(new Date(fim + "T00:00:00"), "dd/MM/yy", { locale: ptBR })}
// PARA:
{formatDate(fim)}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/rdo/RDOModule.jsx \
        src/components/rdo/RDODetail.jsx \
        src/components/rdo/VincularAtividadesDialog.jsx
git commit -m "refactor(rdo): usar formatDate centralizado"
```

---

## Task 6: Atualizar riscos e engenharia

**Files:**
- Modify: `src/components/riscos/PlanoAcao.jsx`
- Modify: `src/components/engenharia/DocDetalhe.jsx`

- [ ] **Step 1: Atualizar PlanoAcao.jsx**

Remover imports de date-fns (linhas 16–17) — usados apenas na linha 319:
```js
// REMOVER:
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
```

Adicionar:
```js
import { formatDate } from "@/lib/dateUtils";
```

Substituir linha 319:
```jsx
// DE:
{acao.data_fim_prevista ? format(new Date(acao.data_fim_prevista), "dd/MM/yyyy", { locale: ptBR }) : "-"}
// PARA:
{formatDate(acao.data_fim_prevista) || "-"}
```

- [ ] **Step 2: Atualizar DocDetalhe.jsx**

O arquivo já tem uma função local chamada `formatDate` na linha 27 — ela será substituída pelo import:

Adicionar import (antes dos outros imports do arquivo):
```js
import { formatDate } from "@/lib/dateUtils";
```

Remover a função local na linha 27:
```js
// REMOVER esta linha dentro do componente:
const formatDate = (d) => d ? d.split("-").reverse().join("/").slice(0, 10) : "—";
```

As chamadas existentes a `formatDate(...)` no JSX (ex: `{formatDate(doc.data_cronograma)}`) continuam funcionando com o helper importado. Como o helper retorna `""` para valores nulos (em vez de `"—"`), atualizar as chamadas que precisam do fallback:

```jsx
// DE:
{formatDate(doc.data_cronograma)}
{formatDate(doc.data_projetada)}
{formatDate(doc.data_real)}
// PARA:
{formatDate(doc.data_cronograma) || "—"}
{formatDate(doc.data_projetada) || "—"}
{formatDate(doc.data_real) || "—"}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/riscos/PlanoAcao.jsx \
        src/components/engenharia/DocDetalhe.jsx
git commit -m "refactor(riscos,engenharia): usar formatDate centralizado"
```

---

## Task 7: Atualizar páginas

**Files:**
- Modify: `src/pages/RiscosMudancas/GestaoMudancas.jsx`
- Modify: `src/pages/Configuracoes/GerenciarProjeto.jsx`
- Modify: `src/pages/Engenharia/Documentos.jsx`
- Modify: `src/pages/AdminContratual/Registros.jsx`

- [ ] **Step 1: Atualizar GestaoMudancas.jsx**

Adicionar import:
```js
import { formatDate } from "@/lib/dateUtils";
```

Substituir linha 237 (ISO bruto sendo exibido diretamente):
```jsx
// DE:
{m.data_ocorrencia && <div className="text-xs text-muted-foreground">{m.data_ocorrencia}</div>}
// PARA:
{m.data_ocorrencia && <div className="text-xs text-muted-foreground">{formatDate(m.data_ocorrencia)}</div>}
```

- [ ] **Step 2: Atualizar GerenciarProjeto.jsx**

Adicionar import:
```js
import { formatDate } from "@/lib/dateUtils";
```

Localizar a linha 145 e a linha com `data_fim_prevista` renderizado diretamente (buscar com `grep -n "p\.data_" src/pages/Configuracoes/GerenciarProjeto.jsx`):

```jsx
// DE (linha 145):
{p.data_inicio && <div><span className="font-medium">Início:</span> {p.data_inicio}</div>}
// PARA:
{p.data_inicio && <div><span className="font-medium">Início:</span> {formatDate(p.data_inicio)}</div>}

// Buscar e substituir também qualquer {p.data_fim_prevista} ou {p.data_prevista_termino} renderizado diretamente:
{p.data_fim_prevista && <div>...: {p.data_fim_prevista}</div>}
// PARA:
{p.data_fim_prevista && <div>...: {formatDate(p.data_fim_prevista)}</div>}
```

- [ ] **Step 3: Atualizar Documentos.jsx**

Adicionar import:
```js
import { formatDate } from "@/lib/dateUtils";
```

Remover função local `fmtDate` na linha 416 (dentro do JSX da tabela):
```js
// REMOVER:
const fmtDate = (d) => d ? d.split("-").reverse().join("/").slice(0, 10) : "—";
```

Substituir os três usos nas linhas 428, 432, 434:
```jsx
// DE:
{fmtDate(doc.data_cronograma)}
// PARA:
{formatDate(doc.data_cronograma) || "—"}

// DE:
{fmtDate(doc.data_projetada)}
// PARA:
{formatDate(doc.data_projetada) || "—"}

// DE:
{fmtDate(doc.data_real)}
// PARA:
{formatDate(doc.data_real) || "—"}
```

**ATENÇÃO:** As linhas 281, 414–415 usam `data_projetada` para comparação de strings ISO (não display) — NÃO tocar.

- [ ] **Step 4: Atualizar Registros.jsx**

Remover imports de date-fns (linhas 4–5) — usados apenas na linha 356–357:
```js
// REMOVER:
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
```

Adicionar:
```js
import { formatDate } from "@/lib/dateUtils";
```

Substituir linhas 356–357:
```jsx
// DE:
const dataFormatada = inc.data_hora
  ? format(new Date(inc.data_hora), "dd/MM/yyyy", { locale: ptBR })
  : "—";
// PARA:
const dataFormatada = formatDate(inc.data_hora) || "—";
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/RiscosMudancas/GestaoMudancas.jsx \
        src/pages/Configuracoes/GerenciarProjeto.jsx \
        src/pages/Engenharia/Documentos.jsx \
        src/pages/AdminContratual/Registros.jsx
git commit -m "refactor(pages): usar formatDate centralizado — elimina exibição de ISO bruto"
```

---

## Task 8: Verificação final

- [ ] **Step 1: Confirmar que não há mais padrões antigos de display**

```bash
# Não deve retornar resultados em componentes (exceto imports e uso interno legítimo):
grep -rn "toLocaleDateString" src/components src/pages
grep -rn 'format(new Date.*"dd/MM/yyyy"' src/components src/pages
grep -rn 'format(new Date.*"dd/MM/yy"' src/components src/pages
grep -rn "split.*reverse.*join" src/components src/pages
```

Esperado: zero ocorrências de `toLocaleDateString` em components/pages; zero de `format(new Date` com `"dd/MM/yyyy"` ou `"dd/MM/yy"`.

- [ ] **Step 2: Confirmar que os padrões internos legítimos não foram tocados**

```bash
grep -rn 'toISOString.*split' src/
grep -rn 'format.*yyyy-MM' src/
grep -rn "format.*dd/MM\"" src/
grep -rn "format.*MMM/yy" src/
```

Esperado: esses padrões existem e estão intactos.

- [ ] **Step 3: Rodar testes**

```bash
npx vitest run
```

Esperado: PASS em `src/lib/dateUtils.test.js`

- [ ] **Step 4: Iniciar o servidor e verificar manualmente**

```bash
npm run dev
```

Abrir no browser e verificar:
- Módulo Contratos: datas exibem `dd/MM/yy`
- Módulo Pleitos: datas de abertura e registros exibem `dd/MM/yy` e `dd/MM/yy HH:mm`
- Módulo RDO: datas de RDOs exibem `dd/MM/yy`
- Módulo Mudanças: campo `data_ocorrencia` exibe `dd/MM/yy` (não mais `AAAA-MM-DD`)
- Configurações / Gerenciar Projeto: datas de início e fim exibem `dd/MM/yy`
- Engenharia / Documentos: coluna de datas exibe `dd/MM/yy`
