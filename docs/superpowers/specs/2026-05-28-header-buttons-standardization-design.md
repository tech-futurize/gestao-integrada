# Spec: Padronização dos Botões de Ação nos Headers

**Data:** 2026-05-28
**Autor:** Designer Agent
**Status:** Aprovado

---

## Problema

Os botões de ação (Novo, Importar/Exportar) nos `PageHeader` de cada módulo estão inconsistentes:

| Inconsistência | Exemplos |
|---|---|
| Tamanho misto | Suprimentos usa `size="sm"`, Contratos/Pleitos/Riscos não passam `size` (default ~36px) |
| Cor do botão "Novo" | Todos usam `bg-primary` (Cobalt) — DESIGN.md §9 especifica `bg-emerald-600` |
| Label "Importar" inconsistente | Avanços: `"Import/Export"` sem ícone · demais: `"Importar / Exportar"` com ícone Upload |
| Wrapper multi-botão inconsistente | `<>`, `<div className="flex gap-2">`, `<div className="flex items-center gap-2">` |

---

## Decisões de Design

| Decisão | Escolha | Justificativa |
|---|---|---|
| Tamanho | `size="sm"` em todos | Mais compacto no header; adotado pela maioria dos módulos |
| Cor do botão "Novo" | `bg-emerald-600 hover:bg-emerald-700 text-white` | Diferencia visualmente CTA de criação de botões de contexto; alinhado ao DESIGN.md §9 |
| Cor do botão "Importar" | `variant="outline"` | Ação secundária — não deve competir com o CTA principal |
| Label "Importar" | `"Importar / Exportar"` com ícone `Upload` | Consistência com a maioria dos módulos; ícone reforça a ação |
| Wrapper multi-botão | `<div className="flex items-center gap-2">` | Alinhamento vertical correto; gap uniforme |
| Abordagem de implementação | Edição direta em cada arquivo | Sem nova abstração; YAGNI; diff pequeno e revisável |

---

## Padrão Canônico

### Botão "Novo X"

```jsx
<Button
  size="sm"
  className="bg-emerald-600 hover:bg-emerald-700 text-white"
  onClick={handleOpenNew}
>
  <Plus className="w-4 h-4 mr-2" /> Novo [Nome]
</Button>
```

### Botão "Importar / Exportar"

```jsx
<Button
  size="sm"
  variant="outline"
  onClick={() => setShowImportExport(true)}
>
  <Upload className="w-4 h-4 mr-2" /> Importar / Exportar
</Button>
```

### Wrapper quando há múltiplos botões

```jsx
<div className="flex items-center gap-2">
  <Button size="sm" variant="outline" ...>...</Button>
  <Button size="sm" className="bg-emerald-600 ..." ...>...</Button>
</div>
```

### Quando há apenas um botão

Sem wrapper — passar o `<Button>` diretamente na prop `actions`.

---

## Escopo de Arquivos

| Arquivo | Mudanças necessárias |
|---|---|
| `src/pages/Engenharia/Documentos.jsx` | Adicionar `size="sm"` nos dois botões; adicionar `className` esmeralda no "Novo" |
| `src/pages/Suprimentos/MapaSuprimentos.jsx` | Adicionar `className` esmeralda no "Novo Item"; já tem `size="sm"` |
| `src/pages/Planejamento/SixWLA.jsx` | Adicionar `size="sm"` e `className` esmeralda no "Adicionar do Cronograma" |
| `src/pages/Planejamento/Avancos.jsx` | Corrigir label `"Import/Export"` → `"Importar / Exportar"`; adicionar ícone `Upload` |
| `src/pages/Planejamento/TakeOff.jsx` | Trocar ícone `FileSpreadsheet` → `Upload`; adicionar import `Upload`; `size="sm"` já presente |
| `src/pages/Planejamento/Cronograma.jsx` | Adicionar `size="sm"` no botão "Importar / Exportar"; toggles 6WLA/Baseline não mudam |
| `src/pages/Contratos.jsx` | Adicionar `size="sm"` e `className` esmeralda no "Novo Contrato" |
| `src/pages/AdminContratual/Medicoes.jsx` | Adicionar `className` esmeralda no "Nova Medição"; já tem `size="sm"` no Importar |
| `src/pages/AdminContratual/Pleitos.jsx` | Adicionar `size="sm"` e `className` esmeralda no "Novo Pleito" |
| `src/pages/RiscosMudancas/GestaoMudancas.jsx` | Adicionar `size="sm"` e `className` esmeralda no "Nova Mudança" |
| `src/pages/RiscosMudancas/GestaoRiscos.jsx` | Adicionar `size="sm"` e `className` esmeralda no "Novo Risco" |

---

## Fora do Escopo

- Botões dentro de formulários (Salvar, Cancelar, Excluir) — já padronizados em DESIGN.md §4
- Toggle de 6WLA e Baseline no Cronograma — são botões de estado de visualização, não CTAs de criação
- Módulos sem botões no header (Dashboard, Histograma, etc.)
- Nenhum novo componente deve ser criado

---

## Atualização no DESIGN.md

Após implementação, atualizar a seção "Tokens de Ação" do DESIGN.md para incluir o padrão do botão "Novo" no header (distinguindo de "Salvar" em formulários).
