import { describe, it, expect } from "vitest";
import { computeItemValues, flattenLeaves, computeTotais, recalcAcumulado } from "./pqpUtils";

const folha = {
  item: "1.1", descricao: "X", unidade: "m³",
  qtd_contratual: 100, preco_unitario: 10, qtd_acumulada: 30, qtd_medida: 20,
};

describe("computeItemValues", () => {
  it("calcula medido, acumulado e saldo de uma folha", () => {
    expect(computeItemValues(folha)).toEqual({
      valor_medido: 200,     // 20 * 10
      valor_acumulado: 500,  // (30+20) * 10
      saldo: 50,             // 100 - (30+20)
    });
  });

  it("trata campos ausentes como zero", () => {
    expect(computeItemValues({ preco_unitario: 5, qtd_medida: 4 })).toEqual({
      valor_medido: 20, valor_acumulado: 20, saldo: -4,
    });
  });
});

describe("flattenLeaves", () => {
  it("retorna só folhas, recursivamente", () => {
    const arvore = [{ item: "1", children: [folha, { item: "1.2", children: [{ item: "1.2.1" }] }] }];
    expect(flattenLeaves(arvore).map((f) => f.item)).toEqual(["1.1", "1.2.1"]);
  });
});

describe("computeTotais", () => {
  it("soma apenas folhas e calcula % avanço", () => {
    const arvore = [{
      item: "1", descricao: "Grupo", children: [
        folha,
        { item: "1.2", descricao: "Y", unidade: "un", qtd_contratual: 10, preco_unitario: 100, qtd_acumulada: 0, qtd_medida: 1 },
      ],
    }];
    const t = computeTotais(arvore);
    expect(t.valorTotalMedido).toBe(300);     // 200 + 100
    expect(t.valorTotalAcumulado).toBe(600);  // 500 + 100
    expect(t.valorTotalContrato).toBe(2000);  // 100*10 + 10*100
    expect(t.progressoFinanceiro).toBe(30);   // 600/2000 * 100
  });

  it("progresso 0 quando não há contrato", () => {
    expect(computeTotais([]).progressoFinanceiro).toBe(0);
  });
});

describe("recalcAcumulado", () => {
  it("soma qtd_medida das medições anteriores por item-folha", () => {
    const base = [{ item: "1", children: [{ item: "1.1", qtd_contratual: 100, preco_unitario: 10 }] }];
    const anteriores = [
      { itens: [{ item: "1.1", qtd_medida: 30 }] },
      { itens: [{ item: "1", children: [{ item: "1.1", qtd_medida: 20 }] }] },
    ];
    const r = recalcAcumulado(base, anteriores);
    expect(flattenLeaves(r)[0].qtd_acumulada).toBe(50);
  });
});
