# Categorias de Impacto — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar tabela `categorias_impacto` por projeto com seed automático, CRUD na seção de Cadastros, e substituir todas as listas hardcoded de categorias nos módulos RDO, Registros, Mapa de Impacto e Riscos.

**Architecture:** Nova tabela Supabase `categorias_impacto` (com trigger de seed nas 9 categorias padrão ao criar projeto). Hook `useCategoriasImpacto` compartilhado serve todos os módulos consumidores. Constantes hardcoded são deletadas após a migração.

**Tech Stack:** React 18 + Vite, Supabase (PostgreSQL + MCP), TanStack React Query 5, Tailwind CSS, Radix UI / shadcn/ui

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `docs/database/supabase-migration-categorias-impacto.sql` | Criar | Migration SQL completa |
| `src/api/supabaseEntities.js` | Modificar | Adicionar `CategoriaImpacto` ao TABLE_MAP |
| `src/hooks/useCategoriasImpacto.js` | Criar | Hook compartilhado que retorna `string[]` de nomes |
| `src/components/cadastros/CategoriaImpactoList.jsx` | Criar | CRUD inline por projeto |
| `src/pages/Configuracoes/Cadastros.jsx` | Modificar | Adicionar 6ª aba |
| `src/components/rdo/RDOForm.jsx` | Modificar | Trocar `CATEGORIAS_OCORRENCIA` pelo hook |
| `src/components/pleitos/MapaRegistroImpacto.jsx` | Modificar | Trocar `IMPACT_CATEGORIES` pelo hook |
| `src/components/pleitos/RegistroForm.jsx` | Modificar | Adicionar campo `impacto_ocorrencia` com hook |
| `src/pages/RiscosMudancas/GestaoRiscos.jsx` | Modificar | Adicionar campo `areas_impacto` com hook |
| `src/lib/constants.js` | Modificar | Remover `IMPACT_CATEGORIES` |

---

## Task 1: Migration SQL

**Files:**
- Create: `docs/database/supabase-migration-categorias-impacto.sql`

- [ ] **Passo 1: Criar o arquivo de migration**

```sql
-- =====================================================
-- Migration: Cadastro de Categorias de Impacto
-- =====================================================

-- 1. Criar tabela
CREATE TABLE IF NOT EXISTS categorias_impacto (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text        NOT NULL,
  projeto_id uuid        NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- 2. RLS
ALTER TABLE categorias_impacto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios autenticados acesso total"
  ON categorias_impacto
  FOR ALL
  USING (auth.role() = 'authenticated');

-- 3. Função de seed (dispara ao criar novo projeto)
CREATE OR REPLACE FUNCTION seed_categorias_impacto()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO categorias_impacto (nome, projeto_id) VALUES
    ('Engenharia',            NEW.id),
    ('Suprimentos',           NEW.id),
    ('Liberação de Área',     NEW.id),
    ('Escopo',                NEW.id),
    ('Planejamento',          NEW.id),
    ('Gestão e Comunicação',  NEW.id),
    ('Recursos',              NEW.id),
    ('Produtividade',         NEW.id),
    ('Segurança e Qualidade', NEW.id);
  RETURN NEW;
END;
$$;

-- 4. Trigger
DROP TRIGGER IF EXISTS trigger_seed_categorias_impacto ON projetos;
CREATE TRIGGER trigger_seed_categorias_impacto
  AFTER INSERT ON projetos
  FOR EACH ROW
  EXECUTE FUNCTION seed_categorias_impacto();

-- 5. Seed para projetos já existentes (idempotente)
INSERT INTO categorias_impacto (nome, projeto_id)
SELECT
  unnest(ARRAY[
    'Engenharia', 'Suprimentos', 'Liberação de Área', 'Escopo', 'Planejamento',
    'Gestão e Comunicação', 'Recursos', 'Produtividade', 'Segurança e Qualidade'
  ]),
  id
FROM projetos
WHERE id NOT IN (SELECT DISTINCT projeto_id FROM categorias_impacto);

-- 6. Adicionar coluna areas_impacto à tabela riscos
ALTER TABLE riscos
  ADD COLUMN IF NOT EXISTS areas_impacto jsonb DEFAULT '[]'::jsonb;
```

