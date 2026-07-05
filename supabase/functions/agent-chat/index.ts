import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import OpenAI from "npm:openai@4";

const BLOCKED_SQL =
  /\b(DELETE|DROP|TRUNCATE|ALTER|UPDATE|INSERT|CREATE|GRANT|REVOKE|VACUUM|REINDEX)\b/i;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_TOOL_DEFS: Record<string, any> = {
  "get-schema": {
    type: "function",
    function: {
      name: "get_schema",
      description: "Le a estrutura do banco (tabelas, colunas, tipos). Use antes de construir queries em tabelas desconhecidas.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  "execute-sql": {
    type: "function",
    function: {
      name: "execute_sql",
      description: "Executa uma query SQL SELECT no banco. Apenas leitura - DDL/DML sao bloqueados.",
      parameters: {
        type: "object",
        properties: { sql: { type: "string", description: "Query SQL SELECT completa" } },
        required: ["sql"],
      },
    },
  },
  "analyze-table": {
    type: "function",
    function: {
      name: "analyze_table",
      description: "Retorna contagem de linhas de uma tabela.",
      parameters: {
        type: "object",
        properties: { table: { type: "string", description: "Nome da tabela" } },
        required: ["table"],
      },
    },
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Autenticacao: exige o access token de um usuario real ────────────────
    // A anon key e publica (vai no bundle JS); aceitar qualquer Bearer permitia
    // dirigir os agentes sem login, com email forjado e projectId arbitrario.
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user?.email) {
      return json({ error: "Nao autenticado" }, 401);
    }
    // Identidade vem do JWT verificado — nunca do corpo da requisicao
    const userEmail = user.email;

    const { agentSlug, messages: rawMessages, projectId } = await req.json();

    if (!agentSlug || !rawMessages) {
      return json({ error: "agentSlug e messages sao obrigatorios" }, 400);
    }

    // So mensagens user/assistant do cliente — system/tool forjadas no browser
    // nao podem sobrescrever as instrucoes nem injetar resultados de tool
    const messages = (Array.isArray(rawMessages) ? rawMessages : [])
      .filter((m: any) => m && (m.role === "user" || m.role === "assistant"))
      .map((m: any) => ({ role: m.role, content: String(m.content ?? "") }));

    // Projeto validado server-side (executor usa service key — RLS nao cobre aqui)
    let projeto: { id: string; nome: string | null; cliente: string | null } | null = null;
    if (projectId) {
      const { data: projRow } = await supabase
        .from("projetos")
        .select("id, nome, cliente")
        .eq("id", projectId)
        .maybeSingle();
      if (!projRow) {
        return json({ error: "Projeto invalido" }, 403);
      }
      projeto = projRow;
    }

    const { data: agentRow, error: agentErr } = await supabase
      .from("agentes")
      .select(`*, agente_tool_links (
        agente_tools ( id, nome, tool_key, is_system, descricao, sql_template, parametros, ativo )
      )`)
      .eq("slug", agentSlug)
      .eq("ativo", true)
      .single();

    if (agentErr || !agentRow) {
      return json({ error: `Agente '${agentSlug}' nao encontrado ou inativo` }, 404);
    }

    const { data: providerCfg } = await supabase
      .from("provider_configs")
      .select("api_key")
      .eq("provider", agentRow.provider)
      .single();

    if (!providerCfg?.api_key) {
      return json({
        error: `API key nao configurada para '${agentRow.provider}'. Configure na aba Provedores.`,
      }, 400);
    }

    // Buscar preco do modelo para calculo de custo
    const { data: modelPrice } = await supabase
      .from("modelo_precos")
      .select("preco_input_1k, preco_output_1k")
      .eq("modelo", agentRow.modelo)
      .eq("ativo", true)
      .single();

    const allTools: any[] = (agentRow.agente_tool_links ?? [])
      .map((l: any) => l?.agente_tools)
      .filter((t: any) => t && t.ativo !== false);

    let systemPrompt = agentRow.instructions || "";

    if (agentRow.injetar_data) {
      // Data local do Brasil (en-CA => formato ISO YYYY-MM-DD). toISOString() daria
      // a data UTC — após 21h em BRT o agente pensaria que já é amanhã (L026)
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
      systemPrompt += `\n\nData atual: ${today}`;
    }

    if (agentRow.injetar_schema) {
      const { data: schema } = await supabase.rpc("get_db_schema");
      if (schema) {
        systemPrompt += `\n\n## Estrutura do banco de dados\n${JSON.stringify(schema, null, 2)}`;
      }
    }

    if (projeto) {
      systemPrompt += [
        "",
        "",
        `Projeto ativo: ${projeto.nome ?? projeto.id}` + (projeto.cliente ? ` (cliente: ${projeto.cliente})` : ""),
        `projeto_id: ${projeto.id}`,
        `Use SEMPRE WHERE projeto_id = '${projeto.id}' nos filtros SQL.`,
        "Nunca consulte dados de outros projetos, mesmo que o usuario peca.",
      ].join("\n");
    }

    const openaiTools = buildOpenAITools(allTools);
    const openai = new OpenAI({ apiKey: providerCfg.api_key });

    const workMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    for (let round = 0; round < 5; round++) {
      const check = await openai.chat.completions.create({
        model: agentRow.modelo,
        messages: workMessages,
        tools: openaiTools.length > 0 ? openaiTools : undefined,
        stream: false,
      });

      const choice = check.choices[0];
      if (choice.finish_reason !== "tool_calls" || !choice.message.tool_calls?.length) break;

      workMessages.push(choice.message);

      for (const tc of choice.message.tool_calls) {
        const args = JSON.parse(tc.function.arguments || "{}");
        const result = await executeTool(tc.function.name, args, supabase, projectId, allTools);
        workMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
    }

    const startTime = Date.now();
    let promptTokens = 0;
    let completionTokens = 0;

    const streamResp = await openai.chat.completions.create({
      model: agentRow.modelo,
      messages: workMessages,
      stream: true,
      stream_options: { include_usage: true },
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResp) {
            const delta = chunk.choices[0]?.delta;
            if (delta?.content) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "text-delta", payload: { text: delta.content } })}\n\n`,
                ),
              );
            }
            if (chunk.usage) {
              promptTokens = chunk.usage.prompt_tokens;
              completionTokens = chunk.usage.completion_tokens;
            }
          }

          // Calcular custo com base na tabela modelo_precos
          let custoUsd: number | null = null;
          if (modelPrice && promptTokens > 0) {
            custoUsd =
              (promptTokens / 1000.0) * Number(modelPrice.preco_input_1k) +
              (completionTokens / 1000.0) * Number(modelPrice.preco_output_1k);
          }

          await supabase.from("agente_uso_logs").insert({
            agente_slug: agentRow.slug,
            modelo: agentRow.modelo,
            provider: agentRow.provider,
            usuario_email: userEmail || null,
            projeto_id: projectId || null,
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: promptTokens + completionTokens,
            custo_usd: custoUsd,
            latencia_ms: Date.now() - startTime,
            status: "success",
          });
        } catch (e) {
          console.error("[agent-chat] stream error:", e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        ...CORS,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (e) {
    console.error("[agent-chat] error:", e);
    return json({ error: "Erro interno" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function buildOpenAITools(tools: any[]): any[] {
  const seen = new Set<string>();
  const result: any[] = [];

  for (const tool of tools) {
    if (tool.is_system) {
      const def = SYSTEM_TOOL_DEFS[tool.tool_key];
      if (def && !seen.has(def.function.name)) {
        seen.add(def.function.name);
        result.push(def);
      }
    } else {
      const fnName = tool.nome;
      if (seen.has(fnName)) continue;
      seen.add(fnName);

      const params: any[] = Array.isArray(tool.parametros) ? tool.parametros : [];
      const properties: Record<string, any> = {};
      const required: string[] = [];

      for (const p of params) {
        properties[p.nome] = {
          type: p.tipo === "number" ? "number" : "string",
          description: p.descricao || p.nome,
        };
        required.push(p.nome);
      }

      result.push({
        type: "function",
        function: {
          name: fnName,
          description: tool.descricao,
          parameters: { type: "object", properties, required },
        },
      });
    }
  }

  return result;
}

async function executeTool(
  name: string,
  args: any,
  supabase: any,
  _projectId: string | null,
  allTools: any[],
): Promise<any> {
  try {
    if (name === "get_schema") {
      const { data, error } = await supabase.rpc("get_db_schema");
      if (error) return { error: error.message };
      return data;
    }

    if (name === "execute_sql") {
      const sql = (args.sql || "").trim();
      if (!sql) return { error: "Query SQL nao fornecida" };
      if (BLOCKED_SQL.test(sql)) return { error: "Bloqueado: apenas SELECT e permitido." };
      const { data, error } = await supabase.rpc("exec_readonly_sql", { query: sql });
      if (error) return { error: error.message };
      return data ?? [];
    }

    if (name === "analyze_table") {
      const table = args.table || "";
      if (!table) return { error: "Nome da tabela nao fornecido" };
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      if (error) return { error: error.message };
      return { table, row_count: count };
    }

    const customTool = allTools.find((t: any) => !t.is_system && t.nome === name);
    if (customTool) {
      let sql = (customTool.sql_template || "").trim();
      if (!sql) return { error: `Tool '${name}' sem SQL template configurado.` };

      const params: any[] = Array.isArray(customTool.parametros) ? customTool.parametros : [];
      for (let i = 0; i < params.length; i++) {
        const paramName = params[i].nome;
        const paramValue = args[paramName];
        if (paramValue !== undefined) {
          const escaped = String(paramValue).replace(/'/g, "''");
          sql = sql.replace(new RegExp(`\\$${i + 1}`, "g"), `'${escaped}'`);
        }
      }

      if (BLOCKED_SQL.test(sql)) return { error: "Bloqueado: apenas SELECT e permitido." };
      const { data, error } = await supabase.rpc("exec_readonly_sql", { query: sql });
      if (error) return { error: error.message };
      return data ?? [];
    }

    return { error: `Tool desconhecida: ${name}` };
  } catch (e) {
    return { error: `Erro na tool '${name}': ${e}` };
  }
}
