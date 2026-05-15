# Relacionamentos — Removido da Sidebar

> **Status:** REMOVIDO da sidebar e da navegação ativa no Milestone Refatoração Geral 2026-Q2.
> Rota `/Relacionamentos` e tabela `relacionamentos` existem, mas sem UI ativa.

## O que era

Log de interações com stakeholders. Cada registro documentava uma tratativa, reunião ou negociação com pessoas ou organizações, classificando o tom (Excelente / Bom / Neutro / Tenso / Crítico) e o resultado.

## Por que foi removido da sidebar

Baixo uso observado no produto; foi priorizado simplificar o menu lateral para os módulos mais críticos da operação de obra.

## Entidade legada

- `Relacionamento` → tabela `relacionamentos` (não dropada; sem UI ativa)

## Para reativar

Adicionar rota em `App.jsx`, item em `navigationConfig.js` e criar página em `src/pages/Relacionamentos.jsx`.

## Documentos Relacionados

- [00-Indice.md](./00-Indice.md)
- [DATABASE.md](../architecture/DATABASE.md)
