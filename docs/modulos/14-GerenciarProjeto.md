# Módulo: Gerenciar Projeto

## Visão Geral

O módulo Gerenciar Projeto centraliza os **dados cadastrais do contrato principal** e os **documentos contratuais** associados ao projeto selecionado. É a "ficha técnica" do projeto — onde são armazenadas as informações fundamentais como objeto do contrato, partes envolvidas, prazos, valor e documentação de referência.

**Importância estrutural:** o campo `valor_contrato` armazenado aqui é usado como base de cálculo pelo **Termômetro de Desvio** da Gestão de Mudanças. Manter este dado atualizado é essencial para que o indicador de desvio seja preciso.

---

## Acesso

Rota: `/GerenciarProjeto`  
**Não está no menu lateral principal** — é acessado via botão específico (ex: ícone de configurações na sidebar ou link no header do projeto).

---

## Entidades de Dados

### Projeto

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `nome` | string | Sim | Nome do projeto (aparece no dropdown de seleção da sidebar) |
| `descricao` | string | Não | Objeto do contrato — o que está sendo executado |
| `cliente` | string | Não | Nome do cliente/contratante |
| `responsavel_geral` | string | Não | Gestor principal do projeto pela contratada |
| `data_inicio` | date | Não | Data de assinatura ou vigência inicial do contrato |
| `data_prevista_termino` | date | Não | Data prevista para conclusão da obra/serviço |
| `valor_contrato` | number | Não | Valor original do contrato em R$ |
| `status` | string (enum) | Sim | Planejamento, Em Andamento, Pausado, Concluído, Cancelado |
| `observacoes` | string | Não | Observações gerais sobre o projeto |

### DocumentoContratual

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `projeto_id` | string (FK) | Sim | Projeto ao qual o documento pertence |
| `nome_documento` | string | Sim | Nome do documento (ex: "Contrato Principal") |
| `tipo_documento` | string (enum) | Sim | Tipo: Contrato, Aditivo, Ordem de Serviço, Anexo, Proposta Técnica, Outros |
| `url_arquivo` | string | Não | URL para acesso ao arquivo (link externo ou storage) |
| `data_referencia` | date | Não | Data de referência do documento |

---

## Funcionalidades

### Visualização dos Dados do Contrato (Modo Leitura)

Por padrão, ao entrar na tela, os dados são exibidos em **modo de leitura** com campos desabilitados (aparência visual diferenciada):

**Layout em 2 colunas (desktop):**

| Campo | Largura |
|---|---|
| Nome do Projeto | Largura total |
| Objeto do Contrato | Largura total (textarea desabilitada) |
| Cliente | 1/2 |
| Responsável Geral | 1/2 |
| Data do Contrato | 1/2 |
| Data de Conclusão | 1/2 |
| Valor do Contrato (R$) | 1/2 |
| Status | 1/2 |
| Observações | Largura total (textarea desabilitada) |

**Aparência dos campos no modo leitura:**
- Fundo cinza claro: `bg-gray-50`
- Borda sem destaque (não azul ao focar)
- Cursor: `cursor-default` (sem indicação de editável)
- Campos de texto: `disabled` no atributo HTML

### Modo de Edição

Ao clicar no botão **"Editar"** (terracota, com ícone `FileText`):
1. Todos os campos mudam para modo editável
2. Bordas tornam-se azuis ao focar
3. Fundo dos campos volta ao branco padrão
4. Os botões de ação mudam: "Editar" desaparece, aparecem "Salvar" e "Cancelar"

**Campos editáveis em modo de edição:**
- Todos os campos da seção Projeto
- Validações ao salvar: Nome é obrigatório

**Ao clicar em "Salvar":**
1. Valida campos obrigatórios
2. Chama `base44.entities.Projeto.update(id, formData)`
3. Invalida as queries `['projeto', selectedProjectId]` e `['projetos']`
   - A invalidação de `['projetos']` é necessária para atualizar o dropdown de projetos na sidebar
4. Volta ao modo de leitura com os novos dados exibidos

**Ao clicar em "Cancelar":**
1. Descarta as alterações não salvas
2. Restaura os campos com os valores originais
3. Volta ao modo de leitura

---

## Gestão de Documentos Contratuais

Seção separada **abaixo** dos dados do projeto, visível tanto no modo leitura quanto no modo edição.

### Lista de Documentos

Tabela com as colunas:

| Coluna | Descrição |
|---|---|
| **Nome** | Nome do documento (`nome_documento`) |
| **Tipo** | Tipo do documento (badge outline — enum fixo) |
| **Data de Referência** | Formato `dd/MM/yyyy` |
| **Arquivo** | Link de download (ícone `Download` + texto "Baixar") |
| **Ações** | Botão Excluir (ícone lixeira vermelho) |

**Estado vazio da lista:** "Nenhum documento contratual cadastrado." com botão "+ Documento" em destaque.

### Adicionar Documento

**Botão "+ Documento"** exibe um **formulário inline** (não modal) abaixo da lista de documentos:

| Campo | Componente | Validação |
|---|---|---|
| Nome do Documento | Input texto | Obrigatório |
| Tipo do Documento | Select | Obrigatório (Contrato, Aditivo, Ordem de Serviço, Anexo, Proposta Técnica, Outros) |
| Data de Referência | Input date | Opcional |
| URL do Arquivo | Input texto (type="url") | Opcional — link para o documento |

