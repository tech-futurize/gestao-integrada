import { describe, it, expect } from "vitest";
import { normalizarRegistros, normalizarRdos, normalizarMudancas } from "./useMapaRegistroData";

// ── normalizarRegistros ──────────────────────────────────────────────────────

describe("normalizarRegistros", () => {
  it("exclui registros com tipo_registro=RDO", () => {
    const input = [
      { id: "1", tipo_registro: "RDO", data_hora: "2024-01-01T00:00:00", impacto_ocorrencia: ["Escopo"] },
      { id: "2", tipo_registro: "E-mail", data_hora: "2024-01-02T00:00:00", impacto_ocorrencia: ["Engenharia"] },
    ];
    const result = normalizarRegistros(input);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("preserva campos do registro e define fonte=Registro", () => {
    const input = [
      {
        id: "abc",
        tipo_registro: "Notificação",
        data_hora: "2024-03-10T08:00:00",
        impacto_ocorrencia: ["Recursos", "Planejamento"],
        responsabilidade: "Contratada",
        descricao: "Descrição teste",
        status: "Em Análise",
        gravidade: "Alta",
        impacto_preliminar: "Custo",
        responsavel_registro: "João",
      },
    ];
    const result = normalizarRegistros(input);
    expect(result[0]).toMatchObject({
      id: "abc",
      data_hora: "2024-03-10T08:00:00",
      impacto_ocorrencia: ["Recursos", "Planejamento"],
      responsabilidade: "Contratada",
      descricao: "Descrição teste",
      fonte: "Registro",
      tipo_registro: "Notificação",
      status: "Em Análise",
      gravidade: "Alta",
      responsavel_registro: "João",
    });
  });

  it("usa fallback [] para impacto_ocorrencia ausente", () => {
    const input = [{ id: "1", tipo_registro: "E-mail" }];
    const result = normalizarRegistros(input);
    expect(result[0].impacto_ocorrencia).toEqual([]);
  });

  it("retorna array vazio quando entrada é vazia", () => {
    expect(normalizarRegistros([])).toEqual([]);
  });
});

// ── normalizarRdos ───────────────────────────────────────────────────────────

describe("normalizarRdos", () => {
  it("ignora ocorrências sem categorias", () => {
    const rdos = [
      {
        id: "rdo1",
        numero: "001",
        data: "2024-02-15",
        area: "Área A",
        ocorrencias: [
          { descricao: "Sem categoria", categorias: [], responsabilidade: "Contratada" },
        ],
      },
    ];
    expect(normalizarRdos(rdos)).toHaveLength(0);
  });

  it("explode ocorrências com categorias em pontos individuais", () => {
    const rdos = [
      {
        id: "rdo1",
        numero: "001",
        data: "2024-02-15",
        area: "Área A",
        ocorrencias: [
          { descricao: "Ocorr 1", categorias: ["Engenharia"], responsabilidade: "Contratada" },
          { descricao: "Ocorr 2", categorias: ["Suprimentos", "Recursos"], responsabilidade: "Contratante" },
        ],
      },
    ];
    const result = normalizarRdos(rdos);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("rdo-rdo1-0");
    expect(result[1].id).toBe("rdo-rdo1-1");
  });

  it("formata data_hora concatenando T00:00:00", () => {
    const rdos = [
      {
        id: "rdo1",
        numero: "001",
        data: "2024-02-15",
        area: "",
        ocorrencias: [{ descricao: "X", categorias: ["Escopo"], responsabilidade: "" }],
      },
    ];
    const result = normalizarRdos(rdos);
    expect(result[0].data_hora).toBe("2024-02-15T00:00:00");
  });

  it("define fonte=RDO e preserva numero/area do RDO pai", () => {
    const rdos = [
      {
        id: "rdo1",
        numero: "RDO-42",
        data: "2024-02-15",
        area: "Bloco 3",
        ocorrencias: [{ descricao: "Desc", categorias: ["Planejamento"], responsabilidade: "Contratada" }],
      },
    ];
    const result = normalizarRdos(rdos);
    expect(result[0].fonte).toBe("RDO");
    expect(result[0]._numero_rdo).toBe("RDO-42");
    expect(result[0]._area).toBe("Bloco 3");
  });

  it("retorna [] quando nenhum RDO tem ocorrências com categorias", () => {
    const rdos = [
      { id: "r1", numero: "001", data: "2024-01-01", area: "", ocorrencias: [] },
    ];
    expect(normalizarRdos(rdos)).toEqual([]);
  });
});

// ── normalizarMudancas ───────────────────────────────────────────────────────

describe("normalizarMudancas", () => {
  it("ignora mudanças sem data_ocorrencia", () => {
    const mudancas = [
      { id: "m1", titulo: "Sem data", impacto_custo: 1000 },
    ];
    expect(normalizarMudancas(mudancas)).toHaveLength(0);
  });

  it("infere categoria Recursos quando impacto_custo != 0", () => {
    const mudancas = [{ id: "m1", titulo: "T", data_ocorrencia: "2024-01-10", impacto_custo: 5000, impacto_prazo_dias: null, impacto_escopo: null }];
    expect(normalizarMudancas(mudancas)[0].impacto_ocorrencia).toContain("Recursos");
  });

  it("infere categoria Planejamento quando impacto_prazo_dias != 0", () => {
    const mudancas = [{ id: "m1", titulo: "T", data_ocorrencia: "2024-01-10", impacto_custo: null, impacto_prazo_dias: 10, impacto_escopo: null }];
    expect(normalizarMudancas(mudancas)[0].impacto_ocorrencia).toContain("Planejamento");
  });

  it("infere categoria Escopo quando impacto_escopo é truthy", () => {
    const mudancas = [{ id: "m1", titulo: "T", data_ocorrencia: "2024-01-10", impacto_custo: null, impacto_prazo_dias: null, impacto_escopo: "Aditivo de escopo" }];
    expect(normalizarMudancas(mudancas)[0].impacto_ocorrencia).toContain("Escopo");
  });

  it("usa fallback ['Escopo'] quando nenhum campo de impacto é significativo", () => {
    const mudancas = [{ id: "m1", titulo: "T", data_ocorrencia: "2024-01-10", impacto_custo: 0, impacto_prazo_dias: 0, impacto_escopo: "" }];
    expect(normalizarMudancas(mudancas)[0].impacto_ocorrencia).toEqual(["Escopo"]);
  });

  it("pode inferir múltiplas categorias ao mesmo tempo", () => {
    const mudancas = [{ id: "m1", titulo: "T", data_ocorrencia: "2024-01-10", impacto_custo: 3000, impacto_prazo_dias: 5, impacto_escopo: "Novo escopo" }];
    const cats = normalizarMudancas(mudancas)[0].impacto_ocorrencia;
    expect(cats).toContain("Recursos");
    expect(cats).toContain("Planejamento");
    expect(cats).toContain("Escopo");
  });

  it("define fonte=Mudança e usa origem como responsabilidade", () => {
    const mudancas = [{ id: "m1", titulo: "Mudança X", data_ocorrencia: "2024-01-10", origem: "Contratante", impacto_custo: 0, impacto_prazo_dias: 0, impacto_escopo: "" }];
    const result = normalizarMudancas(mudancas)[0];
    expect(result.fonte).toBe("Mudança");
    expect(result.responsabilidade).toBe("Contratante");
    expect(result.id).toBe("mudanca-m1");
  });
});
