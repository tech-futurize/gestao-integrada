-- M17 — Bug fixes: acoes.pleito_id nullable + atividades_cronograma novos campos
-- Aplicada via execute_sql em 2026-06-02

-- Fix 1: acoes criadas pelo PlanoAcao (Riscos/Mudanças) não têm pleito_id.
-- O campo era NOT NULL na criação original (módulo Pleitos), mas com a expansão
-- do PlanoAcao para cobrir Riscos e Mudanças, passou a ser opcional.
ALTER TABLE acoes ALTER COLUMN pleito_id DROP NOT NULL;

-- Fix 2: TarefaForm exibia e enviava 'responsavel' e 'predecessoras', mas essas
-- colunas nunca foram criadas na tabela. Adicionadas como texto livre, nullable.
ALTER TABLE atividades_cronograma ADD COLUMN IF NOT EXISTS responsavel   TEXT;
ALTER TABLE atividades_cronograma ADD COLUMN IF NOT EXISTS predecessoras TEXT;
