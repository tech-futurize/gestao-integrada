import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";

// ─── Funções puras de normalização (exportadas para testes) ───────────────────

export function normalizarRegistros(registros) {
  return registros
    .filter((r) => r.tipo_registro !== "RDO")
    .map((r) => ({
      id: r.id,
      data_hora: r.data_hora,
      impacto_ocorrencia: r.impacto_ocorrencia ?? [],
      responsabilidade: r.responsabilidade ?? "",
      descricao: r.descricao ?? "",
      fonte: "Registro",
      tipo_registro: r.tipo_registro,
      status: r.status,
      gravidade: r.gravidade,
      impacto_preliminar: r.impacto_preliminar,
      responsavel_registro: r.responsavel_registro,
    }));
}

export function normalizarRdos(rdos) {
  const resultado = [];
  for (const rdo of rdos) {
    const ocorrencias = rdo.ocorrencias ?? [];
    ocorrencias.forEach((ocorr, idx) => {
      const categorias = ocorr.categorias ?? [];
      if (categorias.length === 0) return;
      resultado.push({
        id: `rdo-${rdo.id}-${idx}`,
        data_hora: rdo.data ? `${rdo.data}T00:00:00` : "",
        impacto_ocorrencia: categorias,
        responsabilidade: ocorr.responsabilidade ?? "",
        descricao: ocorr.descricao ?? "",
        fonte: "RDO",
        _numero_rdo: rdo.numero,
        _area: rdo.area,
      });
    });
  }
  return resultado;
}

function inferirCategoriasMudanca(mudanca) {
  const cats = [];
  if (mudanca.impacto_custo != null && mudanca.impacto_custo !== 0) cats.push("Recursos");
  if (mudanca.impacto_prazo_dias != null && mudanca.impacto_prazo_dias !== 0) cats.push("Planejamento");
  if (mudanca.impacto_escopo) cats.push("Escopo");
  return cats.length > 0 ? cats : ["Escopo"];
}

export function normalizarMudancas(mudancas) {
  return mudancas
    .filter((m) => !!m.data_ocorrencia)
    .map((m) => ({
      id: `mudanca-${m.id}`,
      // Como no caminho dos RDOs: força parse local — new Date("YYYY-MM-DD") seria meia-noite UTC
      data_hora: m.data_ocorrencia.includes("T") ? m.data_ocorrencia : `${m.data_ocorrencia}T00:00:00`,
      impacto_ocorrencia: inferirCategoriasMudanca(m),
      responsabilidade: m.origem ?? "",
      descricao: m.titulo ?? "",
      fonte: "Mudança",
      _titulo: m.titulo,
      _impacto_custo: m.impacto_custo,
      _impacto_prazo_dias: m.impacto_prazo_dias,
      _impacto_escopo: m.impacto_escopo,
    }));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export default function useMapaRegistroData(selectedProjectId) {
  const enabled = !!selectedProjectId;

  const { data: registros = [], isPending: pendingReg, isError: errReg } = useQuery({
    queryKey: ["registros", selectedProjectId],
    queryFn: () => entities.Registro.filter({ projeto_id: selectedProjectId }),
    enabled,
  });

  const { data: rdos = [], isPending: pendingRdo, isError: errRdo } = useQuery({
    queryKey: ["rdos", selectedProjectId],
    queryFn: () => entities.Rdo.filter({ projeto_id: selectedProjectId }),
    enabled,
  });

  const { data: mudancas = [], isPending: pendingMud, isError: errMud } = useQuery({
    queryKey: ["mudancas_contratuais", selectedProjectId],
    queryFn: () => entities.MudancaContratual.filter({ projeto_id: selectedProjectId }),
    enabled,
  });

  const incidentes = useMemo(
    () => [
      ...normalizarRegistros(registros),
      ...normalizarRdos(rdos),
      ...normalizarMudancas(mudancas),
    ],
    [registros, rdos, mudancas]
  );

  return {
    incidentes,
    isPending: pendingReg || pendingRdo || pendingMud,
    isError: errReg || errRdo || errMud,
  };
}
