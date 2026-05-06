# INTEGRATIONS.md — Serviços Externos

> Lista todos os serviços externos conectados ao projeto.
> **Consulta obrigatória** para o Builder antes de integrar qualquer serviço.

---

## 1. Supabase

**URL:** `https://wkehlydccqrvybbblyeh.supabase.co`

| Serviço | Uso | Status |
|---------|-----|--------|
| Auth | Login email+senha, sessões | ✅ Ativo |
| Database (PostgreSQL) | 25 tabelas, persistência total | ✅ Ativo |
| Row Level Security | Acesso por usuário autenticado | ✅ Ativo |
| Storage | Upload de arquivos | ⬜ Não configurado |
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

## 3. Integrações Futuras

| Serviço | Finalidade | Prioridade |
|---------|-----------|------------|
| Supabase Realtime | Notificações em tempo real | Média |
| Supabase Storage | Upload de documentos/RNC | Média |
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

## Índice de Serviços

<!-- Liste aqui todos os serviços para referência rápida -->

| Serviço | Função | Status |
|---------|--------|--------|
| | | ✅ Ativo / ⬜ Planejado |
| | | |

---

## Detalhamento por Serviço

<!-- Copie este bloco para cada novo serviço integrado -->

### <!-- Nome do Serviço (ex: Anthropic) -->

- **Função no projeto:** <!-- O que este serviço faz? Ex: "Geração de texto via Claude API para relatórios automáticos" -->
- **Tipo de autenticação:** <!-- API Key, OAuth 2.0, JWT, Service Account... -->
- **Variável de ambiente:** <!-- Nome exato da env var. Ex: ANTHROPIC_API_KEY -->
- **Onde a chave é guardada:**
  - Local: `.env.local`
  - Produção: <!-- Ex: Vercel Secrets, AWS Secrets Manager -->
- **Endpoints utilizados:**
  - <!-- Ex: POST /v1/messages — geração de texto -->
  - <!-- Ex: POST /v1/messages (streaming) — geração em tempo real -->
- **Rate limits conhecidos:** <!-- Ex: 1000 req/min no plano atual -->
- **Como o projeto lida com rate limits:** <!-- Ex: Retry com exponential backoff via lib/api.ts -->
- **Fallback se o serviço cair:** <!-- Ex: Mostra mensagem de indisponibilidade temporária, sem retry -->
- **Custo estimado mensal:** <!-- Ex: ~$50 baseado em 10k requests/mês -->
- **Docs oficiais:** <!-- Link para documentação do serviço -->

---

### <!-- Próximo Serviço -->

- **Função no projeto:** 
- **Tipo de autenticação:** 
- **Variável de ambiente:** 
- **Onde a chave é guardada:**
  - Local: `.env.local`
  - Produção: 
- **Endpoints utilizados:**
  - 
- **Rate limits conhecidos:** 
- **Como o projeto lida com rate limits:** 
- **Fallback se o serviço cair:** 
- **Custo estimado mensal:** 
- **Docs oficiais:** 

---

## Regras de Segurança para Integrações

- Chaves de API nunca no código — sempre via variáveis de ambiente
- Variáveis com prefixo `NEXT_PUBLIC_` são expostas ao browser — nunca coloque secrets nelas
- Cada serviço deve ter a chave com o menor escopo de permissão possível
- Rotacionar chaves a cada 90 dias (ou conforme política do serviço)
- Documentar aqui sempre que uma chave for rotacionada

---

## Documentos Relacionados

- Arquitetura geral → [ARCHITECTURE.md](./ARCHITECTURE.md)
- Variáveis de ambiente → `.env.example` na raiz
- Auditoria de segurança → [/docs/security/](../security/)
