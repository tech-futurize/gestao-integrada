-- ─────────────────────────────────────────────────────────────────────────────
-- Migration M4.4 — Cronograma: adicionar area e disciplina
-- Data: 2026-05-27
-- Aplicar no Supabase > SQL Editor (ou via CLI)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE tarefas_cronograma ADD COLUMN IF NOT EXISTS area       TEXT;
ALTER TABLE tarefas_cronograma ADD COLUMN IF NOT EXISTS disciplina TEXT;
