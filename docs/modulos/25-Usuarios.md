# Usuários — Cadastro de Usuários

## Rota e Entidades

- **Rota:** `/configuracoes/usuarios`
- **Página:** `src/pages/Configuracoes/Usuarios.jsx`
- **Entidade:** `Usuario` (tabela `usuarios`)

## Visão Geral

CRUD básico de usuários do sistema. Sem RBAC granular por módulo neste milestone — perfis são informativos. Lista todos os usuários (global, sem filtro por projeto).

## Campos

| Campo | Tipo | Notas |
|---|---|---|
| `email` | TEXT UNIQUE | Obrigatório |
| `nome` | TEXT | Obrigatório |
| `cargo` | TEXT | Cargo/função descritivo (campo livre) |
| `perfil` | TEXT | Admin / Gestor / Visualizador (informativo, sem RBAC ativo) |
| `status` | TEXT | Ativo / Inativo |
| `projeto_padrao_id` | UUID FK → projetos | Projeto padrão ao fazer login |

## Comportamentos Principais

- Lista de usuários com badges de status (Ativo/Inativo)
- Modal de criação com campos: nome, email, cargo, perfil, status
- Edição via mesmo modal
- Desativação: altera `status` para "Inativo" (não deleta o registro)
- Query global (sem `projeto_id` no filtro)

## UX / Design

- Badge Ativo: `bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300`
- Badge Inativo: `bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400`
- Dual theme claro/escuro
- Botão Salvar: `bg-emerald-600`

## Backlog Futuro

- RBAC granular: permissões por módulo e por projeto
- Integração com Supabase Auth (`auth.users`) para provisionar login automaticamente

## Documentos Relacionados

- [Gerenciar Projeto](./14-GerenciarProjeto.md)
- [DATABASE.md — usuarios](../architecture/DATABASE.md)
