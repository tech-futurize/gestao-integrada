import { LogOut, ChevronRight, KeyRound } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { AnimatedThemeToggler } from "@/components/ui/AnimatedThemeToggler";
import { useAuth } from "@/lib/AuthContext";

function getInitials(user) {
  const name = user?.user_metadata?.full_name;
  if (name) {
    const parts = name.trim().split(" ");
    return (parts[0][0] + (parts[parts.length - 1][0] ?? "")).toUpperCase();
  }
  return (user?.email?.[0] ?? "?").toUpperCase();
}

export default function SidebarUserMenu({ collapsed }) {
  const { user, logout } = useAuth();

  const initials = getInitials(user);
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
  const email = user?.email || "";

  return (
    <div className="border-t border-sidebar-border p-2">
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={`w-full flex items-center rounded-lg px-2 py-2 transition-colors hover:bg-sidebar-accent text-sidebar-foreground ${
              collapsed ? "justify-center" : "gap-3"
            }`}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-sidebar-primary text-sidebar-primary-foreground">
              {initials}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold truncate leading-tight">{name}</p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">{email}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
              </>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          side="right"
          align="end"
          sideOffset={8}
          className="w-64 p-0 bg-sidebar border-sidebar-border text-sidebar-foreground"
        >
          {/* Toggle de tema */}
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-sidebar-border">
            <span className="text-sm text-sidebar-foreground/80">Tema</span>
            <AnimatedThemeToggler
              variant="circle"
              duration={400}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-sidebar-border bg-sidebar hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
            />
          </div>

          {/* Dados do usuário */}
          <div className="px-4 py-3 border-b border-sidebar-border">
            <p className="text-sm font-semibold truncate">{name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{email}</p>
          </div>

          {/* Trocar senha */}
          <button
            disabled
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors border-b border-sidebar-border opacity-50 cursor-not-allowed"
          >
            <KeyRound className="w-4 h-4" />
            Trocar senha
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors rounded-b-md"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
