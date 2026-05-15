# Gestão de Riscos

## Rota e Entidades

- **Rota:** `/riscos-mudancas/gestao-riscos`
- **Página:** `src/pages/RiscosMudancas/GestaoRiscos.jsx`
- **Entidades:** `Risco` (tabela `riscos`) + `PlanoAcao` (tabela `plano_acao`)

## Visão Geral

Identificação e monitoramento de riscos do projeto com impacto múltiplo (Escopo, Prazo e/ou Valor). Inclui Plano de Ação integrado dentro do módulo. Dashboard com cards quantitativos por categoria.

## Cards de Resumo (topo)

- Total de riscos por categoria (sincronizado com categorias do Mapa de Impacto)
- Filtros com títulos visíveis

## Campos — Risco

| Campo | Tipo | Notas |
|---|---|---|
| `codigo` | TEXT | Código do risco (ex: R-001) |
| `descricao` | TEXT | |
| `categoria` | TEXT | Sincronizada com `src/lib/categorias.js` e Mapa de Impacto |
| `probabilidade` | TEXT | Baixa / Média / Alta |
| `impacto_nivel` | TEXT | Baixa / Média / Alta |
| `impactos` | JSONB | Array com 0 a 3 valores: 'Escopo', 'Prazo', 'Valor' (seleção múltipla) |
| `escopo_texto` | TEXT | Descrição do impacto no escopo |
| `prazo_dias` | INTEGER | Impacto em dias |
| `valor_impacto` | NUMERIC | Impacto financeiro em R$ |
| `score` | NUMERIC | Probabilidade × Impacto (calculado) |
| `status` | TEXT | Identificado / Em Monitoramento / Mitigado / Ocorrido / Encerrado |
| `responsavel` | TEXT | |
| `mitigacao` | TEXT | Plano de mitigação |
| `residual` | TEXT | Risco residual após mitigação |

## Campos — Plano de Ação (integrado)

Ver [DATABASE.md — plano_acao](../architecture/DATABASE.md). Vinculado via `registro_risco_id`.

## Comportamentos Principais

- Lista de riscos com matriz visual de probabilidade × impacto (heatmap)
- `impactos`: seleção múltipla — pode ter Escopo, Prazo e/ou Valor simultaneamente
- Plano de Ação acessível dentro do detalhe de cada risco
- Modal de criação/edição
- Filtros por categoria, probabilidade, impacto e status
- Botões Salvar: `bg-emerald-600` (verde esmeralda)
- `enabled: !!selectedProjectId`

## UX / Design

- Dual theme claro/escuro
- Score colorido: verde (baixo) → amarelo (médio) → vermelho (alto/crítico)

## Documentos Relacionados

- [Gestão de Mudanças](./08-GestaoMudancas.md) | [Mapa de Impacto](./21-MapaImpacto.md)
- [DATABASE.md — riscos, plano_acao](../architecture/DATABASE.md)
