import {
  LayoutDashboard,
  Ruler,
  ShoppingCart,
  ClipboardList,
  ScrollText,
  ShieldAlert,
  Bot,
  Settings2,
  FileText,
} from "lucide-react";

export const navigationGroups = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  {
    title: "Engenharia",
    icon: Ruler,
    children: [{ title: "Documentos", path: "/engenharia/documentos" }],
  },
  {
    title: "Suprimentos",
    icon: ShoppingCart,
    children: [
      { title: "Mapa de Suprimentos", path: "/suprimentos/mapa" },
    ],
  },
  {
    title: "Planejamento",
    icon: ClipboardList,
    children: [
      { title: "Cronograma", path: "/planejamento/cronograma" },
      { title: "6WLA", path: "/planejamento/6wla" },
      { title: "Take-Off", path: "/planejamento/take-off" },
      { title: "Histogramas", path: "/planejamento/histograma" },
      { title: "Avanços", path: "/planejamento/avancos" },
      { title: "Faturamento", path: "/planejamento/faturamento" },
    ],
  },
  {
    title: "Adm. Contratual",
    icon: ScrollText,
    children: [
      { title: "Contratos", path: "/admin-contratual/contratos" },
      { title: "RDOs", path: "/admin-contratual/rdos" },
      { title: "Registros", path: "/admin-contratual/registros" },
      { title: "Pleitos", path: "/admin-contratual/pleitos" },
      { title: "Mapa de Impacto", path: "/admin-contratual/mapa-impacto" },
      { title: "Gestão de Mudanças", path: "/admin-contratual/gestao-mudancas" },
    ],
  },
  {
    title: "Riscos",
    // O módulo de permissões usa "Riscos e Mudanças" — sem esta chave o grupo
    // ficaria invisível para todo usuário não-admin (permissoes["Riscos"] nunca existe)
    permissionKey: "Riscos e Mudanças",
    icon: ShieldAlert,
    children: [
      { title: "Gestão de Riscos", path: "/riscos-mudancas/gestao-riscos" },
    ],
  },
  {
    title: "Formulários Digitais",
    icon: FileText,
    children: [
      { title: "Formulários", path: "/formularios" },
    ],
  },
  {
    title: "Agentes de IA",
    icon: Bot,
    // children são carregados dinamicamente do banco em Layout.jsx (apenas agentes ativos)
    children: [],
  },
  {
    title: "Configurações",
    icon: Settings2,
    children: [
      { title: "Usuários", path: "/configuracoes/usuarios" },
      { title: "Gerenciar Projeto", path: "/configuracoes/gerenciar-projeto" },
      { title: "Configurar Agentes", path: "/configuracoes/agentes-admin" },
      { title: "Cadastros", path: "/configuracoes/cadastros" },
    ],
  },
];
