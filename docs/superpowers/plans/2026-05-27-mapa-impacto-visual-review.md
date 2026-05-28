# M12 Mapa de Impacto — Visual Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar as 2 correções visuais pendentes em `MapaRegistroImpacto.jsx` — remoção do título redundante do radar e correção do corte de labels na pizza.

**Architecture:** Todas as mudanças estão em um único arquivo (`src/components/pleitos/MapaRegistroImpacto.jsx`). A função `renderPieLabel` é definida no nível do módulo (fora do `export default`) e passada como prop `label` do componente `<Pie>`. Nenhum novo arquivo, nenhuma nova dependência.

**Tech Stack:** React 18 · Recharts 2.x · Tailwind CSS 3.x · Lucide React

**Contexto:** As outras 3 mudanças do M12 já foram aplicadas em sessão anterior (diff confirmado em git): remoção do botão Export, correção do gradiente da legenda, textos instrucionais removidos, `RadarAngleTick` implementado. Este plano cobre apenas o que restou.

---

## Arquivo Único

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `src/components/pleitos/MapaRegistroImpacto.jsx` | Modificar | Remover h4 radar + corrigir labels pizza |

---

## Task 1: Remover h4 "Distribuição por Categoria"

**Arquivo:** `src/components/pleitos/MapaRegistroImpacto.jsx`

Contexto: o h4 está na função `ChartsRow`, na seção do gráfico radar. Atualmente na linha ~353 do arquivo (pode variar). A tag `<p>` de subtítulo já foi removida em sessão anterior, mas o `<h4>` ficou com `mb-3`.

- [ ] **Localizar e remover o h4**

Encontrar este bloco em `ChartsRow`:

```jsx
      {/* Radar chart */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-3">Distribuição por Categoria</h4>
        <ResponsiveContainer width="100%" height={260}>
```

Substituir por (sem o h4):

```jsx
      {/* Radar chart */}
      <div>
        <ResponsiveContainer width="100%" height={260}>
```

- [ ] **Verificar que o gráfico radar ainda renderiza corretamente**

```bash
npm run build 2>&1 | tail -5
```

Esperado: sem erros de compilação.

- [ ] **Commit**

```bash
git add src/components/pleitos/MapaRegistroImpacto.jsx
git commit -m "fix(M12): remover h4 'Distribuição por Categoria' do radar"
```

---

## Task 2: Corrigir labels cortados na pizza

**Arquivo:** `src/components/pleitos/MapaRegistroImpacto.jsx`

Contexto: o `<Pie>` usa `outerRadius={90}` dentro de `<ResponsiveContainer height={240}>` sem margem lateral. Labels "Contratada: X%" e "Contratante: X%" ultrapassam o bounding box do SVG e são cortados. A solução é: (a) reduzir `outerRadius` para 72, (b) adicionar `margin` ao `PieChart`, (c) substituir o label inline por função `renderPieLabel` que emite dois `<tspan>` (nome + %).

- [ ] **Adicionar função `renderPieLabel` no nível do módulo**

Adicionar ANTES da função `ChartsRow` (abaixo da função `RadarAngleTick` já existente):

```jsx
function renderPieLabel({ cx, cy, midAngle, outerRadius, name, percent }) {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 28;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fontSize={10}
      fill="#6b7280"
      textAnchor={x > cx ? "start" : "end"}
    >
      <tspan x={x} dy="0">{name}</tspan>
      <tspan x={x} dy="14">{`${(percent * 100).toFixed(0)}%`}</tspan>
    </text>
  );
}
```

- [ ] **Atualizar `<PieChart>` e `<Pie>` em `ChartsRow`**

Localizar o bloco atual da pizza:

```jsx
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={90}
              dataKey="value"
              cursor="pointer"
              onClick={(data) => onPieClick(data.name)}
              label={({ name, value }) =>
                `${name}: ${Math.round((value / totalPie) * 100)}%`
              }
              labelLine={true}
            >
```

Substituir por:

```jsx
        <ResponsiveContainer width="100%" height={240}>
          <PieChart margin={{ top: 30, right: 50, bottom: 30, left: 50 }}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={72}
              dataKey="value"
              cursor="pointer"
              onClick={(data) => onPieClick(data.name)}
              label={renderPieLabel}
              labelLine={true}
            >
```

Nota: a prop `label` passa agora a referência da função (sem `()`) — o Recharts a invoca com os dados de cada fatia automaticamente.

- [ ] **Build limpo**

```bash
npm run build 2>&1 | tail -5
```

Esperado: sem erros.

- [ ] **Commit**

```bash
git add src/components/pleitos/MapaRegistroImpacto.jsx
git commit -m "fix(M12): renderPieLabel com tspan — labels pizza sem corte"
```

---

## Task 3: Atualizar PLAN.md

- [ ] **Marcar tasks do Módulo 12 como concluídas**

No `PLAN.md`, localizar a seção `### Módulo 12 — MAPA DE IMPACTO` e marcar todos os itens como `[x]`:

```markdown
### Módulo 12 — MAPA DE IMPACTO

- [x] Designer: Gradiente Verde Claro → Vermelho (`MapaRegistroImpacto.jsx:21-28` + legenda `:139-144`)
- [x] Designer: Corrigir corte de texto no gráfico radar Contratada/Contratante
- [x] Builder: Remover botão "Export" (`:145-148`)
- [x] Builder: Remover textos descritivos ("Distribuição por Categoria", "Clique em uma célula…")
```

Adicionar nota de conclusão acima das tasks:

```markdown
> ✅ **Concluído — Audit score pendente** *(2026-05-27)*
```

- [ ] **Commit**

```bash
git add PLAN.md
git commit -m "docs(M12): marcar tasks Mapa de Impacto como concluídas"
```

---

## Self-Review

**Spec coverage:**
- Mudança 1 (gradiente legenda) — já aplicada, fora do escopo deste plano ✓
- Mudança 2 (botão Export) — já aplicada ✓
- Mudança 3 (textos descritivos) — h4 "Distribuição por Categoria" coberto por Task 1 ✓
- Mudança 4 (pie labels) — coberta por Task 2 ✓
- Mudança 5 (radar tick) — já aplicada ✓

**Placeholder scan:** Nenhum TBD, TODO ou passo sem código. ✓

**Type consistency:** `renderPieLabel` definida em Task 2 Step 1, referenciada como `label={renderPieLabel}` em Task 2 Step 2 — nomes batem. `RadarAngleTick` já existe no arquivo (não tocado). ✓
