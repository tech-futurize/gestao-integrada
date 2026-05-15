# Planos de Ação — Módulo Standalone Removido

> **Status:** REMOVIDO como módulo independente no Milestone Refatoração Geral 2026-Q2.

## O que era

Exibia ações vinculadas a áreas de engenharia (Mobilização, Produção, Qualidade, Segurança, Suprimentos, Planejamento) usando a entidade `Engenharia`. Cada área tinha um card com formulário embutido para registrar ações corretivas.

## Por que foi removido

O conceito de "Plano de Ação" foi generalizado para funcionar com **riscos** e **mudanças**. A entidade `acoes` (exclusiva de `casos`) foi substituída pela tabela genérica `plano_acao` (vincula `riscos` ou `mudancas_contratuais` via FK).

## Onde a funcionalidade foi

- **Plano de Ação por Risco:** dentro de [Gestão de Riscos](./13-GestaoRiscos.md) (`/riscos-mudancas/gestao-riscos`)
- **Plano de Ação por Pleito:** dentro de [Pleitos](./03-Pleitos.md) (`/admin-contratual/pleitos`)

## Entidades

- `Engenharia` → tabela `engenharias` (não dropada; sem UI ativa)
- `Acao` → tabela `acoes` **DROPADA** no migration 2026-Q2 (substituída por `plano_acao`)

## Documentos Relacionados

- [Gestão de Riscos](./13-GestaoRiscos.md) | [Pleitos](./03-Pleitos.md)
- [DATABASE.md — plano_acao](../architecture/DATABASE.md)
