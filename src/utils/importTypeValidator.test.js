import { describe, it, expect } from "vitest";
import { parseFlexibleNumber, validateAndConvert } from "./importTypeValidator";

describe("parseFlexibleNumber", () => {
  it("interpreta formato pt-BR com milhar e decimal", () => {
    expect(parseFlexibleNumber("1.234,56")).toBe(1234.56);
    expect(parseFlexibleNumber("1.234.567,89")).toBe(1234567.89);
  });

  it("interpreta formato US com milhar e decimal", () => {
    expect(parseFlexibleNumber("1,234.56")).toBe(1234.56);
  });

  it("interpreta vírgula única como decimal pt-BR", () => {
    expect(parseFlexibleNumber("1234,56")).toBe(1234.56);
    expect(parseFlexibleNumber("1,5")).toBe(1.5);
  });

  it("interpreta padrão de milhar só com pontos", () => {
    expect(parseFlexibleNumber("1.234")).toBe(1234);
    expect(parseFlexibleNumber("1.234.567")).toBe(1234567);
  });

  it("interpreta ponto decimal quando não é padrão de milhar", () => {
    expect(parseFlexibleNumber("1000.50")).toBe(1000.5);
    expect(parseFlexibleNumber("1.5")).toBe(1.5);
    expect(parseFlexibleNumber("0.25")).toBe(0.25);
  });

  it("aceita inteiros, negativos e números nativos", () => {
    expect(parseFlexibleNumber("42")).toBe(42);
    expect(parseFlexibleNumber("-1.234,5")).toBe(-1234.5);
    expect(parseFlexibleNumber(3.14)).toBe(3.14);
  });

  it("retorna NaN para entradas inválidas", () => {
    expect(parseFlexibleNumber("abc")).toBeNaN();
    expect(parseFlexibleNumber("")).toBeNaN();
    expect(parseFlexibleNumber(null)).toBeNaN();
  });
});

describe("validateAndConvert — number", () => {
  it("converte moeda pt-BR corretamente (regressão: 1.234,56 virava 1.234)", () => {
    expect(validateAndConvert("1.234,56", "number")).toEqual({ ok: true, value: 1234.56 });
  });

  it("rejeita texto não numérico", () => {
    expect(validateAndConvert("abc", "number").ok).toBe(false);
  });
});

describe("validateAndConvert — date", () => {
  it("interpreta dd/mm/yyyy com dia <= 12 (regressão: 04/07 virava 7 de abril)", () => {
    expect(validateAndConvert("04/07/2026", "date")).toEqual({ ok: true, value: "2026-07-04" });
  });

  it("interpreta dd/mm/yyyy com dia > 12", () => {
    expect(validateAndConvert("25/12/2026", "date")).toEqual({ ok: true, value: "2026-12-25" });
  });

  it("rejeita datas impossíveis", () => {
    expect(validateAndConvert("31/02/2026", "date").ok).toBe(false);
  });

  it("aceita ISO e preserva o dia sem shift de timezone", () => {
    expect(validateAndConvert("2026-07-04", "date")).toEqual({ ok: true, value: "2026-07-04" });
    expect(validateAndConvert("2026-07-04T00:00:00+00:00", "date")).toEqual({ ok: true, value: "2026-07-04" });
  });
});

describe("validateAndConvert — required", () => {
  it("aceita vazio como null quando não obrigatório", () => {
    expect(validateAndConvert("", "string")).toEqual({ ok: true, value: null });
  });

  it("rejeita vazio quando obrigatório", () => {
    expect(validateAndConvert("", "string", true).ok).toBe(false);
    expect(validateAndConvert(null, "date", true).ok).toBe(false);
  });
});

describe("validateAndConvert — boolean", () => {
  it("aceita variantes pt-BR", () => {
    expect(validateAndConvert("Sim", "boolean")).toEqual({ ok: true, value: true });
    expect(validateAndConvert("não", "boolean")).toEqual({ ok: true, value: false });
  });
});
