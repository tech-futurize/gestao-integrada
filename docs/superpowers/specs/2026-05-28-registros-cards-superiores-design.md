---
name: registros-cards-superiores
description: Design dos cards superiores do módulo Registros — Total + 3 grupos com barras de proporção por Tipo, Responsabilidade e Status
metadata:
  type: project
---

# Spec: Cards Superiores — Módulo Registros

**Data:** 2026-05-28
**Módulo:** Adm. Contratual › Registros (`src/pages/AdminContratual/Registros.jsx`)
**Task PLAN.md:** M11 — `[ ] Designer: Cards superiores: Qtd por Tipo, Qtd por Responsabilidade, Qtd por Status`

---

## 1. Objetivo

Substituir os 4 cards planos atuais (Total / Registrado / Em Análise / Resolvido) por um layout de **1 card total + 3 grupos dimensionais** com barras de proporção relativa, oferecendo visão analítica imediata sem precisar rolar a tela.

---

## 2. Layout Aprovado

```
┌────────────┐ ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│            │ │  POR TIPO            │ │  POR RESPONSAB.      │ │  POR STATUS          │
│  TOTAL     │ │  Ata de Reunião  8 ▬ │ │  Contratada     10 ▬ │ │  Registrado      7 ▬ │
│   16       │ │  E-mail          5 ▬ │ │  Contratante     6 ▬ │ │  Em Análise      5 ▬ │
│  registros │ │  Notificação     3 ▬ │ │                      │ │  Resolvido       4 ▬ │
└────────────┘ └──────────────────────┘ └──────────────────────┘ └──────────────────────┘
```

4 painéis lado a lado numa única linha (`flex` com `gap`). O card Total é mais estreito; os 3 grupos têm `flex: 1` (largura igual entre si).

---

## 3. Especificação de Componentes

### 3.1 Card Total

| Propriedade | Valor |
|-------------|-------|
| Background | `rgba(38,255,255,0.06)` |
| Borda | `1px solid rgba(38,255,255,0.2)` |
| Sombra | `0 0 14px rgba(38,255,255,0.12)` |
| Border radius | `rounded-xl` (12px) |
| Padding | `px-4 py-4` |
| Label | `"TOTAL"` — `text-[10px] uppercase tracking-widest text-muted-foreground` |
| Valor | `text-3xl font-bold text-cyan-electric` + `textShadow: "0 0 14px rgba(38,255,255,0.6)"` |
| Sub-label | `"registros"` — `text-[10px] text-muted-foreground` |

### 3.2 Grupos de Dimensão (×3)

| Propriedade | Valor |
|-------------|-------|
| Background | `bg-card/50` ou `rgba(255,255,255,0.03)` |
| Borda | `1px solid border` |
| Border radius | `rounded-xl` |
| Padding | `px-4 py-3` |
| Título | `text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2.5` |
| `flex` | `flex-1` |

#### Item dentro do grupo

```
┌──────────────────────────────────┐
│ Label do item            Contagem│  ← dim-item-row
│ ████████░░░░░░░░░░░░░░░░░░░░░░░ │  ← barra de proporção (h-[3px])
└──────────────────────────────────┘
```

- **Label + Contagem:** `flex justify-between items-center`
- **Label:** `text-[11px] font-medium` com cor semântica do item
- **Contagem:** `text-xs font-bold` com mesma cor do label
- **Barra track:** `h-[3px] w-full rounded-full bg-muted/30`
- **Barra fill:** `h-[3px] rounded-full` com cor semântica; largura = `(count / total_da_dimensao) * 100%`

---

## 4. Cores Semânticas

### Por Tipo
| Valor | Cor | Tailwind |
|-------|-----|---------|
| Ata de Reunião | Roxo | `#c084fc` / `text-purple-400` |
| E-mail | Laranja | `#fb923c` / `text-orange-400` |
| Notificação | Vermelho | `#f87171` / `text-red-400` |

