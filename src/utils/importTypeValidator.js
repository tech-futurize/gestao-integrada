/**
 * Converte números em formato pt-BR ("1.234,56"), US ("1,234.56") ou simples ("1234.56").
 * Regras: com vírgula e ponto, o último separador é o decimal; só vírgula é decimal pt-BR;
 * só ponto é decimal, exceto padrão de milhar ("1.234" / "1.234.567").
 * Retorna NaN quando não reconhece.
 */
export function parseFlexibleNumber(raw) {
  if (typeof raw === "number") return raw;
  if (raw === undefined || raw === null) return NaN;
  const s = String(raw).trim().replace(/\s/g, "");
  if (!s) return NaN;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  let normalized = s;

  if (hasComma && hasDot) {
    normalized = s.lastIndexOf(",") > s.lastIndexOf(".")
      ? s.replace(/\./g, "").replace(",", ".")
      : s.replace(/,/g, "");
  } else if (hasComma) {
    const commas = (s.match(/,/g) || []).length;
    normalized = commas > 1 ? s.replace(/,/g, "") : s.replace(",", ".");
  } else if (hasDot) {
    const dots = (s.match(/\./g) || []).length;
    const isThousands = dots > 1 || /^-?\d{1,3}(\.\d{3})+$/.test(s);
    normalized = isThousands ? s.replace(/\./g, "") : s;
  }

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return NaN;
  return parseFloat(normalized);
}

/**
 * Tenta converter `value` para o tipo `type`.
 * `required` — quando true, célula vazia é rejeitada em vez de virar null.
 * Retorna { ok: true, value: converted } ou { ok: false, value: original }.
 */
export function validateAndConvert(value, type, required = false) {
  const raw = value === undefined || value === null ? "" : String(value).trim();

  if (raw === "") {
    return required ? { ok: false, value: raw } : { ok: true, value: null };
  }

  switch (type) {
    case "string":
      return { ok: true, value: raw };

    case "number": {
      const num = parseFlexibleNumber(raw);
      if (isNaN(num)) return { ok: false, value: raw };
      return { ok: true, value: num };
    }

    case "date": {
      // dd/mm/yyyy tem prioridade — new Date("04/07/2026") interpretaria como MM/DD (US)
      const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (br) {
        const [, d, m, y] = br;
        const day = Number(d), month = Number(m), year = Number(y);
        const check = new Date(year, month - 1, day);
        if (check.getFullYear() !== year || check.getMonth() !== month - 1 || check.getDate() !== day) {
          return { ok: false, value: raw };
        }
        return { ok: true, value: `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` };
      }
      // ISO (YYYY-MM-DD ou com hora) — extrai a parte da data sem shift de timezone
      const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (iso) {
        const check = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00`);
        if (isNaN(check.getTime())) return { ok: false, value: raw };
        return { ok: true, value: `${iso[1]}-${iso[2]}-${iso[3]}` };
      }
      // Demais formatos (datas de Excel serializadas etc.) — parse local
      const parsed = new Date(raw);
      if (isNaN(parsed.getTime())) return { ok: false, value: raw };
      const pad = (n) => String(n).padStart(2, "0");
      return { ok: true, value: `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}` };
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
