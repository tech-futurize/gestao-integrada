# LESSONS.md — Lições Aprendidas

> Arquivo VIVO de lições aprendidas com **erros relevantes** cometidos durante o projeto.
> O objetivo é dobrar o valor de cada erro: primeiro ele é corrigido, depois ele educa todos os próximos projetos.
>
> **Ownership:** Architect (curadoria) · **Autores:** qualquer agente · **Tipo:** VIVO

---

## 1. Quando registrar uma lição

Registre **apenas erros relevantes** — aqueles que, em retrospecto, você gostaria que alguém tivesse documentado antes. Um erro é relevante quando pelo menos um destes for verdade:

- Levou mais de 30 minutos para diagnosticar.
- Causou retrabalho em código já aprovado (review/QA).
- Derivou de um pressuposto que se mostrou errado.
- Resultou em bug em staging ou produção.
- Foi detectado pelo `/security-scan`, `/audit`, `/review` ou `/debug`.
- Seria evitável se o projeto tivesse uma regra explícita em CLAUDE.md / AGENTS.md / WORKFLOWS.md.

**Não registre:**

- Typos e lapsos triviais.
- Erros de sintaxe pegos pelo linter na primeira rodada.
- Decisões que foram conscientemente escolhidas e depois revisitadas (isso é ADR).
- Qualquer coisa que contenha PII, segredo ou dado sensível.

---

## 2. Como registrar

1. Abra este arquivo e adicione uma entrada ao final da seção **5. Registro de lições**, usando o formato da seção **4. Template de entrada**.
2. Numere sequencialmente (`L001`, `L002`, ...). Nunca renumere entradas antigas.
3. Se a lição gerar uma regra nova, abra um PR também em CLAUDE.md (ou no doc apropriado) e cite o ID da lição no commit.
4. Se a lição apontar para uma skill (`/docs/skills/`) que deveria ter sido invocada e não foi, atualize o mapa em [/README.md — Guia das pastas de `/docs/`](../README.md#guia-das-pastas-de-docs).

Tempo esperado por lição: **5 minutos**. Se está levando mais, o formato está errado — seja mais seco.

---

## 3. Como usar este arquivo (consulta)

- **No início de todo milestone:** o Architect lê LESSONS.md durante `/milestone-start` e cita explicitamente as lições que se aplicam ao escopo. Não basta existir — precisa ser consultado.
- **No `/review`:** quem revisa compara o diff contra lições de categoria equivalente (ex: mudança em auth → lições de categoria `Auth`).
- **No `/security-scan`:** lições de categoria `Security` entram no checklist do scan.
- **Em novo projeto:** copie este arquivo para o novo repo e adapte. Lições genéricas (ex: "não use `any` em TypeScript") ficam; lições específicas (ex: "webhook do Stripe precisa de raw body") só ficam se o stack for o mesmo.

---

## 4. Template de entrada

Copie o bloco abaixo para cada nova lição.

```markdown
### L00X — <!-- Título curto (≤ 80 caracteres, imperativo: "Evitar X em Y") -->

- **Data:** YYYY-MM-DD
- **Agente:** Architect | Designer | Builder | Tester | DevOps | Security
- **Milestone:** <!-- Número e nome do milestone -->
- **Categoria:** Arquitetura | Auth | Banco | Integrações | Performance | Security | UI/UX | DX | CI/CD | Testes | Outro
- **Gravidade:** Baixa | Média | Alta | Crítica
- **Contexto em 1 frase:** <!-- O que você estava tentando fazer? -->
- **Erro observado:** <!-- Sintoma. Sem stack trace longo. -->
- **Causa raiz:** <!-- Por que aconteceu, não o que aconteceu. -->
- **Correção aplicada:** <!-- Como foi resolvido desta vez. -->
- **Como evitar em projetos futuros:** <!-- Regra acionável. Se virar linha no CLAUDE.md ou AGENTS.md, cite aqui. -->
- **Referências:** <!-- Links para ADR, PR, issue, research — sem PII -->
```

---

## 5. Registro de lições

> Adicione novas entradas ao final. Não renumere nem apague entradas antigas.
> Se uma lição ficar obsoleta, marque com `**Status:** Obsoleta — substituída por L0YZ` sem remover o texto.

<!-- Primeiras entradas virão com o projeto. Exemplos ilustrativos abaixo — apague-os no primeiro commit real. -->

### L001 — Exemplo: não usar `any` como escape de TypeScript em endpoints públicos

- **Data:** 2026-01-15
- **Agente:** Builder
- **Milestone:** 2 — API de auth
- **Categoria:** DX
- **Gravidade:** Média
- **Contexto em 1 frase:** endpoint `/api/auth/callback` recebia payload de provedor OAuth.
- **Erro observado:** 4 horas perdidas depurando crash em runtime porque o campo `email` vinha em `user.profile.email`, não em `user.email` como o `any` sugeria.
- **Causa raiz:** `any` fez TypeScript "concordar" com a forma errada; o contrato do provedor era diferente do que se presumia.
- **Correção aplicada:** schema Zod espelhando o contrato real do provedor; type inferido do schema.
- **Como evitar em projetos futuros:** Regra já existente em CLAUDE.md §3 TypeScript ("Nunca use `any`"). Reforço: endpoints externos sempre começam por um schema Zod antes da primeira linha de lógica.
- **Referências:** PR #42, ADR 0003.

### L002 — Exemplo: webhook do Stripe falha silenciosamente quando parse de JSON é aplicado antes da verificação de assinatura

- **Data:** 2026-02-03
- **Agente:** Security
- **Milestone:** 4 — Pagamentos
- **Categoria:** Integrações
- **Gravidade:** Alta
- **Contexto em 1 frase:** implementação do webhook `POST /api/webhooks/stripe`.
- **Erro observado:** assinaturas válidas sendo rejeitadas; eventos de `checkout.session.completed` ignorados.
- **Causa raiz:** Next.js aplicou `bodyParser` antes do handler, alterando bytes do payload e invalidando a assinatura HMAC.
- **Correção aplicada:** desabilitar bodyParser na route (`export const config = { api: { bodyParser: false } }`) e consumir o raw stream.
- **Como evitar em projetos futuros:** Adicionar regra em INTEGRATIONS.md: "Webhooks que verificam HMAC precisam de raw body — desabilitar bodyParser na route e documentar no bloco do serviço".
- **Referências:** [Stripe docs — Signing secrets](https://docs.stripe.com/webhooks/signatures).

---

## 6. Como curar o arquivo

A cada `/milestone-close`, o Architect:

1. Lê as lições adicionadas no milestone que acabou de fechar.
2. Promove lições recorrentes a **regra explícita** em CLAUDE.md / AGENTS.md / WORKFLOWS.md.
3. Marca como `Obsoleta` (sem apagar) lições cobertas por uma regra nova.
4. Se o arquivo passar de ~40 entradas ativas, cria `LESSONS-YYYY.md` arquivando o ano anterior.

---

## Documentos Relacionados

| Precisa saber... | Leia |
|---|---|
| Regras do projeto | [/CLAUDE.md](../CLAUDE.md) |
| Agentes (quem deve registrar) | [./AGENTS.md](./AGENTS.md) |
| Workflows (quando registrar) | [./WORKFLOWS.md](./WORKFLOWS.md) |
| Decisões irreversíveis | [./adrs/](./adrs/) |

> Índice canônico completo: [CLAUDE.md §7](../CLAUDE.md#7-documentos-do-projeto).
