# Spec — Reestruturação de Medições: Faturamento do Projeto × Medição de Subcontrato

> **Data:** 2026-06-02 · **Autor:** Architect · **Status:** Aguardando aprovação do PO
> **Referência externa:** módulos Contratos + Medições do projeto SGP (`/Users/viniciusgroth/Desktop/Projetos/SGP/sgp-main`), usados como inspiração visual/funcional — **não** como modelo a copiar.
> **ADR relacionado:** [ADR-0001](../../adrs/ADR-0001-medicao-subcontrato-vs-faturamento-projeto.md)

---

## 1. Contexto e Motivação

Hoje o sistema tem um único item **"Medições"** em `Adm. Contratual` (`/admin-contratual/medicoes`) que mistura dois conceitos distintos do mundo EPC:

- **Medir o subcontratado** — quanto um fornecedor/empreiteiro executou no período (natureza de **custo / contas a pagar**, escopo **por contrato**).
- **Medir o próprio projeto** — quanto a construtora avançou perante o cliente/dono da obra (natureza de **receita / faturamento**, escopo **por projeto**), que deveria alimentar o **Avanço Financeiro**.

Tratá-los como uma coisa só gera ambiguidade de navegação e impede a integração natural com o painel de Avanço Financeiro (que já vive em `Planejamento`). Além disso, as telas atuais de medição são pobres comparadas à referência do SGP: itens "flat", sem PQP hierárquica e sem importação de planilha.

**Resultado pretendido:** separar os dois conceitos em módulos próprios, com nomes que deixem a distinção óbvia, trazendo do SGP **apenas** a PQP hierárquica + importação de PQP + fluxo de lançamento — sem evidências, sem central de aprovações, sem IA e sem retenção. E ligar o **Faturamento** diretamente ao **Avanço Financeiro real**.

## 2. Decisões (consolidadas com o PO)

| # | Decisão |
|---|---------|
| D1 | **Renomear e separar:** `Faturamento` (novo, em **Planejamento**) = medição do projeto pela construtora. `Medições` = medição de **subcontratado**, que passa a viver **dentro do detalhe do Contrato** (Adm. Contratual). |
| D2 | **Remover** o item standalone `Medições` de `Adm. Contratual` (rota `/admin-contratual/medicoes`) — segue checklist de drop de módulo (L007). O **grupo** Adm. Contratual permanece (Contratos, RDOs, Registros, Pleitos, Mapa de Impacto). |
| D3 | **Integração:** o **Avanço Financeiro real** (`faturamento_realizado_mensal` na tabela `financeiro`) passa a ser **derivado** dos faturamentos lançados, por mês. O **Avanço Físico não muda**. |
| D4 | **Modelo de dados — caminho mais simples:** PQP/EAP armazenada como **JSONB** (árvore visual), sem tabela de itens com `parent_id`. Foco em registrar os itens, não em consultas complexas de árvore. Reavaliar robustez depois, se necessário. |
| D5 | **Escopo do SGP a trazer:** PQP hierárquica (visual) · importação de PQP (Excel) · lançamento por item-folha + cálculos. **Fora:** evidências/anexo de RDO · central de aprovações · análise de IA · retenção. |

## 3. Arquitetura-alvo de Navegação

```
Planejamento:    Cronograma · 6WLA · Take-Off · Histogramas · Avanços · Faturamento  ◄ NOVO
Adm. Contratual: Contratos (▸ aba "Medições" do subcontrato) · RDOs · Registros · Pleitos · Mapa de Impacto
                 └ item "Medições" standalone  ✗ REMOVIDO
```

Arquivos de navegação/rota: [src/lib/navigationConfig.js](../../../src/lib/navigationConfig.js) (linhas ~27-48), [src/App.jsx](../../../src/App.jsx).

## 4. Componente Reutilizável — `PqpEditor`

Ambos os módulos (Faturamento e Medição de subcontrato) compartilham o mesmo esqueleto. Extrair **um** componente reutilizável em `src/components/planejamento/` (ou `src/components/shared/`), parametrizado por contexto.

**Responsabilidades (uma só, clara):** renderizar/editar uma PQP hierárquica e calcular os totais de medição.

- **Entrada (props):** `itens` (JSONB árvore), `onChange`, `readOnly`, `onImport` (callback de importação de PQP).
- **Estrutura do item (JSONB):**
  ```jsonc
  {
    "item": "1.1.2",            // código EAP
    "descricao": "Concreto FCK 30",
    "unidade": "m³",
    "qtd_contratual": 1200,
    "preco_unitario": 450.00,
    "qtd_acumulada": 300,       // medido em períodos anteriores
    "qtd_medida": 150,          // período atual (editável)
    "children": [ /* … */ ]     // subníveis; folha não tem children
  }
  ```
- **Cálculos (derivados, nunca persistidos duplicados):**
  - `valor_medido = qtd_medida × preco_unitario`
  - `valor_acumulado = (qtd_acumulada + qtd_medida) × preco_unitario`
  - `saldo = qtd_contratual − (qtd_acumulada + qtd_medida)`
  - Totais somam **apenas folhas**, recursivamente (referência: `calcularTotais` do SGP).
