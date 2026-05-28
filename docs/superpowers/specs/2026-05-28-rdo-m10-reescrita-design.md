# Spec: M10 RDO — Reescrita Completa (RDO-1 a RDO-4)

**Data:** 2026-05-28  
**Módulo:** Admin Contratual → RDOs  
**Arquivo principal:** `src/components/rdo/RDOModule.jsx`

---

## Contexto

O `RDOModule.jsx` atual usa a entidade `Registro` (tabela `registros`), que contém apenas colunas genéricas. O DATABASE.md já especifica uma tabela dedicada `rdo` que nunca foi criada no banco. Todas as 4 tasks (RDO-1 a RDO-4) se resolvem numa única reescrita do módulo com migração de banco.

---

## 1. Banco de Dados

### 1.1 Migration — criar tabela `rdo`

```sql
CREATE TABLE IF NOT EXISTS rdo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  numero TEXT,
  data DATE NOT NULL,
  area TEXT,
  disciplinas JSONB DEFAULT '[]',
  clima JSONB DEFAULT '{}',
  mao_de_obra JSONB DEFAULT '[]',
  equipamentos JSONB DEFAULT '[]',
  atividades_vinculadas JSONB DEFAULT '[]',
  ocorrencias JSONB DEFAULT '[]',
  evidencias JSONB DEFAULT '[]',
  -- impactos omitido: categorias de impacto vivem dentro de cada item de ocorrencias.categorias
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE rdo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated full access" ON rdo FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX ON rdo (projeto_id, data DESC);
```

### 1.2 Estrutura dos campos JSONB

**`clima`:**
```json
{
  "manha":  { "ativo": true,  "condicao": "Sol",    "praticabilidade": "Praticável"   },
  "tarde":  { "ativo": true,  "condicao": "Chuva",  "praticabilidade": "Impraticável" },
  "noite":  { "ativo": false, "condicao": "",        "praticabilidade": ""             }
}
```
Condição e praticabilidade são **independentes** — não há vinculação automática entre eles.

**`mao_de_obra`:**
```json
[{ "nome": "João Silva", "funcao": "Soldador", "quantidade": 3 }]
```

**`equipamentos`:**
```json
[{ "nome": "Guindaste", "identificacao": "TAG-001", "quantidade": 1 }]
```

**`atividades_vinculadas`:** array de UUIDs de `tarefas_cronograma`.

**`ocorrencias`:**
```json
[{
  "id": "<uuid-local>",
  "descricao": "Chuva intensa interrompeu serviços",
  "responsabilidade": "Contratante",
  "categorias": ["Planejamento", "Contratos"],
  "pleito_id": null,
  "atividades_vinculadas": ["<uuid-tarefa>"]
}]
```

**`evidencias`:**
```json
[{ "nome": "foto1.jpg", "url": "https://...", "tipo": "image/jpeg", "tamanho": 102400 }]
```

### 1.3 Entidade em supabaseEntities.js

Adicionar `Rdo: 'rdo'` ao `TABLE_MAP` e expor via `entities.Rdo`.

---

## 2. RDO-1 — Remoções simples

| Item | Antes | Depois |
|------|-------|--------|
| Botão "Anexar à Medição" | No footer do `RDODetail` | Removido |
| Label do campo Área | `Área / KM` | `Área` |
| Placeholder do campo Área | `Área A / KM 12+500` | `Área A` |
| Campo Data | `datetime-local` (Data / Hora) | `date` (apenas Data) — alinhado com coluna `data DATE` da nova tabela |

---

## 3. RDO-2 — Clima desacoplado + MO/Equipamentos padronizados

### 3.1 Condições Climáticas — dois controles independentes por turno

Cada turno (Manhã / Tarde / Noite) exibe, quando ativo:

**Grupo 1 — Condição:** botões visuais com ícone  
`Sol` (☀️ âmbar) · `Nublado` (☁️ cinza) · `Chuva` (🌧 azul)

**Grupo 2 — Praticabilidade:** toggle separado  
`Praticável` (✅ verde) · `Impraticável` (❌ vermelho)

Nenhum clique no grupo 1 altera o grupo 2, e vice-versa.

### 3.2 Mão de Obra — nova estrutura de linha

```
[ Nome (texto livre) ] [ Função (select) ] [ Qtd ]  [×]
```
- `nome`: input texto, placeholder "Nome ou empresa"
- `funcao`: select com CARGOS existentes
- `quantidade`: number input, mín 1

### 3.3 Equipamentos — nova estrutura de linha

```
[ Nome (select) ] [ Identificação/TAG (texto livre) ] [ Qtd ]  [×]
```
- `nome`: select com EQUIPAMENTOS_LISTA existentes
- `identificacao`: input texto, placeholder "TAG ou identificação"
- `quantidade`: number input, mín 1

