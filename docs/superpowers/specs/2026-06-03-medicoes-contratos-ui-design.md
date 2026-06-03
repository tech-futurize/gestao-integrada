# Spec: Melhorias UI — Módulo Medições e Listagem de Contratos

**Data:** 2026-06-03  
**Autor:** Agent_Designer  
**Status:** Aprovado pelo usuário

---

## Escopo

Melhorias visuais e funcionais em dois módulos: (1) detalhe do contrato com foco na aba Medições e card-resumo, e (2) listagem de contratos com filtros e cards.

---

## 1. PqpEditor — Remover setas do input "Qtd. medida"

**Arquivo:** `src/components/planejamento/PqpEditor.jsx`  
**Linha relevante:** ~L196–201

O campo `<Input type="number">` no modo `medicao` exibe setas nativas do browser (spin buttons). Estas devem ser removidas adicionando classes Tailwind ao `className` do input:

```
[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
```

Somente o campo `qtd_medida` no modo `medicao` é afetado. Todos os outros inputs numéricos permanecem inalterados.

---

## 2. PqpEditor — Botão "Importar" → "Exportar / Importar" + lógica de medição

**Arquivo:** `src/components/planejamento/PqpEditor.jsx`  
**Arquivo secundário:** `src/components/ui/import-export-dialog.jsx`

### 2a. Renomear botão

O botão "Importar Excel/CSV" (ícone `Upload`) passa a se chamar **"Exportar / Importar"** com ícone `Download` (ou duplo `Download`/`Upload`).

### 2b. Colunas separadas por modo

Definir duas constantes de colunas:

```js
// Modo definição — comportamento atual preservado
const PQP_IMPORT_COLUMNS = [
  { key: "item",           label: "Item (EAP)",     type: "string",  required: true },
  { key: "descricao",      label: "Descrição",      type: "string"  },
  { key: "unidade",        label: "Unidade",        type: "string"  },
  { key: "qtd_contratual", label: "Quantidade",     type: "number"  },
  { key: "preco_unitario", label: "Preço unitário", type: "number"  },
];

// Modo medição — somente item e qtd_medida no mapping de importação
const MEDICAO_IMPORT_COLUMNS = [
  { key: "item",       label: "Item (EAP)",    type: "string", required: true },
  { key: "qtd_medida", label: "Qtd. medida",   type: "number" },
];

// Colunas completas exportadas no modo medição (referência visual para o usuário)
const MEDICAO_EXPORT_COLUMNS = [
  { key: "item",           label: "Item (EAP)"       },
  { key: "descricao",      label: "Descrição"        },
  { key: "unidade",        label: "Unidade"          },
  { key: "qtd_contratual", label: "Qtd. Contratual"  },
  { key: "qtd_acumulada",  label: "Qtd. Acumulada"   },
  { key: "qtd_medida",     label: "Qtd. medida"      }, // preenchido pelo usuário
];
```

### 2c. Lógica de importação no modo medição

No modo `definicao`, a importação reconstrói a árvore via `buildTreeFromFlat` — comportamento atual preservado.

No modo `medicao`, a importação **não reconstrói a árvore**. Cada linha importada atualiza apenas o campo `qtd_medida` do nó correspondente (match por `item`), usando a função `updateNode` já existente.

O handler usa o mesmo `importBuffer.current` para acumular linhas, mas em vez de `buildTreeFromFlat`, aplica todas as atualizações acumuladas sobre `itens` (prop atual):

```js
const handleImportRowMedicao = (row) => {
  importBuffer.current.push(row);
  // Aplica TODAS as linhas do buffer sobre itens para evitar closure stale
  let updated = itens;
  importBuffer.current.forEach((r) => {
    updated = updateNode(updated, r.item, { qtd_medida: r.qtd_medida ?? 0 });
  });
  onChange?.(updated);
};
```

`openImport` já reseta `importBuffer.current = []` — nenhuma mudança necessária ali.

