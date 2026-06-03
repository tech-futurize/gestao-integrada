# Mapa de Registro Compilado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expandir o Mapa de Registro (heatmap temporal no Mapa de Impacto) para compilar dados de três fontes — Registros, RDOs e Mudanças Contratuais — normalizados em um único array com badge de origem no drilldown.

**Architecture:** Um hook customizado `useMapaRegistroData` encapsula as 3 queries e retorna um array normalizado. As funções de normalização são exportadas separadamente como funções puras para facilitar testes. `MapaImpacto.jsx` troca sua única query pelo hook; `HeatmapDrilldown.jsx` ganha badge de fonte e branch de detalhe para Mudança.

**Tech Stack:** React 18, TanStack React Query 5, Vitest, Tailwind CSS 3

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/hooks/useMapaRegistroData.js` | CRIAR | Fetch (3 queries) + normalização; exporta funções puras |
| `src/hooks/useMapaRegistroData.test.js` | CRIAR | Testes unitários das funções puras de normalização |
| `src/pages/AdminContratual/MapaImpacto.jsx` | MODIFICAR | Trocar useQuery pelo hook |
| `src/components/pleitos/HeatmapDrilldown.jsx` | MODIFICAR | Badge de fonte + branch Mudança no detalhe |

`src/components/pleitos/MapaRegistroImpacto.jsx` — **sem alterações**.

---

## Task 1: Funções puras de normalização (TDD)

**Files:**
- Create: `src/hooks/useMapaRegistroData.js`
- Create: `src/hooks/useMapaRegistroData.test.js`

---

- [ ] **Passo 1.1 — Criar arquivo do hook com as funções puras exportadas**

Crie `src/hooks/useMapaRegistroData.js` com o seguinte conteúdo:

```js
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/supabaseEntities";

// ─── Funções puras de normalização (exportadas para testes) ───────────────────

export function normalizarRegistros(registros) {
  return registros
    .filter((r) => r.tipo_registro !== "RDO")
    .map((r) => ({
      id: r.id,
      data_hora: r.data_hora,
      impacto_ocorrencia: r.impacto_ocorrencia ?? [],
      responsabilidade: r.responsabilidade ?? "",
      descricao: r.descricao ?? "",
      fonte: "Registro",
      tipo_registro: r.tipo_registro,
      status: r.status,
      gravidade: r.gravidade,
      impacto_preliminar: r.impacto_preliminar,
      responsavel_registro: r.responsavel_registro,
    }));
}

export function normalizarRdos(rdos) {
  const resultado = [];
  for (const rdo of rdos) {
    const ocorrencias = rdo.ocorrencias ?? [];
    ocorrencias.forEach((ocorr, idx) => {
      const categorias = ocorr.categorias ?? [];
      if (categorias.length === 0) return;
      resultado.push({
        id: `rdo-${rdo.id}-${idx}`,
        data_hora: rdo.data ? `${rdo.data}T00:00:00` : null,
        impacto_ocorrencia: categorias,
        responsabilidade: ocorr.responsabilidade ?? "",
        descricao: ocorr.descricao ?? "",
        fonte: "RDO",
        _numero_rdo: rdo.numero,
        _area: rdo.area,
      });
    });
  }
  return resultado;
}

function inferirCategoriasMudanca(mudanca) {
  const cats = [];
  if (mudanca.impacto_custo != null && mudanca.impacto_custo !== 0) cats.push("Recursos");
  if (mudanca.impacto_prazo_dias != null && mudanca.impacto_prazo_dias !== 0) cats.push("Planejamento");
  if (mudanca.impacto_escopo) cats.push("Escopo");
  return cats.length > 0 ? cats : ["Escopo"];
}

