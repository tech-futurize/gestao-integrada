-- ============================================================
-- PLEITOS: novos casos com cartas, atas, notificações
-- ============================================================
INSERT INTO casos (id, projeto_id, titulo, descricao_problema, contexto, partes_envolvidas, data_abertura, status, responsavel, aspecto_ordem, classificacao_cone, prioridade, categorias) VALUES
('ca130000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001',
 'Carta de Notificação — Atraso na Entrega de Equipamentos Críticos',
 'Contratante emitiu carta de notificação (CN-2024-047) em 10/10/2024 apontando atraso de 60 dias na entrega de equipamentos críticos do pacote eletromecânico.',
 'O atraso foi gerado por greve no porto de Santos em agosto/2024, fato notório e imprevisível, configurando força maior conforme Cláusula 18.1 do contrato.',
 '[{"nome":"Vale Mineração S.A.","papel":"Contratante"},{"nome":"Serra Dourada Construtora","papel":"Contratado"},{"nome":"Transportadora Sudeste","papel":"Subcontratado"}]',
 '2024-10-15', 'Em Análise', 'Dr. Marcos Ribeiro', 'Econômica', 'Tendências', 'Alta', '["Prazo","Força Maior","Fornecimento"]'),

('ca140000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001',
 'Resposta à Ata de Reunião nº 042 — Discordâncias de Medição',
 'Contratante registrou na Ata de Reunião nº 042 (22/11/2024) interpretação divergente sobre critério de medição de concreto estrutural, afetando faturamento do período em R$ 480.000.',
 'O critério aplicado pelo contratante desconsidera o método de medição previsto no Anexo IV do contrato (forma expandida). Necessário formalizar discordância nos 10 dias previstos.',
 '[{"nome":"Vale Mineração S.A.","papel":"Contratante"},{"nome":"Serra Dourada Construtora","papel":"Contratado"}]',
 '2024-11-25', 'Em Andamento', 'Eng. Patricia Souza', 'Econômica', 'Tendências', 'Alta', '["Custo","Medição","Contrato"]'),

('ca150000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001',
 'Notificação de Paralisação por Condições Inseguras — SRTE-MG',
 'Órgão fiscalizador emitiu notificação de paralisação (NOT-SRTE-2024-0892) de frente de soldagem por ausência de procedimento qualificado de soldagem (EPS). Impacto de 12 dias.',
 'A pendência ocorreu por aprovação tardia do EPS pelo cliente, cujo prazo contratual é de 15 dias úteis e foi excedido em 8 dias.',
 '[{"nome":"SRTE-MG","papel":"Órgão Fiscalizador"},{"nome":"Vale Mineração S.A.","papel":"Contratante"},{"nome":"Serra Dourada Construtora","papel":"Contratado"}]',
 '2024-09-03', 'Em Andamento', 'Eng. Ricardo Almeida', 'Econômica', 'Riscos', 'Crítica', '["Prazo","Segurança","Responsabilidade"]'),

('ca230000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000002',
 'Carta CN-2025-012 — Divergência no Escopo de Comissionamento',
 'Carta de notificação recebida em 15/01/2025 questionando execução de atividades de comissionamento não previstas no escopo contratual básico.',
 'As atividades em disputa constam do Anexo Técnico B e foram contratadas no aditivo nº 02, cujo texto é ambíguo.',
 '[{"nome":"ArcelorMittal Brasil","papel":"Contratante"},{"nome":"Rio das Pedras Engenharia","papel":"Contratado"}]',
 '2025-01-18', 'Em Análise', 'Eng. Fernanda Lima', 'Econômica', 'Tendências', 'Alta', '["Escopo","Comissionamento","Aditivo"]'),

