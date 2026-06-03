# Design: Padronização de Botões "+ Novo / + Adicionar"

**Data:** 2026-06-03  
**Autor:** Designer Agent  
**Status:** Aprovado

---

## Problema

Botões de criação de registro (+ Novo, + Adicionar) não têm cor consistente. Alguns são verdes (`bg-emerald-600`), outros usam o token `primary` (azul no modo claro, ciano no modo escuro) ou `variant="outline"` sem preenchimento.

## Regra de design

| Tipo de botão | Estilo |
|---|---|
| Botão primário de criação (CTA de página/painel) | `bg-emerald-600 hover:bg-emerald-700 text-white` |
| Link-texto inline de adição dentro de formulário | `text-emerald-600 hover:text-emerald-700` |

## Abordagem

Correção direta, arquivo por arquivo. Sem novas abstrações. O padrão `bg-emerald-600 hover:bg-emerald-700 text-white` já é dominante no sistema (~21 botões corretos).

## Arquivos a corrigir

### Botões primários (fundo verde)

1. **`src/components/planejamento/TakeOffCommodities.jsx` linha 673**  
   Botão "Novo Item" com `<Button>` default → adicionar `className="bg-emerald-600 hover:bg-emerald-700 text-white"`

2. **`src/components/riscos/PlanoAcao.jsx` linha 156**  
   Botão "Nova Ação" com `<Button size="sm">` default → adicionar `className="bg-emerald-600 hover:bg-emerald-700 text-white"`

3. **`src/components/planejamento/PqpEditor.jsx` linha 126**  
   Botão "Adicionar item" com `variant="outline"` → remover outline, adicionar `className="bg-emerald-600 hover:bg-emerald-700 text-white"`

4. **`src/components/histograma/HistogramaTabela.jsx` linha 408**  
   Botão add função com `variant="outline"` → remover outline, adicionar `className="bg-emerald-600 hover:bg-emerald-700 text-white"`

5. **`src/components/engenharia/DocDetalhe.jsx` linha 132**  
   Botão "+ Nova Revisão" com `variant="outline"` → remover outline, adicionar `className="bg-emerald-600 hover:bg-emerald-700 text-white"`

6. **`src/components/agentes/ToolEditor.jsx` linha 159**  
   Botão "Adicionar" parâmetro com `variant="outline"` → remover outline, adicionar `className="bg-emerald-600 hover:bg-emerald-700 text-white"`

### Links-texto inline (cor verde, sem fundo)

7. **`src/components/rdo/RDOForm.jsx` linhas 394, 433, 521**  
   Botões "Adicionar função", "Adicionar equipamento", "Adicionar Ocorrência" com `text-blue-600 hover:underline` → substituir por `text-emerald-600 hover:text-emerald-700`

## Fora do escopo

- Botões de salvar/confirmar (usam `variant="save"` — correto, semântica diferente)
- Botões de cancelar, editar, excluir
- Botões de importar/exportar
- Os ~21 botões que já usam `bg-emerald-600` corretamente
