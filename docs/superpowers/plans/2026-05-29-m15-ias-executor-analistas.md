# M15 — IAs (Executor e Analistas) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Habilitar renderização de tabelas Markdown no chat dos agentes e refinar os prompts do Executor, Analista de Negócio e Analista Contratual com regras de integridade de dados, fluxo inter-agente explícito e postura comercial.

**Architecture:** Mudanças cirúrgicas em 5 arquivos — instalação de `remark-gfm` no frontend e adição/atualização de seções nos prompts TypeScript dos 3 agentes Mastra. Nenhum backend novo, nenhum schema, nenhuma integração técnica entre agentes.

**Tech Stack:** React 18 + Vite, react-markdown 9.x, remark-gfm, Mastra Framework (TypeScript), OpenAI gpt-4o-mini

---

## Mapa de Arquivos

| Arquivo | Tipo | Mudança |
|---------|------|---------|
| `package.json` | Modificar | Adicionar `remark-gfm` em dependencies |
| `src/components/agentes/AgenteChat.jsx` | Modificar | Import + remarkPlugins |
| `agents-mastra/src/mastra/agents/supabase-analyst-agent.ts` | Modificar | Bloco Integridade + exemplo tabela |
| `agents-mastra/src/mastra/agents/business-analyst-agent.ts` | Modificar | Seção Fluxo atualizada |
| `agents-mastra/src/mastra/agents/contractual-analyst-agent.ts` | Modificar | Postura Comercial + Fluxo atualizado |

---

## Task 1: Instalar remark-gfm e integrar no AgenteChat

**Files:**
- Modify: `package.json`
- Modify: `src/components/agentes/AgenteChat.jsx`

- [ ] **Step 1: Instalar o pacote**

```bash
npm install remark-gfm
```

Saída esperada: linha adicionada em `package.json` e `package-lock.json` atualizado.

- [ ] **Step 2: Verificar versão instalada**

```bash
npm ls remark-gfm
```

Saída esperada: `remark-gfm@x.x.x` (qualquer versão >= 4.0.0 — compatível com react-markdown 9.x).

- [ ] **Step 3: Adicionar import em AgenteChat.jsx**

Em `src/components/agentes/AgenteChat.jsx`, adicionar o import logo abaixo do import de `ReactMarkdown` (linha 4 atual):

```jsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
```

- [ ] **Step 4: Adicionar remarkPlugins ao ReactMarkdown**

Localizar o trecho na linha ~198:

```jsx
<div className="prose prose-sm max-w-none dark:prose-invert">
  <ReactMarkdown>{msg.content}</ReactMarkdown>
</div>
```

Substituir por:

```jsx
<div className="prose prose-sm max-w-none dark:prose-invert">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
</div>
```

- [ ] **Step 5: Verificar build sem erros**

```bash
npm run build
```

Saída esperada: `built in X.Xs` sem warnings de import ou erros.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/components/agentes/AgenteChat.jsx
git commit -m "feat(agentes): habilitar remark-gfm para renderização de tabelas GFM no chat"
```

---

## Task 2: Atualizar prompt do Executor de Dados

**Files:**
- Modify: `agents-mastra/src/mastra/agents/supabase-analyst-agent.ts`

- [ ] **Step 1: Adicionar bloco Integridade de Dados**

Abrir `agents-mastra/src/mastra/agents/supabase-analyst-agent.ts`.

Localizar a seção `## Restrições` (linha ~28 atual):

```typescript
## Restrições

- Nunca execute DELETE, DROP ou TRUNCATE sem confirmação explícita.
- Nunca retorne dados de outros projetos (sempre filtre por projeto_id).
- Responda sempre em português do Brasil.
- Se a query falhar, descreva o erro claramente e sugira como reformular.`,
```

Inserir o bloco `## Integridade de Dados` **após** `## Restrições`, antes do fechamento da template string:

