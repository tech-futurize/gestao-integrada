import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import pg from 'pg';
import { loadSchema } from '../schema/schema-loader';

const { Pool } = pg;

let pool: InstanceType<typeof Pool> | null = null;

function getPool(): InstanceType<typeof Pool> {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL não definida no .env da raiz do projeto');
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      options: '-c search_path=public',
    });
  }
  return pool;
}

async function query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

// Lê o schema do arquivo em disco (gerado no boot) — sem hit no banco
export const getSchemaTool = createTool({
  id: 'get-schema',
  description:
    'Retorna colunas, tipos e chaves de uma ou mais tabelas do schema public. Lê de arquivo local — resposta instantânea. Use antes de montar queries em tabelas desconhecidas.',
  inputSchema: z.object({
    tables: z
      .array(z.string())
      .optional()
      .describe('Lista de nomes de tabelas. Omita para retornar todas.'),
  }),
  outputSchema: z.object({
    tables: z.array(
      z.object({
        name: z.string(),
        columns: z.array(
          z.object({
            name: z.string(),
            type: z.string(),
            nullable: z.boolean(),
            isPrimaryKey: z.boolean(),
          })
        ),
      })
    ),
  }),
  execute: async (input) => {
    const all = await loadSchema();
    const filter = input.tables && input.tables.length > 0 ? new Set(input.tables) : null;
    const result = filter ? all.filter((t) => filter.has(t.name)) : all;
    return { tables: result };
  },
});

const BLOCKED_SQL = /\b(DELETE|DROP|TRUNCATE|ALTER|UPDATE|INSERT|CREATE|GRANT|REVOKE|VACUUM|REINDEX)\b/i;

export const executeSQLTool = createTool({
  id: 'execute-sql',
  description:
    'Executa uma query SQL no banco Supabase. Use para SELECT, agregações e análises. Apenas leitura — DDL e DML destrutivos são bloqueados.',
  inputSchema: z.object({
    query: z.string().describe('Query SQL a ser executada (somente SELECT e CTEs de leitura)'),
  }),
  outputSchema: z.object({
    rows: z.array(z.record(z.string(), z.unknown())),
    rowCount: z.number(),
  }),
  execute: async (input) => {
    if (BLOCKED_SQL.test(input.query)) {
      throw new Error(
        `Query bloqueada por segurança: operações de escrita ou DDL não são permitidas. ` +
        `Use apenas SELECT e CTEs de leitura.`
      );
    }
    const rows = await query(input.query);
    return { rows, rowCount: rows.length };
  },
});

export const analyzeTableTool = createTool({
  id: 'analyze-table',
  description:
    'Retorna estatísticas de uma tabela: total de linhas, tamanho em disco, índices e colunas com nulos. Use apenas quando precisar entender volume ou qualidade dos dados.',
  inputSchema: z.object({
    tableName: z.string().describe('Nome da tabela'),
    schema: z.string().optional().default('public').describe('Schema da tabela (padrão: public)'),
  }),
  outputSchema: z.object({
    tableName: z.string(),
    rowCount: z.number(),
    totalSizePretty: z.string(),
    indexes: z.array(z.object({ name: z.string(), definition: z.string() })),
    nullStats: z.array(
      z.object({ column: z.string(), nullCount: z.number(), nullPercent: z.string() })
    ),
  }),
  execute: async (input) => {
    const sch = input.schema ?? 'public';
    const fullName = `${sch}.${input.tableName}`;

    const [statsRows, indexRows, colRows] = await Promise.all([
      query<{ row_count: string; total_size_pretty: string }>(
        `SELECT reltuples::bigint AS row_count,
                pg_size_pretty(pg_total_relation_size($1)) AS total_size_pretty
         FROM pg_class
         WHERE relname = $2
           AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = $3)`,
        [fullName, input.tableName, sch]
      ),
      query<{ indexname: string; indexdef: string }>(
        `SELECT indexname, indexdef FROM pg_indexes
         WHERE schemaname = $1 AND tablename = $2 ORDER BY indexname`,
        [sch, input.tableName]
      ),
      query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position`,
        [sch, input.tableName]
      ),
    ]);

    const stats = statsRows[0] ?? { row_count: '0', total_size_pretty: '0 bytes' };
    const rowCount = Number(stats.row_count);
    const nullStats: Array<{ column: string; nullCount: number; nullPercent: string }> = [];

    if (colRows.length > 0 && rowCount > 0) {
      const clauses = colRows
        .map((c) => `COUNT(*) FILTER (WHERE "${c.column_name}" IS NULL) AS "${c.column_name}"`)
        .join(', ');
      const nullRows = await query(`SELECT ${clauses} FROM "${sch}"."${input.tableName}"`);
      if (nullRows[0]) {
        for (const col of colRows) {
          const nullCount = Number(nullRows[0][col.column_name] ?? 0);
          if (nullCount > 0) {
            nullStats.push({
              column: col.column_name,
              nullCount,
              nullPercent: ((nullCount / rowCount) * 100).toFixed(1) + '%',
            });
          }
        }
      }
    }

    return {
      tableName: input.tableName,
      rowCount,
      totalSizePretty: stats.total_size_pretty,
      indexes: indexRows.map((i) => ({ name: i.indexname, definition: i.indexdef })),
      nullStats,
    };
  },
});
