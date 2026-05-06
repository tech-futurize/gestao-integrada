# Módulo: Notificações (Ruídos Contratuais)

## Visão Geral

O módulo de Notificações (chamado internamente como "Ruídos") é utilizado para registrar **alertas e sinais contratuais** que ainda não atingiram o nível de um Pleito formal, mas precisam ser monitorados e gerenciados.

**Conceito de Ruído Contratual:**
Um ruído é um sinal de alerta — uma situação que pode evoluir para uma disputa contratual se não for acompanhada. Exemplos: um atraso na entrega de documentação técnica que ainda está sendo negociado, uma interface entre disciplinas que pode gerar conflito de escopo, um comportamento do cliente que pode indicar resistência a uma reivindicação futura.

**O fluxo de escalonamento:**
```
Identificado (ruído)
    ↓
Em Análise (avaliação do impacto potencial)
    ↓              ↓
Promovido      Descartado
(vira Pleito)  (arquivado)
```

---

## Acesso

Rota: `/Ruidos`  
**Não está no menu lateral principal** — componente independente, acessado via rota direta.

---

## Entidade de Dados

**Ruido** — campos completos:

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `projeto_id` | string (FK) | Sim | Projeto ao qual o ruído pertence |
| `descricao` | string | Sim | Descrição clara do sinal identificado e o que o motivou |
| `categoria` | string (enum) | Sim | Área de origem: Técnica, Financeira, Ambiental, Jurídica, Outros |
| `causas_potenciais` | string | Não | Possíveis causas que geraram o ruído |
| `impacto_potencial` | string | Não | Impacto esperado caso o ruído evolua para pleito |
| `probabilidade` | string (enum) | Não | Probabilidade de evolução: Baixa, Média, Alta (padrão: "Média") |
| `data_identificacao` | date | Não | Data em que o ruído foi identificado |
| `responsavel` | string | Não | Responsável pelo monitoramento do ruído |
| `status` | string (enum) | Não | Identificado, Em Análise, Descartado, Promovido (padrão: "Identificado") |
| `caso_id` | string (FK) | Não | ID do Pleito criado a partir da promoção (preenchido automaticamente) |

> **Nota:** o campo `impacto` (dimensão Escopo/Custo/Prazo) **não faz parte do schema JSON** da entidade Ruido — era incorreto na versão anterior desta documentação.

### Categorias Disponíveis

- Técnica
- Financeira
- Ambiental
- Jurídica
- Outros

---

## Funcionalidades

### Listagem de Notificações (`RuidosList`)

**Tabela ou cards** com as informações:

| Coluna | Formato | Notas |
|---|---|---|
| **Descrição** | Texto truncado (2 linhas) | Tooltip com texto completo |
| **Categoria** | Badge outline | Área de origem (Técnica, Financeira, Ambiental, Jurídica, Outros) |
| **Probabilidade** | Badge colorido | Baixa / Média / Alta |
| **Status** | Badge colorido | Status atual |
| **Responsável** | Texto | Nome |
| **Data Identificação** | `dd/MM/yyyy` | Data do registro |
| **Pleito Vinculado** | Link ou "—" | Se `caso_id` preenchido, exibe link para o pleito |
| **Ações** | Botões | Promover, Descartar, Editar, Excluir |

**Ordenação padrão:**
- Ruídos "Identificados" e "Em Análise" no topo (ativos)
- Depois por probabilidade (Alta → Baixa)
- Ruídos "Promovidos" e "Descartados" no final

**Destaque visual:**
- Ruídos com `probabilidade = "Alta"` e `status = "Identificado"` recebem destaque visual (borda laranja ou fundo laranja claro) como alerta de urgência

---

### Formulário de Criação/Edição (`RuidoForm`)

**Comportamento:**
- Exibido como **card embutido na página** (não modal) — aparece acima da lista ao clicar em "Nova Notificação"
- Cabeçalho com gradiente cinza-azulado: `from-gray-50 to-blue-50` (hex: `#f0f4f8 → #e8f0f8`)
- Título: "Nova Notificação" ou "Editar Notificação"
- Ícone: `Radio` em azul

**Campos do formulário:**

| Campo | Componente | Validação | Layout |
|---|---|---|---|
| Descrição | Textarea (4 linhas) | Obrigatório | Largura total |
| Causas Potenciais | Textarea (3 linhas) | Opcional | Largura total |
| Impacto Potencial | Textarea (3 linhas) | Opcional | Largura total |
| Categoria | Select | Obrigatório | 1/2 largura |
| Probabilidade | Select | Opcional | 1/2 largura |
| Status | Select | Obrigatório (padrão: "Identificado") | 1/2 largura |
| Data de Identificação | Input date | Opcional | 1/2 largura |
| Responsável | Input texto | Opcional | 1/2 largura |
| Associar a Pleito | Select (lista de Pleitos do projeto) | Opcional | Largura total |

