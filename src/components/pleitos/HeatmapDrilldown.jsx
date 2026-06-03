import { useNavigate } from "react-router-dom";
import { formatDateTime, formatDate } from "@/lib/dateUtils";
import { X, FileText, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";

const FONTE_BADGE = {
  "Registro": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "RDO":      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Mudança":  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

export default function HeatmapDrilldown({ open, onClose, category, weekLabel, registros }) {
  const navigate = useNavigate();

  if (!open) return null;

  const handleRegistroClick = (r) => {
    onClose();
    if (r.fonte === "Registro") {
      navigate(`/admin-contratual/registros/${r.id}`);
    } else if (r.fonte === "RDO") {
      navigate("/admin-contratual/rdos");
    } else {
      navigate("/admin-contratual/gestao-mudancas");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full z-50 w-full max-w-md bg-card shadow-2xl flex flex-col border-l-[3px] border-slate-300 dark:border-cyan-400">
        {/* Header — bg-slate-900 garante legibilidade em ambos os temas */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border bg-slate-900">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.6)" }}>
              {weekLabel}
            </p>
            <h3 className="text-base font-bold text-white mt-0.5">{category}</h3>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              {registros.length === 0
                ? "Nenhum registro nesta célula"
                : `${registros.length} registro(s) encontrado(s)`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors mt-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {registros.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">Nenhum registro para</p>
              <p className="text-foreground font-semibold mt-1">{category} · {weekLabel}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {registros.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleRegistroClick(r)}
                  className="w-full text-left p-3 rounded-xl border border-border hover:border-ocre/40 hover:bg-ocre/5 transition-all duration-150 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-xs ${FONTE_BADGE[r.fonte] || "bg-muted text-muted-foreground"}`}
                        >
                          {r.fonte}
                        </Badge>
                        {r.fonte === "Registro" && r.tipo_registro && (
                          <span className="text-xs text-muted-foreground">{r.tipo_registro}</span>
                        )}
                        {r.status && <StatusBadge status={r.status} />}
                      </div>
                      <p className="text-sm font-medium text-foreground line-clamp-2">
                        {r.fonte === "RDO"
                          ? `RDO Nº ${r._numero_rdo || "—"}${r._area ? ` · ${r._area}` : ""}`
                          : r.descricao}
                      </p>
                      {r.data_hora && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {r.fonte === "RDO" ? formatDate(r.data_hora) : formatDateTime(r.data_hora)}
                        </p>
                      )}
                    </div>
                    <ArrowLeft className="w-4 h-4 text-muted-foreground/40 group-hover:text-ocre rotate-180 flex-shrink-0 mt-1 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
