-- Migração: adiciona coluna classificacao à tabela riscos
-- Permite distinguir Ameaças de Oportunidades.
-- Riscos existentes herdam o valor padrão 'Ameaça'.

ALTER TABLE riscos
  ADD COLUMN IF NOT EXISTS classificacao TEXT DEFAULT 'Ameaça';

UPDATE riscos SET classificacao = 'Ameaça' WHERE classificacao IS NULL;
