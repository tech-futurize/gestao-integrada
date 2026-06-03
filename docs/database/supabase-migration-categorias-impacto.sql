-- =====================================================
-- Migration: Cadastro de Categorias de Impacto
-- =====================================================

-- 1. Criar tabela
CREATE TABLE IF NOT EXISTS categorias_impacto (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text        NOT NULL,
  projeto_id uuid        NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- 2. RLS
ALTER TABLE categorias_impacto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios autenticados acesso total"
  ON categorias_impacto
  FOR ALL
  USING (auth.role() = 'authenticated');

-- 3. Função de seed (dispara ao criar novo projeto)
CREATE OR REPLACE FUNCTION seed_categorias_impacto()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO categorias_impacto (nome, projeto_id) VALUES
    ('Engenharia',            NEW.id),
    ('Suprimentos',           NEW.id),
    ('Liberação de Área',     NEW.id),
    ('Escopo',                NEW.id),
    ('Planejamento',          NEW.id),
    ('Gestão e Comunicação',  NEW.id),
    ('Recursos',              NEW.id),
    ('Produtividade',         NEW.id),
    ('Segurança e Qualidade', NEW.id);
  RETURN NEW;
END;
$$;

-- 4. Trigger
DROP TRIGGER IF EXISTS trigger_seed_categorias_impacto ON projetos;
CREATE TRIGGER trigger_seed_categorias_impacto
  AFTER INSERT ON projetos
  FOR EACH ROW
  EXECUTE FUNCTION seed_categorias_impacto();

-- 5. Seed para projetos já existentes (idempotente)
INSERT INTO categorias_impacto (nome, projeto_id)
SELECT
  unnest(ARRAY[
    'Engenharia', 'Suprimentos', 'Liberação de Área', 'Escopo', 'Planejamento',
    'Gestão e Comunicação', 'Recursos', 'Produtividade', 'Segurança e Qualidade'
  ]),
  id
FROM projetos
WHERE id NOT IN (SELECT DISTINCT projeto_id FROM categorias_impacto);

-- 6. Adicionar coluna areas_impacto à tabela riscos
ALTER TABLE riscos
  ADD COLUMN IF NOT EXISTS areas_impacto jsonb DEFAULT '[]'::jsonb;
