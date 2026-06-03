export function validateAnswers(definition, answers) {
  const errors = {};

  (definition?.sections || []).forEach(sec => {
    sec.fields.forEach(field => {
      if (field.type === 'section') return;

      const val = answers[field.id];
      const isEmpty =
        val === '' || val === null || val === undefined ||
        (Array.isArray(val) && val.length === 0);

      if (field.required && isEmpty) {
        errors[field.id] = 'Este campo é obrigatório.';
        return;
      }
      if (isEmpty) return;

      const v = field.validation || {};

      if (field.type === 'number') {
        const num = Number(val);
        if (isNaN(num)) { errors[field.id] = 'Informe um número válido.'; return; }
        if (v.min !== undefined && num < v.min) { errors[field.id] = `Valor mínimo: ${v.min}.`; return; }
        if (v.max !== undefined && num > v.max) { errors[field.id] = `Valor máximo: ${v.max}.`; return; }
      }

      if (field.type === 'short_text' || field.type === 'long_text') {
        if (v.minLength && val.length < v.minLength) { errors[field.id] = `Mínimo ${v.minLength} caracteres.`; return; }
        if (v.maxLength && val.length > v.maxLength) { errors[field.id] = `Máximo ${v.maxLength} caracteres.`; return; }
        if (v.pattern && !new RegExp(v.pattern).test(val)) { errors[field.id] = 'Formato inválido.'; return; }
      }

      if (field.type === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          errors[field.id] = 'Informe um e-mail válido.';
        }
      }
    });
  });

  return { valid: Object.keys(errors).length === 0, errors };
}
