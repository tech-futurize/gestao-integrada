-- Migration M5: 6WLA Redesign
-- Remove colunas do modelo manual e adiciona FK + 6 booleanos de restrição

-- 1. Remover colunas antigas (inclui liberadas/semanas do modelo anterior)
ALTER TABLE itens_6wla
  DROP COLUMN IF EXISTS semana_ano,
  DROP COLUMN IF EXISTS atividade,
  DROP COLUMN IF EXISTS responsavel,
  DROP COLUMN IF EXISTS restricoes,
  DROP COLUMN IF EXISTS categoria_restricao,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS ppc,
  DROP COLUMN IF EXISTS liberadas,
  DROP COLUMN IF EXISTS semanas;

-- 2. Adicionar novas colunas de restrição booleanas + observação
-- (tarefa_cronograma_id já existia como nullable com FK — mantida)
ALTER TABLE itens_6wla
  ADD COLUMN IF NOT EXISTS restricao_projeto_eng  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS restricao_material      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS restricao_mao_obra      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS restricao_equipamentos  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS restricao_externas      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS restricao_informacoes   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS observacao              TEXT;

-- 3. Apagar registros órfãos (sem tarefa_cronograma_id = dados do modelo antigo)
DELETE FROM itens_6wla WHERE tarefa_cronograma_id IS NULL;

-- 4. Tornar tarefa_cronograma_id obrigatório
ALTER TABLE itens_6wla ALTER COLUMN tarefa_cronograma_id SET NOT NULL;

-- 5. Índice único: cada tarefa aparece no máximo 1x por projeto no 6WLA
CREATE UNIQUE INDEX IF NOT EXISTS itens_6wla_tarefa_projeto_uniq
  ON itens_6wla (tarefa_cronograma_id, projeto_id);
