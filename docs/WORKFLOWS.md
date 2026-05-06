# WORKFLOWS.md — Workflows do Projeto

> Documenta todos os workflows padronizados do projeto.
> Cada workflow é um comando que pode ser invocado por agentes específicos,
> com passos definidos, agentes envolvidos e critérios de saída.
>
> **Local:** /docs/WORKFLOWS.md
> **Ownership:** Architect
> **Consultado por:** Todos os agentes

---

## Visão Geral

| Workflow | Quem Invoca | Quem Responde | Trigger |
|----------|-------------|---------------|---------|
| /audit | Tester | Designer (visual) + Builder (funcional) | Pré-deploy ou sob demanda |
| /debug | Builder (ou qualquer) | O agente que encontrou o erro | Ao encontrar erro |
| /deploy | Architect (autoriza) | DevOps (executa), Tester + Security (validam) | Após milestone completo |
| /review | Architect | Todos os agentes (revisados) | Antes de merge/deploy |
| /security-scan | Security | Security (scan) → Builder (fixes) | Pré-milestone + pré-deploy |
| /milestone-start | Architect | Architect (exclusivo) | Início de milestone |
| /milestone-close | Architect | Architect + Tester | Fim de milestone |

---

## 1. /audit — Visual & Functional Quality Gate

**Invocado por:** Tester
**Respondido por:** Designer (visual) + Builder (funcional)
**Quando usar:** Antes de qualquer deploy, ou quando há suspeita de regressão visual/funcional.

### Step 1: Environmental Check

- Abra o browser integrado e navegue até a URL local de desenvolvimento.
- Verifique se o build está estável e o compilador completou o render inicial.

### Step 2: Visual Excellence Audit

Analise a view atual contra estes padrões inegociáveis:

1. **Information Architecture (IA):** A página está organizada por user goals? Escaneável em menos de 3 segundos?
2. **Modular Bento Grid:** O layout está estruturado em grid de alta densidade? Spacing tokens consistentes?
3. **Glassmorphism:** Backdrop-blur e transparência aplicados consistentemente em cards e sidebars?
4. **Typography:** Kinetic Typography ativa? Fontes legíveis e reativas a interação?
5. **Sidebar:** Visualmente discreta? Agrupada por intent, não por features?

### Step 3: Interaction & Trust Audit

Stress Test da UX:

1. **Immediate Feedback:** Todos os botões reconhecem input instantaneamente (menos de 100ms)?
2. **System States:** Verificar existência de:
   - **Loading:** Skeletons durante data fetch
   - **Empty State:** CTA claro quando não há dados
   - **Error State:** Mensagens recuperáveis, sem culpa
   - **Success State:** Toast notifications para ações completadas
3. **Optimistic UI:** Mutações atualizam a UI imediatamente antes da resposta do servidor?
4. **Intent Check:** Modals para ações destrutivas/alto comprometimento? Popovers para edições rápidas?

### Step 4: Audit Report

Gere relatório no chat com:

- **Squad Status:** Visual Score [1-10], Functional Score [1-10], Trust Score [1-10]
- **Visual Wins:** Lista de elementos UI que se destacam
- **Critical Fails (Correção Imediata):** Grids quebrados, ruído de navegação, problemas de acessibilidade
- **Logic & Trust Bugs:** Endpoints quebrados, loading states faltando, interações ambíguas

### Step 5: Recursive Self-Correction Loop

**Threshold:** 9/10 em cada categoria.

- Se **Visual < 9:** Designer assume e refatora CSS/Layout.
- Se **Functional < 9:** Builder assume e corrige lógica/API.
- **Validate:** Re-execute /audit automaticamente.
- **Exit:** Pare quando todos os scores forem ≥ 9 OU após 3 tentativas falhas (escale como "Blocked" no PLAN.md).

### Step 6: Final Sync

- Score ≥ 9 → Atualize PLAN.md para "Verified & Polished!"
- Commit com prefixo: `[AUTO-HEALED]`

---

## 2. /debug — Systematic Error Diagnosis & Resolution

**Invocado por:** Builder (principal) ou qualquer agente no seu domínio
**Quando usar:** Ao encontrar qualquer erro durante desenvolvimento. O Builder é obrigado a invocar este workflow — não pode resolver erros ad-hoc.

### Step 1: Captura do Contexto

- Identifique o **ERRO** exato (mensagem de terminal, stack trace, screenshot).
- Documente a **USER_TASK**: o que o usuário ou programa estava fazendo quando o erro ocorreu.
- Colete o código relevante (arquivos envolvidos, caso de uso).

### Step 2: Predictions (5 Hipóteses)

Gere 5 predições educadas sobre causas possíveis, considerando:

- Erros de código (typo, lógica invertida, type mismatch)
- Problemas de dependências (versão incompatível, pacote faltando)
- Constraints de recurso (timeout, memória, rate limit)
- Race conditions (estado assíncrono, promises não resolvidas)
- Configuração de ambiente (env var faltando, serviço fora do ar)

