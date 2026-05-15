# Contratos — Gestão de Contratos e Aditivos

## Rota e Entidades

- **Rota:** `/admin-contratual/contratos`
- **Página:** `src/pages/Contratos.jsx`
- **Entidades:** `Contrato` (tabela `contratos`) + `Aditivo` (tabela `aditivos`) + `Medicao` (tabela `medicoes`)

## Visão Geral

Gerencia contratos com fornecedores e subcontratados — não o contrato principal com o cliente (este está em Gerenciar Projeto). Inclui aditivos (prazo e valor) e medições de pagamento.

## Campos — Contrato

| Campo | Tipo | Notas |
|---|---|---|
| `numero` | TEXT | |
| `objeto` | TEXT | Descrição do escopo |
| `fornecedor` | TEXT | |
| `cnpj` | TEXT | |
| `valor_total` | NUMERIC | Formatação BRL no front (ponto milhar, vírgula decimal) |
| `data_inicio` | DATE | Início original do contrato |
| `data_fim` | DATE | Término original do contrato |
| `status` | TEXT | **A iniciar / Em andamento / Concluído / Paralisado** |
| `tipo` | TEXT | **Fornecimento / Serviço / Fornecimento + Serviço** |
| `centro_custo` | TEXT | |
| `gestor` | TEXT | |

> **Início Atual** e **Término Atual** são calculados no front: `data_inicio` e `data_fim + Σ(aditivos.prazo_dias)`. Não são persistidos no banco.

## Campos — Aditivo

| Campo | Tipo | Notas |
|---|---|---|
| `contrato_id` | UUID FK | |
| `numero` | TEXT | |
| `tipo` | TEXT | Prazo / Valor / Prazo e Valor |
| `escopo_texto` | TEXT | Descrição do escopo alterado |
| `prazo_dias` | INTEGER | Dias adicionados |
| `valor` | NUMERIC | Valor em R$ |
| `data_assinatura` | DATE | |
| `status` | TEXT | Pendente / Assinado / Cancelado |

## Campos — Medição

Ver [24-Medicoes.md](./24-Medicoes.md) para detalhes completos.

## Comportamentos Principais

- Lista de contratos com cards e modal de edição
- Aba de aditivos dentro do detalhe do contrato
- Datas Início/Término Atual calculadas dinamicamente conforme aditivos
- Histórico de medições acessível via botão pop-up
- `enabled: !!selectedProjectId`
- Import/Export disponível

## UX / Design

- Valores formatados em BRL (`R$ 1.234.567,89`)
- Dual theme claro/escuro

## Documentos Relacionados

- [Medições](./24-Medicoes.md) | [Gerenciar Projeto](./14-GerenciarProjeto.md)
- [DATABASE.md — contratos, aditivos](../architecture/DATABASE.md)
