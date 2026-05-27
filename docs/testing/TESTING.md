# TESTING.md — Estratégia de Testes

> Fonte única sobre **como o projeto é testado**: pirâmide, thresholds, organização de fixtures, bibliotecas e quando cada camada é obrigatória.
>
> **Ownership:** Tester (curadoria) · **Consultado por:** Builder, DevOps, Security · **Tipo:** Semi-estático

---

## 1. Princípios

- **Testes são código de produção.** Mesmas regras de review, mesmo padrão de qualidade.
- **Cobertura é piso, não teto.** Atingir threshold não significa "pronto" — significa "passou no mínimo".
- **Teste o comportamento, não a implementação.** Refatorar não pode quebrar testes se o comportamento externo não mudou.
- **Teste flake é bug.** Teste intermitente é tratado como erro relevante e vai para `/docs/LESSONS.md`.
- **Fast first, thorough second.** Unit roda no pre-commit; e2e roda no CI e antes do `/deploy`.

---

## 2. Pirâmide de Testes

```
         ╱─────────────╲
        ╱    E2E        ╲    ~10%  — fluxos críticos de negócio
       ╱─────────────────╲
      ╱   Integration     ╲  ~20%  — API ↔ DB ↔ serviços externos (com mocks)
     ╱─────────────────────╲
    ╱       Unit            ╲ ~70%  — funções puras, hooks, componentes isolados
   ╱─────────────────────────╲
```

**Regra prática por camada:**

| Camada | O que testa | Velocidade alvo | Obrigatório quando |
|---|---|---|---|
| Unit | Função pura, hook, componente sem backend | < 10ms por teste | Sempre — toda função com lógica não trivial |
| Integration | Endpoint + validação + DB em memória; integrações com mock | < 500ms por teste | Sempre que o endpoint faz mais que CRUD simples |
| E2E | Fluxo real no browser do início ao fim | < 30s por fluxo | Fluxos no caminho crítico do MVP (login, checkout, etc.) |

Se um teste unitário está lento, provavelmente é integração disfarçada — mova para o nível certo.

---

## 3. Bibliotecas e Tooling

<!-- Ajuste aos padrões do projeto. Exemplo abaixo para stack Next.js + TypeScript. -->

| Camada | Biblioteca | Notas |
|---|---|---|
| Unit / Integration | Vitest ou Jest | Preferir Vitest em projetos novos (ESM nativo, mais rápido). |
| Componente React | Testing Library (`@testing-library/react`) | Teste por role/label, nunca por classe CSS. |
| Mock de HTTP | `msw` (Mock Service Worker) | Mesmo mock roda em unit, integration e Storybook. |
| E2E | Playwright | Um browser (Chromium) é o mínimo; Firefox + WebKit em fluxos críticos. |
| Contract / API | `zod` schemas compartilhados + parse em testes | O mesmo schema que valida em runtime valida em teste. |
| Coverage | `v8` coverage (Vitest built-in) ou `c8` | Relatório LCOV no CI (`coverage/`). |
| Acessibilidade | `@axe-core/playwright` | Roda em E2E de fluxos críticos. |

---

## 4. Thresholds

<!-- Threshold absoluto é definido no CLAUDE.md §3. Este bloco detalha por escopo. -->

| Escopo | Cobertura mínima | Observação |
|---|---|---|
| Projeto inteiro | 80% | Bloqueia merge via CI. |
| Módulos em `/lib/` (lógica de negócio pura) | 90% | Lógica pura não tem desculpa. |
| Módulos em `/api/` (endpoints públicos) | 85% | Inclui caminhos de erro 4xx/5xx. |
| Módulos em `/components/` | 70% | Foco em comportamento, não em presença de classe. |
| Arquivos tipo `*.types.ts` / `*.config.ts` | Isentos | Declarações apenas. |

**Regras de qualidade além do número:**

- **Mutation testing** (opcional, `stryker`) em módulos críticos de auth e pagamento — score alvo ≥ 70%.
- **Assertions significativas.** Um teste sem `expect` passa — rejeitar em review.
- **Caminhos de erro obrigatórios.** Todo endpoint testa ao menos: happy path, 400 (validação), 401 (auth), 404 (não encontrado) e 500 (erro interno simulado).

---

## 5. Organização de arquivos e fixtures

<!-- Adapte à estrutura de pastas do projeto (ver CLAUDE.md §6). -->

