import { useState, useRef } from "react";
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

const DISCIPLINAS = ["Mecânica", "Elétrica", "Estrutura Metálica", "Tubulação", "Instrumentação", "Civil", "Pintura"];
const CARGOS = ["Encarregado", "Soldador", "Caldeireiro", "Eletricista", "Instrumentista", "Ajudante", "Operador de Máquina", "Pedreiro"];
const EQUIPAMENTOS_LISTA = ["Guindaste", "Retroescavadeira", "Compressor", "Andaime", "Caminhão", "Gerador", "Perfuratriz", "Munck"];
const CATEGORIAS_OCORRENCIA = ["Engenharia", "Suprimentos", "Planejamento", "Construção", "Contratos", "Qualidade/SSMA"];

const inputCls = "w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-background text-foreground";

const EMPTY_TURNO = { ativo: false, condicao: "", praticabilidade: "" };

function emptyRdo() {
  return {
    numero: "",
    data: new Date().toISOString().split("T")[0],
    area: "",
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

function ClimaBtn({ label, icon: Icon, active, onClick, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${active ? "border-transparent text-white" : "border-border text-muted-foreground bg-background"}`}
      style={active ? { backgroundColor: color } : {}}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}{label}
    </button>
  );
}

async function uploadFiles(projectId, rdoId, files) {
  const uploaded = [];
  for (const file of files) {
    const path = `${projectId}/${rdoId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from("rdo-evidencias")
      .upload(path, file, { upsert: false });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage
      .from("rdo-evidencias")
      .getPublicUrl(path);
    uploaded.push({ nome: file.name, url: publicUrl, tipo: file.type, tamanho: file.size });
  }
  return uploaded;
}

export function RDOForm({ rdo, selectedProjectId, casos, tarefas, onClose, onSaved }) {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [vincularDialog, setVincularDialog] = useState(null);
  const [openPanels, setOpenPanels] = useState({ mdo: true, equip: false, ativ: false, evid: false, ocorr: false });

  const [form, setForm] = useState(() => {
    if (!rdo) return emptyRdo();
    return {
      numero: rdo.numero || "",
      data: rdo.data || new Date().toISOString().split("T")[0],
      area: rdo.area || "",
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

  const openVincular = field => {
    const currentIds = field === "root"
      ? form.atividades_vinculadas
      : (form.ocorrencias[field]?.atividades_vinculadas || []);
    setVincularDialog({ field, currentIds });
  };

  const confirmVincular = ids => {
    if (vincularDialog.field === "root") {
      set("atividades_vinculadas", ids);
    } else {
      setOcorrencia(vincularDialog.field, "atividades_vinculadas", ids);
    }
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
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">

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

          {/* Cabeçalho */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nº RDO</label>
              <input className={inputCls} placeholder="RDO-001" value={form.numero} onChange={e => set("numero", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Data</label>
              <input type="date" className={inputCls} value={form.data} onChange={e => set("data", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Área</label>
              <input className={inputCls} placeholder="Área A" value={form.area} onChange={e => set("area", e.target.value)} />
            </div>
          </div>

          {/* Disciplinas */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Disciplinas</label>
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
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Condições Climáticas por Turno</p>
            <div className="space-y-3">
              {[{ key: "manha", label: "Manhã" }, { key: "tarde", label: "Tarde" }, { key: "noite", label: "Noite" }].map(turno => {
                const t = form.clima[turno.key];
                return (
                  <div key={turno.key} className="p-3 border border-border rounded-xl space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 accent-blue-500"
                        checked={t.ativo}
                        onChange={e => setClimaTurno(turno.key, "ativo", e.target.checked)} />
                      <span className="text-sm font-medium text-foreground">{turno.label}</span>
                    </label>
                    {t.ativo && (
                      <div className="pl-6 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground w-20 shrink-0">Condição:</span>
                          <ClimaBtn label="Sol" icon={Sun} active={t.condicao === "Sol"} color="#f59e0b"
                            onClick={() => setClimaTurno(turno.key, "condicao", t.condicao === "Sol" ? "" : "Sol")} />
                          <ClimaBtn label="Nublado" icon={Cloud} active={t.condicao === "Nublado"} color="#6b7280"
                            onClick={() => setClimaTurno(turno.key, "condicao", t.condicao === "Nublado" ? "" : "Nublado")} />
                          <ClimaBtn label="Chuva" icon={CloudRain} active={t.condicao === "Chuva"} color="#3b82f6"
                            onClick={() => setClimaTurno(turno.key, "condicao", t.condicao === "Chuva" ? "" : "Chuva")} />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground w-20 shrink-0">Praticab.:</span>
                          <ClimaBtn label="Praticável" icon={CheckCircle} active={t.praticabilidade === "Praticável"} color="#16a34a"
                            onClick={() => setClimaTurno(turno.key, "praticabilidade", t.praticabilidade === "Praticável" ? "" : "Praticável")} />
                          <ClimaBtn label="Impraticável" icon={XCircle} active={t.praticabilidade === "Impraticável"} color="#dc2626"
                            onClick={() => setClimaTurno(turno.key, "praticabilidade", t.praticabilidade === "Impraticável" ? "" : "Impraticável")} />
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
                {form.mao_de_obra.map((m, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input className={`${inputCls} flex-1`} placeholder="Nome ou empresa" value={m.nome}
                      onChange={e => setMdo(i, "nome", e.target.value)} />
                    <select className={`${inputCls} flex-1`} value={m.funcao}
                      onChange={e => setMdo(i, "funcao", e.target.value)}>
                      <option value="">Função...</option>
                      {CARGOS.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <input type="number" min={1} className={`${inputCls} w-20`} placeholder="Qtd" value={m.quantidade}
                      onChange={e => setMdo(i, "quantidade", e.target.value)} />
                    <button onClick={() => removeMdo(i)} className="text-red-400 hover:text-red-600 shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={addMdo} className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
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
                {form.equipamentos.map((eq, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select className={`${inputCls} flex-1`} value={eq.nome}
                      onChange={e => setEquip(i, "nome", e.target.value)}>
                      <option value="">Equipamento...</option>
                      {EQUIPAMENTOS_LISTA.map(e => <option key={e}>{e}</option>)}
                    </select>
                    <input className={`${inputCls} flex-1`} placeholder="TAG ou identificação" value={eq.identificacao}
                      onChange={e => setEquip(i, "identificacao", e.target.value)} />
                    <input type="number" min={1} className={`${inputCls} w-20`} placeholder="Qtd" value={eq.quantidade}
                      onChange={e => setEquip(i, "quantidade", e.target.value)} />
                    <button onClick={() => removeEquip(i)} className="text-red-400 hover:text-red-600 shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button onClick={addEquip} className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                  <Plus className="w-3 h-3" />Adicionar equipamento
                </button>
              </div>
            )}
          </div>

          {/* Atividades Produzidas */}
          <div className="space-y-2">
            <PanelHeader label="Atividades Produzidas" panelKey="ativ" icon={ClipboardList} />
            {openPanels.ativ && (
              <div className="border border-border rounded-xl p-4 space-y-3">
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => openVincular("root")}>
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
                        {CATEGORIAS_OCORRENCIA.map(cat => (
                          <button key={cat} type="button" onClick={() => toggleOcorrCategoria(i, cat)}
                            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${(oc.categorias || []).includes(cat) ? "border-transparent bg-ocre text-white" : "border-border text-muted-foreground bg-background"}`}>
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => openVincular(i)}>
                        <Link2 className="w-4 h-4" />Vincular Atividades
                      </Button>
                      {(oc.atividades_vinculadas || []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {oc.atividades_vinculadas.map((id, idx) => (
                            <span key={id} className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                              {atividadeNome(id)}
                              <button type="button"
                                onClick={() => setOcorrencia(i, "atividades_vinculadas", oc.atividades_vinculadas.filter((_, j) => j !== idx))}
                                className="ml-0.5 hover:text-red-500">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <button onClick={addOcorrencia}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1">
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
        />
      )}
    </div>
  );
}
