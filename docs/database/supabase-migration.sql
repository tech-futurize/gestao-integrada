-- ============================================================
-- Sistema de Gestão Integrada — Migração Supabase
-- Execute este script no SQL Editor do painel do Supabase
-- ============================================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- PROJETOS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  cliente TEXT NOT NULL,
  data_inicio DATE,
  data_prevista_termino DATE,
  status TEXT DEFAULT 'Planejamento' CHECK (status IN ('Planejamento','Em Andamento','Pausado','Concluído','Cancelado')),
  responsavel_geral TEXT,
  contrato_numero TEXT,
  valor_contrato NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- DOCUMENTOS CONTRATUAIS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documentos_contratuais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  nome_documento TEXT NOT NULL,
  tipo_documento TEXT NOT NULL CHECK (tipo_documento IN ('Contrato','Aditivo','Ordem de Serviço','Anexo','Proposta Técnica','Outros')),
  url_arquivo TEXT,
  data_referencia DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INCIDENTES (Registros)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incidentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  data_hora TIMESTAMPTZ,
  descricao TEXT NOT NULL,
  impacto_preliminar TEXT,
  probabilidade TEXT DEFAULT 'Média' CHECK (probabilidade IN ('Baixa','Média','Alta')),
  gravidade TEXT DEFAULT 'Média' CHECK (gravidade IN ('Baixa','Média','Alta')),
  status TEXT DEFAULT 'Registrado' CHECK (status IN ('Registrado','Em Análise','Resolvido','Fechado')),
  responsavel_registro TEXT,
  caso_id UUID,
  -- Campos UI-only do RDO (armazenados como JSONB)
  rdo_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- CASOS (Pleitos)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS casos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao_problema TEXT NOT NULL,
  contexto TEXT,
  partes_envolvidas JSONB DEFAULT '[]',
  data_abertura DATE,
  status TEXT DEFAULT 'Aberto' CHECK (status IN ('Aberto','Em Análise','Em Andamento','Resolvido','Fechado','Cancelado')),
  responsavel TEXT,
  aspecto_ordem TEXT CHECK (aspecto_ordem IN ('Técnica','Física','Econômica','Todos')),
  classificacao_cone TEXT CHECK (classificacao_cone IN ('Megatendência','Tendências','Riscos','Incertezas','Sinais Fracos','Impondérável')),
  prioridade TEXT DEFAULT 'Média' CHECK (prioridade IN ('Baixa','Média','Alta','Crítica')),
  categorias JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- ACOES (Plano de Ação de Pleitos)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS acoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  formato_tratativa TEXT CHECK (formato_tratativa IN ('Reunião','Documento','Inspeção','Análise Técnica','Negociação','Outros')),
  data_inicio_prevista DATE,
  data_fim_prevista DATE,
  data_conclusao_real DATE,
  responsavel TEXT,
  status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente','Em Andamento','Concluída','Atrasada','Cancelada')),
  marca_causa TEXT CHECK (marca_causa IN ('Camada 1','Camada 2','Camada 3','Camada 4','Camada 5')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- ENGENHARIAS (Planos de Ação por Área)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS engenharias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL CHECK (nome IN ('Engenharia','Suprimentos','Construção','Planejamento','Contratos','Qualidade/SSMA')),
  descricao_acao TEXT NOT NULL,
  responsavel TEXT,
  finalidade TEXT,
  status TEXT DEFAULT 'Iniciado' CHECK (status IN ('Iniciado','Em Andamento','Concluído')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- FINANCEIRO
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL,
  faturamento_previsto_mensal NUMERIC,
  faturamento_realizado_mensal NUMERIC,
  faturamento_previsto_acumulado NUMERIC,
  faturamento_realizado_acumulado NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- RECURSOS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  tipo_recurso TEXT NOT NULL CHECK (tipo_recurso IN ('MOD','MOI','EQUIPAMENTO')),
  nome_recurso TEXT NOT NULL,
  unidade_medida TEXT CHECK (unidade_medida IN ('HH','HM','UND','HORA','DIA','MÊS')),
  preco_unitario NUMERIC NOT NULL,
  referencia_custo TEXT CHECK (referencia_custo IN ('Contrato','SINAPI','SEOP','RDO','Outros')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- HISTOGRAMAS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS histogramas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  recurso_id UUID REFERENCES recursos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'Equipamento',
  nome_recurso TEXT,
  mes_referencia DATE NOT NULL,
  quantidade_prevista_mensal NUMERIC,
  quantidade_realizada_mensal NUMERIC,
  qtd_projetado NUMERIC DEFAULT 0,
  valor_previsto_mensal NUMERIC,
  valor_realizado_mensal NUMERIC,
  quantidade_rdo_mensal NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- AVANCO FISICO
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS avanco_fisico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL,
  avanco_previsto_mensal NUMERIC,
  avanco_realizado_mensal NUMERIC,
  avanco_previsto_acumulado NUMERIC,
  avanco_realizado_acumulado NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- MUDANCAS CONTRATUAIS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mudancas_contratuais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  titulo TEXT,
  descricao TEXT,
  origem TEXT DEFAULT 'Contratante' CHECK (origem IN ('Contratante','Contratado','Regulatório','Técnico')),
  status TEXT DEFAULT 'Identificada' CHECK (status IN ('Identificada','Em Análise','Aprovada','Rejeitada','Implementada')),
  impacto_custo NUMERIC,
  impacto_prazo_dias NUMERIC,
  impacto_escopo TEXT,
  data_ocorrencia DATE,
  responsavel TEXT,
  observacoes TEXT,
  categorias JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- CONTRATOS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  numero TEXT,
  objeto TEXT NOT NULL,
  fornecedor TEXT NOT NULL,
  cnpj TEXT,
  valor_total NUMERIC,
  data_inicio DATE,
  data_fim DATE,
  status TEXT DEFAULT 'Ativo' CHECK (status IN ('Ativo','Em Revisão','Suspenso','Encerrado','Cancelado')),
  tipo TEXT CHECK (tipo IN ('Serviços','Fornecimento','Misto')),
  centro_custo TEXT,
  gestor TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- MEDICOES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  periodo_inicio DATE,
  periodo_fim DATE,
  valor_bruto NUMERIC,
  valor_retencao NUMERIC,
  valor_liquido NUMERIC,
  status TEXT DEFAULT 'Elaboração' CHECK (status IN ('Elaboração','Em Revisão','Em Aprovação','Aprovada','Paga','Rejeitada')),
  elaborador TEXT,
  aprovador TEXT,
  data_aprovacao DATE,
  observacoes TEXT,
  itens JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- ADITIVOS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS aditivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  numero TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('Prazo','Valor','Prazo e Valor')),
  valor_adicional NUMERIC,
  dias_adicionais NUMERIC,
  justificativa TEXT,
  data_assinatura DATE,
  status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente','Assinado','Cancelado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- REQUISICOES DE COMPRA
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS requisicoes_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  numero TEXT,
  solicitante TEXT NOT NULL,
  data_necessidade DATE,
  centro_custo TEXT,
  justificativa TEXT,
  status TEXT DEFAULT 'Rascunho' CHECK (status IN ('Rascunho','Aprovada','Em Cotação','Pedido Emitido','Recebido','Cancelada')),
  itens JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- COTACOES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  requisicao_id UUID REFERENCES requisicoes_compra(id) ON DELETE SET NULL,
  numero TEXT,
  titulo TEXT NOT NULL,
  status TEXT DEFAULT 'Aberta' CHECK (status IN ('Aberta','Em Análise','Aprovada','Cancelada')),
  data_limite DATE,
  fornecedor_selecionado TEXT,
  valor_aprovado NUMERIC,
  propostas JSONB DEFAULT '[]',
  parecer TEXT,
  aprovador TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- TAREFAS CRONOGRAMA
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tarefas_cronograma (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  pai_id UUID REFERENCES tarefas_cronograma(id) ON DELETE SET NULL,
  codigo_wbs TEXT,
  nome TEXT NOT NULL,
  tipo TEXT DEFAULT 'Atividade' CHECK (tipo IN ('Resumo','Atividade','Marco')),
  nivel INTEGER,
  data_inicio_planejada DATE,
  data_fim_planejada DATE,
  data_inicio_real DATE,
  data_fim_real DATE,
  data_inicio_baseline DATE,
  data_fim_baseline DATE,
  avanco_previsto NUMERIC,
  avanco_realizado NUMERIC,
  caminho_critico BOOLEAN DEFAULT FALSE,
  responsavel TEXT,
  predecessoras TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- RELACIONAMENTOS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS relacionamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  data_interacao DATE NOT NULL,
  descricao TEXT NOT NULL,
  partes_envolvidas JSONB DEFAULT '[]',
  objetivo TEXT,
  resultado TEXT,
  classificacao TEXT DEFAULT 'Neutro' CHECK (classificacao IN ('Excelente','Bom','Neutro','Tenso','Crítico')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- ROTINAS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rotinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  responsavel TEXT,
  periodicidade TEXT NOT NULL CHECK (periodicidade IN ('Diária','Semanal','Quinzenal','Mensal','Trimestral','Semestral','Anual')),
  data_ultima_execucao DATE,
  proxima_data_execucao DATE,
  status TEXT DEFAULT 'Em Dia' CHECK (status IN ('Em Dia','Atrasada','Concluída')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- RUIDOS (Notificações)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ruidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  caso_id UUID REFERENCES casos(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  causas_potenciais TEXT,
  impacto_potencial TEXT,
  probabilidade TEXT DEFAULT 'Média' CHECK (probabilidade IN ('Baixa','Média','Alta')),
  categoria TEXT NOT NULL CHECK (categoria IN ('Técnica','Financeira','Ambiental','Jurídica','Outros')),
  data_identificacao DATE,
  responsavel TEXT,
  status TEXT DEFAULT 'Identificado' CHECK (status IN ('Identificado','Em Análise','Descartado','Promovido')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- FK DIFERIDA: incidentes.caso_id
-- ─────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_incidente_caso'
  ) THEN
    ALTER TABLE incidentes
      ADD CONSTRAINT fk_incidente_caso
      FOREIGN KEY (caso_id) REFERENCES casos(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─────────────────────────────────────────
-- ÍNDICES PARA PERFORMANCE
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_documentos_projeto ON documentos_contratuais(projeto_id);
CREATE INDEX IF NOT EXISTS idx_incidentes_projeto ON incidentes(projeto_id);
CREATE INDEX IF NOT EXISTS idx_incidentes_caso ON incidentes(caso_id);
CREATE INDEX IF NOT EXISTS idx_casos_projeto ON casos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_acoes_caso ON acoes(caso_id);
CREATE INDEX IF NOT EXISTS idx_engenharias_projeto ON engenharias(projeto_id);
CREATE INDEX IF NOT EXISTS idx_engenharias_nome ON engenharias(projeto_id, nome);
CREATE INDEX IF NOT EXISTS idx_financeiros_projeto ON financeiros(projeto_id);
CREATE INDEX IF NOT EXISTS idx_recursos_projeto ON recursos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_histogramas_projeto ON histogramas(projeto_id);
CREATE INDEX IF NOT EXISTS idx_histogramas_recurso ON histogramas(recurso_id);
CREATE INDEX IF NOT EXISTS idx_avanco_projeto ON avanco_fisico(projeto_id);
CREATE INDEX IF NOT EXISTS idx_mudancas_projeto ON mudancas_contratuais(projeto_id);
CREATE INDEX IF NOT EXISTS idx_contratos_projeto ON contratos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_medicoes_projeto ON medicoes(projeto_id);
CREATE INDEX IF NOT EXISTS idx_medicoes_contrato ON medicoes(contrato_id);
CREATE INDEX IF NOT EXISTS idx_aditivos_contrato ON aditivos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_requisicoes_projeto ON requisicoes_compra(projeto_id);
CREATE INDEX IF NOT EXISTS idx_cotacoes_projeto ON cotacoes(projeto_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_projeto ON tarefas_cronograma(projeto_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_pai ON tarefas_cronograma(pai_id);
CREATE INDEX IF NOT EXISTS idx_relacionamentos_projeto ON relacionamentos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_rotinas_projeto ON rotinas(projeto_id);
CREATE INDEX IF NOT EXISTS idx_ruidos_projeto ON ruidos(projeto_id);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- Ativa RLS em todas as tabelas.
-- Ajuste as policies conforme sua estratégia de auth.
-- ─────────────────────────────────────────
ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_contratuais ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE casos ENABLE ROW LEVEL SECURITY;
ALTER TABLE acoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE engenharias ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE histogramas ENABLE ROW LEVEL SECURITY;
ALTER TABLE avanco_fisico ENABLE ROW LEVEL SECURITY;
ALTER TABLE mudancas_contratuais ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE aditivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisicoes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas_cronograma ENABLE ROW LEVEL SECURITY;
ALTER TABLE relacionamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruidos ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────
-- COMMODITIES (Take-off de quantitativos)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commodities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  codigo TEXT,
  descricao TEXT NOT NULL,
  disciplina TEXT NOT NULL CHECK (disciplina IN ('Civil','Mecânica','Tubulação','Elétrica','Estrutura Metálica','Instrumentação','Pintura','Outros')),
  unidade TEXT NOT NULL,
  qtd_contrato NUMERIC NOT NULL DEFAULT 0,
  qtd_takeoff NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- LANÇAMENTOS COMMODITY (produção semanal)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lancamentos_commodity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_id UUID NOT NULL REFERENCES commodities(id) ON DELETE CASCADE,
  projeto_id UUID NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  semana TEXT NOT NULL,
  data_inicio DATE,
  data_fim DATE,
  quantidade NUMERIC NOT NULL DEFAULT 0,
  responsavel TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- RNC (Relatório de Não Conformidade)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  numero TEXT,
  titulo TEXT NOT NULL,
  data_abertura DATE,
  disciplina TEXT NOT NULL CHECK (disciplina IN ('Mecânica','Elétrica','Estrutura Metálica','Tubulação','Civil','Instrumentação','Pintura','Segurança','Outros')),
  area_local TEXT,
  fornecedor TEXT,
  tipo TEXT CHECK (tipo IN ('Material','Execução','Projeto','Procedimento')),
  severidade TEXT NOT NULL DEFAULT 'Menor' CHECK (severidade IN ('Menor','Maior','Crítica')),
  descricao TEXT,
  norma_violada TEXT,
  status TEXT DEFAULT 'Aberta' CHECK (status IN ('Aberta','Em Tratamento','Verificação','Encerrada','Reaberta')),
  responsavel_tratamento TEXT,
  prazo_resolucao DATE,
  acao_corretiva TEXT,
  acao_preventiva TEXT,
  verificador TEXT,
  parecer_verificacao TEXT CHECK (parecer_verificacao IN ('Aprovado','Reprovado')),
  comentarios_verificacao TEXT,
  data_encerramento DATE,
  timeline JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- ITENS MAS (Mapa de Acompanhamento de Suprimentos)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itens_mas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  unidade TEXT,
  quantidade NUMERIC,
  numero_sc TEXT NOT NULL,
  solicitante TEXT,
  data_necessidade DATE,
  status TEXT DEFAULT 'A iniciar' CHECK (status IN ('A iniciar','Em andamento','Concluído','Cancelado')),
  etapas JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- DOCUMENTOS ENGENHARIA (Gestão documental)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documentos_engenharia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  disciplina TEXT NOT NULL CHECK (disciplina IN ('MEC','CIV','ELE','TUB','INS','AUT','EST','PRC','HSE')),
  fornecedor TEXT,
  num_folhas INTEGER,
  peso_a4 NUMERIC,
  revisao_atual TEXT,
  etapa TEXT NOT NULL DEFAULT 'A Emitir' CHECK (etapa IN ('A Emitir','Em Elaboração','Em Verificação Técnica','Comentários do Cliente','Aprovado')),
  progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  deadline DATE,
  prioridade TEXT DEFAULT 'Média' CHECK (prioridade IN ('Alta','Média','Baixa')),
  historico_revisoes JSONB DEFAULT '[]'::jsonb,
  historico_etapas JSONB DEFAULT '[]'::jsonb,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE commodities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos_commodity ENABLE ROW LEVEL SECURITY;
ALTER TABLE rncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_mas ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_engenharia ENABLE ROW LEVEL SECURITY;

-- Policy temporária: usuários autenticados têm acesso total
-- Substitua por policies mais restritivas conforme necessário
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'projetos','documentos_contratuais','incidentes','casos','acoes',
    'engenharias','financeiros','recursos',
    'histogramas','avanco_fisico','mudancas_contratuais','contratos',
    'medicoes','aditivos','requisicoes_compra','cotacoes',
    'tarefas_cronograma','relacionamentos','rotinas','ruidos',
    'commodities','lancamentos_commodity','rncs','itens_mas','documentos_engenharia'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = t AND policyname = 'Authenticated users full access'
    ) THEN
      EXECUTE format('
        CREATE POLICY "Authenticated users full access" ON %I
        FOR ALL TO authenticated USING (true) WITH CHECK (true);
      ', t);
    END IF;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- MILESTONE 2–3: Qualidade e Planejamento
-- ─────────────────────────────────────────────────────────────────────────────

-- Lições Aprendidas (Módulo Qualidade)
CREATE TABLE IF NOT EXISTS licoes_aprendidas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id    UUID REFERENCES projetos(id) ON DELETE CASCADE,
  titulo        TEXT NOT NULL,
  categoria     TEXT,
  impacto       TEXT DEFAULT 'Médio',
  autor         TEXT,
  data          DATE,
  status        TEXT DEFAULT 'Rascunho',
  diagnostico   TEXT,
  comentarios   TEXT,
  problemas     JSONB DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE licoes_aprendidas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access" ON licoes_aprendidas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Atas de Reunião (Módulo Planejamento)
CREATE TABLE IF NOT EXISTS atas_reuniao (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id    UUID REFERENCES projetos(id) ON DELETE CASCADE,
  numero        TEXT,
  data          DATE,
  assunto       TEXT,
  autor         TEXT,
  aprovador     TEXT,
  status        TEXT DEFAULT 'Rascunho',
  revisao       TEXT DEFAULT '00',
  diagnostico   TEXT,
  comentarios   TEXT,
  problemas     JSONB DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE atas_reuniao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access" ON atas_reuniao
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Itens 6WLA (Módulo Planejamento)
CREATE TABLE IF NOT EXISTS itens_6wla (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id    UUID REFERENCES projetos(id) ON DELETE CASCADE,
  atividade     TEXT,
  responsavel   TEXT,
  liberadas     JSONB DEFAULT '[false,false,false,false,false,false]'::jsonb,
  semanas       JSONB DEFAULT '[false,false,false,false,false,false]'::jsonb,
  ppc           NUMERIC DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE itens_6wla ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access" ON itens_6wla
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────
-- MILESTONE 4 — RISCOS E TAKE-OFF
-- ─────────────────────────────────────────

-- Gestão de Riscos
CREATE TABLE IF NOT EXISTS riscos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id    UUID REFERENCES projetos(id) ON DELETE CASCADE,
  codigo        TEXT,
  descricao     TEXT NOT NULL,
  categoria     TEXT,
  probabilidade TEXT DEFAULT 'Média',
  impacto       TEXT DEFAULT 'Médio',
  score         NUMERIC DEFAULT 0,
  status        TEXT DEFAULT 'Ativo',
  responsavel   TEXT,
  mitigacao     TEXT,
  residual      TEXT DEFAULT 'Médio',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE riscos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access" ON riscos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Itens de Take-Off (Planejamento)
CREATE TABLE IF NOT EXISTS itens_takeof (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id  UUID REFERENCES projetos(id) ON DELETE CASCADE,
  codigo      TEXT,
  descricao   TEXT,
  disciplina  TEXT,
  unidade     TEXT,
  previsto    NUMERIC DEFAULT 0,
  realizado   NUMERIC DEFAULT 0,
  percentual  NUMERIC DEFAULT 0,
  status      TEXT DEFAULT 'Não Iniciado',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE itens_takeof ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users full access" ON itens_takeof
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- ALTERAÇÕES INCREMENTAIS (para bancos já criados com versões anteriores)
-- Execute este bloco separadamente se as tabelas já existem.
-- ─────────────────────────────────────────────────────────────────────────────

-- histogramas: colunas adicionadas no M7 (para bancos criados antes do M7)
-- O CREATE TABLE acima já inclui todas estas colunas para inicializações novas.
ALTER TABLE histogramas ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'Equipamento';
ALTER TABLE histogramas ADD COLUMN IF NOT EXISTS nome_recurso TEXT;
ALTER TABLE histogramas ADD COLUMN IF NOT EXISTS qtd_projetado NUMERIC DEFAULT 0;
ALTER TABLE histogramas ADD COLUMN IF NOT EXISTS quantidade_rdo_mensal NUMERIC;

-- histogramas: torna recurso_id opcional (recursos sem FK de recurso)
ALTER TABLE histogramas ALTER COLUMN recurso_id DROP NOT NULL;

-- incidentes: colunas específicas do módulo RDO
ALTER TABLE incidentes ALTER COLUMN descricao DROP NOT NULL;
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS tipo_registro   TEXT DEFAULT 'INCIDENTE';
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS numero_rdo      TEXT;
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS area            TEXT;
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS disciplina      TEXT;
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS condicoes_climaticas_manha TEXT;
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS condicoes_climaticas_tarde TEXT;
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS condicoes_climaticas_noite TEXT;
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS turno_manha     BOOLEAN DEFAULT false;
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS turno_tarde     BOOLEAN DEFAULT false;
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS turno_noite     BOOLEAN DEFAULT false;
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS horario_inicio  TEXT;
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS horario_fim     TEXT;
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS mao_de_obra     JSONB DEFAULT '[]'::jsonb;
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS equipamentos_rdo JSONB DEFAULT '[]'::jsonb;
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS atividades      TEXT;
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS ocorrencias     TEXT;
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS responsabilidade TEXT;
ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS impacto_ocorrencia JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_incidentes_tipo_registro ON incidentes(tipo_registro);

-- engenharias: corrige constraints para bater com os valores que a UI usa
DO $$
DECLARE
  c_nome   TEXT;
  c_status TEXT;
BEGIN
  SELECT conname INTO c_nome   FROM pg_constraint WHERE conrelid = 'engenharias'::regclass AND contype = 'c' AND conname LIKE '%nome%'   LIMIT 1;
  SELECT conname INTO c_status FROM pg_constraint WHERE conrelid = 'engenharias'::regclass AND contype = 'c' AND conname LIKE '%status%' LIMIT 1;
  IF c_nome   IS NOT NULL THEN EXECUTE 'ALTER TABLE engenharias DROP CONSTRAINT ' || quote_ident(c_nome);   END IF;
  IF c_status IS NOT NULL THEN EXECUTE 'ALTER TABLE engenharias DROP CONSTRAINT ' || quote_ident(c_status); END IF;
END $$;
ALTER TABLE engenharias ADD CONSTRAINT engenharias_nome_check
  CHECK (nome IN ('Engenharia','Suprimentos','Construção','Planejamento','Contratos','Qualidade/SSMA'));
ALTER TABLE engenharias ADD CONSTRAINT engenharias_status_check
  CHECK (status IN ('Iniciado','Em Andamento','Concluído'));
ALTER TABLE engenharias ALTER COLUMN status SET DEFAULT 'Iniciado';

-- =====================================================================
-- ADMIN DE AGENTES DE IA
-- =====================================================================

-- Provedores de modelo suportados
DO $$ BEGIN
  CREATE TYPE ai_provider AS ENUM ('openai', 'anthropic', 'google', 'groq');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela de preços por modelo (para custo auditável)
CREATE TABLE IF NOT EXISTS modelo_precos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider        ai_provider NOT NULL,
  modelo          TEXT NOT NULL,
  preco_input_1k  NUMERIC(10, 6) NOT NULL DEFAULT 0,
  preco_output_1k NUMERIC(10, 6) NOT NULL DEFAULT 0,
  vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  vigencia_fim    DATE,
  ativo           BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (provider, modelo, vigencia_inicio)
);

INSERT INTO modelo_precos (provider, modelo, preco_input_1k, preco_output_1k) VALUES
  ('openai', 'gpt-4o-mini', 0.000150, 0.000600),
  ('openai', 'gpt-4o', 0.002500, 0.010000),
  ('openai', 'gpt-4.1-mini', 0.000400, 0.001600),
  ('anthropic', 'claude-haiku-4-5-20251001', 0.000800, 0.004000),
  ('anthropic', 'claude-sonnet-4-6', 0.003000, 0.015000)
ON CONFLICT DO NOTHING;

-- Definições de agentes
CREATE TABLE IF NOT EXISTS agentes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  nome            TEXT NOT NULL,
  descricao       TEXT,
  icone           TEXT DEFAULT 'Bot',
  cor             TEXT DEFAULT '#26405d',
  provider        ai_provider NOT NULL DEFAULT 'openai',
  modelo          TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  temperatura     NUMERIC(3,2),
  max_tokens      INTEGER,
  instructions    TEXT NOT NULL,
  injetar_schema  BOOLEAN NOT NULL DEFAULT false,
  injetar_data    BOOLEAN NOT NULL DEFAULT true,
  forcar_projeto  BOOLEAN NOT NULL DEFAULT true,
  sugestoes       TEXT[] DEFAULT '{}',
  ativo           BOOLEAN NOT NULL DEFAULT true,
  ordem           INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Tools de sistema por agente
CREATE TABLE IF NOT EXISTS agente_system_tools (
  agente_id  UUID NOT NULL REFERENCES agentes(id) ON DELETE CASCADE,
  tool_id    TEXT NOT NULL,
  PRIMARY KEY (agente_id, tool_id)
);

-- Tools SQL customizadas
CREATE TABLE IF NOT EXISTS agente_tools (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome         TEXT NOT NULL UNIQUE,
  descricao    TEXT NOT NULL,
  sql_template TEXT NOT NULL,
  parametros   JSONB DEFAULT '[]',
  ativo        BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Associação agente ↔ tool customizada
CREATE TABLE IF NOT EXISTS agente_tool_links (
  agente_id UUID NOT NULL REFERENCES agentes(id) ON DELETE CASCADE,
  tool_id   UUID NOT NULL REFERENCES agente_tools(id) ON DELETE CASCADE,
  PRIMARY KEY (agente_id, tool_id)
);

-- Logs de uso por execução
CREATE TABLE IF NOT EXISTS agente_uso_logs (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agente_slug       TEXT NOT NULL,
  modelo            TEXT NOT NULL,
  provider          ai_provider NOT NULL,
  usuario_email     TEXT,
  projeto_id        UUID,
  prompt_tokens     INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens      INTEGER NOT NULL DEFAULT 0,
  custo_usd         NUMERIC(10, 6),
  latencia_ms       INTEGER,
  status            TEXT DEFAULT 'success',
  thread_id         TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uso_logs_agente  ON agente_uso_logs(agente_slug);
CREATE INDEX IF NOT EXISTS idx_uso_logs_criado  ON agente_uso_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uso_logs_usuario ON agente_uso_logs(usuario_email);
CREATE INDEX IF NOT EXISTS idx_uso_logs_projeto ON agente_uso_logs(projeto_id);

-- RLS
ALTER TABLE agentes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE agente_system_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE agente_tools        ENABLE ROW LEVEL SECURITY;
ALTER TABLE agente_tool_links   ENABLE ROW LEVEL SECURITY;
ALTER TABLE agente_uso_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelo_precos       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agentes_auth"             ON agentes             FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agente_system_tools_auth" ON agente_system_tools FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agente_tools_auth"        ON agente_tools        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agente_tool_links_auth"   ON agente_tool_links   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agente_uso_logs_sel"      ON agente_uso_logs     FOR SELECT TO authenticated USING (true);
CREATE POLICY "agente_uso_logs_ins"      ON agente_uso_logs     FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "modelo_precos_auth"       ON modelo_precos       FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Migração: popular com os 3 agentes hard-coded atuais
INSERT INTO agentes (slug, nome, descricao, icone, cor, provider, modelo, instructions, injetar_schema, injetar_data, forcar_projeto, sugestoes) VALUES
(
  'supabase-analyst-agent',
  'Analista de Dados',
  'Executa consultas SQL e analisa dados do projeto diretamente no banco.',
  'Database',
  '#26405d',
  'openai',
  'gpt-4o-mini',
  'Você é um executor de consultas SQL para um sistema de gestão EPC (engenharia e construção).

## Processo

1. Chame get-schema (sem parâmetros) para descobrir tabelas e colunas disponíveis.
2. Construa a query SQL com base na pergunta recebida. Sempre inclua filtro por projeto_id quando fornecido.
3. Chame execute-sql com a query.
4. Retorne os dados em formato estruturado conforme abaixo.

## Formato de resposta obrigatório

Sempre responda usando esta estrutura:

**Consulta executada:** `[SQL resumido ou descrição da query]`

**Resultados:**
| Campo | Valor |
|-------|-------|
| ...   | ...   |

(Use tabela Markdown quando os dados forem tabulares. Use lista com bullets quando forem itens não tabulares. Se vazio, escreva: "Nenhum dado encontrado para esta consulta.")

**Resumo:** [1 frase resumindo o resultado]

## Restrições

- Nunca execute DELETE, DROP ou TRUNCATE sem confirmação explícita.
- Nunca retorne dados de outros projetos (sempre filtre por projeto_id).
- Responda sempre em português do Brasil.
- Se a query falhar, descreva o erro claramente e sugira como reformular.

## Integridade de Dados

- NUNCA afirme, assuma ou extrapole dados que não estejam no retorno da query.
- Se a query retornar vazio, escreva exatamente: "Nenhum dado encontrado para esta consulta."
- NUNCA use "provavelmente", "deve ser", "tipicamente" para compensar dados ausentes.
- NUNCA invente valores, datas, nomes ou métricas.',
  true, true, true,
  ARRAY['Quais são os riscos críticos deste projeto?', 'Mostre o avanço físico por disciplina', 'Liste os contratos ativos e seus valores']
),
(
  'business-analyst-agent',
  'Analista de Negócio',
  'Interpreta dados e gera análises estratégicas com contexto do domínio EPC.',
  'TrendingUp',
  '#c35e1e',
  'openai',
  'gpt-4o-mini',
  'Você é um Analista de Negócio especializado em projetos EPC. Faça perguntas precisas e relevantes antes de executar consultas. Máximo 3 perguntas durante toda a conversa. Delegue consultas SQL ao Executor via query-database. Sintetize análises em máximo 400 palavras.

## Integridade de Dados
- NUNCA afirme dados não retornados pelo executor.
- Declare "Não há dados suficientes" se o executor retornar vazio.
- Estrutura obrigatória: Situação / Dados Encontrados / Análise / Recomendação',
  true, true, true,
  ARRAY['Qual é a situação atual do avanço físico?', 'Analise os riscos do projeto', 'Como está o desempenho de suprimentos?']
),
(
  'contractual-analyst-agent',
  'Analista Contratual',
  'Especialista jurídico-contratual: pleitos, atas, documentos e relacionamentos.',
  'FileText',
  '#00a49a',
  'openai',
  'gpt-4o-mini',
  'Você é um Analista Contratual especializado em contratos EPC. Consulte dados via query-database antes de emitir pareceres. Postura: defende os interesses do contratado. Responda sempre em português do Brasil.

## Integridade de Dados
- NUNCA afirme dados não retornados pelo executor.
- Declare "Não há dados suficientes" quando aplicável.',
  false, true, true,
  ARRAY['Quais são os pleitos em aberto?', 'Analise as atas de reunião recentes', 'Mostre os documentos contratuais do projeto']
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO agente_system_tools (agente_id, tool_id)
SELECT id, 'get-schema'    FROM agentes WHERE slug = 'supabase-analyst-agent'
UNION ALL
SELECT id, 'execute-sql'   FROM agentes WHERE slug = 'supabase-analyst-agent'
UNION ALL
SELECT id, 'analyze-table' FROM agentes WHERE slug = 'supabase-analyst-agent'
UNION ALL
SELECT id, 'query-database' FROM agentes WHERE slug = 'business-analyst-agent'
UNION ALL
SELECT id, 'query-database' FROM agentes WHERE slug = 'contractual-analyst-agent'
ON CONFLICT DO NOTHING;
