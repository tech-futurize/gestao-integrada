-- ============================================================
-- Migration: get_db_schema com foreign keys + glossário de domínio
-- Data: 2026-07-01
-- Contexto: o agente de negócio (Edge Function agent-chat) recebia
--   apenas nomes/tipos de colunas via get_db_schema — sem as conexões
--   (FKs) entre tabelas, os JOINs eram construídos por adivinhação, e
--   sem semântica de domínio o agente interpretava mal os dados
--   (ex.: semana_iso apresentada como "mês").
-- Aplicada diretamente no banco em 2026-07-01 (registro para histórico).
-- ============================================================

-- 1. get_db_schema agora retorna, por tabela:
--    { "columns": [...], "foreign_keys": [{column, references_table, references_column}] }
-- Nota: CREATE OR REPLACE preserva a ACL existente (L022):
--   somente postgres e service_role têm EXECUTE.
CREATE OR REPLACE FUNCTION public.get_db_schema()
 RETURNS json
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH pk AS (
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku
      ON tc.constraint_name = ku.constraint_name
     AND tc.table_schema = ku.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
  ),
  fk AS (
    SELECT
      ku.table_name,
      json_agg(
        json_build_object(
          'column', ku.column_name,
          'references_table', ccu.table_name,
          'references_column', ccu.column_name
        )
      ) AS fks
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku
      ON tc.constraint_name = ku.constraint_name
     AND tc.table_schema = ku.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
     AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    GROUP BY ku.table_name
  ),
  cols AS (
    SELECT
      c.table_name,
      json_agg(
        json_build_object(
          'name', c.column_name,
          'type', c.data_type,
          'nullable', c.is_nullable = 'YES',
          'pk', pk.column_name IS NOT NULL
        )
        ORDER BY c.ordinal_position
      ) AS columns
    FROM information_schema.columns c
    LEFT JOIN pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
    WHERE c.table_schema = 'public'
      AND c.table_name NOT LIKE 'pg_%'
      AND c.table_name NOT IN ('schema_migrations', 'spatial_ref_sys', 'buckets', 'objects', 'migrations')
    GROUP BY c.table_name
  )
  SELECT COALESCE(
    json_object_agg(
      cols.table_name,
      json_build_object(
        'columns', cols.columns,
        'foreign_keys', COALESCE(fk.fks, '[]'::json)
      )
      ORDER BY cols.table_name
    ),
    '{}'::json
  )
  FROM cols
  LEFT JOIN fk ON fk.table_name = cols.table_name;
$function$;

-- 2. Glossário de domínio nas instructions do agente de negócio
--    (idempotente — só aplica se ainda não existir a seção)
UPDATE agentes SET instructions = instructions || '

## Domínio e semântica dos dados

- **avanco_fisico**: granularidade SEMANAL — semana_iso usa formato ISO 8601 ("2025-W23" = semana 23 de 2025). Apesar dos nomes, avanco_previsto_mensal e avanco_realizado_mensal são percentuais (0–100) registrados POR SEMANA. Nunca apresente essas linhas como "meses" — apresente como semanas (ex.: "Semana 23/2025"), usando o valor de semana_iso.
- **Avanço físico é sempre percentual (0–100)** — nunca pergunte a unidade.
- **histogramas**: mão de obra/equipamentos por mês (mes_referencia) — valores em HH (homem-hora) ou quantidade de trabalhadores; tipo e subtipo_mo classificam o recurso.
- **contratos**: valor_total em R$; vigência em data_inicio/data_fim.
- **pleitos**: pleitos contratuais; ligados a registros e outros itens via tabela pleito_vinculos.
- **mudancas_contratuais**: podem referenciar um pleito via pleito_id.
- **registros**: ocorrências/incidentes contratuais (tipo_registro, gravidade, probabilidade, status).
- **riscos**: probabilidade e impacto categorizados; areas_impacto (jsonb) e classificacao.
- **Relacionamentos**: o schema injetado traz "foreign_keys" por tabela — use-as para montar JOINs corretos; nunca invente colunas de junção.'
WHERE slug = 'business-analyst-agent'
  AND instructions NOT LIKE '%Domínio e semântica dos dados%';
