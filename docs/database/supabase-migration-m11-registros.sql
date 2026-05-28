-- M11 Registros: adiciona colunas ausentes e cria bucket de storage
-- Execute APENAS UMA VEZ via Supabase SQL Editor ou apply_migration

-- 1. Colunas de schema
ALTER TABLE registros ADD COLUMN IF NOT EXISTS tipo_registro TEXT DEFAULT 'Ata de Reunião';
ALTER TABLE registros ADD COLUMN IF NOT EXISTS responsabilidade TEXT;

-- 2. Bucket de storage para anexos de registros
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'registros-anexos',
  'registros-anexos',
  true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp','application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de storage (idempotentes)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'registros-anexos: upload autenticado'
  ) THEN
    EXECUTE 'CREATE POLICY "registros-anexos: upload autenticado"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = ''registros-anexos'')';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'registros-anexos: leitura pública'
  ) THEN
    EXECUTE 'CREATE POLICY "registros-anexos: leitura pública"
      ON storage.objects FOR SELECT TO public
      USING (bucket_id = ''registros-anexos'')';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'registros-anexos: deleção autenticada'
  ) THEN
    EXECUTE 'CREATE POLICY "registros-anexos: deleção autenticada"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = ''registros-anexos'')';
  END IF;
END $$;
