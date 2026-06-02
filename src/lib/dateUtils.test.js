import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime } from "./dateUtils";

describe("formatDate", () => {
  it("formata string ISO date-only como dd/MM/yy", () => {
    expect(formatDate("2025-06-02")).toBe("02/06/25");
  });

  it("formata string ISO datetime local como dd/MM/yy", () => {
    expect(formatDate("2025-06-02T14:30:00")).toBe("02/06/25");
  });

  it("formata objeto Date como dd/MM/yy", () => {
    expect(formatDate(new Date("2025-06-02T00:00:00"))).toBe("02/06/25");
  });

  it("retorna string vazia para null", () => {
    expect(formatDate(null)).toBe("");
  });

  it("retorna string vazia para undefined", () => {
    expect(formatDate(undefined)).toBe("");
  });

  it("retorna string vazia para string vazia", () => {
    expect(formatDate("")).toBe("");
  });
});

describe("formatDateTime", () => {
  it("formata string ISO datetime local como dd/MM/yy HH:mm", () => {
    expect(formatDateTime("2025-06-02T14:30:00")).toBe("02/06/25 14:30");
  });

  it("formata string ISO date-only como dd/MM/yy 00:00", () => {
    expect(formatDateTime("2025-06-02")).toBe("02/06/25 00:00");
  });

  it("retorna string vazia para null", () => {
    expect(formatDateTime(null)).toBe("");
  });

  it("retorna string vazia para undefined", () => {
    expect(formatDateTime(undefined)).toBe("");
  });
});
