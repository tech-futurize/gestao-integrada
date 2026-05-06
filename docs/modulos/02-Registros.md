# Módulo: Registros (Incidentes e RDO)

## Visão Geral

O módulo de Registros é responsável pelo **registro e acompanhamento de todas as ocorrências documentais do contrato**. Ele engloba dois tipos principais de documentação:

1. **Documentos gerais:** Atas de Reunião, E-mails, Notificações contratuais
2. **RDOs (Relatório Diário de Obra):** documentação técnica de campo com informações de mão de obra, equipamentos e condições climáticas

O módulo serve como base probatória — todos os registros podem ser **vinculados a Pleitos**, criando uma trilha de evidências para disputas contratuais.

---

## Acesso

Rota: `/Registros`  
Menu lateral: **"Registros"** (ícone `AlertTriangle`)

---

## Entidade de Dados

### Incidente (registro geral)

**Campos do schema base JSON:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `projeto_id` | string (FK) | Sim | Projeto ao qual o registro pertence |
| `descricao` | string | Sim | Descrição geral e detalhada da ocorrência |
| `data_hora` | datetime | Não | Data e hora do registro (formato ISO 8601) |
| `impacto_preliminar` | string | Não | Avaliação inicial do impacto no contrato |
| `probabilidade` | string (enum) | Não | Probabilidade de impacto: Baixa, Média, Alta (padrão: "Média") |
| `gravidade` | string (enum) | Não | Gravidade do incidente: Baixa, Média, Alta (padrão: "Média") |
| `status` | string (enum) | Não | Registrado, Em Análise, Resolvido, Fechado (padrão: "Registrado") |
| `responsavel_registro` | string | Não | Nome do responsável pela criação |
| `caso_id` | string (FK) | Não | Vinculação opcional a um Pleito (Caso) |

> **Nota sobre campos de RDO:** Os campos `tipo_registro`, `numero_rdo`, `area`, `disciplina`, `condicoes_climaticas_*`, `atividades`, `ocorrencias`, `mao_de_obra`, `equipamentos_rdo`, `impacto_ocorrencia` e `responsabilidade` são campos estendidos gerenciados pela UI e **não fazem parte do schema base JSON da entidade Incidente**.

### Campos exclusivos do RDO (UI)

Estes campos só são relevantes e exibidos quando `tipo_registro = "RDO"`:

| Campo | Tipo | Descrição |
|---|---|---|
| `numero_rdo` | string | Número sequencial do RDO (ex: RDO-0042) |
| `area` | string | Área física da obra onde as atividades ocorreram |
| `disciplina` | string (enum) | Mecânica, Elétrica, Estrutura Metálica, Tubulação |
| `atividades` | string | Descrição das atividades executadas durante o dia |
| `condicoes_climaticas_manha` | string | Condições climáticas no turno da manhã |
| `condicoes_climaticas_tarde` | string | Condições climáticas no turno da tarde |
| `condicoes_climaticas_noite` | string | Condições climáticas no turno da noite (se aplicável) |
| `ocorrencias` | string | Ocorrências especiais do dia (incidentes, paralisações) |
| `mao_de_obra` | array de objetos | Registros de presença: `{ quantidade: number, funcao: string }` |
| `equipamentos_rdo` | array de objetos | Equipamentos utilizados: `{ quantidade: number, equipamento: string }` |

---

## KPIs da Página

Quatro cards no topo da página, calculados a partir dos dados do projeto selecionado:

| KPI | Cálculo | Cor do ícone |
|---|---|---|
| **Total de Registros** | `COUNT(*)` de todos os incidentes do projeto | Azul |
| **RDOs** | `COUNT(*)` onde `tipo_registro = "RDO"` | Verde |
| **Em Análise** | `COUNT(*)` onde `status = "Em Análise"` | Amarelo |
| **Associados a Pleitos** | `COUNT(*)` onde `caso_id IS NOT NULL` | Terracota |

---

## Funcionalidades

### Listagem de Registros

**Tabela principal** com as seguintes colunas:
- **Tipo:** badge colorido (Ata = azul, RDO = verde, E-mail = amarelo, Notificação = laranja)
- **Data/Hora:** formato `dd/MM/yyyy HH:mm`
- **Responsável:** nome do responsável
- **Descrição:** texto truncado em 2 linhas (máx ~100 chars), com tooltip completo no hover
- **Impacto:** badges das categorias de impacto selecionadas (se houver)
- **Status:** badge colorido (ver seção de Cores de Status)
- **Pleito Vinculado:** número/título do pleito vinculado (link clicável) ou "—" se não vinculado
- **Ações:** botões de Editar (ícone lápis) e Excluir (ícone lixeira)

