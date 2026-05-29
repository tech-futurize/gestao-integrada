export const CATEGORIAS_RISCO = [
  "Técnico", "Financeiro", "Prazo", "Segurança",
  "Regulatório", "Ambiental", "Outros",
];

export const CAT_COLORS = {
  "Técnico":     "#3b82f6",
  "Financeiro":  "#f59e0b",
  "Prazo":       "#c35e1e",
  "Segurança":   "#ef4444",
  "Regulatório": "#8b5cf6",
  "Ambiental":   "#10b981",
  "Outros":      "#6b7280",
};

export const SCORE_COLORS = {
  high:   { color: "#ef4444", bg: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  medium: { color: "#f59e0b", bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  low:    { color: "#16a34a", bg: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
};

export const IMPACTO_DIMS = ["Escopo", "Prazo", "Valor"];

/** @param {number} score @returns {"high"|"medium"|"low"} */
export function getScoreLevel(score) {
  if (score >= 12) return "high";
  if (score >= 6)  return "medium";
  return "low";
}

/**
 * Formata o label de um risco para exibição em selects.
 * @param {{ codigo?: string, descricao?: string, id?: string }} risco
 */
export function labelRisco(risco) {
  if (!risco) return "";
  const id = risco.codigo || risco.id || "";
  const desc = risco.descricao || "";
  return id && desc ? `${id} — ${desc}` : id || desc || "Risco";
}

/**
 * Formata o label de uma mudança para exibição em selects.
 * @param {{ titulo?: string, descricao?: string, id?: string }} mudanca
 */
export function labelMudanca(mudanca) {
  if (!mudanca) return "";
  const id = mudanca.titulo || mudanca.id || "";
  const desc = mudanca.descricao || "";
  return id && desc ? `${id} — ${desc}` : id || desc || "Mudança";
}
