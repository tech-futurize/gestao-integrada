--
-- PostgreSQL database dump
--

\restrict QiqW5KJmscO6Dy5LdQYZNeaZlmJWguQSgdb7yvNIRX5oYQeaeAUkHADBZ0xCKcS

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: ai_provider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ai_provider AS ENUM (
    'openai',
    'anthropic',
    'google',
    'groq'
);


--
-- Name: exec_readonly_sql(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.exec_readonly_sql(query text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  result json;
BEGIN
  IF query ~* '\m(DELETE|DROP|TRUNCATE|ALTER|UPDATE|INSERT|CREATE|GRANT|REVOKE|VACUUM|REINDEX)\M' THEN
    RAISE EXCEPTION 'Apenas queries SELECT são permitidas';
  END IF;

  EXECUTE format(
    'SELECT COALESCE(json_agg(row_to_json(q)), ''[]''::json) FROM (%s) q',
    query
  ) INTO result;

  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN others THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;


--
-- Name: get_db_schema(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_db_schema() RETURNS json
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH pk AS (
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku
      ON tc.constraint_name = ku.constraint_name
     AND tc.table_schema = ku.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
  ),
  fk AS (
    SELECT
      ku.table_name,
      json_agg(
        json_build_object(
          'column', ku.column_name,
          'references_table', ccu.table_name,
          'references_column', ccu.column_name
        )
      ) AS fks
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku
      ON tc.constraint_name = ku.constraint_name
     AND tc.table_schema = ku.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
     AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    GROUP BY ku.table_name
  ),
  cols AS (
    SELECT
      c.table_name,
      json_agg(
        json_build_object(
          'name', c.column_name,
          'type', c.data_type,
          'nullable', c.is_nullable = 'YES',
          'pk', pk.column_name IS NOT NULL
        )
        ORDER BY c.ordinal_position
      ) AS columns
    FROM information_schema.columns c
    LEFT JOIN pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
    WHERE c.table_schema = 'public'
      AND c.table_name NOT LIKE 'pg_%'
      AND c.table_name NOT IN ('schema_migrations', 'spatial_ref_sys', 'buckets', 'objects', 'migrations')
    GROUP BY c.table_name
  )
  SELECT COALESCE(
    json_object_agg(
      cols.table_name,
      json_build_object(
        'columns', cols.columns,
        'foreign_keys', COALESCE(fk.fks, '[]'::json)
      )
      ORDER BY cols.table_name
    ),
    '{}'::json
  )
  FROM cols
  LEFT JOIN fk ON fk.table_name = cols.table_name;
$$;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios
    WHERE email = auth.jwt() ->> 'email'
      AND perfil = 'Admin'
      AND COALESCE(status, 'Ativo') = 'Ativo'
  );
$$;


--
-- Name: seed_categorias_impacto(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.seed_categorias_impacto() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: acoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pleito_id uuid,
    descricao text NOT NULL,
    formato_tratativa text DEFAULT 'Reunião'::text NOT NULL,
    data_inicio_prevista date,
    data_fim_prevista date,
    responsavel text,
    status text DEFAULT 'Pendente'::text NOT NULL,
    observacoes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    projeto_id uuid,
    registro_risco_id uuid,
    registro_mudanca_id uuid,
    CONSTRAINT acoes_status_check CHECK ((status = ANY (ARRAY['Pendente'::text, 'Em Andamento'::text, 'Concluída'::text, 'Atrasada'::text, 'Cancelada'::text])))
);


--
-- Name: aditivos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aditivos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_id uuid,
    contrato_id uuid,
    numero text,
    tipo text NOT NULL,
    valor numeric,
    prazo_dias integer,
    justificativa text,
    data_assinatura date,
    status text DEFAULT 'Pendente'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    escopo_texto text,
    CONSTRAINT aditivos_status_check CHECK ((status = ANY (ARRAY['Pendente'::text, 'Assinado'::text, 'Cancelado'::text]))),
    CONSTRAINT aditivos_tipo_check CHECK ((tipo = ANY (ARRAY['Prazo'::text, 'Valor'::text, 'Prazo e Valor'::text])))
);


--
-- Name: agente_system_tools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agente_system_tools (
    agente_id uuid NOT NULL,
    tool_id text NOT NULL
);


--
-- Name: agente_tool_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agente_tool_links (
    agente_id uuid NOT NULL,
    tool_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: agente_tools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agente_tools (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    descricao text NOT NULL,
    sql_template text NOT NULL,
    parametros jsonb DEFAULT '[]'::jsonb,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_system boolean DEFAULT false NOT NULL,
    tool_key text
);


--
-- Name: agente_uso_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agente_uso_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agente_slug text NOT NULL,
    modelo text NOT NULL,
    provider public.ai_provider NOT NULL,
    usuario_email text,
    projeto_id uuid,
    prompt_tokens integer DEFAULT 0 NOT NULL,
    completion_tokens integer DEFAULT 0 NOT NULL,
    total_tokens integer DEFAULT 0 NOT NULL,
    custo_usd numeric(10,6),
    latencia_ms integer,
    status text DEFAULT 'success'::text,
    thread_id text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: agentes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agentes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    nome text NOT NULL,
    descricao text,
    icone text DEFAULT 'Bot'::text,
    cor text DEFAULT '#26405d'::text,
    provider public.ai_provider DEFAULT 'openai'::public.ai_provider NOT NULL,
    modelo text DEFAULT 'gpt-4o-mini'::text NOT NULL,
    temperatura numeric(3,2),
    max_tokens integer,
    instructions text NOT NULL,
    injetar_schema boolean DEFAULT false NOT NULL,
    injetar_data boolean DEFAULT true NOT NULL,
    forcar_projeto boolean DEFAULT true NOT NULL,
    sugestoes text[] DEFAULT '{}'::text[],
    ativo boolean DEFAULT true NOT NULL,
    ordem integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: atividades_cronograma; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atividades_cronograma (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_id uuid,
    pai_id uuid,
    codigo_wbs text,
    nome text NOT NULL,
    tipo text DEFAULT 'Atividade'::text,
    nivel integer,
    data_inicio_planejada date,
    data_fim_planejada date,
    data_inicio_real date,
    data_fim_real date,
    data_inicio_baseline date,
    data_fim_baseline date,
    avanco_previsto numeric,
    avanco_realizado numeric,
    caminho_critico boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    area text,
    disciplina text,
    responsavel text,
    predecessoras text,
    CONSTRAINT chk_tarefas_cronograma_nivel CHECK (((nivel IS NULL) OR ((nivel >= 1) AND (nivel <= 9)))),
    CONSTRAINT tarefas_cronograma_tipo_check CHECK ((tipo = ANY (ARRAY['Resumo'::text, 'Atividade'::text, 'Marco'::text])))
);


--
-- Name: avanco_fisico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.avanco_fisico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_id uuid,
    avanco_previsto_mensal numeric,
    avanco_realizado_mensal numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    semana_iso text NOT NULL,
    avanco_projetado numeric DEFAULT 0
);


--
-- Name: categorias_impacto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias_impacto (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    projeto_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: commodities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commodities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_id uuid NOT NULL,
    codigo text,
    descricao text NOT NULL,
    disciplina text NOT NULL,
    unidade text NOT NULL,
    qtd_contrato numeric DEFAULT 0 NOT NULL,
    qtd_takeoff numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT commodities_disciplina_check CHECK ((disciplina = ANY (ARRAY['Civil'::text, 'Mecânica'::text, 'Tubulação'::text, 'Elétrica'::text, 'Estrutura Metálica'::text, 'Instrumentação'::text, 'Pintura'::text, 'Outros'::text])))
);


--
-- Name: contratos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contratos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_id uuid,
    numero text,
    objeto text NOT NULL,
    fornecedor text NOT NULL,
    cnpj text,
    valor_total numeric,
    data_inicio date,
    data_fim date,
    status text DEFAULT 'Ativo'::text,
    tipo text,
    centro_custo text,
    gestor text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    modalidade text,
    origem text,
    itens jsonb DEFAULT '[]'::jsonb NOT NULL,
    CONSTRAINT contratos_modalidade_check CHECK (((modalidade IS NULL) OR (modalidade = ANY (ARRAY['Preço unitário'::text, 'Global'::text])))),
    CONSTRAINT contratos_status_check CHECK ((status = ANY (ARRAY['A iniciar'::text, 'Em andamento'::text, 'Concluído'::text, 'Paralisado'::text]))),
    CONSTRAINT contratos_tipo_check CHECK ((tipo = ANY (ARRAY['Serviços'::text, 'Fornecimento'::text, 'Fornecimento + Serviço'::text])))
);


