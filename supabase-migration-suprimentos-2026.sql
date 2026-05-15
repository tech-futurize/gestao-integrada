-- ----------------------------------------------------------
-- Mapa de Suprimentos (itens_mas) — novos campos
-- ----------------------------------------------------------

-- Fornecedor (texto livre, mesmo padrão de contratos e engenharia)
ALTER TABLE itens_mas
    ADD COLUMN IF NOT EXISTS fornecedor TEXT;

-- Vínculo com cronograma
ALTER TABLE itens_mas
    ADD COLUMN IF NOT EXISTS id_cronograma UUID REFERENCES tarefas_cronograma(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS data_cronograma DATE;

-- Renomeações (data_necessidade → data_prevista, solicitante → responsavel)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'itens_mas' AND column_name = 'data_necessidade'
    ) THEN
        ALTER TABLE itens_mas RENAME COLUMN data_necessidade TO data_prevista;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'itens_mas' AND column_name = 'solicitante'
    ) THEN
        ALTER TABLE itens_mas RENAME COLUMN solicitante TO responsavel;
    END IF;
END $$;
