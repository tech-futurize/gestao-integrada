# Módulo: Gestão de Relacionamentos

## Visão Geral

O módulo de Relacionamentos é um **log de interações com stakeholders** e partes interessadas do projeto. Cada registro documenta uma tratativa, reunião, negociação ou interação significativa com pessoas ou organizações, classificando o tom e o resultado da interação.

**Finalidade:** criar uma trilha rastreável do histórico relacional do projeto — especialmente útil em situações de tensão contratual, auditorias ou quando é necessário evidenciar o padrão de relacionamento com determinada parte ao longo do tempo.

---

## Acesso

Rota: `/Relacionamentos`  
**Não está no menu lateral principal** — componente independente, acessado via rota direta.

---

## Entidade de Dados

**Relacionamento** — campos completos:

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `data_interacao` | date | Sim | Data em que a interação ocorreu |
| `descricao` | string | Sim | Descrição detalhada do que foi discutido, decidido ou ocorreu |
| `partes_envolvidas` | array de strings | Não | Lista de stakeholders que participaram |
| `objetivo` | string | Não | Objetivo declarado da interação |
| `resultado` | string | Não | Resultado obtido ou desfecho da interação |
| `classificacao` | string (enum) | Sim | Excelente, Bom, Neutro, Tenso, Crítico |
| `projeto_id` | string (FK) | Sim | Projeto ao qual o relacionamento pertence |

---

## Funcionalidades

### Listagem de Tratativas (`RelacionamentosList`)

**Tabela principal** com as colunas:

| Coluna | Formato | Notas |
|---|---|---|
| **Data** | `dd/MM/yyyy` | Data da interação |
| **Descrição** | Texto truncado (2 linhas) + objetivo em linha menor | Tooltip com texto completo no hover |
| **Partes Envolvidas** | Badges com nomes | Se mais de 3 partes: exibe as 3 primeiras + badge "+N" |
| **Classificação** | Badge colorido | Cor conforme o tom da interação |
| **Ações** | Ícone lápis | Botão Editar |

**Ordenação padrão:** por `data_interacao` decrescente (mais recentes primeiro).

**Exibição da Descrição:**
- Linha 1: `descricao` truncada em 2 linhas (CSS `line-clamp-2`)
- Linha 2 (menor, cinza): `objetivo` truncado em 1 linha, se preenchido

**Exibição das Partes:**
- Cada parte como badge: `bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full`
- Se `partes_envolvidas.length > 3`: exibe as 3 primeiras + badge cinza "+N" (ex: "+2")
- Tooltip no badge "+N" com a lista completa

---

### Formulário de Criação/Edição (`RelacionamentoForm`)

**Comportamento:**
- Exibido como **card embutido na página** — aparece acima da tabela, não é modal flutuante
- Cabeçalho com gradiente azul: `from-blue-50 to-indigo-50`
- Título: "Nova Tratativa" ou "Editar Tratativa"
- Ícone: `Users` em azul

**Campos do formulário:**

| Campo | Componente | Validação | Layout |
|---|---|---|---|
| Data da Interação | Input date | Obrigatório | 1/2 largura |
| Classificação | Select | Obrigatório | 1/2 largura |
| Descrição da Tratativa | Textarea (4 linhas) | Obrigatório | Largura total |
| Partes Envolvidas | Input + botão "Adicionar" | Opcional | Largura total |
| Objetivo | Textarea (3 linhas) | Opcional | Largura total |
| Resultado | Textarea (3 linhas) | Opcional | Largura total |

**Campo "Partes Envolvidas" — comportamento detalhado:**

1. Input de texto com placeholder "Nome do stakeholder..."
2. Botão "Adicionar" ao lado (ou tecla Enter)
3. Ao adicionar: o nome vira um chip/tag abaixo do input
4. Tags exibidas em fila horizontal (com wrap): `bg-blue-100 text-blue-800`
5. Cada tag tem botão X de remoção (`×`)
6. Tags removíveis individualmente
7. Ao salvar, o array `partes_envolvidas` contém todos os nomes das tags

**Especificações das tags:**
```
[João Silva ×] [Maria Costa ×] [Eng. Carlos ×]
```
- Fundo: `bg-blue-100`
- Texto: `text-blue-800 text-sm`
- Border-radius: `rounded-full`
- Padding: `px-3 py-1`
- Botão X: `text-blue-600 hover:text-blue-900 ml-2`

---

## Opções de Classificação

| Classificação | Cor do Badge | Significado |
|---|---|---|
| Excelente | Verde (`bg-green-100 text-green-800`) | Interação muito positiva, avanços significativos |
| Bom | Azul (`bg-blue-100 text-blue-800`) | Interação positiva, encaminhamentos claros |
| Neutro | Cinza (`bg-gray-100 text-gray-700`) | Interação informativa, sem tensão nem avanços |
| Tenso | Amarelo (`bg-yellow-100 text-yellow-800`) | Conflito moderado, divergência de posições |
| Crítico | Vermelho (`bg-red-100 text-red-800`) | Conflito grave, ameaças, comunicação deteriorada |

