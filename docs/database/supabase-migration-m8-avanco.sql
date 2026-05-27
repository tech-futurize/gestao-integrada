-- Migration M8: avanco_fisico → granularidade semanal (semana_iso)
-- Aprovado pelo PO em 2026-05-27 — Opção A

-- 1. Adicionar colunas novas
ALTER TABLE avanco_fisico ADD COLUMN IF NOT EXISTS semana_iso TEXT;
ALTER TABLE avanco_fisico ADD COLUMN IF NOT EXISTS avanco_projetado NUMERIC DEFAULT 0;

-- 2. Popular semana_iso a partir de mes_referencia existente
--    to_char com 'IYYY-"W"IW' gera formato ISO 8601 ex: "2025-W01"
UPDATE avanco_fisico
SET semana_iso = to_char(mes_referencia, 'IYYY-"W"IW')
WHERE mes_referencia IS NOT NULL
  AND semana_iso IS NULL;

-- 3. Tornar semana_iso NOT NULL (após população)
ALTER TABLE avanco_fisico ALTER COLUMN semana_iso SET NOT NULL;

-- 4. Unique constraint projeto × semana (chave de negócio) — idempotente
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_avanco_fisico_projeto_semana'
  ) THEN
    ALTER TABLE avanco_fisico
      ADD CONSTRAINT uq_avanco_fisico_projeto_semana
      UNIQUE (projeto_id, semana_iso);
  END IF;
END$$;

-- 5. Deprecar mes_referencia: tornar nullable
--    (novos registros não precisam preencher mes_referencia)
ALTER TABLE avanco_fisico ALTER COLUMN mes_referencia DROP NOT NULL;
