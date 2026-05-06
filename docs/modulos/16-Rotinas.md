# Módulo: Processos (Rotinas Administrativas)

## Visão Geral

O módulo de Processos (chamado internamente como "Rotinas") permite registrar e acompanhar **atividades administrativas recorrentes** do projeto — entregas periódicas de relatórios, reuniões regulares, auditorias, atualizações de documentação e outros procedimentos com periodicidade definida.

O sistema monitora automaticamente se cada processo está em dia, atrasado ou foi concluído com base na data da última execução e na periodicidade configurada.

**Diferença em relação ao Plano de Ação:** enquanto o Plano de Ação registra ações pontuais para resolver problemas, as Rotinas são processos recorrentes que se repetem indefinidamente ao longo do projeto.

---

## Acesso

Rota: `/Rotinas`  
**Não está no menu lateral principal** — componente independente, acessado via rota direta.

---

## Entidade de Dados

**Rotina** — campos completos:

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `descricao` | string | Sim | Descrição clara da atividade recorrente |
| `responsavel` | string | Não | Nome ou cargo do responsável pela execução |
| `periodicidade` | string (enum) | Sim | Frequência de repetição da atividade |
| `data_ultima_execucao` | date | Não | Quando foi realizado pela última vez |
| `proxima_data_execucao` | date | Não | Próxima data prevista de execução |
| `status` | string (enum) | Sim | Em Dia, Atrasada, Concluída |
| `projeto_id` | string (FK) | Sim | Projeto ao qual a rotina pertence |

### Opções de Periodicidade

| Valor | Descrição |
|---|---|
| Diária | Executa todos os dias (ex: registro de presença) |
| Semanal | Executa uma vez por semana (ex: reunião semanal) |
| Quinzenal | Executa a cada 15 dias |
| Mensal | Executa uma vez por mês (ex: medição) |
| Trimestral | Executa a cada 3 meses (ex: auditoria) |
| Semestral | Executa a cada 6 meses |
| Anual | Executa uma vez por ano |

---

## Regra de Status Automático (Sugestão de Implementação)

Embora o status possa ser atualizado manualmente, é possível calcular automaticamente:

```
Se proxima_data_execucao < hoje E status != "Concluída":
  → status = "Atrasada"

Se proxima_data_execucao >= hoje:
  → status = "Em Dia"

Se rotina encerrada definitivamente:
  → status = "Concluída" (manual)
```

### Cálculo da Próxima Data

Ao registrar a `data_ultima_execucao`, o sistema pode calcular automaticamente a `proxima_data_execucao`:

```javascript
const calcularProximaData = (ultimaExecucao, periodicidade) => {
  const data = new Date(ultimaExecucao);
  switch (periodicidade) {
    case 'Diária':      return addDays(data, 1);
    case 'Semanal':     return addWeeks(data, 1);
    case 'Quinzenal':   return addDays(data, 15);
    case 'Mensal':      return addMonths(data, 1);
    case 'Trimestral':  return addMonths(data, 3);
    case 'Semestral':   return addMonths(data, 6);
    case 'Anual':       return addYears(data, 1);
  }
};
```

---

## Funcionalidades

### Listagem de Rotinas (`RotinasList`)

**Tabela** com as colunas:

| Coluna | Formato | Notas |
|---|---|---|
| **Descrição** | Texto (truncado se muito longo) | Descrição da atividade |
| **Responsável** | Texto | Nome do responsável |
| **Periodicidade** | Badge outline | Diária, Semanal, etc. |
| **Última Execução** | `dd/MM/yyyy` | Data da última vez que foi executada |
| **Próxima Data** | `dd/MM/yyyy` com destaque | Vermelho se já passou + status "Atrasada" |
| **Status** | Badge colorido | Em Dia / Atrasada / Concluída |
| **Ações** | Ícones | Editar (lápis), Atualizar Status |

**Destaque visual para rotinas atrasadas:**
- Badge "Próxima Data" em vermelho quando `proxima_data_execucao < hoje`
- Linha com fundo vermelho claro (`bg-red-50`) quando status = "Atrasada"

**Ordenação padrão:** rotinas atrasadas no topo, depois por `proxima_data_execucao` crescente.

### Formulário de Criação/Edição (`RotinaForm`)

**Comportamento:**
- Exibido como **card embutido na página** — aparece acima da tabela ao clicar em "Novo Processo"
- Cabeçalho com gradiente verde: `from-green-50 to-green-100`
- Título: "Novo Processo" ou "Editar Processo"
- Ícone: `CheckSquare` em verde

**Campos:**

| Campo | Componente | Validação | Layout |
|---|---|---|---|
| Descrição da Rotina | Textarea (3 linhas) | Obrigatório | Largura total |
| Responsável | Input texto | Opcional | 1/2 largura |
| Periodicidade | Select | Obrigatório | 1/2 largura |
| Data Última Execução | Input date | Opcional | 1/2 largura |
| Próxima Data Prevista | Input date | Opcional | 1/2 largura |
| Status | Select | Obrigatório (padrão: "Em Dia") | 1/2 largura |

**Comportamento ao preencher "Data Última Execução":**
- Se o campo "Próxima Data Prevista" estiver vazio, calcula automaticamente e preenche com base na periodicidade selecionada

---

## Botão "Atualizar Status"

Ação rápida disponível na tabela (sem abrir o formulário completo):

- **Comportamento:** abre um pequeno popover ou dropdown com as opções de status
- **Opções:** Em Dia, Atrasada, Concluída
- **Ao selecionar:** chama `base44.entities.Rotina.update(id, { status: novoStatus })` → invalida a query

---

## Cores de Status

