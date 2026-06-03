# Formulários Digitais — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o módulo completo de Formulários Digitais — construtor visual de formulários (form builder), preenchimento por projeto e listagem de respostas coletadas.

**Architecture:** Dois pontos de acesso: (1) Cadastro/construção em Configurações → Cadastros → aba "Formulários" (definições globais, sem projeto_id), e (2) Módulo lateral "Formulários Digitais" abaixo de Riscos (preenchimento + respostas por projeto). Definição do formulário armazenada como JSONB; respostas como JSONB `{ fieldId: value }`. Sem versionamento.

**Tech Stack:** React 18 + Vite, Tailwind CSS, Supabase JSONB, @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities (reordenação de itens no builder), React Query (sem react-hook-form nem Zod — estado controlado por useState + validação manual).

---

## Mapa de Arquivos

**Novos:**
- `docs/database/supabase-migration-m20-formularios-digitais.sql`
- `src/lib/formularios/formSchema.js`
- `src/lib/formularios/formValidation.js`
- `src/components/cadastros/FormulariosCadastroList.jsx`
- `src/pages/Configuracoes/FormularioBuilder.jsx`
- `src/components/formularios/builder/FieldTypePicker.jsx`
- `src/components/formularios/builder/FieldPropertiesEditor.jsx`
- `src/components/formularios/builder/SortableFieldCard.jsx`
- `src/components/formularios/builder/FieldCardEditor.jsx`
- `src/components/formularios/builder/FormBuilderCanvas.jsx`
- `src/components/formularios/builder/FormBuilderHeader.jsx`
- `src/components/formularios/renderer/FormRenderer.jsx`
- `src/components/formularios/renderer/FieldInput.jsx`
- `src/components/formularios/renderer/RespostaView.jsx`
- `src/pages/Formularios/ListaFormularios.jsx`
- `src/pages/Formularios/ResponderFormulario.jsx`
- `src/pages/Formularios/RespostasFormulario.jsx`

**Modificados:**
- `src/api/supabaseEntities.js` — TABLE_MAP
- `src/lib/navigationConfig.js` — novo grupo
- `src/lib/permissionsConfig.js` — novo módulo
- `src/App.jsx` — lazy imports + rotas
- `src/pages/Configuracoes/Cadastros.jsx` — nova aba
- `package.json` — dnd-kit

---

## Task 1: Migration SQL + Banco de Dados

**Files:**
- Create: `docs/database/supabase-migration-m20-formularios-digitais.sql`

- [ ] **Step 1: Criar o arquivo SQL da migration**

```sql
-- M20 Formulários Digitais
-- Execute UMA VEZ via Supabase MCP apply_migration

-- 1. Definições de formulário (GLOBAIS — sem projeto_id, sem versionamento)
CREATE TABLE IF NOT EXISTS formularios_digitais (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo      TEXT        NOT NULL DEFAULT 'Formulário sem título',
  descricao   TEXT,
  ativo       BOOLEAN     NOT NULL DEFAULT true,
  definicao   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Respostas (POR PROJETO)
CREATE TABLE IF NOT EXISTS formulario_respostas (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID        NOT NULL REFERENCES formularios_digitais(id) ON DELETE CASCADE,
  projeto_id    UUID        NOT NULL,
  respondente   TEXT,
  answers       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_formulario_respostas_projeto
  ON formulario_respostas(projeto_id);
CREATE INDEX IF NOT EXISTS idx_formulario_respostas_formulario
  ON formulario_respostas(formulario_id);

-- 3. RLS (padrão do projeto: aberto a authenticated)
ALTER TABLE formularios_digitais  ENABLE ROW LEVEL SECURITY;
ALTER TABLE formulario_respostas  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "formularios_digitais: full access" ON formularios_digitais;
CREATE POLICY "formularios_digitais: full access" ON formularios_digitais
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "formulario_respostas: full access" ON formulario_respostas;
CREATE POLICY "formulario_respostas: full access" ON formulario_respostas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Aplicar migration via Supabase MCP**

Usar a tool `mcp__supabase-integrada__apply_migration` com:
- `name`: `m20_formularios_digitais`
- `query`: conteúdo do arquivo SQL acima

- [ ] **Step 3: Verificar tabelas criadas via MCP**

Usar `mcp__supabase-integrada__list_tables` e confirmar que `formularios_digitais` e `formulario_respostas` aparecem com as colunas corretas.

- [ ] **Step 4: Commit**

```bash
git add docs/database/supabase-migration-m20-formularios-digitais.sql
git commit -m "feat(formularios): migration m20 — formularios_digitais e formulario_respostas"
```

---

## Task 2: Instalar dnd-kit + Atualizar TABLE_MAP

**Files:**
- Modify: `package.json`
- Modify: `src/api/supabaseEntities.js`

- [ ] **Step 1: Instalar dependências dnd-kit**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Saída esperada: `added N packages` sem erros.

- [ ] **Step 2: Adicionar entidades ao TABLE_MAP em `src/api/supabaseEntities.js`**

Localizar o objeto `TABLE_MAP` (linhas 3–39 aprox.) e adicionar as duas novas entradas antes do fechamento `}`:

```js
  FormularioDigital:  'formularios_digitais',
  FormularioResposta: 'formulario_respostas',
```

- [ ] **Step 3: Verificar que o shim funciona**

Abrir o app (`npm run dev`), abrir o console do browser e verificar que não há erros de importação relacionados às novas entidades.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/api/supabaseEntities.js
git commit -m "feat(formularios): instalar dnd-kit e registrar entidades no TABLE_MAP"
```

---

## Task 3: Helpers Puros — formSchema.js + formValidation.js

**Files:**
- Create: `src/lib/formularios/formSchema.js`
- Create: `src/lib/formularios/formValidation.js`

- [ ] **Step 1: Criar `src/lib/formularios/formSchema.js`**

