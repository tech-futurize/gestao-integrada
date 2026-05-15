# Gerenciar Projeto — Ficha Técnica do Projeto

## Rota e Entidades

- **Rota:** `/configuracoes/gerenciar-projeto`
- **Página:** `src/pages/Configuracoes/GerenciarProjeto.jsx`
- **Entidade:** `Projeto` (tabela `projetos`)

## Visão Geral

Ficha técnica do **contrato principal** com o cliente — não dos subcontratos (estes estão em Contratos). É a tela de administração do projeto selecionado: dados cadastrais, partes envolvidas, prazos, valor e documentos contratuais de referência.

## Campos — Projeto

| Campo | Tipo | Notas |
|---|---|---|
| `nome` | TEXT | Nome do projeto |
| `descricao` | TEXT | |
| `cliente` | TEXT | |
| `data_inicio` | DATE | |
| `data_prevista_termino` | DATE | |
| `status` | TEXT | Planejamento / Em Andamento / Pausado / Concluído / Cancelado |
| `responsavel_geral` | TEXT | Gerente de projeto |
| `valor_contrato` | NUMERIC | Valor do contrato principal |

## Comportamentos Principais

- Formulário toggle leitura/edição: exibe dados em modo leitura por padrão; botão "Editar" habilita os campos
- Criação de novos projetos via botão dedicado
- Lista de projetos disponíveis para seleção
- `selectedProjectId` gerenciado via `useProject()` / `ProjectContext`
- Não exige `enabled: !!selectedProjectId` — é a tela que cria/seleciona projetos

## UX / Design

- Dual theme claro/escuro
- Botão Salvar: `bg-emerald-600`

## Documentos Relacionados

- [Contratos](./09-Contratos.md) | [Usuários](./25-Usuarios.md)
- [DATABASE.md — projetos](../architecture/DATABASE.md)
- [ARCHITECTURE.md — Seleção de Projeto Ativo](../architecture/ARCHITECTURE.md)
