# Spec — M12 Mapa de Impacto: Revisão Visual Pós-Changes

**Data:** 2026-05-27
**Agente:** Designer
**Arquivo alvo:** `src/components/pleitos/MapaRegistroImpacto.jsx`
**Escopo:** Correções visuais e limpeza de UI — nenhum outro arquivo alterado.

---

## Contexto

O Módulo 12 (Mapa de Impacto) tem 4 tasks pendentes no PLAN.md. Todas afetam apenas `MapaRegistroImpacto.jsx` e são mudanças puramente de UI sem lógica de negócio.

---

## Mudanças Especificadas

### 1. Corrigir gradiente da legenda do heatmap

**Problema:** O array hardcoded da legenda (linha 139) usa uma paleta azul/cinza (`#f1f5f9, #dbeafe, #93c5fd…`) que não corresponde ao `HEATMAP_STEPS` já definido no arquivo (verde → vermelho).

**Solução:** Substituir o array literal por iteração sobre `HEATMAP_STEPS`:

```jsx
// ANTES
{["#f1f5f9", "#dbeafe", "#93c5fd", "#f97316", "#ef4444", "#7f1d1d"].map((color, i) => (
  <div key={i} className="w-5 h-5 rounded-sm" style={{ backgroundColor: color, border: i === 0 ? "1px solid #e2e8f0" : "none" }} />
))}

// DEPOIS
{HEATMAP_STEPS.map((step, i) => (
  <div key={i} className="w-5 h-5 rounded-sm" style={{ backgroundColor: step.bg, border: i === 0 ? "1px solid #e2e8f0" : "none" }} />
))}
```

Resultado: 6 quadrados de cor branco → verde claro → verde médio → amarelo → laranja → vermelho, alinhados com o DESIGN.md §1.

---

### 2. Remover botão Export e import `Download`

**Problema:** Botão "Export" sem funcionalidade implementada. O import `Download` do lucide fica órfão após a remoção.

**Solução:**
- Remover o `<button>` com ícone `Download` e texto "Export" do bloco de header.
- Remover `Download` do import `lucide-react` (linha 3).
- O wrapper `<div className="flex items-center gap-4 flex-wrap">` é simplificado para conter apenas a legenda.

---

### 3. Remover textos descritivos

**Textos a remover:**

| Localização | Texto |
|---|---|
| Gráfico radar — `<h4>` | "Distribuição por Categoria" |
| Gráfico radar — `<p>` subtítulo | "Total de registros por categoria de impacto" |
| Gráfico pizza — `<p>` instrução | "Clique em uma fatia para filtrar o mapa acima" |
| Footer do card | "Clique em uma célula para ver os registros detalhados." |
| Footer do card | "Use as setas para navegar entre semanas." |

**O que manter:**
- `<h4>` "Responsabilidade Contratual" — título funcional, não descritivo.
- Chip de filtro ativo `{responsabilidadeFiltro && <span>…</span>}` — informação de estado, não texto descritivo. Deve ser mantido mas sem o `<p>` wrapper que tinha o texto instrucional.

**Estrutura resultante do bloco pizza:**
```jsx
<div>
  <h4 className="text-sm font-bold text-foreground mb-1">Responsabilidade Contratual</h4>
  {responsabilidadeFiltro && (
    <div className="mb-3">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer bg-foreground text-background"
        onClick={() => onPieClick(responsabilidadeFiltro)}
        title="Clique para remover o filtro">
        {responsabilidadeFiltro} ✕
      </span>
    </div>
  )}
  {/* Pie chart */}
</div>
```

> `onPieClick` já tem lógica `prev === name ? null : name`, então chamar com o valor ativo efetivamente limpa o filtro — sem necessidade de prop extra.

**Footer resultante:** A `<div>` do footer é removida inteiramente (ela continha apenas os dois textos instrucionais, sem outros elementos).

---

### 4. Corrigir corte de texto — gráfico de pizza

**Problema:** Labels externas do `<Pie outerRadius={90} />` dentro de `<ResponsiveContainer height={240}>` são cortadas nas bordas do SVG.

**Solução:**
- `outerRadius`: 90 → 72
- `PieChart`: adicionar `margin={{ top: 30, right: 50, bottom: 30, left: 50 }}`
- Substituir o `label` inline por função `renderPieLabel` com `<tspan>`:

```jsx
const renderPieLabel = ({ cx, cy, midAngle, outerRadius, name, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 28;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fontSize={10} fill="#6b7280" textAnchor={x > cx ? "start" : "end"}>
      <tspan x={x} dy="0">{name}</tspan>
      <tspan x={x} dy="14">{`${(percent * 100).toFixed(0)}%`}</tspan>
    </text>
  );
};
```

A função é definida dentro do componente `ChartsRow`. O `labelLine={true}` é mantido.

---

### 5. Corrigir corte de texto — gráfico radar

**Problema:** `PolarAngleAxis tick={{ fontSize: 9, width: 60 }}` corta labels com múltiplas palavras como "Gestão & Comunicação" e "Liberação de Área".

**Solução:**
- Substituir o objeto `tick` por componente `RadarTick` que quebra o texto por espaços.
- Aumentar `ResponsiveContainer height` de 240 → 280.
- `RadarTick` é definido como função no nível do módulo (fora do export default), antes de `ChartsRow`.

```jsx
function RadarTick({ x, y, payload, textAnchor }) {
  const words = payload.value.split(" ");
  return (
    <text x={x} y={y} textAnchor={textAnchor} fontSize={9} fill="#6b7280">
      {words.map((word, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : 11}>{word}</tspan>
      ))}
    </text>
  );
}
```

Uso:
```jsx
<PolarAngleAxis dataKey="category" tick={<RadarTick />} />
```

---

## Ordem de Implementação

1. Remover import `Download` + botão Export
2. Corrigir legenda (HEATMAP_STEPS)
3. Remover textos descritivos + simplificar footer
4. Adicionar `renderPieLabel` + ajustar `outerRadius` e `margin`
5. Adicionar `RadarTick` + ajustar altura do radar

---

## Critérios de Aceite

- [ ] Legenda mostra 6 quadrados branco → verde claro → verde médio → amarelo → laranja → vermelho
- [ ] Botão Export não existe mais na UI
- [ ] Nenhum dos textos descritos na Mudança 3 aparece na tela
- [ ] Labels da pizza ("Contratada" / "Contratante" + %) não são cortados em nenhuma resolução ≥ 1024px
- [ ] Labels do radar não são cortados para nenhuma das 10 categorias
- [ ] Chip de filtro ativo continua funcionando (aparece ao clicar em fatia da pizza)
- [ ] `npm run build` sem erros