```js
export const FIELD_TYPES = [
  { value: 'short_text',      label: 'Texto curto' },
  { value: 'long_text',       label: 'Texto longo' },
  { value: 'number',          label: 'Número' },
  { value: 'email',           label: 'E-mail' },
  { value: 'single_choice',   label: 'Escolha única' },
  { value: 'multiple_choice', label: 'Múltipla escolha' },
  { value: 'dropdown',        label: 'Lista (dropdown)' },
  { value: 'date',            label: 'Data' },
  { value: 'time',            label: 'Hora' },
  { value: 'rating',          label: 'Avaliação' },
  { value: 'section',         label: 'Seção / título' },
];

const CHOICE_TYPES = new Set(['single_choice', 'multiple_choice', 'dropdown']);

export function createEmptyDefinition() {
  return { sections: [createSection()] };
}

export function createSection() {
  return { id: crypto.randomUUID(), title: '', fields: [] };
}

export function createField(type) {
  const base = {
    id: crypto.randomUUID(),
    type,
    label: '',
    description: '',
    required: false,
    placeholder: '',
  };
  if (CHOICE_TYPES.has(type)) {
    base.options = [createOption('Opção 1'), createOption('Opção 2')];
  }
  if (type === 'rating') {
    base.max = 5;
    base.minLabel = '';
    base.maxLabel = '';
  }
  if (['number', 'short_text', 'long_text', 'email'].includes(type)) {
    base.validation = {};
  }
  return base;
}

export function createOption(label = '') {
  return { value: crypto.randomUUID(), label };
}

export function getDefaultAnswer(field) {
  if (field.type === 'multiple_choice') return [];
  if (field.type === 'rating') return null;
  return '';
}

export function countFields(definition) {
  return (definition?.sections || []).reduce(
    (acc, sec) => acc + sec.fields.filter(f => f.type !== 'section').length,
    0
  );
}

// --- Mutações imutáveis da árvore de definição ---

export function updateField(definition, sectionId, fieldId, patch) {
  return {
    ...definition,
    sections: definition.sections.map(sec =>
      sec.id !== sectionId ? sec : {
        ...sec,
        fields: sec.fields.map(f => f.id !== fieldId ? f : { ...f, ...patch }),
      }
    ),
  };
}

export function addField(definition, sectionId, field) {
  return {
    ...definition,
    sections: definition.sections.map(sec =>
      sec.id !== sectionId ? sec : { ...sec, fields: [...sec.fields, field] }
    ),
  };
}

export function removeField(definition, sectionId, fieldId) {
  return {
    ...definition,
    sections: definition.sections.map(sec =>
      sec.id !== sectionId ? sec : {
        ...sec,
        fields: sec.fields.filter(f => f.id !== fieldId),
      }
    ),
  };
}

export function duplicateField(definition, sectionId, fieldId) {
  return {
    ...definition,
    sections: definition.sections.map(sec => {
      if (sec.id !== sectionId) return sec;
      const idx = sec.fields.findIndex(f => f.id === fieldId);
      if (idx === -1) return sec;
      const copy = { ...sec.fields[idx], id: crypto.randomUUID() };
      const fields = [...sec.fields];
      fields.splice(idx + 1, 0, copy);
      return { ...sec, fields };
    }),
  };
}

export function reorderFields(definition, sectionId, oldIndex, newIndex) {
  return {
    ...definition,
    sections: definition.sections.map(sec => {
      if (sec.id !== sectionId) return sec;
      const fields = [...sec.fields];
      const [moved] = fields.splice(oldIndex, 1);
      fields.splice(newIndex, 0, moved);
      return { ...sec, fields };
    }),
  };
}

export function addSection(definition) {
  return { ...definition, sections: [...definition.sections, createSection()] };
}

export function updateSection(definition, sectionId, patch) {
  return {
    ...definition,
    sections: definition.sections.map(sec =>
      sec.id !== sectionId ? sec : { ...sec, ...patch }
    ),
  };
}
```

- [ ] **Step 2: Criar `src/lib/formularios/formValidation.js`**

```js
export function validateAnswers(definition, answers) {
  const errors = {};

  (definition?.sections || []).forEach(sec => {
    sec.fields.forEach(field => {
      if (field.type === 'section') return;

      const val = answers[field.id];
      const isEmpty =
        val === '' || val === null || val === undefined ||
        (Array.isArray(val) && val.length === 0);

      if (field.required && isEmpty) {
        errors[field.id] = 'Este campo é obrigatório.';
        return;
      }
      if (isEmpty) return;

      const v = field.validation || {};

      if (field.type === 'number') {
        const num = Number(val);
        if (isNaN(num)) { errors[field.id] = 'Informe um número válido.'; return; }
        if (v.min !== undefined && num < v.min) { errors[field.id] = `Valor mínimo: ${v.min}.`; return; }
        if (v.max !== undefined && num > v.max) { errors[field.id] = `Valor máximo: ${v.max}.`; return; }
      }

      if (field.type === 'short_text' || field.type === 'long_text') {
        if (v.minLength && val.length < v.minLength) { errors[field.id] = `Mínimo ${v.minLength} caracteres.`; return; }
        if (v.maxLength && val.length > v.maxLength) { errors[field.id] = `Máximo ${v.maxLength} caracteres.`; return; }
        if (v.pattern && !new RegExp(v.pattern).test(val)) { errors[field.id] = 'Formato inválido.'; return; }
      }

      if (field.type === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          errors[field.id] = 'Informe um e-mail válido.';
        }
      }
    });
  });

  return { valid: Object.keys(errors).length === 0, errors };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/formularios/
git commit -m "feat(formularios): helpers formSchema e formValidation"
```

---

## Task 4: Navegação + Permissões + Rotas

**Files:**
- Modify: `src/lib/navigationConfig.js`
- Modify: `src/lib/permissionsConfig.js`
- Modify: `src/App.jsx`

- [ ] **Step 1: Adicionar grupo ao `src/lib/navigationConfig.js`**

Adicionar `FileText` ao bloco de imports (linha 1-10) e o novo grupo logo após o grupo "Riscos":

```js
// Adicionar ao import:
import {
  LayoutDashboard, Ruler, ShoppingCart, ClipboardList,
  ScrollText, ShieldAlert, Bot, Settings2, FileText,
} from "lucide-react";
```

Novo grupo (inserir após o grupo `title: "Riscos"`):

```js
  {
    title: "Formulários Digitais",
    icon: FileText,
    children: [
      { title: "Formulários", path: "/formularios" },
    ],
  },
```

**Crítico:** o `title: "Formulários Digitais"` deve ser **idêntico** ao nome do módulo em `permissionsConfig.js`, pois `Layout.jsx:47` filtra por `permissoes[group.title]?.view`.

- [ ] **Step 2: Adicionar módulo ao `src/lib/permissionsConfig.js`**

Em `MODULES`, adicionar `'Formulários Digitais'` após `'Riscos e Mudanças'`:

```js
export const MODULES = [
  'Dashboard',
  'Engenharia',
  'Suprimentos',
  'Planejamento',
  'Adm. Contratual',
  'Riscos e Mudanças',
  'Formulários Digitais',   // <-- novo
  'Agentes de IA',
  'Configurações',
];
```

Em `PERFIL_SEED`, adicionar `'Formulários Digitais'` a **cada perfil**:

```js
export const PERFIL_SEED = {
  Admin:        { ..., 'Formulários Digitais': ALL  },
  Gestor:       { ..., 'Formulários Digitais': ALL  },
  Visualizador: { ..., 'Formulários Digitais': VIEW },
  Engenharia:   { ..., 'Formulários Digitais': VIEW },
  Planejamento: { ..., 'Formulários Digitais': VIEW },
  Contratual:   { ..., 'Formulários Digitais': VIEW },
  Suprimentos:  { ..., 'Formulários Digitais': VIEW },
};
```

- [ ] **Step 3: Adicionar lazy imports e rotas ao `src/App.jsx`**

No bloco de imports lazy (após os imports existentes de Configurações):

```js
const FormularioBuilder  = lazy(() => import('./pages/Configuracoes/FormularioBuilder'));
const ListaFormularios   = lazy(() => import('./pages/Formularios/ListaFormularios'));
const ResponderFormulario = lazy(() => import('./pages/Formularios/ResponderFormulario'));
const RespostasFormulario = lazy(() => import('./pages/Formularios/RespostasFormulario'));
```

Nas rotas (após as rotas existentes de `/configuracoes`):

```jsx
{/* Builder — dentro de Configurações */}
<Route path="/configuracoes/cadastros/formularios/:id" element={wrap(FormularioBuilder, 'Configurações')} />

{/* Módulo de preenchimento */}
<Route path="/formularios"                  element={wrap(ListaFormularios,    'Formulários Digitais')} />
<Route path="/formularios/:id/responder"    element={wrap(ResponderFormulario, 'Formulários Digitais')} />
<Route path="/formularios/:id/respostas"    element={wrap(RespostasFormulario, 'Formulários Digitais')} />
```

- [ ] **Step 4: Verificar no browser**

Rodar `npm run dev`. Sidebar deve mostrar "Formulários Digitais" abaixo de "Riscos". Navegar para `/formularios` — deve mostrar a rota (vai dar erro de componente vazio — normal neste passo, pois as páginas ainda não existem).

- [ ] **Step 5: Commit**

