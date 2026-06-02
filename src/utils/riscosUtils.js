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

// Avaliação qualitativa de risco (texto). As colunas `probabilidade` e `impacto`
// são TEXT no banco — nunca números. O score numérico é derivado dos pesos abaixo.
export const PROBABILIDADE_OPTIONS = ["Muito Baixa", "Baixa", "Média", "Alta", "Muito Alta"];
export const IMPACTO_OPTIONS       = ["Muito Baixo", "Baixo", "Médio", "Alto", "Muito Alto"];

const PROB_PESO    = { "Muito Baixa": 1, "Baixa": 2, "Média": 3, "Alta": 4, "Muito Alta": 5 };
const IMPACTO_PESO = { "Muito Baixo": 1, "Baixo": 2, "Médio": 3, "Alto": 4, "Muito Alto": 5 };

// Status de risco — alinhado aos valores reais persistidos no banco (texto livre, sem CHECK).
export const STATUS_RISCO = ["Ativo", "Mitigado", "Encerrado", "Cancelado"];

export const STATUS_RISCO_COLORS = {
  "Ativo":     "text-amber-600",
  "Mitigado":  "text-indigo-600",
  "Encerrado": "text-green-600",
  "Cancelado": "text-muted-foreground",
};

/**
 * Converte um nível textual em peso 1-5. Tolera dados legados numéricos
 * (riscos corrompidos pela versão anterior que gravava número no campo texto).
 * @param {string|number} valor @param {Record<string,number>} mapa
 * @returns {number} peso 1-5, ou 0 se desconhecido
 */
function peso(valor, mapa) {
  const n = Number(valor);
  if (Number.isFinite(n) && n >= 1 && n <= 5) return n;
  return mapa[valor] ?? 0;
}

export const pesoProbabilidade = (v) => peso(v, PROB_PESO);
export const pesoImpacto       = (v) => peso(v, IMPACTO_PESO);

/**
 * Score do risco = peso(probabilidade) × peso(impacto), escala 1-25.
 * @param {string|number} probabilidade @param {string|number} impacto
 * @returns {number}
 */
export function calcScoreRisco(probabilidade, impacto) {
  return pesoProbabilidade(probabilidade) * pesoImpacto(impacto);
}

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