Seleção condicional do handler em PqpEditor:
```js
const handleImportRow = isMedicao ? handleImportRowMedicao : handleImportRowDefinicao;
```

### 2d. Prop `exportColumns` no ImportExportDialog

Adicionar prop `exportColumns` (opcional, default = `columns`) ao `ImportExportDialog`. O `handleExport` usa `exportColumns` para gerar as colunas da planilha, enquanto `columns` continua sendo usado somente no mapping de importação.

```js
// ImportExportDialog.jsx
export function ImportExportDialog({ ..., exportColumns }) {
  const resolvedExportColumns = exportColumns ?? columns;
  // handleExport usa resolvedExportColumns
}
```

---

## 3. ContratoDetalhes — Cores do card-resumo

**Arquivo:** `src/components/contratos/ContratoDetalhes.jsx`

| Elemento | Antes | Depois |
|----------|-------|--------|
| Valor Total | `text-ocre` | `text-status-positive` (verde) |
| Saldo | `text-status-positive` quando positivo | sempre `text-status-critical` (vermelho) |

O saldo é sempre exibido em vermelho para indicar obrigação financeira pendente, independentemente de ser positivo ou negativo.

---

## 4. ContratoDetalhes — Datas ajustadas por aditivos assinados

**Arquivo:** `src/components/contratos/ContratoDetalhes.jsx`

### Antes

```
Início → Término Original: 01/01/2024 → 31/12/2024
[linha extra âmbar] Término Atual: 15/02/2025   ← só quando diferente
```

### Depois

```
Início → Término: 01/01/2024 → 15/02/2025
```

- Label muda de "Início → Término Original" para **"Início → Término"**
- O término exibido já é o ajustado (`terminoAtual` já calculado no componente via `totalPrazoDias`)
- A linha extra "Término Atual" é removida
- A lógica de cálculo (`addDaysToDate`, `totalPrazoDias`) permanece idêntica

---

## 5. ContratoDetalhes — Aditivos assinados ao lado do saldo

**Arquivo:** `src/components/contratos/ContratoDetalhes.jsx`

Adicionar ao bloco do saldo um badge/texto mostrando a contagem de aditivos com `status === "Assinado"`. Exibido abaixo ou ao lado do valor do saldo. Aparece apenas quando `aditivosAssinados.length > 0`.

```
Saldo
R$ 450.000,00   [3 aditivos]
```

Estilo do badge: `text-xs`, fundo `bg-muted`, texto `text-muted-foreground`, bordas arredondadas. Número em `font-semibold`.

---

## 6. Botões verdes (variant="save")

Todos os botões de ação primária devem usar `variant="save"` (já mapeado para `bg-action-save` = verde no design system).

| Arquivo | Botão atual | Mudança |
|---------|------------|---------|
| `ContratoPQP.jsx` L28 | `<Button size="sm">` (default = navy) | `variant="save"` |
| `ContratoMedicoes.jsx` L52 | `variant="outline"` | `variant="save"` |
| `ContratoAditivos.jsx` L55 | `variant="outline"` | `variant="save"` |
| `FormDialog.jsx` | `variant="save"` ✓ | sem mudança |

---

## 7. Contratos.jsx — Filtro "Data Início" → "Período"

**Arquivo:** `src/pages/Contratos.jsx`

### Label

`DateRangePicker label="Data Início"` → `label="Período"`

### Lógica de filtro

**Antes:** filtra contratos com `data_inicio` dentro do intervalo selecionado.

**Depois:** filtra contratos cujo período (`data_inicio → data_fim`) **se sobrepõe** ao intervalo selecionado:

```js
if (periodo?.from) {
  const fromStr = periodo.from.toISOString().split("T")[0];
  // contrato termina depois do início do filtro
  r = r.filter((c) => !c.data_fim || c.data_fim >= fromStr);
}
if (periodo?.to) {
  const toStr = periodo.to.toISOString().split("T")[0];
  // contrato começa antes do fim do filtro
  r = r.filter((c) => !c.data_inicio || c.data_inicio <= toStr);
}
```

