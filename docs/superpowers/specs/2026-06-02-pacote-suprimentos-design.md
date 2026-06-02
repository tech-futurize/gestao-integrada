# Design — Campo Pacote + Ajustes Mapa de Suprimentos

**Data:** 2026-06-02  
**Status:** Aprovado

---

## Escopo

Ajustes no Mapa de Suprimentos (MAS):
1. Adicionar campo "Pacote" (select) na tabela e no formulário
2. Tela de Cadastros: nova aba para gerenciar pacotes
3. Compactar coluna Status na tabela
4. Exibir unidade de medida ao lado (inline) da quantidade
5. Remover botão Visualizar das ações de linha

---

## Banco de Dados

### Nova tabela `pacotes_suprimento`
```sql
CREATE TABLE pacotes_suprimento (
  id    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome  TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE itens_mas
  ADD COLUMN pacote_id UUID REFERENCES pacotes_suprimento(id) ON DELETE SET NULL;
```

**Escopo:** global (sem `projeto_id`), seguindo padrão das demais entidades de Cadastros (UnidadeMedida, Disciplina, Funcao).

---

## Data Layer (`supabaseEntities.js`)

Adicionar entrada:
```js
PacoteSuprimento: 'pacotes_suprimento',
```

---

## Cadastros — Nova Aba "Pacotes"

**Arquivo:** `src/pages/Configuracoes/Pacotes.jsx`

Segue exatamente o padrão de `UnidadesMedida.jsx`:
- Lista com toggle ativo/inativo
- CRUD: criar, editar, excluir (com confirmação)
- Campo único: `nome` (texto, obrigatório)
- QueryKey: `["pacotes_suprimento"]`

**`Cadastros.jsx`:** adicionar aba `{ key: "pacotes", label: "Pacotes" }` e renderizar `<Pacotes asTab />`.

---

## Tabela `MapaSuprimentos.jsx`

| Coluna | Mudança |
|--------|---------|
| **Pacote** | Nova coluna após "Descrição"; exibe `nome` via lookup em query separada |
| **Qtd / Und** | Inline na mesma linha: `{quantidade} {sigla}` — remover `flex-col` |
| **Status** | `min-w-24` → `min-w-16` para compactar |
| **Ações** | Remover `onView`; eliminar `viewItem` state e `<DetailDialog>` |

Adicionar `useQuery` para `PacoteSuprimento.list()` + map `id → nome` para lookup.

---

## Formulário `ItemMASForm.jsx`

- Adicionar `pacote_id: item?.pacote_id || ""` ao estado inicial
- Campo Select "Pacote" posicionado imediatamente após "Descrição do Material"
- Query: `PacoteSuprimento.list()` filtrando `ativo !== false`
- Campo **opcional** (sem asterisco)
- Incluir `pacote_id: form.pacote_id || null` no payload de save

---

## Ordem de implementação

1. Migration SQL (Supabase MCP)
2. `supabaseEntities.js` — adicionar entidade
3. `Pacotes.jsx` — novo componente de cadastro
4. `Cadastros.jsx` — nova aba
5. `MapaSuprimentos.jsx` — ajustes de tabela
6. `ItemMASForm.jsx` — campo pacote_id
7. Commit
