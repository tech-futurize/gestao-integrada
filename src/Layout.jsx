import { useState, useEffect, useMemo } from "react";
import { useDarkMode } from "@/hooks/useDarkMode";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { useProject } from "@/lib/ProjectContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { navigationGroups } from "@/lib/navigationConfig";
import { usePermissionsMap } from "@/hooks/usePermissions";
import SidebarUserMenu from "@/components/ui/SidebarUserMenu";
import {
  ChevronDown,
  CheckCircle2,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const LOGO_URL = "/logo.png";

export default function Layout({ children }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [openModule, setOpenModule] = useState(null);
  const [flyoutGroup, setFlyoutGroup] = useState(null);
  const [flyoutY, setFlyoutY] = useState(0);
  const isDark = useDarkMode();
  const { selectedProjectId, setSelectedProjectId } = useProject();
  const { permissoes, isAdmin } = usePermissionsMap();

  const visibleNavigation = useMemo(() => {
    if (isAdmin) return navigationGroups;
    return navigationGroups.filter(group =>
      permissoes[group.title]?.view === true
    );
  }, [permissoes, isAdmin]);

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

  useEffect(() => {
    setFlyoutGroup(null);
    const activeGroup = navigationGroups.find(
      (g) => g.children?.some((c) => c.path === location.pathname)
    );
    if (activeGroup) setOpenModule(activeGroup.title);
  }, [location.pathname]);

  const selectedProject = projetosDB.find(p => p.id === selectedProjectId) ?? null;

  const handleSelectAll = () => {
    setSelectedProjectId(null);
    setDialogOpen(false);
  };

  function openFlyout(e, group) {
    const rect = e.currentTarget.getBoundingClientRect();
    const PANEL_ESTIMATED_HEIGHT = group.children.length * 36 + 40;
    const maxTop = window.innerHeight - PANEL_ESTIMATED_HEIGHT - 8;
    setFlyoutY(Math.min(rect.top, maxTop));
    setFlyoutGroup(flyoutGroup?.title === group.title ? null : group);
  }

  const sidebarW = collapsed ? "w-16" : "w-60";

  return (
    <>
      <div className="h-screen flex w-full bg-background overflow-hidden relative">

        {/* Botão colapso — fora do aside para não ser cortado pelo overflow-hidden */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`absolute top-5 z-30 w-6 h-6 rounded-full flex items-center justify-center shadow-md bg-sidebar border border-sidebar-border transition-all duration-300 hover:bg-sidebar-accent ${collapsed ? "left-[52px]" : "left-[228px]"}`}
        >
          {collapsed
            ? <ChevronRight className="w-3.5 h-3.5 text-sidebar-primary" />
            : <ChevronLeft className="w-3.5 h-3.5 text-sidebar-primary" />}
        </button>

        {/* ── SIDEBAR ── */}
        <aside
          className={`flex-shrink-0 flex flex-col relative z-20 transition-all duration-300 bg-sidebar h-screen overflow-hidden border-r border-sidebar-border ${sidebarW}`}
        >

          {/* Logo */}
          <div className="flex flex-col items-center px-2 pt-4 pb-3 border-b border-sidebar-border">
            <img
              src={LOGO_URL}
              alt="Futurize"
              className={`object-contain transition-all duration-300 ${collapsed ? "h-7" : "h-10"}`}
            />
            {!collapsed && (
              <p className="text-xs font-bold text-center mt-1.5 leading-tight text-sidebar-foreground/90">
                Sistema de Gestão Integrada
              </p>
            )}
          </div>

          {/* Projeto Ativo */}
          <div className="px-2 py-2 border-b border-sidebar-border">
            {collapsed ? (
              <button
                onClick={() => setDialogOpen(true)}
                className="w-full flex items-center justify-center rounded-lg py-2 hover:bg-sidebar-accent transition-colors"
                title={selectedProject ? selectedProject.nome : "Todos os Projetos"}
              >
                <Layers className="w-6 h-6 text-sidebar-primary" />
              </button>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider px-1 text-sidebar-foreground/55">
                  Projeto Ativo
                </label>
                <button
                  onClick={() => setDialogOpen(true)}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg border border-sidebar-primary bg-sidebar-primary/10 text-sidebar-foreground transition-all hover:bg-sidebar-primary/20"
                  style={isDark ? { boxShadow: "0 0 8px rgba(38,255,255,0.2)" } : undefined}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Layers className="w-4 h-4 flex-shrink-0 text-sidebar-primary" />
                    <span className="text-xs font-semibold truncate">
                      {selectedProject ? selectedProject.nome : "Todos os Projetos"}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                </button>
              </div>
            )}
          </div>

          {/* Navegação */}
          <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
            {!collapsed && (
              <p className="text-xs font-semibold uppercase tracking-wider px-2 py-1.5 text-sidebar-foreground/40">
                Navegação
              </p>
            )}
            {visibleNavigation.map((group) => {
              const isParentActive = group.children?.some(c => c.path === location.pathname);

              if (!group.children) {
                const isActive = location.pathname === group.path;
                return (
                  <Link
                    key={group.title}
                    to={group.path}
                    title={collapsed ? group.title : undefined}
                    className={`flex items-center rounded-lg transition-all duration-200 ${
                      collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-2.5 py-2"
                    } ${isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-bold"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                    style={isActive && isDark ? { boxShadow: "0 0 12px rgba(38,255,255,0.4)" } : undefined}
                  >
                    <group.icon className={`flex-shrink-0 ${collapsed ? "w-5 h-5" : "w-4 h-4"}`} />
                    {!collapsed && <span className="font-semibold text-sm truncate">{group.title}</span>}
                  </Link>
                );
              }

              const isOpen = openModule === group.title;

              return (
                <div key={group.title}>
                  <button
                    onClick={(e) => {
                      if (collapsed) {
                        openFlyout(e, group);
                      } else {
                        setOpenModule(isOpen ? null : group.title);
                      }
                    }}
                    title={collapsed ? group.title : undefined}
                    className={`w-full flex items-center rounded-lg transition-all duration-200 ${
                      collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-2.5 py-2"
                    } ${isParentActive
                      ? collapsed
                        ? "bg-sidebar-accent/30 text-sidebar-primary"
                        : "bg-sidebar-accent/30 text-sidebar-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    <group.icon className={`flex-shrink-0 ${collapsed ? "w-5 h-5" : "w-4 h-4"}`} />
                    {!collapsed && (
                      <>
                        <span className="font-semibold text-sm truncate flex-1 text-left">{group.title}</span>
                        <ChevronRight
                          className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                        />
                      </>
                    )}
                  </button>

                  {!collapsed && isOpen && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2">
                      {group.children.map((child) => {
                        const isActive = location.pathname === child.path;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                              isActive
                                ? "bg-sidebar-primary text-sidebar-primary-foreground font-bold"
                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            }`}
                            style={isActive && isDark ? { boxShadow: "0 0 8px rgba(38,255,255,0.3)" } : undefined}
                          >
                            <span className="truncate">{child.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <SidebarUserMenu collapsed={collapsed} />
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden bg-background">
            {children}
          </div>
        </main>

        {/* Dialog seleção de projeto */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">Selecionar Projeto Ativo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-center">
                <button
                  onClick={handleSelectAll}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full border-2 font-semibold text-sm transition-all hover:opacity-90 ${
                    !selectedProjectId
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground"
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
                        isSelected ? "border-primary" : "border-border"
                      }`}
                    >
                      <div className="relative h-24 flex items-center justify-center bg-primary dark:bg-cobalt">
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
                            <CheckCircle2 className="w-4 h-4" />
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

        {/* Flyout navegação (sidebar recolhida) */}
        {flyoutGroup && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setFlyoutGroup(null)}
            />
            <div
              className="fixed z-50 bg-sidebar border border-sidebar-border rounded-lg shadow-xl min-w-[180px] py-1"
              style={{ left: 64, top: flyoutY }}
            >
              <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-sidebar-foreground/50 border-b border-sidebar-border">
                {flyoutGroup.title}
              </p>
              {flyoutGroup.children.map((child) => {
                const isActive = location.pathname === child.path;
                return (
                  <Link
                    key={child.path}
                    to={child.path}
                    onClick={() => setFlyoutGroup(null)}
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md mx-1 my-0.5 transition-all duration-200 ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground font-bold"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    }`}
                    style={isActive && isDark ? { boxShadow: "0 0 8px rgba(38,255,255,0.3)" } : undefined}
                  >
                    {child.title}
                  </Link>
                );
              })}
            </div>
          </>
        )}

      </div>
    </>
  );
}
