# PLAN.md — Sistema de Gestão Integrada

## Milestone Atual: AI Agent Integration

**Objetivo:** Integrar o Mastra Agent Framework ao sistema React, expondo o `supabase-analyst-agent` como chat interativo na sidebar e o Mastra Studio como tela de configurações.

**Stack do agente:** Mastra Framework (TypeScript) · GPT-4o · PostgreSQL/Supabase · Memória persistente (LibSQL)

---

### Tasks

- [x] Remover weather agent dos Agents Mastra (arquivos e referências no index.ts)
- [x] Configurar proxy Vite para Mastra API (`/mastra-api` → `http://localhost:4111`)
- [x] Criar `src/pages/Agente.jsx` — chat SSE com streaming do `supabase-analyst-agent`
- [x] Criar `src/pages/AgenteConfig.jsx` — iframe do Mastra Studio
- [x] Atualizar `src/Layout.jsx` — novos itens "Agente IA" e "Config. Agente" na sidebar
- [x] Atualizar `src/App.jsx` — rotas `/Agente` e `/AgenteConfig`
- [x] Atualizar `.env.example` com `VITE_MASTRA_URL`

---

### Como rodar

```bash
# Terminal 1 — Mastra (porta 4111)
cd "Agents Mastra"
npm run dev

# Terminal 2 — React App (porta 5173)
npm run dev
```

---

### Próximos passos sugeridos

- [ ] Adicionar autenticação no Mastra (proteger endpoint da API)
- [ ] Permitir múltiplas threads de conversa (histórico persistido por usuário)
- [ ] Integrar contexto do projeto ativo no prompt do agente (passar `selectedProjectId`)
- [ ] Adicionar mais agentes especializados (ex: agente de cronograma, agente de pleitos)
