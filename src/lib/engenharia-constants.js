export const ETAPAS = [
  "A Emitir",
  "Em Elaboração",
  "Em Verificação Técnica",
  "Comentários do Cliente",
  "Aprovado",
];

export const DISCIPLINAS = [
  { value: "MEC", label: "Mecânica" },
  { value: "CIV", label: "Civil" },
  { value: "ELE", label: "Elétrica" },
  { value: "TUB", label: "Tubulação" },
  { value: "INS", label: "Instrumentação" },
  { value: "AUT", label: "Automação" },
  { value: "EST", label: "Estrutura metálica" },
  { value: "PRC", label: "Processo" },
  { value: "HSE", label: "HSE" },
];

export const DISC_COLORS = {
  MEC: "#3b82f6",
  CIV: "#8b5cf6",
  ELE: "#f59e0b",
  TUB: "#06b6d4",
  INS: "#10b981",
  AUT: "#ef4444",
  EST: "#6366f1",
  PRC: "#ec4899",
  HSE: "#84cc16",
};

export const ETAPA_COLORS = {
  "A Emitir":                  { bg: "#f3f4f6", text: "#6b7280" },
  "Em Elaboração":             { bg: "#dbeafe", text: "#2563eb" },
  "Em Verificação Técnica":    { bg: "#fef3c7", text: "#d97706" },
  "Comentários do Cliente":    { bg: "#fae8ff", text: "#9333ea" },
  "Aprovado":                  { bg: "#dcfce7", text: "#16a34a" },
};

export const ETAPA_COLORS_PIE = ["#6b7280", "#2563eb", "#d97706", "#9333ea", "#16a34a"];
