import React, { useState } from "react";
import { toDatetimeLocal, toUtcIso } from "@/lib/dateUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import CloseButton from "@/components/ui/CloseButton";

const IMPACTO_CATEGORIES = [
  "Engenharia", "Suprimentos", "Escopo", "Planejamento",
  "Recursos", "Produtividade", "Liberação de Área",
  "Segurança", "Qualidade", "Gestão & Comunicação"
];

export default function IncidenteForm({ incidente, casos, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState({
    tipo_registro: incidente?.tipo_registro || "Ata de Reunião",
    data_hora: toDatetimeLocal(incidente?.data_hora) || toDatetimeLocal(new Date()),
    responsavel_registro: incidente?.responsavel_registro || "",
    descricao: incidente?.descricao || "",
    impacto_preliminar: incidente?.impacto_preliminar || "",
    status: incidente?.status || "Registrado",
    caso_id: incidente?.caso_id || null,
    numero_rdo: incidente?.numero_rdo || "",
    area: incidente?.area || "",
    disciplina: incidente?.disciplina || "",
    atividades: incidente?.atividades || "",
    condicoes_climaticas_manha: incidente?.condicoes_climaticas_manha || "",
    condicoes_climaticas_tarde: incidente?.condicoes_climaticas_tarde || "",
    condicoes_climaticas_noite: incidente?.condicoes_climaticas_noite || "",
    ocorrencias: incidente?.ocorrencias || "",
    responsabilidade: incidente?.responsabilidade || "",
  });

  const [maoDeObra, setMaoDeObra] = useState(
    incidente?.mao_de_obra?.length ? incidente.mao_de_obra : [{ quantidade: "", funcao: "" }]
  );
  const [equipamentosRdo, setEquipamentosRdo] = useState(
    incidente?.equipamentos_rdo?.length ? incidente.equipamentos_rdo : [{ quantidade: "", equipamento: "" }]
  );
  const [impactoOcorrencia, setImpactoOcorrencia] = useState(
    incidente?.impacto_ocorrencia || []
  );

  const isRDO = formData.tipo_registro === "RDO";

  const toggleImpacto = (cat) => {
    setImpactoOcorrencia(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const addMaoDeObra = () => setMaoDeObra(prev => [...prev, { quantidade: "", funcao: "" }]);
  const removeMaoDeObra = (idx) => setMaoDeObra(prev => prev.filter((_, i) => i !== idx));
  const updateMaoDeObra = (idx, field, value) =>
    setMaoDeObra(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));

  const addEquipamento = () => setEquipamentosRdo(prev => [...prev, { quantidade: "", equipamento: "" }]);
  const removeEquipamento = (idx) => setEquipamentosRdo(prev => prev.filter((_, i) => i !== idx));
  const updateEquipamento = (idx, field, value) =>
    setEquipamentosRdo(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      data_hora: toUtcIso(formData.data_hora),
      caso_id: formData.caso_id || null,
      mao_de_obra: isRDO ? maoDeObra.filter(r => r.quantidade || r.funcao) : [],
      equipamentos_rdo: isRDO ? equipamentosRdo.filter(r => r.quantidade || r.equipamento) : [],
      impacto_ocorrencia: impactoOcorrencia,
    });
  };

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b" style={{ background: "linear-gradient(to right, #fff7ed, #ffedd5)" }}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900">
            {incidente ? "Editar Registro" : "Novo Registro"}
          </CardTitle>
          <CloseButton onClick={onCancel} />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Tipo + Data + Responsável */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Registro *</Label>
              <Select value={formData.tipo_registro} onValueChange={(v) => set("tipo_registro", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(formData.tipo_registro === "INCIDENTE" || formData.tipo_registro === "Incidente") && (
                    <SelectItem value={formData.tipo_registro} disabled className="text-gray-400 italic">
                      Incidente (legado — selecione um tipo)
                    </SelectItem>
                  )}
                  <SelectItem value="Ata de Reunião">Ata de Reunião</SelectItem>
                  <SelectItem value="RDO">RDO</SelectItem>
                  <SelectItem value="E-mail">E-mail</SelectItem>
                  <SelectItem value="Notificação">Notificação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data e Hora *</Label>
              <Input type="datetime-local" value={formData.data_hora}
                onChange={(e) => set("data_hora", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input value={formData.responsavel_registro}
                onChange={(e) => set("responsavel_registro", e.target.value)}
                placeholder="Nome do responsável" />
            </div>
          </div>

          {/* RDO-specific fields */}
          {isRDO && (
            <div className="space-y-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm font-semibold text-blue-800 uppercase tracking-wide">Campos do RDO</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nº RDO</Label>
                  <Input value={formData.numero_rdo} onChange={(e) => set("numero_rdo", e.target.value)} placeholder="Ex: 001" />
                </div>
                <div className="space-y-2">
                  <Label>Área</Label>
                  <Input value={formData.area} onChange={(e) => set("area", e.target.value)} placeholder="Ex: Área Norte" />
                </div>
                <div className="space-y-2">
                  <Label>Disciplina</Label>
                  <Select value={formData.disciplina} onValueChange={(v) => set("disciplina", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mecânica">Mecânica</SelectItem>
                      <SelectItem value="Elétrica">Elétrica</SelectItem>
                      <SelectItem value="Estrutura Metálica">Estrutura Metálica</SelectItem>
                      <SelectItem value="Tubulação">Tubulação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Mão de obra */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Mão de Obra</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addMaoDeObra}>
                    <Plus className="w-3 h-3 mr-1" /> Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {maoDeObra.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input className="w-24" placeholder="Qtd" value={row.quantidade}
                        onChange={(e) => updateMaoDeObra(idx, "quantidade", e.target.value)} />
                      <Input placeholder="Função" value={row.funcao}
                        onChange={(e) => updateMaoDeObra(idx, "funcao", e.target.value)} />
                      {maoDeObra.length > 1 && (
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeMaoDeObra(idx)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipamentos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Equipamentos</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addEquipamento}>
                    <Plus className="w-3 h-3 mr-1" /> Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {equipamentosRdo.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input className="w-24" placeholder="Qtd" value={row.quantidade}
                        onChange={(e) => updateEquipamento(idx, "quantidade", e.target.value)} />
                      <Input placeholder="Equipamento" value={row.equipamento}
                        onChange={(e) => updateEquipamento(idx, "equipamento", e.target.value)} />
                      {equipamentosRdo.length > 1 && (
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeEquipamento(idx)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Atividades */}
              <div className="space-y-2">
                <Label>Atividades</Label>
                <Textarea value={formData.atividades} onChange={(e) => set("atividades", e.target.value)}
                  placeholder="Descreva as atividades realizadas..." rows={3} />
              </div>

              {/* Condições Climáticas */}
              <div className="space-y-2">
                <Label>Condições Climáticas</Label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Manhã", field: "condicoes_climaticas_manha" },
                    { label: "Tarde", field: "condicoes_climaticas_tarde" },
                    { label: "Noite", field: "condicoes_climaticas_noite" },
                  ].map(({ label, field }) => (
                    <div key={field} className="space-y-1">
                      <p className="text-xs text-gray-500 font-medium">{label}</p>
                      <Select value={formData[field]} onValueChange={(v) => set(field, v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Praticável">Praticável</SelectItem>
                          <SelectItem value="Impraticável">Impraticável</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Non-RDO fields */}
          {!isRDO && (
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Textarea value={formData.descricao} onChange={(e) => set("descricao", e.target.value)}
                  placeholder="Descreva o registro..." rows={4} required className="resize-none" />
              </div>
              <div className="space-y-2">
                <Label>Avaliação de Impacto</Label>
                <Textarea value={formData.impacto_preliminar} onChange={(e) => set("impacto_preliminar", e.target.value)}
                  placeholder="Avaliação preliminar do impacto..." rows={2} className="resize-none" />
              </div>
            </div>
          )}

          {/* Ocorrências (shared) */}
          <div className="space-y-2">
            <Label>Ocorrências</Label>
            <Textarea value={formData.ocorrencias} onChange={(e) => set("ocorrencias", e.target.value)}
              placeholder="Registre ocorrências..." rows={3} className="resize-none" />
          </div>

          {/* Responsabilidade + Impacto da Ocorrência */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Responsabilidade</Label>
              <Select value={formData.responsabilidade} onValueChange={(v) => set("responsabilidade", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contratada">Contratada</SelectItem>
                  <SelectItem value="Contratante">Contratante</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Registrado">Registrado</SelectItem>
                  <SelectItem value="Em Análise">Em Análise</SelectItem>
                  <SelectItem value="Resolvido">Resolvido</SelectItem>
                  <SelectItem value="Fechado">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Impacto da Ocorrência - checkboxes */}
          <div className="space-y-3">
            <Label>Impacto da Ocorrência</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {IMPACTO_CATEGORIES.map((cat) => (
                <div key={cat} className="flex items-center space-x-2 bg-gray-50 rounded p-2">
                  <Checkbox
                    id={`impacto-${cat}`}
                    checked={impactoOcorrencia.includes(cat)}
                    onCheckedChange={() => toggleImpacto(cat)}
                  />
                  <label htmlFor={`impacto-${cat}`} className="text-xs font-medium cursor-pointer leading-tight">
                    {cat}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Associar Pleito */}
          <div className="space-y-2">
            <Label>Associar a Pleito (Opcional)</Label>
            <Select value={formData.caso_id || "__none__"} onValueChange={(v) => set("caso_id", v === "__none__" ? null : v)}>
              <SelectTrigger><SelectValue placeholder="Selecione um pleito" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhum</SelectItem>
                {casos.map((caso) => (
                  <SelectItem key={caso.id} value={caso.id}>{caso.titulo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" className="bg-brand-accent hover:opacity-90 text-white" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Registro"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}