### Por Responsabilidade
| Valor | Cor | Tailwind |
|-------|-----|---------|
| Contratada | Azul | `#60a5fa` / `text-blue-400` |
| Contratante | Âmbar | `#fbbf24` / `text-amber-400` |

### Por Status
| Valor | Cor | Tailwind |
|-------|-----|---------|
| Registrado | Azul | `#60a5fa` / `text-blue-400` |
| Em Análise | Âmbar | `#fbbf24` / `text-amber-400` |
| Resolvido | Verde | `#4ade80` / `text-green-400` |

> Cores dark-mode friendly — todas funcionam em ambos os temas sem ajuste adicional.

---

## 5. Lógica de Dados

Os cálculos ficam no `useMemo` existente (`kpis`) dentro de `Registros.jsx`. A fonte de dados é `baseList` (já filtrada para excluir RDO).

```js
const kpis = useMemo(() => {
  const total = baseList.length;

  // Por Tipo
  const porTipo = [
    { label: "Ata de Reunião", count: baseList.filter(i => i.tipo_registro === "Ata de Reunião").length, color: "tipo-ata" },
    { label: "E-mail",         count: baseList.filter(i => i.tipo_registro === "E-mail").length,         color: "tipo-email" },
    { label: "Notificação",    count: baseList.filter(i => i.tipo_registro === "Notificação").length,    color: "tipo-notif" },
  ];

  // Por Responsabilidade
  const porResp = [
    { label: "Contratada",  count: baseList.filter(i => i.responsabilidade === "Contratada").length,  color: "resp-contratada" },
    { label: "Contratante", count: baseList.filter(i => i.responsabilidade === "Contratante").length, color: "resp-contratante" },
  ];

  // Por Status
  const porStatus = [
    { label: "Registrado", count: baseList.filter(i => i.status === "Registrado").length, color: "status-reg" },
    { label: "Em Análise", count: baseList.filter(i => i.status === "Em Análise").length, color: "status-ana" },
    { label: "Resolvido",  count: baseList.filter(i => i.status === "Resolvido").length,  color: "status-res" },
  ];

  return { total, porTipo, porResp, porStatus };
}, [baseList]);
```

A largura da barra fill é calculada inline: `width: \`${total > 0 ? (count / total) * 100 : 0}%\``

> **Denominador:** o total geral (`baseList.length`) — não o total da dimensão — para que as barras sejam comparáveis entre grupos.
>
> **Responsabilidade nula:** registros sem `responsabilidade` definida não aparecem em nenhum item do grupo — as barras somam menos que 100%. Isso é comportamento esperado; não criar categoria "Não definido".

---

## 6. Responsividade

| Viewport | Comportamento |
|----------|---------------|
| `≥ 1024px` | 4 painéis lado a lado numa linha |
| `768px – 1023px` | 2 colunas × 2 linhas (`grid-cols-2`) |
| `< 768px` | 1 coluna, cards empilhados (`grid-cols-1`) |

Implementar com `grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row`.

---

## 7. Estados

| Estado | Comportamento |
|--------|---------------|
| Loading (`isPending`) | 4 `<Skeleton>` no lugar dos cards (altura ~80px cada) |
| Sem dados (`total === 0`) | Cards renderizados com valor `0` e barras zeradas (não esconder) |
| Sem projeto selecionado | Já tratado pelo guard acima dos cards — não alcança o bloco de KPIs |

---

## 8. Arquivos Afetados

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/AdminContratual/Registros.jsx` | Substituir bloco KPI Bar (linhas 148–164) pelo novo layout |

Nenhum componente novo é necessário — o layout é inline na página, como os demais módulos do sistema.

---

## 9. Critério de Aceite

- [ ] Card Total exibe número total com glow ciano
- [ ] 3 grupos exibem todos os itens com contagem correta
- [ ] Barras de proporção refletem `count / total * 100%`
- [ ] Loading state com Skeletons
- [ ] Funciona em tema claro e escuro
- [ ] Responsivo: 2 colunas em tablet, 1 coluna em mobile