```
/__tests__/
├─ unit/
│   ├─ lib/
│   │   ├─ format.test.ts
│   │   └─ auth.test.ts
│   └─ components/
│       └─ Button.test.tsx
├─ integration/
│   └─ api/
│       ├─ auth.test.ts
│       └─ billing.test.ts
├─ fixtures/
│   ├─ users.ts              ← factories com dados sintéticos (nunca PII real)
│   ├─ organizations.ts
│   └─ stripe-events.ts
├─ mocks/
│   ├─ handlers.ts           ← msw handlers reutilizáveis
│   └─ server.ts
└─ helpers/
    ├─ render.tsx            ← wrapper com providers
    └─ dbReset.ts            ← reset de DB entre testes de integration

/e2e/
├─ flows/
│   ├─ login.spec.ts
│   ├─ checkout.spec.ts
│   └─ a11y.spec.ts
├─ fixtures/
│   └─ seedUser.ts
└─ playwright.config.ts
```

### Regras de fixtures

- **Nunca** use dados reais de usuários, nem em testes. Sempre factories com dados sintéticos.
- **Fixtures são tipadas** e recebem `Partial<T>` para overrides específicos por teste: `makeUser({ email: 'x@y.com' })`.
- **Fixtures não tocam em serviços externos.** Use `msw` ou test doubles.
- **Reset isolado por teste.** Nunca compartilhe estado global entre testes — fonte #1 de flakiness.

### Naming de testes

- Arquivo: `<nome-do-arquivo-sob-teste>.test.ts(x)` para unit/integration; `<fluxo>.spec.ts` para E2E.
- Descrição: `describe('<módulo>', () => { it('<comportamento esperado em 1 frase>', ...) })` — sempre em inglês ou PT, escolher um e manter.
- Nunca `it('should ...')` — redundante. Prefira `it('returns 401 when token is missing')`.

---

## 6. CI — quando cada camada roda

<!-- Alinhado ao /.github/workflows/ci.yml -->

| Evento | Unit | Integration | E2E | Coverage |
|---|---|---|---|---|
| Pre-commit (lint-staged) | Arquivos alterados | — | — | — |
| PR aberto | Tudo | Tudo | Fluxos críticos | Calculado, não bloqueante |
| Merge em `main` | Tudo | Tudo | Tudo | Bloqueante (< threshold falha) |
| Pré-`/deploy` para staging | Tudo | Tudo | Tudo | Bloqueante + a11y |
| Pré-`/deploy` para produção | Tudo | Tudo | Smoke + Tudo do staging passou | Bloqueante |

Tester tem **poder de veto no `/deploy`** — se testes ou thresholds caírem, o deploy não acontece. Ver [AGENTS.md — Agent_Tester](../AGENTS.md).

---

## 7. Testes e Acessibilidade

- Fluxos críticos do E2E rodam `@axe-core/playwright` e falham se houver violação `serious` ou `critical`.
- Componentes de input + formulário têm teste unitário verificando associação `<label>`/`htmlFor`.
- Contraste e foco visível são validados pelo `/audit` com Lighthouse ≥ 95 — ver [DESIGN.md §8](../design/DESIGN.md#8-acessibilidade).

---

## 8. Quando o teste falha

- **Em desenvolvimento local:** Builder invoca `/debug` e aplica a skill `systematic-debugging`.
- **No CI:** não re-executar cegamente. Re-execução sem investigação é tratada como flakiness e registrada em `/docs/LESSONS.md`.
- **Quebra em produção após deploy:** Security invoca `/security-scan` se houver suspeita de exposição; Builder abre hotfix branch com teste que **reproduz o bug** antes de qualquer correção.

---

## 9. Anti-padrões proibidos

- `expect(true).toBe(true)` ou equivalente — rejeitar em review.
- Teste que só chama o SUT sem assertion — rejeitar em review.
- Uso de `Math.random`, `Date.now()`, `uuid` reais dentro de asserções — injetar dependência ou fixar seed.
- `sleep(N)` para esperar estado — usar `waitFor` / `expect.poll`.
- Testes que dependem da ordem de execução.
- `skip`/`only` commitado na main — CI falha automaticamente.

---

## Documentos Relacionados

| Precisa saber... | Leia |
|---|---|
| Regras gerais de código e threshold | [/CLAUDE.md §3](../../CLAUDE.md#3-convenções-de-código) |
| Workflow /audit (onde testes são validados) | [/docs/WORKFLOWS.md](../WORKFLOWS.md) |
| Skill TDD | Skill `test-driven-development` — disponível globalmente via Skill tool |
| Skill Verification | Skill `verification-before-completion` — disponível globalmente via Skill tool |
| Acessibilidade | [/docs/design/DESIGN.md §8](../design/DESIGN.md#8-acessibilidade) |
| Lições aprendidas com flakiness / bugs | [/docs/LESSONS.md](../LESSONS.md) |

> Índice canônico completo: [CLAUDE.md §7](../../CLAUDE.md#7-documentos-do-projeto).