**Campo "Associar a Pleito":**
- Lista todos os `Caso` do projeto (`base44.entities.Caso.list({ projeto_id })`)
- Permite vincular manualmente o ruído a um pleito existente (diferente de "Promover a Pleito" que cria um novo)
- Exibe número/título do pleito no Select

---

## Funcionalidade Especial: Promover a Pleito

O botão **"Promover a Pleito"** é a funcionalidade mais importante do módulo — permite escalar um ruído para um pleito formal automaticamente.

### Algoritmo de Promoção (sequência)

**Passo 1 — Criar novo Pleito (Caso):**
```javascript
const novoCaso = await base44.entities.Caso.create({
  titulo: `Pleito originado: ${ruido.descricao.substring(0, 50)}`,
  descricao_problema: ruido.descricao,
  contexto: `Causas potenciais: ${ruido.causas_potenciais || 'N/A'}\nImpacto potencial: ${ruido.impacto_potencial || 'N/A'}`,
  data_abertura: new Date().toISOString().split('T')[0], // data de hoje
  status: 'Aberto',
  responsavel: ruido.responsavel,
  prioridade: ruido.probabilidade === 'Alta' ? 'Alta' : 'Média',
  projeto_id: ruido.projeto_id
});
```

**Passo 2 — Atualizar o Ruído:**
```javascript
await base44.entities.Ruido.update(ruido.id, {
  status: 'Promovido',
  caso_id: novoCaso.id
});
```

**Passo 3 — Invalidar Queries:**
```javascript
queryClient.invalidateQueries(['ruidos', selectedProjectId]);
queryClient.invalidateQueries(['casos', selectedProjectId]);
```

### Resultado Visual

- O ruído muda seu status para "Promovido" com badge verde
- O campo "Pleito Vinculado" passa a exibir o link para o novo pleito criado
- O botão "Promover" é substituído por um indicador "Já promovido"

### Mapeamento de Campos

| Campo do Ruído | Campo do Pleito Criado |
|---|---|
| `descricao` (primeiros 50 chars) | `titulo` |
| `descricao` (completo) | `descricao_problema` |
| `causas_potenciais` + `impacto_potencial` | `contexto` |
| data de hoje | `data_abertura` |
| `responsavel` | `responsavel` |
| `probabilidade = "Alta"` → "Alta", caso contrário → "Média" | `prioridade` |
| `"Aberto"` | `status` |

---

## Funcionalidade: Descartar Notificação

O botão **"Descartar"** muda o status do ruído para "Descartado" **sem excluí-lo**, mantendo o histórico rastreável.

```javascript
await base44.entities.Ruido.update(ruido.id, { status: 'Descartado' });
queryClient.invalidateQueries(['ruidos', selectedProjectId]);
```

**Quando usar:** quando a situação foi investigada e determinou-se que não representa risco contratual relevante, ou quando o contexto mudou e o ruído não é mais aplicável.

---

## Cores de Status

| Status | Cor do Badge |
|---|---|
| Identificado | Cinza/Azul (`bg-gray-100 text-gray-700` ou `bg-blue-100 text-blue-700`) |
| Em Análise | Amarelo (`bg-yellow-100 text-yellow-800`) |
| Descartado | Cinza escuro (`bg-gray-200 text-gray-600`) |
| Promovido | Verde (`bg-green-100 text-green-800`) |

## Cores de Probabilidade

| Probabilidade | Cor |
|---|---|
| Alta | Vermelho (`bg-red-100 text-red-800`) |
| Média | Amarelo (`bg-yellow-100 text-yellow-800`) |
| Baixa | Verde (`bg-green-100 text-green-800`) |

---

## Botões e Ações

| Botão | Localização | Cor | Ação |
|---|---|---|---|
| **Nova Notificação** | Cabeçalho | Verde (`bg-green-600`) | Exibe o formulário de criação embutido |
| **Salvar Notificação** | Rodapé do formulário | Verde | Persiste criação ou edição |
| **Cancelar** | Rodapé do formulário | Outline | Fecha o formulário sem salvar |
| **Editar** (lápis) | Coluna de ações | Outline | Preenche o formulário com os dados |
| **Promover a Pleito** | Coluna de ações | Terracota / Azul | Executa o fluxo de promoção automático |
| **Descartar** | Coluna de ações | Cinza/outline | Muda status para "Descartado" |
| **Excluir** (lixeira) | Coluna de ações | Vermelho | Remove o registro permanentemente |

**Regras de exibição dos botões:**
- **Promover:** visível apenas se `status = "Identificado"` ou `"Em Análise"` (e `caso_id` vazio)
- **Descartar:** visível apenas se `status = "Identificado"` ou `"Em Análise"`
- **Excluir:** visível sempre
- Se `status = "Promovido"`: os botões "Promover" e "Descartar" são substituídos por um link para o pleito criado