--
-- Name: disciplinas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disciplinas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo text NOT NULL,
    nome text NOT NULL,
    cor text DEFAULT '#6b7280'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    ativo boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: documentos_engenharia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documentos_engenharia (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_id uuid NOT NULL,
    tag_id text NOT NULL,
    titulo text NOT NULL,
    disciplina text NOT NULL,
    fornecedor text,
    num_folhas integer,
    peso_a4 numeric,
    revisao_atual text,
    etapa text DEFAULT 'A Emitir'::text NOT NULL,
    progresso integer DEFAULT 0,
    data_projetada date,
    prioridade text DEFAULT 'Média'::text,
    historico_revisoes jsonb DEFAULT '[]'::jsonb,
    historico_etapas jsonb DEFAULT '[]'::jsonb,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    id_cronograma uuid,
    data_cronograma date,
    data_real date,
    CONSTRAINT documentos_engenharia_disciplina_check CHECK ((disciplina = ANY (ARRAY['MEC'::text, 'CIV'::text, 'ELE'::text, 'TUB'::text, 'INS'::text, 'AUT'::text, 'EST'::text, 'PRC'::text, 'HSE'::text]))),
    CONSTRAINT documentos_engenharia_etapa_check CHECK ((etapa = ANY (ARRAY['A Emitir'::text, 'Em Elaboração'::text, 'Em Verificação Técnica'::text, 'Comentários do Cliente'::text, 'Aprovado'::text]))),
    CONSTRAINT documentos_engenharia_prioridade_check CHECK ((prioridade = ANY (ARRAY['Alta'::text, 'Média'::text, 'Baixa'::text]))),
    CONSTRAINT documentos_engenharia_progresso_check CHECK (((progresso >= 0) AND (progresso <= 100)))
);


--
-- Name: faturamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faturamentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_id uuid NOT NULL,
    numero text,
    mes_referencia date NOT NULL,
    itens jsonb DEFAULT '[]'::jsonb NOT NULL,
    valor_medido numeric DEFAULT 0 NOT NULL,
    status text DEFAULT 'Elaboração'::text NOT NULL,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT faturamentos_status_check CHECK ((status = ANY (ARRAY['Elaboração'::text, 'Concluído'::text])))
);


--
-- Name: financeiros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financeiros (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_id uuid,
    mes_referencia date NOT NULL,
    faturamento_previsto_mensal numeric,
    faturamento_realizado_mensal numeric,
    faturamento_previsto_acumulado numeric,
    faturamento_realizado_acumulado numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    faturamento_projetado numeric DEFAULT 0
);


--
-- Name: formulario_respostas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.formulario_respostas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    formulario_id uuid NOT NULL,
    projeto_id uuid NOT NULL,
    respondente text,
    answers jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: formularios_digitais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.formularios_digitais (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo text DEFAULT 'Formulário sem título'::text NOT NULL,
    descricao text,
    ativo boolean DEFAULT true NOT NULL,
    definicao jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: funcoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.funcoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    subtipo_mo text DEFAULT 'MOD'::text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT funcoes_subtipo_mo_check CHECK ((subtipo_mo = ANY (ARRAY['MOD'::text, 'MOI'::text])))
);


--
-- Name: histogramas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.histogramas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_id uuid,
    mes_referencia date NOT NULL,
    quantidade_prevista_mensal numeric,
    quantidade_realizada_mensal numeric,
    valor_previsto_mensal numeric,
    valor_realizado_mensal numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    quantidade_rdo_mensal numeric,
    tipo text DEFAULT 'Equipamento'::text NOT NULL,
    nome_recurso text,
    qtd_projetado numeric DEFAULT 0,
    subtipo_mo text,
    CONSTRAINT histogramas_subtipo_mo_check CHECK ((subtipo_mo = ANY (ARRAY['MOD'::text, 'MOI'::text])))
);


--
-- Name: itens_6wla; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.itens_6wla (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tarefa_cronograma_id uuid NOT NULL,
    restricao_projeto_eng boolean DEFAULT false NOT NULL,
    restricao_material boolean DEFAULT false NOT NULL,
    restricao_mao_obra boolean DEFAULT false NOT NULL,
    restricao_equipamentos boolean DEFAULT false NOT NULL,
    restricao_externas boolean DEFAULT false NOT NULL,
    restricao_informacoes boolean DEFAULT false NOT NULL,
    observacao text,
    adicionado_manualmente boolean DEFAULT false NOT NULL
);


--
-- Name: itens_mas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.itens_mas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_id uuid NOT NULL,
    descricao text NOT NULL,
    unidade text,
    quantidade numeric,
    numero_sc text NOT NULL,
    responsavel text,
    data_prevista date,
    status text DEFAULT 'A iniciar'::text,
    etapas jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    fornecedor text,
    id_cronograma uuid,
    data_cronograma date,
    unidade_id uuid,
    pacote_id uuid,
    CONSTRAINT itens_mas_status_check CHECK ((status = ANY (ARRAY['A iniciar'::text, 'Em andamento'::text, 'Concluído'::text, 'Cancelado'::text])))
);


--
-- Name: lancamentos_commodity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lancamentos_commodity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    commodity_id uuid NOT NULL,
    projeto_id uuid NOT NULL,
    semana text NOT NULL,
    data_inicio date,
    data_fim date,
    quantidade numeric DEFAULT 0 NOT NULL,
    responsavel text,
    observacao text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: medicoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medicoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_id uuid,
    contrato_id uuid,
    numero text NOT NULL,
    periodo_inicio date,
    periodo_fim date,
    status text DEFAULT 'Elaboração'::text,
    aprovador text,
    data_aprovacao date,
    observacoes text,
    itens jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    valor numeric,
    CONSTRAINT medicoes_status_check CHECK ((status = ANY (ARRAY['Elaboração'::text, 'Em Revisão'::text, 'Em Aprovação'::text, 'Aprovada'::text, 'Paga'::text, 'Rejeitada'::text, 'Concluído'::text])))
);


