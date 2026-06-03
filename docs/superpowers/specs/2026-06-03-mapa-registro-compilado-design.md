# Spec: Mapa de Registro Compilado

**Data:** 2026-06-03
**Módulo:** Admin Contratual → Mapa de Impacto
**Status:** Aprovado

---

## Contexto

O Mapa de Registro (`MapaRegistroImpacto`) é um heatmap temporal que plota registros de ocorrências por categoria de impacto ao longo de semanas. Atualmente consome apenas a entidade `Registro` (tabela `registros`).

O objetivo desta feature é expandir o mapa para ser um compilado de três fontes:
1. **Registros** — módulo de registros (`tipo_registro ≠ "RDO"`)
2. **RDOs** — relatórios diários de obra (`rdo`), cada ocorrência interna vira um ponto
3. **Mudanças Contratuais** — gestão de mudanças (`mudancas_contratuais`), categorias inferidas dos campos de impacto

---

## Decisões de Design

| Decisão | Escolha |
|---|---|
| RDOs: granularidade | Cada ocorrência interna do RDO vira um ponto independente no heatmap |
| Mudanças: categorização | Inferir da categoria a partir de campos de impacto (custo → Recursos, prazo → Planejamento, escopo → Escopo) |
| Drilldown: identificação de fonte | Badge colorido por fonte na lista e no detalhe |
| Estratégia arquitetural | Hook customizado `useMapaRegistroData` (abordagem B) |

---

## Arquitetura

```
MapaImpacto.jsx
  └─ useMapaRegistroData(selectedProjectId)
       ├─ useQuery("registros")        → entities.Registro.filter
       ├─ useQuery("rdos")             → entities.Rdo.filter
       └─ useQuery("mudancas")         → entities.MudancaContratual.filter
       retorna: { incidentes[], isPending, isError }
            ↓
MapaRegistroImpacto.jsx   ← SEM ALTERAÇÕES na lógica do heatmap
            ↓
HeatmapDrilldown.jsx      ← badge de fonte + branch "Mudança" no detalhe
```

---

## Formato Normalizado

O hook retorna `incidentes[]` onde cada item obedece o seguinte contrato:

```js
{
  id: string,                   // único; prefixado para RDO/Mudança
  data_hora: string,            // ISO string — campo unificado de data
  impacto_ocorrencia: string[], // array de IMPACT_CATEGORIES
  responsabilidade: string,     // "Contratada" | "Contratante" | ""
  descricao: string,            // texto resumo
  fonte: "Registro" | "RDO" | "Mudança",  // para badge no drilldown

  // Campos opcionais por fonte (para o detalhe no drilldown)
  tipo_registro?: string,       // fonte=Registro: Ata de Reunião, E-mail, Notificação
  status?: string,              // fonte=Registro: status do registro
  gravidade?: string,           // fonte=Registro
  impacto_preliminar?: string,  // fonte=Registro
  responsavel_registro?: string,// fonte=Registro
  _numero_rdo?: string,         // fonte=RDO: número do RDO pai
  _area?: string,               // fonte=RDO: área do RDO pai
  _titulo?: string,             // fonte=Mudança: título da mudança
  _impacto_custo?: number,      // fonte=Mudança
  _impacto_prazo_dias?: number, // fonte=Mudança
  _impacto_escopo?: string,     // fonte=Mudança
}
```

---

## Regras de Normalização

### Registros (`entities.Registro`)
- Filtro: `tipo_registro !== "RDO"`
- Campos: todos passam diretamente (`data_hora`, `impacto_ocorrencia`, `responsabilidade`, etc.)
- `fonte` = `"Registro"`

### RDOs (`entities.Rdo`)
- Para cada RDO, itera `rdo.ocorrencias[]`
- Inclui apenas ocorrências com `categorias.length > 0`
- `id` = `rdo-{rdo.id}-{index}`
- `data_hora` = `rdo.data + "T00:00:00"`
- `impacto_ocorrencia` = `ocorrencia.categorias`
- `responsabilidade` = `ocorrencia.responsabilidade || ""`
- `descricao` = `ocorrencia.descricao`
- `fonte` = `"RDO"`
- `_numero_rdo` = `rdo.numero`, `_area` = `rdo.area`
- RDOs sem nenhuma ocorrência com categorias são ignorados

### Mudanças Contratuais (`entities.MudancaContratual`)
- `id` = `mudanca-{mudanca.id}`
- `data_hora` = `mudanca.data_ocorrencia`
- `impacto_ocorrencia` = inferido:
  - `impacto_custo` diferente de 0 e não nulo → adiciona `"Recursos"`
  - `impacto_prazo_dias` diferente de 0 e não nulo → adiciona `"Planejamento"`
  - `impacto_escopo` preenchido (truthy) → adiciona `"Escopo"`
  - Fallback (array vazio após inferência) → `["Escopo"]`
- `responsabilidade` = `mudanca.origem` (já é "Contratada"/"Contratante")
- `descricao` = `mudanca.titulo`
- `fonte` = `"Mudança"`
- Mudanças sem `data_ocorrencia` são ignoradas

---

## Arquivos Modificados

### 1. `src/hooks/useMapaRegistroData.js` — NOVO

- 3 `useQuery` independentes (registros, rdos, mudancas)
- `isPending` = qualquer das 3 queries ainda carregando
- `isError` = qualquer das 3 queries com erro
- `useMemo` para normalização e merge
- Retorna `{ incidentes, isPending, isError }`

### 2. `src/pages/AdminContratual/MapaImpacto.jsx` — MODIFICAR

- Remover `useQuery` direto de registros
- Substituir por `useMapaRegistroData(selectedProjectId)`
- `<MapaRegistroImpacto incidentes={incidentes} />` — prop inalterada

### 3. `src/components/pleitos/HeatmapDrilldown.jsx` — MODIFICAR

**Lista de itens:**
- Badge de fonte substitui o badge `tipoColors[r.tipo_registro]`
  - `"Registro"` → `bg-purple-100 text-purple-700`
  - `"RDO"` → `bg-blue-100 text-blue-700`
  - `"Mudança"` → `bg-amber-100 text-amber-700`
- Para Registro: exibe `r.tipo_registro` em texto menor ao lado do badge de fonte

**View de detalhe (`RegistroDetalhe`):**
- Branch `fonte === "Registro"` → comportamento atual (descricao, impacto_preliminar, gravidade)
- Branch `fonte === "RDO"` → RDO Nº, Área, ocorrência descrita
- Branch `fonte === "Mudança"` → título, impacto custo/prazo/escopo formatados

### 4. `src/components/pleitos/MapaRegistroImpacto.jsx` — SEM ALTERAÇÕES

O filtro existente `incidentes.filter(i => i.impacto_ocorrencia?.length > 0 && i.data_hora)` continua funcionando corretamente com o formato normalizado.

---

## Critérios de Aceite

- [ ] Heatmap exibe dados das 3 fontes combinados por semana e categoria
- [ ] RDOs sem ocorrências categorizadas não aparecem no heatmap
- [ ] Mudanças sem `data_ocorrencia` não aparecem no heatmap
- [ ] Drilldown exibe badge de fonte colorido para cada item
- [ ] Detalhe do drilldown exibe campos corretos por fonte (Registro / RDO / Mudança)
- [ ] Loading state aguarda as 3 queries
- [ ] Sem regressão no filtro de responsabilidade (pizza) e radar
