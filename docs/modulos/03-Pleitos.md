# Pleitos — Gestão de Pleitos Contratuais

## Rota e Entidades

- **Rota:** `/admin-contratual/pleitos`
- **Página:** `src/pages/AdminContratual/Pleitos.jsx`
- **Entidades:** `Caso` (tabela `casos`) + `PlanoAcao` (tabela `plano_acao`)

## Visão Geral

Gestão formal de pleitos contratuais — reivindicações da contratada contra o contratante (escopo adicional, prazos, custos imprevistos) e anti-pleitos (defesa contra reivindicações indevidas). O Plano de Ação está integrado dentro do próprio módulo.

## Campos — Caso (Pleito)

| Campo | Tipo | Notas |
|---|---|---|
| `titulo` | TEXT | Nome resumido do pleito |
| `descricao_problema` | TEXT | Descrição detalhada |
| `contexto` | TEXT | Contexto e histórico |
| `partes_envolvidas` | JSONB | Array de strings |
| `data_abertura` | DATE | |
| `status` | TEXT | Aberto / Em Análise / Em Andamento / Resolvido / Fechado / Cancelado |
| `responsavel` | TEXT | |
| `aspecto_ordem` | TEXT | Técnica / Física / Econômica / Todos |
| `prioridade` | TEXT | Baixa / Média / Alta / Crítica |
| `categorias` | JSONB | Array de categorias sincronizado com Mapa de Impacto |

## Campos — Plano de Ação (integrado)

| Campo | Tipo | Notas |
|---|---|---|
| `descricao` | TEXT | Descrição da ação |
| `formato_tratativa` | TEXT | Reunião / Documento / Inspeção / Análise Técnica / Negociação / Outros |
| `data_prevista` | DATE | |
| `data_real` | DATE | |
| `responsavel` | TEXT | |
| `status` | TEXT | Pendente / Em Andamento / Concluída / Atrasada / Cancelada |
| `registro_risco_id` | UUID FK | NULL neste contexto (vinculado ao Caso via lógica de tela) |
| `registro_mudanca_id` | UUID FK | NULL neste contexto |

> **Nota:** A tabela `plano_acao` exige pelo menos um FK (risco ou mudança). Para pleitos, a associação é gerenciada na lógica do front.

## Comportamentos Principais

- Lista de pleitos com filtros por status, prioridade e período
- Modal de criação/edição com todos os campos do `Caso`
- Seção de Plano de Ação embutida no detalhe de cada pleito
- Badges de status com cores neon (ciano, ocre, magenta)
- `enabled: !!selectedProjectId` — query não executa sem projeto

## UX / Design

- Botões Salvar: `bg-emerald-600 hover:bg-emerald-700`
- Badges: pill neon seguindo o design system FuturizeNow
- Dual theme claro/escuro

## Documentos Relacionados

- [Mapa de Impacto](./21-MapaImpacto.md) | [Registros](./02-Registros.md)
- [DATABASE.md — casos e plano_acao](../architecture/DATABASE.md)