('ca240000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000002',
 'Ata de Reunião nº 018 — Discordância sobre Cronograma de Entrega',
 'Na reunião de acompanhamento de 05/02/2025 (Ata 018), contratante registrou entendimento de que a reprogramação do cronograma implica redução de prazo total do contrato.',
 'A reprogramação foi acordada bilateralmente após paralisação climática e não implica alteração do prazo final.',
 '[{"nome":"ArcelorMittal Brasil","papel":"Contratante"},{"nome":"Rio das Pedras Engenharia","papel":"Contratado"}]',
 '2025-02-07', 'Aberto', 'Eng. Carlos Mendes', 'Econômica', 'Tendências', 'Média', '["Prazo","Cronograma","Reprogramação"]')

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ATAS DE REUNIÃO
-- ============================================================
INSERT INTO atas_reuniao (id, projeto_id, numero, data, assunto, autor, aprovador, status, revisao, diagnostico, comentarios, problemas) VALUES
('aa110000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
 'ATA-042', '2024-11-22', 'Reunião de Medição Mensal — Novembro 2024',
 'Eng. Patricia Souza', 'Dr. Marcos Ribeiro', 'Aprovada', 'Rev.1',
 'Reunião para análise do Boletim de Medição nº 8. Contratante questiona critério de medição de concreto estrutural nas fundações do britador secundário.',
 'Contratado discorda da interpretação e apresentará carta formal de contestação no prazo contratual.',
 '[{"problema":"Critério de medição de concreto divergente (Anexo IV vs prática do contratante)","qtde_p":1,"resolucao":"Contratado emitirá carta formal dentro de 10 dias úteis","qtde_r":1},{"problema":"Medição de forma não incluída pelo contratante","qtde_p":1,"resolucao":"Analisar Anexo IV e submeter memória de cálculo","qtde_r":0}]'),

('aa120000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001',
 'ATA-058', '2025-01-15', 'Reunião de Acompanhamento — Impactos de Força Maior',
 'Dr. Marcos Ribeiro', 'Diretora Executiva Ana Carvalho', 'Em Revisão', 'Rev.0',
 'Reunião convocada pelo contratado para discutir impactos da greve portuária de agosto/2024. Apresentação de documentação comprobatória.',
 'Contratante solicitará parecer jurídico interno. Nova reunião agendada para 30/01/2025.',
 '[{"problema":"Comprovação de evento de força maior (greve portuária)","qtde_p":1,"resolucao":"Submeter documentação: decretos, notícias, relatório de impacto","qtde_r":1},{"problema":"Quantificação do impacto no cronograma","qtde_p":60,"resolucao":"Contratado apresentará análise de caminho crítico","qtde_r":0}]'),

('aa210000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002',
 'ATA-018', '2025-02-05', 'Reunião Mensal de Progresso — Fevereiro 2025',
 'Eng. Carlos Mendes', 'Gerente de Projeto Bruno Alves', 'Aprovada', 'Rev.1',
 'Reunião de acompanhamento mensal. Discussão sobre reprogramação de cronograma após evento climático de janeiro/2025. Contratante registrou interpretação divergente sobre prazo final.',
 'Contratado contestará o registro com documentação do acordo bilateral de reprogramação.',
 '[{"problema":"Interpretação divergente sobre prazo final após reprogramação","qtde_p":1,"resolucao":"Contratado submeterá carta formal com anexo do e-mail de concordância","qtde_r":0}]')

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- INCIDENTES: popular impacto_ocorrencia e responsabilidade
-- ============================================================
UPDATE incidentes SET impacto_ocorrencia = '["Cronograma","Custo"]', responsabilidade = 'Contratante'
WHERE id = 'b1100000-0000-0000-0000-000000000001';

UPDATE incidentes SET impacto_ocorrencia = '["Engenharia","Suprimentos"]', responsabilidade = 'Contratada'
WHERE id = 'b1200000-0000-0000-0000-000000000002';

UPDATE incidentes SET impacto_ocorrencia = '["Cronograma","Segurança","Custo"]', responsabilidade = 'Contratante'
WHERE id = 'b2100000-0000-0000-0000-000000000001';

UPDATE incidentes SET impacto_ocorrencia = '["Suprimentos","Logística"]', responsabilidade = 'Contratada'
WHERE id = 'b2200000-0000-0000-0000-000000000002';