> Campo "HM" (horas de máquina) é removido — substituído por `identificacao`.

---

## 4. RDO-3 — "Vincular Atividades" com pop-up

### 4.1 Componente reutilizável `VincularAtividadesDialog`

**Arquivo:** `src/components/rdo/VincularAtividadesDialog.jsx`

**Props:**
```js
{
  open: bool,
  onClose: fn,
  onConfirm: fn(selectedIds: string[]),
  tarefas: TarefaCronograma[],
  selectedIds: string[],
}
```

**Layout do dialog (max-w-2xl):**
- Header: "Vincular Atividades ao Cronograma"
- Filtro de busca por nome da tarefa (input texto)
- Filtro por disciplina (select com DISCIPLINAS)
- Lista de tarefas com checkbox — exibe: nome da tarefa + disciplina + período (início → fim)
- Footer: `X selecionada(s)` · Botão Cancelar · Botão "Confirmar Vínculo"

### 4.2 Pontos de uso

| Painel | Localização | Comportamento |
|--------|-------------|---------------|
| Atividades Produzidas | Substituir o `<select>` atual por botão "Vincular Atividades" | Salva em `atividades_vinculadas` (raiz do RDO) |
| Ocorrências (por item) | Botão dentro de cada ocorrência | Salva em `ocorrencia.atividades_vinculadas` |
| Impactos (painel) | Botão no painel de Impactos | Salva em `atividades_vinculadas` (raiz, reutiliza) |

Ao confirmar, exibe badges com os nomes das tarefas selecionadas e botão "×" para remover cada uma.

### 4.3 Ocorrências como array de itens

Substituir o textarea único por:
- Botão "**+ Adicionar Ocorrência**" cria um novo item com campos:
  - Descrição (textarea)
  - Responsabilidade (select: Contratada / Contratante)
  - Categorias de impacto (chips: CATEGORIAS_OCORRENCIA)
  - Vincular a Pleito (select)
  - Botão "Vincular Atividades" → `VincularAtividadesDialog`
- Cada item tem botão "×" para remover
- Exibição em `RDODetail`: lista de cards por ocorrência

---

## 5. RDO-4 — Evidências + Importação em massa

### 5.1 Upload de evidências

- Input `<input type="file" multiple accept="image/*,application/pdf">` no painel Evidências
- Ao selecionar arquivo: upload para Supabase Storage bucket `rdo-evidencias`
  - Bucket `rdo-evidencias` deve ser criado no Supabase (parte da migration) com RLS público ou signed URLs
  - Path: `{projeto_id}/{rdo_id}/{timestamp}_{nome_arquivo}`
- Feedback visual: spinner por arquivo + thumbnail para imagens / ícone para PDF
- Lista de evidências anexadas: nome + botão "×" (chama `storage.remove` + remove do array)
- Upload ocorre ao salvar o RDO (não imediato): arquivos ficam em estado `pendente` até o save

> **Estratégia de upload:** os arquivos são mantidos em estado local (`File[]`) até o usuário clicar em "Salvar". No `handleSave`, primeiro faz upload de todos os pendentes, depois salva o registro com as URLs.

### 5.2 Importação em massa

Botão "Importar" na barra de filtros do módulo, abre `ImportExportDialog`.

**Colunas mapeadas:**
```js
[
  { key: "numero",    label: "Nº RDO",     type: "string", required: true  },
  { key: "data",      label: "Data",        type: "date",   required: true  },
  { key: "area",      label: "Área",        type: "string", required: false },
]
```

`onImport` recebe uma linha convertida e chama `entities.Rdo.create({ ...row, projeto_id })`.

---

## 6. Arquitetura de Componentes

```
src/components/rdo/
  RDOModule.jsx              ← módulo principal (lista + filtros)
  RDOForm.jsx                ← formulário de criação/edição (extraído)
  RDODetail.jsx              ← modal de visualização (extraído)
  VincularAtividadesDialog.jsx  ← novo, reutilizável
```

O arquivo atual `RDOModule.jsx` tem ~630 linhas com tudo inline. A reescrita extrai `RDOForm` e `RDODetail` para arquivos próprios, mantendo `RDOModule.jsx` como orquestrador de estado (lista, filtros, modals).

---

## 7. Mudanças em supabaseEntities.js

```js
// Adicionar ao TABLE_MAP:
Rdo: 'rdo',
```

O shim de compatibilidade expõe automaticamente `entities.Rdo.list/filter/create/update/delete`.

---

## 8. Fora do escopo

- Migração de dados existentes de `registros` para `rdo` — não há dados RDO reais no banco atual
- RDOsList em `src/components/pleitos/RDOsList.jsx` — será atualizado para usar `entities.Rdo`
- Impressão/PDF — mantém o `window.print()` existente sem alterações
