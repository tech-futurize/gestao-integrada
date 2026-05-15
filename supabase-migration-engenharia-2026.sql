-- Migration: Engenharia 2026
-- Renomeia deadline → data_projetada e adiciona campos de vínculo com cronograma.

ALTER TABLE documentos_engenharia RENAME COLUMN deadline TO data_projetada;

ALTER TABLE documentos_engenharia ADD COLUMN IF NOT EXISTS id_cronograma   TEXT;
ALTER TABLE documentos_engenharia ADD COLUMN IF NOT EXISTS data_cronograma DATE;
ALTER TABLE documentos_engenharia ADD COLUMN IF NOT EXISTS data_real       DATE;

-- Garante que historico_revisoes e revisao_atual existem (podem já existir da migration anterior)
ALTER TABLE documentos_engenharia ADD COLUMN IF NOT EXISTS historico_revisoes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE documentos_engenharia ADD COLUMN IF NOT EXISTS revisao_atual       TEXT;
