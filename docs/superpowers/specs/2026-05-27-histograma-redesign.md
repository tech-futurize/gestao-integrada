# Spec: Histograma MO + Equipamentos — Redesign

**Data:** 2026-05-27  
**Módulo:** Planejamento › Histograma (`/planejamento/histograma`)  
**Status:** Aprovado pelo PO

---

## 1. Contexto

O módulo Histograma atualmente só exibe Equipamentos via `HistogramaEquipamentos.jsx`, usando a tabela `histogramas` com campo `tipo_equipamento`. O redesign adiciona suporte a Mão de Obra (funções), unifica o schema, e entrega uma tabela com scroll horizontal por mês, toggle de visibilidade de colunas, gráfico combinado e import/export.

---

## 2. Schema

### Migration em `histogramas`

```sql
-- Adiciona discriminador de tipo
ALTER TABLE histogramas
  ADD COLUMN tipo TEXT NOT NULL DEFAULT 'Equipamento';

-- Campo unificado para nome do recurso (função ou tipo de equipamento)
ALTER TABLE histogramas
  ADD COLUMN nome_recurso TEXT;

-- Migra dados existentes
UPDATE histogramas
  SET nome_recurso = tipo_equipamento
  WHERE tipo_equipamento IS NOT NULL;

-- Campo de quantidade projetada (meses futuros)
ALTER TABLE histogramas
  ADD COLUMN qtd_projetado NUMERIC DEFAULT 0;

-- Remove coluna semânticamente incorreta após migração
ALTER TABLE histogramas
  DROP COLUMN tipo_equipamento;
```

### Campos resultantes da tabela `histogramas`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | UUID PK | |
| `projeto_id` | UUID FK → projetos | CASCADE |
| `tipo` | TEXT NOT NULL | `'MO'` ou `'Equipamento'` |
| `nome_recurso` | TEXT NOT NULL | Função (MO) ou tipo de equipamento |
| `mes_referencia` | DATE NOT NULL | Primeiro dia do mês (`YYYY-MM-01`) |
| `quantidade_prevista_mensal` | NUMERIC | Previsto original |
| `quantidade_realizada_mensal` | NUMERIC | Real — só editável para `mes_referencia ≤ hoje` |
| `qtd_projetado` | NUMERIC DEFAULT 0 | Projeção futura — zerado ao salvar Real do mesmo mês |

### Campos calculados client-side (não armazenados)

- `qtd_prev_acumulado` — running sum de `quantidade_prevista_mensal` ordenado por `mes_referencia`
- `qtd_real_acumulado` — running sum de `quantidade_realizada_mensal`
- `qtd_proj_acumulado` — running sum de `qtd_projetado`

### `supabaseEntities.js`

Entidade `Histograma` já existe mapeada para `histogramas`. Atualizar campos expostos para incluir `tipo`, `nome_recurso`, `qtd_projetado`. Remover `tipo_equipamento`.

---

## 3. Estrutura de Componentes

```
src/pages/Planejamento/Histograma.jsx        ← página wrapper (tabs MO | Equipamentos)
src/components/histograma/HistogramaTabela.jsx ← componente reutilizável (substitui HistogramaEquipamentos.jsx)
```

`HistogramaEquipamentos.jsx` é **removido** e substituído por `HistogramaTabela.jsx`.

### Props de `HistogramaTabela`

```js
{
  tipo: "MO" | "Equipamento"   // filtra registros por tipo
}
```

---

## 4. Layout da Página

