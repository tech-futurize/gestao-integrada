-- supabase-migration-m9-contratos.sql
-- M9 Adm. Contratual — alinha contratos, aditivos e medicoes com DATABASE.md

-- ─────────────────────────────────────────
-- CONTRATOS: atualizar dados de status
-- ─────────────────────────────────────────
UPDATE contratos SET status = CASE
  WHEN status = 'Ativo'       THEN 'Em andamento'
  WHEN status = 'Em Revisão'  THEN 'Em andamento'
  WHEN status = 'Suspenso'    THEN 'Paralisado'
  WHEN status = 'Encerrado'   THEN 'Concluído'
  WHEN status = 'Cancelado'   THEN 'Paralisado'
  ELSE status
END;

-- CONTRATOS: atualizar dados de tipo
UPDATE contratos SET tipo = 'Fornecimento + Serviço' WHERE tipo = 'Misto';

-- CONTRATOS: recriar CHECK constraints com novos valores
ALTER TABLE contratos DROP CONSTRAINT IF EXISTS contratos_status_check;
ALTER TABLE contratos ADD CONSTRAINT contratos_status_check
  CHECK (status IN ('A iniciar','Em andamento','Concluído','Paralisado'));

ALTER TABLE contratos DROP CONSTRAINT IF EXISTS contratos_tipo_check;
ALTER TABLE contratos ADD CONSTRAINT contratos_tipo_check
  CHECK (tipo IN ('Serviços','Fornecimento','Fornecimento + Serviço'));

-- ─────────────────────────────────────────
-- ADITIVOS: renomear colunas + adicionar escopo_texto
-- ─────────────────────────────────────────
ALTER TABLE aditivos RENAME COLUMN dias_adicionais TO prazo_dias;
ALTER TABLE aditivos RENAME COLUMN valor_adicional TO valor;
ALTER TABLE aditivos ALTER COLUMN prazo_dias TYPE INTEGER USING ROUND(prazo_dias::NUMERIC)::INTEGER;
ALTER TABLE aditivos ADD COLUMN IF NOT EXISTS escopo_texto TEXT;

-- ─────────────────────────────────────────
-- MEDICOES: adicionar coluna valor + remover campos obsoletos
-- ─────────────────────────────────────────
ALTER TABLE medicoes ADD COLUMN IF NOT EXISTS valor NUMERIC;
-- Preenchimento intencional: medições sem itens terão valor 0 (não NULL)
UPDATE medicoes SET valor = COALESCE(valor_liquido, valor_bruto, 0) WHERE valor IS NULL;
ALTER TABLE medicoes ALTER COLUMN valor SET NOT NULL;
ALTER TABLE medicoes ALTER COLUMN valor SET DEFAULT 0;
ALTER TABLE medicoes DROP COLUMN IF EXISTS elaborador;
ALTER TABLE medicoes DROP COLUMN IF EXISTS valor_bruto;
ALTER TABLE medicoes DROP COLUMN IF EXISTS valor_retencao;
ALTER TABLE medicoes DROP COLUMN IF EXISTS valor_liquido;