- **Importação de PQP:** reaproveitar o fluxo já existente de import (`ImportExportDialog` / `column-mapping-dialog`) para popular `itens` a partir de Excel.
- **Expandir até nível N:** controle de profundidade da árvore.

## 5. Módulo Faturamento (Planejamento)

- **Rota:** `/planejamento/faturamento` · **Página:** `src/pages/Planejamento/Faturamento.jsx`.
- **Entidade nova:** `Faturamento` → tabela `faturamentos`.

| Campo | Tipo | Notas |
|---|---|---|
| id / projeto_id | UUID | FK projeto CASCADE |
| numero | TEXT | nº do faturamento (ex. "FAT-001") |
| mes_referencia | DATE | competência, normalizada `yyyy-MM-01` (igual ao `financeiro`) |
| itens | JSONB DEFAULT '[]' | PQP do projeto (árvore) |
| valor_medido | NUMERIC DEFAULT 0 | soma das folhas (read-only no front) |
| status | TEXT CHECK | `Elaboração` / `Concluído` (fluxo simples, sem aprovação) |
| observacoes | TEXT | |
| created_at / updated_at | TIMESTAMPTZ | |

- **Tela:** lista de faturamentos (cards) + filtros (nº, status, período) + formulário com `PqpEditor`. Estados loading/empty/error obrigatórios (L003). React Query com `queryKey` incluindo `selectedProjectId` e `enabled: !!selectedProjectId`.

## 6. Integração Faturamento → Avanço Financeiro

**Princípio:** o **Faturamento é a única fonte da verdade** do realizado financeiro (evita bug de escrita dupla — classe de erro L013–L016).

- Em [AvancoFinanceiroPanel.jsx](../../../src/components/planejamento/AvancoFinanceiroPanel.jsx), o campo `faturamento_realizado_mensal` (linha "Real") deixa de ser digitado e passa a ser **derivado em tempo de leitura**: para cada mês, `realizado = Σ valor_medido dos faturamentos com aquele mes_referencia`.
- A linha **"Real"** da tabela de Avanço Financeiro vira **read-only**, com dica ("origem: Faturamento") e atalho para o módulo.
- `Previsto` e `Projetado` permanecem editáveis como hoje. O **Avanço Físico não é tocado**.
- A série de curva S/KPIs continua usando `computeAvancoSeries` ([avancoSeries.js](../../../src/components/planejamento/avancoSeries.js)) — muda apenas a origem do valor `real`.

> **Verificação obrigatória pelo Builder (L016):** confirmar no banco real os nomes de coluna de `financeiro` (`faturamento_realizado_mensal`, `mes_referencia`) antes de escrever — a `supabase-migration.sql` está desatualizada e não é fonte da verdade.

## 7. Módulo Medição de Subcontrato (dentro de Contratos)

- A medição do subcontratado deixa de ter página própria e vira **aba/seção no detalhe do Contrato** ([ContratoDetalhes.jsx](../../../src/components/contratos/ContratoDetalhes.jsx)), reusando o `PqpEditor`.
- Mantém a entidade `Medicao` (tabela `medicoes`) já existente; itens passam a usar a mesma estrutura JSONB hierárquica do `PqpEditor` (hoje são flat em `MedicaoForm.jsx`).
- **Drop do módulo standalone** (checklist L007): remover componente/página `src/pages/AdminContratual/Medicoes.jsx`, rota em `App.jsx`, item em `navigationConfig.js`, e revisar referências (`grep -r "admin-contratual/medicoes" src/`). A entidade `Medicao` no `TABLE_MAP` **permanece** (continua usada dentro do contrato).

## 7.1 Telas do Módulo de Contratos — UI (brainstorm visual 2026-06-02)

Decisões de interface validadas tela a tela com o PO (Visual Companion). Mockups persistidos em `.superpowers/brainstorm/`.

### Estrutura geral
- **Detalhe do Contrato = 4 abas:** `Visão Geral · PQP · Medições · Aditivos`. **Sem** aba de Documentos.
- 🔒 **Regra de contexto:** ao entrar no Detalhe de um contrato, os **KPIs agregados da Lista** (Total contratado, Em andamento, Medido geral) **desaparecem**. O Detalhe exibe **apenas** indicadores **daquele** contrato (valor total, % medido, saldo, fornecedor, vigência) — nunca totais globais persistentes, para não confundir o individual com o agregado.

### Tela 1 — Lista de Contratos
- Formato **Cards** (um card por contrato: objeto, fornecedor, valor, status, barra de % medido).
- Topo: **KPIs gerais** (Total contratado · Em andamento · Medido geral) + **filtros** (busca por objeto/fornecedor, status, tipo, período) + botão **Novo Contrato**.

### Aba Visão Geral
- Layout em **seções empilhadas** (largura total): **Identificação · Valores · Prazo · Gestão**.
- **Campos:** Nº · Objeto · Fornecedor · CNPJ · Tipo (Serviços/Fornecimento/Fornec.+Serviço) · **Modalidade (Preço unitário × Global/Lump Sum)** · **Origem (orçamento/proposta)** · Valor original · Σ Aditivos · Valor total (calc.) · Data assinatura · Início · Término · Término com aditivos (calc.) · Gestor · Centro de custo · Observações.
- `Modalidade` e `Origem` são novos campos (ver §11 — ajuste de schema de `contratos`).

