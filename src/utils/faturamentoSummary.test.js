import { describe, it, expect } from "vitest";
import { calcFaturamentoSummary } from "./faturamentoSummary";

const fat = (status, valor) => ({ status, valor_medido: valor });

describe("calcFaturamentoSummary", () => {
  it("conta total, concluídos e em elaboração", () => {
    const fats = [
      fat("Concluído", 100000),
      fat("Concluído", 200000),
      fat("Elaboração", 50000),
    ];
    const r = calcFaturamentoSummary(fats, 1000000);
    expect(r.totalCount).toBe(3);
    expect(r.concluidosCount).toBe(2);
    expect(r.concluidosValor).toBe(300000);
    expect(r.elaboracaoCount).toBe(1);
    expect(r.elaboracaoValor).toBe(50000);
  });

  it("calcula totalMedido, percentual e saldo", () => {
    const fats = [fat("Concluído", 200000), fat("Elaboração", 100000)];
    const r = calcFaturamentoSummary(fats, 1000000);
    expect(r.totalMedido).toBe(300000);
    expect(r.percentual).toBeCloseTo(30);
    expect(r.saldo).toBe(700000);
  });

  it("retorna percentual e saldo null quando valorContrato <= 0", () => {
    const r = calcFaturamentoSummary([fat("Concluído", 100000)], 0);
    expect(r.percentual).toBeNull();
    expect(r.saldo).toBeNull();
  });

  it("retorna percentual e saldo null quando valorContrato é null", () => {
    const r = calcFaturamentoSummary([fat("Concluído", 100000)], null);
    expect(r.percentual).toBeNull();
    expect(r.saldo).toBeNull();
  });

  it("lida com array vazio", () => {
    const r = calcFaturamentoSummary([], 1000000);
    expect(r.totalCount).toBe(0);
    expect(r.totalMedido).toBe(0);
    expect(r.percentual).toBeCloseTo(0);
    expect(r.saldo).toBe(1000000);
  });
});
