export function calcFaturamentoSummary(faturamentos, valorContrato) {
  const concluidos = faturamentos.filter((f) => f.status === "Concluído");
  const elaboracao = faturamentos.filter((f) => f.status === "Elaboração");
  const totalMedido = faturamentos.reduce((acc, f) => acc + (Number(f.valor_medido) || 0), 0);
  const concluidosValor = concluidos.reduce((acc, f) => acc + (Number(f.valor_medido) || 0), 0);
  const elaboracaoValor = elaboracao.reduce((acc, f) => acc + (Number(f.valor_medido) || 0), 0);
  const contrato = Number(valorContrato) || 0;
  const hasContrato = contrato > 0;

  return {
    totalCount: faturamentos.length,
    concluidosCount: concluidos.length,
    concluidosValor,
    elaboracaoCount: elaboracao.length,
    elaboracaoValor,
    totalMedido,
    percentual: hasContrato ? (totalMedido / contrato) * 100 : null,
    saldo: hasContrato ? contrato - totalMedido : null,
  };
}