INSERT INTO incidentes (id, projeto_id, tipo_registro, data_hora, descricao, probabilidade, gravidade, status, responsavel_registro, responsabilidade, impacto_ocorrencia) VALUES
('b1300000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'INCIDENTE', '2025-01-08 08:00:00', 'Falha em equipamento de içamento (guindaste GT-01) — paralisação de 6 horas na montagem metálica', 'Média', 'Alta', 'Fechado', 'Encarregado Pedro Santos', 'Contratada', '["Cronograma","Segurança","Custo"]'),
('b1400000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'INCIDENTE', '2025-01-22 14:30:00', 'Não conformidade em solda de tubulação — retrabalho em 12 juntas', 'Alta', 'Média', 'Em Análise', 'Eng. Roberta Lima', 'Contratada', '["Engenharia","Qualidade"]'),
('b1500000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'INCIDENTE', '2025-02-05 10:00:00', 'Atraso na aprovação de documentação técnica pelo cliente — impacto em liberação de frentes', 'Alta', 'Alta', 'Em Análise', 'Eng. Ricardo Almeida', 'Contratante', '["Cronograma","Engenharia"]'),
('b2300000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000002', 'INCIDENTE', '2025-01-10 09:00:00', 'Chuvas intensas — paralisação de 8 dias em serviços de concreto', 'Alta', 'Alta', 'Fechado', 'Eng. Carlos Mendes', 'Contratante', '["Cronograma","Custo"]'),
('b2400000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000002', 'INCIDENTE', '2025-02-12 11:00:00', 'Atraso na entrega de refratários importados — fornecedor internacional com problema logístico', 'Alta', 'Média', 'Em Análise', 'Lúcia Ferreira', 'Contratante', '["Suprimentos","Cronograma"]')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ITENS 6WLA
-- ============================================================
INSERT INTO itens_6wla (id, projeto_id, atividade, responsavel, liberadas, semanas, ppc) VALUES
('dd110000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Montagem estrutura metálica — Nível 00 Britador', 'Eng. Sandro Melo',
 '{"mao_de_obra":true,"material":true,"equipamento":false,"metodo":true,"medicao":true,"seguranca":true}',
 '{"s1":true,"s2":true,"s3":false,"s4":false,"s5":false,"s6":false}', 42),
('dd110000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Concretagem fundações bloco B — Alto-Forno', 'Eng. Patricia Souza',
 '{"mao_de_obra":true,"material":true,"equipamento":true,"metodo":true,"medicao":false,"seguranca":true}',
 '{"s1":false,"s2":true,"s3":true,"s4":true,"s5":false,"s6":false}', 67),
('dd110000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Instalação tubulação de processo — Linha 02', 'Eng. Felipe Torres',
 '{"mao_de_obra":false,"material":true,"equipamento":true,"metodo":true,"medicao":true,"seguranca":true}',
 '{"s1":false,"s2":false,"s3":true,"s4":true,"s5":true,"s6":false}', 0),
('dd110000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Pré-montagem módulo elétrico subestação', 'Eng. Roberta Lima',
 '{"mao_de_obra":true,"material":false,"equipamento":true,"metodo":true,"medicao":true,"seguranca":true}',
 '{"s1":false,"s2":false,"s3":false,"s4":true,"s5":true,"s6":true}', 0),
('dd110000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'Impermeabilização reservatório de água industrial', 'Mestre Antônio Cruz',
 '{"mao_de_obra":true,"material":true,"equipamento":true,"metodo":true,"medicao":true,"seguranca":false}',
 '{"s1":true,"s2":true,"s3":true,"s4":false,"s5":false,"s6":false}', 100),
('dd210000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Montagem reator aciaria — Módulo 1', 'Eng. Carlos Mendes',
 '{"mao_de_obra":true,"material":false,"equipamento":true,"metodo":true,"medicao":true,"seguranca":true}',
 '{"s1":false,"s2":false,"s3":true,"s4":true,"s5":false,"s6":false}', 0),
('dd210000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'Aplicação de refratário — Cadinho do alto-forno', 'Esp. João Carvalho',
 '{"mao_de_obra":false,"material":false,"equipamento":true,"metodo":true,"medicao":true,"seguranca":true}',
 '{"s1":false,"s2":false,"s3":false,"s4":true,"s5":true,"s6":true}', 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RDO — Relatórios Diários de Obra
-- ============================================================
INSERT INTO incidentes (id, projeto_id, tipo_registro, numero_rdo, data_hora, area, disciplina, condicoes_climaticas_manha, condicoes_climaticas_tarde, turno_manha, turno_tarde, horario_inicio, horario_fim, atividades, ocorrencias, mao_de_obra, equipamentos_rdo, status, responsavel_registro) VALUES
('ed110000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'RDO', 'RDO-001', '2025-03-10 07:00:00', 'Britador Primário', 'Montagem Mecânica', 'Ensolarado', 'Ensolarado', true, true, '07:00', '17:00',
 'Montagem de estrutura metálica nível 00 — instalação de 14 perfis I300. Içamento de viga principal com guindaste GT-01.',
 'Nenhuma ocorrência relevante. Atividade dentro do planejado.',
 '[{"funcao":"Montador","quantidade":8},{"funcao":"Soldador","quantidade":4},{"funcao":"Ajudante","quantidade":6},{"funcao":"Encarregado","quantidade":1}]',
 '[{"tipo":"Guindaste 25t","quantidade":1,"horas":8},{"tipo":"Plataforma Elevatória","quantidade":2,"horas":8}]',
 'Registrado', 'Encarregado Pedro Santos'),

('ed110000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'RDO', 'RDO-002', '2025-03-11 07:00:00', 'Britador Primário', 'Montagem Mecânica', 'Nublado', 'Chuva leve', true, true, '07:00', '17:00',
 'Continuação da montagem estrutural — soldagem de ligações e aplicação de primer anticorrosivo.',
 'Paralisação de 1,5h no turno da tarde por chuva leve. Equipe redirecionada para atividades internas.',
 '[{"funcao":"Montador","quantidade":8},{"funcao":"Soldador","quantidade":4},{"funcao":"Pintor","quantidade":2},{"funcao":"Ajudante","quantidade":5}]',
 '[{"tipo":"Guindaste 25t","quantidade":1,"horas":6},{"tipo":"Compressor","quantidade":1,"horas":8}]',
 'Registrado', 'Encarregado Pedro Santos'),

('ed110000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'RDO', 'RDO-003', '2025-03-12 07:00:00', 'Fundações Bloco B', 'Civil', 'Ensolarado', 'Ensolarado', true, true, '07:00', '17:00',
 'Concretagem blocos de fundação B-07 a B-12. Consumo de 48m³ de concreto C30. Adensamento com vibrador de imersão.',
 'Nenhuma ocorrência. Concretagem concluída conforme planejado.',
 '[{"funcao":"Pedreiro","quantidade":6},{"funcao":"Servente","quantidade":10},{"funcao":"Carpinteiro","quantidade":4},{"funcao":"Encarregado","quantidade":1}]',
 '[{"tipo":"Bomba de Concreto","quantidade":1,"horas":6}]',
 'Registrado', 'Mestre Antônio Cruz'),

('ed210000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'RDO', 'RDO-001', '2025-02-20 07:00:00', 'Aciaria — Módulo 1', 'Refratário', 'Ensolarado', 'Ensolarado', true, true, '07:00', '17:00',
 'Aplicação de refratário castable no cadinho — Zona 3. Consumo de 12t de material. Cura natural de 48h iniciada.',
 'Atraso de 2h no início por aguardo de material (refratário chegou às 09h).',
 '[{"funcao":"Aplicador de Refratário","quantidade":6},{"funcao":"Ajudante","quantidade":8},{"funcao":"Encarregado","quantidade":1}]',
 '[{"tipo":"Betoneira","quantidade":2,"horas":8},{"tipo":"Compressor","quantidade":1,"horas":6}]',
 'Registrado', 'Esp. João Carvalho')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RISCOS
-- ============================================================
INSERT INTO riscos (id, projeto_id, codigo, descricao, categoria, probabilidade, impacto, score, status, responsavel, mitigacao, residual) VALUES
('cc110000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'RSC-001', 'Atraso na obtenção de licença ambiental para expansão da área de britagem', 'Regulatório', 'Alta', 'Alto', 9, 'Ativo', 'Dr. Marcos Ribeiro', 'Envolvimento proativo do IBAMA e consultoria ambiental especializada. Reuniões mensais com órgão regulador.', 'Médio após medidas compensatórias'),
('cc110000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'RSC-002', 'Variação de preços de aço estrutural acima de 15% — impacto no custo do contrato', 'Financeiro', 'Média', 'Alto', 6, 'Monitoramento', 'Lúcia Ferreira', 'Cláusula de reequilíbrio contratual ativada. Monitoramento semanal de índices FGV.', 'Baixo após ativação de cláusula de reajuste'),
('cc110000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'RSC-003', 'Escassez de mão de obra especializada em soldagem de alta pressão na região', 'Recursos Humanos', 'Alta', 'Médio', 6, 'Ativo', 'Eng. Sandro Melo', 'Contratação antecipada e parceria com SENAI para treinamento acelerado.', 'Médio — dependência de mercado externo'),
('cc110000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'RSC-004', 'Interferência com duto de gás existente durante escavações no setor norte', 'Técnico', 'Baixa', 'Alto', 3, 'Monitoramento', 'Eng. Ricardo Almeida', 'Levantamento topográfico concluído. Sinalização da rota e treinamento das equipes.', 'Baixo após procedimento operacional'),
('cc110000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'RSC-005', 'Acidente de trabalho em atividade de içamento de cargas pesadas', 'Segurança', 'Média', 'Alto', 6, 'Ativo', 'João Pereira', 'DDS diário para içamento, inspeção mensal dos equipamentos, uso obrigatório de sinalizadores.', 'Baixo após treinamento e protocolo de içamento'),
('cc210000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'RSC-001', 'Atraso no fornecimento de refratários importados — risco de paralisação da aciaria', 'Suprimentos', 'Alta', 'Alto', 9, 'Crítico', 'Lúcia Ferreira', 'Acionamento de fornecedor alternativo nacional. Pedido de adiantamento de entrega.', 'Alto — dependência de fornecedor único'),
('cc210000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'RSC-002', 'Paralisações climáticas acima do previsto — chuvas em período crítico', 'Ambiental', 'Alta', 'Médio', 6, 'Monitoramento', 'Eng. Carlos Mendes', 'Replanning de atividades críticas para janelas secas. Proteção de frentes com cobertura temporária.', 'Médio — evento imprevisível'),
('cc210000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000002', 'RSC-003', 'Divergência contratual sobre escopo de comissionamento — risco de pleito', 'Contratual', 'Média', 'Médio', 4, 'Ativo', 'Dr. Marcos Ribeiro', 'Análise jurídica do Aditivo nº 02. Negociação para esclarecimento do escopo.', 'Baixo após assinatura de adendo de escopo')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- LIÇÕES APRENDIDAS
-- ============================================================
INSERT INTO licoes_aprendidas (id, projeto_id, titulo, categoria, impacto, autor, data, status, diagnostico, comentarios, problemas) VALUES
('ab110000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
 'Planejamento de içamento sem análise de interferências aéreas', 'Segurança', 'Alto', 'Eng. Sandro Melo', '2025-01-20', 'Aprovada',
 'Durante içamento da viga V-04, cabo do guindaste tangenciou linha de alta tensão temporária. Evento sem consequências mas com alto potencial de fatalidade.',
 'O procedimento de içamento não contemplava análise de interferências aéreas no raio de ação. Revisado e aprovado em 22/01/2025.',
 '[{"problema":"Ausência de varredura de interferências no plano de içamento","qtde_p":1,"resolucao":"Incluir checklist de interferências aéreas no formulário pré-içamento","qtde_r":1}]'),

('ab110000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001',
 'Critério de medição de concreto não alinhado no início do contrato', 'Contratos', 'Alto', 'Eng. Patricia Souza', '2024-12-10', 'Aprovada',
 'Divergência de R$ 480.000 no BM-08 por interpretação diferente do Anexo IV sobre medição de forma expandida. Pleito em andamento.',
 'O Anexo IV não foi revisado em conjunto com a fiscalização na mobilização. Alinhamento de critérios deve ser item obrigatório do kick-off.',
 '[{"problema":"Critério de medição não alinhado na mobilização","qtde_p":1,"resolucao":"Incluir revisão conjunta dos Anexos na reunião de kick-off","qtde_r":1},{"problema":"Ata de alinhamento não elaborada","qtde_p":1,"resolucao":"Elaborar Ata de Alinhamento Técnico assinada pelas partes","qtde_r":0}]'),

('ab110000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001',
 'Atraso na aprovação de EPS — procedimento qualificado de soldagem', 'Qualidade', 'Médio', 'Eng. Roberta Lima', '2024-09-15', 'Aguardando Aprovação',
 'EPS submetido com 10 dias de antecedência mas cliente levou 23 dias para aprovar (prazo contratual: 15 dias). Resultado: paralisação notificada pelo SRTE-MG.',
 'Necessário rastrear prazos de aprovação de documentação técnica e acionar o cliente quando o prazo estiver próximo.',
 '[{"problema":"Falta de controle de prazos de aprovação de documentação","qtde_p":1,"resolucao":"Implementar painel de controle de documentos pendentes de aprovação","qtde_r":0}]'),

('ab210000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002',
 'Fornecedor único de refratário — risco não mapeado no início', 'Suprimentos', 'Alto', 'Lúcia Ferreira', '2025-02-01', 'Aprovada',
 'Atraso de 30 dias no fornecimento de refratários por problemas logísticos do fabricante europeu. Sem fornecedor alternativo qualificado.',
 'O mapeamento de risco de fornecedores críticos deve incluir fontes alternativas. Para materiais críticos, avaliar estoque mínimo de segurança.',
 '[{"problema":"Fornecedor único sem alternativa qualificada","qtde_p":1,"resolucao":"Qualificar fornecedor nacional alternativo para próximos projetos","qtde_r":1},{"problema":"Ausência de estoque de segurança","qtde_p":1,"resolucao":"Definir política de estoque mínimo para itens críticos","qtde_r":0}]'),

('ab210000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002',
 'Escopo de comissionamento ambíguo no Aditivo nº 02', 'Contratos', 'Alto', 'Eng. Fernanda Lima', '2025-01-20', 'Aprovada',
 'Texto do Aditivo nº 02 gerou divergência sobre escopo de comissionamento. Pleito em análise com risco de paralisação.',
 'Aditivos contratuais devem passar por revisão jurídica e técnica conjunta. Linguagem deve especificar atividades incluídas e excluídas do escopo.',
 '[{"problema":"Texto ambíguo no aditivo","qtde_p":1,"resolucao":"Emitir adendo de escopo com linguagem objetiva","qtde_r":0}]')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- HISTOGRAMA DE EQUIPAMENTOS
-- ============================================================
INSERT INTO histogramas (id, projeto_id, tipo_equipamento, mes_referencia, quantidade_prevista_mensal, quantidade_rdo_mensal) VALUES
('ef110000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Guindaste', '2025-01-01', 2, 2),
('ef110000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Guindaste', '2025-02-01', 2, 1),
('ef110000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Guindaste', '2025-03-01', 3, 3),
('ef110000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Plataforma Elevatória', '2025-01-01', 4, 4),
('ef110000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'Plataforma Elevatória', '2025-02-01', 4, 3),
('ef110000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', 'Plataforma Elevatória', '2025-03-01', 5, 5),
('ef110000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001', 'Compressor', '2025-01-01', 3, 3),
('ef110000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000001', 'Compressor', '2025-02-01', 3, 2),
('ef110000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000001', 'Compressor', '2025-03-01', 4, 4),
('ef210000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Betoneira', '2025-01-01', 3, 2),
('ef210000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'Betoneira', '2025-02-01', 3, 3),
('ef210000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000002', 'Guindaste', '2025-01-01', 1, 1),
('ef210000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000002', 'Guindaste', '2025-02-01', 2, 1),
('ef210000-0000-0000-0000-000000000005', 'a2000000-0000-0000-0000-000000000002', 'Compressor', '2025-02-01', 2, 2)
ON CONFLICT (id) DO NOTHING;
