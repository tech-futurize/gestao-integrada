export const FIELD_TYPES = [
  { value: 'short_text',      label: 'Texto curto' },
  { value: 'long_text',       label: 'Texto longo' },
  { value: 'number',          label: 'Número' },
  { value: 'email',           label: 'E-mail' },
  { value: 'single_choice',   label: 'Escolha única' },
  { value: 'multiple_choice', label: 'Múltipla escolha' },
  { value: 'dropdown',        label: 'Lista (dropdown)' },
  { value: 'date',            label: 'Data' },
  { value: 'time',            label: 'Hora' },
  { value: 'rating',          label: 'Avaliação' },
  { value: 'section',         label: 'Seção / título' },
];

const CHOICE_TYPES = new Set(['single_choice', 'multiple_choice', 'dropdown']);

export function createEmptyDefinition() {
  return { sections: [createSection()] };
}

export function createSection() {
  return { id: crypto.randomUUID(), title: '', fields: [] };
}

export function createField(type) {
  const base = {
    id: crypto.randomUUID(),
    type,
    label: '',
    description: '',
    required: false,
    placeholder: '',
  };
  if (CHOICE_TYPES.has(type)) {
    base.options = [createOption('Opção 1'), createOption('Opção 2')];
  }
  if (type === 'rating') {
    base.max = 5;
    base.minLabel = '';
    base.maxLabel = '';
  }
  if (['number', 'short_text', 'long_text', 'email'].includes(type)) {
    base.validation = {};
  }
  return base;
}

export function createOption(label = '') {
  return { value: crypto.randomUUID(), label };
}

export function getDefaultAnswer(field) {
  if (field.type === 'multiple_choice') return [];
  if (field.type === 'rating') return null;
  return '';
}

export function countFields(definition) {
  return (definition?.sections || []).reduce(
    (acc, sec) => acc + sec.fields.filter(f => f.type !== 'section').length,
    0
  );
}

// --- Mutações imutáveis da árvore de definição ---

export function updateField(definition, sectionId, fieldId, patch) {
  return {
    ...definition,
    sections: definition.sections.map(sec =>
      sec.id !== sectionId ? sec : {
        ...sec,
        fields: sec.fields.map(f => f.id !== fieldId ? f : { ...f, ...patch }),
      }
    ),
  };
}

export function addField(definition, sectionId, field) {
  return {
    ...definition,
    sections: definition.sections.map(sec =>
      sec.id !== sectionId ? sec : { ...sec, fields: [...sec.fields, field] }
    ),
  };
}

export function removeField(definition, sectionId, fieldId) {
  return {
    ...definition,
    sections: definition.sections.map(sec =>
      sec.id !== sectionId ? sec : {
        ...sec,
        fields: sec.fields.filter(f => f.id !== fieldId),
      }
    ),
  };
}

export function duplicateField(definition, sectionId, fieldId) {
  return {
    ...definition,
    sections: definition.sections.map(sec => {
      if (sec.id !== sectionId) return sec;
      const idx = sec.fields.findIndex(f => f.id === fieldId);
      if (idx === -1) return sec;
      const copy = { ...sec.fields[idx], id: crypto.randomUUID() };
      const fields = [...sec.fields];
      fields.splice(idx + 1, 0, copy);
      return { ...sec, fields };
    }),
  };
}

export function reorderFields(definition, sectionId, oldIndex, newIndex) {
  return {
    ...definition,
    sections: definition.sections.map(sec => {
      if (sec.id !== sectionId) return sec;
      const fields = [...sec.fields];
      const [moved] = fields.splice(oldIndex, 1);
      fields.splice(newIndex, 0, moved);
      return { ...sec, fields };
    }),
  };
}

export function addSection(definition) {
  return { ...definition, sections: [...definition.sections, createSection()] };
}

export function updateSection(definition, sectionId, patch) {
  return {
    ...definition,
    sections: definition.sections.map(sec =>
      sec.id !== sectionId ? sec : { ...sec, ...patch }
    ),
  };
}
