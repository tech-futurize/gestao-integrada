# Spec — Redesign Modal Documento de Engenharia

**Data:** 2026-05-14
**Módulo:** `src/pages/Engenharia/Documentos.jsx`
**Tipo:** Visual / UX
**Status:** Aprovado pelo usuário

---

## Problema

O modal atual de criação/edição de documento é um `Dialog` shadcn genérico com 13 campos em grid 2 colunas sem qualquer hierarquia visual. Não há:
- Identidade visual do sistema (cores FuturizeNow)
- Agrupamento lógico dos campos
- Diferenciação entre modo "Novo" e "Editar"
- Feedback visual de progresso ou etapa dentro do formulário

## Solução Aprovada — Abordagem B

Modal centralizado (mantém `Dialog`) com header estilizado e campos agrupados em 4 seções coloridas.

---

## Design

### Header

**Novo Documento:**
- Barra vertical ciano (`#26FFFF`, 4px) à esquerda do título
- Ícone de documento em `bg-green-50` com borda `emerald-600`
- Título: "Novo Documento" (bold, `text-foreground`)
- Subtítulo: "Engenharia de Documentos" (`text-muted-foreground`)

**Editar Documento:**
- Barra vertical verde (`emerald-600`) à esquerda
- Background do header: `bg-green-50` (tênue, indica modo edição)
- Título: "Editar Documento"
- Subtítulo: `tag_id — titulo` do documento (truncado, `font-mono`)
- Badge da etapa atual no canto direito do header (com a cor da etapa)

### Seções (4 grupos)

Cada seção tem: quadrado colorido + label uppercase + linha separadora horizontal.

| Seção | Cor | Campos |
|---|---|---|
| Identificação | `sky-500` (`#0ea5e9`) | TAG/ID *, Título *, Disciplina, Fornecedor |
| Detalhes Técnicos | `violet-500` (`#8b5cf6`) | Etapa (colorida), Prioridade, Revisão Atual, Nº Folhas, Progresso |
| Datas | `amber-500` (`#f59e0b`) | Data Projetada, Data Real |
| Vínculo ao Cronograma | `emerald-500` (`#10b981`) | Tarefa do Cronograma (select), Data Cronograma (read-only) |

### Campos com tratamento especial

**Etapa:** `SelectTrigger` com `style` dinâmico — fundo e texto mudam conforme `ETAPA_COLORS[form.etapa]`.

**Disciplina:** `SelectTrigger` mostra badge colorido com a cor de `DISC_COLORS[form.disciplina]` antes do texto.

**Progresso:** Barra visual (`h-1.5`, verde) + input numérico compacto lado a lado em `col-span-2`.

**Data Cronograma:** Input `readOnly` com `bg-muted cursor-not-allowed`, label com hint "(automática)".

### Footer

- `border-top` + `bg-muted/30`
- Botão Cancelar: `variant="outline"`
- Botão Salvar: `bg-emerald-600 hover:bg-emerald-700 text-white` (padrão do design system)
- Texto do botão: "Criar documento" (novo) / "Salvar alterações" (edição)

### Largura e scroll

- `sm:max-w-2xl` mantido
- `max-h-[75vh] overflow-y-auto` no corpo das seções

---

## Arquivo a modificar

- `src/pages/Engenharia/Documentos.jsx` — apenas o bloco `{/* Modal Criação/Edição */}` (linhas ~473–563)

## O que NÃO muda

- Lógica de negócio (`handleSubmit`, mutations, `handleSelectCronograma`)
- Estrutura do `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter`
- Todos os campos existentes (nenhum campo é removido ou adicionado)
- Comportamento de abertura/fechamento
