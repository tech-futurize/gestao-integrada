# Spec: M11 Registros — REG-1 + REG-2

**Data:** 2026-05-28  
**Milestone:** M11 — Registros (AdminContratual)  
**Tasks:** REG-1 (filtros + remover Hora) e REG-2 (anexo de arquivo + Vincular Atividades)

---

## Contexto

O módulo Registros (`src/pages/AdminContratual/Registros.jsx`) exibe cards de registros contratuais (Atas de Reunião, E-mails, Notificações). O formulário de criação/edição está em `src/components/pleitos/RegistroForm.jsx`.

**Schema real da tabela `registros` (prod):**
- Colunas existentes: `id, projeto_id, data_hora (timestamptz), descricao, impacto_preliminar, probabilidade, gravidade, status, responsavel_registro, pleito_id, created_at, updated_at, atividades_vinculadas (jsonb), anexos (jsonb)`
- Colunas ausentes que o código já referencia: `tipo_registro`, `responsabilidade`
- Nenhum bucket de storage existe ainda

---

## REG-1 — Filtros Responsabilidade + Período; Remover Campo Hora

### 1.1 Migração de Schema

Arquivo: `docs/database/supabase-migration-m11-registros.sql`

```sql
ALTER TABLE registros ADD COLUMN IF NOT EXISTS tipo_registro TEXT DEFAULT 'Ata de Reunião';
ALTER TABLE registros ADD COLUMN IF NOT EXISTS responsabilidade TEXT;
```

Aplicar via Supabase MCP (`apply_migration`).

### 1.2 RegistroForm.jsx — Campo Data (sem Hora)

- Linha 114–116: trocar `type="datetime-local"` → `type="date"`
- `formData.data_hora` inicial: derivar apenas `YYYY-MM-DD` a partir de `incidente?.data_hora` (ex: `incidente?.data_hora?.slice(0, 10) || new Date().toISOString().slice(0, 10)`)
- Remover dependência de `toDatetimeLocal` para esse campo
- No `handleSubmit`: salvar `data_hora` como ISO string de meia-noite UTC: `new Date(formData.data_hora).toISOString()`

### 1.3 Registros.jsx — Novos Filtros

**Estado novo:**
```js
const [dateFrom, setDateFrom] = useState("");
const [dateTo, setDateTo] = useState("");
```

**FilterBar:** adicionar opção de responsabilidade:
```js
{ key: "responsabilidade", label: "Responsabilidade", options: ["Contratada", "Contratante"] }
```

**Inputs de período:** dois `<Input type="date">` na mesma linha dos filtros:
- Label "De" → `dateFrom`
- Label "Até" → `dateTo`

**filtered useMemo:** adicionar condições:
```js
const resp = filtros.responsabilidade || [];
if (resp.length > 0 && !resp.includes(inc.responsabilidade)) return false;
if (dateFrom && inc.data_hora && new Date(inc.data_hora) < new Date(dateFrom)) return false;
if (dateTo && inc.data_hora && new Date(inc.data_hora) > new Date(dateTo + "T23:59:59")) return false;
```

**Exibição nos cards:** `dataFormatada` usa `format(new Date(inc.data_hora), "dd/MM/yyyy")` (sem hora).

---

## REG-2 — Suporte a Anexo de Arquivo + Botão "Vincular Atividades"

### 2.1 Storage — Bucket `registros-anexos`