```typescript
## Restrições

- Nunca execute DELETE, DROP ou TRUNCATE sem confirmação explícita.
- Nunca retorne dados de outros projetos (sempre filtre por projeto_id).
- Responda sempre em português do Brasil.
- Se a query falhar, descreva o erro claramente e sugira como reformular.

## Integridade de Dados

- NUNCA afirme, assuma ou extrapole dados que não estejam no retorno da query.
- Se a query retornar vazio, escreva exatamente: "Nenhum dado encontrado para esta consulta."
- NUNCA use "provavelmente", "deve ser", "tipicamente" para compensar dados ausentes.
- NUNCA invente valores, datas, nomes ou métricas.
- Se a query falhar, descreva o erro e sugira como reformular — não tente adivinhar o resultado.`,
```

- [ ] **Step 2: Atualizar o formato de Resultados com exemplo de tabela**

Localizar a seção `## Formato de resposta obrigatório` — parte dos Resultados:

```typescript
**Resultados:**
[Tabela markdown ou lista com os dados retornados. Se vazio, escreva: "Nenhum registro encontrado."]
```

Substituir por:

```typescript
**Resultados:**
| Campo | Valor |
|-------|-------|
| ...   | ...   |

(Use tabela Markdown quando os dados forem tabulares. Use lista com bullets quando forem itens não tabulares. Se vazio, escreva: "Nenhum dado encontrado para esta consulta.")
```

- [ ] **Step 3: Verificar build do Mastra**

```bash
npm run build:mastra
```

Saída esperada: compilação TypeScript sem erros.

- [ ] **Step 4: Commit**

```bash
git add agents-mastra/src/mastra/agents/supabase-analyst-agent.ts
git commit -m "feat(agentes): reforçar integridade de dados e formato de tabela no Executor"
```

---

## Task 3: Atualizar prompt do Analista de Negócio

**Files:**
- Modify: `agents-mastra/src/mastra/agents/business-analyst-agent.ts`

- [ ] **Step 1: Atualizar a seção Fluxo obrigatório**

Abrir `agents-mastra/src/mastra/agents/business-analyst-agent.ts`.

Localizar a seção `## Fluxo obrigatório` (linha ~48 atual):

```typescript
## Fluxo obrigatório

1. Ao receber uma solicitação, avalie o que já sabe: tipo de análise, período e filtros.
2. Se faltar algo essencial, faça perguntas curtas — **máximo 3 no total durante toda a conversa**.
   - Use seu conhecimento do domínio para fazer perguntas específicas e inteligentes.
   - Nunca pergunte sobre unidades de medida de métricas que você já conhece (avanço é %, HH é horas, etc.).
   - Nunca pergunte datas que você pode calcular a partir de referências relativas.
3. Com os parâmetros claros, chame query-database com uma pergunta precisa incluindo project_id e período em datas absolutas.
4. Sintetize os dados em análise objetiva — máximo 400 palavras.
```

Substituir por:

```typescript
## Fluxo obrigatório

1. Ao receber uma solicitação, avalie o que já sabe: tipo de análise, período e filtros.
2. Se faltar algo essencial, faça perguntas curtas — **máximo 3 no total durante toda a conversa**.
   - Use seu conhecimento do domínio para fazer perguntas específicas e inteligentes.
   - Nunca pergunte sobre unidades de medida de métricas que você já conhece (avanço é %, HH é horas, etc.).
   - Nunca pergunte datas que você pode calcular a partir de referências relativas.
3. Com os parâmetros claros, chame query-database com uma pergunta precisa incluindo project_id e período em datas absolutas.
   Você atua como Analista — a camada de execução SQL é responsabilidade da ferramenta query-database (Executor de Dados).
   Nunca execute SQL diretamente; delegue sempre ao Executor via query-database.
4. Sintetize os dados em análise objetiva — máximo 400 palavras.
5. Se o Executor retornar vazio ou erro, declare explicitamente: "Não há dados suficientes para responder esta pergunta." — não prossiga com análise.
```

- [ ] **Step 2: Verificar build do Mastra**

```bash
npm run build:mastra
```

Saída esperada: compilação TypeScript sem erros.

- [ ] **Step 3: Commit**

```bash
git add agents-mastra/src/mastra/agents/business-analyst-agent.ts
git commit -m "feat(agentes): explicitar fluxo Executor → Analista de Negócio no prompt"
```

---

## Task 4: Atualizar prompt do Analista Contratual

**Files:**
- Modify: `agents-mastra/src/mastra/agents/contractual-analyst-agent.ts`

- [ ] **Step 1: Adicionar seção Postura Comercial**

Abrir `agents-mastra/src/mastra/agents/contractual-analyst-agent.ts`.

Localizar a seção `## Regras` (linha ~54 atual):

