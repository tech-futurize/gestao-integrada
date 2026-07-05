import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  X, Plus, ChevronDown, ChevronUp, Sun, Cloud, CloudRain,
  CheckCircle, XCircle, Upload, Link2,
  Users, Truck, ClipboardList, AlertTriangle, Camera,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { VincularAtividadesDialog } from "./VincularAtividadesDialog";
import { useCategoriasImpacto } from "@/hooks/useCategoriasImpacto";
import { todayISO } from "@/lib/dateUtils";

const DISCIPLINAS = ["Mecânica", "Elétrica", "Estrutura Metálica", "Tubulação", "Instrumentação", "Civil", "Pintura"];

const inputCls = "w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-background text-foreground";

const EMPTY_TURNO = { ativo: false, condicao: "", praticabilidade: "" };

function emptyRdo() {
  return {
    numero: "",
    data: todayISO(),
    area: "",
    equipe: "",
    disciplinas: [],
    clima: {
      manha: { ...EMPTY_TURNO },
      tarde: { ...EMPTY_TURNO },
      noite: { ...EMPTY_TURNO },
    },
    mao_de_obra: [],
    equipamentos: [],
    atividades_vinculadas: [],
    ocorrencias: [],
    evidencias: [],
  };
}


async function uploadFiles(projectId, rdoId, files) {
  const uploaded = [];
  for (const file of files) {
    // Storage rejeita chaves com caracteres fora de ASCII (ex.: "relatório.pdf") —
    // chave opaca via UUID; o nome original fica nos metadados do anexo
    const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
    const path = `${projectId}/${rdoId}/${crypto.randomUUID()}${ext}`;
    const { error } = await supabase.storage
      .from("rdo-evidencias")
      .upload(path, file, { upsert: false });
    if (error) throw error;
    uploaded.push({ nome: file.name, path, tipo: file.type, tamanho: file.size });
  }
  return uploaded;
}

