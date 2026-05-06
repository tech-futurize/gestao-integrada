import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { useProject } from "@/lib/ProjectContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LayoutDashboard,
  FileText,
  Settings,
  BarChart3,
  TrendingUp,
  GitBranch,
  ShoppingCart,
  ClipboardList,
  ShieldAlert,
  ChevronDown,
  CheckCircle2,
  Layers,
  Ruler,
  ChevronLeft,
  ChevronRight,
  Bot,
  Settings2,
  ScrollText,
  FolderOpen,
} from "lucide-react";


const navigationItems = [
  { title: "Dashboard", url: "Dashboard", icon: LayoutDashboard },
  { title: "Engenharia", url: "Engenharia", icon: Ruler },
  { title: "Suprimentos", url: "Suprimentos", icon: ShoppingCart },
  { title: "Contratos", url: "Contratos", icon: ScrollText },
  { title: "Planejamento", url: "Planejamento", icon: ClipboardList },
  { title: "Histograma", url: "Histograma", icon: BarChart3 },
  { title: "Avanço Físico", url: "AvancoFisico", icon: TrendingUp },
  { title: "Pleitos", url: "Pleitos", icon: FileText },
  { title: "Qualidade", url: "Qualidade", icon: Settings },
  { title: "Gestão de Mudanças", url: "GestaoMudancas", icon: GitBranch },
  { title: "Gestão de Riscos", url: "GestaoRiscos", icon: ShieldAlert },
  { title: "Gerenciar Projeto", url: "GerenciarProjeto", icon: FolderOpen },
  { title: "Agente IA", url: "Agente", icon: Bot },
  { title: "Config. Agente", url: "AgenteConfig", icon: Settings2 },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { selectedProjectId, setSelectedProjectId } = useProject();

  const { data: projetosDB = [] } = useQuery({
    queryKey: ["projetos"],
    queryFn: async () => {
      const { data } = await supabase.from('projetos').select('id, nome, cliente');
      return data ?? [];
    },
  });

  useEffect(() => {
    if (projetosDB.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projetosDB[0].id);
    }
  }, [projetosDB, selectedProjectId, setSelectedProjectId]);

  const selectedProject = projetosDB.find(p => p.id === selectedProjectId) ?? null;

  const handleSelectAll = () => {
    setSelectedProjectId(null);
    setDialogOpen(false);
  };

  const sidebarW = collapsed ? "w-16" : "w-60";

  return (
    <>
      <div className="min-h-screen flex w-full bg-brand-bg">

        {/* ── SIDEBAR ── */}
        <aside
          className={`flex-shrink-0 flex flex-col relative transition-all duration-300 bg-brand-primary min-h-screen ${sidebarW}`}
        >
          {/* Toggle button */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="absolute -right-3 top-5 z-20 w-6 h-6 rounded-full flex items-center justify-center shadow-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            {collapsed
              ? <ChevronRight className="w-3.5 h-3.5 text-brand-primary" />
              : <ChevronLeft className="w-3.5 h-3.5 text-brand-primary" />}
          </button>

          {/* Header */}
          <div
            className="flex flex-col items-center px-2 pt-4 pb-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69aff7051dae3ee60a66c065/5ef3f6de4_LogoVetor.png"
              alt="Futurize"
              className={`object-contain transition-all duration-300 ${collapsed ? "h-7" : "h-10"}`}
            />
            {!collapsed && (
              <p className="text-xs font-bold text-center mt-1.5 leading-tight text-white/90">
                Sistema de Gestão Integrada
              </p>
            )}
          </div>

          {/* Projeto Ativo */}
          <div className="px-2 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {collapsed ? (
              <button
                onClick={() => setDialogOpen(true)}
                className="w-full flex items-center justify-center rounded-lg py-2 hover:opacity-80 transition-opacity"
                title={selectedProject ? selectedProject.nome : "Todos os Projetos"}
              >
                <Layers className="w-6 h-6 text-brand-accent" />
              </button>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider px-1 text-white/55">
                  Projeto Ativo
                </label>
                <button
                  onClick={() => setDialogOpen(true)}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg border border-brand-accent bg-white/10 text-white transition-all hover:opacity-90"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Layers className="w-4 h-4 flex-shrink-0 text-brand-accent" />
                    <span className="text-xs font-semibold truncate">
                      {selectedProject ? selectedProject.nome : "Todos os Projetos"}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                </button>
              </div>
            )}
          </div>

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
            {!collapsed && (
              <p className="text-xs font-semibold uppercase tracking-wider px-2 py-1.5 text-white/40">
                Navegação
              </p>
            )}
            {navigationItems.map((item) => {
              const isActive = location.pathname === createPageUrl(item.url);
              return (
                <Link
                  key={item.title}
                  to={createPageUrl(item.url)}
                  title={collapsed ? item.title : undefined}
                  className={`flex items-center rounded-lg transition-all duration-200 ${
                    collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-2.5 py-2"
                  } ${isActive ? "bg-brand-accent text-white" : "text-white/85 hover:bg-white/10"}`}
                >
                  <item.icon className={`flex-shrink-0 ${collapsed ? "w-5 h-5" : "w-4 h-4"}`} />
                  {!collapsed && <span className="font-semibold text-sm truncate">{item.title}</span>}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
            <h1 className="text-xl font-bold text-brand-primary">
              {currentPageName}
            </h1>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69aff7051dae3ee60a66c065/5ef3f6de4_LogoVetor.png"
              alt="Futurize"
              className="h-9 object-contain"
            />
          </header>

          <div className="flex-1 overflow-auto bg-brand-bg">
            {children}
          </div>
        </main>

        {/* Dialog seleção de projeto */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-brand-primary">Selecionar Projeto Ativo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-center">
                <button
                  onClick={handleSelectAll}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full border-2 font-semibold text-sm transition-all hover:opacity-90 ${
                    !selectedProjectId
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-gray-300 text-brand-primary"
                  }`}
                >
                  {!selectedProjectId && <CheckCircle2 className="w-4 h-4" />}
                  <Layers className="w-4 h-4" />
                  Todos os Projetos
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {projetosDB.map((projeto) => {
                  const isSelected = selectedProjectId === projeto.id;
                  return (
                    <button
                      key={projeto.id}
                      onClick={() => {
                        setSelectedProjectId(projeto.id);
                        setDialogOpen(false);
                      }}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all hover:scale-[1.02] text-left ${
                        isSelected ? "border-brand-accent" : "border-gray-200"
                      }`}
                      style={{ boxShadow: isSelected ? '0 0 0 3px rgba(195,94,30,0.25)' : 'none' }}
                    >
                      <div className="relative h-24 flex items-center justify-center bg-brand-primary">
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-brand-accent">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="p-4 w-full">
                          <div className="text-white font-bold text-sm leading-tight">{projeto.nome}</div>
                          <div className="text-xs mt-1 text-white/75">{projeto.cliente}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}