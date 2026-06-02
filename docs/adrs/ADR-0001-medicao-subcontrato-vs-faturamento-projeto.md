# ADR-0001 — Separar "Medição de Subcontrato" de "Faturamento do Projeto"

- **Data:** 2026-06-02
- **Status:** Proposto (aguardando aprovação do PO)
- **Decisores:** Architect, PO
- **Spec relacionada:** [2026-06-02-faturamento-projeto-reestruturacao-design.md](../superpowers/specs/2026-06-02-faturamento-projeto-reestruturacao-design.md)

## Contexto

O item único **"Medições"** em `Adm. Contratual` mistura dois conceitos distintos do domínio EPC:

1. **Medição de Subcontrato** — a construtora mede o que um fornecedor/empreiteiro executou. Natureza de **custo / contas a pagar**, escopo **por contrato**.
2. **Faturamento do Projeto** — a construtora mede o próprio avanço perante o cliente/dono da obra. Natureza de **receita / faturamento**, escopo **por projeto**, e deve alimentar o **Avanço Financeiro** (que já vive em `Planejamento`).

Manter os dois sob o mesmo módulo causa ambiguidade de navegação e impede a integração natural do faturamento com o painel de Avanço Financeiro.

## Decisão

Separar em dois módulos com nomes inequívocos:

- **Faturamento** (novo) — em **Planejamento** (`/planejamento/faturamento`), por projeto, alimentando o Avanço Financeiro **real** por derivação (single source of truth).
- **Medições** — medição de **subcontrato**, movida para **dentro do detalhe do Contrato** em `Adm. Contratual`. O item standalone `/admin-contratual/medicoes` é **removido**.

Ambos compartilham um componente reutilizável (`PqpEditor`) com PQP/EAP hierárquica em **JSONB** e importação de PQP. Ficam **fora de escopo**: evidências/RDO, central de aprovações, IA e retenção.

## Consequências

**Positivas**
- Navegação sem ambiguidade; cada medição encostada no que consome seu dado.
- Avanço Financeiro real com fonte única (Faturamento) — elimina escrita manual divergente e a classe de bug L013–L016.
- Reuso de UI/lógica via `PqpEditor`; menos retrabalho.

**Negativas / Custos**
- Drop de módulo (checklist L007) + migração de leitura das medições flat existentes.
- A linha "Real" do Avanço Financeiro deixa de ser editável (passa a derivada) — mudança de comportamento para o usuário.

**Reversibilidade**
- Modelo JSONB é o caminho simples; migração futura para tabela de itens com `parent_id` permanece possível se a robustez exigir.
