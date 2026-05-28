-- M10: tabela rdo dedicada, desacoplada de registros
-- Bucket de storage: criar via SQL abaixo ou manualmente no Dashboard

CREATE TABLE IF NOT EXISTS rdo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  numero TEXT,
  data DATE NOT NULL,
  area TEXT,
  disciplinas JSONB DEFAULT '[]',
  clima JSONB DEFAULT '{}',
  mao_de_obra JSONB DEFAULT '[]',
  equipamentos JSONB DEFAULT '[]',
  atividades_vinculadas JSONB DEFAULT '[]',
  ocorrencias JSONB DEFAULT '[]',
  evidencias JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE rdo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated full access rdo"
  ON rdo FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS rdo_projeto_data_idx ON rdo (projeto_id, data DESC);
