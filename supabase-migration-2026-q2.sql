-- ============================================================
-- MIGRATION: supabase-migration-2026-q2.sql
-- Milestone: Refatoração Geral 2026-Q2
-- Sistema de Gestão Integrada — SaaS EPC
-- PostgreSQL 15+ / Supabase
--
-- Esta migration é IDEMPOTENTE. Pode ser executada múltiplas
-- vezes em produção sem efeitos colaterais.
-- ============================================================

BEGIN;

-- ============================================================
-- SEÇÃO 1 — DROP DE TABELAS REMOVIDAS
-- ============================================================

-- Módulo Qualidade: removido completamente neste milestone
DROP TABLE IF EXISTS rncs CASCADE;
DROP TABLE IF EXISTS licoes_aprendidas CASCADE;
DROP TABLE IF EXISTS atas_reuniao CASCADE;

-- acoes: substituída pela tabela genérica plano_acao
DROP TABLE IF EXISTS acoes CASCADE;

-- Suprimentos: Requisições e Cotações removidas da UI.
-- ATENÇÃO: tabelas mantidas temporariamente para segurança.
-- Descomentar as linhas abaixo SOMENTE após confirmação de
-- que nenhum dado de produção precisa ser preservado.
-- DROP TABLE IF EXISTS requisicoes_compra CASCADE;
-- DROP TABLE IF EXISTS cotacoes CASCADE;


-- ============================================================
-- SEÇÃO 2 — CRIAÇÃO DE NOVAS TABELAS
-- ============================================================

-- ----------------------------------------------------------
-- unidades_medida — lookup global (sem projeto_id, sem RLS)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS unidades_medida (
    id          TEXT PRIMARY KEY,   -- o código: kg, t, m3, etc.
    descricao   TEXT NOT NULL
);

-- Dados iniciais (idempotente via ON CONFLICT DO NOTHING)
INSERT INTO unidades_medida (id, descricao) VALUES
    ('kg',  'Quilograma'),
    ('t',   'Tonelada'),
    ('m3',  'Metro Cúbico'),
    ('m2',  'Metro Quadrado'),
    ('m',   'Metro Linear'),
    ('l',   'Litro'),
    ('un',  'Unidade'),
    ('pc',  'Peça'),
    ('h',   'Hora'),
    ('mes', 'Mês'),
    ('vb',  'Verba')
ON CONFLICT (id) DO NOTHING;


-- ----------------------------------------------------------
-- plano_acao — substitui "acoes"; genérico (risco ou mudança)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS plano_acao (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id            UUID NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
    descricao             TEXT NOT NULL,
    formato_tratativa     TEXT,         -- Reunião / Documento / Inspeção / Análise Técnica / Negociação / Outros
    data_prevista         DATE,
    data_real             DATE,
    responsavel           TEXT,
    status                TEXT,         -- Pendente / Em Andamento / Concluída / Atrasada / Cancelada
    registro_risco_id     UUID REFERENCES riscos(id) ON DELETE SET NULL,
    registro_mudanca_id   UUID REFERENCES mudancas_contratuais(id) ON DELETE SET NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Obrigatório vincular a pelo menos um: risco ou mudança
    CONSTRAINT chk_plano_acao_vinculo
        CHECK (registro_risco_id IS NOT NULL OR registro_mudanca_id IS NOT NULL)
);