- [ ] **Passo 2: Aplicar a migration via MCP do Supabase**

Usar a ferramenta `mcp__supabase-integrada__apply_migration` com o conteúdo SQL acima.
Ou copiar o SQL no dashboard Supabase → SQL Editor → Run.

Verificar: tabela `categorias_impacto` existe, trigger está ativo, projetos existentes têm 9 categorias cada.

- [ ] **Passo 3: Commit**

```bash
git add docs/database/supabase-migration-categorias-impacto.sql
git commit -m "feat(db): tabela categorias_impacto com seed automático por projeto"
```

---

## Task 2: Data Layer — supabaseEntities.js

**Files:**
- Modify: `src/api/supabaseEntities.js` (linha 31, após `PacoteSuprimento`)

- [ ] **Passo 1: Adicionar CategoriaImpacto ao TABLE_MAP**

Localizar a linha `PacoteSuprimento: 'pacotes_suprimento',` (linha 31) e adicionar logo após:

```js
  CategoriaImpacto: 'categorias_impacto',
```

O TABLE_MAP passa a ter:
```js
  PacoteSuprimento: 'pacotes_suprimento',
  CategoriaImpacto: 'categorias_impacto',
  Agente: 'agentes',
```

- [ ] **Passo 2: Verificar**

```bash
grep "CategoriaImpacto" src/api/supabaseEntities.js
```

Saída esperada: `CategoriaImpacto: 'categorias_impacto',`

- [ ] **Passo 3: Commit**

```bash
git add src/api/supabaseEntities.js
git commit -m "feat(entities): adicionar CategoriaImpacto ao TABLE_MAP"
```

---

## Task 3: Hook useCategoriasImpacto

**Files:**
- Create: `src/hooks/useCategoriasImpacto.js`

- [ ] **Passo 1: Criar o hook**

```js
import { useQuery } from "@tanstack/react-query";
import { useProject } from "@/lib/ProjectContext";
import { entities } from "@/api/supabaseEntities";

export function useCategoriasImpacto() {
  const { selectedProjectId } = useProject();
  return useQuery({
    queryKey: ["categorias_impacto", selectedProjectId],
    queryFn: () => entities.CategoriaImpacto.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
    select: (data) => data.map((c) => c.nome),
  });
}
```

- [ ] **Passo 2: Verificar que o arquivo foi criado corretamente**

```bash
cat src/hooks/useCategoriasImpacto.js
```

- [ ] **Passo 3: Commit**

```bash
git add src/hooks/useCategoriasImpacto.js
git commit -m "feat(hooks): useCategoriasImpacto — busca dinâmica por projeto"
```

---

## Task 4: Componente CategoriaImpactoList

**Files:**
- Create: `src/components/cadastros/CategoriaImpactoList.jsx`

> Nota: a pasta `src/components/cadastros/` não existe ainda — será criada ao salvar o arquivo.

- [ ] **Passo 1: Criar o componente**

```jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useProject } from "@/lib/ProjectContext";
import { entities } from "@/api/supabaseEntities";

export default function CategoriaImpactoList() {
  const { selectedProjectId } = useProject();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [newNome, setNewNome] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editNome, setEditNome] = useState("");

  const { data: categorias = [], isPending, isError } = useQuery({
    queryKey: ["categorias_impacto", selectedProjectId],
    queryFn: () => entities.CategoriaImpacto.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const createMut = useMutation({
    mutationFn: (nome) =>
      entities.CategoriaImpacto.create({ nome: nome.trim(), projeto_id: selectedProjectId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categorias_impacto", selectedProjectId] });
      setNewNome("");
      toast({ variant: "success", description: "Categoria adicionada." });
    },
    onError: (e) =>
      toast({ title: "Erro ao adicionar", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, nome }) =>
      entities.CategoriaImpacto.update(id, { nome: nome.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categorias_impacto", selectedProjectId] });
      setEditingId(null);
      toast({ variant: "success", description: "Categoria atualizada." });
    },
    onError: (e) =>
      toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => entities.CategoriaImpacto.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categorias_impacto", selectedProjectId] });
      toast({ variant: "success", description: "Categoria removida." });
    },
    onError: (e) =>
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" }),
  });

  const handleAdd = () => {
    if (!newNome.trim()) return;
    createMut.mutate(newNome);
  };

  const startEdit = (cat) => { setEditingId(cat.id); setEditNome(cat.nome); };
  const cancelEdit = () => { setEditingId(null); setEditNome(""); };
  const handleUpdate = () => {
    if (!editNome.trim()) return;
    updateMut.mutate({ id: editingId, nome: editNome });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Categorias de Impacto</p>
          <p className="text-xs text-muted-foreground">
            {categorias.length} categoria{categorias.length !== 1 ? "s" : ""} cadastrada{categorias.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Nome da categoria..."
          value={newNome}
          onChange={(e) => setNewNome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="max-w-sm text-sm"
        />
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!newNome.trim() || createMut.isPending}
          className="gap-1.5 text-xs"
        >
          <Plus className="w-4 h-4" /> Adicionar
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {isPending && (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
        )}
        {isError && (
          <div className="p-8 text-center text-sm text-destructive">
            Erro ao carregar categorias.
          </div>
        )}
        {!isPending && !isError && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Nome
                </th>
                <th className="px-5 py-3 w-28" />
              </tr>
            </thead>
            <tbody>
              {categorias.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    Nenhuma categoria de impacto cadastrada para este projeto.
                  </td>
                </tr>
              )}
              {categorias.map((cat, i) => (
                <tr
                  key={cat.id}
                  className={`border-b border-border/50 transition-colors ${
                    i % 2 === 0 ? "bg-card" : "bg-muted/20"
                  }`}
                >
                  <td className="px-5 py-3">
                    {editingId === cat.id ? (
                      <Input
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdate();
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="max-w-xs text-sm h-8"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm text-foreground">{cat.nome}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {editingId === cat.id ? (
                        <>
                          <button
                            onClick={handleUpdate}
                            disabled={!editNome.trim() || updateMut.isPending}
                            className="p-1.5 rounded text-green-600 hover:bg-green-50 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 rounded text-muted-foreground hover:bg-muted transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(cat)}
                            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteMut.mutate(cat.id)}
                            disabled={deleteMut.isPending}
                            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Passo 2: Commit**

```bash
git add src/components/cadastros/CategoriaImpactoList.jsx
git commit -m "feat(cadastros): componente CategoriaImpactoList com CRUD inline"
```

---

## Task 5: Adicionar aba no Cadastros.jsx

**Files:**
- Modify: `src/pages/Configuracoes/Cadastros.jsx`

- [ ] **Passo 1: Adicionar import do componente**

Localizar os imports existentes (linhas 1-8) e adicionar após o import de `Pacotes`:

```js
import CategoriaImpactoList from "@/components/cadastros/CategoriaImpactoList";
```

- [ ] **Passo 2: Adicionar item ao array TABS**

Localizar o array `TABS` e adicionar o 6º item:

```js
const TABS = [
  { key: "unidades",     label: "Unidades de Medida" },
  { key: "disciplinas",  label: "Disciplinas" },
  { key: "funcoes",      label: "Funções" },
  { key: "equipamentos", label: "Equipamentos" },
  { key: "pacotes",      label: "Pacotes" },
  { key: "categorias",   label: "Categorias de Impacto" },
];
```

- [ ] **Passo 3: Adicionar render da aba no JSX**

Localizar o bloco de renderização condicional e adicionar após `{activeTab === "pacotes" && <Pacotes asTab />}`:

```jsx
{activeTab === "categorias" && <CategoriaImpactoList />}
```

- [ ] **Passo 4: Verificar manualmente**

Abrir a aplicação, navegar para Configurações → Cadastros, confirmar que a aba "Categorias de Impacto" aparece e lista as 9 categorias do projeto ativo.

- [ ] **Passo 5: Commit**

```bash
git add src/pages/Configuracoes/Cadastros.jsx
git commit -m "feat(cadastros): aba Categorias de Impacto em Configurações"
```

---

## Task 6: RDOForm.jsx — substituir CATEGORIAS_OCORRENCIA

**Files:**
- Modify: `src/components/rdo/RDOForm.jsx` (linhas 1, 15, 505-510)

- [ ] **Passo 1: Adicionar import do hook**

Localizar a linha de imports no topo do arquivo. Após a linha `import { VincularAtividadesDialog } from "./VincularAtividadesDialog";`, adicionar:

```js
import { useCategoriasImpacto } from "@/hooks/useCategoriasImpacto";
```

- [ ] **Passo 2: Remover a constante hardcoded**

Remover a linha 15 inteira:

```js
const CATEGORIAS_OCORRENCIA = ["Engenharia", "Suprimentos", "Planejamento", "Construção", "Contratos", "Qualidade/SSMA"];
```

- [ ] **Passo 3: Chamar o hook dentro do componente**

Localizar a abertura da função componente principal de RDOForm (procurar `export default function RDOForm` ou a função que renderiza o form). Adicionar logo após as declarações de `useState` existentes:

```js
const { data: categoriasNomes = [], isPending: categoriasPending } = useCategoriasImpacto();
```

- [ ] **Passo 4: Substituir uso de CATEGORIAS_OCORRENCIA no JSX**

Localizar o bloco (em torno da linha 505, dentro do map de ocorrências):

```jsx
{CATEGORIAS_OCORRENCIA.map(cat => (
  <button key={cat} type="button" onClick={() => toggleOcorrCategoria(i, cat)}
    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${(oc.categorias || []).includes(cat) ? "border-transparent bg-ocre text-white" : "border-border text-muted-foreground bg-background"}`}>
    {cat}
  </button>
))}
```

Substituir por:

```jsx
{categoriasPending ? (
  <span className="text-xs text-muted-foreground">Carregando categorias...</span>
) : (
  categoriasNomes.map(cat => (
    <button key={cat} type="button" onClick={() => toggleOcorrCategoria(i, cat)}
      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${(oc.categorias || []).includes(cat) ? "border-transparent bg-ocre text-white" : "border-border text-muted-foreground bg-background"}`}>
      {cat}
    </button>
  ))
)}
```

- [ ] **Passo 5: Verificar no browser**

Abrir um RDO, adicionar uma ocorrência, confirmar que as pills de categoria de impacto aparecem com os nomes do projeto e funcionam (toggle ativa/desativa).

- [ ] **Passo 6: Commit**

```bash
git add src/components/rdo/RDOForm.jsx
git commit -m "feat(rdo): categorias de impacto dinâmicas via useCategoriasImpacto"
```

---

## Task 7: MapaRegistroImpacto.jsx — substituir IMPACT_CATEGORIES

**Files:**
- Modify: `src/components/pleitos/MapaRegistroImpacto.jsx` (linha 11 e memos internos)

- [ ] **Passo 1: Remover import de constants**

Localizar e remover a linha:

```js
import { IMPACT_CATEGORIES as CATEGORIES } from "@/lib/constants";
```

- [ ] **Passo 2: Adicionar import do hook**

No mesmo local, adicionar:

```js
import { useCategoriasImpacto } from "@/hooks/useCategoriasImpacto";
```

- [ ] **Passo 3: Chamar o hook no corpo do componente**

Localizar `export default function MapaRegistroImpacto({ incidentes })` e adicionar logo após a abertura da função (antes dos `useState` e `useMemo`):

```js
const { data: categorias = [] } = useCategoriasImpacto();
```

- [ ] **Passo 4: Substituir todas as ocorrências de CATEGORIES por categorias**

Fazer busca-e-substituição no arquivo: toda ocorrência de `CATEGORIES` passa a ser `categorias`.

Verificar: `grep -n "CATEGORIES" src/components/pleitos/MapaRegistroImpacto.jsx` deve retornar vazio.

- [ ] **Passo 5: Atualizar dependências dos useMemos**

Nos `useMemo` que antes dependiam de `CATEGORIES` (agora `categorias`), verificar que `categorias` está incluído no array de dependências. Ex.:

```js
const heatmapData = useMemo(() => {
  // ... usa categorias
}, [categorias, todasOcorrencias, visibleWeeks, responsabilidadeFiltro]);
```

- [ ] **Passo 6: Verificar no browser**

Navegar para o Mapa de Impacto, confirmar que o heatmap e os gráficos renderizam com as categorias do projeto (9 linhas correspondendo às categorias dinâmicas).

- [ ] **Passo 7: Commit**

```bash
git add src/components/pleitos/MapaRegistroImpacto.jsx
git commit -m "feat(mapa-impacto): categorias dinâmicas via useCategoriasImpacto"
```

---

## Task 8: RegistroForm.jsx — adicionar campo impacto_ocorrencia

**Files:**
- Modify: `src/components/pleitos/RegistroForm.jsx` (linhas 1, 18-29, ~188)

- [ ] **Passo 1: Adicionar import do hook**

Localizar os imports no topo do arquivo. Após a linha do import de `supabase`, adicionar:

```js
import { useCategoriasImpacto } from "@/hooks/useCategoriasImpacto";
```

- [ ] **Passo 2: Adicionar impacto_ocorrencia ao estado inicial**

Localizar o `useState` do `formData` (linha ~18). Adicionar `impacto_ocorrencia` ao objeto inicial:

```js
const [formData, setFormData] = useState({
  tipo_registro: incidente?.tipo_registro || "Ata de Reunião",
  data_hora: toDateInput(incidente?.data_hora) || toDateInput(new Date()),
  responsavel_registro: incidente?.responsavel_registro || "",
  descricao: incidente?.descricao || "",
  impacto_preliminar: incidente?.impacto_preliminar || "",
  impacto_ocorrencia: Array.isArray(incidente?.impacto_ocorrencia) ? incidente.impacto_ocorrencia : [],
  probabilidade: incidente?.probabilidade || "Média",
  gravidade: incidente?.gravidade || "Média",
  status: incidente?.status || "Registrado",
  pleito_id: incidente?.pleito_id || null,
  responsabilidade: incidente?.responsabilidade || "",
});
```

- [ ] **Passo 3: Chamar o hook e criar função de toggle**

Após as declarações de `useState` existentes no componente (antes do `return`), adicionar:

```js
const { data: categoriasNomes = [], isPending: categoriasPending } = useCategoriasImpacto();