**Botões do formulário inline:**
- **Salvar Documento** (verde): chama `base44.entities.DocumentoContratual.create(data)` → invalida `['documentos', selectedProjectId]`
- **Cancelar** (outline): fecha o formulário sem salvar

### Exclusão de Documento

- Botão lixeira em cada linha
- Confirmação: "Excluir o documento [título]?"
- Se confirmado: `base44.entities.DocumentoContratual.delete(id)` → invalida a query

### Download

- Link do documento abre em nova aba (`target="_blank"`)
- Se `arquivo_url` estiver vazio: ícone de download desabilitado ou não exibido

---

## Botões e Ações

| Botão | Localização | Cor | Ação |
|---|---|---|---|
| **Editar** | Cabeçalho do card | Terracota + ícone `FileText` | Ativa modo de edição dos campos |
| **Salvar** | Modo edição | Terracota | Persiste as alterações no projeto |
| **Cancelar** | Modo edição | Outline | Descarta alterações, volta ao modo leitura |
| **+ Documento** | Seção de documentos | Verde | Exibe o formulário inline de adição |
| **Salvar Documento** | Formulário inline | Verde | Cria o documento |
| **Cancelar** | Formulário inline | Outline | Fecha o formulário |
| **Download** (ícone) | Tabela de documentos | Link/outline | Abre o arquivo em nova aba |
| **Excluir documento** (lixeira) | Tabela de documentos | Vermelho | Remove o documento |

---

## Lógica de React Query

### Queries

```javascript
// Dados do projeto selecionado
useQuery({
  queryKey: ['projeto', selectedProjectId],
  queryFn: async () => {
    const projetos = await base44.entities.Projeto.list();
    return projetos.find(p => p.id === selectedProjectId);
  },
  enabled: !!selectedProjectId
})

// Documentos contratuais do projeto
useQuery({
  queryKey: ['documentos', selectedProjectId],
  queryFn: () => base44.entities.DocumentoContratual.list({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId
})
```

### Mutações

```javascript
// Atualizar projeto
const mutacaoSalvar = useMutation({
  mutationFn: (data) => base44.entities.Projeto.update(selectedProjectId, data),
  onSuccess: () => {
    queryClient.invalidateQueries(['projeto', selectedProjectId]);
    queryClient.invalidateQueries(['projetos']); // Atualiza o dropdown da sidebar
    setModoEdicao(false);
  }
});

// Criar documento
const mutacaoCriarDoc = useMutation({
  mutationFn: (data) => base44.entities.DocumentoContratual.create({
    ...data,
    projeto_id: selectedProjectId
  }),
  onSuccess: () => {
    queryClient.invalidateQueries(['documentos', selectedProjectId]);
    setMostrarFormDoc(false);
  }
});
```

---

## Design e Layout

### Cabeçalho da Página

```
┌──────────────────────────────────────────────────────┐
│ [FolderOpen] Gerenciar Projeto                        │
│ Dados cadastrais e documentos do contrato            │
└──────────────────────────────────────────────────────┘
```

### Card de Dados do Projeto

- **Sombra:** `shadow-lg`
- **Cabeçalho do card:** gradiente vermelho/terracota claro: `from-red-50 to-red-100` (hex: `#fff1f0 → #ffd6d6`)
- **Ícone no cabeçalho:** `FileText` em terracota
- **Título do cabeçalho:** "Dados do Contrato"
- **Botão Editar** alinhado à direita no cabeçalho
- **Padding do corpo:** `p-6`
- **Layout:** 2 colunas em desktop, 1 coluna em mobile

### Aparência dos campos

**Modo leitura:**
```
Label (cinza, bold pequeno)
[Campo desabilitado — fundo cinza, sem borda ativa]
```

**Modo edição:**
```
Label (cinza, bold pequeno)
[Campo ativo — borda azul ao focar, fundo branco]
```

### Card de Documentos Contratuais

- Sombra: `shadow-md`
- Sem cabeçalho colorido — apenas título "Documentos Contratuais" + botão "+ Documento"
- Margem superior: `mt-6` separando do card de dados

### Status do Projeto — Cores dos Badges

| Status | Cor |
|---|---|
| Planejamento | Cinza azulado |
| Em Andamento | Verde |
| Pausado | Amarelo |
| Concluído | Azul escuro |
| Cancelado | Vermelho |

---

## Integração com Outros Módulos

- **Sidebar:** o nome do projeto exibido no dropdown vem da entidade `Projeto.nome`. Ao salvar alterações, a query `['projetos']` é invalidada para atualizar o dropdown.
- **Gestão de Mudanças:** o `Projeto.valor_contrato` é consumido pelo componente `MudancaTermometro` para calcular o desvio percentual em relação ao valor original.
- **Todos os módulos:** o `selectedProjectId` armazenado no `localStorage` é o ID do Projeto cujos dados estão aqui gerenciados.

---

## Estado Vazio

**Sem projeto selecionado:**
- Ícone `FolderOpen` em terracota escuro (`#AE3121`)
- Título: "Nenhum Projeto Selecionado"
- Mensagem: "Selecione um projeto no menu lateral para gerenciar seus dados."

**Projeto selecionado mas não encontrado (erro de integridade):**
- Ícone `AlertCircle` em vermelho
- Título: "Projeto Não Encontrado"
- Mensagem: "O projeto selecionado não foi encontrado. Tente selecionar outro projeto."
