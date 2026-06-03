// ── FORMAT HELPERS ────────────────────────────────────────────────────────────
export function formatMilhoes(value) {
  if (!value && value !== 0) return "—";
  if (value >= 1e6) return `R$ ${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `R$ ${(value / 1e3).toFixed(0)}k`;
  return `R$ ${value.toFixed(0)}`;
}

// ── SECTION HEADER ────────────────────────────────────────────────────────────
// Props: { title, icon: Icon, color, subtitle }
// SEM botão "Ver módulo"
export function SectionHeader({ title, icon: Icon, color, subtitle }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color + "20" }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

// ── KPI CARD ──────────────────────────────────────────────────────────────────
// Props: { label, value, icon: Icon, color, bg, sub }
export function KpiCard({ label, value, icon: Icon, color, bg, sub }) {
  return (
    <div
      className="flex items-center gap-3 p-4 rounded-xl"
      style={{ backgroundColor: bg || color + "0d" }}
    >
      {Icon && (
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color + "20" }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      )}
      <div>
        <div className="text-2xl font-bold leading-tight" style={{ color }}>
          {value}
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {sub && (
          <div className="text-xs font-medium mt-0.5" style={{ color }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

// ── STATUS BADGE ──────────────────────────────────────────────────────────────
// Props: { label, variant }
// variant: "critical" | "attention" | "positive" | "blue" | "neutral"
const STATUS_BADGE_CLASSES = {
  critical: "bg-status-critical/15 text-status-critical",
  attention: "bg-status-attention/15 text-status-attention",
  positive: "bg-status-positive/15 text-status-positive",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  neutral: "bg-muted text-muted-foreground",
};

export function StatusBadge({ label, variant = "neutral" }) {
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        STATUS_BADGE_CLASSES[variant] || STATUS_BADGE_CLASSES.neutral
      }`}
    >
      {label}
    </span>
  );
}

// ── SUB SECTION BAND ─────────────────────────────────────────────────────────
// Props: { title, tagline, bg, color, borderColor }
// Usado em blocos internos de Planejamento e Adm. Contratual.
// Exemplo: <SubSectionBand title="📅 Cronograma" tagline="Avanço Físico · 6WLA · Datas" bg="#eef2f8" color="#26405d" borderColor="#d7e0ec" />
export function SubSectionBand({ title, tagline, bg, color, borderColor }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 font-bold text-sm border-b"
      style={{
        backgroundColor: bg,
        color,
        borderColor,
      }}
    >
      <span>{title}</span>
      {tagline && (
        <span className="text-xs font-normal text-muted-foreground ml-auto">
          {tagline}
        </span>
      )}
    </div>
  );
}