export function normalizarMudancas(mudancas) {
  return mudancas
    .filter((m) => !!m.data_ocorrencia)
    .map((m) => ({
      id: `mudanca-${m.id}`,
      data_hora: m.data_ocorrencia,
      impacto_ocorrencia: inferirCategoriasMudanca(m),
      responsabilidade: m.origem ?? "",
      descricao: m.titulo ?? "",
      fonte: "Mudança",
      _titulo: m.titulo,
      _impacto_custo: m.impacto_custo,
      _impacto_prazo_dias: m.impacto_prazo_dias,
      _impacto_escopo: m.impacto_escopo,
    }));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export default function useMapaRegistroData(selectedProjectId) {
  const enabled = !!selectedProjectId;
  const filter = { projeto_id: selectedProjectId };

  const { data: registros = [], isPending: pendingReg, isError: errReg } = useQuery({
    queryKey: ["registros", selectedProjectId],
    queryFn: () => entities.Registro.filter(filter),
    enabled,
  });

  const { data: rdos = [], isPending: pendingRdo, isError: errRdo } = useQuery({
    queryKey: ["rdos", selectedProjectId],
    queryFn: () => entities.Rdo.filter(filter),
    enabled,
  });

  const { data: mudancas = [], isPending: pendingMud, isError: errMud } = useQuery({
    queryKey: ["mudancas_contratuais", selectedProjectId],
    queryFn: () => entities.MudancaContratual.filter(filter),
    enabled,
  });

  const incidentes = useMemo(
    () => [
      ...normalizarRegistros(registros),
      ...normalizarRdos(rdos),
      ...normalizarMudancas(mudancas),
    ],
    [registros, rdos, mudancas]
  );

  return {
    incidentes,
    isPending: pendingReg || pendingRdo || pendingMud,
    isError: errReg || errRdo || errMud,
  };
}
```

---

- [ ] **Passo 1.2 — Escrever os testes antes de rodar (TDD)**

Crie `src/hooks/useMapaRegistroData.test.js`:

```js
import { describe, it, expect } from "vitest";
import { normalizarRegistros, normalizarRdos, normalizarMudancas } from "./useMapaRegistroData";

// ── normalizarRegistros ──────────────────────────────────────────────────────

describe("normalizarRegistros", () => {
  it("exclui registros com tipo_registro=RDO", () => {
    const input = [
      { id: "1", tipo_registro: "RDO", data_hora: "2024-01-01T00:00:00", impacto_ocorrencia: ["Escopo"] },
      { id: "2", tipo_registro: "E-mail", data_hora: "2024-01-02T00:00:00", impacto_ocorrencia: ["Engenharia"] },
    ];
    const result = normalizarRegistros(input);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("preserva campos do registro e define fonte=Registro", () => {
    const input = [
      {
        id: "abc",
        tipo_registro: "Notificação",
        data_hora: "2024-03-10T08:00:00",
        impacto_ocorrencia: ["Recursos", "Planejamento"],
        responsabilidade: "Contratada",
        descricao: "Descrição teste",
        status: "Em Análise",
        gravidade: "Alta",
        impacto_preliminar: "Custo",
        responsavel_registro: "João",
      },
    ];
    const result = normalizarRegistros(input);
    expect(result[0]).toMatchObject({
      id: "abc",
      data_hora: "2024-03-10T08:00:00",
      impacto_ocorrencia: ["Recursos", "Planejamento"],
      responsabilidade: "Contratada",
      descricao: "Descrição teste",
      fonte: "Registro",
      tipo_registro: "Notificação",
      status: "Em Análise",
      gravidade: "Alta",
      responsavel_registro: "João",
    });
  });

  it("usa fallback [] para impacto_ocorrencia ausente", () => {
    const input = [{ id: "1", tipo_registro: "E-mail" }];
    const result = normalizarRegistros(input);
    expect(result[0].impacto_ocorrencia).toEqual([]);
  });

  it("retorna array vazio quando entrada é vazia", () => {
    expect(normalizarRegistros([])).toEqual([]);
  });
});

// ── normalizarRdos ───────────────────────────────────────────────────────────

describe("normalizarRdos", () => {
  it("ignora ocorrências sem categorias", () => {
    const rdos = [
      {
        id: "rdo1",
        numero: "001",
        data: "2024-02-15",
        area: "Área A",
        ocorrencias: [
          { descricao: "Sem categoria", categorias: [], responsabilidade: "Contratada" },
        ],
      },
    ];
    expect(normalizarRdos(rdos)).toHaveLength(0);
  });

  it("explode ocorrências com categorias em pontos individuais", () => {
    const rdos = [
      {
        id: "rdo1",
        numero: "001",
        data: "2024-02-15",
        area: "Área A",
        ocorrencias: [
          { descricao: "Ocorr 1", categorias: ["Engenharia"], responsabilidade: "Contratada" },
          { descricao: "Ocorr 2", categorias: ["Suprimentos", "Recursos"], responsabilidade: "Contratante" },
        ],
      },
    ];
    const result = normalizarRdos(rdos);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("rdo-rdo1-0");
    expect(result[1].id).toBe("rdo-rdo1-1");
  });

  it("formata data_hora concatenando T00:00:00", () => {
    const rdos = [
      {
        id: "rdo1",
        numero: "001",
        data: "2024-02-15",
        area: "",
        ocorrencias: [{ descricao: "X", categorias: ["Escopo"], responsabilidade: "" }],
      },
    ];
    const result = normalizarRdos(rdos);
    expect(result[0].data_hora).toBe("2024-02-15T00:00:00");
  });

  it("define fonte=RDO e preserva numero/area do RDO pai", () => {
    const rdos = [
      {
        id: "rdo1",
        numero: "RDO-42",
        data: "2024-02-15",
        area: "Bloco 3",
        ocorrencias: [{ descricao: "Desc", categorias: ["Planejamento"], responsabilidade: "Contratada" }],
      },
    ];
    const result = normalizarRdos(rdos);
    expect(result[0].fonte).toBe("RDO");
    expect(result[0]._numero_rdo).toBe("RDO-42");
    expect(result[0]._area).toBe("Bloco 3");
  });

  it("retorna [] quando nenhum RDO tem ocorrências com categorias", () => {
    const rdos = [
      { id: "r1", numero: "001", data: "2024-01-01", area: "", ocorrencias: [] },
    ];
    expect(normalizarRdos(rdos)).toEqual([]);
  });
});

// ── normalizarMudancas ───────────────────────────────────────────────────────

describe("normalizarMudancas", () => {
  it("ignora mudanças sem data_ocorrencia", () => {
    const mudancas = [
      { id: "m1", titulo: "Sem data", impacto_custo: 1000 },
    ];
    expect(normalizarMudancas(mudancas)).toHaveLength(0);
  });

  it("infere categoria Recursos quando impacto_custo != 0", () => {
    const mudancas = [{ id: "m1", titulo: "T", data_ocorrencia: "2024-01-10", impacto_custo: 5000, impacto_prazo_dias: null, impacto_escopo: null }];
    expect(normalizarMudancas(mudancas)[0].impacto_ocorrencia).toContain("Recursos");
  });

  it("infere categoria Planejamento quando impacto_prazo_dias != 0", () => {
    const mudancas = [{ id: "m1", titulo: "T", data_ocorrencia: "2024-01-10", impacto_custo: null, impacto_prazo_dias: 10, impacto_escopo: null }];
    expect(normalizarMudancas(mudancas)[0].impacto_ocorrencia).toContain("Planejamento");
  });

  it("infere categoria Escopo quando impacto_escopo é truthy", () => {
    const mudancas = [{ id: "m1", titulo: "T", data_ocorrencia: "2024-01-10", impacto_custo: null, impacto_prazo_dias: null, impacto_escopo: "Aditivo de escopo" }];
    expect(normalizarMudancas(mudancas)[0].impacto_ocorrencia).toContain("Escopo");
  });

  it("usa fallback ['Escopo'] quando nenhum campo de impacto é significativo", () => {
    const mudancas = [{ id: "m1", titulo: "T", data_ocorrencia: "2024-01-10", impacto_custo: 0, impacto_prazo_dias: 0, impacto_escopo: "" }];
    expect(normalizarMudancas(mudancas)[0].impacto_ocorrencia).toEqual(["Escopo"]);
  });

  it("pode inferir múltiplas categorias ao mesmo tempo", () => {
    const mudancas = [{ id: "m1", titulo: "T", data_ocorrencia: "2024-01-10", impacto_custo: 3000, impacto_prazo_dias: 5, impacto_escopo: "Novo escopo" }];
    const cats = normalizarMudancas(mudancas)[0].impacto_ocorrencia;
    expect(cats).toContain("Recursos");
    expect(cats).toContain("Planejamento");
    expect(cats).toContain("Escopo");
  });

  it("define fonte=Mudança e usa origem como responsabilidade", () => {
    const mudancas = [{ id: "m1", titulo: "Mudança X", data_ocorrencia: "2024-01-10", origem: "Contratante", impacto_custo: 0, impacto_prazo_dias: 0, impacto_escopo: "" }];
    const result = normalizarMudancas(mudancas)[0];
    expect(result.fonte).toBe("Mudança");
    expect(result.responsabilidade).toBe("Contratante");
    expect(result.id).toBe("mudanca-m1");
  });
});
```

---

- [ ] **Passo 1.3 — Rodar os testes e confirmar que FALHAM (TDD)**

```bash
cd /Users/viniciusgroth/Desktop/Projetos/gestao-integrada
npx vitest run src/hooks/useMapaRegistroData.test.js
```

Resultado esperado: **FAIL** com `Cannot find module './useMapaRegistroData'` (o arquivo existe mas as funções serão importadas — confirme que os imports funcionam após criar o arquivo no passo 1.1).

Se o arquivo já existe do passo 1.1, os testes devem rodar mas alguns podem falhar se a lógica estiver errada — ajuste conforme necessário.

---

- [ ] **Passo 1.4 — Rodar os testes e confirmar que PASSAM**

```bash
npx vitest run src/hooks/useMapaRegistroData.test.js
```

Resultado esperado:
```
✓ normalizarRegistros > exclui registros com tipo_registro=RDO
✓ normalizarRegistros > preserva campos do registro e define fonte=Registro
✓ normalizarRegistros > usa fallback [] para impacto_ocorrencia ausente
✓ normalizarRegistros > retorna array vazio quando entrada é vazia
✓ normalizarRdos > ignora ocorrências sem categorias
✓ normalizarRdos > explode ocorrências com categorias em pontos individuais
✓ normalizarRdos > formata data_hora concatenando T00:00:00
✓ normalizarRdos > define fonte=RDO e preserva numero/area do RDO pai
✓ normalizarRdos > retorna [] quando nenhum RDO tem ocorrências com categorias
✓ normalizarMudancas > ignora mudanças sem data_ocorrencia
✓ normalizarMudancas > infere categoria Recursos quando impacto_custo != 0
✓ normalizarMudancas > infere categoria Planejamento quando impacto_prazo_dias != 0
✓ normalizarMudancas > infere categoria Escopo quando impacto_escopo é truthy
✓ normalizarMudancas > usa fallback ['Escopo'] quando nenhum campo é significativo
✓ normalizarMudancas > pode inferir múltiplas categorias ao mesmo tempo
✓ normalizarMudancas > define fonte=Mudança e usa origem como responsabilidade

Test Files  1 passed (1)
Tests      16 passed (16)
```

---

- [ ] **Passo 1.5 — Commit**

```bash
git add src/hooks/useMapaRegistroData.js src/hooks/useMapaRegistroData.test.js
git commit -m "feat(mapa-registro): hook useMapaRegistroData com normalizadores das 3 fontes"
```

---

## Task 2: Wiring — MapaImpacto.jsx usa o hook

**Files:**
- Modify: `src/pages/AdminContratual/MapaImpacto.jsx`

---

- [ ] **Passo 2.1 — Substituir useQuery pelo hook em MapaImpacto.jsx**

Abra `src/pages/AdminContratual/MapaImpacto.jsx`. O arquivo atual tem:

```jsx
import { entities } from "@/api/supabaseEntities";
import { useQuery } from "@tanstack/react-query";
// ...

const { data: incidentes = [], isPending, isError } = useQuery({
  queryKey: ["registros", selectedProjectId],
  queryFn: () => entities.Registro.filter({ projeto_id: selectedProjectId }),
  enabled: !!selectedProjectId,
});
```

Substitua **todo o arquivo** pelo seguinte conteúdo:

```jsx
import { MapPin } from "lucide-react";
import MapaRegistroImpacto from "@/components/pleitos/MapaRegistroImpacto";
import PageEmptyState from "@/components/ui/PageEmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useProject } from "@/lib/ProjectContext";
import useMapaRegistroData from "@/hooks/useMapaRegistroData";

export default function MapaImpacto() {
  const { selectedProjectId } = useProject();
  const { incidentes, isPending, isError } = useMapaRegistroData(selectedProjectId);

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState
            icon={MapPin}
            description="Selecione um projeto na barra lateral para ver o mapa de impacto."
          />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1">
          <PageEmptyState icon={MapPin} description="Erro ao carregar o mapa de impacto. Verifique sua conexão e tente novamente." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader />
      <div className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {isPending ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ) : (
            <MapaRegistroImpacto incidentes={incidentes} />
          )}
        </div>
      </div>
    </div>
  );
}
```

---

- [ ] **Passo 2.2 — Verificar que o app compila sem erros**

```bash
cd /Users/viniciusgroth/Desktop/Projetos/gestao-integrada
npx vite build 2>&1 | tail -20
```

Resultado esperado: sem erros de compilação. Warnings de lint são aceitáveis.

---

- [ ] **Passo 2.3 — Commit**

```bash
git add src/pages/AdminContratual/MapaImpacto.jsx
git commit -m "feat(mapa-registro): MapaImpacto usa useMapaRegistroData (3 fontes)"
```

---

## Task 3: HeatmapDrilldown — badge de fonte e detalhe Mudança

**Files:**
- Modify: `src/components/pleitos/HeatmapDrilldown.jsx`

---

- [ ] **Passo 3.1 — Substituir conteúdo de HeatmapDrilldown.jsx**

Substitua **todo o arquivo** `src/components/pleitos/HeatmapDrilldown.jsx`:

```jsx
import { useState } from "react";
import { formatDateTime, formatDate } from "@/lib/dateUtils";
import { X, ArrowLeft, FileText, Calendar, User, AlertTriangle, Tag, DollarSign, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";

// Badge de fonte — substitui tipoColors anterior
const FONTE_BADGE = {
  "Registro": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "RDO":      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Mudança":  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

function fmtCurrency(val) {
  if (val == null || val === 0) return null;
  const abs = Math.abs(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  return val >= 0 ? `+${abs}` : `-${abs.replace("-", "")}`;
}

function DetalheRegistro({ r }) {
  return (
    <div className="space-y-3">
      {r.descricao && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Descrição</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{r.descricao}</p>
        </div>
      )}
      {r.impacto_preliminar && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Impacto Preliminar</p>
          <p className="text-sm text-foreground">{r.impacto_preliminar}</p>
        </div>
      )}
    </div>
  );
}

function DetalheRdo({ r }) {
  return (
    <div className="space-y-3">
      <div className="bg-muted rounded-lg p-3">
        <p className="text-xs text-muted-foreground mb-1">RDO Nº / Área</p>
        <p className="text-sm font-semibold text-foreground">
          {r._numero_rdo || "—"}{r._area ? ` · ${r._area}` : ""}
        </p>
      </div>
      {r.descricao && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Ocorrência</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{r.descricao}</p>
        </div>
      )}
    </div>
  );
}

function DetalheMudanca({ r }) {
  const custo = fmtCurrency(r._impacto_custo);
  return (
    <div className="space-y-3">
      {r._titulo && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Título da Mudança</p>
          <p className="text-sm font-semibold text-foreground">{r._titulo}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {custo && (
          <div className="flex items-start gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Impacto Custo</p>
              <p className="text-sm font-medium text-foreground">{custo}</p>
            </div>
          </div>
        )}
        {r._impacto_prazo_dias != null && r._impacto_prazo_dias !== 0 && (
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Impacto Prazo</p>
              <p className="text-sm font-medium text-foreground">
                {r._impacto_prazo_dias > 0 ? "+" : ""}{r._impacto_prazo_dias} dias
              </p>
            </div>
          </div>
        )}
      </div>
      {r._impacto_escopo && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Impacto no Escopo</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{r._impacto_escopo}</p>
        </div>
      )}
    </div>
  );
}

function RegistroDetalhe({ registro, onBack }) {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar à lista
      </button>

      {/* Badges de cabeçalho */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className={FONTE_BADGE[registro.fonte] || "bg-muted text-muted-foreground"}>
          {registro.fonte}
        </Badge>
        {registro.fonte === "Registro" && registro.tipo_registro && (
          <span className="text-xs text-muted-foreground">{registro.tipo_registro}</span>
        )}
        {registro.status && <StatusBadge status={registro.status} />}
        {registro.responsabilidade && (
          <Badge
            variant="outline"
            className={
              registro.responsabilidade === "Contratada"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "bg-status-attention/15 text-status-attention"
            }
          >
            {registro.responsabilidade}
          </Badge>
        )}
      </div>

      {/* Data e responsável */}
      <div className="grid grid-cols-2 gap-3">
        {registro.data_hora && (
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Data</p>
              <p className="text-sm font-medium text-foreground">
                {registro.fonte === "RDO"
                  ? formatDate(registro.data_hora)
                  : formatDateTime(registro.data_hora)}
              </p>
            </div>
          </div>
        )}
        {registro.responsavel_registro && (
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Responsável</p>
              <p className="text-sm font-medium text-foreground">{registro.responsavel_registro}</p>
            </div>
          </div>
        )}
        {registro.gravidade && (
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Gravidade</p>
              <p className="text-sm font-medium text-foreground">{registro.gravidade}</p>
            </div>
          </div>
        )}
      </div>

      {/* Conteúdo específico por fonte */}
      {registro.fonte === "RDO" && <DetalheRdo r={registro} />}
      {registro.fonte === "Mudança" && <DetalheMudanca r={registro} />}
      {registro.fonte === "Registro" && <DetalheRegistro r={registro} />}

      {/* Categorias de impacto */}
      {registro.impacto_ocorrencia?.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Tag className="w-3 h-3" /> Categorias de Impacto
          </p>
          <div className="flex flex-wrap gap-1">
            {registro.impacto_ocorrencia.map((cat) => (
              <span key={cat} className="text-xs px-2 py-0.5 rounded-full font-medium bg-ocre/15 text-ocre">
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HeatmapDrilldown({ open, onClose, category, weekLabel, registros }) {
  const [selected, setSelected] = useState(null);

  if (!open) return null;

  const realRegistros = registros.filter((r) => r.id);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={() => { setSelected(null); onClose(); }}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full z-50 w-full max-w-md bg-card shadow-2xl flex flex-col"
        style={{ borderLeft: "3px solid var(--color-ocre, #c35e1e)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border bg-foreground">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.6)" }}>
              {weekLabel}
            </p>
            <h3 className="text-base font-bold text-white mt-0.5">{category}</h3>
            {!selected && (
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                {realRegistros.length === 0
                  ? "Nenhum registro nesta célula"
                  : `${realRegistros.length} registro(s) encontrado(s)`}
              </p>
            )}
          </div>
          <button
            onClick={() => { setSelected(null); onClose(); }}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors mt-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {selected ? (
            <RegistroDetalhe registro={selected} onBack={() => setSelected(null)} />
          ) : realRegistros.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">Nenhum registro para</p>
              <p className="text-foreground font-semibold mt-1">{category} · {weekLabel}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {realRegistros.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="w-full text-left p-3 rounded-xl border border-border hover:border-ocre/40 hover:bg-ocre/5 transition-all duration-150 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-xs ${FONTE_BADGE[r.fonte] || "bg-muted text-muted-foreground"}`}
                        >
                          {r.fonte}
                        </Badge>
                        {r.fonte === "Registro" && r.tipo_registro && (
                          <span className="text-xs text-muted-foreground">{r.tipo_registro}</span>
                        )}
                        {r.status && <StatusBadge status={r.status} />}
                      </div>
                      <p className="text-sm font-medium text-foreground line-clamp-2">
                        {r.fonte === "RDO"
                          ? `RDO Nº ${r._numero_rdo || "—"}${r._area ? ` · ${r._area}` : ""}`
                          : r.descricao}
                      </p>
                      {r.data_hora && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {r.fonte === "RDO" ? formatDate(r.data_hora) : formatDateTime(r.data_hora)}
                        </p>
                      )}
                    </div>
                    <ArrowLeft className="w-4 h-4 text-muted-foreground/40 group-hover:text-ocre rotate-180 flex-shrink-0 mt-1 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
```

---

- [ ] **Passo 3.2 — Verificar que formatDate está exportada de dateUtils**

```bash
grep -n "export.*formatDate\b" /Users/viniciusgroth/Desktop/Projetos/gestao-integrada/src/lib/dateUtils.js
```

Resultado esperado: uma linha com `export function formatDate` ou `export { formatDate }`.

Se `formatDate` **não** estiver exportada, verifique o nome correto da função de formatação de data simples em `dateUtils.js` e ajuste o import em `HeatmapDrilldown.jsx` correspondentemente.

---

- [ ] **Passo 3.3 — Build final de verificação**

```bash
npx vite build 2>&1 | tail -20
```

Resultado esperado: sem erros.

---

- [ ] **Passo 3.4 — Rodar todos os testes**

```bash
npx vitest run
```

Resultado esperado: todos os testes passando, incluindo os 16 novos de `useMapaRegistroData`.

---

- [ ] **Passo 3.5 — Commit**

```bash
git add src/components/pleitos/HeatmapDrilldown.jsx
git commit -m "feat(mapa-registro): drilldown com badge de fonte e detalhe por tipo (Registro/RDO/Mudança)"
```

---

## Critérios de Aceite (checklist final)

Abra o app e navegue até **Admin Contratual → Mapa de Impacto**:

- [ ] Heatmap exibe dados das 3 fontes (Registros + RDOs + Mudanças) combinados por semana e categoria
- [ ] RDOs sem ocorrências categorizadas não aparecem no heatmap
- [ ] Mudanças sem `data_ocorrencia` não aparecem no heatmap
- [ ] Ao clicar uma célula: badge roxo para Registro, azul para RDO, amber para Mudança
- [ ] Detalhe de Registro: mostra descricao, impacto_preliminar, gravidade
- [ ] Detalhe de RDO: mostra Nº RDO, área, descrição da ocorrência
- [ ] Detalhe de Mudança: mostra título, custo formatado em BRL, prazo em dias, escopo
- [ ] Loading state aguarda as 3 queries (spinner/skeleton visível enquanto qualquer uma carrega)
- [ ] Gráfico de pizza (Responsabilidade) e radar continuam funcionando sem regressão
