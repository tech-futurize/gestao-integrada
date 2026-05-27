---
name: avanco-fisico-semana-iso-design
description: Spec completo do Módulo 8 — migração avanco_fisico para semana_iso, regras de negócio, gráfico barras mensais com toggle, import/export e fix bug Editar
metadata:
  type: project
---

# Spec — Módulo 8: Avanço Físico (migração semanal)

**Data:** 2026-05-27  
**Decisão aprovada pelo PO:** Opção A — migração completa para `semana_iso`, sem lógica dupla  
**Contexto:** PLAN.md → Módulo 8 — AVANÇO

---

## 1. Schema Migration

### Tabela `avanco_fisico` — alterações

```sql
-- 1. Adicionar colunas novas
ALTER TABLE avanco_fisico ADD COLUMN IF NOT EXISTS semana_iso TEXT;
ALTER TABLE avanco_fisico ADD COLUMN IF NOT EXISTS avanco_projetado NUMERIC DEFAULT 0;

-- 2. Popular semana_iso a partir de mes_referencia (1ª semana ISO do mês)
UPDATE avanco_fisico
SET semana_iso = to_char(mes_referencia::date, 'IYYY-"W"IW')
WHERE mes_referencia IS NOT NULL AND semana_iso IS NULL;

-- 3. Tornar NOT NULL após população
ALTER TABLE avanco_fisico ALTER COLUMN semana_iso SET NOT NULL;

-- 4. Constraint unique por projeto + semana
ALTER TABLE avanco_fisico
  ADD CONSTRAINT uq_avanco_fisico_projeto_semana UNIQUE (projeto_id, semana_iso);

-- mes_referencia permanece na tabela mas deprecada (UI para de escrever nela)
-- avanco_previsto_acumulado e avanco_realizado_acumulado: calculados no front, não persistidos
```

### Mapeamento de colunas pós-migração

| Coluna DB | Papel na UI | Observação |
|-----------|-------------|------------|
| `semana_iso` | Identificador temporal | Formato `"2025-W01"` (ISO 8601) |
| `avanco_previsto_mensal` | % previsto por semana | Nome mantido no DB |
| `avanco_realizado_mensal` | % realizado por semana | Nome mantido no DB |
| `avanco_projetado` | % projetado por semana | Novo campo |
| `mes_referencia` | ~~depreciado~~ | Não mais escrito pela UI |
| `avanco_previsto_acumulado` | ~~depreciado~~ | Calculado no front |
| `avanco_realizado_acumulado` | ~~depreciado~~ | Calculado no front |

**Arquivo de migration:** `docs/database/supabase-migration-m8-avanco.sql`

---

## 2. Regras de Negócio

### 2.1 Bloqueio de Real para semanas futuras

```js
// Retorna semana ISO atual no formato "YYYY-Www"
function getCurrentISOWeek() {
  const now = new Date();
  // Algoritmo ISO 8601: usa getDay() ajustado para segunda-feira como início
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const weekNum = Math.floor((now - startOfWeek1) / 604800000) + 1;
  const year = weekNum >= 52 && now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

function isFutureWeek(semana_iso) {
  // Comparação lexicográfica funciona diretamente para formato "YYYY-Www"
  return semana_iso > getCurrentISOWeek();
}
```

- Células `avanco_realizado_mensal` com `isFutureWeek(semana_iso) === true` → `disabled`, fundo cinza
- Células `avanco_previsto_mensal` → sempre editáveis
- Células `avanco_projetado` → editáveis apenas para semanas futuras (complementar ao Real)

### 2.2 Zerar Projetado ao salvar Real

Ao salvar `avanco_realizado_mensal` de uma semana:
```js
mutate({ semana_iso, avanco_realizado_mensal: valor, avanco_projetado: 0 })
```

### 2.3 Fórmulas de acumulado (calculadas no front)

Registros ordenados por `semana_iso` (string sort ISO funciona lexicograficamente):

```js
const sorted = [...dados].sort((a, b) => a.semana_iso.localeCompare(b.semana_iso));

// Running sums
let prevAcum = 0, realAcum = 0, projAcum = 0;
const withAccum = sorted.map(row => {
  prevAcum  += row.avanco_previsto_mensal ?? 0;
  realAcum  += row.avanco_realizado_mensal ?? 0;
  projAcum  += row.avanco_projetado ?? 0;
  return { ...row, prevAcum, realAcum, projAcum };
});
```

### 2.4 KPIs

```js
const totalPrev  = Σ(avanco_previsto_mensal);
const totalReal  = Σ(avanco_realizado_mensal);
const totalProj  = Σ(avanco_projetado);

// Alinhado com PLAN.md: "%Total Real = Real Acum / Prev Acum" e "%Total Projetado = Proj Acum / Prev Acum"
const pctTotalReal = totalPrev > 0 ? (totalReal / totalPrev) * 100 : 0;
const pctTotalProj = totalPrev > 0 ? (totalProj  / totalPrev) * 100 : 0;
const desvioAcum   = realAcum_ultimo - prevAcum_ultimo;
```

---

## 3. Tabela Transposta (UI)

### Escala de semanas

- Início: 1ª semana ISO de `(projeto.data_inicio - 3 meses)`
- Fim: última semana ISO de `(projeto.data_prevista_termino + 12 meses)`
- Geração no front com `useMemo`

### Layout

