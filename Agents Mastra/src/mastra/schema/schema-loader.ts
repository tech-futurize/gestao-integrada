import pg from 'pg';
import { writeFile, readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_FILE = join(__dirname, 'public-schema.json');
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

export type TableSchema = {
  name: string;
  columns: { name: string; type: string; nullable: boolean; isPrimaryKey: boolean }[];
};

let memoryCache: TableSchema[] | null = null;
let memoryCacheAt = 0;

async function fetchFromDatabase(): Promise<TableSchema[]> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL não definida');

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    options: '-c search_path=public',
    max: 1,
  });

  try {
    const { rows: tables } = await pool.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
       ORDER BY table_name`
    );

    const result: TableSchema[] = [];

    for (const { table_name } of tables) {
      const { rows: cols } = await pool.query<{
        column_name: string;
        udt_name: string;
        is_nullable: string;
        is_pk: boolean;
      }>(
        `SELECT
          c.column_name, c.udt_name, c.is_nullable,
          EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
              AND kcu.table_schema = c.table_schema
              AND kcu.table_name = c.table_name
              AND kcu.column_name = c.column_name
          ) AS is_pk
        FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = $1
        ORDER BY c.ordinal_position`,
        [table_name]
      );

      result.push({
        name: table_name,
        columns: cols.map((c) => ({
          name: c.column_name,
          type: c.udt_name,
          nullable: c.is_nullable === 'YES',
          isPrimaryKey: c.is_pk,
        })),
      });
    }

    return result;
  } finally {
    await pool.end();
  }
}

export async function loadSchema(force = false): Promise<TableSchema[]> {
  const now = Date.now();

  // Cache em memória válido
  if (memoryCache && !force && now - memoryCacheAt < CACHE_TTL_MS) {
    return memoryCache;
  }

  // Cache em disco válido (dentro do TTL)
  if (!force && existsSync(SCHEMA_FILE)) {
    try {
      const { mtimeMs } = await stat(SCHEMA_FILE);
      if (now - mtimeMs < CACHE_TTL_MS) {
        const raw = await readFile(SCHEMA_FILE, 'utf-8');
        memoryCache = JSON.parse(raw) as TableSchema[];
        memoryCacheAt = mtimeMs;
        return memoryCache;
      }
    } catch {
      // arquivo inválido — busca do banco abaixo
    }
  }

  // Busca do banco e persiste em disco
  memoryCache = await fetchFromDatabase();
  memoryCacheAt = now;
  await writeFile(SCHEMA_FILE, JSON.stringify(memoryCache, null, 2), 'utf-8');
  return memoryCache;
}
