-- docs/database/supabase-migration-m14-permissoes.sql
-- M14 — Sistema de Permissões
-- Aplicar via Supabase Dashboard → SQL Editor

-- ─────────────────────────────────────────────
-- 1. Tabela principal
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permissoes_usuario (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  modulo      TEXT NOT NULL,
  acoes       JSONB NOT NULL DEFAULT '{"view":false,"create":false,"edit":false,"delete":false}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (usuario_id, modulo)
);

CREATE INDEX IF NOT EXISTS idx_permissoes_usuario_id ON permissoes_usuario(usuario_id);

-- ─────────────────────────────────────────────
-- 2. RLS — permissiva: qualquer autenticado lê/escreve
--    (o enforcement real é feito no frontend)
-- ─────────────────────────────────────────────
ALTER TABLE permissoes_usuario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Autenticados têm acesso total" ON permissoes_usuario;

CREATE POLICY "Autenticados têm acesso total" ON permissoes_usuario
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────
-- 3. Garantir usuário Admin padrão na tabela usuarios
--    (ON CONFLICT garante idempotência)
-- ─────────────────────────────────────────────
INSERT INTO usuarios (nome, email, cargo, perfil, status)
VALUES (
  'Administrador',
  'vinicius.groth@futurizenow.com.br',
  'Administrador do Sistema',
  'Admin',
  'Ativo'
)
ON CONFLICT (email) DO UPDATE
  SET perfil = 'Admin',
      status = 'Ativo';

-- ─────────────────────────────────────────────
-- 4. Seed: Admin → acesso total a todos os módulos
-- ─────────────────────────────────────────────
INSERT INTO permissoes_usuario (usuario_id, modulo, acoes)
SELECT u.id, m.modulo, '{"view":true,"create":true,"edit":true,"delete":true}'::jsonb
FROM usuarios u
CROSS JOIN (VALUES
  ('Dashboard'), ('Engenharia'), ('Suprimentos'), ('Planejamento'),
  ('Adm. Contratual'), ('Riscos e Mudanças'), ('Agentes de IA'), ('Configurações')
) AS m(modulo)
WHERE u.perfil = 'Admin'
ON CONFLICT (usuario_id, modulo) DO UPDATE
  SET acoes = '{"view":true,"create":true,"edit":true,"delete":true}'::jsonb,
      updated_at = now();

-- ─────────────────────────────────────────────
-- 5. Seed: Gestor → tudo, exceto Configurações (só view)
-- ─────────────────────────────────────────────
INSERT INTO permissoes_usuario (usuario_id, modulo, acoes)
SELECT u.id, m.modulo,
  CASE WHEN m.modulo = 'Configurações'
    THEN '{"view":true,"create":false,"edit":false,"delete":false}'::jsonb
    ELSE '{"view":true,"create":true,"edit":true,"delete":true}'::jsonb
  END
FROM usuarios u
CROSS JOIN (VALUES
  ('Dashboard'), ('Engenharia'), ('Suprimentos'), ('Planejamento'),
  ('Adm. Contratual'), ('Riscos e Mudanças'), ('Agentes de IA'), ('Configurações')
) AS m(modulo)
WHERE u.perfil = 'Gestor'
ON CONFLICT (usuario_id, modulo) DO NOTHING;

-- ─────────────────────────────────────────────
-- 6. Seed: demais perfis → view em tudo, sem Configurações
-- ─────────────────────────────────────────────
INSERT INTO permissoes_usuario (usuario_id, modulo, acoes)
SELECT u.id, m.modulo,
  CASE WHEN m.modulo = 'Configurações'
    THEN '{"view":false,"create":false,"edit":false,"delete":false}'::jsonb
    ELSE '{"view":true,"create":false,"edit":false,"delete":false}'::jsonb
  END
FROM usuarios u
CROSS JOIN (VALUES
  ('Dashboard'), ('Engenharia'), ('Suprimentos'), ('Planejamento'),
  ('Adm. Contratual'), ('Riscos e Mudanças'), ('Agentes de IA'), ('Configurações')
) AS m(modulo)
WHERE u.perfil NOT IN ('Admin', 'Gestor')
ON CONFLICT (usuario_id, modulo) DO NOTHING;
