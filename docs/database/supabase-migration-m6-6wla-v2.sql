-- Migration: M6 6WLA v2 — adicionar flag de adição manual
-- Aplicar via Supabase MCP (execute_sql) ou dashboard SQL Editor

ALTER TABLE itens_6wla ADD COLUMN IF NOT EXISTS adicionado_manualmente BOOLEAN NOT NULL DEFAULT FALSE;
