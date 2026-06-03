import { lazy, Suspense } from 'react';
import { usePermissions, usePermissionsLoading } from '@/hooks/usePermissions';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { setupIframeMessaging } from './lib/iframe-messaging';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ProjectProvider } from '@/lib/ProjectContext';
import Layout from './Layout';

// ── Lazy page imports ──────────────────────────────────────────────────────────
const Login                = lazy(() => import('./pages/Login'));
const Dashboard            = lazy(() => import('./pages/Dashboard'));

// Engenharia
const Documentos           = lazy(() => import('./pages/Engenharia/Documentos'));

// Suprimentos
const MapaSuprimentos      = lazy(() => import('./pages/Suprimentos/MapaSuprimentos'));

// Planejamento
const PlanejamentoCronograma = lazy(() => import('./pages/Planejamento/Cronograma'));
const SixWLAPage           = lazy(() => import('./pages/Planejamento/SixWLA'));
const TakeOff              = lazy(() => import('./pages/Planejamento/TakeOff'));
const PlanejamentoHistograma = lazy(() => import('./pages/Planejamento/Histograma'));
const Avancos              = lazy(() => import('./pages/Planejamento/Avancos'));
const Faturamento          = lazy(() => import('./pages/Planejamento/Faturamento'));

// Admin Contratual
const Contratos            = lazy(() => import('./pages/Contratos'));
const RDOs                 = lazy(() => import('./pages/AdminContratual/RDOs'));
const Registros            = lazy(() => import('./pages/AdminContratual/Registros'));
const AdminPleitos         = lazy(() => import('./pages/AdminContratual/Pleitos'));
const MapaImpacto          = lazy(() => import('./pages/AdminContratual/MapaImpacto'));

// Riscos e Mudanças
const GestaoRiscos         = lazy(() => import('./pages/RiscosMudancas/GestaoRiscos'));
const GestaoMudancas       = lazy(() => import('./pages/RiscosMudancas/GestaoMudancas'));

// Agentes
const AgenteViewer         = lazy(() => import('./pages/Agentes/AgenteViewer'));
// Páginas legadas mantidas como redirects abaixo

// Configurações
const GerenciarProjeto     = lazy(() => import('./pages/Configuracoes/GerenciarProjeto'));
const Usuarios             = lazy(() => import('./pages/Configuracoes/Usuarios'));
const Cadastros            = lazy(() => import('./pages/Configuracoes/Cadastros'));
const AdminAgentes         = lazy(() => import('./pages/Configuracoes/AdminAgentes'));
// UnidadesMedida e Disciplinas são acessadas como abas dentro de Cadastros (via prop asTab)
// As rotas legadas (/configuracoes/unidades-medida, /configuracoes/disciplinas) redirecionam para /configuracoes/cadastros

// Acesso restrito
const SemPermissao         = lazy(() => import('./pages/SemPermissao'));

// ── Setup ──────────────────────────────────────────────────────────────────────
setupIframeMessaging();

// ── Page loading fallback ──────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex flex-1 items-center justify-center h-full min-h-[300px]">
      <div className="w-7 h-7 border-4 border-border border-t-foreground rounded-full animate-spin" />
    </div>
  );
}

const LayoutWrapper = ({ children }) => {
  return <Layout>{children}</Layout>;
};

