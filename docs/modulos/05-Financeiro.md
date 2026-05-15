# Financeiro — Módulo Removido

> **Status:** REMOVIDO no Milestone Refatoração Geral 2026-Q2. Rota `/Financeiro` redireciona para `/planejamento/avancos`.

## O que era

Controlava faturamento previsto vs. realizado por mês, calculando acumulados (curva S) e aderência financeira. Entidade: `Financeiro` → tabela `financeiros`.

## Por que foi removido

O controle de avanço financeiro foi absorvido pelo módulo **Avanços Físicos**, que já gerencia previsto × real × projetado por semana/mês. Manter os dois módulos separados gerava duplicação e confusão.

## Onde a funcionalidade foi

- [Planejamento / Avanços](./07-AvancoFisico.md) — rota `/planejamento/avancos`

## Entidade legada

- `Financeiro` → tabela `financeiros` (não dropada; sem UI ativa)

## Documentos Relacionados

- [Avanços Físicos](./07-AvancoFisico.md)
