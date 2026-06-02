-- M9 — Adiciona coluna faturamento_projetado à tabela financeiros
-- Permite que o painel de Avanço Financeiro use a linha "Projetado" com a mesma
-- lógica do Avanço Físico (campo avanco_projetado) e do Histograma (qtd_projetado).
-- A lógica de negócio: ao salvar Real, o Projetado do mesmo mês é zerado (front).

ALTER TABLE financeiros
  ADD COLUMN IF NOT EXISTS faturamento_projetado NUMERIC DEFAULT 0;