**Comportamento da tabela:**
- Ordenação padrão: por `data_hora` decrescente (mais recente primeiro)
- Paginação: não definida — carrega todos os registros do projeto
- Loading skeleton durante o carregamento inicial
- Estado vazio: ícone centralizado + mensagem "Nenhum registro cadastrado" + botão "Criar Primeiro Registro"

### Filtros Disponíveis

- **Por Tipo:** dropdown com todas as opções (Todos, Ata de Reunião, RDO, E-mail, Notificação)
- **Por Status:** dropdown (Todos, Registrado, Em Análise, Associado a Pleito, Arquivado)

Os filtros são aplicados localmente (client-side) sobre os dados já carregados via React Query.

### Formulário de Criação/Edição (`IncidenteForm`)

**Comportamento:**
- Exibido como **modal flutuante** com overlay escuro semitransparente
- Posição: centralizado na tela
- Tamanho: máximo de 90% da altura da viewport (`max-h-[90vh]`)
- Scroll interno quando o conteúdo ultrapassa a altura máxima
- Fecha ao clicar no botão "Cancelar" ou no botão "X" do cabeçalho

**Cabeçalho do modal:**
- Gradiente laranja suave: `from-orange-50 to-amber-50` (hex aproximado: `#fff7ed → #ffedd5`)
- Título: "Novo Registro" (criação) ou "Editar Registro" (edição)
- Ícone: `FileText` em terracota
- Botão X (fechar) alinhado à direita

**Campos comuns a todos os tipos:**

| Campo | Componente | Validação |
|---|---|---|
| Tipo de Registro | Select | Obrigatório |
| Data e Hora | Input `datetime-local` | Obrigatório |
| Responsável | Input texto | Obrigatório |
| Descrição | Textarea (4 linhas) | Obrigatório |
| Impacto Preliminar | Textarea (3 linhas) | Opcional |
| Status | Select | Obrigatório (padrão: "Registrado") |
| Responsabilidade | Input texto | Opcional |
| Associar a Pleito | Select (lista de Casos do projeto) | Opcional |

**Checklist de Categorias de Impacto (10 opções):**

Exibido como grid de checkboxes 2×5 ou 3×4. Ao marcar, adiciona o valor ao array `impacto_ocorrencia`:

1. Engenharia
2. Suprimentos
3. Escopo
4. Planejamento
5. Recursos
6. Produtividade
7. Liberação de Área
8. Segurança
9. Qualidade
10. Gestão & Comunicação

**Campos exclusivos do RDO** (exibidos condicionalmente quando `tipo_registro = "RDO"`):

Estes campos aparecem em um bloco destacado com `bg-blue-50 border border-blue-200 rounded-lg p-4` dentro do modal, com título "Informações do RDO":

| Campo | Componente | Observação |
|---|---|---|
| Número RDO | Input texto | Ex: "RDO-0042" |
| Área | Input texto | Ex: "Área Norte - Módulo 3" |
| Disciplina | Select | Mecânica, Elétrica, Estrutura Metálica, Tubulação |
| Condições Climáticas - Manhã | Input texto | Ex: "Ensolarado, 28°C" |
| Condições Climáticas - Tarde | Input texto | Ex: "Parcialmente nublado" |
| Condições Climáticas - Noite | Input texto | Ex: "Chuva fraca" |
| Atividades do Dia | Textarea (3 linhas) | Descrição do que foi executado |
| Ocorrências | Textarea (3 linhas) | Eventos especiais, paralisações |

**Tabela Dinâmica de Mão de Obra:**
- Botão "+ Adicionar Mão de Obra" para inserir nova linha
- Por linha: campo `Quantidade` (número, min 1) e campo `Função` (texto livre)
- Botão de remover linha (ícone lixeira, vermelho) por linha
- Estado vazio: texto "Nenhuma mão de obra registrada"

**Tabela Dinâmica de Equipamentos:**
- Botão "+ Adicionar Equipamento" para inserir nova linha
- Por linha: campo `Quantidade` (número, min 1) e campo `Equipamento` (texto livre)
- Botão de remover linha por linha
- Estado vazio: texto "Nenhum equipamento registrado"

---

## Fluxo de Status de um Registro

