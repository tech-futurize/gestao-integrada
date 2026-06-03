# INTEGRATIONS.md — Serviços Externos

> Lista todos os serviços externos conectados ao projeto.
> **Consulta obrigatória** para o Builder antes de integrar qualquer serviço.

---

## 1. Supabase

**URL:** `https://wkehlydccqrvybbblyeh.supabase.co`

| Serviço | Uso | Status |
|---------|-----|--------|
| Auth | Login email+senha, sessões | ✅ Ativo |
| Database (PostgreSQL) | ~30 tabelas, persistência total | ✅ Ativo |
| Row Level Security | Acesso por usuário autenticado | ✅ Ativo |
| Storage | Upload de arquivos (buckets: `registros-anexos`, `rdo-evidencias`) | ✅ Ativo |
| Realtime | Notificações em tempo real | ⬜ Não configurado |
| Edge Functions | Lógica server-side | ⬜ Não configurado |

**Variáveis:**
```env
VITE_SUPABASE_URL=<url-do-projeto>
VITE_SUPABASE_ANON_KEY=<chave-anonima-jwt>
```
A `anon key` é segura no browser — limitada pelas policies RLS.

**Cliente:** `src/lib/supabaseClient.js`

**RLS policy padrão (todas as tabelas):**
```sql
CREATE POLICY "Authenticated users full access" ON <tabela>
FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

## 2. GitHub

**Repositório:** `https://github.com/tech-futurize/gestao-de-contratos` (privado)

**Variável:**
```env
GITHUB_TOKEN=<token-com-permissao-repo>
```

> ⚠️ O `GITHUB_TOKEN` **não deve** ter prefixo `VITE_` — não deve ir ao bundle do browser. Deve ser movido para CI/CD secrets em versões futuras.

---

## 3. Mastra (Agentes de IA)

**Servidor:** `http://localhost:4111` (desenvolvimento local)
**Localização no repositório:** `agents-mastra/` (servidor separado — não faz parte do bundle Vite)

| Aspecto | Detalhe |
|---------|---------|
| Função | Servidor de agentes de IA interno do projeto |
| Status | ✅ Ativo (ferramenta interna em desenvolvimento) |
| Autenticação | Sem autenticação externa — acesso local apenas |
| Variável | Nenhuma env var pública necessária |

> O servidor Mastra não é exposto ao browser diretamente; é chamado por ferramentas de desenvolvimento (Claude Code / agentes). Não inclui secrets de produção.

---

## 4. Integrações Futuras

| Serviço | Finalidade | Prioridade |
|---------|-----------|------------|
| Supabase Realtime | Notificações em tempo real | Média |
| React-PDF | Exportação de relatórios PDF | Baixa |
| Resend / Nodemailer | E-mails de notificação | Baixa |

---

## Adicionando nova integração

1. Criar ADR em `/docs/adrs/`
2. Adicionar vars ao `.env.example`
3. Nunca usar `VITE_` em secrets que não devem ir ao browser
4. Atualizar este documento

> **Consultado pelo** Security para auditoria de chaves e permissões.
>
> **Ownership:** Architect | **Atualizado quando:** novo serviço é adicionado

---

## Regras de Segurança para Integrações

- Chaves de API nunca no código — sempre via variáveis de ambiente
- Variáveis com prefixo `VITE_` são expostas ao browser (bundle Vite) — nunca coloque secrets nelas
- Cada serviço deve ter a chave com o menor escopo de permissão possível
- Rotacionar chaves a cada 90 dias (ou conforme política do serviço)
- Documentar aqui sempre que uma chave for rotacionada

---

## Documentos Relacionados

- Arquitetura geral → [ARCHITECTURE.md](./ARCHITECTURE.md)
- Variáveis de ambiente → `.env.example` na raiz
- Auditoria de segurança → [/docs/security/](../security/)