### Aba PQP
- Tabela em **árvore EAP** (1 → 1.1 → 1.1.1). **Níveis-pai mostram subtotal somado** dos filhos; rodapé com TOTAL DO CONTRATO.
- Barra de ações: **Importar Excel/CSV** · Adicionar item · **Expandir até nível N** · Exportar.
- **Estado vazio:** CTA "Importar Excel/CSV" + "Adicionar manual".
- É a **definição** do escopo/preços (sem medição). Renderizada pelo `PqpEditor` em modo definição (`readOnly` nas colunas de medição).

### Aba Medições (subcontrato)
- **Estrutura "Histórico + editor":** lista de períodos (M-001, M-002…) com Nº · Período · Valor medido · % do período · Status; topo com **Acumulado medido (R$ e %)** + botão **Nova Medição**. Clicar numa medição abre o **editor em tela cheia**.
- **Status simples:** `Elaboração → Concluído` (sem aprovação).
- **Editor de lançamento** (`PqpEditor` em modo medição):
  - Cabeçalho com 3 KPIs: **Acumulado · Medido no período · Avanço financeiro (% + barra)**; ações **Salvar rascunho** / **Concluir medição**.
  - **Tabela completa** (densidade alta): Item · Descrição · **Contratual** · **Acumulada** · **Saldo** · **Qtd. medida (input destacado)** · Preço unit. · **Valor medido** · Valor acumulado. Scroll horizontal aceitável.
  - `qtd_medida` é o único campo editável; o resto é derivado (`pqpUtils`).

### Aba Aditivos
- **Tabela com impactos:** Nº · Tipo (Valor / Prazo / Valor e Prazo / Escopo) · Data assinatura · **Δ Valor** · **Δ Prazo** · Status (Pendente / Assinado / Cancelado) · ações.
- **Rodapé soma apenas aditivos `Assinado`** → alimenta Valor Total e "Término com aditivos" da Visão Geral.

## 8. Fora de Escopo (YAGNI)

Evidências / anexo de RDO · central de aprovações com papéis · análise de IA · retenção (valor bruto/líquido) · tabela de itens com `parent_id` · paginação server-side · **aba de Documentos**.

## 9. Critérios de Aceitação

1. Item **Faturamento** aparece em Planejamento; rota `/planejamento/faturamento` funcional com lista + formulário PQP + importação.
2. Item **Medições** some de Adm. Contratual; medição de subcontrato acessível como aba dentro do Contrato; sem rota/refs órfãs (`grep` limpo).
3. `PqpEditor` reutilizado nos dois contextos, com cálculos corretos (medido/acumulado/saldo/% avanço) somando só folhas.
4. Avanço Financeiro **Real** reflete a soma dos faturamentos por mês; linha Real read-only; Físico inalterado.
5. Importação de PQP via Excel popula a árvore JSONB corretamente.
6. Loading/empty/error em todas as telas novas; `queryKey` com `selectedProjectId`.
7. `npm run build` sem erros; `/audit` ≥ 9; RLS validado nas tabelas novas/alteradas.
8. Detalhe do Contrato com 4 abas (Visão Geral · PQP · Medições · Aditivos); KPIs gerais da Lista **não** aparecem no Detalhe (só indicadores do contrato).
9. Aba Medições: histórico de períodos → editor em tela cheia (tabela completa, `qtd_medida` destacada); status Elaboração→Concluído. Aba Aditivos: rodapé soma só `Assinado`. Aba Visão Geral exibe `modalidade`, `origem`, `centro_custo` e `observacoes`.

## 10. Riscos e Pontos de Atenção

- **Migração de dados:** medições existentes em `medicoes` (itens flat) precisam ser lidas pelo novo `PqpEditor` — prever compatibilidade (item flat = folha sem `children`).
- **Derivação read-time vs performance:** somar faturamentos por mês a cada render é barato para volumes esperados; reavaliar se crescer.
- **Schema real desatualizado** (L013–L016): toda escrita deve usar nomes de coluna verificados no banco.

## 11. Ajuste de schema — tabela `contratos`

Para os campos novos da Visão Geral, adicionar à tabela `contratos` (verificar nomes reais antes — L016):

| Coluna | Tipo | Notas |
|---|---|---|
| `modalidade` | TEXT CHECK (`'Preço unitário'`, `'Global'`) | Preço unitário × Global/Lump Sum. Informativo nesta fase (não altera a lógica de medição por quantidade). |
| `origem` | TEXT | Vínculo textual com orçamento/proposta de origem (ex.: "ORC-0042"). Sem FK nesta fase. |

Demais campos da Visão Geral já existem em `contratos` (ver mapeamento em §7 e no relatório de exploração). `centro_custo` e `observacoes` — hoje capturados mas não exibidos — passam a aparecer na aba Visão Geral.