--
-- Name: modelo_precos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modelo_precos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider public.ai_provider NOT NULL,
    modelo text NOT NULL,
    preco_input_1k numeric(10,6) DEFAULT 0 NOT NULL,
    preco_output_1k numeric(10,6) DEFAULT 0 NOT NULL,
    vigencia_inicio date DEFAULT CURRENT_DATE NOT NULL,
    vigencia_fim date,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: mudancas_contratuais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mudancas_contratuais (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_id uuid,
    titulo text,
    descricao text,
    origem text DEFAULT 'Contratante'::text,
    status text DEFAULT 'Identificada'::text,
    impacto_custo numeric,
    impacto_prazo_dias numeric,
    impacto_escopo text,
    data_ocorrencia date,
    responsavel text,
    observacoes text,
    categorias jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    impacto_escopo_tipo text,
    pleito_id uuid,
    CONSTRAINT mudancas_contratuais_origem_check CHECK ((origem = ANY (ARRAY['Contratante'::text, 'Contratado'::text, 'Regulatório'::text, 'Técnico'::text]))),
    CONSTRAINT mudancas_contratuais_status_check CHECK ((status = ANY (ARRAY['Identificada'::text, 'Em Análise'::text, 'Aprovada'::text, 'Rejeitada'::text, 'Implementada'::text])))
);


--
-- Name: pacotes_suprimento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pacotes_suprimento (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    projeto_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: permissoes_usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissoes_usuario (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    modulo text NOT NULL,
    acoes jsonb DEFAULT '{"edit": false, "view": false, "create": false, "delete": false}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: pleito_vinculos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pleito_vinculos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pleito_id uuid NOT NULL,
    projeto_id uuid NOT NULL,
    entidade text NOT NULL,
    registro_id uuid NOT NULL,
    label_cache text,
    observacao text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: pleitos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pleitos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_id uuid,
    titulo text NOT NULL,
    descricao_problema text NOT NULL,
    contexto text,
    partes_envolvidas jsonb DEFAULT '[]'::jsonb,
    data_abertura date,
    status text DEFAULT 'Aberto'::text,
    responsavel text,
    aspecto_ordem text,
    classificacao_cone text,
    prioridade text DEFAULT 'Média'::text,
    categorias jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT casos_aspecto_ordem_check CHECK ((aspecto_ordem = ANY (ARRAY['Técnica'::text, 'Física'::text, 'Econômica'::text, 'Todos'::text]))),
    CONSTRAINT casos_classificacao_cone_check CHECK ((classificacao_cone = ANY (ARRAY['Megatendência'::text, 'Tendências'::text, 'Riscos'::text, 'Incertezas'::text, 'Sinais Fracos'::text, 'Impondérável'::text]))),
    CONSTRAINT casos_prioridade_check CHECK ((prioridade = ANY (ARRAY['Baixa'::text, 'Média'::text, 'Alta'::text, 'Crítica'::text]))),
    CONSTRAINT casos_status_check CHECK ((status = ANY (ARRAY['Aberto'::text, 'Em Análise'::text, 'Em Andamento'::text, 'Resolvido'::text, 'Fechado'::text, 'Cancelado'::text])))
);


--
-- Name: projetos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projetos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    descricao text,
    cliente text NOT NULL,
    data_inicio date,
    data_prevista_termino date,
    status text DEFAULT 'Planejamento'::text,
    responsavel_geral text,
    valor_contrato numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    contrato_numero text,
    cliente_cnpj text,
    cliente_contato text,
    contrato_objeto text,
    moeda text DEFAULT 'BRL'::text,
    regime_execucao text,
    data_base_orcamento date,
    bdi_percentual numeric,
    encargos_sociais_percentual numeric,
    regime_tributario text,
    retencao_percentual numeric,
    local_cidade text,
    local_uf text,
    local_endereco text,
    prazo_contratual_dias integer,
    data_inicio_efetivo date,
    gestor_contrato text,
    projeto_pai_id uuid,
    pqp_mestra jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT projetos_status_check CHECK ((status = ANY (ARRAY['Planejamento'::text, 'Em Andamento'::text, 'Pausado'::text, 'Concluído'::text, 'Cancelado'::text])))
);


--
-- Name: provider_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider public.ai_provider NOT NULL,
    api_key text,
    ativo boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: rdo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rdo (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_id uuid,
    numero text,
    data date NOT NULL,
    area text,
    disciplinas jsonb DEFAULT '[]'::jsonb,
    clima jsonb DEFAULT '{}'::jsonb,
    mao_de_obra jsonb DEFAULT '[]'::jsonb,
    equipamentos jsonb DEFAULT '[]'::jsonb,
    atividades_vinculadas jsonb DEFAULT '[]'::jsonb,
    ocorrencias jsonb DEFAULT '[]'::jsonb,
    evidencias jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: registros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registros (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_id uuid,
    data_hora timestamp with time zone,
    descricao text,
    impacto_preliminar text,
    probabilidade text DEFAULT 'Média'::text,
    gravidade text DEFAULT 'Média'::text,
    status text DEFAULT 'Registrado'::text,
    responsavel_registro text,
    pleito_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    atividades_vinculadas jsonb,
    anexos jsonb,
    tipo_registro text DEFAULT 'Ata de Reunião'::text,
    responsabilidade text,
    impacto_ocorrencia jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT incidentes_gravidade_check CHECK ((gravidade = ANY (ARRAY['Baixa'::text, 'Média'::text, 'Alta'::text]))),
    CONSTRAINT incidentes_probabilidade_check CHECK ((probabilidade = ANY (ARRAY['Baixa'::text, 'Média'::text, 'Alta'::text]))),
    CONSTRAINT incidentes_status_check CHECK ((status = ANY (ARRAY['Registrado'::text, 'Em Análise'::text, 'Resolvido'::text, 'Fechado'::text])))
);


--
-- Name: riscos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.riscos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    projeto_id uuid,
    codigo text,
    descricao text NOT NULL,
    categoria text,
    probabilidade text DEFAULT 'Média'::text,
    impacto text DEFAULT 'Médio'::text,
    score numeric DEFAULT 0,
    status text DEFAULT 'Ativo'::text,
    responsavel text,
    mitigacao text,
    residual text DEFAULT 'Médio'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    impactos jsonb,
    escopo_texto text,
    prazo_dias integer,
    valor_impacto numeric,
    areas_impacto jsonb DEFAULT '[]'::jsonb,
    classificacao text DEFAULT 'Ameaça'::text
);


