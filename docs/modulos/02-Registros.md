# Módulo: Registros (Ocorrências)

## Visão Geral

O módulo de Registros é responsável pelo **registro e acompanhamento de ocorrências documentais do contrato**. Engloba documentos contratuais (Atas, E-mails, Notificações) e RDOs (Relatório Diário de Obra). Serve como base probatória — registros podem ser vinculados a Pleitos.

---

## Acesso

Rota: `/admin-contratual/registros`
Menu lateral: "Registros" no grupo Admin Contratual (ícone `AlertTriangle`)

---

## Entidade de Dados

**Incidente** → tabela `incidentes`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `projeto_id` | string (FK) | Sim | Projeto vinculado |
| `tipo_registro` | string (enum) | Sim | Ata de Reunião, RDO, E-mail, Notificação |
| `data` | date | Sim | Data da ocorrência (sem campo de hora) |
| `responsavel` | string | Sim | Responsável pelo registro |
| `descricao` | string | Sim | Descrição detalhada da ocorrência |
| `responsabilidade` | string (enum) | Não | Contratada, Contratante, Compartilhada, Força Maior |
| `status` | string (enum) | Não | Registrado, Em Análise, Resolvido (padrão: "Registrado") |
| `impacto_ocorrencia` | array de strings | Não | Categorias de impacto selecionadas |
| `caso_id` | string (FK) | Não | Vinculação opcional a Pleito |
| `anexos` | array | Não | URLs de arquivos anexados via Supabase Storage |

> **Sem status "Fechado":** o fluxo termina em "Resolvido".
> **Sem campo Hora:** apenas data (`type="date"`).
> **Sem botão "+Pleito":** o vínculo com pleito é feito via select.

### Campos de RDO (condicionais)

Exibidos apenas quando `tipo_registro = "RDO"`:

| Campo | Tipo | Descrição |
|---|---|---|
| `numero_rdo` | string | Número sequencial (ex: RDO-0042) |
| `area` | string | Área física da obra |
| `disciplina` | string | Mecânica, Elétrica, Estrutura Metálica, Tubulação |
| `atividades` | string | Atividades executadas no dia |
| `condicoes_climaticas_manha` | string | Clima manhã |
| `condicoes_climaticas_tarde` | string | Clima tarde |
| `condicoes_climaticas_noite` | string | Clima noite |
| `ocorrencias` | string | Eventos especiais / paralisações |
| `mao_de_obra` | array de objetos | `{ quantidade, funcao }` |
| `equipamentos_rdo` | array de objetos | `{ quantidade, equipamento }` |

---

## KPIs da Página

Quatro cards no topo, calculados a partir dos dados do projeto selecionado:

| KPI | Cálculo | Cor do Ícone |
|---|---|---|
| **Total de Registros** | COUNT(*) | Azul |
| **RDOs** | COUNT(*) onde `tipo_registro = "RDO"` | Verde |
| **Em Análise** | COUNT(*) onde `status = "Em Análise"` | Amarelo |
| **Associados a Pleitos** | COUNT(*) onde `caso_id IS NOT NULL` | Terracota |

---

## Funcionalidades

### Listagem

Tabela com colunas: Tipo (badge), Data, Responsável, Descrição (truncada), Responsabilidade, Status (badge), Pleito Vinculado (link ou "—"), Ações.

**Ordenação padrão:** por `data` decrescente.

### Filtros (client-side)

- **Busca por texto:** filtra `descricao` e `responsavel`
- **Por Tipo:** dropdown (Todos / Ata de Reunião / RDO / E-mail / Notificação)
- **Por Status:** dropdown (Todos / Registrado / Em Análise / Resolvido)

### Formulário de Criação/Edição

**Modal flutuante** com overlay escuro, `max-h-[90vh]`, scroll interno.

**Campos comuns:**

| Campo | Componente | Validação |
|---|---|---|
| Tipo de Registro | Select | Obrigatório |
| Data | Input `date` | Obrigatório |
| Responsável | Input texto | Obrigatório |
| Descrição | Textarea (4 linhas) | Obrigatório |
| Responsabilidade | Select (enum) | Opcional |
| Status | Select | Obrigatório (padrão: "Registrado") |
| Categorias de Impacto | Checkboxes (grid) | Opcional |
| Associar a Pleito | Select (Casos do projeto) | Opcional |
| Anexos | Upload de arquivos | Opcional |

**Categorias de Impacto (checkboxes):**
Engenharia, Suprimentos, Escopo, Planejamento, Recursos, Produtividade, Liberação de Área, Segurança, Qualidade, Gestão & Comunicação.

**Campos RDO (visíveis condicionalmente):** bloco com `bg-blue-50 border border-blue-200 rounded-lg p-4` — ver campos detalhados na seção de entidade.

### Tabelas Dinâmicas (RDO)

- Mão de Obra: botão "+ Adicionar", linhas com Quantidade + Função + botão remover
- Equipamentos: botão "+ Adicionar", linhas com Quantidade + Equipamento + botão remover

---

## Fluxo de Status

```
Registrado → Em Análise → Resolvido
```

Não existe status "Fechado" neste módulo.

---

## Cores

### Status

| Status | Cor do Badge |
|---|---|
| Registrado | Cinza (`bg-gray-100 text-gray-700`) |
| Em Análise | Amarelo (`bg-yellow-100 text-yellow-800`) |
| Resolvido | Verde (`bg-green-100 text-green-800`) |

### Tipo de Registro

| Tipo | Cor |
|---|---|
| Ata de Reunião | Azul (`bg-blue-100 text-blue-700`) |
| RDO | Verde (`bg-green-100 text-green-700`) |
| E-mail | Amarelo (`bg-yellow-100 text-yellow-700`) |
| Notificação | Laranja (`bg-orange-100 text-orange-700`) |

---

## Botões

| Botão | Cor | Ação |
|---|---|---|
| **Novo Registro** | Terracota | Abre modal vazio |
| **Salvar** | `bg-emerald-600 hover:bg-emerald-700` | Persiste criação/edição |
| **Cancelar** | Outline | Fecha modal sem salvar |
| **Editar** (lápis) | Outline | Abre modal preenchido |
| **Excluir** (lixeira) | Vermelho | Remove com confirmação |

---

## React Query

```javascript
// Query principal
useQuery({
  queryKey: ['incidentes', selectedProjectId],
  queryFn: () => entities.Incidente.filter({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId
})

// Pleitos para o select
useQuery({
  queryKey: ['casos', selectedProjectId],
  queryFn: () => entities.Caso.filter({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId
})
```

Mutações: `create`, `update`, `delete` na entidade `Incidente` → invalida `['incidentes', selectedProjectId]`.

---

## Integração com Outros Módulos

- **Pleitos:** `caso_id` vincula o registro como evidência no pleito
- **Dashboard:** KPIs de Registros (total, RDOs, Em Análise, Associados) exibidos no card de resumo
- **RDO Module:** RDOs com dados de campo são gerenciados em `/admin-contratual/rdos` com supabase client direto (entidade não está no shim)

---

## Estado Vazio

**Sem projeto:** ícone `AlertTriangle` cinza + "Selecione um projeto na barra lateral."
**Sem registros:** ícone + "Nenhum Registro Cadastrado" + botão "Criar Primeiro Registro".