---

## Lógica de React Query

### Queries

```javascript
// Ruídos do projeto
useQuery({
  queryKey: ['ruidos', selectedProjectId],
  queryFn: () => base44.entities.Ruido.list({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId
})

// Pleitos existentes para o Select "Associar a Pleito"
useQuery({
  queryKey: ['casos', selectedProjectId],
  queryFn: () => base44.entities.Caso.list({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId
})
```

### Mutações

```javascript
// Promover a Pleito (sequência)
const promoverAPleito = async (ruido) => {
  // 1. Criar pleito
  const novoCaso = await base44.entities.Caso.create({ ... });
  // 2. Atualizar ruído
  await base44.entities.Ruido.update(ruido.id, {
    status: 'Promovido',
    caso_id: novoCaso.id
  });
  // 3. Invalidar ambas as queries
  queryClient.invalidateQueries(['ruidos', selectedProjectId]);
  queryClient.invalidateQueries(['casos', selectedProjectId]);
};

// Descartar
const descartar = async (id) => {
  await base44.entities.Ruido.update(id, { status: 'Descartado' });
  queryClient.invalidateQueries(['ruidos', selectedProjectId]);
};
```

---

## Design e Layout

### Cabeçalho da Página

```
┌──────────────────────────────────────────────────────┐
│ [Radio] Notificações                                  │
│ Alertas e sinais contratuais em monitoramento        │
│                              [Nova Notificação]      │
└──────────────────────────────────────────────────────┘
```

### Formulário Embutido

```
┌──────────────────────────────────────────────────────┐
│ [Radio] Nova Notificação                        [X]  │  ← gradiente cinza-azulado
├──────────────────────────────────────────────────────┤
│ Descrição:                                           │
│ ┌──────────────────────────────────────────────┐    │
│ │                                              │    │
│ └──────────────────────────────────────────────┘    │
│                                                      │
│ Causas Potenciais:    Impacto Potencial:             │
│ [_______________]     [_______________]              │
│                                                      │
│ Categoria: [▼]                                       │
│ Probabilidade: [▼]  Status: [Identificado ▼]         │
│ Data: [__/__/____]   Responsável: [___________]      │
│                                                      │
│ Associar a Pleito: [Nenhum ▼]                       │
│                                                      │
│              [Cancelar] [Salvar Notificação]         │
└──────────────────────────────────────────────────────┘
```

### Linha de Ruído Promovido na Tabela

```
┌───────────────────────────────────┬─────────┬───────┬──────┬───────────┬──────────────────────┐
│ Atraso entrega documentação...    │[Contr.] │[Prazo]│[Alta]│[Promovido]│ → Pleito CASO-0042   │
└───────────────────────────────────┴─────────┴───────┴──────┴───────────┴──────────────────────┘
  ↑ bg-green-50 quando promovido
```

---

## Fluxo Completo de um Ruído

```
1. Usuário identifica sinal de alerta no campo
2. Abre "Nova Notificação" e descreve o ruído
3. Preenche causas potenciais e impacto potencial
4. Define probabilidade e categoria
5. Status inicial: "Identificado"
    ↓
6a. Acompanha evolução → Status: "Em Análise"
    ↓
7a. Situação se confirma e requer ação formal:
    → Clicar "Promover a Pleito"
    → Sistema cria Pleito automaticamente
    → Ruído muda para "Promovido"
    → Link para o pleito aparece na linha

7b. Situação não se concretiza:
    → Clicar "Descartar"
    → Ruído muda para "Descartado"
    → Permanece visível no histórico
```

---

## Integração com Outros Módulos

- **Pleitos:** a promoção cria automaticamente um `Caso` com dados herdados do ruído. O pleito criado aparece no módulo de Pleitos (`/Pleitos`) como qualquer outro pleito.
- **Registros:** um ruído pode referenciar registros existentes como evidência, mas não há vinculação direta automática — o usuário pode manualmente associar via `caso_id` após promover.
- **Dashboard:** KPIs de notificações (identificadas, em análise, promovidas) aparecem no card de resumo do Dashboard.

---

## Estado Vazio

**Sem projeto selecionado:**
- Ícone `Radio` em azul (`#26405d`)
- Título: "Nenhum Projeto Selecionado"
- Mensagem: "Selecione um projeto para visualizar as notificações contratuais."

**Com projeto mas sem notificações:**
- Tabela com header e mensagem "Nenhuma notificação registrada"
- Botão "Nova Notificação" em destaque

**Com projeto e todos os ruídos descartados/promovidos:**
- Tabela exibe todos os registros com badges de status correspondentes
- Não é considerado "vazio" — os registros históricos são mantidos e visíveis