const ProtectedRoute = ({ children, modulo, acao = 'view' }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const permsLoading = usePermissionsLoading();
  const canAccess = usePermissions(modulo, acao);

  if (isLoadingAuth || (modulo && permsLoading)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (modulo && !canAccess) return <Navigate to="/sem-permissao" replace />;

  return children;
};

const wrap = (Component, modulo) => (
  <ProtectedRoute modulo={modulo}>
    <LayoutWrapper>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </LayoutWrapper>
  </ProtectedRoute>
);

const AuthenticatedApp = () => (
  <Routes>
    <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />

    {/* Rota raiz */}
    <Route path="/" element={<Navigate to="/dashboard" replace />} />

    {/* Dashboard */}
    <Route path="/dashboard" element={wrap(Dashboard, 'Dashboard')} />

    {/* Engenharia */}
    <Route path="/engenharia/documentos" element={wrap(Documentos, 'Engenharia')} />

    {/* Suprimentos */}
    <Route path="/suprimentos/mapa" element={wrap(MapaSuprimentos, 'Suprimentos')} />

    {/* Planejamento */}
    <Route path="/planejamento/cronograma" element={wrap(PlanejamentoCronograma, 'Planejamento')} />
    <Route path="/planejamento/6wla" element={wrap(SixWLAPage, 'Planejamento')} />
    <Route path="/planejamento/take-off" element={wrap(TakeOff, 'Planejamento')} />
    <Route path="/planejamento/histograma" element={wrap(PlanejamentoHistograma, 'Planejamento')} />
    <Route path="/planejamento/avancos" element={wrap(Avancos, 'Planejamento')} />
    <Route path="/planejamento/faturamento" element={wrap(Faturamento, 'Planejamento')} />

    {/* Adm. Contratual */}
    <Route path="/admin-contratual/contratos" element={wrap(Contratos, 'Adm. Contratual')} />
    <Route path="/admin-contratual/rdos" element={wrap(RDOs, 'Adm. Contratual')} />
    <Route path="/admin-contratual/registros" element={wrap(Registros, 'Adm. Contratual')} />
    <Route path="/admin-contratual/pleitos" element={wrap(AdminPleitos, 'Adm. Contratual')} />
    <Route path="/admin-contratual/mapa-impacto" element={wrap(MapaImpacto, 'Adm. Contratual')} />

    {/* Riscos e Mudanças */}
    <Route path="/riscos-mudancas/gestao-riscos" element={wrap(GestaoRiscos, 'Riscos e Mudanças')} />
    <Route path="/riscos-mudancas/gestao-mudancas" element={wrap(GestaoMudancas, 'Riscos e Mudanças')} />

    {/* Agentes de IA — rota genérica por slug */}
    <Route path="/agentes/:slug" element={wrap(AgenteViewer, 'Agentes de IA')} />
    {/* Redirects das rotas legadas para os slugs do banco */}
    <Route path="/agentes/executor" element={<Navigate to="/agentes/supabase-analyst-agent" replace />} />
    <Route path="/agentes/analista-negocio" element={<Navigate to="/agentes/business-analyst-agent" replace />} />
    <Route path="/agentes/analista-contratual" element={<Navigate to="/agentes/contractual-analyst-agent" replace />} />

    {/* Configurações */}
    <Route path="/configuracoes/gerenciar-projeto" element={wrap(GerenciarProjeto, 'Configurações')} />
    <Route path="/configuracoes/agente-config" element={<Navigate to="/configuracoes/agentes-admin" replace />} />
    <Route path="/configuracoes/usuarios" element={wrap(Usuarios, 'Configurações')} />
    <Route path="/configuracoes/cadastros" element={wrap(Cadastros, 'Configurações')} />
    <Route path="/configuracoes/agentes-admin" element={wrap(AdminAgentes, 'Configurações')} />
    <Route path="/configuracoes/unidades-medida" element={<Navigate to="/configuracoes/cadastros" replace />} />
    <Route path="/configuracoes/disciplinas" element={<Navigate to="/configuracoes/cadastros" replace />} />

    {/* Sem permissão — sem modulo, acessível a qualquer autenticado */}
    <Route path="/sem-permissao" element={wrap(SemPermissao)} />

    {/* Redirects das rotas legadas */}
    <Route path="/Dashboard" element={<Navigate to="/dashboard" replace />} />
    <Route path="/Engenharia" element={<Navigate to="/engenharia/documentos" replace />} />
    <Route path="/Suprimentos" element={<Navigate to="/suprimentos/mapa" replace />} />
    <Route path="/Contratos" element={<Navigate to="/admin-contratual/contratos" replace />} />
    <Route path="/Planejamento" element={<Navigate to="/planejamento/cronograma" replace />} />
    <Route path="/Cronograma" element={<Navigate to="/planejamento/cronograma" replace />} />
    <Route path="/Histograma" element={<Navigate to="/planejamento/histograma" replace />} />
    <Route path="/AvancoFisico" element={<Navigate to="/planejamento/avancos" replace />} />
    <Route path="/Pleitos" element={<Navigate to="/admin-contratual/pleitos" replace />} />
    <Route path="/GestaoMudancas" element={<Navigate to="/riscos-mudancas/gestao-mudancas" replace />} />
    <Route path="/GestaoRiscos" element={<Navigate to="/riscos-mudancas/gestao-riscos" replace />} />
    <Route path="/Agente" element={<Navigate to="/agentes/supabase-analyst-agent" replace />} />
    <Route path="/AgenteConfig" element={<Navigate to="/configuracoes/agentes-admin" replace />} />
    <Route path="/GerenciarProjeto" element={<Navigate to="/configuracoes/gerenciar-projeto" replace />} />
    <Route path="/Financeiro" element={<Navigate to="/planejamento/avancos" replace />} />

    <Route path="*" element={<PageNotFound />} />
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ProjectProvider>
          <Router>
            <NavigationTracker />
            <AuthenticatedApp />
            <Toaster />
            <VisualEditAgent />
          </Router>
        </ProjectProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