| Status | Cor do Badge | Cor do Fundo da Linha |
|---|---|---|
| Em Dia | Verde (`bg-green-100 text-green-800`) | Normal |
| Atrasada | Vermelho (`bg-red-100 text-red-800`) | `bg-red-50` |
| Concluída | Cinza (`bg-gray-100 text-gray-600`) | Normal |

---

## Botões e Ações

| Botão | Localização | Cor | Ação |
|---|---|---|---|
| **Novo Processo** | Cabeçalho da página | Verde (`bg-green-600`) | Exibe o formulário de criação embutido |
| **Salvar Rotina** | Rodapé do formulário | Verde | Persiste criação ou edição |
| **Cancelar** | Rodapé do formulário | Outline | Fecha o formulário sem salvar |
| **Editar** (lápis) | Coluna de ações | Outline | Preenche o formulário com os dados da rotina |
| **Atualizar Status** | Coluna de ações | Outline | Abre seletor rápido de status |

---

## Lógica de React Query

### Query

```javascript
useQuery({
  queryKey: ['rotinas', selectedProjectId],
  queryFn: () => base44.entities.Rotina.list({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId,
  select: (data) => {
    // Ordena: atrasadas primeiro, depois por próxima data
    return [...data].sort((a, b) => {
      if (a.status === 'Atrasada' && b.status !== 'Atrasada') return -1;
      if (b.status === 'Atrasada' && a.status !== 'Atrasada') return 1;
      return new Date(a.proxima_data_execucao) - new Date(b.proxima_data_execucao);
    });
  }
})
```

### Mutações

- **Criar:** `base44.entities.Rotina.create(data)` → invalida `['rotinas', selectedProjectId]`
- **Editar:** `base44.entities.Rotina.update(id, data)` → invalida `['rotinas', selectedProjectId]`
- **Atualizar Status:** `base44.entities.Rotina.update(id, { status })` → invalida `['rotinas', selectedProjectId]`

---

## Design e Layout

### Cabeçalho da Página

```
┌──────────────────────────────────────────────────────┐
│ [CheckSquare] Processos                               │
│ Atividades administrativas recorrentes do projeto    │
│                              [Novo Processo]         │
└──────────────────────────────────────────────────────┘
```

### Formulário Embutido (quando aberto)

```
┌──────────────────────────────────────────────────────┐
│ [CheckSquare] Novo Processo                     [X]  │  ← gradiente verde
├──────────────────────────────────────────────────────┤
│ Descrição:                                           │
│ ┌──────────────────────────────────────────────┐    │
│ │ Emissão de relatório mensal de progresso     │    │
│ └──────────────────────────────────────────────┘    │
│                                                      │
│ Responsável: [_________]  Periodicidade: [Mensal ▼]  │
│ Última Exec: [__/__/____]  Próxima:     [__/__/____] │
│ Status: [Em Dia ▼]                                   │
│                                                      │
│              [Cancelar] [Salvar Rotina]              │
└──────────────────────────────────────────────────────┘
```

### Tabela de Rotinas

```
┌──────────────────────────────┬─────────┬───────────┬────────────┬──────────────┬──────────┬──────────┐
│ Descrição                    │ Resp.   │ Período   │ Última Exec│ Próxima Data │ Status   │ Ações    │
├──────────────────────────────┼─────────┼───────────┼────────────┼──────────────┼──────────┼──────────┤
│ Emissão relatório mensal     │ Carlos  │ Mensal    │ 31/03/2026 │ 30/04/2026   │ [Em Dia] │ ✏️ 🔄   │
│ Reunião semanal cliente      │ João    │ Semanal   │ 24/04/2026 │ 01/05/2026   │ [Em Dia] │ ✏️ 🔄   │
│ Auditoria interna segurança  │ Maria   │ Trimestral│ 01/01/2026 │ 01/04/2026🔴 │[Atrasada]│ ✏️ 🔄   │
└──────────────────────────────┴─────────┴───────────┴────────────┴──────────────┴──────────┴──────────┘
↑ Linha com bg-red-50 quando atrasada
```

---

## Exemplos Típicos de Rotinas

Exemplos de rotinas comuns em projetos de engenharia/construção:

| Rotina | Periodicidade | Responsável típico |
|---|---|---|
| Emissão de relatório mensal de progresso | Mensal | Gerente do Projeto |
| Reunião semanal de alinhamento com cliente | Semanal | Gerente do Projeto |
| Auditoria interna de segurança (SSMA) | Trimestral | Coordenador SSMA |
| Atualização do cronograma | Semanal | Planejador |
| Envio de medição ao cliente | Mensal | Coordenador de Contratos |
| Revisão do plano de risco | Trimestral | Gerente do Projeto |
| Reunião de alinhamento com subcontratados | Semanal | Coordenador de Construção |
| Atualização de documentação técnica (revisão) | Quinzenal | Engenheiro de Projeto |

---

## Integração com Outros Módulos

- **Dashboard:** o número de rotinas atrasadas pode ser exibido como indicador de alerta no card de resumo
- **Registros:** a execução de uma rotina (ex: reunião semanal) pode gerar uma Ata de Reunião no módulo de Registros ou Planejamento
- **Planos de Ação:** uma rotina consistentemente atrasada pode gerar uma ação corretiva no Plano de Ação da área responsável

---

## Estado Vazio

**Sem projeto selecionado:**
- Ícone `CheckSquare` em verde claro (fundo verde suave)
- Título: "Nenhum Projeto Selecionado"
- Mensagem: "Selecione um projeto para gerenciar os processos recorrentes."

**Com projeto mas sem rotinas:**
- Tabela com header visível
- Mensagem centralizada: "Nenhuma rotina cadastrada para este projeto."
- Botão "Novo Processo" em destaque
