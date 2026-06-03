-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION M18 — PLEITO VÍNCULOS
-- Tabela de junção polimórfica que conecta um pleito a registros de 9 módulos.
-- Execute UMA VEZ no Supabase SQL Editor. Idempotente (IF NOT EXISTS).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pleito_vinculos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pleito_id   UUID NOT NULL REFERENCES pleitos(id)  ON DELETE CASCADE,
  projeto_id  UUID NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  entidade    TEXT NOT NULL,
  registro_id UUID NOT NULL,
  label_cache TEXT,
  observacao  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Evita vínculos duplicados do mesmo registro no mesmo pleito
CREATE UNIQUE INDEX IF NOT EXISTS pleito_vinculos_uniq
  ON pleito_vinculos (pleito_id, entidade, registro_id);

CREATE INDEX IF NOT EXISTS pleito_vinculos_pleito_idx
  ON pleito_vinculos (pleito_id);
CREATE INDEX IF NOT EXISTS pleito_vinculos_pleito_entidade_idx
  ON pleito_vinculos (pleito_id, entidade);
CREATE INDEX IF NOT EXISTS pleito_vinculos_projeto_idx
  ON pleito_vinculos (projeto_id);

ALTER TABLE pleito_vinculos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pleito_vinculos' AND policyname = 'Authenticated users full access'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users full access" ON pleito_vinculos
      FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;
