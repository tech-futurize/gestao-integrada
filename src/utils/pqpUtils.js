// src/utils/pqpUtils.js
// Cálculos puros da PQP (Planilha de Quantidades e Preços) hierárquica.
// Estrutura do item (JSONB):
//   { item, descricao, unidade, qtd_contratual, preco_unitario, qtd_acumulada, qtd_medida, children? }
// Folha = sem `children` (ou children vazio).

const isLeaf = (i) => !i.children || i.children.length === 0;

/** Valores derivados de uma folha: medido no período, acumulado e saldo. */
export function computeItemValues(item) {
  const acum = item.qtd_acumulada ?? 0;
  const med = item.qtd_medida ?? 0;
  const pu = item.preco_unitario ?? 0;
  return {
    valor_medido: med * pu,
    valor_acumulado: (acum + med) * pu,
    saldo: (item.qtd_contratual ?? 0) - (acum + med),
  };
}

/** Achata a árvore retornando apenas os itens-folha, recursivamente. */
export function flattenLeaves(itens = []) {
  return itens.flatMap((i) => (isLeaf(i) ? [i] : flattenLeaves(i.children)));
}

/** Totais somando apenas folhas: medido, acumulado, contratual e % de avanço financeiro. */
export function computeTotais(itens = []) {
  let valorTotalMedido = 0,
    valorTotalAcumulado = 0,
    valorTotalContrato = 0;
  for (const f of flattenLeaves(itens)) {
    const v = computeItemValues(f);
    valorTotalMedido += v.valor_medido;
    valorTotalAcumulado += v.valor_acumulado;
    valorTotalContrato += (f.qtd_contratual ?? 0) * (f.preco_unitario ?? 0);
  }
  const progressoFinanceiro = valorTotalContrato
    ? (valorTotalAcumulado / valorTotalContrato) * 100
    : 0;
  return { valorTotalMedido, valorTotalAcumulado, valorTotalContrato, progressoFinanceiro };
}

/**
 * Preenche `qtd_acumulada` de cada folha da árvore-base somando as `qtd_medida`
 * das medições anteriores (mesmo código `item`). Retorna uma nova árvore.
 * Usado no editor de medição: acumulado = Σ medições concluídas anteriores.
 */
export function recalcAcumulado(base = [], anteriores = []) {
  const acum = new Map();
  for (const med of anteriores) {
    for (const folha of flattenLeaves(med.itens ?? [])) {
      acum.set(folha.item, (acum.get(folha.item) ?? 0) + (folha.qtd_medida ?? 0));
    }
  }
  const mapTree = (itens) =>
    itens.map((i) =>
      isLeaf(i)
        ? { ...i, qtd_acumulada: acum.get(i.item) ?? 0 }
        : { ...i, children: mapTree(i.children) }
    );
  return mapTree(base);
}
