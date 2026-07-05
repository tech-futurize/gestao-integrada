import { format } from "date-fns";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
// Timestamptz salvo à meia-noite UTC representa uma data pura; converter para local
// deslocaria um dia para trás em UTC-3 — tratar como date-only.
const UTC_MIDNIGHT_RE = /^(\d{4}-\d{2}-\d{2})T00:00:00(\.0+)?(Z|\+00:00)$/;

const pad = (n) => String(n).padStart(2, "0");

// Data local no formato YYYY-MM-DD (nunca usar toISOString().split("T")[0],
// que retorna a data UTC — após 21h no Brasil já é "amanhã")
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Formata um Date local como YYYY-MM-DD sem conversão para UTC
export function toLocalDateISO(d) {
  if (!(d instanceof Date) || isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Convert a UTC ISO string from DB to YYYY-MM-DDTHH:MM in local (São Paulo) time
// datetime-local inputs reject values with timezone info — they need plain local time
export function toDatetimeLocal(val) {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

// Convert a datetime-local value (local time, no TZ) to UTC ISO string for DB storage.
// Valores date-only ("YYYY-MM-DD") são ancorados à meia-noite LOCAL — new Date("YYYY-MM-DD")
// interpretaria como meia-noite UTC e a data regrediria um dia a cada ciclo de edição em UTC-3.
export function toUtcIso(val) {
  if (!val) return null;
  try {
    const d = DATE_ONLY_RE.test(val) ? new Date(val + "T00:00:00") : new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

// Convert a date-only DB value to YYYY-MM-DD for <input type="date">
export function toDateInput(val) {
  if (!val) return "";
  if (DATE_ONLY_RE.test(val)) return val;
  const utcMidnight = typeof val === "string" && val.match(UTC_MIDNIGHT_RE);
  if (utcMidnight) return utcMidnight[1];
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } catch {
    return "";
  }
}

// Display date as "dd/MM/yy" (e.g. "02/06/25")
export function formatDate(val) {
  if (!val) return "";
  try {
    let str = val;
    if (typeof str === "string") {
      const utcMidnight = str.match(UTC_MIDNIGHT_RE);
      if (utcMidnight) str = utcMidnight[1];
    }
    const d = typeof str === "string"
      ? new Date(str.includes("T") ? str : str + "T00:00:00")
      : str;
    if (isNaN(d.getTime())) return "";
    return format(d, "dd/MM/yy");
  } catch {
    return "";
  }
}

// Display date+time as "dd/MM/yy HH:mm" (e.g. "02/06/25 14:30")
export function formatDateTime(val) {
  if (!val) return "";
  try {
    const d = typeof val === "string"
      ? new Date(val.includes("T") ? val : val + "T00:00:00")
      : val;
    if (isNaN(d.getTime())) return "";
    return format(d, "dd/MM/yy HH:mm");
  } catch {
    return "";
  }
}

// Soma `days` dias a uma data ISO (YYYY-MM-DD). Retorna string YYYY-MM-DD ou null.
export function addDaysToDate(dateStr, days) {
  if (!dateStr || days == null) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + days);
  return toLocalDateISO(d);
}