```bash
git add src/lib/navigationConfig.js src/lib/permissionsConfig.js src/App.jsx
git commit -m "feat(formularios): navegação, permissões e rotas"
```

---

## Task 5: Aba Formulários no Cadastros + Lista de Cadastro

**Files:**
- Modify: `src/pages/Configuracoes/Cadastros.jsx`
- Create: `src/components/cadastros/FormulariosCadastroList.jsx`

- [ ] **Step 1: Criar `src/components/cadastros/FormulariosCadastroList.jsx`**

```jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { entities } from "@/api/supabaseEntities";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { createEmptyDefinition } from "@/lib/formularios/formSchema";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function FormulariosCadastroList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');

  const { data: formularios = [], isPending, isError } = useQuery({
    queryKey: ['formularios_digitais'],
    queryFn: () => entities.FormularioDigital.list(),
  });

  const createMut = useMutation({
    mutationFn: () => entities.FormularioDigital.create({
      titulo: 'Formulário sem título',
      descricao: '',
      ativo: false,
      definicao: createEmptyDefinition(),
    }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['formularios_digitais'] });
      navigate(`/configuracoes/cadastros/formularios/${result.id}`);
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao criar formulário.' }),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, ativo }) => entities.FormularioDigital.update(id, { ativo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['formularios_digitais'] }),
    onError: () => toast({ variant: 'destructive', title: 'Erro ao atualizar formulário.' }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => entities.FormularioDigital.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formularios_digitais'] });
      queryClient.invalidateQueries({ queryKey: ['formularios_digitais', 'ativos'] });
      toast({ variant: 'success', title: 'Formulário excluído.' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao excluir formulário.' }),
  });

  const filtrados = formularios.filter(f =>
    f.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    (f.descricao || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-3">
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar formulário..."
          className="flex-1 max-w-sm border border-border rounded-lg px-3 py-2 text-sm bg-background"
        />
        <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
          <Plus className="w-4 h-4 mr-1" />
          {createMut.isPending ? 'Criando...' : 'Novo Formulário'}
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">Formulário</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">Criado em</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">Atualizado em</th>
              <th className="text-center px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">Ativo</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isPending && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Carregando...</td></tr>
            )}
            {isError && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-status-critical">Erro ao carregar formulários.</td></tr>
            )}
            {!isPending && !isError && filtrados.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Nenhum formulário encontrado.</td></tr>
            )}
            {filtrados.map(f => (
              <tr key={f.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div className="font-semibold">{f.titulo}</div>
                  {f.descricao && (
                    <div className="text-xs text-muted-foreground mt-0.5">{f.descricao}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(f.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(f.updated_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleMut.mutate({ id: f.id, ativo: !f.ativo })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none ${
                      f.ativo ? 'bg-green-600' : 'bg-border'
                    }`}
                    title={f.ativo ? 'Ativo — clique para desativar' : 'Inativo — clique para ativar'}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      f.ativo ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 justify-end">
                    <button
                      onClick={() => navigate(`/configuracoes/cadastros/formularios/${f.id}?mode=view`)}
                      className="p-2 rounded-lg border border-border hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/configuracoes/cadastros/formularios/${f.id}`)}
                      className="p-2 rounded-lg border border-border hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="p-2 rounded-lg border border-border hover:bg-red-50 hover:border-red-200 text-muted-foreground hover:text-status-critical"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir formulário?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação excluirá permanentemente o formulário "{f.titulo}" e todas as respostas vinculadas. Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMut.mutate(f.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        ℹ️ Formulários são globais (compartilhados entre projetos). Apenas os marcados como <strong>Ativo</strong> aparecem no módulo "Formulários Digitais" para preenchimento.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Adicionar aba "Formulários" ao `src/pages/Configuracoes/Cadastros.jsx`**

Adicionar import no topo:

```js
import FormulariosCadastroList from "@/components/cadastros/FormulariosCadastroList";
```

Adicionar ao array `TABS`:

```js
const TABS = [
  { key: "unidades",     label: "Unidades de Medida" },
  { key: "disciplinas",  label: "Disciplinas" },
  { key: "funcoes",      label: "Funções" },
  { key: "equipamentos", label: "Equipamentos" },
  { key: "pacotes",      label: "Pacotes" },
  { key: "categorias",   label: "Categorias de Impacto" },
  { key: "formularios",  label: "Formulários" },   // <-- novo
];
```

Adicionar renderização no conteúdo da aba ativa:

```jsx
{activeTab === "formularios" && <FormulariosCadastroList />}
```

- [ ] **Step 3: Verificar no browser**

Navegar para Configurações → Cadastros. A aba "Formulários" deve aparecer. Clicar nela mostra a tabela vazia com botão "Novo Formulário". Criar um formulário deve navegar para a rota do builder (vai dar 404 até a Task 11 — normal neste passo).

- [ ] **Step 4: Commit**

```bash
git add src/components/cadastros/FormulariosCadastroList.jsx src/pages/Configuracoes/Cadastros.jsx
git commit -m "feat(formularios): aba Formulários em Cadastros + lista de cadastro"
```

---

## Task 6: FieldTypePicker

**Files:**
- Create: `src/components/formularios/builder/FieldTypePicker.jsx`

- [ ] **Step 1: Criar o componente**

```jsx
import { useEffect, useRef } from "react";
import {
  AlignLeft, AlignJustify, Hash, Mail, CircleDot,
  CheckSquare, ChevronDown, Calendar, Clock, Star, Minus,
} from "lucide-react";
import { FIELD_TYPES } from "@/lib/formularios/formSchema";

const ICONS = {
  short_text:      AlignLeft,
  long_text:       AlignJustify,
  number:          Hash,
  email:           Mail,
  single_choice:   CircleDot,
  multiple_choice: CheckSquare,
  dropdown:        ChevronDown,
  date:            Calendar,
  time:            Clock,
  rating:          Star,
  section:         Minus,
};

export default function FieldTypePicker({ onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full mt-2 left-0 right-0 z-20 bg-card border border-border rounded-xl shadow-lg p-2 grid grid-cols-2 gap-1"
    >
      {FIELD_TYPES.map(t => {
        const Icon = ICONS[t.value];
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onSelect(t.value)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-muted/50 text-sm font-medium text-left transition-colors"
          >
            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
              <Icon className="w-3.5 h-3.5" />
            </span>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/formularios/builder/FieldTypePicker.jsx
git commit -m "feat(formularios): FieldTypePicker — seletor de tipo de item"
```

---

## Task 7: FieldPropertiesEditor

**Files:**
- Create: `src/components/formularios/builder/FieldPropertiesEditor.jsx`

- [ ] **Step 1: Criar o componente**

