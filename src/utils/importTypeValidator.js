/**
 * Tenta converter `value` para o tipo `type`.
 * Retorna { ok: true, value: converted } ou { ok: false, value: original }.
 */
export function validateAndConvert(value, type) {
  const raw = value === undefined || value === null ? "" : String(value).trim();

  if (raw === "") {
    return { ok: true, value: null };
  }

  switch (type) {
    case "string":
      return { ok: true, value: raw };

    case "number": {
      const normalized = raw.replace(",", ".");
      const num = parseFloat(normalized);
      if (isNaN(num)) return { ok: false, value: raw };
      return { ok: true, value: num };
    }

    case "date": {
      let parsed = new Date(raw);
      if (isNaN(parsed.getTime())) {
        const parts = raw.split("/");
        if (parts.length === 3) {
          parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
      if (isNaN(parsed.getTime())) return { ok: false, value: raw };
      return { ok: true, value: parsed.toISOString().split("T")[0] };
    }

    case "boolean": {
      const lower = raw.toLowerCase();
      if (["true", "1", "sim", "yes", "s"].includes(lower)) return { ok: true, value: true };
      if (["false", "0", "não", "nao", "no", "n"].includes(lower)) return { ok: true, value: false };
      return { ok: false, value: raw };
    }

    default:
      return { ok: true, value: raw };
  }
}
