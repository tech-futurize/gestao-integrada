import { useLocation } from "react-router-dom";
import { navigationGroups } from "@/lib/navigationConfig";

function getCurrentPage(pathname) {
  if (pathname === "/dashboard") return { moduleName: "Dashboard", submodule: null };
  for (const group of navigationGroups) {
    if (group.path === pathname) return { moduleName: group.title, submodule: null };
    const child = group.children?.find((c) => c.path === pathname);
    if (child) return { moduleName: group.title, submodule: child.title };
  }
  return { moduleName: "", submodule: null };
}

export default function PageHeader({ actions }) {
  const { pathname } = useLocation();
  const { moduleName, submodule } = getCurrentPage(pathname);

  return (
    <header className="sticky top-0 z-10 bg-sidebar border-b border-sidebar-border px-4 py-2 flex items-center gap-3 shadow-sm">
      <span className="text-sm font-bold text-sidebar-foreground whitespace-nowrap shrink-0">
        {moduleName}
        {submodule && (
          <>
            <span className="text-sidebar-foreground/50 mx-1.5">›</span>
            {submodule}
          </>
        )}
      </span>

      <div className="flex-1" />

      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}