export function RDOForm({ rdo, selectedProjectId, casos, tarefas, onClose, onSaved }) {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const { data: funcoes = [] } = useQuery({
    queryKey: ["funcoes"],
    queryFn: () => entities.Funcao.list({ ativo: true }),
  });
  const { data: tiposEquipamento = [] } = useQuery({
    queryKey: ["tipos_equipamento"],
    queryFn: () => entities.TipoEquipamento.list({ ativo: true }),
  });
  const { data: proximoNumeroRdo = null } = useQuery({
    queryKey: ["rdos", selectedProjectId, "max-numero"],
    queryFn: async () => {
      const rows = await entities.Rdo.filter({ projeto_id: selectedProjectId });
      // maior número existente, não count: excluir um RDO intermediário fazia
      // count+1 colidir com um número já usado
      const max = rows.reduce((m, r) => {
        const n = parseInt(String(r.numero || "").replace(/\D/g, ""), 10);
        return Number.isFinite(n) ? Math.max(m, n) : m;
      }, 0);
      return max + 1;
    },
    enabled: !!selectedProjectId && !rdo,
  });

  const { data: categoriasNomes = [], isPending: categoriasPending } = useCategoriasImpacto();

  useEffect(() => {
    if (!rdo && proximoNumeroRdo != null) {
      set("numero", `RDO-${String(proximoNumeroRdo).padStart(3, "0")}`);
    }
  }, [proximoNumeroRdo]);

  const areaOptions = useMemo(
    () => [...new Set((tarefas || []).map(t => t.area).filter(Boolean))].sort(),
    [tarefas]
  );

  const [pendingFiles, setPendingFiles] = useState([]);
  const [vincularDialog, setVincularDialog] = useState(null);
  const [openPanels, setOpenPanels] = useState({ mdo: true, equip: false, ativ: false, evid: false, ocorr: false });

  const [form, setForm] = useState(() => {
    if (!rdo) return emptyRdo();
    return {
      numero: rdo.numero || "",
      data: rdo.data || todayISO(),
      area: rdo.area || "",
      equipe: rdo.equipe || "",
      disciplinas: rdo.disciplinas || [],
      clima: {
        manha: { ...EMPTY_TURNO, ...(rdo.clima?.manha ?? {}) },
        tarde: { ...EMPTY_TURNO, ...(rdo.clima?.tarde ?? {}) },
        noite: { ...EMPTY_TURNO, ...(rdo.clima?.noite ?? {}) },
      },
      mao_de_obra: rdo.mao_de_obra || [],
      equipamentos: rdo.equipamentos || [],
      atividades_vinculadas: rdo.atividades_vinculadas || [],
      ocorrencias: rdo.ocorrencias || [],
      evidencias: rdo.evidencias || [],
    };
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const togglePanel = k => setOpenPanels(p => ({ ...p, [k]: !p[k] }));

  const toggleDisciplina = d => {
    const arr = form.disciplinas;
    set("disciplinas", arr.includes(d) ? arr.filter(x => x !== d) : [...arr, d]);
  };

  const setClimaTurno = (turno, field, value) =>
    set("clima", { ...form.clima, [turno]: { ...form.clima[turno], [field]: value } });

  const addMdo = () => set("mao_de_obra", [...form.mao_de_obra, { nome: "", funcao: "", quantidade: "1" }]);
  const setMdo = (i, k, v) => { const arr = [...form.mao_de_obra]; arr[i] = { ...arr[i], [k]: v }; set("mao_de_obra", arr); };
  const removeMdo = i => set("mao_de_obra", form.mao_de_obra.filter((_, j) => j !== i));

  const addEquip = () => set("equipamentos", [...form.equipamentos, { nome: "", identificacao: "", quantidade: "1" }]);
  const setEquip = (i, k, v) => { const arr = [...form.equipamentos]; arr[i] = { ...arr[i], [k]: v }; set("equipamentos", arr); };
  const removeEquip = i => set("equipamentos", form.equipamentos.filter((_, j) => j !== i));

  const addOcorrencia = () => set("ocorrencias", [
    ...form.ocorrencias,
    { id: crypto.randomUUID(), descricao: "", responsabilidade: "", categorias: [], pleito_id: null, atividades_vinculadas: [] },
  ]);
  const setOcorrencia = (i, k, v) => { const arr = [...form.ocorrencias]; arr[i] = { ...arr[i], [k]: v }; set("ocorrencias", arr); };
  const removeOcorrencia = i => set("ocorrencias", form.ocorrencias.filter((_, j) => j !== i));
  const toggleOcorrCategoria = (i, cat) => {
    const cats = form.ocorrencias[i].categorias || [];
    setOcorrencia(i, "categorias", cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat]);
  };

  const removePendingFile = idx => setPendingFiles(prev => prev.filter((_, i) => i !== idx));
  const removeExistingEvidencia = idx => set("evidencias", form.evidencias.filter((_, i) => i !== idx));

  const openVincular = () => {
    setVincularDialog({ currentIds: form.atividades_vinculadas });
  };

  const confirmVincular = ids => {
    set("atividades_vinculadas", ids);
    setVincularDialog(null);
  };

  const atividadeNome = id => {
    const t = (tarefas || []).find(t => t.id === id);
    return t?.nome || t?.titulo || id;
  };

  const handleSave = async () => {
    if (!form.data) {
      toast({ title: "Data obrigatória", variant: "destructive" });
      return;
    }
    if (form.disciplinas.length === 0) {
      toast({ title: "Selecione ao menos uma disciplina", variant: "destructive" });
      return;
    }
    const mdoInvalido = form.mao_de_obra.some(m => !m.funcao || !m.quantidade);
    if (mdoInvalido) {
      toast({ title: "Mão de obra incompleta", description: "Função e quantidade são obrigatórias em todas as linhas.", variant: "destructive" });
      return;
    }
    const equipInvalido = form.equipamentos.some(e => !e.nome || !e.quantidade);
    if (equipInvalido) {
      toast({ title: "Equipamentos incompletos", description: "Equipamento e quantidade são obrigatórios em todas as linhas.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      let novasEvidencias = [...form.evidencias];
      if (pendingFiles.length > 0) {
        const tempId = rdo?.id || crypto.randomUUID();
        const uploaded = await uploadFiles(selectedProjectId, tempId, pendingFiles);
        novasEvidencias = [...novasEvidencias, ...uploaded];
      }
      const data = { ...form, evidencias: novasEvidencias, projeto_id: selectedProjectId };
      if (rdo?.id) await entities.Rdo.update(rdo.id, data);
      else await entities.Rdo.create(data);
      onSaved();
    } catch (e) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const PanelHeader = ({ label, panelKey, icon: Icon }) => (
    <button type="button" onClick={() => togglePanel(panelKey)}
      className="w-full flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        {label}
      </span>
      {openPanels[panelKey] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto border border-border">

        {/* Header */}
        <div className="sticky top-0 bg-card z-10 flex items-start justify-between gap-3 px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-1 self-stretch rounded-full shrink-0 min-h-[36px] bg-primary" />
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div className="pt-0.5">
              <p className="text-base font-bold text-foreground leading-tight">
                {rdo ? "Editar RDO" : "Novo Relatório Diário de Obra"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Relatório Diário de Obra</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors pt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Cabeçalho — linha 1: número (read-only) + data + área */}
          <div className="grid grid-cols-[auto_1fr_1fr] gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nº RDO</label>
              <div className="h-9 px-3 flex items-center rounded-lg border border-border bg-muted text-sm font-mono font-bold text-foreground whitespace-nowrap min-w-[6rem]">
                {form.numero || "—"}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Data <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full h-9 border border-border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-background text-foreground"
                value={form.data}
                onChange={e => set("data", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Área</label>
              {areaOptions.length > 0 ? (
                <select
                  className="w-full h-9 border border-border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-background text-foreground"
                  value={form.area}
                  onChange={e => set("area", e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {areaOptions.map(a => <option key={a} value={a}>{a}</option>)}
                  {form.area && !areaOptions.includes(form.area) && (
                    <option value={form.area}>{form.area}</option>
                  )}
                </select>
              ) : (
                <input
                  className="w-full h-9 border border-border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-background text-foreground"
                  placeholder="Área"
                  value={form.area}
                  onChange={e => set("area", e.target.value)}
                />
              )}
            </div>
          </div>

          {/* Cabeçalho — linha 2: equipe */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Equipe</label>
            <input
              className="w-full h-9 border border-border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-background text-foreground"
              placeholder="Nome da equipe ou responsável (opcional)"
              value={form.equipe}
              onChange={e => set("equipe", e.target.value)}
            />
          </div>

          {/* Disciplinas */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              Disciplinas <span className="text-red-500">*</span>
              {form.disciplinas.length === 0 && (
                <span className="text-red-400 font-normal">(ao menos uma obrigatória)</span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {DISCIPLINAS.map(d => (
                <button key={d} type="button" onClick={() => toggleDisciplina(d)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${form.disciplinas.includes(d) ? "bg-blue-600 text-white border-transparent" : "border-border text-muted-foreground bg-background"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Condições Climáticas */}
          <div>
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Condições Climáticas por Turno</p>
            <div className="grid grid-cols-3 gap-2">
              {[{ key: "manha", label: "Manhã" }, { key: "tarde", label: "Tarde" }, { key: "noite", label: "Noite" }].map(turno => {
                const t = form.clima[turno.key];
                return (
                  <div key={turno.key} className="border border-border rounded-lg p-2.5 space-y-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" className="w-3.5 h-3.5 accent-blue-500"
                        checked={t.ativo}
                        onChange={e => setClimaTurno(turno.key, "ativo", e.target.checked)} />
                      <span className="text-xs font-semibold text-foreground">{turno.label}</span>
                    </label>
                    {t.ativo && (
                      <div className="space-y-1.5">
                        <div className="flex gap-1">
                          {[
                            { val: "Sol", icon: Sun, color: "#f59e0b" },
                            { val: "Nublado", icon: Cloud, color: "#6b7280" },
                            { val: "Chuva", icon: CloudRain, color: "#3b82f6" },
                          ].map(({ val, icon: Icon, color }) => (
                            <button key={val} type="button"
                              onClick={() => setClimaTurno(turno.key, "condicao", t.condicao === val ? "" : val)}
                              title={val}
                              className={`flex-1 flex items-center justify-center py-1 rounded border transition-all ${t.condicao === val ? "border-transparent text-white" : "border-border text-muted-foreground bg-background hover:bg-muted"}`}
                              style={t.condicao === val ? { backgroundColor: color } : {}}>
                              <Icon className="w-3.5 h-3.5" />
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          {[
                            { val: "Praticável", icon: CheckCircle, color: "#16a34a", label: "Prat." },
                            { val: "Impraticável", icon: XCircle, color: "#dc2626", label: "Impr." },
                          ].map(({ val, icon: Icon, color, label }) => (
                            <button key={val} type="button"
                              onClick={() => setClimaTurno(turno.key, "praticabilidade", t.praticabilidade === val ? "" : val)}
                              className={`flex-1 flex items-center justify-center gap-0.5 py-1 rounded border text-xs font-medium transition-all ${t.praticabilidade === val ? "border-transparent text-white" : "border-border text-muted-foreground bg-background hover:bg-muted"}`}
                              style={t.praticabilidade === val ? { backgroundColor: color } : {}}>
                              <Icon className="w-3 h-3" />{label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mão de Obra */}
          <div className="space-y-2">
            <PanelHeader label="Mão de Obra" panelKey="mdo" icon={Users} />
            {openPanels.mdo && (
              <div className="border border-border rounded-xl p-4 space-y-2">
                {form.mao_de_obra.length > 0 && (
                  <div className="grid grid-cols-[1fr_1fr_5rem_1.5rem] gap-2 px-1 mb-1">
                    <span className="text-xs text-muted-foreground">Nome <span className="text-muted-foreground/50">(opcional)</span></span>
                    <span className="text-xs text-muted-foreground">Função <span className="text-red-500">*</span></span>
                    <span className="text-xs text-muted-foreground text-center">Qtd</span>
                    <span />
                  </div>
                )}
                {form.mao_de_obra.map((m, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_5rem_1.5rem] gap-2 items-center">
                    <input className={inputCls} placeholder="Nome (opcional)" value={m.nome}
                      onChange={e => setMdo(i, "nome", e.target.value)} />
                    <select className={`${inputCls} ${!m.funcao ? "border-red-300 focus:ring-red-100" : ""}`} value={m.funcao}
                      onChange={e => setMdo(i, "funcao", e.target.value)}>
                      <option value="">Função...</option>
                      {funcoes.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
                    </select>
                    <input
                      type="number" min={1} inputMode="numeric"
                      className={`${inputCls} text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                      placeholder="1" value={m.quantidade}
                      onChange={e => setMdo(i, "quantidade", e.target.value)} />
                    <button type="button" onClick={() => removeMdo(i)} className="text-muted-foreground hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addMdo} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-1">
                  <Plus className="w-3 h-3" />Adicionar função
                </button>
              </div>
            )}
          </div>

          {/* Equipamentos */}
          <div className="space-y-2">
            <PanelHeader label="Equipamentos" panelKey="equip" icon={Truck} />
            {openPanels.equip && (
              <div className="border border-border rounded-xl p-4 space-y-2">
                {form.equipamentos.length > 0 && (
                  <div className="grid grid-cols-[1fr_1fr_5rem_1.5rem] gap-2 px-1 mb-1">
                    <span className="text-xs text-muted-foreground">Equipamento <span className="text-red-500">*</span></span>
                    <span className="text-xs text-muted-foreground">TAG <span className="text-muted-foreground/50">(opcional)</span></span>
                    <span className="text-xs text-muted-foreground text-center">Qtd <span className="text-red-500">*</span></span>
                    <span />
                  </div>
                )}
                {form.equipamentos.map((eq, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_5rem_1.5rem] gap-2 items-center">
                    <select className={`${inputCls} ${!eq.nome ? "border-red-300 focus:ring-red-100" : ""}`} value={eq.nome}
                      onChange={e => setEquip(i, "nome", e.target.value)}>
                      <option value="">Equipamento...</option>
                      {tiposEquipamento.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                    </select>
                    <input className={inputCls} placeholder="TAG ou identificação" value={eq.identificacao}
                      onChange={e => setEquip(i, "identificacao", e.target.value)} />
                    <input
                      type="number" min={1} inputMode="numeric"
                      className={`${inputCls} text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                      placeholder="1" value={eq.quantidade}
                      onChange={e => setEquip(i, "quantidade", e.target.value)} />
                    <button type="button" onClick={() => removeEquip(i)} className="text-muted-foreground hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addEquip} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-1">
                  <Plus className="w-3 h-3" />Adicionar equipamento
                </button>
              </div>
            )}
          </div>

          {/* Atividades */}
          <div className="space-y-2">
            <PanelHeader label="Atividades" panelKey="ativ" icon={ClipboardList} />
            {openPanels.ativ && (
              <div className="border border-border rounded-xl p-4 space-y-3">
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => openVincular()}>
                  <Link2 className="w-4 h-4" />Vincular Atividades
                </Button>
                {form.atividades_vinculadas.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.atividades_vinculadas.map((id, idx) => (
                      <span key={id} className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                        {atividadeNome(id)}
                        <button type="button"
                          onClick={() => set("atividades_vinculadas", form.atividades_vinculadas.filter((_, i) => i !== idx))}
                          className="ml-0.5 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ocorrências e Impactos */}
          <div className="space-y-2">
            <PanelHeader label="Ocorrências e Impactos" panelKey="ocorr" icon={AlertTriangle} />
            {openPanels.ocorr && (
              <div className="border border-border rounded-xl p-4 space-y-4">
                {form.ocorrencias.map((oc, i) => (
                  <div key={oc.id} className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Ocorrência {i + 1}</span>
                      <button onClick={() => removeOcorrencia(i)} className="text-red-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea className={inputCls} rows={3}
                      placeholder="Descreva o evento, anomalia ou interrupção..."
                      value={oc.descricao}
                      onChange={e => setOcorrencia(i, "descricao", e.target.value)} />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Responsabilidade</label>
                        <select className={inputCls} value={oc.responsabilidade}
                          onChange={e => setOcorrencia(i, "responsabilidade", e.target.value)}>
                          <option value="">Selecione...</option>
                          <option>Contratada</option>
                          <option>Contratante</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Vincular a Pleito</label>
                        <select className={inputCls} value={oc.pleito_id || ""}
                          onChange={e => setOcorrencia(i, "pleito_id", e.target.value || null)}>
                          <option value="">Nenhum</option>
                          {(casos || []).map(c => (
                            <option key={c.id} value={c.id}>{c.titulo?.substring(0, 40)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">Categorias de Impacto</label>
                      <div className="flex flex-wrap gap-2">
                        {categoriasPending ? (
                          <span className="text-xs text-muted-foreground">Carregando categorias...</span>
                        ) : (
                          categoriasNomes.map(cat => (
                            <button key={cat} type="button" onClick={() => toggleOcorrCategoria(i, cat)}
                              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${(oc.categorias || []).includes(cat) ? "border-transparent bg-ocre text-white" : "border-border text-muted-foreground bg-background"}`}>
                              {cat}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addOcorrencia}
                  className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                  <Plus className="w-3 h-3" />Adicionar Ocorrência
                </button>
              </div>
            )}
          </div>

          {/* Evidências */}
          <div className="space-y-2">
            <PanelHeader label="Evidências" panelKey="evid" icon={Camera} />
            {openPanels.evid && (
              <div className="border border-border rounded-xl p-4 space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Clique para anexar fotos ou arraste os arquivos</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, PDF até 10MB</p>
                </div>
                <input ref={fileInputRef} type="file" multiple accept="image/*,application/pdf"
                  className="hidden" onChange={e => setPendingFiles(prev => [...prev, ...Array.from(e.target.files)])} />
                {form.evidencias.map((ev, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border border-border rounded-lg">
                    <span className="text-xs flex-1 truncate text-foreground">{ev.nome}</span>
                    <button type="button" onClick={() => removeExistingEvidencia(i)}
                      className="text-red-400 hover:text-red-600 shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {pendingFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                    <span className="text-xs flex-1 truncate text-blue-700 dark:text-blue-300">
                      {f.name} <span className="text-blue-400">(pendente)</span>
                    </span>
                    <button type="button" onClick={() => removePendingFile(i)}
                      className="text-red-400 hover:text-red-600 shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="save" disabled={loading} onClick={handleSave}>
            {loading ? "Salvando..." : rdo ? "Salvar Alterações" : "Finalizar e Enviar RDO"}
          </Button>
        </div>
      </div>

      {vincularDialog && (
        <VincularAtividadesDialog
          open={true}
          onClose={() => setVincularDialog(null)}
          onConfirm={confirmVincular}
          tarefas={tarefas || []}
          selectedIds={vincularDialog.currentIds}
          selectedProjectId={selectedProjectId}
        />
      )}
    </div>
  );
}