```jsx
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOption } from "@/lib/formularios/formSchema";

const CHOICE_TYPES = new Set(["single_choice", "multiple_choice", "dropdown"]);

export default function FieldPropertiesEditor({ field, onUpdate }) {
  const { type } = field;

  if (CHOICE_TYPES.has(type)) {
    return (
      <div className="space-y-2 mt-2">
        {(field.options || []).map((opt, idx) => (
          <div key={opt.value} className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-border rounded-full flex-shrink-0" />
            <Input
              value={opt.label}
              onChange={e => {
                const options = field.options.map((o, i) =>
                  i === idx ? { ...o, label: e.target.value } : o
                );
                onUpdate({ options });
              }}
              placeholder={`Opção ${idx + 1}`}
              className="h-8 text-sm"
            />
            {field.options.length > 1 && (
              <button
                type="button"
                onClick={() => onUpdate({ options: field.options.filter((_, i) => i !== idx) })}
                className="text-muted-foreground hover:text-status-critical flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => onUpdate({ options: [...(field.options || []), createOption()] })}
          className="text-xs text-primary font-semibold flex items-center gap-1 mt-1"
        >
          <Plus className="w-3 h-3" /> Adicionar opção
        </button>
      </div>
    );
  }

  if (type === "rating") {
    return (
      <div className="grid grid-cols-2 gap-3 mt-2">
        <div>
          <Label className="text-xs">Estrelas máximas</Label>
          <Input
            type="number" min={2} max={10}
            value={field.max || 5}
            onChange={e => onUpdate({ max: Math.max(2, Math.min(10, Number(e.target.value) || 5)) })}
            className="h-8 mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Rótulo mínimo</Label>
          <Input
            value={field.minLabel || ''}
            onChange={e => onUpdate({ minLabel: e.target.value })}
            className="h-8 mt-1"
            placeholder="ex: Ruim"
          />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Rótulo máximo</Label>
          <Input
            value={field.maxLabel || ''}
            onChange={e => onUpdate({ maxLabel: e.target.value })}
            className="h-8 mt-1"
            placeholder="ex: Ótimo"
          />
        </div>
      </div>
    );
  }

  if (type === "short_text" || type === "long_text") {
    return (
      <div className="space-y-2 mt-2">
        <div>
          <Label className="text-xs">Placeholder</Label>
          <Input
            value={field.placeholder || ''}
            onChange={e => onUpdate({ placeholder: e.target.value })}
            className="h-8 mt-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Mín. caracteres</Label>
            <Input
              type="number" min={0}
              value={field.validation?.minLength || ''}
              onChange={e => onUpdate({
                validation: { ...field.validation, minLength: e.target.value ? Number(e.target.value) : undefined },
              })}
              className="h-8 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Máx. caracteres</Label>
            <Input
              type="number" min={0}
              value={field.validation?.maxLength || ''}
              onChange={e => onUpdate({
                validation: { ...field.validation, maxLength: e.target.value ? Number(e.target.value) : undefined },
              })}
              className="h-8 mt-1"
            />
          </div>
        </div>
      </div>
    );
  }

  if (type === "email") {
    return (
      <div className="mt-2">
        <Label className="text-xs">Placeholder</Label>
        <Input
          value={field.placeholder || ''}
          onChange={e => onUpdate({ placeholder: e.target.value })}
          className="h-8 mt-1"
          placeholder="email@exemplo.com"
        />
      </div>
    );
  }

  if (type === "number") {
    return (
      <div className="space-y-2 mt-2">
        <div>
          <Label className="text-xs">Placeholder</Label>
          <Input
            value={field.placeholder || ''}
            onChange={e => onUpdate({ placeholder: e.target.value })}
            className="h-8 mt-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Valor mínimo</Label>
            <Input
              type="number"
              value={field.validation?.min ?? ''}
              onChange={e => onUpdate({
                validation: { ...field.validation, min: e.target.value !== '' ? Number(e.target.value) : undefined },
              })}
              className="h-8 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Valor máximo</Label>
            <Input
              type="number"
              value={field.validation?.max ?? ''}
              onChange={e => onUpdate({
                validation: { ...field.validation, max: e.target.value !== '' ? Number(e.target.value) : undefined },
              })}
              className="h-8 mt-1"
            />
          </div>
        </div>
      </div>
    );
  }

  // date, time, section — sem propriedades extras
  return null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/formularios/builder/FieldPropertiesEditor.jsx
git commit -m "feat(formularios): FieldPropertiesEditor — propriedades por tipo de item"
```

---

## Task 8: SortableFieldCard + FieldCardEditor

**Files:**
- Create: `src/components/formularios/builder/SortableFieldCard.jsx`
- Create: `src/components/formularios/builder/FieldCardEditor.jsx`

- [ ] **Step 1: Criar `src/components/formularios/builder/SortableFieldCard.jsx`**

```jsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import FieldCardEditor from "./FieldCardEditor";

export default function SortableFieldCard({ field, onUpdate, onRemove, onDuplicate }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: field.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex gap-2 group"
    >
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 mt-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
        tabIndex={-1}
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="flex-1 min-w-0">
        <FieldCardEditor
          field={field}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onDuplicate={onDuplicate}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Criar `src/components/formularios/builder/FieldCardEditor.jsx`**

```jsx
import { useState } from "react";
import { Copy, Trash2, ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FIELD_TYPES, createField } from "@/lib/formularios/formSchema";
import FieldPropertiesEditor from "./FieldPropertiesEditor";