Classifique por probabilidade: Alta, Média, Baixa.

### Step 3: Code Investigation (Scratchpad)

- Revise metodicamente os segmentos de código relacionados à task onde o erro ocorreu.
- Para cada predição: verifique ou refute com evidências do código.
- Documente raciocínio no Scratchpad: por que descartou ou manteve cada hipótese.
- Identifique o código problemático específico.

### Step 4: Root Cause Analysis

- Selecione a causa mais provável das predições restantes.
- Explique em detalhes POR QUE esse é o root cause, referenciando código específico.
- Documente o raciocínio completo.

### Step 5: Correction & Debug Instructions

- Escreva instruções de debug detalhadas e acionáveis.
- Forneça o código corrigido E o código original que está sendo substituído.
- Garanta que o erro é não apenas resolvido, mas compreendido no contexto da aplicação.

### Step 6: Validate Fix

- Execute o código corrigido e confirme que o erro não se repete.
- Execute testes unitários afetados.
- Atualize PLAN.md com status do bug fix.
- Commit com prefixo: `[BUG-FIX] descrição`

---

## 3. /deploy — Pipeline Completo de Deploy

**Autorizado por:** Architect
**Executado por:** DevOps
**Gates (poder de veto):** Tester + Security
**Quando usar:** Após um milestone completo e validado.

### Step 1: Pre-Deploy Checklist

Validações obrigatórias antes de qualquer deploy:

1. **Branch check:** Confirme que está na branch correta (main/release). Nenhum merge pendente.
2. **Tests:** Todos os testes unitários, integração e e2e passando. Cobertura mínima definida no CLAUDE.md.
3. **Security scan:** npm audit sem vulnerabilidades críticas/altas. Agent_Security aprovou.
4. **Lint & type check:** Zero erros de lint e TypeScript.
5. **Environment vars:** Todas as variáveis de produção configuradas e secrets atualizados.
6. **PLAN.md:** Todas as tarefas do milestone marcadas como "Done" ou "Verified".

### Step 2: Build & Bundle

- Execute o build de produção (`next build` ou equivalente).
- Verifique tamanho dos bundles contra thresholds do CLAUDE.md.
- Valide que não há `console.log`, `debugger` statements, ou código de teste no bundle.
- Gere source maps para monitoramento de erros.

### Step 3: Deploy to Staging

- Faça deploy automático para o ambiente de staging.
- Execute health checks em todos os endpoints críticos.
- Execute smoke tests automáticos (principais user flows).
- Verifique conexões com serviços externos (DB, APIs de terceiros, Modal).

### Step 4: Staging Validation

Validação humana e automática no staging:

- Execute /audit no ambiente staging — todos os scores devem ser ≥ 9.
- Verifique performance: TTFB < 200ms, LCP < 2.5s, CLS < 0.1.
- Teste fluxos críticos manualmente: login, ação principal, pagamento (se aplicável).
- Agent_Security valida headers, CORS e configurações de segurança no staging.

### Step 5: Deploy to Production

- Após aprovação explícita do Architect.
- Use estratégia de deploy seguro: blue-green, canary, ou rolling deploy.
- Monitore métricas em tempo real nos primeiros 15 minutos.
- Mantenha versão anterior pronta para rollback instantâneo.

### Step 6: Post-Deploy Validation

- Execute health checks em produção.
- Verifique logs em busca de erros ou warnings novos.
- Monitore métricas de performance (error rate, latency, throughput).
- Se error rate > threshold: **ROLLBACK automático imediato**.

### Step 7: Final Sync

- Atualize PLAN.md com status "Deployed" e data.
- Tag a release no Git com versão semântica (`v1.2.3`).
- Notifique stakeholders sobre o deploy.
- Commit com prefixo: `[RELEASE] v1.2.3 — descrição`

---

## 4. /review — Code Review Estruturado

**Invocado por:** Architect
**Revisores:** Architect (arquitetura), Tester (cobertura), Security (vulnerabilidades)
**Quando usar:** Antes de merge ou deploy. Ao final de cada milestone.

### Step 1: Scope da Review

- Identifique todos os arquivos modificados no PR/commit.
- Classifique por risco:
  - **High:** auth, pagamentos, dados sensíveis
  - **Medium:** lógica de negócio, API endpoints
  - **Low:** UI, documentação
- Priorize review nos arquivos de alto risco.

### Step 2: Checklist de Qualidade

- **Convenções:** Segue o CLAUDE.md?
- **Naming:** Variáveis, funções e arquivos seguem as convenções?
- **DRY:** Há duplicação que poderia ser extraída?
- **Error handling:** Todos os caminhos de erro estão cobertos?
- **Types:** TypeScript strict sem `any` desnecessário?
- **Testes:** Cobertura adequada para as mudanças?

