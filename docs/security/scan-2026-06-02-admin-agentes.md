# Security Scan — 2026-06-02 (Admin de Agentes de IA)

**Escopo:** Módulo Admin de Agentes — Tasks 1–8 do milestone atual.
**Arquivos auditados:** `src/components/agentes/*`, `src/pages/Configuracoes/AdminAgentes.jsx`, `agents-mastra/src/mastra/loaders/agent-loader.ts`, tabelas Supabase.

---

## CRITICAL
_Nenhum finding crítico._

---

## HIGH

### H1 — RLS permissivo demais: qualquer autenticado modifica agentes/tools
**Arquivo:** `docs/database/supabase-migration.sql` (políticas das tabelas `agentes`, `agente_tools`, etc.)
**Detalhe:** As RLS policies foram criadas com `FOR ALL TO authenticated USING (true)` — qualquer usuário autenticado (Visualizador, Engenharia, etc.) pode criar, editar ou deletar agentes e tools via API direta, contornando a guarda `isAdmin` que só existe no frontend. A proteção admin é puramente client-side.
**Ação para o Builder:** Criar RLS policies de escrita restritas ao perfil Admin. A tabela `usuarios` tem campo `perfil`. A policy deve checar `(SELECT perfil FROM usuarios WHERE email = auth.email()) = 'Admin'` para operações INSERT/UPDATE/DELETE. SELECT pode continuar para todos os autenticados.

---

## MEDIUM

### M1 — Fallback VITE_SUPABASE_ANON_KEY no agent-loader causará falha silenciosa
**Arquivo:** `agents-mastra/src/mastra/loaders/agent-loader.ts:33`
**Detalhe:** O loader usa `process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY` como chave Supabase. A anon key usa role `anon`, mas as RLS policies de `agentes` só permitem role `authenticated`. Se `SUPABASE_SERVICE_KEY` não estiver definida, o loader conecta com a anon key, a query retorna 0 rows (RLS bloqueia silenciosamente) e o Mastra sobe sem nenhum agente — sem erro explícito, apenas `[agent-loader] 0 agente(s) carregado(s) do banco.`
**Ação para o Builder:** Remover o fallback para `VITE_SUPABASE_ANON_KEY`. Lançar erro claro se `SUPABASE_SERVICE_KEY` não estiver definida: `throw new Error('SUPABASE_SERVICE_KEY obrigatória para o agent-loader. Configure em agents-mastra/.env.local')`.

### M2 — 9 vulnerabilidades HIGH no npm audit (pré-existentes)
**Pacotes:** flatted, glob, lodash, minimatch, picomatch, react-router, rollup, vite, xlsx
**Detalhe:** Pré-existentes antes deste milestone — não introduzidas pelo módulo Admin de Agentes. A maioria tem fix disponível (`npm audit fix`). xlsx não tem fix disponível.
**Ação:** Rodar `npm audit fix` no próximo milestone. xlsx: avaliar alternativa ou accept risk documentado.

---

## LOW

### L1 — Sem validação client-side do SQL template no ToolEditor
**Arquivo:** `src/components/agentes/ToolEditor.jsx`
**Detalhe:** O `sql_template` é salvo sem validação no frontend. A guarda `BLOCKED_SQL` existe no backend Mastra (`supabase-tools.ts:67`) mas não é replicada no save do formulário. Um admin pode salvar um template com `DELETE` — o Mastra bloqueia na execução, mas o dado inválido entra no banco.
**Ação:** Adicionar validação no `canSave` do ToolEditor: `!/\b(DELETE|DROP|TRUNCATE|ALTER|UPDATE|INSERT|CREATE|GRANT|REVOKE)\b/i.test(form.sql_template)` com mensagem de erro na UI.

### L2 — Links externos no ProvidersTab sem `rel="noopener noreferrer"`
**Arquivo:** `src/components/agentes/ProvidersTab.jsx:13-18`
**Detalhe:** `docsUrl` está definido mas não renderizado como link na UI atual — apenas como comentário na constante. Se for renderizado futuramente como `<a href>`, precisa de `target="_blank" rel="noopener noreferrer"` para evitar tabnapping.
**Ação:** Preventivo — garantir `rel="noopener noreferrer"` caso os links sejam expostos na UI.

---

## Validações Positivas ✅

- **Tokens de API nunca trafegam ao browser:** AgentEditor.jsx e ProvidersTab.jsx não expõem nenhum campo de API key. A aba Provedores mostra apenas o nome da env var (`OPENAI_API_KEY`) com badge read-only, sem campo editável. ✅
- **RLS habilitada em todas as 6 novas tabelas:** Confirmado via `pg_tables.rowsecurity = true`. ✅
- **Políticas RLS existem em todas as tabelas:** 7 policies ativas confirmadas. ✅
- **Guarda SQL (BLOCKED_SQL) ativa:** `supabase-tools.ts:67` — regex bloqueia DELETE/DROP/TRUNCATE/ALTER/UPDATE/INSERT/CREATE/GRANT/REVOKE/VACUUM/REINDEX antes de qualquer execução. ✅
- **Guarda admin no frontend:** `AdminAgentes.jsx` verifica `isAdmin` com loading state correto (Tester já corrigiu o flash). ✅
- **Sem secrets hardcoded:** Nenhuma API key, senha ou token encontrado nos novos arquivos frontend ou backend. ✅
- **Sem injeção XSS:** Todos os inputs passam por componentes shadcn/Radix — sem `dangerouslySetInnerHTML`. ✅

---

## Itens a Resolver Antes do Deploy

| # | Severidade | Prazo | Status |
|---|---|---|---|
| H1 | HIGH | 72h | ⚠️ Pendente (Builder) |
| M1 | MEDIUM | Próximo milestone | ⚠️ Pendente (Builder) |
| M2 | MEDIUM | Próximo milestone | ⚠️ Pré-existente |
| L1 | LOW | Backlog | ⚠️ Pendente |
| L2 | LOW | Backlog | ⚠️ Preventivo |