Criar via migração SQL:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('registros-anexos', 'registros-anexos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: usuários autenticados podem fazer upload
CREATE POLICY "Authenticated users can upload registros-anexos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'registros-anexos');

CREATE POLICY "Public read registros-anexos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'registros-anexos');

CREATE POLICY "Authenticated users can delete own registros-anexos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'registros-anexos');
```

**Path dos objetos:** `{projeto_id}/{uuid}-{nomeOriginalSanitizado}`

### 2.2 RegistroForm.jsx — Seção Anexos

**Props novas:**
- `tarefas: []` — array de tarefas_cronograma para o modal
- `selectedProjectId: string` — para path do storage

**Estado novo:**
```js
const [newFiles, setNewFiles] = useState([]);            // File[] aguardando upload
const [existingAnexos, setExistingAnexos] = useState(incidente?.anexos || []);  // já salvos
const [atividadesVinculadas, setAtividadesVinculadas] = useState(incidente?.atividades_vinculadas || []);
const [showAtivModal, setShowAtivModal] = useState(false);
```

**UI — Seção Anexos** (antes dos botões de submit):
```
Label: "Anexos"
[Adicionar arquivo]  ← botão outline que abre input file hidden (multiple)

Lista de existingAnexos:
  📎 nome.pdf  12 KB  [×]  ← botão × remove do estado e marca para deleção

Lista de newFiles:
  📎 relatorio.docx  45 KB  [×]  ← botão × remove do newFiles state
```

**handleSubmit atualizado:**
1. Para cada arquivo em `newFiles`: `supabase.storage.from('registros-anexos').upload(path, file)` → obter public URL
2. Para cada `existingAnexo` removido: `supabase.storage.from('registros-anexos').remove([extractPath(url)])`
3. Montar payload: `anexos: [...existingAnexos, ...uploadedUrls]`
4. Incluir `atividades_vinculadas: atividadesVinculadas`

**Schema de cada item em `anexos`:**
```js
{ nome: string, url: string, tipo: string, tamanho: number }
```

### 2.3 RegistroForm.jsx — Botão "Vincular Atividades"

**Posição:** entre o campo "Ocorrências" e o grid "Responsabilidade/Status".

**UI do botão:**
```jsx
<Button type="button" variant="outline" onClick={() => setShowAtivModal(true)}>
  <Link2 className="w-4 h-4 mr-2" />
  Vincular Atividades
  {atividadesVinculadas.length > 0 && (
    <Badge className="ml-2">{atividadesVinculadas.length}</Badge>
  )}
</Button>
```

**Modal (Dialog do shadcn):**
- Título: "Vincular Atividades ao Cronograma"
- Input de busca filtra tarefas por nome
- Lista com `Checkbox` por tarefa (multi-select)
- Estado interno do modal: `selectedIds: Set<string>`, inicializado com IDs já vinculados
- Botões: "Cancelar" e "Confirmar seleção"
- Ao confirmar: `setAtividadesVinculadas(selectedTarefas.map(t => ({ id: t.id, nome: t.nome || t.titulo || t.descricao })))`

**Schema de cada item em `atividades_vinculadas`:**
```js
{ id: string, nome: string }
```

### 2.4 Registros.jsx — Atualizações

**Carregar tarefas:**
```js
const { data: tarefas = [] } = useQuery({
  queryKey: ["tarefas_cronograma", selectedProjectId],
  queryFn: () => entities.TarefaCronograma.filter({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId,
});
```

**Passar para o form:**
```jsx
<RegistroForm
  ...
  tarefas={tarefas}
  selectedProjectId={selectedProjectId}
/>
```

**Cards — chips de contexto** (no footer, junto ao responsável):
```jsx
{inc.anexos?.length > 0 && (
  <span title="Anexos" className="text-xs text-muted-foreground">📎 {inc.anexos.length}</span>
)}
{inc.atividades_vinculadas?.length > 0 && (
  <span title="Atividades vinculadas" className="text-xs text-muted-foreground">🔗 {inc.atividades_vinculadas.length}</span>
)}
```

---

## Arquivos Afetados

| Arquivo | Tipo de mudança |
|---------|----------------|
| `docs/database/supabase-migration-m11-registros.sql` | Novo — migração schema + storage |
| `src/pages/AdminContratual/Registros.jsx` | Editar — filtros Responsabilidade/Período, tarefas query, chips nos cards |
| `src/components/pleitos/RegistroForm.jsx` | Editar — campo date, seção anexos, modal vincular atividades |

---

## Dependências e Riscos

- **Sem alteração no RDOModule.jsx** — o RDO tem seu próprio formulário e não usa `RegistroForm`
- **Upload pode falhar**: `handleSubmit` deve tratar erro de upload separadamente (toast de erro) sem bloquear o save do registro em si
- **Remoção de anexos**: extrair path da URL pública para fazer `storage.remove()` — usar regex sobre a URL do bucket
- **tarefas_cronograma pode estar vazia**: modal deve exibir empty state "Nenhuma tarefa no cronograma"