```
| Recurso    | Jan/25          | Fev/25          | ...
|            | W1 | W2 | W3   | W1 | W2 | W3 | W4 | ...
|------------|----|----|------|----|----|----|----|----
| Previsto   | %  | %  | %    | %  | %  | %  | %  |
| Real       | %  | %  | [X]  | %  | %  | %  | %  | ← [X] = futuro bloqueado
| Projetado  | -  | -  | %    | %  | %  | %  | %  |
```

- Header duplo: linha 1 = mês/ano (colspan = nº semanas do mês), linha 2 = número da semana
- Células editáveis inline (padrão HistogramaTabela — `onBlur` salva)
- Linha "TOTAL" no rodapé: soma de cada coluna + `%Total Real` e `%Total Projetado` nas colunas de resumo

### Edição inline

```
onBlur → se valor mudou → mutation.mutate({ semana_iso, campo, valor })
```

---

## 4. Gráfico

### Estrutura

```jsx
<ComposedChart data={chartData}>
  <Bar dataKey="previsto"  name="Previsto"  fill="#e5e7eb" />
  <Bar dataKey="realizado" name="Realizado" fill="#3b82f6" />
  <Bar dataKey="projetado" name="Projetado" fill="#a78bfa" />
  <Line yAxisId="right" dataKey="prevAcum"  name="Prev. Acum." stroke="#9ca3af" strokeDasharray="5 3" dot={false} />
  <Line yAxisId="right" dataKey="realAcum"  name="Real. Acum." stroke="#2563eb" dot={false} />
</ComposedChart>
```

### Toggle Semana / Mês

- Estado local `viewMode: 'semana' | 'mes'`
- `viewMode === 'mes'`: `chartData` = array por mês, agregando semanas com `reduce`
- `viewMode === 'semana'`: `chartData` = array por semana

```js
const chartData = useMemo(() => {
  if (viewMode === 'semana') return withAccum.map(...);
  // Agrupar por mês
  return Object.entries(
    withAccum.reduce((acc, row) => {
      const mes = row.semana_iso.substring(0, 4) + '-' + getMesFromISO(row.semana_iso);
      if (!acc[mes]) acc[mes] = { previsto: 0, realizado: 0, projetado: 0 };
      acc[mes].previsto  += row.avanco_previsto_mensal ?? 0;
      acc[mes].realizado += row.avanco_realizado_mensal ?? 0;
      acc[mes].projetado += row.avanco_projetado ?? 0;
      return acc;
    }, {})
  ).map(([mes, v]) => ({ name: mes, ...v }));
  // getMesFromISO: converte "2025-W01" → "Jan/25" via Date (primeira segunda da semana ISO)
  // Implementação no componente usando Intl.DateTimeFormat ou lookup array de meses
}, [withAccum, viewMode]);
```

- Eixo Y esquerdo: barras (0–100%)
- Eixo Y direito: linhas acumuladas (0–100%)

---

## 5. Import / Export

### EXPORT_COLUMNS

```js
const EXPORT_COLUMNS = [
  { key: 'semana_iso',              label: 'Semana ISO',         type: 'string', required: true },
  { key: 'avanco_previsto_mensal',  label: 'Previsto (%)',       type: 'number' },
  { key: 'avanco_realizado_mensal', label: 'Realizado (%)',      type: 'number' },
  { key: 'avanco_projetado',        label: 'Projetado (%)',      type: 'number' },
];
```

### Export

- Inclui todas as semanas da escala (-3m/+1a)
- Semanas sem registro no banco: exportadas com valores `0`

### Import / Upsert

```js
const handleImport = async (row) => {
  const existing = await entities.AvancoFisico.filter({
    projeto_id: selectedProjectId,
    semana_iso: row.semana_iso,
  });
  const payload = {
    projeto_id:              selectedProjectId,
    semana_iso:              row.semana_iso,
    avanco_previsto_mensal:  row.avanco_previsto_mensal  ?? 0,
    avanco_realizado_mensal: row.avanco_realizado_mensal ?? 0,
    avanco_projetado:        row.avanco_projetado        ?? 0,
  };
  if (existing.length > 0) await entities.AvancoFisico.update(existing[0].id, payload);
  else                      await entities.AvancoFisico.create(payload);
};
```

---

## 6. Fix Bug A5 — Botão Editar

O bug visual no botão Editar (referenciado em `Avancos.jsx` antes da migration) é resolvido
naturalmente pelo refactor completo do arquivo. O novo `Avancos.jsx` usa edição inline
(sem modal de edição), eliminando o componente bugado.

---

## 7. Arquivo de Saída

| Arquivo | Ação |
|---------|------|
| `docs/database/supabase-migration-m8-avanco.sql` | Criar — migration SQL |
| `src/pages/Planejamento/Avancos.jsx` | Reescrever completamente |
| `docs/architecture/DATABASE.md` | Atualizar seção `avanco_fisico` |

---

## 8. Critério de Aceite

- [ ] Migration SQL aplicada sem erro no Supabase
- [ ] Registros existentes com `semana_iso` preenchida corretamente
- [ ] Células Real bloqueadas para semanas futuras
- [ ] Ao salvar Real, `avanco_projetado` da mesma semana é zerado
- [ ] `%Total Real` e `%Total Projetado` corretos no rodapé
- [ ] Toggle Semana/Mês funcional no gráfico
- [ ] Linhas acumuladas visíveis no ComposedChart
- [ ] Import upsert por `(projeto_id, semana_iso)` funcional
- [ ] Export inclui escala completa (-3m/+1a) com zeros para semanas sem dado
- [ ] `npm run build` sem erros
