# RDO — Relatório Diário de Obra

## Rota e Tabela

- **Rota:** `/admin-contratual/rdos`
- **Página:** `src/pages/AdminContratual/RDOs.jsx`
- **Tabela Supabase:** `rdo`
- **Nota:** não está no shim `supabaseEntities.js` — usa `supabase` client direto

## Visão Geral

Registro diário da execução da obra — disciplinas, clima, mão de obra, equipamentos, atividades vinculadas ao cronograma e evidências fotográficas. Desacoplado da tabela `incidentes` (que era o container anterior).

## Campos

| Campo | Tipo | Notas |
|---|---|---|
| `numero` | TEXT | Número sequencial do RDO |
| `data` | DATE | Data do relatório (sem campo Hora) |
| `area` | TEXT | Área da obra |
| `disciplinas` | JSONB | Array de strings — **seleção múltipla** via chips |
| `clima` | JSONB | `{manha: {condicao, praticabilidade}, tarde: {...}, noite: {...}}` — cada turno independente |
| `mao_de_obra` | JSONB | Array `[{nome, funcao, quantidade}]` |
| `equipamentos` | JSONB | Array `[{nome, identificacao, quantidade}]` |
| `atividades_vinculadas` | JSONB | Array de UUIDs de `tarefas_cronograma` |
| `ocorrencias` | JSONB | Array de ocorrências, cada uma podendo ter atividades vinculadas |
| `impactos` | JSONB | Impactos registrados |
| `evidencias` | JSONB | URLs do Supabase Storage (bucket `rdo-evidencias`) |

## Comportamentos Principais

- **Disciplinas:** seleção múltipla (não campo único); exibidas como chips/tags
- **Clima:** cada turno (manhã/tarde/noite) tem condição e praticabilidade independentes — não vinculados entre si
- **MO e Equipamentos:** botão "Adicionar" gera campos Nome, Função/Identificação e Quantidade
- **Vincular Atividades:** pop-up com lista do cronograma; filtros por ID, Descrição, Data, Área, Disciplina; checkbox múltiplo; disponível em Atividades e em cada Ocorrência
- **Evidências:** anexar arquivo ou capturar foto (upload para bucket `rdo-evidencias`)
- Sem botão "Anexar à Medição"
- Sem campo KM na área

## UX / Design

- Dual theme claro/escuro
- Formulário longo em seções colapsáveis (MO, Equipamentos, Atividades, Ocorrências, Evidências)

## Documentos Relacionados

- [Cronograma](./11-Cronograma.md) | [Registros](./02-Registros.md)
- [DATABASE.md — rdo](../architecture/DATABASE.md)
