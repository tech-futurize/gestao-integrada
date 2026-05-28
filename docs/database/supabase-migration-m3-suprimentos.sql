-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION M3 — SUPRIMENTOS
-- Aplica todas as alterações no schema do Mapa de Suprimentos (itens_mas)
-- e cria a tabela unidades_medida com o schema correto.
--
-- Execute este arquivo UMA VEZ no Supabase SQL Editor.
-- Todos os comandos usam IF NOT EXISTS / IF EXISTS — idempotentes.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Tabela de lookup: unidades_medida
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS unidades_medida (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sigla      TEXT NOT NULL UNIQUE,
  nome       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE unidades_medida ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'unidades_medida' AND policyname = 'Authenticated users full access'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users full access" ON unidades_medida
      FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Seed de unidades extras (siglas já existentes são ignoradas via ON CONFLICT)
-- Siglas canônicas pré-existentes: hr, kg, l, m, m², m³, ton, un
INSERT INTO unidades_medida (sigla, nome) VALUES
  ('kg',  'Quilograma'),
  ('ton', 'Tonelada'),
  ('m',   'Metro'),
  ('m²',  'Metro Quadrado'),
  ('m³',  'Metro Cúbico'),
  ('l',   'Litro'),
  ('un',  'Unidade'),
  ('hr',  'Hora'),
  ('pc',  'Peça'),
  ('d',   'Dia'),
  ('mês', 'Mês'),
  ('vb',  'Verba'),
  ('HH',  'Homem-Hora'),
  ('HM',  'Hora-Máquina'),
  ('cx',  'Caixa'),
  ('rl',  'Rolo'),
  ('gl',  'Galão'),
  ('jg',  'Jogo'),
  ('pr',  'Par')
ON CONFLICT (sigla) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. itens_mas — adicionar colunas que o front-end espera
-- ─────────────────────────────────────────────────────────────────────────────

-- FK para unidade de medida (substitui campo string livre `unidade`)
ALTER TABLE itens_mas ADD COLUMN IF NOT EXISTS unidade_id UUID REFERENCES unidades_medida(id) ON DELETE SET NULL;

-- Responsável pelo item (substitui rótulo "solicitante" da migration original)
ALTER TABLE itens_mas ADD COLUMN IF NOT EXISTS responsavel TEXT;

-- Fornecedor do item
ALTER TABLE itens_mas ADD COLUMN IF NOT EXISTS fornecedor TEXT;

-- Vínculo com tarefa do cronograma
ALTER TABLE itens_mas ADD COLUMN IF NOT EXISTS id_cronograma UUID REFERENCES tarefas_cronograma(id) ON DELETE SET NULL;

-- Data de necessidade derivada do cronograma vinculado
ALTER TABLE itens_mas ADD COLUMN IF NOT EXISTS data_cronograma DATE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Índices úteis
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_itens_mas_projeto      ON itens_mas(projeto_id);
CREATE INDEX IF NOT EXISTS idx_itens_mas_unidade      ON itens_mas(unidade_id);
CREATE INDEX IF NOT EXISTS idx_itens_mas_id_cronograma ON itens_mas(id_cronograma);