const toggleImpactoOcorrencia = (cat) =>
  setFormData(f => ({
    ...f,
    impacto_ocorrencia: f.impacto_ocorrencia.includes(cat)
      ? f.impacto_ocorrencia.filter(c => c !== cat)
      : [...f.impacto_ocorrencia, cat],
  }));
```

- [ ] **Passo 4: Adicionar o campo de seleção no JSX**

Localizar o bloco `<div className="space-y-2">` com o `Textarea` de `impacto_preliminar` (linha ~184). Após o fechamento desse `<div>`, inserir:

```jsx
<div className="space-y-2">
  <Label>Áreas de Impacto</Label>
  {categoriasPending ? (
    <p className="text-xs text-muted-foreground">Carregando categorias...</p>
  ) : (
    <div className="flex flex-wrap gap-2">
      {categoriasNomes.map(cat => (
        <button
          key={cat}
          type="button"
          onClick={() => toggleImpactoOcorrencia(cat)}
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
            formData.impacto_ocorrencia.includes(cat)
              ? "border-transparent bg-primary text-primary-foreground"
              : "border-border text-muted-foreground bg-background hover:border-primary/50"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )}
</div>
```

- [ ] **Passo 5: Verificar que o submit inclui impacto_ocorrencia**

O `formData` já é passado inteiro ao `onSubmit`. Confirmar que `formData.impacto_ocorrencia` está incluído quando o form é submetido: `grep "onSubmit" src/components/pleitos/RegistroForm.jsx | head -5`.

- [ ] **Passo 6: Verificar no browser**

Abrir o formulário de registro, confirmar que as pills de "Áreas de Impacto" aparecem e que ao salvar o registro o campo `impacto_ocorrencia` é gravado no banco (abrir o Supabase dashboard e checar a linha).

- [ ] **Passo 7: Commit**

```bash
git add src/components/pleitos/RegistroForm.jsx
git commit -m "feat(registros): campo impacto_ocorrencia com categorias dinâmicas"
```

---

## Task 9: GestaoRiscos.jsx — adicionar campo areas_impacto

**Files:**
- Modify: `src/pages/RiscosMudancas/GestaoRiscos.jsx` (linhas 26, 85-90, 196-210, ~608)

- [ ] **Passo 1: Adicionar import do hook**

Localizar os imports no topo do arquivo e adicionar:

```js
import { useCategoriasImpacto } from "@/hooks/useCategoriasImpacto";
```

- [ ] **Passo 2: Adicionar areas_impacto ao EMPTY_FORM**

Localizar `const EMPTY_FORM` (linha ~85) e adicionar o campo:

```js
const EMPTY_FORM = {
  codigo: "", descricao: "", categoria: "", probabilidade: "Média", impacto: "Médio",
  status: "Ativo", responsavel: "",
  impactos: [],
  areas_impacto: [],
  escopo_texto: "", prazo_dias: "", valor_impacto: "",
};
```

- [ ] **Passo 3: Chamar o hook no componente**

Dentro de `export default function GestaoRiscos()`, após a query de riscos (linha ~121), adicionar:

```js
const { data: categoriasNomes = [], isPending: categoriasPending } = useCategoriasImpacto();
```

- [ ] **Passo 4: Adicionar toggle function**

Após `const toggleImpacto` (linha ~153), adicionar:

```js
const toggleAreaImpacto = (area) =>
  setForm(f => ({
    ...f,
    areas_impacto: f.areas_impacto.includes(area)
      ? f.areas_impacto.filter(a => a !== area)
      : [...f.areas_impacto, area],
  }));
```

- [ ] **Passo 5: Adicionar areas_impacto ao handleEdit**

Localizar `const handleEdit` (linha ~196) e adicionar `areas_impacto` ao objeto passado para `setForm`:

```js
const handleEdit = (risco) => {
  setEditing(risco);
  setForm({
    codigo: risco.codigo || "",
    descricao: risco.descricao || "",
    categoria: risco.categoria || "",
    probabilidade: risco.probabilidade || "Média",
    impacto: risco.impacto || "Médio",
    status: risco.status || "Ativo",
    responsavel: risco.responsavel || "",
    impactos: Array.isArray(risco.impactos) ? risco.impactos : [],
    areas_impacto: Array.isArray(risco.areas_impacto) ? risco.areas_impacto : [],
    escopo_texto:  risco.escopo_texto  || "",
    prazo_dias:    risco.prazo_dias    ?? "",
    valor_impacto: risco.valor_impacto ?? "",
  });
  setShowForm(true);
};
```

- [ ] **Passo 6: Adicionar campo de seleção no JSX do form**

Localizar a seção `<SectionDivider label="Impactos no Projeto" />` (linha ~609). Antes do `<div className="space-y-2">` de "Dimensões de Impacto", inserir o novo bloco:

```jsx
<SectionDivider label="Impactos no Projeto" />
<div className="space-y-3">
  <div className="space-y-2">
    <Label>Áreas de Impacto</Label>
    {categoriasPending ? (
      <p className="text-xs text-muted-foreground">Carregando categorias...</p>
    ) : (
      <div className="flex flex-wrap gap-2">
        {categoriasNomes.map(area => (
          <button
            key={area}
            type="button"
            onClick={() => toggleAreaImpacto(area)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              form.areas_impacto.includes(area)
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border text-muted-foreground bg-background hover:border-primary/50"
            }`}
          >
            {area}
          </button>
        ))}
      </div>
    )}
  </div>
  <div className="space-y-2">
    <Label>Dimensões de Impacto</Label>
    {/* ... bloco IMPACTO_DIMS existente permanece inalterado ... */}
```

> Atenção: não remover o bloco de "Dimensões de Impacto" existente (IMPACTO_DIMS com Escopo/Prazo/Valor). Apenas adicionar o novo bloco ANTES dele.

- [ ] **Passo 7: Verificar que areas_impacto vai no payload**

`handleSubmit` usa `...form` no payload, então `areas_impacto` já é incluído automaticamente. Confirmar com:

```bash
grep "areas_impacto" src/pages/RiscosMudancas/GestaoRiscos.jsx
```

Deve retornar ao menos 4 ocorrências (EMPTY_FORM, toggleAreaImpacto, handleEdit, JSX).

- [ ] **Passo 8: Verificar no browser**

Abrir Gestão de Riscos, criar ou editar um risco, confirmar que as pills de "Áreas de Impacto" aparecem, são selecionáveis e que ao salvar o valor persiste no banco.

- [ ] **Passo 9: Commit**

```bash
git add src/pages/RiscosMudancas/GestaoRiscos.jsx
git commit -m "feat(riscos): campo areas_impacto com categorias dinâmicas por projeto"
```

---

## Task 10: Limpeza — remover IMPACT_CATEGORIES de constants.js

**Files:**
- Modify: `src/lib/constants.js`

- [ ] **Passo 1: Remover a constante do arquivo**

Localizar e remover do `src/lib/constants.js`:

```js
export const IMPACT_CATEGORIES = [
  "Engenharia", "Suprimentos", "Liberação de Área",
  "Escopo", "Planejamento", "Gestão & Comunicação",
  "Recursos", "Produtividade", "Segurança", "Qualidade"
];
```

Se o arquivo ficar vazio ou só com esse export, deletar o arquivo inteiro.

- [ ] **Passo 2: Verificar que não há mais imports de IMPACT_CATEGORIES**

```bash
grep -rn "IMPACT_CATEGORIES" src/
```

Saída esperada: nenhuma linha.

- [ ] **Passo 3: Verificar que não há mais import de constants.js**

```bash
grep -rn "from.*constants" src/
```

Se nenhum arquivo importar `constants.js`, ele pode ser deletado.

- [ ] **Passo 4: Build de verificação**

```bash
npm run build 2>&1 | tail -20
```

Saída esperada: build concluindo sem erros de import não-encontrado.

- [ ] **Passo 5: Commit final**

```bash
git add src/lib/constants.js
git commit -m "refactor: remover IMPACT_CATEGORIES hardcoded — substituído por categorias dinâmicas"
```

---

## Verificação Final

- [ ] As 9 categorias aparecem na aba "Categorias de Impacto" em Configurações → Cadastros
- [ ] É possível adicionar, editar e remover categorias pelo CRUD inline
- [ ] No RDO, as pills de categoria na seção de Ocorrências refletem as categorias do projeto
- [ ] No Mapa de Impacto, as linhas do heatmap correspondem às 9 categorias dinâmicas
- [ ] No Registro, as pills de "Áreas de Impacto" aparecem e salvam `impacto_ocorrencia`
- [ ] No Risco, as pills de "Áreas de Impacto" aparecem e salvam `areas_impacto`
- [ ] `grep -rn "IMPACT_CATEGORIES\|CATEGORIAS_OCORRENCIA" src/` retorna vazio
- [ ] `npm run build` sem erros
