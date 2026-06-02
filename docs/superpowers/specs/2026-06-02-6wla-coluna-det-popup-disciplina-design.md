# Spec: 6WLA — Coluna Det. + Popup Reformulado + Ajuste de Colunas

**Data:** 2026-06-02  
**Arquivo principal:** `src/components/planejamento/SixWLATable.jsx`  
**Arquivo secundário:** `src/pages/Planejamento/SixWLA.jsx`

---

## Contexto

O 6WLA possui uma coluna chamada `DET` com um botão de texto que abre um `Popover` com detalhes da tarefa (área, disciplina, datas). O objetivo desta spec é:

1. Renomear o cabeçalho para `Det.`
2. Trocar o botão de texto por ícone de olho
3. Reformular o popup: disciplina como mini-card colorido, datas lado a lado
4. Ajustar larguras das colunas para melhor uso do espaço

---

## Mudanças

### 1. Cabeçalho `DET` → `Det.`

No `<th>` da coluna (linha 100 de SixWLATable.jsx), trocar o texto `DET` por `Det.`

---

### 2. Trigger: texto → ícone de olho

Importar `Eye` de `lucide-react`. Substituir o conteúdo do `<button>` de trigger do Popover:

**Antes:**
```jsx
<button className="text-[11px] font-semibold text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted transition-colors">
  DET
</button>
```

**Depois:**
```jsx
<button
  aria-label="Ver detalhes da atividade"
  title="Ver detalhes (área, disciplina, datas)"
  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
>
  <Eye className="w-4 h-4" />
</button>
```

---

### 3. Popup reformulado

#### 3a. Disciplina como mini-card colorido

`tarefa.disciplina` é texto livre armazenado na tarefa. Para associar uma cor:

- Em `SixWLA.jsx`: adicionar query `entities.Disciplina.list()` (sem `selectedProjectId` pois disciplinas são globais)
- Construir um mapa `disciplinaMap: { [nome_lower]: cor }` com `.toLowerCase()` na chave para tolerância de case
- Passar `disciplinaMap` como prop para `SixWLATable`
- Em `SixWLATable`: ao renderizar o popup, buscar `disciplinaMap[tarefa.disciplina?.toLowerCase()]` para obter a cor
- Fallback para `#6b7280` quando sem match

**Visual do mini-card:**

```jsx
<div
  className="rounded px-2.5 py-1.5 text-xs font-semibold"
  style={{
    borderLeft: `3px solid ${cor}`,
    background: `${cor}18`,   // ~10% opacity
    color: cor,
  }}
>
  {item.tarefa?.disciplina}
</div>
```

Se não houver disciplina, exibe `—` como texto simples.

#### 3b. Área

Mantém o mesmo formato atual: label + valor em `flex gap-2`.

#### 3c. Datas lado a lado — grid 3×3

Substituir as 6 linhas verticais por uma grid com cabeçalhos de coluna:

```
         Início       Fim
BL       01/01/25    31/12/25
Real     01/02/25    15/12/25
Proj     01/03/25    20/11/25
```

Implementação:
```jsx
<div className="grid grid-cols-3 gap-x-3 gap-y-1 text-xs border-t border-border pt-2 mt-2">
  {/* Cabeçalho */}
  <div /> {/* célula vazia (label) */}
  <span className="text-muted-foreground font-medium">Início</span>
  <span className="text-muted-foreground font-medium">Fim</span>
  {/* BL */}
  <span className="text-muted-foreground">BL</span>
  <span className="font-medium text-foreground">{fmtDateStr(tarefa?.data_inicio_baseline)}</span>
  <span className="font-medium text-foreground">{fmtDateStr(tarefa?.data_fim_baseline)}</span>
  {/* Real */}
  <span className="text-muted-foreground">Real</span>
  <span className="font-medium text-foreground">{fmtDateStr(tarefa?.data_inicio_real)}</span>
  <span className="font-medium text-foreground">{fmtDateStr(tarefa?.data_fim_real)}</span>
  {/* Proj */}
  <span className="text-muted-foreground">Proj</span>
  <span className="font-medium text-foreground">{fmtDateStr(tarefa?.inicio_previsto)}</span>
  <span className="font-medium text-foreground">{fmtDateStr(tarefa?.termino_previsto)}</span>
</div>
```

**Largura do popup:** `w-52` → `w-60` para acomodar o grid de datas.

---

### 4. Ajuste de larguras das colunas

**Constante `COL` (colunas sticky esquerda):**

| Coluna | Antes | Depois | Motivo |
|--------|-------|--------|--------|
| `semana` | 80px | 176px | Acomoda S1–S6 horizontalmente sem wrap |
| `det` | 44px | 40px | Apenas ícone, sem texto |

**Constante `R` (colunas sticky direita):**

| Coluna | Antes | Depois | Motivo |
|--------|-------|--------|--------|
| `restricao` | 48px | 36px | Checkboxes mais próximos entre si |
| `obs` | 80px | 64px | Reduz espaço entre ícone Edit e lixeira |
| `remove` | 40px | 32px | Lixeira mais junto à obs |

**Semana cell:** remover `flex-wrap`, manter `flex-nowrap`:
```jsx
// Antes
<div className="flex flex-wrap gap-1 justify-center">
// Depois
<div className="flex flex-nowrap gap-1 justify-center">
```

---

## Fluxo de dados (resumo)

```
SixWLA.jsx
  ├── useQuery ["disciplinas"] → Disciplina.list()
  ├── disciplinaMap = useMemo(() => Object.fromEntries(disciplinas.map(d => [d.nome.toLowerCase(), d.cor])))
  └── <SixWLATable disciplinaMap={disciplinaMap} ... />

SixWLATable.jsx
  ├── prop: disciplinaMap (opcional, default {})
  └── popup → cor = disciplinaMap[tarefa?.disciplina?.toLowerCase()] ?? "#6b7280"
```

---

## Arquivos a modificar

1. `src/components/planejamento/SixWLATable.jsx` — todas as mudanças visuais
2. `src/pages/Planejamento/SixWLA.jsx` — adicionar query Disciplinas + passar prop

---

## O que NÃO muda

- Lógica de `onUpdate` / `onDelete`
- Colunas de restrição (checkboxes), apenas largura
- Coluna de observação (Textarea no popover), apenas largura
- Queries de itens 6WLA e tarefas
