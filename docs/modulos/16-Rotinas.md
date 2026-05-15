# Rotinas — Removido da Sidebar

> **Status:** REMOVIDO da sidebar e da navegação ativa no Milestone Refatoração Geral 2026-Q2.
> Tabela `rotinas` existe, mas sem UI ativa.

## O que era

Controle de atividades administrativas recorrentes do projeto: relatórios periódicos, reuniões regulares, auditorias e procedimentos com frequência definida (Diária / Semanal / Mensal / etc.).

## Por que foi removido da sidebar

Baixo uso observado; funcionalidade pode ser coberta por itens do Cronograma com periodicidade ou por registros manuais no RDO.

## Entidade legada

- `Rotina` → tabela `rotinas` (não dropada; sem UI ativa)

## Para reativar

Adicionar rota em `App.jsx`, item em `navigationConfig.js` e criar página em `src/pages/Rotinas.jsx`.

## Documentos Relacionados

- [00-Indice.md](./00-Indice.md)
