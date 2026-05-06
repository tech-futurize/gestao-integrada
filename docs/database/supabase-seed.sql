-- ============================================================
-- Seed Data — Tabelas sem registros
-- Execute no SQL Editor do Supabase após o supabase-migration.sql
-- Itera sobre TODOS os projetos existentes
-- ============================================================

DO $$
DECLARE
  pid  UUID;
  c1   UUID;
  c2   UUID;
  c3   UUID;
  r1   UUID;
  r2   UUID;
  r3   UUID;
BEGIN
  FOR pid IN SELECT id FROM projetos ORDER BY created_at LOOP

    -- ─────────────────────────────────────────
    -- COMMODITIES
    -- ─────────────────────────────────────────
    INSERT INTO commodities (projeto_id, codigo, descricao, disciplina, unidade, qtd_contrato, qtd_takeoff) VALUES
      (pid, 'CIV-001', 'Concreto usinado fck 25 MPa', 'Civil', 'm³', 1200, 1180),
      (pid, 'CIV-002', 'Armadura CA-50', 'Civil', 'kg', 85000, 84200),
      (pid, 'EST-001', 'Estrutura metálica soldada', 'Estrutura Metálica', 'kg', 320000, 318500),
      (pid, 'TUB-001', 'Tubulação aço carbono 6"', 'Tubulação', 'm', 4500, 4380),
      (pid, 'ELE-001', 'Cabo de energia 35mm²', 'Elétrica', 'm', 12000, 11750),
      (pid, 'MEC-001', 'Suporte isométrico fabricado', 'Mecânica', 'UND', 960, 940);

    -- Busca IDs das commodities para os lançamentos
    SELECT id INTO c1 FROM commodities WHERE projeto_id = pid AND codigo = 'CIV-001';
    SELECT id INTO c2 FROM commodities WHERE projeto_id = pid AND codigo = 'EST-001';
    SELECT id INTO c3 FROM commodities WHERE projeto_id = pid AND codigo = 'TUB-001';

    -- ─────────────────────────────────────────
    -- LANÇAMENTOS COMMODITY
    -- ─────────────────────────────────────────
    INSERT INTO lancamentos_commodity (commodity_id, projeto_id, semana, data_inicio, data_fim, quantidade, responsavel) VALUES
      (c1, pid, 'S01/2025', '2025-01-06', '2025-01-10', 120, 'Carlos Silva'),
      (c1, pid, 'S02/2025', '2025-01-13', '2025-01-17', 145, 'Carlos Silva'),
      (c1, pid, 'S03/2025', '2025-01-20', '2025-01-24', 130, 'Carlos Silva'),
      (c2, pid, 'S01/2025', '2025-01-06', '2025-01-10', 18500, 'Ricardo Moura'),
      (c2, pid, 'S02/2025', '2025-01-13', '2025-01-17', 22000, 'Ricardo Moura'),
      (c3, pid, 'S01/2025', '2025-01-06', '2025-01-10', 380, 'João Ferreira'),
      (c3, pid, 'S02/2025', '2025-01-13', '2025-01-17', 420, 'João Ferreira');

    -- ─────────────────────────────────────────
    -- RNCs
    -- ─────────────────────────────────────────
    INSERT INTO rncs (projeto_id, numero, titulo, data_abertura, disciplina, area_local, fornecedor, tipo, severidade, descricao, norma_violada, status, responsavel_tratamento, prazo_resolucao) VALUES
      (pid, 'RNC-001', 'Fissuras em fundação bloco B3', '2025-01-15', 'Civil', 'Área Industrial - Bloco B', 'Construtora Alpha', 'Execução', 'Maior',
       'Identificadas fissuras de retração plástica no concreto do bloco de fundação B3, largura superior a 0,3mm.', 'NBR 6118',
       'Em Tratamento', 'Ana Lima', '2025-02-10'),
      (pid, 'RNC-002', 'Espessura de pintura abaixo do especificado', '2025-01-22', 'Pintura', 'Estrutura Metálica Principal', 'Fornecedor Beta Ind.', 'Execução', 'Menor',
       'Medição de espessura de película seca revelou valores abaixo do mínimo especificado (200µm) em 15% das amostras.', 'ISO 12944',
       'Aberta', 'Marcos Dias', '2025-02-28'),
      (pid, 'RNC-003', 'Certificado de material fora do prazo', '2025-02-03', 'Tubulação', 'Almoxarifado Central', 'Tubos Sul LTDA', 'Material', 'Crítica',
       'Lote de tubulação 6" recebido sem certificado de rastreabilidade do fabricante, conforme exigido em contrato.', 'ASME B31.3',
       'Verificação', 'Pedro Souza', '2025-02-15');

    -- ─────────────────────────────────────────
    -- ITENS MAS
    -- ─────────────────────────────────────────
    INSERT INTO itens_mas (projeto_id, descricao, unidade, quantidade, numero_sc, solicitante, data_necessidade, status, etapas) VALUES
      (pid, 'Válvula gaveta flangeada 4" classe 150', 'UND', 12, 'SC-2025-001', 'João Ferreira', '2025-03-15', 'Em andamento',
       '[{"nome":"Elaboração SC","status":"Concluído","data":"2025-01-10"},{"nome":"Aprovação SC","status":"Concluído","data":"2025-01-12"},{"nome":"Cotação","status":"Em andamento","data":null},{"nome":"Pedido de Compra","status":"A iniciar","data":null},{"nome":"Entrega","status":"A iniciar","data":null}]'::jsonb),
      (pid, 'Parafusos ASTM A193 B7 1" x 4"', 'KG', 350, 'SC-2025-002', 'Ricardo Moura', '2025-02-28', 'Em andamento',
       '[{"nome":"Elaboração SC","status":"Concluído","data":"2025-01-08"},{"nome":"Aprovação SC","status":"Concluído","data":"2025-01-09"},{"nome":"Cotação","status":"Concluído","data":"2025-01-20"},{"nome":"Pedido de Compra","status":"Em andamento","data":null},{"nome":"Entrega","status":"A iniciar","data":null}]'::jsonb),
      (pid, 'Eletrodo AWS E7018 3,25mm', 'KG', 500, 'SC-2025-003', 'Carlos Silva', '2025-02-10', 'Concluído',
       '[{"nome":"Elaboração SC","status":"Concluído","data":"2025-01-05"},{"nome":"Aprovação SC","status":"Concluído","data":"2025-01-06"},{"nome":"Cotação","status":"Concluído","data":"2025-01-14"},{"nome":"Pedido de Compra","status":"Concluído","data":"2025-01-16"},{"nome":"Entrega","status":"Concluído","data":"2025-02-08"}]'::jsonb),
      (pid, 'Bomba centrífuga API 610 - 100m³/h', 'UND', 2, 'SC-2025-004', 'Ana Lima', '2025-05-30', 'A iniciar',
       '[{"nome":"Elaboração SC","status":"A iniciar","data":null},{"nome":"Aprovação SC","status":"A iniciar","data":null},{"nome":"Cotação","status":"A iniciar","data":null},{"nome":"Pedido de Compra","status":"A iniciar","data":null},{"nome":"Entrega","status":"A iniciar","data":null}]'::jsonb);

    -- ─────────────────────────────────────────
    -- DOCUMENTOS ENGENHARIA
    -- ─────────────────────────────────────────
    INSERT INTO documentos_engenharia (projeto_id, tag_id, titulo, disciplina, fornecedor, num_folhas, peso_a4, revisao_atual, etapa, progresso, deadline, prioridade) VALUES
      (pid, 'MEC-PL-001', 'Planta Geral de Layout - Área Industrial', 'MEC', 'Eng. Projetista Alpha', 4, 2.8, 'B', 'Em Verificação Técnica', 75, '2025-03-01', 'Alta'),
      (pid, 'MEC-IS-002', 'Isométrico Linha 6" - P&ID-05', 'MEC', 'Eng. Projetista Alpha', 2, 1.4, 'A', 'Comentários do Cliente', 60, '2025-03-15', 'Alta'),
      (pid, 'CIV-FD-001', 'Planta de Forma - Fundação Bloco B', 'CIV', 'Estrutural Beta', 3, 2.1, 'C', 'Aprovado', 100, '2025-01-30', 'Média'),
      (pid, 'CIV-AR-002', 'Planta Arquitetônica - Edifício Administrativo', 'CIV', 'Estrutural Beta', 6, 4.2, 'A', 'Em Elaboração', 40, '2025-04-01', 'Média'),
      (pid, 'ELE-DI-001', 'Diagrama Unifilar Geral - QGBT', 'ELE', 'Elétrica Omega', 2, 1.4, 'A', 'A Emitir', 0, '2025-04-30', 'Baixa'),
      (pid, 'TUB-IS-003', 'Isométrico Linha 4" - Descarga Bomba', 'TUB', 'Eng. Projetista Alpha', 1, 0.7, 'B', 'Em Verificação Técnica', 80, '2025-02-28', 'Alta'),
      (pid, 'INS-DI-001', 'Diagrama de Malhas - FIC-101', 'INS', 'Instruttec LTDA', 2, 1.4, 'A', 'Em Elaboração', 30, '2025-05-15', 'Média'),
      (pid, 'EST-DT-001', 'Detalhamento Estrutura Metálica - Col. C1 a C8', 'EST', 'Estrutural Beta', 5, 3.5, 'B', 'Aprovado', 100, '2025-01-15', 'Alta');

    -- ─────────────────────────────────────────
    -- RECURSOS (Mão de Obra)
    -- ─────────────────────────────────────────
    INSERT INTO recursos (projeto_id, tipo_recurso, nome_recurso, unidade_medida, preco_unitario, referencia_custo) VALUES
      (pid, 'MOD', 'Soldador', 'HH', 85.00, 'Contrato'),
      (pid, 'MOD', 'Caldeireiro', 'HH', 78.00, 'Contrato'),
      (pid, 'MOD', 'Eletricista', 'HH', 72.00, 'Contrato');

    SELECT id INTO r1 FROM recursos WHERE projeto_id = pid AND nome_recurso = 'Soldador' LIMIT 1;
    SELECT id INTO r2 FROM recursos WHERE projeto_id = pid AND nome_recurso = 'Caldeireiro' LIMIT 1;
    SELECT id INTO r3 FROM recursos WHERE projeto_id = pid AND nome_recurso = 'Eletricista' LIMIT 1;

    -- ─────────────────────────────────────────
    -- HISTOGRAMAS — MÃO DE OBRA
    -- ─────────────────────────────────────────
    INSERT INTO histogramas (projeto_id, recurso_id, mes_referencia, quantidade_prevista_mensal, quantidade_rdo_mensal) VALUES
      (pid, r1, '2025-01-01', 320, 298),
      (pid, r1, '2025-02-01', 360, 341),
      (pid, r1, '2025-03-01', 400, 375),
      (pid, r2, '2025-01-01', 280, 265),
      (pid, r2, '2025-02-01', 310, 290),
      (pid, r2, '2025-03-01', 340, 322),
      (pid, r3, '2025-01-01', 200, 188),
      (pid, r3, '2025-02-01', 220, 210),
      (pid, r3, '2025-03-01', 240, 228);

    -- ─────────────────────────────────────────
    -- HISTOGRAMAS — EQUIPAMENTOS
    -- ─────────────────────────────────────────
    INSERT INTO histogramas (projeto_id, mes_referencia, tipo_equipamento, quantidade_prevista_mensal, quantidade_rdo_mensal) VALUES
      (pid, '2025-01-01', 'Guindaste', 22, 20),
      (pid, '2025-02-01', 'Guindaste', 22, 22),
      (pid, '2025-03-01', 'Guindaste', 22, 18),
      (pid, '2025-01-01', 'Compressor', 30, 28),
      (pid, '2025-02-01', 'Compressor', 30, 30),
      (pid, '2025-03-01', 'Compressor', 30, 25),
      (pid, '2025-01-01', 'Retroescavadeira', 20, 18),
      (pid, '2025-02-01', 'Retroescavadeira', 20, 20),
      (pid, '2025-03-01', 'Retroescavadeira', 15, 14);

    -- ─────────────────────────────────────────
    -- ITENS 6WLA
    -- ─────────────────────────────────────────
    INSERT INTO itens_6wla (projeto_id, atividade, responsavel, liberadas, semanas, ppc) VALUES
      (pid, 'Montagem estrutura metálica bloco A', 'Carlos Silva',
       '[true,true,true,false,true,true]'::jsonb, '[true,true,true,false,false,false]'::jsonb, 85),
      (pid, 'Instalação tubulação processo linha 6"', 'João Ferreira',
       '[true,true,false,true,true,false]'::jsonb, '[true,true,false,false,false,false]'::jsonb, 72),
      (pid, 'Cabeamento elétrico quadro QGBT', 'Ana Lima',
       '[true,false,true,true,true,true]'::jsonb, '[false,true,true,false,false,false]'::jsonb, 60),
      (pid, 'Concretagem fundação bloco C', 'Ricardo Moura',
       '[true,true,true,true,false,true]'::jsonb, '[true,false,false,false,false,false]'::jsonb, 90),
      (pid, 'Pintura anticorrosiva estrutura secundária', 'Pedro Souza',
       '[false,true,false,true,true,true]'::jsonb, '[false,false,true,false,false,false]'::jsonb, 45);

    -- ─────────────────────────────────────────
    -- GESTÃO DE RISCOS
    -- ─────────────────────────────────────────
    INSERT INTO riscos (projeto_id, codigo, descricao, categoria, probabilidade, impacto, score, status, responsavel, mitigacao, residual) VALUES
      (pid, 'R-001', 'Atraso na entrega de equipamentos críticos importados devido a problemas logísticos internacionais', 'Suprimentos', 'Alta', 'Alto', 9, 'Ativo', 'João Ferreira',
       'Monitorar cronograma do fabricante semanalmente; acionar fornecedor alternativo nacional; antecipar pedidos em 4 semanas.', 'Médio'),
      (pid, 'R-002', 'Indisponibilidade de mão de obra especializada (soldadores certificados 6G) na região', 'Construção', 'Média', 'Alto', 6, 'Em Monitoramento', 'Carlos Silva',
       'Fechar contrato de exclusividade com empresa de recrutamento; iniciar processo de formação interna de 10 soldadores.', 'Baixo'),
      (pid, 'R-003', 'Não conformidade em soldas de tubulação crítica gerando retrabalho e impacto de prazo', 'Qualidade/SSMA', 'Média', 'Médio', 4, 'Ativo', 'Ana Lima',
       'Reforçar inspeção visual 100% antes de END; contratar inspector adicional; reunião de qualidade semanal com equipe.', 'Baixo'),
      (pid, 'R-004', 'Revisão de escopo por parte do cliente impactando quantitativos de estrutura metálica', 'Contratos', 'Baixa', 'Alto', 3, 'Em Monitoramento', 'Ricardo Moura',
       'Formalizar todas as solicitações de mudança; manter registro de pleitos atualizado; agendar reuniões mensais de alinhamento.', 'Baixo'),
      (pid, 'R-005', 'Acidente de trabalho em atividades de içamento e montagem em altura', 'Qualidade/SSMA', 'Baixa', 'Alto', 3, 'Ativo', 'Pedro Souza',
       'Reforçar treinamento de APR; auditar uso de EPI diariamente; implementar sistema de permissão de trabalho (PT) para içamentos.', 'Baixo');

    -- ─────────────────────────────────────────
    -- LIÇÕES APRENDIDAS
    -- ─────────────────────────────────────────
    INSERT INTO licoes_aprendidas (projeto_id, titulo, categoria, impacto, autor, data, status, diagnostico, comentarios, problemas) VALUES
      (pid, 'Inspeção pré-entrega de tubulação importada evita retrabalho', 'Suprimentos', 'Alto', 'João Ferreira', '2025-02-10', 'Aprovada',
       'Lote de tubulação 6" chegou sem certificado de rastreabilidade, causando 3 dias de parada e retrabalho no almoxarifado.',
       'Recomenda-se incluir inspeção pré-embarque em contratos de fornecimento internacional a partir de R$ 50.000.',
       '[{"problema":"Material recebido sem documentação exigida em contrato","qtde_p":1,"resolucao":"Inclusão de cláusula de inspeção pré-embarque com terceiro certificado","qtde_r":1}]'::jsonb),
      (pid, 'Planejamento semanal 6WLA reduz restrições não identificadas', 'Prazo', 'Médio', 'Carlos Silva', '2025-02-25', 'Aprovada',
       'Atividades de montagem bloqueadas por falta de material que não foram identificadas no planejamento de longo prazo.',
       'A reunião semanal de 6 semanas lookahead permitiu identificar e tratar restrições com antecedência mínima de 2 semanas.',
       '[{"problema":"Restrições de material identificadas apenas na véspera da atividade","qtde_p":3,"resolucao":"Implementação de reunião semanal 6WLA com participação de suprimentos","qtde_r":0}]'::jsonb),
      (pid, 'Comunicação formal de mudanças de escopo evita pleitos não documentados', 'Contratos', 'Alto', 'Ricardo Moura', '2025-03-05', 'Aguardando Aprovação',
       'Alteração verbal de escopo pelo cliente gerou trabalho executado não faturado no valor de R$ 85.000.',
       'Toda solicitação de mudança deve ser formalizada via RDO e aditivo contratual antes do início da execução.',
       '[{"problema":"Instrução verbal do cliente gerou serviço extra não coberto pelo contrato","qtde_p":1,"resolucao":"Implementar formulário de solicitação de mudança assinado pelo cliente como pré-requisito","qtde_r":1}]'::jsonb);

    -- ─────────────────────────────────────────
    -- PLANOS DE AÇÃO (Engenharias)
    -- Corrige constraints antes de inserir (caso migration ainda não foi reexecutada)
    -- ─────────────────────────────────────────
    DO $inner$
    DECLARE
      c_nome   TEXT;
      c_status TEXT;
    BEGIN
      SELECT conname INTO c_nome   FROM pg_constraint WHERE conrelid = 'engenharias'::regclass AND contype = 'c' AND conname LIKE '%nome%'   LIMIT 1;
      SELECT conname INTO c_status FROM pg_constraint WHERE conrelid = 'engenharias'::regclass AND contype = 'c' AND conname LIKE '%status%' LIMIT 1;
      IF c_nome   IS NOT NULL THEN EXECUTE 'ALTER TABLE engenharias DROP CONSTRAINT ' || quote_ident(c_nome);   END IF;
      IF c_status IS NOT NULL THEN EXECUTE 'ALTER TABLE engenharias DROP CONSTRAINT ' || quote_ident(c_status); END IF;
    END $inner$;
    ALTER TABLE engenharias ADD CONSTRAINT IF NOT EXISTS engenharias_nome_check
      CHECK (nome IN ('Engenharia','Suprimentos','Construção','Planejamento','Contratos','Qualidade/SSMA'));
    ALTER TABLE engenharias ADD CONSTRAINT IF NOT EXISTS engenharias_status_check
      CHECK (status IN ('Iniciado','Em Andamento','Concluído'));

    INSERT INTO engenharias (projeto_id, nome, descricao_acao, responsavel, finalidade, status) VALUES
      (pid, 'Construção',    'Revisar procedimento de inspeção de soldas em tubulação crítica', 'Ana Lima',       'Garantir conformidade com ASME B31.3 e reduzir índice de rejeição',                'Iniciado'),
      (pid, 'Construção',    'Implementar checklist pré-içamento para operações com guindaste',  'Carlos Silva',   'Prevenir acidentes e garantir conformidade com NR-11',                             'Concluído'),
      (pid, 'Suprimentos',   'Aprovar fornecedor alternativo de estrutura metálica',              'João Ferreira',  'Reduzir risco de atraso por concentração em único fornecedor',                     'Iniciado'),
      (pid, 'Planejamento',  'Atualizar baseline do cronograma após aditivo #002',                'Ricardo Moura',  'Refletir impacto das mudanças aprovadas no planejamento geral',                    'Iniciado'),
      (pid, 'Qualidade/SSMA','Conduzir treinamento de DDS focado em APR para equipe de caldeiraria','Pedro Souza', 'Reforçar cultura de segurança e reduzir quase-acidentes',                          'Concluído'),
      (pid, 'Engenharia',    'Emitir revisão C dos isométricos de tubulação com comentários cliente','Ana Lima',   'Fechar ciclo de aprovação e liberar execução das linhas prioritárias',             'Iniciado');

    -- ─────────────────────────────────────────
    -- CASOS (Pleitos)
    -- ─────────────────────────────────────────
    INSERT INTO casos (projeto_id, titulo, descricao_problema, status, impacto_financeiro, impacto_prazo, responsavel) VALUES
      (pid, 'Pleito #001 — Serviços extras de fundação em subsolo rochoso não previsto', 'Durante escavação da fundação do bloco B, identificado subsolo rochoso a 1,8m de profundidade, não previsto no projeto. Execução de 320m³ adicionais de remoção mecânica e 45m de estacas raiz.', 'Em Análise', 285000, 12, 'Ricardo Moura'),
      (pid, 'Pleito #002 — Impacto de prazo por revisão de projeto emitida com atraso', 'Revisão D do projeto de estrutura metálica emitida com 18 dias de atraso em relação ao prazo contratual, gerando paralização da equipe de fabricação e custo adicional de mão de obra improdutiva.', 'Aguardando Documentação', 112000, 18, 'Carlos Silva'),
      (pid, 'Pleito #003 — Custo adicional por mudança de especificação de pintura', 'Mudança na especificação de tinta (de sistema 3 demãos para 4 demãos) solicitada pelo cliente após aprovação do esquema de pintura original, impactando quantitativo de material e horas de aplicação.', 'Aprovado', 48500, 5, 'Ana Lima');

    -- ─────────────────────────────────────────
    -- RDO (armazenados como incidentes com tipo_registro='RDO')
    -- ─────────────────────────────────────────
    INSERT INTO incidentes (projeto_id, tipo_registro, numero_rdo, area, disciplina, data_hora, turno_manha, turno_tarde, condicoes_climaticas_manha, condicoes_climaticas_tarde, atividades, ocorrencias, responsavel_registro, mao_de_obra, equipamentos_rdo) VALUES
      (pid, 'RDO', 'RDO-001', 'Área Industrial - Bloco A', 'Estrutura Metálica', '2025-03-03 08:00:00', true, true, 'Ensolarado', 'Parcialmente Nublado',
       'Montagem de colunas C1 a C4; soldagem de vigas principais; lançamento de concreto nos blocos de fundação.',
       'Nenhuma ocorrência relevante. Produtividade dentro do previsto.',
       'Carlos Silva',
       '[{"quantidade":"12","funcao":"Soldador"},{"quantidade":"8","funcao":"Caldeireiro"},{"quantidade":"4","funcao":"Ajudante"}]'::jsonb,
       '[{"descricao":"Guindaste 30t","quantidade":"1"},{"descricao":"Compressor 300PCM","quantidade":"2"}]'::jsonb),
      (pid, 'RDO', 'RDO-002', 'Área Industrial - Bloco B', 'Civil', '2025-03-04 08:00:00', true, true, 'Nublado', 'Chuva Fraca',
       'Concretagem da laje de cobertura do bloco B; cura do concreto; instalação de forma para pilar P8.',
       'Chuva fraca no período da tarde interrompeu concretagem por 1h30min. Programação ajustada para o dia seguinte.',
       'Ricardo Moura',
       '[{"quantidade":"10","funcao":"Pedreiro"},{"quantidade":"6","funcao":"Ajudante"},{"quantidade":"2","funcao":"Operador de Máquina"}]'::jsonb,
       '[{"descricao":"Bomba de Concreto","quantidade":"1"},{"descricao":"Betoneira","quantidade":"1"}]'::jsonb);

  END LOOP;
END $$;