```
Registrado
    ↓
Em Análise
    ↓           ↓
Resolvido    Fechado
```

**Regra de negócio:** ao associar um registro a um Pleito (definir `caso_id`), o sistema pode automaticamente refletir o progresso da investigação no status.

---

## Cores de Status

| Status | Cor do Badge |
|---|---|
| Registrado | Cinza (`bg-gray-100 text-gray-700`) |
| Em Análise | Amarelo (`bg-yellow-100 text-yellow-800`) |
| Resolvido | Verde (`bg-green-100 text-green-800`) |
| Fechado | Azul acinzentado (`bg-blue-100 text-blue-800`) |

### Cores de Tipo de Registro

| Tipo | Cor |
|---|---|
| Ata de Reunião | Azul (`bg-blue-100 text-blue-700`) |
| RDO | Verde (`bg-green-100 text-green-700`) |
| E-mail | Amarelo (`bg-yellow-100 text-yellow-700`) |
| Notificação | Laranja (`bg-orange-100 text-orange-700`) |

---

## Botões e Ações

| Botão | Localização | Cor | Ação |
|---|---|---|---|
| **Novo Registro** | Cabeçalho da página | Terracota (`#c35e1e`) | Abre o formulário de criação (modal vazio) |
| **Editar** | Coluna de ações da tabela | Ícone lápis (cinza/outline) | Abre o modal preenchido com os dados do registro |
| **Excluir** | Coluna de ações da tabela | Ícone lixeira (vermelho) | Confirma e remove o registro permanentemente |
| **Salvar** | Rodapé do modal | Verde | Valida campos obrigatórios e persiste via API |
| **Cancelar** | Rodapé do modal | Outline (sem fill) | Fecha o modal sem salvar nenhuma alteração |

### Comportamento ao Excluir
- Exibe um `confirm()` nativo do browser ou um modal de confirmação
- Texto: "Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita."
- Se confirmado: chama `base44.entities.Incidente.delete(id)` e invalida a query

---

## Lógica de React Query

### Queries

```javascript
// Busca todos os registros do projeto selecionado
useQuery({
  queryKey: ['incidentes', selectedProjectId],
  queryFn: () => base44.entities.Incidente.list({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId
})

// Busca lista de Pleitos para o Select de vinculação
useQuery({
  queryKey: ['casos', selectedProjectId],
  queryFn: () => base44.entities.Caso.list({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId
})
```

### Mutações

- **Criar:** `base44.entities.Incidente.create(formData)` → invalida `['incidentes', selectedProjectId]`
- **Editar:** `base44.entities.Incidente.update(id, formData)` → invalida `['incidentes', selectedProjectId]`
- **Excluir:** `base44.entities.Incidente.delete(id)` → invalida `['incidentes', selectedProjectId]`

---

## Integração com Outros Módulos

- **Pleitos:** um registro pode ser vinculado a um Pleito via `caso_id`. O Pleito exibe os registros vinculados como evidências na sua tela de detalhe.
- **Dashboard:** os KPIs de Registros (total, RDOs, em análise, associados) são exibidos no card de resumo do Dashboard.
- **Notificações (Ruídos):** um Ruído promovido a Pleito pode ter registros associados ao mesmo pleito como evidências.

---

## Design Detalhado

### Cabeçalho da Página
```
┌─────────────────────────────────────────────────┐
│ [AlertTriangle] Registros                        │
│ Ocorrências e documentação do contrato           │
│                              [Novo Registro]     │
└─────────────────────────────────────────────────┘
```

### Layout dos KPIs
- 4 cards em linha horizontal (responsivo: 2×2 em mobile)
- Cada card: ícone à esquerda, número grande, label abaixo

### Layout do Modal (RDO expandido)
- Seções separadas por `<hr>` ou espaço
- Bloco de dados RDO com fundo azul claro para destacar visualmente que são campos adicionais
- Tabelas dinâmicas com scroll interno se tiverem muitas linhas

---

## Estado Vazio

**Sem projeto selecionado:**
- Ícone `AlertTriangle` em cinza
- Título: "Nenhum Projeto Selecionado"
- Subtítulo: "Selecione um projeto na barra lateral para ver os registros."

**Com projeto mas sem registros:**
- Ícone `FileText` em terracota claro
- Título: "Nenhum Registro Cadastrado"
- Subtítulo: "Comece documentando as ocorrências do projeto."
- Botão: "Criar Primeiro Registro"
