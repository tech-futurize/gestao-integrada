import { format } from "date-fns";

// Convert a UTC ISO string from DB to YYYY-MM-DDTHH:MM in local (São Paulo) time
// datetime-local inputs reject values with timezone info — they need plain local time
export function toDatetimeLocal(val) {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

// Convert a datetime-local value (local time, no TZ) to UTC ISO string for DB storage
// new Date("YYYY-MM-DDTHH:MM") treats string as local time; .toISOString() gives UTC
export function toUtcIso(val) {
  if (!val) return null;
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

// Convert a date-only DB value to YYYY-MM-DD for <input type="date">
export function toDateInput(val) {
  if (!val) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } catch {
    return "";
  }
}

// Display date as "dd/MM/yy" (e.g. "02/06/25")
export function formatDate(val) {
  if (!val) return "";
  try {
    const d = typeof val === "string"
      ? new Date(val.includes("T") ? val : val + "T00:00:00")
      : val;
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
