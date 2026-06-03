# Spec: Cadastro de Categorias de Impacto

**Data:** 2026-06-03
**Status:** Aprovado

---

## Problema

As categorias de impacto usadas em RDOs, Registros, Mapa de Impacto e Riscos estão hardcoded em diferentes arquivos do frontend (`constants.js`, `RDOForm.jsx`, `riscosUtils.js`), com listas inconsistentes entre si. Não há como o usuário customizar essas categorias por projeto.

---

## Solução

Criar uma tabela `categorias_impacto` no Supabase (por projeto), um CRUD na seção de Cadastros, e substituir todas as listas hardcoded por queries dinâmicas ao banco.

---

## Categorias Padrão (seed)

As 9 categorias padrão inseridas automaticamente ao criar um novo projeto:

1. Engenharia
2. Suprimentos
3. Liberação de Área
4. Escopo
5. Planejamento
6. Gestão e Comunicação
7. Recursos
8. Produtividade
9. Segurança e Qualidade

---

## 1. Banco de Dados

### Tabela `categorias_impacto`

```sql
CREATE TABLE categorias_impacto (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text NOT NULL,
  projeto_id uuid NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  criado_em  timestamptz DEFAULT now()
);

ALTER TABLE categorias_impacto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios autenticados acesso total"
  ON categorias_impacto
  FOR ALL
  USING (auth.role() = 'authenticated');
```

### Seed automático via trigger

```sql
CREATE OR REPLACE FUNCTION seed_categorias_impacto()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO categorias_impacto (nome, projeto_id) VALUES
    ('Engenharia',           NEW.id),
    ('Suprimentos',          NEW.id),
    ('Liberação de Área',    NEW.id),
    ('Escopo',               NEW.id),
    ('Planejamento',         NEW.id),
    ('Gestão e Comunicação', NEW.id),
    ('Recursos',             NEW.id),
    ('Produtividade',        NEW.id),
    ('Segurança e Qualidade',NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_seed_categorias_impacto
  AFTER INSERT ON projetos
  FOR EACH ROW
  EXECUTE FUNCTION seed_categorias_impacto();
```

---

## 2. Data Layer

**Arquivo:** `src/api/supabaseEntities.js`

Adicionar a entidade `categorias_impacto` ao `TABLE_MAP` usando `createEntity("categorias_impacto")`. Isso expõe os métodos `list`, `filter`, `create`, `update` e `delete` seguindo o padrão já existente.

---

## 3. CRUD no Cadastros

**Arquivo:** `src/pages/Configuracoes/Cadastros.jsx`

- Adicionar 6ª aba: **"Categorias de Impacto"**
- Conteúdo da aba: componente `CategoriaImpactoList`

**Novo arquivo:** `src/components/cadastros/CategoriaImpactoList.jsx`

### Comportamento

- Query: `entities.categorias_impacto.filter({ projeto_id: selectedProjectId })`
- `queryKey`: `["categorias_impacto", selectedProjectId]`
- `enabled`: `!!selectedProjectId`
- **Adicionar:** formulário inline com campo `nome` + botão "Adicionar"
- **Editar:** nome editável inline por item
- **Remover:** botão de remoção por item com confirmação
- **Loading state:** skeleton
- **Empty state:** "Nenhuma categoria de impacto cadastrada para este projeto."
- **Error state:** mensagem de erro padrão do projeto

Sem modal — edição e criação inline, padrão dos outros cadastros.

---

## 4. Substituição dos Hardcodes

### Hook compartilhado

Criar `src/hooks/useCategoriasImpacto.js`:

```js
import { useQuery } from "@tanstack/react-query";
import { useProject } from "@/lib/ProjectContext";
import { entities } from "@/api/supabaseEntities";

export function useCategoriasImpacto() {
  const { selectedProjectId } = useProject();
  return useQuery({
    queryKey: ["categorias_impacto", selectedProjectId],
    queryFn: () => entities.categorias_impacto.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
    select: (data) => data.map((c) => c.nome),
  });
}
```

### Módulos que consomem o hook

| Arquivo | Mudança |
|---------|---------|
| `src/lib/constants.js` | Remover `IMPACT_CATEGORIES` |
| `src/components/rdo/RDOForm.jsx` | Remover `CATEGORIAS_OCORRENCIA`; usar `useCategoriasImpacto()` |
| `src/components/pleitos/MapaRegistroImpacto.jsx` | Remover import de `IMPACT_CATEGORIES`; usar `useCategoriasImpacto()` |
| `src/components/pleitos/RegistroForm.jsx` | Usar `useCategoriasImpacto()` no campo de impacto |
| `src/utils/riscosUtils.js` | Remover uso de `CATEGORIAS_RISCO` para impacto; manter apenas categorias de tipo de risco |

> **Nota:** `CATEGORIAS_RISCO` em `riscosUtils.js` categoriza o *tipo* de risco (Técnico, Financeiro, Prazo…), não o impacto — permanece separada e inalterada. Somente o campo de *impacto* nos riscos passa a usar o hook.

---

## 5. Comportamento nos Selects/Checkboxes

Enquanto a query carrega, selects e checkboxes ficam desabilitados (ou com skeleton). Após resolver, renderizam normalmente. Padrão já usado no projeto.

---

## Fora de Escopo

- Reordenação de categorias por drag-and-drop
- Ativar/desativar categorias (sem flag `ativo`)
- Cor ou descrição por categoria
- Categorias globais compartilhadas entre projetos
