import { ArrowLeft, Eye, Pencil, Save, Monitor, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function FormBuilderHeader({
  titulo, descricao, ativo,
  onTituloChange, onDescricaoChange, onAtivoChange,
  mode, onModeChange,
  previewDevice, onPreviewDeviceChange,
  onSave, saving,
}) {
  const navigate = useNavigate();

  return (
    <div className="bg-card border-b border-border sticky top-0 z-10">
      {/* Controls bar */}
      <div className="flex items-center justify-between px-6 py-3 gap-4 flex-wrap">
        <button
          onClick={() => navigate("/configuracoes/cadastros")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Cadastros
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Edit / Preview toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => onModeChange("edit")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold transition-colors ${
                mode === "edit" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/30"
              }`}
            >
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
            <button
              onClick={() => onModeChange("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold transition-colors ${
                mode === "preview" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/30"
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Visualizar
            </button>
          </div>

          {/* Desktop / Mobile toggle — only visible in preview mode */}
          {mode === "preview" && (
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => onPreviewDeviceChange("desktop")}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  previewDevice === "desktop" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/30"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> Desktop
              </button>
              <button
                onClick={() => onPreviewDeviceChange("mobile")}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  previewDevice === "mobile" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/30"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Mobile
              </button>
            </div>
          )}

          {/* Active / Inactive toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="builder-ativo"
              checked={ativo}
              onCheckedChange={onAtivoChange}
            />
            <Label htmlFor="builder-ativo" className="text-sm cursor-pointer">
              {ativo ? "Ativo" : "Inativo"}
            </Label>
          </div>

          <Button onClick={onSave} disabled={saving} size="sm">
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {/* Form title and description */}
      <div className="px-6 pb-4 border-t border-primary/20 bg-primary/5">
        <input
          value={titulo}
          onChange={e => onTituloChange(e.target.value)}
          placeholder="Título do formulário..."
          className="w-full text-xl font-bold bg-transparent border-0 focus:outline-none text-foreground mt-3"
        />
        <input
          value={descricao}
          onChange={e => onDescricaoChange(e.target.value)}
          placeholder="Descrição (opcional)..."
          className="w-full text-sm text-muted-foreground bg-transparent border-0 focus:outline-none mt-1.5"
        />
      </div>
    </div>
  );
}
