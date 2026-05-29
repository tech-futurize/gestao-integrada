// src/lib/permissionsConfig.js

export const MODULES = [
  'Dashboard',
  'Engenharia',
  'Suprimentos',
  'Planejamento',
  'Adm. Contratual',
  'Riscos e Mudanças',
  'Agentes de IA',
  'Configurações',
];

export const ACTIONS = ['view', 'create', 'edit', 'delete'];

export const ACTION_LABELS = {
  view: 'Ver',
  create: 'Criar',
  edit: 'Editar',
  delete: 'Excluir',
};

export const DENY_ALL  = { view: false, create: false, edit: false, delete: false };
export const ALLOW_ALL = { view: true,  create: true,  edit: true,  delete: true  };

const ALL  = ALLOW_ALL;
const VIEW = { view: true,  create: false, edit: false, delete: false };
const NONE = DENY_ALL;

export const PERFIL_SEED = {
  Admin: {
    'Dashboard': ALL, 'Engenharia': ALL, 'Suprimentos': ALL, 'Planejamento': ALL,
    'Adm. Contratual': ALL, 'Riscos e Mudanças': ALL, 'Agentes de IA': ALL, 'Configurações': ALL,
  },
  Gestor: {
    'Dashboard': ALL, 'Engenharia': ALL, 'Suprimentos': ALL, 'Planejamento': ALL,
    'Adm. Contratual': ALL, 'Riscos e Mudanças': ALL, 'Agentes de IA': ALL,
    'Configurações': VIEW,
  },
  Visualizador: {
    'Dashboard': VIEW, 'Engenharia': VIEW, 'Suprimentos': VIEW, 'Planejamento': VIEW,
    'Adm. Contratual': VIEW, 'Riscos e Mudanças': VIEW, 'Agentes de IA': VIEW,
    'Configurações': NONE,
  },
  Engenharia: {
    'Dashboard': VIEW, 'Engenharia': ALL, 'Suprimentos': VIEW, 'Planejamento': VIEW,
    'Adm. Contratual': VIEW, 'Riscos e Mudanças': VIEW, 'Agentes de IA': VIEW,
    'Configurações': NONE,
  },
  Planejamento: {
    'Dashboard': VIEW, 'Engenharia': VIEW, 'Suprimentos': VIEW, 'Planejamento': ALL,
    'Adm. Contratual': VIEW, 'Riscos e Mudanças': VIEW, 'Agentes de IA': VIEW,
    'Configurações': NONE,
  },
  Contratual: {
    'Dashboard': VIEW, 'Engenharia': VIEW, 'Suprimentos': VIEW, 'Planejamento': VIEW,
    'Adm. Contratual': ALL, 'Riscos e Mudanças': VIEW, 'Agentes de IA': VIEW,
    'Configurações': NONE,
  },
  Suprimentos: {
    'Dashboard': VIEW, 'Engenharia': VIEW, 'Suprimentos': ALL, 'Planejamento': VIEW,
    'Adm. Contratual': VIEW, 'Riscos e Mudanças': VIEW, 'Agentes de IA': VIEW,
    'Configurações': NONE,
  },
};

export const PERFIL_OPTIONS = Object.keys(PERFIL_SEED);
