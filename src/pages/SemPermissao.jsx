import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';

export default function SemPermissao() {
  const navigate = useNavigate();
  const canManageUsers = usePermissions('Configurações', 'edit');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
        <Lock className="w-12 h-12 text-slate-400" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          Acesso restrito
        </h2>
        <p className="text-slate-500 mt-2 max-w-sm">
          Você não tem permissão para acessar este módulo.
          Entre em contato com o administrador do sistema.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Voltar
        </Button>
        {canManageUsers && (
          <Button onClick={() => navigate('/configuracoes/usuarios')}>
            Ir para Usuários
          </Button>
        )}
      </div>
    </div>
  );
}
