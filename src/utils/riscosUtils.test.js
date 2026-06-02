import { describe, it, expect } from "vitest";
import {
  pesoProbabilidade,
  pesoImpacto,
  calcScoreRisco,
  getScoreLevel,
  PROBABILIDADE_OPTIONS,
  IMPACTO_OPTIONS,
  STATUS_RISCO,
} from "./riscosUtils";

// Regressão do bug C1 (audit 2026-06-02): a UI tratava probabilidade/impacto
// como número 1-5, mas o banco armazena TEXT ('Alta'/'Médio'...). Editar um
// risco existente gravava Number('Alta')||3 = 3, corrompendo o dado.

describe("pesoProbabilidade / pesoImpacto", () => {
  it("mapeia texto qualitativo para peso 1-5", () => {
    expect(pesoProbabilidade("Muito Baixa")).toBe(1);
    expect(pesoProbabilidade("Baixa")).toBe(2);
    expect(pesoProbabilidade("Média")).toBe(3);
    expect(pesoProbabilidade("Alta")).toBe(4);
    expect(pesoProbabilidade("Muito Alta")).toBe(5);
    expect(pesoImpacto("Médio")).toBe(3);
    expect(pesoImpacto("Alto")).toBe(4);
  });

  it("tolera dados legados numéricos (riscos corrompidos pela versão antiga)", () => {
    expect(pesoProbabilidade(3)).toBe(3);
    expect(pesoProbabilidade("4")).toBe(4);
    expect(pesoImpacto(1)).toBe(1);
  });

  it("retorna 0 para valor desconhecido ou vazio", () => {
    expect(pesoProbabilidade("Inexistente")).toBe(0);
    expect(pesoProbabilidade(null)).toBe(0);
    expect(pesoProbabilidade(undefined)).toBe(0);
    expect(pesoProbabilidade("")).toBe(0);
  });
});

describe("calcScoreRisco", () => {
  it("calcula score = peso(prob) × peso(impacto)", () => {
    expect(calcScoreRisco("Alta", "Alto")).toBe(16);   // 4 × 4
    expect(calcScoreRisco("Média", "Médio")).toBe(9);  // 3 × 3
    expect(calcScoreRisco("Baixa", "Baixo")).toBe(4);  // 2 × 2
  });

  it("nunca retorna NaN para os dados reais do banco", () => {
    // valores efetivamente presentes na tabela `riscos`
    for (const prob of ["Alta", "Média", "Baixa"]) {
      for (const imp of ["Alto", "Médio"]) {
        expect(Number.isNaN(calcScoreRisco(prob, imp))).toBe(false);
      }
    }
  });
});

describe("getScoreLevel", () => {
  it("classifica o score nas faixas corretas", () => {
    expect(getScoreLevel(16)).toBe("high");
    expect(getScoreLevel(12)).toBe("high");
    expect(getScoreLevel(9)).toBe("medium");
    expect(getScoreLevel(6)).toBe("medium");
    expect(getScoreLevel(4)).toBe("low");
    expect(getScoreLevel(0)).toBe("low");
  });
});

describe("constantes de domínio", () => {
  it("opções têm 5 níveis e status alinhado ao banco", () => {
    expect(PROBABILIDADE_OPTIONS).toHaveLength(5);
    expect(IMPACTO_OPTIONS).toHaveLength(5);
    expect(STATUS_RISCO).toContain("Ativo");
    expect(STATUS_RISCO).toContain("Monitoramento");
  });
});
