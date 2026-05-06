# CONTRIBUTING.md — Como contribuir

> Este guia é para **contribuidores humanos** do projeto.
> Para agentes de IA, as regras estão em [CLAUDE.md](./CLAUDE.md) e [/docs/AGENTS.md](./docs/AGENTS.md).
>
> **Tempo esperado para ler este doc:** 10 minutos. Leia antes do primeiro PR.

---

## 1. Antes de começar

1. Leia [PROJECT.md](./PROJECT.md) — o que o projeto é e não é.
2. Leia [CLAUDE.md](./CLAUDE.md) — padrões de código e segurança que valem para **humanos e agentes**.
3. Leia [PLAN.md](./PLAN.md) — o que está sendo construído agora.
4. Configure o ambiente local seguindo [README.md](./README.md) (clone, `npm install`, `.env.local`, `npm run dev`).

Se algo no setup não funcionar, abra uma issue com a label `setup` antes de seguir.

---

## 2. Fluxo de trabalho

O projeto segue **trunk-based development** com branches curtas (horas a poucos dias, nunca semanas).

```
main  ←  só recebe merges via PR aprovado + CI verde
 │
 ├── feat/...     ← feature nova
 ├── fix/...      ← bug fix
 ├── chore/...    ← manutenção (deps, configs)
 ├── docs/...     ← mudança só em documentação
 ├── refactor/... ← refactor sem mudança de comportamento
 └── test/...     ← adição ou correção de testes
```

### Passo a passo

1. **Pegue uma task.** Use [PLAN.md](./PLAN.md) — só pode haver uma task em `in_progress` por pessoa.
2. **Crie branch a partir da `main` atualizada:**
   ```bash
   git checkout main && git pull --rebase
   git checkout -b feat/short-descriptive-slug
   ```
3. **Commits pequenos e frequentes** — um commit = uma ideia coerente.
4. **Abra PR o quanto antes**, mesmo em rascunho (`Draft`), para feedback precoce.
5. **CI precisa passar** (lint). PR com CI vermelho não é revisado.
6. **Após aprovação**, faça squash-merge pela interface do GitHub.
7. **Delete a branch** após merge.

---

## 3. Branch naming

| Prefixo | Uso | Exemplo |
|---|---|---|
| `feat/` | Nova funcionalidade | `feat/qualidade-tabs` |
| `fix/` | Correção de bug | `fix/filtro-projeto-id` |
| `chore/` | Manutenção | `chore/remover-base44` |
| `docs/` | Só documentação | `docs/atualizar-database-md` |
| `refactor/` | Refactor sem mudança de comportamento | `refactor/extrair-hook-projeto` |

---

## 4. Commit messages

Seguimos [**Conventional Commits**](https://www.conventionalcommits.org/).

```
<tipo>(<escopo opcional>): <descrição curta em imperativo, ≤ 72 caracteres>

<corpo opcional — POR QUÊ, não o quê>

<footer opcional — ex: "Closes #42">
```

### Tipos válidos

`feat` · `fix` · `docs` · `refactor` · `test` · `chore` · `perf` · `ci` · `style` · `revert`

### Exemplos

```
feat(qualidade): criar página com tabs NNCs, Planos de Ação e Lições Aprendidas
```

```
fix(engenharia): remover mock data e exibir dados reais do Supabase
```

```
docs: atualizar DATABASE.md com tabela licoes_aprendidas
```

**Regras:** Imperativo ("adicionar", não "adicionado"). Sem ponto final. Português.

---

## 5. Pull Requests

### Checklist antes de abrir

- [ ] `npm run lint` passa
- [ ] `npm run build` passa sem erros
- [ ] Documentação atualizada (se schema mudou: `DATABASE.md`; se integração mudou: `INTEGRATIONS.md`)
- [ ] Sem `console.log` não intencionais
- [ ] Sem secrets no diff (`.env.local`, chaves, tokens)
- [ ] Se virou lição: registrei em `/docs/LESSONS.md`

### Tamanho de PR

Alvo: **≤ 400 linhas alteradas** (ignorando lockfiles).

---

## 6. Code review — o que procurar

1. **Faz o que diz que faz?** O PR resolve o problema declarado?
2. **Segue o padrão de dados?** Usa `useQuery`/`useMutation` com `selectedProjectId` como filtro?
3. **É seguro?** Sem secrets? RLS cobre o acesso?
4. **É legível?** Um colega entende em 5 minutos?
5. **É mínimo?** Sem refactor oportunista fora do escopo.

---

## 7. Segurança

- **Nunca** comite `.env.local`, chaves, tokens ou PII de teste.
- `VITE_*` é exposto ao browser — nunca colocar secrets com este prefixo.
- Vulnerabilidades em produção: não abra issue pública. Use o Security Advisory privado do GitHub ou contate security@futurizenow.com.br.

Ver [CLAUDE.md §4](./CLAUDE.md#4-padrões-de-segurança) e findings em [/docs/security/](./docs/security/).

---

## Documentos Relacionados

| Precisa saber... | Leia |
|---|---|
| O que o projeto é | [PROJECT.md](./PROJECT.md) |
| Padrões de código e segurança | [CLAUDE.md](./CLAUDE.md) |
| O que fazer agora | [PLAN.md](./PLAN.md) |
| Lições aprendidas | [/docs/LESSONS.md](./docs/LESSONS.md) |
| Agentes e workflows | [/docs/AGENTS.md](./docs/AGENTS.md), [/docs/WORKFLOWS.md](./docs/WORKFLOWS.md) |

> Índice canônico completo: [CLAUDE.md §7](./CLAUDE.md#7-documentos-do-projeto).
