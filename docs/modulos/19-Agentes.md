# Agentes de IA — Mastra Framework

## Rotas e Páginas

| Agente | Rota | Página |
|---|---|---|
| Executor de Dados | `/agentes/executor` | `src/pages/Agentes/ExecutorDados.jsx` |
| Analista de Negócio | `/agentes/analista-negocio` | `src/pages/Agentes/AnalistaNegocio.jsx` |
| Analista Contratual | `/agentes/analista-contratual` | `src/pages/Agentes/AnalistaContratual.jsx` |
| Config. Agentes | `/configuracoes/agente-config` | `src/pages/Configuracoes/AgenteConfig.jsx` |

## Tecnologia

- **Framework:** [Mastra AI](https://mastra.ai) (Node.js + TypeScript)
- **Projeto paralelo:** `Agents Mastra/` na raiz do repositório
- **Comunicação:** Server-Sent Events (SSE) via HTTP na porta 4111
- **Para rodar:** `cd "Agents Mastra" && npm run dev` (Terminal separado)

## Os 3 Agentes

### Executor de Dados

Consulta o banco Supabase em linguagem natural. Traduz pedidos do usuário em queries SQL, executa e retorna resultados.

**Formato de resposta — 3 blocos:**
1. **Consulta:** o que foi buscado e como
2. **Resultados:** tabela ou lista dos dados encontrados
3. **Resumo:** interpretação sintética dos dados

**Regra:** apenas lê dados — não cria, atualiza nem deleta.

### Analista de Negócio

Realiza análises integradas cruzando dados reais de múltiplos módulos.

**Formato de resposta — 4 blocos:**
1. **Contexto:** o que foi analisado
2. **Integridade de Dados:** checagem de consistência (seção inviolável — sempre presente)
3. **Análise:** insights cruzados entre módulos
4. **Recomendações:** ações sugeridas baseadas nos dados

**Regra rígida:** proibido inventar dados ou fazer suposições. Toda afirmação deve ter evidência nos dados do sistema.

### Analista Contratual

Análise jurídico-contratual com rigor, focada em pleitos, mudanças, riscos e impactos contratuais.

**Workflow inter-agente:**
```
Interpretar pedido
  → Identificar módulos relevantes
  → Solicitar dados ao Executor de Dados
  → Solicitar análise ao Analista de Negócio
  → Gerar análise final fundamentada
```

**Regra rígida:** proibido inventar cláusulas, valores ou prazos. Usar apenas evidências do sistema.

## Config. Agentes (`AgenteConfig`)

Configuração de perfis e parâmetros dos agentes: temperatura, instruções de sistema, endpoints Mastra, conexão Supabase.

## UX / Design

- Interface de chat com streaming de tokens via SSE
- Dual theme claro/escuro
- Histórico de mensagens por sessão (não persistido entre sessões)

## Documentos Relacionados

- [ARCHITECTURE.md — Agentes Mastra](../architecture/ARCHITECTURE.md)
- [DATABASE.md](../architecture/DATABASE.md) | [00-Indice.md](./00-Indice.md)