export default function FieldCardEditor({ field, onUpdate, onRemove, onDuplicate }) {
  const [expanded, setExpanded] = useState(true);

  function handleTypeChange(newType) {
    const fresh = createField(newType);
    // Preservar label e required ao trocar o tipo
    onUpdate({ ...fresh, id: field.id, label: field.label, required: field.required });
  }

  // Campo do tipo "section" tem edição mais simples
  if (field.type === "section") {
    return (
      <div className="bg-card border border-border rounded-xl p-4 space-y-1">
        <input
          value={field.label}
          onChange={e => onUpdate({ label: e.target.value })}
          placeholder="Título da seção..."
          className="w-full text-base font-semibold bg-transparent border-0 focus:outline-none"
        />
        <input
          value={field.description || ''}
          onChange={e => onUpdate({ description: e.target.value })}
          placeholder="Descrição da seção (opcional)..."
          className="w-full text-sm text-muted-foreground bg-transparent border-0 focus:outline-none"
        />
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onDuplicate} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <Copy className="w-3.5 h-3.5" /> Duplicar
          </button>
          <button onClick={onRemove} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-status-critical">
            <Trash2 className="w-3.5 h-3.5" /> Excluir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-xl p-4 transition-all border ${
      expanded ? 'border-primary ring-2 ring-primary/10' : 'border-border'
    }`}>
      {/* Linha de cabeçalho: label + tipo + obrigatório */}
      <div className="flex items-start gap-3 mb-2">
        <input
          value={field.label}
          onChange={e => onUpdate({ label: e.target.value })}
          placeholder="Título do item..."
          className="flex-1 text-sm font-semibold bg-transparent border-0 border-b border-dashed border-transparent hover:border-border focus:border-primary focus:outline-none pb-0.5"
          onFocus={() => setExpanded(true)}
        />
        {field.required && <span className="text-status-critical text-sm font-bold flex-shrink-0 mt-0.5">∗</span>}
        {/* Seletor de tipo */}
        <div className="relative flex-shrink-0">
          <select
            value={field.type}
            onChange={e => handleTypeChange(e.target.value)}
            className="text-xs font-semibold text-muted-foreground bg-muted/40 border border-border rounded-lg pl-2.5 pr-7 py-1.5 appearance-none focus:outline-none cursor-pointer"
          >
            {FIELD_TYPES.filter(t => t.value !== "section").map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Propriedades específicas do tipo */}
      {expanded && <FieldPropertiesEditor field={field} onUpdate={onUpdate} />}

      {/* Rodapé: Duplicar / Excluir / Obrigatório */}
      <div className="flex items-center justify-end gap-4 mt-3 pt-3 border-t border-border/50">
        <button
          type="button"
          onClick={onDuplicate}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Copy className="w-3.5 h-3.5" /> Duplicar
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-status-critical"
        >
          <Trash2 className="w-3.5 h-3.5" /> Excluir
        </button>
        <div className="flex items-center gap-2">
          <Switch
            id={`req-${field.id}`}
            checked={field.required}
            onCheckedChange={val => onUpdate({ required: val })}
          />
          <Label htmlFor={`req-${field.id}`} className="text-xs cursor-pointer">
            Obrigatório
          </Label>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/formularios/builder/SortableFieldCard.jsx src/components/formularios/builder/FieldCardEditor.jsx
git commit -m "feat(formularios): SortableFieldCard e FieldCardEditor"
```

---

## Task 9: FormBuilderCanvas

**Files:**
- Create: `src/components/formularios/builder/FormBuilderCanvas.jsx`

- [ ] **Step 1: Criar o componente**

```jsx
import { useState } from "react";
import { Plus, Layers } from "lucide-react";
import {
  DndContext, PointerSensor, KeyboardSensor,
  useSensor, useSensors, closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  addField, addSection, createField,
  removeField, duplicateField, reorderFields,
  updateField, updateSection,
} from "@/lib/formularios/formSchema";
import SortableFieldCard from "./SortableFieldCard";
import FieldTypePicker from "./FieldTypePicker";

export default function FormBuilderCanvas({ definition, onChange }) {
  const [openPickerSectionId, setOpenPickerSectionId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    for (const sec of definition.sections) {
      const ids = sec.fields.map(f => f.id);
      const oldIdx = ids.indexOf(active.id);
      const newIdx = ids.indexOf(over.id);
      if (oldIdx !== -1 && newIdx !== -1) {
        onChange(reorderFields(definition, sec.id, oldIdx, newIdx));
        return;
      }
    }
  }

  function handleAddField(sectionId, type) {
    const field = createField(type);
    onChange(addField(definition, sectionId, field));
    setOpenPickerSectionId(null);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {definition.sections.map((sec, secIdx) => (
          <div key={sec.id} className="space-y-3">
            {/* Título de seção — mostrar se houver mais de uma seção OU se tiver título */}
            {(definition.sections.length > 1 || sec.title) && (
              <div className="flex items-center gap-3 pt-1">
                <div className="h-px flex-1 bg-border" />
                <input
                  value={sec.title}
                  onChange={e => onChange(updateSection(definition, sec.id, { title: e.target.value }))}
                  placeholder={`Seção ${secIdx + 1}...`}
                  className="text-sm font-semibold text-muted-foreground bg-transparent border-0 focus:outline-none text-center min-w-28"
                />
                <div className="h-px flex-1 bg-border" />
              </div>
            )}

            <SortableContext
              items={sec.fields.map(f => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {sec.fields.map(field => (
                <SortableFieldCard
                  key={field.id}
                  field={field}
                  onUpdate={patch => onChange(updateField(definition, sec.id, field.id, patch))}
                  onRemove={() => onChange(removeField(definition, sec.id, field.id))}
                  onDuplicate={() => onChange(duplicateField(definition, sec.id, field.id))}
                />
              ))}
            </SortableContext>

            {/* Botão + picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenPickerSectionId(
                  openPickerSectionId === sec.id ? null : sec.id
                )}
                className="w-full border-2 border-dashed border-border rounded-xl p-3 text-sm font-semibold text-primary hover:bg-primary/5 hover:border-primary transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Adicionar item
              </button>
              {openPickerSectionId === sec.id && (
                <FieldTypePicker
                  onSelect={type => handleAddField(sec.id, type)}
                  onClose={() => setOpenPickerSectionId(null)}
                />
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => onChange(addSection(definition))}
          className="w-full border border-dashed border-border rounded-xl p-3 text-sm text-muted-foreground hover:bg-muted/30 flex items-center justify-center gap-2 transition-colors"
        >
          <Layers className="w-4 h-4" /> Adicionar seção
        </button>
      </div>
    </DndContext>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/formularios/builder/FormBuilderCanvas.jsx
git commit -m "feat(formularios): FormBuilderCanvas com dnd-kit e gerenciamento de seções"
```

---

## Task 10: FormBuilderHeader

**Files:**
- Create: `src/components/formularios/builder/FormBuilderHeader.jsx`

- [ ] **Step 1: Criar o componente**

```jsx
import { ArrowLeft, Eye, Pencil, Save, Monitor, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function FormBuilderHeader({
  titulo, descricao, ativo,
  onTituloChange, onDescricaoChange, onAtivoChange,
  mode, onModeChange,
  previewDevice, onPreviewDeviceChange,
  onSave, saving,
}) {
  const navigate = useNavigate();

  return (
    <div className="bg-card border-b border-border sticky top-0 z-10">
      {/* Barra de controles */}
      <div className="flex items-center justify-between px-6 py-3 gap-4 flex-wrap">
        <button
          onClick={() => navigate("/configuracoes/cadastros")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Cadastros
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Editar / Visualizar */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => onModeChange("edit")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold transition-colors ${
                mode === "edit" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/30"
              }`}
            >
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
            <button
              onClick={() => onModeChange("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold transition-colors ${
                mode === "preview" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/30"
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Visualizar
            </button>
          </div>

          {/* Toggle Desktop / Mobile (visível apenas no modo preview) */}
          {mode === "preview" && (
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => onPreviewDeviceChange("desktop")}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  previewDevice === "desktop" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/30"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> Desktop
              </button>
              <button
                onClick={() => onPreviewDeviceChange("mobile")}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  previewDevice === "mobile" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/30"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Mobile
              </button>
            </div>
          )}

          {/* Toggle Ativo / Inativo */}
          <div className="flex items-center gap-2">
            <Switch
              id="builder-ativo"
              checked={ativo}
              onCheckedChange={onAtivoChange}
            />
            <Label htmlFor="builder-ativo" className="text-sm cursor-pointer">
              {ativo ? "Ativo" : "Inativo"}
            </Label>
          </div>

          <Button onClick={onSave} disabled={saving} size="sm">
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {/* Título e descrição do formulário */}
      <div className="px-6 pb-4 border-t border-primary/20 bg-primary/5">
        <input
          value={titulo}
          onChange={e => onTituloChange(e.target.value)}
          placeholder="Título do formulário..."
          className="w-full text-xl font-bold bg-transparent border-0 focus:outline-none text-foreground mt-3"
        />
        <input
          value={descricao}
          onChange={e => onDescricaoChange(e.target.value)}
          placeholder="Descrição (opcional)..."
          className="w-full text-sm text-muted-foreground bg-transparent border-0 focus:outline-none mt-1.5"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/formularios/builder/FormBuilderHeader.jsx
git commit -m "feat(formularios): FormBuilderHeader com toggle editar/visualizar e ativo"
```

---

## Task 11: FormularioBuilder (página)

**Files:**
- Create: `src/pages/Configuracoes/FormularioBuilder.jsx`

- [ ] **Step 1: Criar a página**

```jsx
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { useToast } from "@/components/ui/use-toast";
import { createEmptyDefinition } from "@/lib/formularios/formSchema";
import FormBuilderHeader from "@/components/formularios/builder/FormBuilderHeader";
import FormBuilderCanvas from "@/components/formularios/builder/FormBuilderCanvas";
import FormRenderer from "@/components/formularios/renderer/FormRenderer";

export default function FormularioBuilder() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState(
    searchParams.get("mode") === "view" ? "preview" : "edit"
  );
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [titulo, setTitulo] = useState("Formulário sem título");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(false);
  const [definition, setDefinition] = useState(null);

  const { data: formulario, isPending } = useQuery({
    queryKey: ["formulario_digital", id],
    queryFn: async () => {
      const [result] = await entities.FormularioDigital.filter({ id });
      return result || null;
    },
    enabled: !!id,
  });

  // Sincronizar dados carregados para o estado local
  useEffect(() => {
    if (formulario) {
      setTitulo(formulario.titulo || "Formulário sem título");
      setDescricao(formulario.descricao || "");
      setAtivo(formulario.ativo ?? false);
      const def = formulario.definicao;
      setDefinition(def?.sections ? def : createEmptyDefinition());
    }
  }, [formulario]);

  const saveMut = useMutation({
    mutationFn: payload => entities.FormularioDigital.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formularios_digitais"] });
      queryClient.invalidateQueries({ queryKey: ["formularios_digitais", "ativos"] });
      queryClient.invalidateQueries({ queryKey: ["formulario_digital", id] });
      toast({ variant: "success", title: "Formulário salvo com sucesso." });
    },
    onError: () => toast({ variant: "destructive", title: "Erro ao salvar formulário." }),
  });

  function handleSave() {
    saveMut.mutate({ titulo, descricao, ativo, definicao: definition });
  }

  if (isPending || !definition) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Carregando...
      </div>
    );
  }

  const previewMaxWidth = previewDevice === "mobile" ? "max-w-sm" : "max-w-2xl";

  return (
    <div className="flex flex-col h-full">
      <FormBuilderHeader
        titulo={titulo}
        descricao={descricao}
        ativo={ativo}
        onTituloChange={setTitulo}
        onDescricaoChange={setDescricao}
        onAtivoChange={setAtivo}
        mode={mode}
        onModeChange={setMode}
        previewDevice={previewDevice}
        onPreviewDeviceChange={setPreviewDevice}
        onSave={handleSave}
        saving={saveMut.isPending}
      />

      <div className="flex-1 overflow-auto p-6">
        {mode === "edit" ? (
          <div className="max-w-2xl mx-auto">
            <FormBuilderCanvas definition={definition} onChange={setDefinition} />
          </div>
        ) : (
          <div className={`mx-auto ${previewMaxWidth}`}>
            <div className="bg-card border border-border border-t-[5px] border-t-primary rounded-xl p-5 mb-4">
              <h1 className="text-xl font-bold">{titulo || "Formulário sem título"}</h1>
              {descricao && <p className="text-sm text-muted-foreground mt-2">{descricao}</p>}
            </div>
            <FormRenderer
              definition={definition}
              value={{}}
              onChange={() => {}}
              errors={{}}
              readOnly
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar no browser**

1. Navegar para Configurações → Cadastros → aba Formulários.
2. Clicar em "Novo Formulário" — deve criar o rascunho e navegar para `/configuracoes/cadastros/formularios/:id`.
3. O builder deve carregar com título "Formulário sem título", canvas vazio.
4. Adicionar itens de cada tipo via botão "+ Adicionar item".
5. Testar drag-and-drop para reordenar.
6. Clicar "Salvar" — toast de sucesso.
7. Recarregar a página — itens e ordem devem persistir.
8. Alternar para "Visualizar" e toggle Desktop/Mobile.
9. Clicar "Voltar para Cadastros" — retorna à aba Formulários.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Configuracoes/FormularioBuilder.jsx
git commit -m "feat(formularios): página FormularioBuilder — construtor completo com preview"
```

---

## Task 12: Renderizador — FormRenderer + FieldInput

**Files:**
- Create: `src/components/formularios/renderer/FormRenderer.jsx`
- Create: `src/components/formularios/renderer/FieldInput.jsx`

- [ ] **Step 1: Criar `src/components/formularios/renderer/FieldInput.jsx`**

```jsx
import { Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function FieldInput({ field, value, onChange, error, readOnly }) {
  const { type, label, description, required, placeholder } = field;

  return (
    <div className={`bg-card border rounded-xl p-4 space-y-3 ${error ? 'border-status-critical' : 'border-border'}`}>
      {/* Label + descrição */}
      <div>
        <Label className="text-sm font-semibold flex items-center gap-1">
          {label || "(sem título)"}
          {required && <span className="text-status-critical">∗</span>}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>

      {/* Input por tipo */}
      {type === "short_text" && (
        <Input
          type="text"
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || ""}
          disabled={readOnly}
          inputMode="text"
        />
      )}

      {type === "long_text" && (
        <Textarea
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || ""}
          disabled={readOnly}
          rows={3}
        />
      )}

      {type === "number" && (
        <Input
          type="number"
          value={value ?? ""}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || "0"}
          disabled={readOnly}
          inputMode="numeric"
        />
      )}

      {type === "email" && (
        <Input
          type="email"
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || "email@exemplo.com"}
          disabled={readOnly}
          inputMode="email"
        />
      )}

      {type === "single_choice" && (
        <div className="space-y-2">
          {(field.options || []).map(opt => (
            <button
              key={opt.value}
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && onChange(opt.value)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-colors ${
                value === opt.value
                  ? "border-primary bg-primary/5 font-medium"
                  : "border-border hover:bg-muted/30"
              }`}
            >
              <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 relative ${
                value === opt.value ? "border-primary" : "border-border"
              }`}>
                {value === opt.value && (
                  <span className="absolute inset-0.5 rounded-full bg-primary" />
                )}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {type === "multiple_choice" && (
        <div className="space-y-2">
          {(field.options || []).map(opt => {
            const checked = Array.isArray(value) && value.includes(opt.value);
            return (
              <div
                key={opt.value}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-muted/20"
              >
                <Checkbox
                  id={`${field.id}-${opt.value}`}
                  checked={checked}
                  disabled={readOnly}
                  onCheckedChange={ch => {
                    const arr = Array.isArray(value) ? value : [];
                    onChange(ch ? [...arr, opt.value] : arr.filter(v => v !== opt.value));
                  }}
                />
                <label
                  htmlFor={`${field.id}-${opt.value}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {opt.label}
                </label>
              </div>
            );
          })}
        </div>
      )}

      {type === "dropdown" && (
        <Select value={value || ""} onValueChange={onChange} disabled={readOnly}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder || "Selecione uma opção..."} />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {type === "date" && (
        <Input
          type="date"
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          disabled={readOnly}
        />
      )}

      {type === "time" && (
        <Input
          type="time"
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          disabled={readOnly}
        />
      )}

      {type === "rating" && (
        <div>
          <div className="flex gap-1.5">
            {Array.from({ length: field.max || 5 }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                type="button"
                disabled={readOnly}
                onClick={() => !readOnly && onChange(n)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-7 h-7 transition-colors ${
                    n <= (value || 0)
                      ? "text-amber-400 fill-amber-400"
                      : "text-border hover:text-amber-300"
                  }`}
                />
              </button>
            ))}
          </div>
          {(field.minLabel || field.maxLabel) && (
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>{field.minLabel}</span>
              <span>{field.maxLabel}</span>
            </div>
          )}
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <p className="text-xs text-status-critical flex items-center gap-1">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Criar `src/components/formularios/renderer/FormRenderer.jsx`**

```jsx
import FieldInput from "./FieldInput";

export default function FormRenderer({ definition, value, onChange, errors, readOnly }) {
  if (!definition?.sections) return null;

  return (
    <div className="space-y-3">
      {definition.sections.map(sec => (
        <div key={sec.id} className="space-y-3">
          {sec.title && (
            <div className="flex items-center gap-3 pt-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm font-semibold text-muted-foreground px-2">{sec.title}</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}
          {sec.fields.map(field => {
            if (field.type === "section") {
              return (
                <div key={field.id} className="pt-1">
                  {field.label && <h3 className="text-base font-semibold">{field.label}</h3>}
                  {field.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{field.description}</p>
                  )}
                </div>
              );
            }
            return (
              <FieldInput
                key={field.id}
                field={field}
                value={value[field.id] ?? (field.type === "multiple_choice" ? [] : field.type === "rating" ? null : "")}
                onChange={val => onChange(field.id, val)}
                error={errors[field.id]}
                readOnly={readOnly}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Verificar no builder**

Abrir um formulário no builder com itens de vários tipos. Alternar para modo "Visualizar". Confirmar que cada tipo renderiza corretamente (inputs, radios, checkboxes, select, estrelas).

- [ ] **Step 4: Commit**

```bash
git add src/components/formularios/renderer/FormRenderer.jsx src/components/formularios/renderer/FieldInput.jsx
git commit -m "feat(formularios): renderizador FormRenderer e FieldInput com todos os tipos"
```

---

## Task 13: RespostaView

**Files:**
- Create: `src/components/formularios/renderer/RespostaView.jsx`

- [ ] **Step 1: Criar o componente**

```jsx
import FormDialog from "@/components/ui/FormDialog";
import FormRenderer from "./FormRenderer";

export default function RespostaView({ open, onClose, definition, answers, respondente, createdAt }) {
  if (!definition || !answers) return null;

  const subtitle = respondente
    ? `Respondente: ${respondente}`
    : createdAt
      ? `Enviado em ${new Date(createdAt).toLocaleString("pt-BR")}`
      : undefined;

  return (
    <FormDialog
      open={open}
      onOpenChange={onClose}
      title="Visualizar Resposta"
      subtitle={subtitle}
      mode="view"
      onClose={onClose}
    >
      <FormRenderer
        definition={definition}
        value={answers}
        onChange={() => {}}
        errors={{}}
        readOnly
      />
    </FormDialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/formularios/renderer/RespostaView.jsx
git commit -m "feat(formularios): RespostaView — modal de leitura de resposta"
```

---

## Task 14: Página ListaFormularios

**Files:**
- Create: `src/pages/Formularios/ListaFormularios.jsx`

- [ ] **Step 1: Criar a página**

```jsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import PageHeader from "@/components/ui/PageHeader";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { countFields } from "@/lib/formularios/formSchema";

export default function ListaFormularios() {
  const navigate = useNavigate();
  const { selectedProjectId } = useProject();

  const { data: formularios = [], isPending } = useQuery({
    queryKey: ["formularios_digitais", "ativos"],
    queryFn: () => entities.FormularioDigital.filter({ ativo: true }),
  });

  const { data: respostas = [] } = useQuery({
    queryKey: ["formulario_respostas_count", selectedProjectId],
    queryFn: () => entities.FormularioResposta.filter({ projeto_id: selectedProjectId }),
    enabled: !!selectedProjectId,
  });

  const respostasCount = respostas.reduce((acc, r) => {
    acc[r.formulario_id] = (acc[r.formulario_id] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      <PageHeader />
      <div className="flex-1 overflow-auto p-6">
        {isPending ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : formularios.length === 0 ? (
          <PageEmptyState
            icon={ClipboardList}
            description="Nenhum formulário ativo. Crie e ative formulários em Configurações → Cadastros → Formulários."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formularios.map(f => {
              const nItens = countFields(f.definicao || {});
              const nRespostas = selectedProjectId ? (respostasCount[f.id] || 0) : null;
              return (
                <div
                  key={f.id}
                  className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:border-primary hover:shadow-sm transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{f.titulo}</h3>
                    {f.descricao && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{f.descricao}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span>🗂 {nItens} {nItens === 1 ? "item" : "itens"}</span>
                    {nRespostas !== null && (
                      <>
                        <span>·</span>
                        {nRespostas > 0 ? (
                          <span className="text-status-positive font-semibold">
                            {nRespostas} {nRespostas === 1 ? "resposta" : "respostas"}
                          </span>
                        ) : (
                          <span>sem respostas neste projeto</span>
                        )}
                      </>
                    )}
                  </div>
                  {selectedProjectId ? (
                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => navigate(`/formularios/${f.id}/responder`)}
                        className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
                      >
                        ✎ Responder
                      </button>
                      <button
                        onClick={() => navigate(`/formularios/${f.id}/respostas`)}
                        className="flex-1 border border-border rounded-lg py-2 text-sm font-semibold hover:bg-muted/30 transition-colors"
                      >
                        📊 Respostas
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-auto">
                      Selecione um projeto para responder.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar no browser**

Navegar para `/formularios`. Com formulários marcados como Ativo no cadastro, os cards devem aparecer. Com projeto selecionado, os botões "Responder" e "Respostas" ficam ativos.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Formularios/ListaFormularios.jsx
git commit -m "feat(formularios): página ListaFormularios — grid de formulários ativos"
```

---

## Task 15: Página ResponderFormulario

**Files:**
- Create: `src/pages/Formularios/ResponderFormulario.jsx`

- [ ] **Step 1: Criar a página**

```jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import PageHeader from "@/components/ui/PageHeader";
import PageEmptyState from "@/components/ui/PageEmptyState";
import { useToast } from "@/components/ui/use-toast";
import { getDefaultAnswer } from "@/lib/formularios/formSchema";
import { validateAnswers } from "@/lib/formularios/formValidation";
import FormRenderer from "@/components/formularios/renderer/FormRenderer";

export default function ResponderFormulario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedProjectId } = useProject();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState({});
  const [respondente, setRespondente] = useState("");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const { data: formulario, isPending, isError } = useQuery({
    queryKey: ["formulario_digital", id],
    queryFn: async () => {
      const [result] = await entities.FormularioDigital.filter({ id });
      return result || null;
    },
    enabled: !!id,
  });

  const definition = formulario?.definicao;

  useEffect(() => {
    if (definition?.sections) {
      const defaults = {};
      definition.sections.forEach(sec => {
        sec.fields.forEach(f => { defaults[f.id] = getDefaultAnswer(f); });
      });
      setAnswers(defaults);
    }
  }, [definition]);

  const createMut = useMutation({
    mutationFn: payload => entities.FormularioResposta.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formulario_respostas"] });
      queryClient.invalidateQueries({ queryKey: ["formulario_respostas_count", selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ["formulario_respostas", id, selectedProjectId] });
      toast({ variant: "success", title: "Resposta enviada com sucesso!" });
      setSubmitted(true);
    },
    onError: () => toast({ variant: "destructive", title: "Erro ao enviar resposta." }),
  });

  function handleSubmit() {
    if (!definition) return;
    const { valid, errors: errs } = validateAnswers(definition, answers);
    if (!valid) {
      setErrors(errs);
      toast({ variant: "destructive", title: "Corrija os campos obrigatórios antes de enviar." });
      return;
    }
    createMut.mutate({
      formulario_id: id,
      projeto_id: selectedProjectId,
      respondente: respondente.trim() || null,
      answers,
    });
  }

  function handleFieldChange(fieldId, val) {
    setAnswers(prev => ({ ...prev, [fieldId]: val }));
    if (errors[fieldId]) {
      setErrors(prev => { const e = { ...prev }; delete e[fieldId]; return e; });
    }
  }

  // Sem projeto selecionado
  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <PageEmptyState icon={ClipboardList} description="Selecione um projeto para preencher o formulário." />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (isError || !formulario) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1 flex items-center justify-center text-status-critical">Formulário não encontrado.</div>
      </div>
    );
  }

  // Tela de confirmação pós-envio
  if (submitted) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-6">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center text-2xl">
            ✓
          </div>
          <h2 className="text-xl font-bold">Resposta enviada!</h2>
          <p className="text-muted-foreground">Sua resposta foi registrada com sucesso.</p>
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={() => { setSubmitted(false); setAnswers({}); setErrors({}); setRespondente(""); }}
              className="border border-border rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-muted/30"
            >
              Nova resposta
            </button>
            <button
              onClick={() => navigate(`/formularios/${id}/respostas`)}
              className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-primary/90"
            >
              Ver respostas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          {/* Cabeçalho do formulário */}
          <div className="bg-card border border-border border-t-[5px] border-t-primary rounded-xl p-5 mb-4">
            <h1 className="text-xl font-bold">{formulario.titulo}</h1>
            {formulario.descricao && (
              <p className="text-sm text-muted-foreground mt-2">{formulario.descricao}</p>
            )}
          </div>

          {/* Nome do respondente (opcional) */}
          <div className="bg-card border border-border rounded-xl p-4 mb-4">
            <label className="text-sm font-semibold block mb-2">Seu nome (opcional)</label>
            <input
              value={respondente}
              onChange={e => setRespondente(e.target.value)}
              placeholder="Digite seu nome..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
            />
          </div>

          <FormRenderer
            definition={definition}
            value={answers}
            onChange={handleFieldChange}
            errors={errors}
          />

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => navigate("/formularios")}
              className="border border-border rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-muted/30"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={createMut.isPending}
              className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {createMut.isPending ? "Enviando..." : "Enviar resposta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar no browser**

1. Navegar para um formulário ativo → clicar "Responder".
2. Deixar campo obrigatório vazio → clicar "Enviar" → mensagem de erro deve aparecer no campo.
3. Preencher tudo → clicar "Enviar" → toast de sucesso + tela de confirmação.
4. "Nova resposta" deve limpar o formulário.
5. "Ver respostas" deve navegar para `/formularios/:id/respostas`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Formularios/ResponderFormulario.jsx
git commit -m "feat(formularios): página ResponderFormulario com validação e confirmação"
```

---

## Task 16: Página RespostasFormulario

**Files:**
- Create: `src/pages/Formularios/RespostasFormulario.jsx`

- [ ] **Step 1: Criar a página**

```jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Eye } from "lucide-react";
import { entities } from "@/api/supabaseEntities";
import { useProject } from "@/lib/ProjectContext";
import PageHeader from "@/components/ui/PageHeader";
import PageEmptyState from "@/components/ui/PageEmptyState";
import RespostaView from "@/components/formularios/renderer/RespostaView";

function formatAnswer(field, val) {
  if (val === undefined || val === null || val === "") return "—";
  if (field.type === "multiple_choice" && Array.isArray(val)) {
    return val.map(v => field.options?.find(o => o.value === v)?.label || v).join(", ") || "—";
  }
  if (field.type === "single_choice" || field.type === "dropdown") {
    return field.options?.find(o => o.value === val)?.label || val;
  }
  if (field.type === "rating") {
    return val ? `${"★".repeat(val)}${"☆".repeat((field.max || 5) - val)}` : "—";
  }
  return String(val);
}

export default function RespostasFormulario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedProjectId } = useProject();
  const [viewing, setViewing] = useState(null);

  const { data: formulario } = useQuery({
    queryKey: ["formulario_digital", id],
    queryFn: async () => {
      const [result] = await entities.FormularioDigital.filter({ id });
      return result || null;
    },
    enabled: !!id,
  });

  const { data: respostas = [], isPending, isError } = useQuery({
    queryKey: ["formulario_respostas", id, selectedProjectId],
    queryFn: () => entities.FormularioResposta.filter({
      formulario_id: id,
      projeto_id: selectedProjectId,
    }),
    enabled: !!id && !!selectedProjectId,
  });

  const definition = formulario?.definicao;

  // Colunas dinâmicas: primeiros 4 campos não-section para exibição na tabela
  const columns = [];
  if (definition?.sections) {
    for (const sec of definition.sections) {
      for (const f of sec.fields) {
        if (f.type !== "section" && columns.length < 4) {
          columns.push(f);
        }
      }
    }
  }

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <PageEmptyState icon={ClipboardList} description="Selecione um projeto para ver as respostas." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold">{formulario?.titulo || "Respostas"}</h2>
            <p className="text-sm text-muted-foreground">
              {respostas.length} {respostas.length === 1 ? "resposta" : "respostas"} neste projeto
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/formularios")}
              className="border border-border rounded-lg px-3 py-2 text-sm font-semibold hover:bg-muted/30"
            >
              ← Voltar
            </button>
            <button
              onClick={() => navigate(`/formularios/${id}/responder`)}
              className="bg-primary text-white rounded-lg px-3 py-2 text-sm font-semibold hover:bg-primary/90"
            >
              ✎ Nova resposta
            </button>
          </div>
        </div>

        {/* Tabela de respostas */}
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">Respondente</th>
                {columns.map(col => (
                  <th key={col.id} className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold whitespace-nowrap">
                    {col.label || "(sem título)"}
                  </th>
                ))}
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">Enviado em</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isPending && (
                <tr><td colSpan={columns.length + 3} className="px-4 py-6 text-center text-muted-foreground">Carregando...</td></tr>
              )}
              {isError && (
                <tr><td colSpan={columns.length + 3} className="px-4 py-6 text-center text-status-critical">Erro ao carregar respostas.</td></tr>
              )}
              {!isPending && !isError && respostas.length === 0 && (
                <tr><td colSpan={columns.length + 3} className="px-4 py-6 text-center text-muted-foreground">Nenhuma resposta registrada neste projeto.</td></tr>
              )}
              {respostas.map(r => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{r.respondente || "—"}</td>
                  {columns.map(col => (
                    <td key={col.id} className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                      {formatAnswer(col, r.answers?.[col.id])}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setViewing(r)}
                      className="p-1.5 rounded-lg border border-border hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                      title="Ver resposta completa"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && (
        <RespostaView
          open={!!viewing}
          onClose={() => setViewing(null)}
          definition={definition}
          answers={viewing.answers}
          respondente={viewing.respondente}
          createdAt={viewing.created_at}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar o ciclo completo no browser**

1. Responder um formulário (Task 15). Navegar para "Ver respostas".
2. Tabela exibe os primeiros 4 campos como colunas dinâmicas.
3. Clicar 👁 em uma linha abre `RespostaView` com todas as respostas em modo leitura.
4. Trocar de projeto no seletor — a lista de respostas muda (isolamento por projeto).
5. Excluir a definição em Cadastros → confirmar que as respostas desaparecem (ON DELETE CASCADE).

- [ ] **Step 3: Commit**

```bash
git add src/pages/Formularios/RespostasFormulario.jsx
git commit -m "feat(formularios): página RespostasFormulario com colunas dinâmicas e RespostaView"
```

---

## Verificação Final Ponta-a-Ponta

- [ ] Rodar `npm run dev` sem erros de compilação.
- [ ] Sidebar: grupo "Formulários Digitais" visível abaixo de "Riscos".
- [ ] Ciclo de cadastro: Configurações → Cadastros → aba Formulários → Novo → builder → adicionar itens de cada tipo → drag-and-drop reordenação → Salvar → reabrir e confirmar persistência.
- [ ] Toggle Ativo/Inativo na lista de cadastro: formulário inativo não aparece em `/formularios`.
- [ ] Ciclo de preenchimento: `/formularios` → Responder → required vazio bloqueia → preencher e enviar → tela de confirmação.
- [ ] Ciclo de respostas: `/formularios/:id/respostas` → colunas dinâmicas → 👁 abre RespostaView → trocar projeto muda dados.
- [ ] Verificar via MCP (`mcp__supabase-integrada__execute_sql`): `SELECT COUNT(*) FROM formulario_respostas WHERE projeto_id = '<id>'`.

---

## .gitignore

Adicionar `.superpowers/` ao `.gitignore` se ainda não estiver lá:

```bash
grep -q ".superpowers" .gitignore || echo ".superpowers/" >> .gitignore
git add .gitignore
git commit -m "chore: ignorar .superpowers/ no git"
```