--
-- Name: tipos_equipamento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipos_equipamento (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: unidades_medida; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unidades_medida (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    sigla text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    ativo boolean DEFAULT true NOT NULL
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    nome text NOT NULL,
    papel text DEFAULT 'usuario'::text NOT NULL,
    projeto_padrao_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    perfil text DEFAULT 'Visualizador'::text,
    status text DEFAULT 'Ativo'::text
);


--
-- Name: acoes acoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_pkey PRIMARY KEY (id);


--
-- Name: aditivos aditivos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aditivos
    ADD CONSTRAINT aditivos_pkey PRIMARY KEY (id);


--
-- Name: agente_system_tools agente_system_tools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agente_system_tools
    ADD CONSTRAINT agente_system_tools_pkey PRIMARY KEY (agente_id, tool_id);


--
-- Name: agente_tool_links agente_tool_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agente_tool_links
    ADD CONSTRAINT agente_tool_links_pkey PRIMARY KEY (agente_id, tool_id);


--
-- Name: agente_tools agente_tools_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agente_tools
    ADD CONSTRAINT agente_tools_nome_key UNIQUE (nome);


--
-- Name: agente_tools agente_tools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agente_tools
    ADD CONSTRAINT agente_tools_pkey PRIMARY KEY (id);


--
-- Name: agente_uso_logs agente_uso_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agente_uso_logs
    ADD CONSTRAINT agente_uso_logs_pkey PRIMARY KEY (id);


--
-- Name: agentes agentes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agentes
    ADD CONSTRAINT agentes_pkey PRIMARY KEY (id);


--
-- Name: agentes agentes_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agentes
    ADD CONSTRAINT agentes_slug_key UNIQUE (slug);


--
-- Name: avanco_fisico avanco_fisico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avanco_fisico
    ADD CONSTRAINT avanco_fisico_pkey PRIMARY KEY (id);


--
-- Name: pleitos casos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pleitos
    ADD CONSTRAINT casos_pkey PRIMARY KEY (id);


--
-- Name: categorias_impacto categorias_impacto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_impacto
    ADD CONSTRAINT categorias_impacto_pkey PRIMARY KEY (id);


--
-- Name: commodities commodities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commodities
    ADD CONSTRAINT commodities_pkey PRIMARY KEY (id);


--
-- Name: contratos contratos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_pkey PRIMARY KEY (id);


--
-- Name: disciplinas disciplinas_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disciplinas
    ADD CONSTRAINT disciplinas_codigo_key UNIQUE (codigo);


--
-- Name: disciplinas disciplinas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disciplinas
    ADD CONSTRAINT disciplinas_pkey PRIMARY KEY (id);


--
-- Name: documentos_engenharia documentos_engenharia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_engenharia
    ADD CONSTRAINT documentos_engenharia_pkey PRIMARY KEY (id);


--
-- Name: faturamentos faturamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faturamentos
    ADD CONSTRAINT faturamentos_pkey PRIMARY KEY (id);


--
-- Name: financeiros financeiros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financeiros
    ADD CONSTRAINT financeiros_pkey PRIMARY KEY (id);


--
-- Name: formulario_respostas formulario_respostas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.formulario_respostas
    ADD CONSTRAINT formulario_respostas_pkey PRIMARY KEY (id);


--
-- Name: formularios_digitais formularios_digitais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.formularios_digitais
    ADD CONSTRAINT formularios_digitais_pkey PRIMARY KEY (id);


--
-- Name: funcoes funcoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcoes
    ADD CONSTRAINT funcoes_pkey PRIMARY KEY (id);


--
-- Name: histogramas histogramas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.histogramas
    ADD CONSTRAINT histogramas_pkey PRIMARY KEY (id);


--
-- Name: registros incidentes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros
    ADD CONSTRAINT incidentes_pkey PRIMARY KEY (id);


--
-- Name: itens_6wla itens_6wla_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_6wla
    ADD CONSTRAINT itens_6wla_pkey PRIMARY KEY (id);


--
-- Name: itens_mas itens_mas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_mas
    ADD CONSTRAINT itens_mas_pkey PRIMARY KEY (id);


--
-- Name: lancamentos_commodity lancamentos_commodity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lancamentos_commodity
    ADD CONSTRAINT lancamentos_commodity_pkey PRIMARY KEY (id);


--
-- Name: medicoes medicoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicoes
    ADD CONSTRAINT medicoes_pkey PRIMARY KEY (id);


--
-- Name: modelo_precos modelo_precos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modelo_precos
    ADD CONSTRAINT modelo_precos_pkey PRIMARY KEY (id);


--
-- Name: modelo_precos modelo_precos_provider_modelo_vigencia_inicio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modelo_precos
    ADD CONSTRAINT modelo_precos_provider_modelo_vigencia_inicio_key UNIQUE (provider, modelo, vigencia_inicio);


--
-- Name: mudancas_contratuais mudancas_contratuais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mudancas_contratuais
    ADD CONSTRAINT mudancas_contratuais_pkey PRIMARY KEY (id);


--
-- Name: pacotes_suprimento pacotes_suprimento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pacotes_suprimento
    ADD CONSTRAINT pacotes_suprimento_pkey PRIMARY KEY (id);


--
-- Name: permissoes_usuario permissoes_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissoes_usuario
    ADD CONSTRAINT permissoes_usuario_pkey PRIMARY KEY (id);


--
-- Name: permissoes_usuario permissoes_usuario_usuario_id_modulo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissoes_usuario
    ADD CONSTRAINT permissoes_usuario_usuario_id_modulo_key UNIQUE (usuario_id, modulo);


--
-- Name: pleito_vinculos pleito_vinculos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pleito_vinculos
    ADD CONSTRAINT pleito_vinculos_pkey PRIMARY KEY (id);


--
-- Name: projetos projetos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projetos
    ADD CONSTRAINT projetos_pkey PRIMARY KEY (id);


--
-- Name: provider_configs provider_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_configs
    ADD CONSTRAINT provider_configs_pkey PRIMARY KEY (id);


--
-- Name: provider_configs provider_configs_provider_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_configs
    ADD CONSTRAINT provider_configs_provider_key UNIQUE (provider);


--
-- Name: rdo rdo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rdo
    ADD CONSTRAINT rdo_pkey PRIMARY KEY (id);


--
-- Name: riscos riscos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.riscos
    ADD CONSTRAINT riscos_pkey PRIMARY KEY (id);


--
-- Name: atividades_cronograma tarefas_cronograma_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atividades_cronograma
    ADD CONSTRAINT tarefas_cronograma_pkey PRIMARY KEY (id);


--
-- Name: tipos_equipamento tipos_equipamento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_equipamento
    ADD CONSTRAINT tipos_equipamento_pkey PRIMARY KEY (id);


--
-- Name: unidades_medida unidades_medida_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_medida
    ADD CONSTRAINT unidades_medida_pkey PRIMARY KEY (id);


--
-- Name: unidades_medida unidades_medida_sigla_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_medida
    ADD CONSTRAINT unidades_medida_sigla_key UNIQUE (sigla);


--
-- Name: avanco_fisico uq_avanco_fisico_projeto_semana; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avanco_fisico
    ADD CONSTRAINT uq_avanco_fisico_projeto_semana UNIQUE (projeto_id, semana_iso);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: idx_acoes_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acoes_projeto ON public.acoes USING btree (projeto_id);


--
-- Name: idx_acoes_registro_mudanca; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acoes_registro_mudanca ON public.acoes USING btree (registro_mudanca_id);


--
-- Name: idx_acoes_registro_risco; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_acoes_registro_risco ON public.acoes USING btree (registro_risco_id);


--
-- Name: idx_aditivos_contrato; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_aditivos_contrato ON public.aditivos USING btree (contrato_id);


--
-- Name: idx_aditivos_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_aditivos_projeto ON public.aditivos USING btree (projeto_id);


--
-- Name: idx_avanco_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avanco_projeto ON public.avanco_fisico USING btree (projeto_id);


--
-- Name: idx_casos_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_casos_projeto ON public.pleitos USING btree (projeto_id);


--
-- Name: idx_categorias_impacto_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categorias_impacto_projeto ON public.categorias_impacto USING btree (projeto_id);


--
-- Name: idx_commodities_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commodities_projeto ON public.commodities USING btree (projeto_id);


--
-- Name: idx_contratos_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratos_projeto ON public.contratos USING btree (projeto_id);


--
-- Name: idx_docs_eng_id_cronograma; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_docs_eng_id_cronograma ON public.documentos_engenharia USING btree (id_cronograma);


--
-- Name: idx_docs_eng_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_docs_eng_projeto ON public.documentos_engenharia USING btree (projeto_id);


--
-- Name: idx_faturamentos_mes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faturamentos_mes ON public.faturamentos USING btree (mes_referencia);


--
-- Name: idx_faturamentos_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faturamentos_projeto ON public.faturamentos USING btree (projeto_id);


--
-- Name: idx_financeiros_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financeiros_projeto ON public.financeiros USING btree (projeto_id);


--
-- Name: idx_formulario_respostas_formulario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_formulario_respostas_formulario ON public.formulario_respostas USING btree (formulario_id);


--
-- Name: idx_formulario_respostas_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_formulario_respostas_projeto ON public.formulario_respostas USING btree (projeto_id);


--
-- Name: idx_histogramas_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_histogramas_projeto ON public.histogramas USING btree (projeto_id);


--
-- Name: idx_incidentes_caso; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incidentes_caso ON public.registros USING btree (pleito_id);


--
-- Name: idx_incidentes_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incidentes_projeto ON public.registros USING btree (projeto_id);


--
-- Name: idx_itens_6wla_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_6wla_projeto ON public.itens_6wla USING btree (projeto_id);


--
-- Name: idx_itens_6wla_tarefa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_6wla_tarefa ON public.itens_6wla USING btree (tarefa_cronograma_id);


--
-- Name: idx_itens_mas_id_cronograma; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_mas_id_cronograma ON public.itens_mas USING btree (id_cronograma);


--
-- Name: idx_itens_mas_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_mas_projeto ON public.itens_mas USING btree (projeto_id);


--
-- Name: idx_itens_mas_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_mas_unidade ON public.itens_mas USING btree (unidade_id);


--
-- Name: idx_lanc_commodity_commodity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lanc_commodity_commodity ON public.lancamentos_commodity USING btree (commodity_id);


--
-- Name: idx_lanc_commodity_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lanc_commodity_projeto ON public.lancamentos_commodity USING btree (projeto_id);


--
-- Name: idx_medicoes_contrato; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_medicoes_contrato ON public.medicoes USING btree (contrato_id);


--
-- Name: idx_medicoes_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_medicoes_projeto ON public.medicoes USING btree (projeto_id);


--
-- Name: idx_mudancas_pleito; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mudancas_pleito ON public.mudancas_contratuais USING btree (pleito_id);


--
-- Name: idx_mudancas_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mudancas_projeto ON public.mudancas_contratuais USING btree (projeto_id);


--
-- Name: idx_pacotes_suprimento_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pacotes_suprimento_projeto ON public.pacotes_suprimento USING btree (projeto_id);


--
-- Name: idx_permissoes_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_permissoes_usuario_id ON public.permissoes_usuario USING btree (usuario_id);


--
-- Name: idx_riscos_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_riscos_projeto ON public.riscos USING btree (projeto_id);


--
-- Name: idx_tarefas_cronograma_pai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tarefas_cronograma_pai ON public.atividades_cronograma USING btree (pai_id);


--
-- Name: idx_tarefas_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tarefas_projeto ON public.atividades_cronograma USING btree (projeto_id);


--
-- Name: idx_uso_logs_agente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_uso_logs_agente ON public.agente_uso_logs USING btree (agente_slug);


--
-- Name: idx_uso_logs_criado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_uso_logs_criado ON public.agente_uso_logs USING btree (created_at DESC);


--
-- Name: idx_uso_logs_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_uso_logs_projeto ON public.agente_uso_logs USING btree (projeto_id);


--
-- Name: idx_uso_logs_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_uso_logs_usuario ON public.agente_uso_logs USING btree (usuario_email);


--
-- Name: idx_usuarios_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_email ON public.usuarios USING btree (email);


--
-- Name: itens_6wla_tarefa_projeto_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX itens_6wla_tarefa_projeto_uniq ON public.itens_6wla USING btree (tarefa_cronograma_id, projeto_id);


--
-- Name: pleito_vinculos_pleito_entidade_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pleito_vinculos_pleito_entidade_idx ON public.pleito_vinculos USING btree (pleito_id, entidade);


--
-- Name: pleito_vinculos_pleito_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pleito_vinculos_pleito_idx ON public.pleito_vinculos USING btree (pleito_id);


--
-- Name: pleito_vinculos_projeto_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pleito_vinculos_projeto_idx ON public.pleito_vinculos USING btree (projeto_id);


--
-- Name: pleito_vinculos_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pleito_vinculos_uniq ON public.pleito_vinculos USING btree (pleito_id, entidade, registro_id);


--
-- Name: rdo_projeto_data_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX rdo_projeto_data_idx ON public.rdo USING btree (projeto_id, data DESC);


--
-- Name: projetos trigger_seed_categorias_impacto; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_seed_categorias_impacto AFTER INSERT ON public.projetos FOR EACH ROW EXECUTE FUNCTION public.seed_categorias_impacto();


--
-- Name: acoes acoes_caso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_caso_id_fkey FOREIGN KEY (pleito_id) REFERENCES public.pleitos(id) ON DELETE CASCADE;


--
-- Name: acoes acoes_projeto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: acoes acoes_registro_mudanca_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_registro_mudanca_id_fkey FOREIGN KEY (registro_mudanca_id) REFERENCES public.mudancas_contratuais(id) ON DELETE SET NULL;


--
-- Name: acoes acoes_registro_risco_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_registro_risco_id_fkey FOREIGN KEY (registro_risco_id) REFERENCES public.riscos(id) ON DELETE SET NULL;


--
-- Name: aditivos aditivos_contrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aditivos
    ADD CONSTRAINT aditivos_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE CASCADE;


--
-- Name: aditivos aditivos_projeto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aditivos
    ADD CONSTRAINT aditivos_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: agente_system_tools agente_system_tools_agente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agente_system_tools
    ADD CONSTRAINT agente_system_tools_agente_id_fkey FOREIGN KEY (agente_id) REFERENCES public.agentes(id) ON DELETE CASCADE;


--
-- Name: agente_tool_links agente_tool_links_agente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agente_tool_links
    ADD CONSTRAINT agente_tool_links_agente_id_fkey FOREIGN KEY (agente_id) REFERENCES public.agentes(id) ON DELETE CASCADE;


--
-- Name: agente_tool_links agente_tool_links_tool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agente_tool_links
    ADD CONSTRAINT agente_tool_links_tool_id_fkey FOREIGN KEY (tool_id) REFERENCES public.agente_tools(id) ON DELETE CASCADE;


--
-- Name: avanco_fisico avanco_fisico_projeto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avanco_fisico
    ADD CONSTRAINT avanco_fisico_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: pleitos casos_projeto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pleitos
    ADD CONSTRAINT casos_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: categorias_impacto categorias_impacto_projeto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_impacto
    ADD CONSTRAINT categorias_impacto_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: commodities commodities_projeto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commodities
    ADD CONSTRAINT commodities_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: contratos contratos_projeto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: documentos_engenharia documentos_engenharia_id_cronograma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_engenharia
    ADD CONSTRAINT documentos_engenharia_id_cronograma_fkey FOREIGN KEY (id_cronograma) REFERENCES public.atividades_cronograma(id) ON DELETE SET NULL;


--
-- Name: documentos_engenharia documentos_engenharia_projeto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_engenharia
    ADD CONSTRAINT documentos_engenharia_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: faturamentos faturamentos_projeto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faturamentos
    ADD CONSTRAINT faturamentos_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: financeiros financeiros_projeto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financeiros
    ADD CONSTRAINT financeiros_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: registros fk_incidente_caso; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros
    ADD CONSTRAINT fk_incidente_caso FOREIGN KEY (pleito_id) REFERENCES public.pleitos(id) ON DELETE SET NULL;


--
-- Name: formulario_respostas formulario_respostas_formulario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.formulario_respostas
    ADD CONSTRAINT formulario_respostas_formulario_id_fkey FOREIGN KEY (formulario_id) REFERENCES public.formularios_digitais(id) ON DELETE CASCADE;


--
-- Name: histogramas histogramas_projeto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.histogramas
    ADD CONSTRAINT histogramas_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: registros incidentes_projeto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros
    ADD CONSTRAINT incidentes_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: itens_6wla itens_6wla_projeto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_6wla
    ADD CONSTRAINT itens_6wla_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: itens_6wla itens_6wla_tarefa_cronograma_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_6wla
    ADD CONSTRAINT itens_6wla_tarefa_cronograma_id_fkey FOREIGN KEY (tarefa_cronograma_id) REFERENCES public.atividades_cronograma(id) ON DELETE CASCADE;


--
-- Name: itens_mas itens_mas_id_cronograma_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_mas
    ADD CONSTRAINT itens_mas_id_cronograma_fkey FOREIGN KEY (id_cronograma) REFERENCES public.atividades_cronograma(id) ON DELETE SET NULL;


--
-- Name: itens_mas itens_mas_pacote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_mas
    ADD CONSTRAINT itens_mas_pacote_id_fkey FOREIGN KEY (pacote_id) REFERENCES public.pacotes_suprimento(id) ON DELETE SET NULL;


--
-- Name: itens_mas itens_mas_projeto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_mas
    ADD CONSTRAINT itens_mas_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: itens_mas itens_mas_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_mas
    ADD CONSTRAINT itens_mas_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.unidades_medida(id);


--
-- Name: lancamentos_commodity lancamentos_commodity_commodity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lancamentos_commodity
    ADD CONSTRAINT lancamentos_commodity_commodity_id_fkey FOREIGN KEY (commodity_id) REFERENCES public.commodities(id) ON DELETE CASCADE;


--
-- Name: lancamentos_commodity lancamentos_commodity_projeto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lancamentos_commodity
    ADD CONSTRAINT lancamentos_commodity_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: medicoes medicoes_contrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicoes
    ADD CONSTRAINT medicoes_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES public.contratos(id) ON DELETE CASCADE;


--
-- Name: medicoes medicoes_projeto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicoes
    ADD CONSTRAINT medicoes_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: mudancas_contratuais mudancas_contratuais_pleito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mudancas_contratuais
    ADD CONSTRAINT mudancas_contratuais_pleito_id_fkey FOREIGN KEY (pleito_id) REFERENCES public.pleitos(id) ON DELETE SET NULL;


--
-- Name: mudancas_contratuais mudancas_contratuais_projeto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mudancas_contratuais
    ADD CONSTRAINT mudancas_contratuais_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: pacotes_suprimento pacotes_suprimento_projeto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pacotes_suprimento
    ADD CONSTRAINT pacotes_suprimento_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: permissoes_usuario permissoes_usuario_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissoes_usuario
    ADD CONSTRAINT permissoes_usuario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: pleito_vinculos pleito_vinculos_pleito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pleito_vinculos
    ADD CONSTRAINT pleito_vinculos_pleito_id_fkey FOREIGN KEY (pleito_id) REFERENCES public.pleitos(id) ON DELETE CASCADE;


--
-- Name: pleito_vinculos pleito_vinculos_projeto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pleito_vinculos
    ADD CONSTRAINT pleito_vinculos_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: projetos projetos_projeto_pai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projetos
    ADD CONSTRAINT projetos_projeto_pai_id_fkey FOREIGN KEY (projeto_pai_id) REFERENCES public.projetos(id) ON DELETE SET NULL;


--
-- Name: rdo rdo_projeto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rdo
    ADD CONSTRAINT rdo_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: riscos riscos_projeto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.riscos
    ADD CONSTRAINT riscos_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: atividades_cronograma tarefas_cronograma_pai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atividades_cronograma
    ADD CONSTRAINT tarefas_cronograma_pai_id_fkey FOREIGN KEY (pai_id) REFERENCES public.atividades_cronograma(id) ON DELETE SET NULL;


--
-- Name: atividades_cronograma tarefas_cronograma_projeto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atividades_cronograma
    ADD CONSTRAINT tarefas_cronograma_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: usuarios usuarios_projeto_padrao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_projeto_padrao_id_fkey FOREIGN KEY (projeto_padrao_id) REFERENCES public.projetos(id) ON DELETE SET NULL;


--
-- Name: disciplinas Autenticados gerenciam disciplinas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Autenticados gerenciam disciplinas" ON public.disciplinas USING ((auth.role() = 'authenticated'::text)) WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: unidades_medida Autenticados gerenciam unidades_medida; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Autenticados gerenciam unidades_medida" ON public.unidades_medida USING ((auth.role() = 'authenticated'::text)) WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: permissoes_usuario Autenticados têm acesso total; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Autenticados têm acesso total" ON public.permissoes_usuario USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: acoes Authenticated users full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users full access" ON public.acoes TO authenticated USING (true) WITH CHECK (true);


--
-- Name: aditivos Authenticated users full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users full access" ON public.aditivos TO authenticated USING (true) WITH CHECK (true);


--
-- Name: atividades_cronograma Authenticated users full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users full access" ON public.atividades_cronograma TO authenticated USING (true) WITH CHECK (true);


--
-- Name: avanco_fisico Authenticated users full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users full access" ON public.avanco_fisico TO authenticated USING (true) WITH CHECK (true);


--
-- Name: commodities Authenticated users full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users full access" ON public.commodities TO authenticated USING (true) WITH CHECK (true);


--
-- Name: contratos Authenticated users full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users full access" ON public.contratos TO authenticated USING (true) WITH CHECK (true);


--
-- Name: documentos_engenharia Authenticated users full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users full access" ON public.documentos_engenharia TO authenticated USING (true) WITH CHECK (true);


--
-- Name: financeiros Authenticated users full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users full access" ON public.financeiros TO authenticated USING (true) WITH CHECK (true);


--
-- Name: funcoes Authenticated users full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users full access" ON public.funcoes TO authenticated USING (true) WITH CHECK (true);


--
-- Name: histogramas Authenticated users full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users full access" ON public.histogramas TO authenticated USING (true) WITH CHECK (true);


--
-- Name: itens_6wla Authenticated users full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users full access" ON public.itens_6wla TO authenticated USING (true) WITH CHECK (true);


--
-- Name: itens_mas Authenticated users full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users full access" ON public.itens_mas TO authenticated USING (true) WITH CHECK (true);


--
-- Name: lancamentos_commodity Authenticated users full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users full access" ON public.lancamentos_commodity TO authenticated USING (true) WITH CHECK (true);


--
-- Name: medicoes Authenticated users full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users full access" ON public.medicoes TO authenticated USING (true) WITH CHECK (true);


--
-- Name: mudancas_contratuais Authenticated users full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users full access" ON public.mudancas_contratuais TO authenticated USING (true) WITH CHECK (true);


--
-- Name: pleito_vinculos Authenticated users full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users full access" ON public.pleito_vinculos TO authenticated USING (true) WITH CHECK (true);


--
-- Name: pleitos Authenticated users full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users full access" ON public.pleitos TO authenticated USING (true) WITH CHECK (true);


--
-- Name: projetos Authenticated users full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users full access" ON public.projetos TO authenticated USING (true) WITH CHECK (true);


--
-- Name: registros Authenticated users full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users full access" ON public.registros TO authenticated USING (true) WITH CHECK (true);


--
-- Name: riscos Authenticated users full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users full access" ON public.riscos TO authenticated USING (true) WITH CHECK (true);


--
-- Name: tipos_equipamento Authenticated users full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users full access" ON public.tipos_equipamento TO authenticated USING (true) WITH CHECK (true);


--
-- Name: unidades_medida Authenticated users full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users full access" ON public.unidades_medida TO authenticated USING (true) WITH CHECK (true);


--
-- Name: acoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.acoes ENABLE ROW LEVEL SECURITY;

--
-- Name: aditivos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.aditivos ENABLE ROW LEVEL SECURITY;

--
-- Name: agente_system_tools; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agente_system_tools ENABLE ROW LEVEL SECURITY;

--
-- Name: agente_system_tools agente_system_tools_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agente_system_tools_delete ON public.agente_system_tools FOR DELETE TO authenticated USING ((( SELECT usuarios.perfil
   FROM public.usuarios
  WHERE (usuarios.email = auth.email())) = 'Admin'::text));


--
-- Name: agente_system_tools agente_system_tools_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agente_system_tools_insert ON public.agente_system_tools FOR INSERT TO authenticated WITH CHECK ((( SELECT usuarios.perfil
   FROM public.usuarios
  WHERE (usuarios.email = auth.email())) = 'Admin'::text));


--
-- Name: agente_system_tools agente_system_tools_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agente_system_tools_select ON public.agente_system_tools FOR SELECT TO authenticated USING (true);


--
-- Name: agente_system_tools agente_system_tools_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agente_system_tools_update ON public.agente_system_tools FOR UPDATE TO authenticated USING ((( SELECT usuarios.perfil
   FROM public.usuarios
  WHERE (usuarios.email = auth.email())) = 'Admin'::text)) WITH CHECK ((( SELECT usuarios.perfil
   FROM public.usuarios
  WHERE (usuarios.email = auth.email())) = 'Admin'::text));


--
-- Name: agente_tool_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agente_tool_links ENABLE ROW LEVEL SECURITY;

--
-- Name: agente_tool_links agente_tool_links_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agente_tool_links_delete ON public.agente_tool_links FOR DELETE TO authenticated USING ((( SELECT usuarios.perfil
   FROM public.usuarios
  WHERE (usuarios.email = auth.email())) = 'Admin'::text));


--
-- Name: agente_tool_links agente_tool_links_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agente_tool_links_insert ON public.agente_tool_links FOR INSERT TO authenticated WITH CHECK ((( SELECT usuarios.perfil
   FROM public.usuarios
  WHERE (usuarios.email = auth.email())) = 'Admin'::text));


--
-- Name: agente_tool_links agente_tool_links_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agente_tool_links_select ON public.agente_tool_links FOR SELECT TO authenticated USING (true);


--
-- Name: agente_tool_links agente_tool_links_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agente_tool_links_update ON public.agente_tool_links FOR UPDATE TO authenticated USING ((( SELECT usuarios.perfil
   FROM public.usuarios
  WHERE (usuarios.email = auth.email())) = 'Admin'::text)) WITH CHECK ((( SELECT usuarios.perfil
   FROM public.usuarios
  WHERE (usuarios.email = auth.email())) = 'Admin'::text));


--
-- Name: agente_tools; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agente_tools ENABLE ROW LEVEL SECURITY;

--
-- Name: agente_tools agente_tools_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agente_tools_delete ON public.agente_tools FOR DELETE TO authenticated USING ((( SELECT usuarios.perfil
   FROM public.usuarios
  WHERE (usuarios.email = auth.email())) = 'Admin'::text));


--
-- Name: agente_tools agente_tools_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agente_tools_insert ON public.agente_tools FOR INSERT TO authenticated WITH CHECK ((( SELECT usuarios.perfil
   FROM public.usuarios
  WHERE (usuarios.email = auth.email())) = 'Admin'::text));


--
-- Name: agente_tools agente_tools_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agente_tools_select ON public.agente_tools FOR SELECT TO authenticated USING (true);


--
-- Name: agente_tools agente_tools_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agente_tools_update ON public.agente_tools FOR UPDATE TO authenticated USING ((( SELECT usuarios.perfil
   FROM public.usuarios
  WHERE (usuarios.email = auth.email())) = 'Admin'::text)) WITH CHECK ((( SELECT usuarios.perfil
   FROM public.usuarios
  WHERE (usuarios.email = auth.email())) = 'Admin'::text));


--
-- Name: agente_uso_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agente_uso_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: agente_uso_logs agente_uso_logs_ins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agente_uso_logs_ins ON public.agente_uso_logs FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: agente_uso_logs agente_uso_logs_sel; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agente_uso_logs_sel ON public.agente_uso_logs FOR SELECT TO authenticated USING (true);


--
-- Name: agentes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agentes ENABLE ROW LEVEL SECURITY;

--
-- Name: agentes agentes_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agentes_delete ON public.agentes FOR DELETE TO authenticated USING ((( SELECT usuarios.perfil
   FROM public.usuarios
  WHERE (usuarios.email = auth.email())) = 'Admin'::text));


--
-- Name: agentes agentes_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agentes_insert ON public.agentes FOR INSERT TO authenticated WITH CHECK ((( SELECT usuarios.perfil
   FROM public.usuarios
  WHERE (usuarios.email = auth.email())) = 'Admin'::text));


--
-- Name: agentes agentes_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agentes_select ON public.agentes FOR SELECT TO authenticated USING (true);


--
-- Name: agentes agentes_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY agentes_update ON public.agentes FOR UPDATE TO authenticated USING ((( SELECT usuarios.perfil
   FROM public.usuarios
  WHERE (usuarios.email = auth.email())) = 'Admin'::text)) WITH CHECK ((( SELECT usuarios.perfil
   FROM public.usuarios
  WHERE (usuarios.email = auth.email())) = 'Admin'::text));


--
-- Name: atividades_cronograma; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.atividades_cronograma ENABLE ROW LEVEL SECURITY;

--
-- Name: usuarios authenticated full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "authenticated full access" ON public.usuarios TO authenticated USING (true) WITH CHECK (true);


--
-- Name: rdo authenticated full access rdo; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "authenticated full access rdo" ON public.rdo TO authenticated USING (true) WITH CHECK (true);


--
-- Name: avanco_fisico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.avanco_fisico ENABLE ROW LEVEL SECURITY;

--
-- Name: categorias_impacto; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categorias_impacto ENABLE ROW LEVEL SECURITY;

--
-- Name: commodities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.commodities ENABLE ROW LEVEL SECURITY;

--
-- Name: contratos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

--
-- Name: disciplinas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;

--
-- Name: disciplinas disciplinas_authenticated_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY disciplinas_authenticated_all ON public.disciplinas TO authenticated USING (true) WITH CHECK (true);


--
-- Name: documentos_engenharia; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documentos_engenharia ENABLE ROW LEVEL SECURITY;

--
-- Name: faturamentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.faturamentos ENABLE ROW LEVEL SECURITY;

--
-- Name: faturamentos faturamentos_authenticated_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY faturamentos_authenticated_all ON public.faturamentos TO authenticated USING (true) WITH CHECK (true);


--
-- Name: financeiros; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.financeiros ENABLE ROW LEVEL SECURITY;

--
-- Name: formulario_respostas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.formulario_respostas ENABLE ROW LEVEL SECURITY;

--
-- Name: formulario_respostas formulario_respostas: full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "formulario_respostas: full access" ON public.formulario_respostas TO authenticated USING (true) WITH CHECK (true);


--
-- Name: formularios_digitais; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.formularios_digitais ENABLE ROW LEVEL SECURITY;

--
-- Name: formularios_digitais formularios_digitais: full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "formularios_digitais: full access" ON public.formularios_digitais TO authenticated USING (true) WITH CHECK (true);


--
-- Name: funcoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.funcoes ENABLE ROW LEVEL SECURITY;

--
-- Name: funcoes funcoes_authenticated_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY funcoes_authenticated_all ON public.funcoes TO authenticated USING (true) WITH CHECK (true);


--
-- Name: histogramas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.histogramas ENABLE ROW LEVEL SECURITY;

--
-- Name: itens_6wla; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.itens_6wla ENABLE ROW LEVEL SECURITY;

--
-- Name: itens_mas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.itens_mas ENABLE ROW LEVEL SECURITY;

--
-- Name: lancamentos_commodity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lancamentos_commodity ENABLE ROW LEVEL SECURITY;

--
-- Name: medicoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.medicoes ENABLE ROW LEVEL SECURITY;

--
-- Name: modelo_precos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.modelo_precos ENABLE ROW LEVEL SECURITY;

--
-- Name: modelo_precos modelo_precos_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY modelo_precos_delete ON public.modelo_precos FOR DELETE TO authenticated USING ((( SELECT usuarios.perfil
   FROM public.usuarios
  WHERE (usuarios.email = auth.email())) = 'Admin'::text));


--
-- Name: modelo_precos modelo_precos_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY modelo_precos_insert ON public.modelo_precos FOR INSERT TO authenticated WITH CHECK ((( SELECT usuarios.perfil
   FROM public.usuarios
  WHERE (usuarios.email = auth.email())) = 'Admin'::text));


--
-- Name: modelo_precos modelo_precos_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY modelo_precos_select ON public.modelo_precos FOR SELECT TO authenticated USING (true);


--
-- Name: modelo_precos modelo_precos_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY modelo_precos_update ON public.modelo_precos FOR UPDATE TO authenticated USING ((( SELECT usuarios.perfil
   FROM public.usuarios
  WHERE (usuarios.email = auth.email())) = 'Admin'::text)) WITH CHECK ((( SELECT usuarios.perfil
   FROM public.usuarios
  WHERE (usuarios.email = auth.email())) = 'Admin'::text));


--
-- Name: mudancas_contratuais; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mudancas_contratuais ENABLE ROW LEVEL SECURITY;

--
-- Name: pacotes_suprimento; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pacotes_suprimento ENABLE ROW LEVEL SECURITY;

--
-- Name: pacotes_suprimento pacotes_suprimento_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pacotes_suprimento_auth ON public.pacotes_suprimento TO authenticated USING (true) WITH CHECK (true);


--
-- Name: pacotes_suprimento pacotes_suprimento_authenticated_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pacotes_suprimento_authenticated_all ON public.pacotes_suprimento TO authenticated USING (true) WITH CHECK (true);


--
-- Name: permissoes_usuario; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.permissoes_usuario ENABLE ROW LEVEL SECURITY;

--
-- Name: pleito_vinculos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pleito_vinculos ENABLE ROW LEVEL SECURITY;

--
-- Name: pleitos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pleitos ENABLE ROW LEVEL SECURITY;

--
-- Name: projetos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;

--
-- Name: provider_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.provider_configs ENABLE ROW LEVEL SECURITY;

--
-- Name: provider_configs provider_configs_admin_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY provider_configs_admin_delete ON public.provider_configs FOR DELETE TO authenticated USING (public.is_admin());


--
-- Name: provider_configs provider_configs_admin_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY provider_configs_admin_insert ON public.provider_configs FOR INSERT TO authenticated WITH CHECK (public.is_admin());


--
-- Name: provider_configs provider_configs_admin_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY provider_configs_admin_select ON public.provider_configs FOR SELECT TO authenticated USING (public.is_admin());


--
-- Name: provider_configs provider_configs_admin_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY provider_configs_admin_update ON public.provider_configs FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: rdo; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rdo ENABLE ROW LEVEL SECURITY;

--
-- Name: registros; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;

--
-- Name: riscos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.riscos ENABLE ROW LEVEL SECURITY;

--
-- Name: tipos_equipamento; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tipos_equipamento ENABLE ROW LEVEL SECURITY;

--
-- Name: tipos_equipamento tipos_equipamento_authenticated_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tipos_equipamento_authenticated_all ON public.tipos_equipamento TO authenticated USING (true) WITH CHECK (true);


--
-- Name: unidades_medida; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.unidades_medida ENABLE ROW LEVEL SECURITY;

--
-- Name: usuarios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

--
-- Name: categorias_impacto usuarios autenticados acesso total; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "usuarios autenticados acesso total" ON public.categorias_impacto TO authenticated USING (true) WITH CHECK (true);


--
-- PostgreSQL database dump complete
--

\unrestrict QiqW5KJmscO6Dy5LdQYZNeaZlmJWguQSgdb7yvNIRX5oYQeaeAUkHADBZ0xCKcS

