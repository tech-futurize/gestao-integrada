-- ============================================================================
-- M22 — RLS ADMIN-ONLY PARA provider_configs (chaves de API de providers)
-- ============================================================================
-- Problema (auditoria jul/2026): as policies de provider_configs davam acesso
-- total a qualquer usuário autenticado — api_key em texto puro podia ser lida
-- por qualquer login via DevTools. O gate de admin era só client-side.
-- Correção: acesso à tabela restrito a usuários com perfil 'Admin' ativo.
-- Efeito no frontend: para não-admins as queries retornam lista vazia (sem
-- erro); a tela de providers é de administração e já era gated no cliente.
-- Executores server-side (Edge Function/Mastra) usam service key e não são
-- afetados por RLS.
-- ============================================================================

-- Identifica admin pelo e-mail do JWT contra a tabela usuarios.
-- SECURITY DEFINER: usuarios tem RLS própria; a função só devolve um boolean
-- e é executável apenas por authenticated (não exposta à anon — L022).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios
    WHERE email = auth.jwt() ->> 'email'
      AND perfil = 'Admin'
      AND COALESCE(status, 'Ativo') = 'Ativo'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Substitui as policies abertas por admin-only
DROP POLICY IF EXISTS provider_configs_select ON provider_configs;
DROP POLICY IF EXISTS provider_configs_insert ON provider_configs;
DROP POLICY IF EXISTS provider_configs_update ON provider_configs;
DROP POLICY IF EXISTS provider_configs_delete ON provider_configs;

DROP POLICY IF EXISTS provider_configs_admin_select ON provider_configs;
DROP POLICY IF EXISTS provider_configs_admin_insert ON provider_configs;
DROP POLICY IF EXISTS provider_configs_admin_update ON provider_configs;
DROP POLICY IF EXISTS provider_configs_admin_delete ON provider_configs;

CREATE POLICY provider_configs_admin_select ON provider_configs
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY provider_configs_admin_insert ON provider_configs
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY provider_configs_admin_update ON provider_configs
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY provider_configs_admin_delete ON provider_configs
  FOR DELETE TO authenticated USING (public.is_admin());
