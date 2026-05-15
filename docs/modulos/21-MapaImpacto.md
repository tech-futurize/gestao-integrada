# Mapa de Impacto — Heatmap Contratada × Contratante

## Rota e Entidades

- **Rota:** `/admin-contratual/mapa-impacto`
- **Página:** `src/pages/AdminContratual/MapaImpacto.jsx`
- **Componente:** `src/components/pleitos/MapaRegistroImpacto.jsx`
- **Entidade lida:** `Incidente` (tabela `incidentes`) — somente leitura

## Visão Geral

Visualização heatmap 2D que distribui os registros de ocorrências por categoria de impacto (eixo X) e responsabilidade (Contratada / Contratante no eixo Y). A intensidade de cor indica a quantidade de registros em cada célula.

## Paleta de Intensidade (6 Níveis)

| Nível | Nome | Hex | Classe Tailwind |
|---|---|---|---|
| 0 | Nenhum | `#ffffff` | `bg-white` |
| 1 | Muito Baixo | `#dcfce7` | `bg-green-100` |
| 2 | Baixo | `#86efac` | `bg-green-300` |
| 3 | Médio | `#fde047` | `bg-yellow-300` |
| 4 | Alto | `#f97316` | `bg-orange-500` |
| 5 | Crítico | `#dc2626` | `bg-red-600 text-white` |

## Comportamentos Principais

- Leitura de `incidentes` filtrados pelo `selectedProjectId`
- Cálculo da intensidade por célula (categoria × responsabilidade)
- Clique em célula pode exibir drill-down dos registros daquela combinação
- **Sem botão de exportar**
- **Sem textos de instrução ou legendas descritivas** na UI ("Distribuição de impactos...", "Clique em uma célula...", etc. — removidos)
- Texto de categoria truncado quando necessário (sem overflow)
- `enabled: !!selectedProjectId`

## UX / Design

- Dual theme: células com cores da paleta de 6 níveis mantidas em ambos os temas
- Cabeçalho do heatmap sem corte de texto

## Documentos Relacionados

- [Registros](./02-Registros.md) | [Pleitos](./03-Pleitos.md) | [Gestão de Riscos](./13-GestaoRiscos.md)
- [DATABASE.md — incidentes](../architecture/DATABASE.md)
- [DESIGN.md — Paleta do Mapa de Impacto](../design/DESIGN.md)
