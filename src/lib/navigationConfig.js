import {
  LayoutDashboard,
  Ruler,
  ShoppingCart,
  ClipboardList,
  ScrollText,
  ShieldAlert,
  Bot,
  Settings2,
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
    ],
  },
  {
    title: "Adm. Contratual",
    icon: ScrollText,
    children: [
      { title: "Contratos", path: "/admin-contratual/contratos" },
      { title: "Medições", path: "/admin-contratual/medicoes" },
      { title: "RDOs", path: "/admin-contratual/rdos" },
      { title: "Registros", path: "/admin-contratual/registros" },
      { title: "Pleitos", path: "/admin-contratual/pleitos" },
      { title: "Mapa de Impacto", path: "/admin-contratual/mapa-impacto" },
    ],
  },
  {
    title: "Riscos e Mudanças",
    icon: ShieldAlert,
    children: [
      { title: "Gestão de Riscos", path: "/riscos-mudancas/gestao-riscos" },
      { title: "Gestão de Mudanças", path: "/riscos-mudancas/gestao-mudancas" },
    ],
  },
  {
    title: "Agentes de IA",
    icon: Bot,
    children: [
      { title: "Executor de Dados", path: "/agentes/executor" },
      { title: "Analista de Negócio", path: "/agentes/analista-negocio" },
      { title: "Analista Contratual", path: "/agentes/analista-contratual" },
    ],
  },
  {
    title: "Configurações",
    icon: Settings2,
    children: [
      { title: "Usuários", path: "/configuracoes/usuarios" },
      { title: "Gerenciar Projeto", path: "/configuracoes/gerenciar-projeto" },
      { title: "Config. Agentes", path: "/configuracoes/agente-config" },
      { title: "Cadastros", path: "/configuracoes/cadastros" },
    ],
  },
];
