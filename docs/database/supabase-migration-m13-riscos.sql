-- M13 Riscos — novos campos na tabela riscos
ALTER TABLE riscos ADD COLUMN IF NOT EXISTS impactos      JSONB   DEFAULT '[]'::jsonb;
ALTER TABLE riscos ADD COLUMN IF NOT EXISTS escopo_texto  TEXT;
ALTER TABLE riscos ADD COLUMN IF NOT EXISTS prazo_dias    NUMERIC;
ALTER TABLE riscos ADD COLUMN IF NOT EXISTS valor_impacto NUMERIC;

-- M13 Riscos — PlanoAcao: FKs para Risco e Mudança
ALTER TABLE acoes
  ADD COLUMN IF NOT EXISTS projeto_id          UUID REFERENCES projetos(id)              ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS registro_risco_id   UUID REFERENCES riscos(id)               ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS registro_mudanca_id UUID REFERENCES mudancas_contratuais(id) ON DELETE SET NULL;