```typescript
## Regras

- Nunca invente dados — use exclusivamente o que o executor retornar.
- Nunca afirme valores, datas ou fatos contratuais que não tenham sido retornados pelo executor. Em caso de dúvida, deixe o campo em branco com a nota "[dado pendente de verificação]".
- Use linguagem formal, técnica e objetiva.
- Responda sempre em português do Brasil.
- Se os dados do pleito forem insuficientes para elaborar o documento, liste claramente o que falta.`,
```

Adicionar a seção `## Postura Comercial` **após** `## Regras`:

```typescript
## Regras

- Nunca invente dados — use exclusivamente o que o executor retornar.
- Nunca afirme valores, datas ou fatos contratuais que não tenham sido retornados pelo executor. Em caso de dúvida, deixe o campo em branco com a nota "[dado pendente de verificação]".
- Use linguagem formal, técnica e objetiva.
- Responda sempre em português do Brasil.
- Se os dados do pleito forem insuficientes para elaborar o documento, liste claramente o que falta.

## Postura Comercial

Você representa os interesses do contratado. Sua postura é:
- Assertivo na defesa de direitos contratuais, prazos e valores devidos.
- Identificar proativamente riscos de exposição comercial (ex: decadência de prazo para pleito, ausência de notificação formal, silêncio que pode ser interpretado como concordância).
- Sempre indicar no documento se há prazo contratual ou legal relevante que o cliente deve observar.
- Linguagem formal-jurídica, mas clara — evite jargão excessivo que obscureça a posição comercial.
- Em cartas de notificação, deixar explícita a reserva de direitos ao final.`,
```

- [ ] **Step 2: Atualizar a seção Fluxo obrigatório**

Localizar a seção `## Fluxo obrigatório` (linha ~22 atual):

```typescript
## Fluxo obrigatório

1. Identifique qual pleito (caso) ou documento o usuário quer responder.
2. Se necessário, faça no máximo 3 perguntas para determinar:
   - Qual pleito ou ata está sendo respondido (título ou número)
   - Tipo de documento a elaborar: carta de notificação, email ou resposta a ata
   - Destinatário e tom desejado (formal, técnico, conciliatório)
3. Busque os dados completos do registro via query-database.
4. Elabore o documento com base exclusivamente nos dados encontrados.
```

Substituir por:

```typescript
## Fluxo obrigatório

1. Identifique qual pleito (caso) ou documento o usuário quer responder.
2. Se necessário, faça no máximo 3 perguntas para determinar:
   - Qual pleito ou ata está sendo respondido (título ou número)
   - Tipo de documento a elaborar: carta de notificação, email ou resposta a ata
   - Destinatário e tom desejado (formal, técnico, conciliatório / assertivo)
3. Busque os dados completos do registro via query-database (Executor de Dados).
   Nunca elabore o documento sem antes consultar o Executor — mesmo que o usuário já tenha fornecido alguns dados.
4. Com os dados em mãos, elabore o documento com base exclusivamente no que foi retornado.
5. Ao final do documento, adicione a seção **"Análise Comercial"**: riscos identificados, prazos críticos e recomendação de ação imediata (se houver).
```

- [ ] **Step 3: Verificar build do Mastra**

```bash
npm run build:mastra
```

Saída esperada: compilação TypeScript sem erros.

- [ ] **Step 4: Commit**

```bash
git add agents-mastra/src/mastra/agents/contractual-analyst-agent.ts
git commit -m "feat(agentes): postura comercial e fluxo Executor → Analista Contratual"
```

---

## Task 5: Verificação Final

- [ ] **Step 1: Build completo**

```bash
npm run build && npm run build:mastra
```

Saída esperada: ambos compilam sem erros.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Saída esperada: sem erros. Warnings de `react-hooks` em arquivos não alterados podem ser ignorados se já existiam antes.

- [ ] **Step 3: Verificar que remark-gfm está em dependencies (não devDependencies)**

```bash
cat package.json | grep -A2 '"remark-gfm'
```

Saída esperada: `"remark-gfm"` dentro do bloco `"dependencies"`, não `"devDependencies"`.

- [ ] **Step 4: Confirmar que não há rehype-raw importado**

```bash
grep -r "rehype-raw" src/
```

Saída esperada: nenhum resultado (não deve ter sido adicionado).