---

## Botões e Ações

| Botão | Localização | Cor | Ação |
|---|---|---|---|
| **Nova Tratativa** | Cabeçalho da página | Azul (`bg-blue-600`) | Exibe o formulário acima da tabela |
| **Adicionar** (parte) | Ao lado do input de partes | Outline azul | Insere o stakeholder como tag |
| **Salvar Tratativa** | Rodapé do formulário | Azul | Persiste a criação ou edição |
| **Cancelar** | Rodapé do formulário | Outline | Oculta o formulário sem salvar |
| **Editar** (lápis) | Coluna de ações na tabela | Outline | Preenche o formulário com os dados |

**Observação:** não há botão de excluir explícito na documentação original — para deletar uma tratativa, o usuário precisa editar e pode ser necessário adicionar o botão de exclusão.

---

## Lógica de React Query

### Query

```javascript
useQuery({
  queryKey: ['relacionamentos', selectedProjectId],
  queryFn: () => base44.entities.Relacionamento.list({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId,
  select: (data) => data.sort((a, b) => new Date(b.data_interacao) - new Date(a.data_interacao))
})
```

### Mutações

- **Criar:** `base44.entities.Relacionamento.create(data)` → invalida `['relacionamentos', selectedProjectId]`
- **Editar:** `base44.entities.Relacionamento.update(id, data)` → invalida `['relacionamentos', selectedProjectId]`

---

## Design e Layout

### Cabeçalho da Página

```
┌──────────────────────────────────────────────────────┐
│ [Users] Gestão de Relacionamentos                     │
│ Log de interações com stakeholders do projeto        │
│                              [Nova Tratativa]        │
└──────────────────────────────────────────────────────┘
```

### Formulário Embutido (quando aberto)

```
┌──────────────────────────────────────────────────────┐
│ [Users] Nova Tratativa                          [X]  │  ← gradiente azul
├──────────────────────────────────────────────────────┤
│ Data: [__/__/____]    Classificação: [Bom ▼]         │
│                                                      │
│ Descrição:                                           │
│ ┌──────────────────────────────────────────────┐    │
│ │                                              │    │
│ └──────────────────────────────────────────────┘    │
│                                                      │
│ Partes: [________________] [Adicionar]               │
│ [João Silva ×] [Maria Costa ×]                       │
│                                                      │
│ Objetivo:    [___________]                           │
│ Resultado:   [___________]                           │
│                                                      │
│              [Cancelar] [Salvar Tratativa]           │
└──────────────────────────────────────────────────────┘
```

### Tabela de Tratativas

```
┌──────────────┬────────────────────────────────┬────────────────────┬─────────────┬────────┐
│ Data         │ Descrição / Objetivo            │ Partes             │ Classificação│ Ações  │
├──────────────┼────────────────────────────────┼────────────────────┼─────────────┼────────┤
│ 15/01/2026   │ Reunião de alinhamento de...   │ [João] [Maria] +2  │ [Bom]       │ [✏️]   │
│              │ → revisar o plano de execução  │                    │             │        │
└──────────────┴────────────────────────────────┴────────────────────┴─────────────┴────────┘
```

**Header da tabela:** `bg-gray-50 text-sm font-semibold text-gray-600`  
**Hover nas linhas:** `hover:bg-gray-50`  
**Borda inferior:** `border-b border-gray-100`

---

## Casos de Uso Típicos

Este módulo é especialmente útil para:

1. **Documentar reuniões de alinhamento com o cliente** — registrando pauta, participantes e encaminhamentos
2. **Registrar interações em momentos de tensão contratual** — criando evidência do padrão de comunicação
3. **Manter rastreabilidade de comunicações com stakeholders estratégicos** — fiscalização, subcontratados-chave, reguladores
4. **Evidenciar o histórico de tratativas em caso de disputa ou auditoria** — as classificações "Tenso" e "Crítico" são marcadores de escalada
5. **Apoiar a construção de dossiês para pleitos** — mostrando que a contratada tentou resolver amigavelmente antes de formalizar

---

## Integração com Outros Módulos

- **Pleitos:** as tratativas de relacionamento documentam o histórico de negociações que podem servir como evidência em pleitos formais
- **Registros:** diferente dos Registros (que documentam ocorrências técnicas), os Relacionamentos focam na qualidade da interação interpessoal
- **Dashboard:** o número de tratativas "Críticas" recentes pode ser destacado como alerta no card de resumo

---

## Estado Vazio

**Sem projeto selecionado:**
- Ícone `Users` em cinza
- Título: "Nenhum Projeto Selecionado"

**Com projeto mas sem tratativas:**
- Ícone `Users` em cinza + mensagem "Nenhuma Tratativa Registrada"
- Subtítulo: "Registre as interações com stakeholders para manter o histórico relacional do projeto."
- Botão "Nova Tratativa" em destaque
