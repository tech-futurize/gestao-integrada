import { createPortal } from "react-dom";
import { calcScoreRisco, pesoProbabilidade, pesoImpacto, STATUS_RISCO_COLORS, CAT_COLORS } from "@/utils/riscosUtils";

const POPUP_WIDTH = 240;
const POPUP_OFFSET = 8;

function getSeverityInfo(score) {
  if (score >= 12) return { label: "ALTO",  color: "#ef4444", headerBg: "rgba(239,68,68,0.08)"  };
  if (score >= 6)  return { label: "MÉDIO", color: "#eab308", headerBg: "rgba(234,179,8,0.08)"  };
  return            { label: "BAIXO", color: "#22c55e", headerBg: "rgba(34,197,94,0.08)"  };
}

export default function RiscoHoverCard({ risco, anchorRect, onMouseEnter, onMouseLeave }) {
  const score = risco.score || calcScoreRisco(risco.probabilidade, risco.impacto);
  const sev = getSeverityInfo(score);
  const pPeso = pesoProbabilidade(risco.probabilidade);
  const iPeso = pesoImpacto(risco.impacto);
  const statusColorClass = STATUS_RISCO_COLORS[risco.status] || "text-muted-foreground";

  const spaceOnRight = window.innerWidth - anchorRect.right - POPUP_OFFSET;
  const left = spaceOnRight >= POPUP_WIDTH
    ? anchorRect.right + POPUP_OFFSET
    : anchorRect.left - POPUP_WIDTH - POPUP_OFFSET;
  const top = Math.max(8, anchorRect.top + anchorRect.height / 2 - 100);

  return createPortal(
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ position: "fixed", left, top, width: POPUP_WIDTH, zIndex: 9999 }}
      className="bg-card border border-border rounded-xl shadow-xl p-3 pointer-events-auto"
    >
      <div
        className="rounded-lg px-3 py-2 mb-3"
        style={{ background: sev.headerBg, borderLeft: `3px solid ${sev.color}` }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-extrabold text-sm text-foreground">
            {risco.codigo || "—"}
          </span>
          <span className="text-[10px] font-bold tracking-wide" style={{ color: sev.color }}>
            {sev.label} · {score}
          </span>
        </div>
        {risco.descricao && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {risco.descricao}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-3">
        <div className="bg-muted/40 rounded p-1.5">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground/60 mb-0.5">Categoria</div>
          <div className="text-xs font-semibold" style={{ color: CAT_COLORS[risco.categoria] || "#6b7280" }}>{risco.categoria || "—"}</div>
        </div>
        <div className="bg-muted/40 rounded p-1.5">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground/60 mb-0.5">Status</div>
          <div className={`text-xs font-semibold ${statusColorClass}`}>{risco.status || "—"}</div>
        </div>
        <div className="bg-muted/40 rounded p-1.5">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground/60 mb-0.5">Probabilidade</div>
          <div className="text-xs font-semibold text-foreground">
            {risco.probabilidade || "—"}{pPeso ? ` (${pPeso})` : ""}
          </div>
        </div>
        <div className="bg-muted/40 rounded p-1.5">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground/60 mb-0.5">Impacto</div>
          <div className="text-xs font-semibold text-foreground">
            {risco.impacto || "—"}{iPeso ? ` (${iPeso})` : ""}
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-2 space-y-1">
        {risco.responsavel && (
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground/60">Responsável</span>
            <span className="text-xs font-semibold text-foreground">{risco.responsavel}</span>
          </div>
        )}
        {risco.mitigacao && (
          <p className="text-[10px] text-muted-foreground italic line-clamp-2 leading-relaxed">
            Plano: {risco.mitigacao}
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}
