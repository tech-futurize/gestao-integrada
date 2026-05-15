# Suprimentos — Mapa de Suprimentos (MAS)

## Rota e Entidades

- **Rota:** `/suprimentos/mapa`
- **Página:** `src/pages/Suprimentos/MapaSuprimentos.jsx`
- **Componente:** `src/components/suprimentos/MapaSuprimentos.jsx`
- **Form:** `src/components/suprimentos/ItemMASForm.jsx`
- **Entidade:** `ItemMAS` (tabela `itens_mas`)

> **Requisições e Cotações foram removidos da UI.** As tabelas `requisicoes_compra` e `cotacoes` existem no banco mas sem interface ativa.

## Visão Geral

Mapa de Acompanhamento de Suprimentos (MAS) — rastreia o status de cada item de compra do projeto desde a emissão da SC/OC até o recebimento, com vínculo opcional ao cronograma.

## Campos (`itens_mas`)

| Campo | Tipo | Label UI | Notas |
|---|---|---|---|
| `descricao` | TEXT | Descrição do Material | Obrigatório |
| `unidade` | TEXT | Unidade | Select via `UNIDADES_MEDIDA` (`src/lib/unidadesMedida.js`): m³, kg, m, un, m², ton, l, hr |
| `quantidade` | NUMERIC | Quantidade | |
| `numero_sc` | TEXT | Nº SC/OC | Obrigatório; label renomeado de "Nº SC" |
| `responsavel` | TEXT | Responsável | Coluna renomeada de `solicitante` |
| `fornecedor` | TEXT | Fornecedor | Texto livre |
| `id_cronograma` | UUID FK → `tarefas_cronograma` | Vincular ao Cronograma | SET NULL; Select populado de `TarefaCronograma` |
| `data_cronograma` | DATE | Data Cronograma (automática) | Preenchida ao selecionar tarefa; campo readOnly no form |
| `data_prevista` | DATE | Data Prevista | Coluna renomeada de `data_necessidade`; data alvo do item |
| `status` | TEXT | Status | A iniciar / Em andamento / Concluído / Cancelado |
| `etapas` | JSONB | Linha do Tempo | Array de 7 etapas: `[{nome, status, data}]` |

### Etapas da Linha do Tempo

Requisição → Cotação → PATEC → Aquisição → Fabricação → Transporte → Fornecimento

Cada etapa tem `status` (`pendente`, `em_andamento`, `concluida`, `nao_aplicavel`) e `data` de referência.

## Comportamentos Principais

- **Paginação client-side:** 25 itens por página via `slice()` com controles ‹ 1 2 … ›; filtros resetam a página automaticamente.
- **Vínculo de cronograma:** ao selecionar uma `TarefaCronograma`, `data_cronograma` é preenchida automaticamente com `data_inicio_planejada` (fallback: `data_inicio_baseline`).
- **Alerta de atraso:** se `etapas[6].data > data_prevista`, exibe badge vermelho com ícone `AlertTriangle`.
- **Timeline interativa:** clique em um nó abre popover para atualizar status e data da etapa; progressão automática dos nós anteriores ao marcar "Concluída".
- **KPIs por etapa:** 7 cards coloridos mostrando quantos itens estão em cada fase.
- **Import/Export:** via `ImportExportDialog` com colunas: Nº SC/OC, Descrição, Fornecedor, Unidade, Quantidade, Responsável, Status, Data Prevista, Data Cronograma.
- `enabled: !!selectedProjectId`

## Filtros

- **Nº SC/OC** (busca por texto em `numero_sc`)
- **Status** (multi-select)
- **Etapa** (multi-select)
- **Responsável** (busca por texto em `responsavel`)
- **Alertas:** Fornecimento Atrasado | Cancelado em Aquisição

## UX / Design

- Dual theme claro/escuro
- Badges coloridos por status
- Scroll horizontal na tabela; paginação no rodapé
- Unidade via Select padronizado (não input livre)

## Migração SQL

Ver `supabase-migration-suprimentos-2026.sql` para as alterações incrementais:
- `ADD COLUMN fornecedor TEXT`
- `ADD COLUMN id_cronograma UUID REFERENCES tarefas_cronograma`
- `ADD COLUMN data_cronograma DATE`
- `RENAME COLUMN data_necessidade → data_prevista`
- `RENAME COLUMN solicitante → responsavel`

## Documentos Relacionados

- [Cronograma](./11-Cronograma.md) | [DATABASE.md](../architecture/DATABASE.md)
