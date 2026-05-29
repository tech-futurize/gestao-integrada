// src/hooks/usePermissions.js
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/supabaseEntities';
import { DENY_ALL, ALLOW_ALL } from '@/lib/permissionsConfig';

// Busca o registro da tabela 'usuarios' que corresponde ao usuário Auth logado
function useCurrentUsuario() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['current-usuario', user?.email],
    queryFn: async () => {
      const rows = await entities.Usuario.filter({ email: user.email });
      return rows[0] ?? null;
    },
    enabled: !!user?.email,
    staleTime: Infinity,
  });
}

// Busca todas as permissões do usuário como mapa { modulo: acoes }
function usePermissionsQuery(usuarioId) {
  return useQuery({
    queryKey: ['permissoes', usuarioId],
    queryFn: async () => {
      const rows = await entities.PermissaoUsuario.filter({ usuario_id: usuarioId });
      return rows.reduce((acc, row) => {
        acc[row.modulo] = row.acoes;
        return acc;
      }, {});
    },
    enabled: !!usuarioId,
    staleTime: Infinity,
    placeholderData: {},
  });
}

// Retorna true enquanto as queries ainda carregam — usar em ProtectedRoute para
// evitar redirect prematuro antes das permissões chegarem
export function usePermissionsLoading() {
  const { isLoading: l1, data: currentUsuario } = useCurrentUsuario();
  const { isLoading: l2 } = usePermissionsQuery(currentUsuario?.id);
  return l1 || l2;
}

// Retorna { permissoes, isAdmin } — usar na sidebar para filtrar grupos de navegação
export function usePermissionsMap() {
  const { data: currentUsuario } = useCurrentUsuario();
  const { data: permissoes = {} } = usePermissionsQuery(currentUsuario?.id);
  const isAdmin = currentUsuario?.perfil === 'Admin';
  return { permissoes, isAdmin };
}

// API principal:
//   usePermissions('Engenharia')            → { view, create, edit, delete }
//   usePermissions('Engenharia', 'create')  → boolean
export function usePermissions(modulo, acao) {
  const { data: currentUsuario } = useCurrentUsuario();
  const { data: permissoes = {} } = usePermissionsQuery(currentUsuario?.id);

  // Admin bypass: perfil Admin tem acesso total sem consultar a tabela.
  // Cobre janela pré-seed e garante que o administrador nunca fica bloqueado.
  if (currentUsuario?.perfil === 'Admin') {
    return acao !== undefined ? true : { ...ALLOW_ALL };
  }

  const modulePerms = permissoes[modulo] ?? { ...DENY_ALL };

  if (acao !== undefined) return modulePerms[acao] === true;
  return { ...DENY_ALL, ...modulePerms };
}