-- RLS: policy authenticated full access
ALTER TABLE plano_acao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated full access" ON plano_acao;
CREATE POLICY "authenticated full access" ON plano_acao
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- ----------------------------------------------------------
-- rdo — Relatório Diário de Obra (desacoplado de incidentes)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS rdo (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id              UUID NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
    numero                  TEXT,
    data                    DATE NOT NULL,
    area                    TEXT,
    disciplinas             JSONB,  -- array de strings
    clima                   JSONB,  -- {manha, tarde, noite} cada com condicao e praticabilidade
    mao_de_obra             JSONB,  -- array [{nome, funcao, quantidade}]
    equipamentos            JSONB,  -- array [{nome, identificacao, quantidade}]
    atividades_vinculadas   JSONB,  -- array de UUIDs de tarefas_cronograma
    ocorrencias             JSONB,  -- array de ocorrências
    impactos                JSONB,
    evidencias              JSONB,  -- URLs do Supabase Storage (bucket rdo-evidencias)
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: policy authenticated full access
ALTER TABLE rdo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated full access" ON rdo;
CREATE POLICY "authenticated full access" ON rdo
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- ----------------------------------------------------------
-- usuarios — cadastro básico de usuários
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               TEXT UNIQUE NOT NULL,
    nome                TEXT NOT NULL,
    papel               TEXT NOT NULL DEFAULT 'usuario',
    projeto_padrao_id   UUID REFERENCES projetos(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: policy authenticated full access
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated full access" ON usuarios;
CREATE POLICY "authenticated full access" ON usuarios
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- ============================================================
-- SEÇÃO 3 — ALTER DE TABELAS EXISTENTES
-- ============================================================

-- ----------------------------------------------------------
-- incidentes — remover colunas RDO desacopladas
-- ----------------------------------------------------------

-- Remover colunas que pertencem ao módulo RDO (agora tabela própria)
ALTER TABLE incidentes
    DROP COLUMN IF EXISTS rdo_data,
    DROP COLUMN IF EXISTS numero_rdo,
    DROP COLUMN IF EXISTS area,
    DROP COLUMN IF EXISTS disciplina,
    DROP COLUMN IF EXISTS condicoes_climaticas_manha,
    DROP COLUMN IF EXISTS condicoes_climaticas_tarde,
    DROP COLUMN IF EXISTS condicoes_climaticas_noite,
    DROP COLUMN IF EXISTS turnos_manha,
    DROP COLUMN IF EXISTS turnos_tarde,
    DROP COLUMN IF EXISTS turnos_noite,
    DROP COLUMN IF EXISTS turno_manha,
    DROP COLUMN IF EXISTS turno_tarde,
    DROP COLUMN IF EXISTS turno_noite,
    DROP COLUMN IF EXISTS horario_inicio,
    DROP COLUMN IF EXISTS horario_fim,
    DROP COLUMN IF EXISTS horarios_inicio,
    DROP COLUMN IF EXISTS horarios_fim,
    DROP COLUMN IF EXISTS mao_de_obra,
    DROP COLUMN IF EXISTS equipamentos_rdo,
    DROP COLUMN IF EXISTS atividades,
    DROP COLUMN IF EXISTS ocorrencias,
    DROP COLUMN IF EXISTS responsabilidade,
    DROP COLUMN IF EXISTS impacto_ocorrencia,
    DROP COLUMN IF EXISTS hora,
    DROP COLUMN IF EXISTS tipo_registro;

-- Adicionar novas colunas em incidentes (se não existirem)
ALTER TABLE incidentes
    ADD COLUMN IF NOT EXISTS caso_id               UUID REFERENCES casos(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS atividades_vinculadas  JSONB,
    ADD COLUMN IF NOT EXISTS anexos                JSONB;


-- ----------------------------------------------------------
-- mudancas_contratuais — adicionar colunas novas
-- ----------------------------------------------------------
ALTER TABLE mudancas_contratuais
    ADD COLUMN IF NOT EXISTS impacto_escopo_tipo   TEXT,        -- Adição / Redução
    ADD COLUMN IF NOT EXISTS data_registro         DATE,        -- ex-data_ocorrencia (mantida por compatibilidade)
    ADD COLUMN IF NOT EXISTS pleito_texto          TEXT;

-- Nota sobre renomeação: data_ocorrencia foi mantida para preservar
-- dados existentes. data_registro foi adicionada como nova coluna.
-- Para migrar dados existentes descomente e ajuste conforme necessário:
-- UPDATE mudancas_contratuais SET data_registro = data_ocorrencia WHERE data_registro IS NULL;
-- ALTER TABLE mudancas_contratuais DROP COLUMN IF EXISTS data_ocorrencia;


-- ----------------------------------------------------------
-- tarefas_cronograma — adicionar colunas WBS
-- ----------------------------------------------------------
ALTER TABLE tarefas_cronograma
    ADD COLUMN IF NOT EXISTS codigo_wbs          TEXT,
    ADD COLUMN IF NOT EXISTS tipo                TEXT,            -- Resumo / Atividade / Marco
    ADD COLUMN IF NOT EXISTS nivel               INTEGER,
    ADD COLUMN IF NOT EXISTS inicio_baseline     DATE,
    ADD COLUMN IF NOT EXISTS termino_baseline    DATE,
    ADD COLUMN IF NOT EXISTS inicio_previsto     DATE,
    ADD COLUMN IF NOT EXISTS termino_previsto    DATE,
    ADD COLUMN IF NOT EXISTS area                TEXT,
    ADD COLUMN IF NOT EXISTS disciplina          TEXT,
    ADD COLUMN IF NOT EXISTS caminho_critico     BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS predecessoras       TEXT;

-- Adicionar CHECK de nível se não existir (PostgreSQL não tem IF NOT EXISTS para constraints)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_tarefas_cronograma_nivel'
          AND conrelid = 'tarefas_cronograma'::regclass
    ) THEN
        ALTER TABLE tarefas_cronograma
            ADD CONSTRAINT chk_tarefas_cronograma_nivel
            CHECK (nivel IS NULL OR (nivel BETWEEN 1 AND 9));
    END IF;
END $$;


-- ----------------------------------------------------------
-- riscos — adicionar colunas novas
-- ----------------------------------------------------------
ALTER TABLE riscos
    ADD COLUMN IF NOT EXISTS codigo          TEXT,
    ADD COLUMN IF NOT EXISTS impactos        JSONB,    -- array: ['Escopo', 'Prazo', 'Valor']
    ADD COLUMN IF NOT EXISTS escopo_texto    TEXT,
    ADD COLUMN IF NOT EXISTS prazo_dias      INTEGER,
    ADD COLUMN IF NOT EXISTS valor_impacto   NUMERIC,
    ADD COLUMN IF NOT EXISTS residual        TEXT;


-- ----------------------------------------------------------
-- itens_mas — adicionar FK para unidades_medida
-- ----------------------------------------------------------
ALTER TABLE itens_mas
    ADD COLUMN IF NOT EXISTS unidade_id TEXT REFERENCES unidades_medida(id) ON DELETE SET NULL;


-- ----------------------------------------------------------
-- documentos_engenharia — adicionar colunas novas
-- ----------------------------------------------------------
ALTER TABLE documentos_engenharia
    ADD COLUMN IF NOT EXISTS historico_revisoes  JSONB,
    ADD COLUMN IF NOT EXISTS historico_etapas    JSONB,
    ADD COLUMN IF NOT EXISTS deadline            DATE,
    ADD COLUMN IF NOT EXISTS prioridade          TEXT,    -- Alta / Média / Baixa
    ADD COLUMN IF NOT EXISTS num_folhas          INTEGER;


-- ----------------------------------------------------------
-- contratos — garantir coluna tipo
-- ----------------------------------------------------------
-- tipo: Fornecimento / Serviço / Fornecimento + Serviço
ALTER TABLE contratos
    ADD COLUMN IF NOT EXISTS tipo TEXT;


-- ----------------------------------------------------------
-- medicoes — adicionar coluna itens
-- ----------------------------------------------------------
ALTER TABLE medicoes
    ADD COLUMN IF NOT EXISTS itens JSONB;


-- ----------------------------------------------------------
-- itens_6wla — adicionar FK com tarefas_cronograma e restricoes
-- ----------------------------------------------------------
ALTER TABLE itens_6wla
    ADD COLUMN IF NOT EXISTS tarefa_cronograma_id  UUID REFERENCES tarefas_cronograma(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS restricoes            JSONB;   -- {documentos, material, equipamentos, mao_obra, seguranca, qualidade}


-- ============================================================
-- SEÇÃO 4 — ÍNDICES DE PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_plano_acao_projeto
    ON plano_acao(projeto_id);

CREATE INDEX IF NOT EXISTS idx_rdo_projeto
    ON rdo(projeto_id);

CREATE INDEX IF NOT EXISTS idx_rdo_data
    ON rdo(data);

CREATE INDEX IF NOT EXISTS idx_usuarios_email
    ON usuarios(email);

CREATE INDEX IF NOT EXISTS idx_tarefas_cronograma_pai
    ON tarefas_cronograma(pai_id);

CREATE INDEX IF NOT EXISTS idx_itens_6wla_tarefa
    ON itens_6wla(tarefa_cronograma_id);


-- ============================================================
-- FIM DA MIGRATION
-- ============================================================

COMMIT;
