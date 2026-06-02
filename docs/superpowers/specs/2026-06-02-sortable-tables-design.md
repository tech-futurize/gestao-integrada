# Spec: Ordenação de Colunas em Tabelas — Padrão Global

**Data:** 2026-06-02
**Status:** Aprovado

---

## Objetivo

Implementar ordenação de colunas (sort) como padrão global em todas as tabelas de listagem de dados do sistema. O usuário clica no cabeçalho de qualquer coluna para ordenar ascendente; clica novamente para inverter (descendente). Null/undefined vai sempre ao final.

---

## Arquitetura

Duas unidades novas, sem modificar componentes shadcn/ui existentes:

```
src/hooks/useSortTable.js
src/components/ui/SortableTableHead.jsx
```

---

## `useSortTable` — Hook de Lógica

**Arquivo:** `src/hooks/useSortTable.js`

```js
import { useState, useMemo } from "react"

export function useSortTable(data, { defaultKey = null, defaultDir = "asc" } = {}) {
  const [sortKey, setSortKey] = useState(defaultKey)
  const [sortDir, setSortDir] = useState(defaultDir)

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir(d => d === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const sortedData = useMemo(() => {
    if (!sortKey || !data?.length) return data ?? []
    return [...data].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey]
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === "number" && typeof vb === "number")
        return sortDir === "asc" ? va - vb : vb - va
      const sa = String(va).toLowerCase(), sb = String(vb).toLowerCase()
      return sortDir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa)
    })
  }, [data, sortKey, sortDir])

  return { sortedData, sortKey, sortDir, handleSort }
}
```

**Regras de ordenação:**
- `null`/`undefined` sempre vai ao final, independente da direção
- Números: comparação numérica
- Strings e datas ISO (`"2024-01-15"`): `localeCompare` (ISO é lexicograficamente ordenável)
- Clicar na mesma coluna inverte a direção (`asc` → `desc`)
- Clicar em coluna diferente começa em `asc`

---

## `SortableTableHead` — Componente Visual

**Arquivo:** `src/components/ui/SortableTableHead.jsx`

```jsx
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export function SortableTableHead({ columnKey, sortKey, sortDir, onSort, children, className }) {
  const isActive = sortKey === columnKey
  const Icon = !isActive ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown

  return (
    <TableHead
      className={cn("cursor-pointer select-none group", className)}
      onClick={() => onSort(columnKey)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <Icon className={cn(
          "w-3.5 h-3.5 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"
        )} />
      </span>
    </TableHead>
  )
}
```

**Visual:**
- Ícone cinza fraco (`ArrowUpDown`) quando inativo; escurece no hover
- Ícone colorido (`ArrowUp`/`ArrowDown`) em `text-primary` quando ativo
- `select-none` evita seleção de texto em cliques rápidos

---

## Padrão de Uso

```jsx
// Em tabelas self-contained (dados locais):
const { sortedData, sortKey, sortDir, handleSort } = useSortTable(data)

// Em tabelas que recebem data como prop:
// → o hook vai no componente pai, que passa sortedData no lugar de data

// Cabeçalho sortável:
<SortableTableHead columnKey="nome" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>
  Nome
</SortableTableHead>

// Renderizar sortedData:
{sortedData.map(row => ...)}
```

---

## Tabelas que Receberão o Sort

| Arquivo | Colunas sortáveis | Padrão inicial |
|---|---|---|
| `components/riscos/PlanoAcao.jsx` | descricao, status, data_inicio_prevista, data_fim_prevista, responsavel | descricao asc |
| `pages/RiscosMudancas/GestaoRiscos.jsx` | codigo, descricao, categoria, probabilidade, impacto, status, responsavel | codigo asc |
| `pages/RiscosMudancas/GestaoMudancas.jsx` | codigo, descricao, categoria, status, responsavel | codigo asc |
| `pages/Engenharia/Documentos.jsx` | nome/titulo, disciplina, status, data | nome asc |
| `pages/Configuracoes/Usuarios.jsx` | nome, email, cargo, perfil, status | nome asc |
| `components/pleitos/RegistrosList.jsx` | data_hora, tipo_registro, responsabilidade, status | data_hora desc |
| `components/pleitos/RDOsList.jsx` | numero_rdo, data, disciplina, area | data desc |
| `components/pleitos/MapaRegistroImpacto.jsx` | colunas de impacto disponíveis | primeira coluna asc |

---

## Tabelas Excluídas (e motivo)

| Arquivo | Motivo |
|---|---|
| `planejamento/SixWLATable.jsx` | Cols expansíveis/sticky, comportamento de planejamento complexo |
| `histograma/HistogramaTabela.jsx` | Tabela pivô com células editáveis mensais |
| `planejamento/TakeOffCommodities.jsx` | Tabela de agregação de quantitativos |
| `suprimentos/MapaSuprimentos.jsx` | Pipeline visual de etapas, não lista de dados |

---

## Padrão para Tabelas Novas

Toda nova tabela de listagem de dados criada no projeto deve usar `SortableTableHead` para colunas sortáveis e `useSortTable` para gerenciar o estado. Colunas de ações (editar/deletar) nunca são sortáveis.
