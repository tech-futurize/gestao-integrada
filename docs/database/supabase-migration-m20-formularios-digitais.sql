-- M20 Formulários Digitais
-- Execute UMA VEZ via Supabase MCP apply_migration

-- 1. Definições de formulário (GLOBAIS — sem projeto_id, sem versionamento)
CREATE TABLE IF NOT EXISTS formularios_digitais (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo      TEXT        NOT NULL DEFAULT 'Formulário sem título',
  descricao   TEXT,
  ativo       BOOLEAN     NOT NULL DEFAULT true,
  definicao   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Respostas (POR PROJETO)
CREATE TABLE IF NOT EXISTS formulario_respostas (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID        NOT NULL REFERENCES formularios_digitais(id) ON DELETE CASCADE,
  projeto_id    UUID        NOT NULL,
  respondente   TEXT,
  answers       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_formulario_respostas_projeto
  ON formulario_respostas(projeto_id);
CREATE INDEX IF NOT EXISTS idx_formulario_respostas_formulario
  ON formulario_respostas(formulario_id);

-- 3. RLS (padrão do projeto: aberto a authenticated)
ALTER TABLE formularios_digitais  ENABLE ROW LEVEL SECURITY;
ALTER TABLE formulario_respostas  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "formularios_digitais: full access" ON formularios_digitais;
CREATE POLICY "formularios_digitais: full access" ON formularios_digitais
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "formulario_respostas: full access" ON formulario_respostas;
CREATE POLICY "formulario_respostas: full access" ON formulario_respostas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
