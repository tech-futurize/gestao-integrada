# Design: M15 — IAs (Executor e Analistas)

**Data:** 2026-05-29  
**Status:** Aprovado  
**Escopo:** Integração de remark-gfm no AgenteChat + refinamentos cirúrgicos nos prompts dos 3 agentes Mastra

---

## Contexto

O sistema possui 3 agentes de IA integrados via Mastra Framework:
- **Executor de Dados** (`supabase-analyst-agent`) — consultas SQL diretas ao Supabase
- **Analista de Negócio** (`business-analyst-agent`) — análises comparativas e históricas
- **Analista Contratual** (`contractual-analyst-agent`) — documentos formais contratuais

O frontend compartilha um único componente de chat (`AgenteChat.jsx`) com `ReactMarkdown` já instalado, mas sem `remark-gfm`, o que impede a renderização de tabelas GFM retornadas pelos agentes.

Os prompts já têm estrutura funcional. Esta milestone aplica refinamentos específicos sem reescrever o que já funciona.

---

## 1. AgenteChat.jsx — remark-gfm

**Arquivo:** `src/components/agentes/AgenteChat.jsx`

**Mudanças:**
- Instalar `remark-gfm` no `package.json` raiz
- Importar `remarkGfm` de `remark-gfm`
- Passar `remarkPlugins={[remarkGfm]}` ao `<ReactMarkdown>` existente

**Decisão de segurança:** Sem `rehype-raw` — conteúdo vem de LLMs em Markdown puro, sem HTML inline legítimo. Adicionar rehype-raw abriria superfície de injeção desnecessária.

**Resultado:** Tabelas GFM, strikethrough, task lists e autolinks renderizados corretamente.

```jsx
// Antes
<ReactMarkdown>{msg.content}</ReactMarkdown>

// Depois
<ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
```

---

## 2. Executor — supabase-analyst-agent.ts

**Arquivo:** `agents-mastra/src/mastra/agents/supabase-analyst-agent.ts`

**Mudanças cirúrgicas:**

### Adicionar bloco `## Integridade de Dados` após as restrições atuais:

```
## Integridade de Dados

- NUNCA afirme, assuma ou extrapole dados que não estejam no retorno da query.
- Se a query retornar vazio, escreva exatamente: "Nenhum dado encontrado para esta consulta."
- NUNCA use "provavelmente", "deve ser", "tipicamente" para compensar dados ausentes.
- NUNCA invente valores, datas, nomes ou métricas.
- Se a query falhar, descreva o erro e sugira como reformular — não tente adivinhar o resultado.
```

### Atualizar formato de resposta para exemplo explícito de tabela Markdown:

```
**Resultados:**
| Campo | Valor |
|-------|-------|
| ...   | ...   |
(ou lista com bullets se não for tabular)
```

---

## 3. Analista de Negócio — business-analyst-agent.ts

**Arquivo:** `agents-mastra/src/mastra/agents/business-analyst-agent.ts`

**Mudança cirúrgica:** Atualizar `## Fluxo obrigatório` para documentar explicitamente a cadeia Executor → Analista:

```
## Fluxo obrigatório

1. Ao receber uma solicitação, avalie: tipo de análise, período e filtros necessários.
2. Se faltar algo essencial, faça perguntas curtas — máximo 3 no total durante toda a conversa.
3. Com os parâmetros claros, chame query-database com pergunta precisa incluindo
   project_id e período em datas absolutas. Você atua como Analista — a camada de
   execução SQL é responsabilidade da ferramenta query-database (Executor de Dados).
   Nunca execute SQL diretamente; delegue sempre ao Executor.
4. Sintetize os dados em análise objetiva — máximo 400 palavras.
5. Se o Executor retornar vazio ou erro, declare explicitamente e não prossiga com análise.
```

A estrutura de resposta (Situação / Dados Encontrados / Análise / Recomendação) permanece inalterada.

---

## 4. Analista Contratual — contractual-analyst-agent.ts

**Arquivo:** `agents-mastra/src/mastra/agents/contractual-analyst-agent.ts`

**Tom:** Formal-jurídico, assertivo na proteção dos interesses comerciais do contratado.

### Adicionar seção `## Postura Comercial` (após `## Regras`):

```
## Postura Comercial

Você representa os interesses do contratado. Sua postura é:
- Assertivo na defesa de direitos contratuais, prazos e valores devidos.
- Identificar proativamente riscos de exposição comercial (ex: decadência de prazo para pleito,
  ausência de notificação formal, silêncio que pode ser interpretado como concordância).
- Sempre indicar no documento se há prazo contratual ou legal relevante que o cliente deve observar.
- Linguagem formal-jurídica, mas clara — evite jargão excessivo que obscureça a posição comercial.
- Em cartas de notificação, deixar explícita a reserva de direitos ao final.
```

### Atualizar `## Fluxo obrigatório` para cadeia pedido → Executor → Analista → análise final:

```
## Fluxo obrigatório

1. Identifique qual pleito, ata ou documento o usuário quer responder.
2. Se necessário, faça no máximo 3 perguntas para determinar: pleito/ata, tipo de documento,
   destinatário e tom (formal / conciliatório / assertivo).
3. Busque os dados via query-database (Executor de Dados). Nunca elabore o documento
   sem antes consultar o Executor — mesmo que o usuário já tenha fornecido alguns dados.
4. Com os dados em mãos, elabore o documento com base exclusivamente no que foi retornado.
5. Ao final do documento, adicione nota de "Análise Comercial": riscos identificados,
   prazos críticos e recomendação de ação imediata (se houver).
```

As estruturas de documento (carta de notificação / resposta a ata) permanecem inalteradas.

---

## Arquivos Alterados

| Arquivo | Tipo de mudança |
|---------|----------------|
| `package.json` | Adicionar dependência `remark-gfm` |
| `src/components/agentes/AgenteChat.jsx` | Import + remarkPlugins |
| `agents-mastra/src/mastra/agents/supabase-analyst-agent.ts` | Bloco Integridade + exemplo tabela |
| `agents-mastra/src/mastra/agents/business-analyst-agent.ts` | Fluxo Executor → Analista |
| `agents-mastra/src/mastra/agents/contractual-analyst-agent.ts` | Postura Comercial + Fluxo atualizado |

---

## O que NÃO muda

- Estruturas de resposta dos 3 agentes (já aprovadas)
- Tools e integrações Mastra (`supabase-tools`, `query-executor-tool`)
- Layout e estilos do `AgenteChat.jsx`
- Nenhuma integração técnica inter-agente (fluxo documentado apenas nos prompts)
