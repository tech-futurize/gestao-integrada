BACKLOG DE DESENVOLVIMENTO
1. DASHBOARD (PAINEL GERAL)
Organização da Interface:
Reestruturar as seções do Dashboard para refletir a hierarquia do menu lateral (Módulos e Submódulos).
Implementar widgets e blocos de resumo para cada módulo e submódulo.
Conteúdo: Exibir gráficos, cards totalizadores e informações principais extraídas de cada área do sistema.
2. ENGENHARIA
Funcionalidades de Interface (UI):
Remover as visualizações de "Dashboard", "Grid" e "Kanban" deste módulo.
Corrigir componente de Edição: deve abrir um pop-up (modal) para editar os campos conforme a tabela.
Adicionar campo: Revisão Atual.
Adicionar campo: ID Cronograma.
Lógica e Histórico:
Histórico de Revisões: Criar um log que registre cada mudança no campo de revisão (ex: de 1 para 2, de A para B), indicando a alteração feita e a data.
Prazos (Deadline): Ajustar para considerar os campos Data Cronograma (vinda do planejamento via ID), Data Projetada e Data Real.
Integração:
Ajustar botão de Importar/Exportar com pop-up de mapeamento para associar colunas do arquivo com as do sistema.
3. SUPRIMENTOS
Simplificação e UI:
Remover completamente os submódulos de "Requisições" e "Cotações".
Limitar tabela para 25 itens com barra de rolagem e paginação.
Padronização de Dados:
Implementar tabela global de unidades de medida: Quilo (kg), Tonelada (t), Metro Cúbico (m³), Metro Quadrado (m²), Metro Linear (m), Litro (l), Unidade (un), Peça (pç), Hora (h), Mês (mês) e Verba (vb).
Campos e Labels:
Adicionar campos: Fornecedor, ID Cronograma, Data Prevista (para cada etapa) e Data Real (para cada etapa).
Renomear labels: "N SC" para N SC/OC; "Solicitante" para Responsável.
Vínculo de Datas: Trocar "Data Necessidade" por Data Cronograma (vínculo obrigatório via ID).
Integração:
Ajustar botão de Importar/Exportar com pop-up de mapeamento de colunas.
4. PLANEJAMENTO - CRONOGRAMA
Estrutura de Dados:
Colunas obrigatórias: ID, Atividade, Início BL, Término BL, Início Real, Término Real, Início Previsto, Término Previsto, % Previsto, % Real, Área, Disciplina, Caminho Crítico,Nível(WBS)  e Status.
Fórmula do Status:
Se (Previsto == 0 E Real == 0) → "A Iniciar".
Se (Real == 100%) → "Concluído".
Se (Previsto > Real) → "Atrasada".
Se (Real >= Previsto) → "Em Andamento".
Visualização Gantt:
Botão de Baseline: exibir barra na parte inferior da barra principal do Gantt.
Escala Temporal: remover visualização de "Dias" nas visões de Semana e Mês.
Proporção: aumentar a largura do Gantt e reduzir a largura da coluna de tarefas.
Funcionalidades:
Adicionar botão "6WLA" (filtra atividades das próximas 6 semanas).
Adicionar filtro por Status.
Garantir permissão de hierarquia de dados até 9 níveis.
Importar Cronograma: pop-up para associar colunas do arquivo com as do sistema.
A coluna Nível(WBS) define a estrutura de hierarquia de dados
5. PLANEJAMENTO - 6WLA (LOOK-AHEAD)
Configuração de Interface:
Remover campo "Responsável"; manter visíveis Status e % Avanço Real.
Adicionar campo de Observação.
Adicionar filtros por Semana e por Status.
Lógica de Dados:
Garantir vínculo bidirecional com o módulo de Cronograma.
Dados fechados (read-only) do cronograma: ID, Atividade, Datas (BL, Real, Prev), % (Prev e Real), Área, Disciplina, Caminho Crítico e Status.
Restrições e Prazos:
Trocar campos de restrições para: Documentos, Material, Equipamentos, Mão de Obra, Segurança e Qualidade.
Semanas Ativas: Campo fechado baseado na data prevista (início/término). A atividade entra na semana se houver sobreposição com o período daquela semana.
Dashboard Superior:
Cards indicando: Total de Atividades e Total de Atividades com Restrição para cada uma das 6 categorias.
6. TAKE-OFF
Limpeza e UI:
Remover cards superiores, campo "Status", "Responsável" e "Curva de Previsto" do gráfico.
Cores: Realizado = Verde; Saldo = Vermelho.
Gráficos e Totais:
Adicionar subtotal na parte inferior da tabela.
Adicionar gráficos por Unidade de Medida e por Disciplina.
Lógica de Lançamento:
Ajustar "Data de Lançamento" por Semana do Ano (sistema deve sugerir a data automaticamente).
Integração:
Adicionar filtro por Unidade de Medida.
Botões de Importar e Exportar com pop-up de mapeamento de colunas.
7. HISTOGRAMA (MO E EQUIPAMENTOS)
Correção de Dados:
Separar dados de Mão de Obra que estão misturados com Equipamentos.
Interface da Tabela:
Visual por mês com barra de rolagem horizontal.
Colunas fixas: Mão de Obra/Equipamento, Totais e % Total.
Novas colunas dinâmicas: Qtd. Projetado, Qtd. Prev. Acumulado, Qtd. Real Acumulado e Qtd. Proj. Acumulado.
Regras de Preenchimento:
Bloqueio: Dado Real só pode ser digitado para o mês atual ou inferior.
Salvamento: Ao preencher o Dado Real, o sistema deve limpar o campo Dado Projetado correspondente e bloqueá-lo.
Fórmulas de % Total:
% Total Real = (Real Acumulado / Previsto Acumulado).
% Total Projetado = (Projetado Acumulado / Previsto Acumulado).
Integração e Gráficos:
Acrescentar linhas de valores acumulados nos gráficos.
Importar/Exportar: Escala temporal de 3 meses antes do início do projeto até 1 ano após o término. Pop-up de mapeamento necessário.
8. AVANÇO
Estrutura:
Transpor tabela para linhas: Avanço Previsto, Avanço Real e Avanço Projetado.
Colunas por semana agrupadas por mês (baseado na data de início da semana).
Lógica de Dados:
Aplicar a mesma regra de bloqueio e limpeza de campos Real e Projetado do Histograma.
Aderência: Trocar para % Total Real e % Total Projetado (mesma lógica de cálculo do Histograma).
Interface e Gráficos:
Corrigir erro visual no botão de Editar.
Adicionar barras mensais no gráfico; ajustar eixo X para Semana/Mês conforme tabela.
Importar/Exportar: Escala temporal (Início -3 meses / Término +1 ano) com pop-up de mapeamento.
9. ADM. CONTRATUAL
CONTRATOS:
Alterar tipo "Misto" para Fornecimento + Serviço.
Formatação de Valor: Ponto para milhar e vírgula para decimais.
Aditivos: Criar registro de aditivo com campos Escopo (Texto), Prazo (Dias) e Valor (R$).
Datas Dinâmicas: Início Atual e Término Atual devem ser recalculados conforme aditivos.
Status: Opções: A iniciar, Em andamento, Concluído ou Paralisado.
Medições: Botão para abrir histórico de registros e lançar novas em pop-up.
MEDIÇÕES:
Remover campos: "Elaborador", "Valor Bruto" e "Retenção".
Renomear "Valor Líquido" para Valor (campo fechado, soma automática dos itens).
Adicionar botão Importar/Exportar com mapeamento de colunas.
10. RDO (RELATÓRIO DIÁRIO DE OBRA)
Geral:
Disciplinas: Seleção múltipla.
Remover "KM" do campo de área; remover Hora (manter apenas Data).
Clima: Desvincular Condição de Praticabilidade (permitir qualquer seleção).
Mão de Obra e Equipamentos:
Botões de Adicionar devem gerar campos: Nome, Função/Identificação e Quantidade.
Vínculo de Atividades:
Botão "Vincular Atividades": Pop-up com lista do cronograma (Filtros: ID, Descrição, Data, Área, Disciplina) com checkbox múltiplo.
Permitir mesma associação na seção de "Ocorrências e Impactos".
Evidências:
Campo para anexar arquivo ou capturar foto pelo celular.
Limpeza e Importação:
Remover botão "Anexar à Medição" da visualização.
Importação em massa (1 tabela ou vários arquivos) com pop-up de mapeamento.
NOTA: Importação via PDF e integração com Medição não devem ser executadas agora.
11. REGISTROS
Interface:
Criar cards superiores: Qtd por Tipo, Qtd por Responsabilidade e Qtd por Status.
Filtros: Tipo, Responsabilidade, Status e Período (Início/Término).
Ajustes:
Remover status "Fechado"; remover campo Hora; remover botão "+Pleito".
Permitir anexo de arquivos.
Vincular Atividades: Botão para seleção múltipla do cronograma (pop-up).
12. MAPA DE IMPACTO
Visual:
Ajustar cor de intensidade (Verde Claro → Vermelho).
Corrigir corte de texto no topo do gráfico Contratada/Contratante.
Limpeza:
Remover botão de exportar.
Remover todos os textos de instrução e legendas descritivas ("Distribuição de impactos...", "Clique em uma célula...", etc.).
13. QUALIDADE
Ação: Remover o módulo completo do sistema.
14. RISCOS E MUDANÇAS
GESTÃO DE RISCOS:
Campo Impacto: Seleção múltipla (Escopo, Prazo, Valor).
Novos campos: Escopo (Texto), Prazo (Dias) e Valor (R$).
Categorias: Sincronizar com as do Mapa de Impacto.
Dashboard: Cards quantitativos por categoria; incluir títulos nos filtros.
Plano de Ação: Mover para dentro de Riscos. Trocar "Finalidade" por campos de seleção Registro de Risco ou Registro de Mudança (ID + Descrição).
Estilo: Botões de Salvar devem ser Verdes (não Ciano).
GESTÃO DE MUDANÇAS:
UI: Trocar Kanban por formato de Tabela com Editar/Excluir.
Campos: "Data Ocorrência" → Data Registro; Adicionar campo Pleito.
Impacto no Escopo: Checkbox de seleção única entre "Adição" ou "Redução".
Cards: Total de Desvio Prazo (+/-), Adição/Redução de Valor, Adição/Redução de Escopo.
Estilo: Botões de Salvar devem ser Verdes.
15. CONFIGURAÇÕES E BACKLOG FUTURO
Ativos:
Implementar Cadastro de Projetos.
Implementar Cadastro de Usuários com permissões granulares por módulo.
NOTA DE PLANEJAMENTO:
A estruturação do Mastra (dentro ou fora do sistema) está em fase de planejamento. Não executar agora.
16. IAs (EXECUTOR E ANALISTAS)
Executor e Analista de Negócio:
Melhorar estrutura de resposta para textos mais organizados.
O Analista de Negócio deve realizar apenas análises integradas entre dados reais; proibido fazer suposições.
Analista Contratual:
Configurar tom comercial com rigor jurídico.
Fluxo de Trabalho: Interpretar pedido → Identificar módulos → Solicitar dados ao Executor → Solicitar análise ao Analista de Negócio → Gerar análise final fundamentada.
Proibido inventar dados; usar apenas evidências do sistema.