### Step 3: Security Review

- Validação de inputs em todos os endpoints novos.
- Nenhum secret hardcoded.
- Proteções contra SQL injection, XSS, CSRF.
- Rate limiting em endpoints públicos.

### Step 4: Review Report

Categorize findings:

- **Must Fix** — Bloqueante. Não pode ir para produção sem resolver.
- **Should Fix** — Importante. Resolver no próximo milestone.
- **Nice to Have** — Melhoria opcional.

Para cada finding: descreva o problema, o impacto e a solução sugerida.

**Aprovado somente quando todos os Must Fix estão resolvidos.**

---

## 5. /security-scan — Scan de Segurança Completo

**Invocado por:** Security (exclusivo)
**Fixes implementados por:** Builder
**Quando usar:** No início de cada milestone e antes de cada /deploy.

### Step 1: Dependency Scan

- Execute `npm audit` e analise todas as vulnerabilidades.
- Verifique se há pacotes deprecated ou abandonados.
- Verifique licenças de dependências (sem GPL em projetos proprietários).

### Step 2: Code Scan

- Busque por secrets hardcoded (API keys, tokens, passwords).
- Verifique padrões de injection (SQL, NoSQL, Command).
- Analise autenticação: tokens expiram? Refresh é seguro?
- Valide autorização: permissões estão corretas por role?

### Step 3: Configuration Scan

- CORS: origens permitidas são as corretas?
- CSP headers: política de conteúdo restritiva?
- HTTPS: forçado em produção?
- Cookies: HttpOnly, Secure, SameSite configurados?

### Step 4: Integration Scan

- Audite cada serviço listado em INTEGRATIONS.md.
- Chaves com escopo excessivo? Permissões mais amplas do que o necessário?
- Chaves expostas em código client-side (prefixo `NEXT_PUBLIC_`)?
- Rotação de chaves em dia?

### Step 5: Data Scan

- Verifique DATABASE.md para campos marcados como sensíveis.
- Dados PII estão encrypted at rest?
- Row Level Security (RLS) configurado corretamente?
- Logs contêm dados sensíveis?

### Step 6: Report

- Gere relatório em `/docs/security/` com data no nome (ex: `scan-2026-03-22.md`).
- Crie issues específicas no PLAN.md para o Builder.
- Defina deadline por severidade:
  - **Critical:** 24 horas
  - **High:** 72 horas
  - **Medium:** Próximo milestone
  - **Low:** Backlog

---

## 6. /milestone-start — Início de Milestone

**Invocado por:** Architect (exclusivo)
**Quando usar:** Ao iniciar um novo ciclo de trabalho.

### Steps

1. **Defina o Milestone Goal** — Objetivo concreto e entregável.
2. **Liste tasks** ordenadas por dependência.
3. **Atribua cada task** a um agente com critérios de aceitação claros.
4. **Identifique dependências** entre tasks (qual precisa estar Done antes da próxima começar).
5. **Gere a Sequência de Execução** — Lista numerada de agentes a acionar em cascata.
6. **Defina checkpoints** de sincronização (mid-milestone review se necessário).
7. **Atualize PLAN.md** com o milestone ativo, tasks e sequência.
8. **Atualize docs de architecture** se o milestone introduz novos módulos, tabelas ou serviços:
   - Novo módulo/camada → ARCHITECTURE.md
   - Nova tabela/campo → DATABASE.md
   - Novo serviço externo → INTEGRATIONS.md
9. **Comunique o plano** — A Sequência de Execução é o roteiro que o usuário seguirá.

---

## 7. /milestone-close — Fechamento de Milestone

**Invocado por:** Architect
**Validação:** Tester
**Quando usar:** Quando todas as tasks do milestone estão Done ou Blocked.

### Steps

1. **Revise todas as tasks:** Done, In Progress, Blocked.
2. **Tester valida** que todas as tasks "Done" têm testes passando.
3. **Tasks Blocked:** Documente o motivo e mova para o próximo milestone.
4. **Lições aprendidas:** O que funcionou? O que falhou? O que melhorar?
5. **Verifique que docs de architecture estão atualizados:**
   - ARCHITECTURE.md reflete as camadas atuais?
   - DATABASE.md reflete o schema atual?
   - INTEGRATIONS.md lista todos os serviços em uso?
6. **Atualize PLAN.md** com status final do milestone.
7. **Se o milestone inclui release:** Autorize /deploy e gere Sequência de Execução para o deploy.

---

## Documentos Relacionados

| Precisa saber... | Leia |
|-------------------|------|
| Quem faz o quê | [AGENTS.md](./AGENTS.md) |
| Matriz Agentes × Workflows | [PLAN.md](../PLAN.md) (seção fixa) |
| Regras e padrões | [CLAUDE.md](../CLAUDE.md) |