Contratos sem `data_fim` são sempre incluídos quando `from` é definido (contrato aberto pode estar ativo). Contratos sem `data_inicio` são incluídos quando `to` é definido.

---

## 8. Contratos.jsx — Query de aditivos do projeto

**Arquivo:** `src/pages/Contratos.jsx`

Adicionar query para carregar todos os aditivos do projeto. Usar o mesmo padrão das outras queries:

```js
const { data: todosAditivos = [] } = useQuery({
  queryKey: ["aditivos", "projeto", selectedProjectId],
  queryFn: () => entities.Aditivo.filter({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId,
});
```

Passar `aditivos={todosAditivos}` como prop para `<ContratosList>`.

---

## 9. ContratosList — Valor verde + ajuste por aditivos + contador

**Arquivo:** `src/components/contratos/ContratosList.jsx`

### 9a. Nova prop

`ContratosList` passa a receber `aditivos = []` como prop.

### 9b. Cálculos por card

Para cada contrato `c`, calcular localmente (inline no map):

```js
const aditivosDoContrato = aditivos.filter(
  (a) => a.contrato_id === c.id && a.status === "Assinado"
);
const valorAjustado = (c.valor_total || 0) + aditivosDoContrato.reduce((s, a) => s + (a.valor || 0), 0);
const prazoDias = aditivosDoContrato.reduce((s, a) => s + (a.prazo_dias || 0), 0);
const terminoAjustado = prazoDias > 0
  ? addDaysToDate(c.data_fim, prazoDias)
  : c.data_fim;
```

A função `addDaysToDate` já existe em `ContratoDetalhes.jsx` — extrair para `src/lib/dateUtils.js` ou duplicar inline.

### 9c. Renderização atualizada

```
[antes]  <p className="font-bold text-base text-ocre">{fmt(c.valor_total)}</p>
[depois] <p className="font-bold text-base text-status-positive">{fmt(valorAjustado)}</p>

[antes]  {formatDate(c.data_inicio)} → {formatDate(c.data_fim)}
[depois] {formatDate(c.data_inicio)} → {formatDate(terminoAjustado)}

[novo]   {aditivosDoContrato.length > 0 && (
           <p className="text-xs text-muted-foreground mt-0.5">
             <span className="font-semibold text-foreground">{aditivosDoContrato.length}</span>
             {" "}aditivo{aditivosDoContrato.length !== 1 ? "s" : ""} assinado{aditivosDoContrato.length !== 1 ? "s" : ""}
           </p>
         )}
```

---

## Arquivos Modificados (resumo)

| Arquivo | Tipo de mudança |
|---------|----------------|
| `src/components/planejamento/PqpEditor.jsx` | Input sem setas; botão renomeado; colunas e handler por modo |
| `src/components/ui/import-export-dialog.jsx` | Nova prop `exportColumns` |
| `src/components/contratos/ContratoDetalhes.jsx` | Cores; label datas; remoção linha extra; badge aditivos |
| `src/components/contratos/ContratoPQP.jsx` | `variant="save"` no botão |
| `src/components/contratos/ContratoMedicoes.jsx` | `variant="save"` no botão |
| `src/components/contratos/ContratoAditivos.jsx` | `variant="save"` no botão |
| `src/pages/Contratos.jsx` | Label filtro; lógica filtro período; query aditivos |
| `src/components/contratos/ContratosList.jsx` | Valor verde + aditivos; datas ajustadas; contador |
| `src/lib/dateUtils.js` | Extrair `addDaysToDate` (se necessário) |

---

## Não está no escopo

- Mudanças em banco de dados ou schema
- Mudanças em lógica de negócio (cálculos de PQP, status de medições)
- Módulos fora de Contratos/Medições
- Novos componentes de UI
