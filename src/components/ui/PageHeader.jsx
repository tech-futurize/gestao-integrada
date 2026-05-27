import { useState } from "react";
import { useLocation } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/AnimatedThemeToggler";
import { Button } from "@/components/ui/button";
import { navigationGroups } from "@/lib/navigationConfig";

const LOGO_URL = "/logo.png";

function getCurrentPage(pathname) {
  if (pathname === "/dashboard") return { moduleName: "Dashboard", submodule: null };
  for (const group of navigationGroups) {
    if (group.path === pathname) return { moduleName: group.title, submodule: null };
    const child = group.children?.find((c) => c.path === pathname);
    if (child) return { moduleName: group.title, submodule: child.title };
  }
  return { moduleName: "", submodule: null };
}

export default function PageHeader({ actions, filters }) {
  const { pathname } = useLocation();
  const { moduleName, submodule } = getCurrentPage(pathname);
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="sticky top-0 z-10 shadow-sm">
      {/* Barra principal */}
      <header className="bg-[#1e293b] border-b border-[#334155] px-4 py-2 flex items-center gap-3">
        {/* Breadcrumb */}
        <span className="text-sm font-bold text-slate-100 whitespace-nowrap shrink-0">
          {moduleName}
          {submodule && (
            <>
              <span className="text-slate-500 mx-1.5">›</span>
              {submodule}
            </>
          )}
        </span>

        {/* Espaçador incondicional */}
        <div className="flex-1" />

        {/* Filters — exibidos inline no header em ≥ 1024px; colapsável em < 1024px */}
        {filters && (
          <Button
            variant="outline"
            size="sm"
            aria-expanded={filtersOpen}
            aria-controls="page-header-filters"
            onClick={() => setFiltersOpen((o) => !o)}
            className="lg:hidden border-slate-600 bg-transparent text-slate-300 hover:bg-slate-700 shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 mr-1.5" />
            Filtros ▾
          </Button>
        )}

        {/* Ações */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}

        {/* Theme toggler */}
        <AnimatedThemeToggler
          variant="circle"
          duration={400}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#334155] bg-[#1e293b] text-slate-100 hover:bg-[#334155] transition-colors shrink-0"
        />

        {/* Logo */}
        <img src={LOGO_URL} alt="Futurize" className="h-9 object-contain shrink-0" />
      </header>

      {/* Segunda linha de filtros */}
      {/* Em desktop (lg): sempre visível como barra fina abaixo do header */}
      {/* Em mobile: visível apenas quando filtersOpen === true */}
      {filters && (
        <div
          id="page-header-filters"
          className={[
            "bg-[#1e293b] border-b border-[#334155] px-4 py-2 items-center gap-2 flex-wrap",
            filtersOpen ? "flex" : "hidden lg:flex",
          ].join(" ")}
        >
          {filters}
        </div>
      )}
    </div>
  );
}
