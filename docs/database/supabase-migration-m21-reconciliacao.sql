-- ============================================================================
-- M21 — RECONCILIAÇÃO SCHEMA REAL × MIGRATIONS VERSIONADAS
-- ============================================================================
-- Contexto: a auditoria de consistência (jul/2026) identificou que o banco real
-- recebeu renomeações e colunas/tabelas criadas diretamente (fora das migrations).
-- Este script é IDEMPOTENTE (IF EXISTS / IF NOT EXISTS em tudo): pode rodar tanto
-- num ambiente novo provisionado pelos SQLs versionados quanto no banco real,
-- sem efeito onde o objeto já está no estado final.
--
-- Recomendação permanente: gerar um `pg_dump --schema-only` após rodar este
-- script e conferir com docs/architecture/DATABASE.md.
-- ============================================================================

-- ── 1. RENOMEAÇÕES aplicadas só no banco real ───────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.incidentes') IS NOT NULL AND to_regclass('public.registros') IS NULL THEN
    ALTER TABLE incidentes RENAME TO registros;
  END IF;
  IF to_regclass('public.casos') IS NOT NULL AND to_regclass('public.pleitos') IS NULL THEN
    ALTER TABLE casos RENAME TO pleitos;
  END IF;
  IF to_regclass('public.tarefas_cronograma') IS NOT NULL AND to_regclass('public.atividades_cronograma') IS NULL THEN
    ALTER TABLE tarefas_cronograma RENAME TO atividades_cronograma;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'acoes' AND column_name = 'caso_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'acoes' AND column_name = 'pleito_id') THEN
    ALTER TABLE acoes RENAME COLUMN caso_id TO pleito_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'registros' AND column_name = 'caso_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'registros' AND column_name = 'pleito_id') THEN
    ALTER TABLE registros RENAME COLUMN caso_id TO pleito_id;
  END IF;
END $$;

-- ── 2. COLUNAS usadas pelo frontend sem DDL versionado ──────────────────────
-- unidades_medida: UI de Cadastros grava ativo; o data layer injeta updated_at em todo update
ALTER TABLE unidades_medida ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE unidades_medida ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- documentos_engenharia: form e import gravam estas 4 colunas
ALTER TABLE documentos_engenharia ADD COLUMN IF NOT EXISTS data_projetada DATE;
ALTER TABLE documentos_engenharia ADD COLUMN IF NOT EXISTS data_real DATE;
ALTER TABLE documentos_engenharia ADD COLUMN IF NOT EXISTS id_cronograma UUID REFERENCES atividades_cronograma(id) ON DELETE SET NULL;
ALTER TABLE documentos_engenharia ADD COLUMN IF NOT EXISTS data_cronograma DATE;

-- histogramas: recursos de MO gravam o subtipo (MOD/MOI)
ALTER TABLE histogramas ADD COLUMN IF NOT EXISTS subtipo_mo TEXT;

-- mudancas_contratuais: form grava tipo de impacto de escopo e vínculo com pleito
ALTER TABLE mudancas_contratuais ADD COLUMN IF NOT EXISTS impacto_escopo_tipo TEXT;
ALTER TABLE mudancas_contratuais ADD COLUMN IF NOT EXISTS pleito_id UUID REFERENCES pleitos(id) ON DELETE SET NULL;

-- agente_tool_links: ordenação padrão do data layer usa agente_id (override no
-- frontend); created_at é útil para auditoria
ALTER TABLE agente_tool_links ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ── 3. TABELAS de cadastro usadas pelo frontend sem DDL versionado ──────────
CREATE TABLE IF NOT EXISTS disciplinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#6b7280',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS funcoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  subtipo_mo TEXT CHECK (subtipo_mo IN ('MOD', 'MOI')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tipos_equipamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pacotes_suprimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- itens_mas.pacote_id (depende de pacotes_suprimento existir)
ALTER TABLE itens_mas ADD COLUMN IF NOT EXISTS pacote_id UUID REFERENCES pacotes_suprimento(id) ON DELETE SET NULL;

-- ── 4. RLS nas tabelas criadas acima (padrão do projeto: authenticated full) ─
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['disciplinas', 'funcoes', 'tipos_equipamento', 'pacotes_suprimento'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = t AND policyname = t || '_authenticated_all'
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
        t || '_authenticated_all', t
      );
    END IF;
  END LOOP;
END $$;

-- ── 5. PENDÊNCIAS que exigem decisão/execução manual (NÃO automatizadas aqui) ─
-- a) provider_configs: tabela guarda api_key em texto puro com RLS aberta a
--    qualquer authenticated — qualquer usuário logado pode ler as chaves via
--    DevTools. Recomendação: policy admin-only para SELECT de api_key (ou view
--    sem a coluna + RPC SECURITY DEFINER para gravação). Rodar /security.
-- b) usuarios e provider_configs não têm DDL versionado — exportar via
--    pg_dump --schema-only e commitar.
-- c) Backfill de permissões 'Formulários Digitais' para usuários criados antes
--    do M20 (módulo ausente em permissoes_usuario => DENY_ALL):
--    INSERT INTO permissoes_usuario (usuario_id, modulo, acoes)
--    SELECT u.id, 'Formulários Digitais',
--           '{"view": true, "create": false, "edit": false, "delete": false}'::jsonb
--    FROM usuarios u
--    WHERE NOT EXISTS (
--      SELECT 1 FROM permissoes_usuario p
--      WHERE p.usuario_id = u.id AND p.modulo = 'Formulários Digitais'
--    );
--    (ajustar acoes por perfil antes de rodar)
