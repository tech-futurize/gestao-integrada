# Notificações (Ruídos) — Removido da Sidebar

> **Status:** REMOVIDO da sidebar e da navegação ativa no Milestone Refatoração Geral 2026-Q2.
> Tabela `ruidos` existe, mas sem UI ativa.

## O que era

Registro de "ruídos" — sinais contratuais que ainda não atingiram o nível de Pleito formal. Cada ruído podia ser promovido automaticamente para um Pleito (`Caso`).

## Por que foi removido da sidebar

A funcionalidade de rastrear ocorrências pré-pleito foi absorvida pelo módulo **Registros** (`/admin-contratual/registros`), que registra incidentes e permite vinculá-los a Pleitos.

## Onde a funcionalidade foi

- [Registros](./02-Registros.md) — `/admin-contratual/registros` (entidade `Incidente`)
- [Pleitos](./03-Pleitos.md) — `/admin-contratual/pleitos` (entidade `Caso`)

## Entidade legada

- `Ruido` → tabela `ruidos` (não dropada; sem UI ativa)

## Documentos Relacionados

- [Registros](./02-Registros.md) | [Pleitos](./03-Pleitos.md)