```
PageHeader
  actions: [+ Novo Recurso] [Importar / Exportar]

Tabs: [Mão de Obra] [Equipamentos]

HistogramaTabela
  ├── Chips de toggle: [● Previsto] [● Real] [● Projetado]
  │     Ativo = colorido (azul/verde/amarelo), inativo = cinza
  │     Controla visibilidade das sub-colunas E das barras do gráfico
  │
  ├── Tabela (overflow-x scroll)
  │   ├── Coluna fixa esq: "Recurso" + [Editar] [Excluir] por linha
  │   ├── Colunas de meses (início ao fim do projeto, 1 grupo por mês):
  │   │     Sub-colunas exibidas conforme chips: Prev | Real | Proj
  │   │     Real desabilitado (input readonly + bg cinza) se mes > hoje
  │   └── Colunas fixas dir: Total Prev | Total Real | Total Proj | %Real | %Proj
  │     (totais = soma de TODOS os meses do projeto, independente de chips ativos)
  │
  ├── Linha TOTAIS (tfoot, bordas separadas)
  │   Soma de cada coluna visível por mês + totais gerais de todos os recursos
  │
  └── Gráfico ComposedChart
      ├── Barras agrupadas por mês: Prev (azul) / Real (verde) / Proj (amarelo)
      │     Barras de tipos com chip desativado ficam ocultas
      └── 2 linhas sobrepostas:
            Acumulado Prev (azul tracejado) · Acumulado Real (verde sólido)
      Eixo Y esq: valores mensais | Eixo Y dir: acumulados
```

---

## 5. Interação de Edição

- **Inline:** clique em qualquer célula de valor abre um `<input type="number">` na célula
- **Blur / Enter:** dispara `updateMut` com o valor novo
- **Escape:** cancela sem salvar
- **Sem modal:** nenhum Dialog para edição de valores
- **Novo recurso:** Dialog simples com `nome_recurso` + `tipo` (preenchido pela tab ativa); após criar, o sistema gera automaticamente 1 registro por mês do período do projeto (início → fim) com todos os valores zerados, garantindo que a grade fique completa sem lacunas

---

## 6. Regras de Negócio

| Regra | Detalhe |
|-------|---------|
| Real bloqueado no futuro | `quantidade_realizada_mensal` readonly se `mes_referencia > primeiro dia do mês atual` (ex: em maio/26, meses ≥ jun/26 ficam bloqueados; mai/26 é editável) |
| Salvar Real limpa Projetado | Ao confirmar edição de Real do mês M para o recurso R, zerar `qtd_projetado` de (R, M) via `updateMut` |
| Valores inteiros | `type="number" step="1"` — histograma de pessoas e equipamentos usa inteiros |
| Período da tabela | Do `data_inicio` ao `data_fim` do projeto ativo (`useProject()`) |

---

## 7. Fórmulas

```
%Real  = Σ quantidade_realizada_mensal (acumulado) / Σ quantidade_prevista_mensal (acumulado)
%Proj  = Σ qtd_projetado (acumulado) / Σ quantidade_prevista_mensal (acumulado)
```

Ambas calculadas por recurso (coluna `%Real` / `%Proj` no final da linha) e para o TOTAL geral (linha de rodapé).

---

## 8. Import/Export

- Componente: `ImportExportDialog` + `ColumnMappingDialog` (padrão do projeto)
- Botão no slot `actions` do `PageHeader`
- Escala de tempo do arquivo: do início ao fim do projeto
- Colunas do CSV/Excel:

| Coluna CSV | Campo DB |
|------------|----------|
| `nome_recurso` | `nome_recurso` |
| `tipo` | `tipo` (`MO` ou `Equipamento`) |
| `mes_referencia` | `mes_referencia` (`YYYY-MM`) |
| `qtd_prevista` | `quantidade_prevista_mensal` |
| `qtd_real` | `quantidade_realizada_mensal` |
| `qtd_projetado` | `qtd_projetado` |

---

## 9. Critérios de Aceitação

- [ ] Tab MO e tab Equipamentos exibem dados filtrados corretamente
- [ ] Chips toggle ocultam/exibem sub-colunas Prev/Real/Proj e as barras do gráfico
- [ ] Real desabilitado para meses futuros
- [ ] Salvar Real de mês M zera Projetado do mesmo mês/recurso
- [ ] Linha de totais no rodapé calcula corretamente
- [ ] Gráfico mostra barras mensais + 2 linhas acumuladas
- [ ] Import/Export funciona com ColumnMappingDialog
- [ ] `npm run build` sem erros
- [ ] `/audit` score ≥ 9
