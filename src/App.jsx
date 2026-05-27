import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { setupIframeMessaging } from './lib/iframe-messaging';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ProjectProvider } from '@/lib/ProjectContext';
import { navigationGroups } from '@/lib/navigationConfig';
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

// Admin Contratual
const Contratos            = lazy(() => import('./pages/Contratos'));
const Medicoes             = lazy(() => import('./pages/AdminContratual/Medicoes'));
const RDOs                 = lazy(() => import('./pages/AdminContratual/RDOs'));
const Registros            = lazy(() => import('./pages/AdminContratual/Registros'));
const AdminPleitos         = lazy(() => import('./pages/AdminContratual/Pleitos'));
const MapaImpacto          = lazy(() => import('./pages/AdminContratual/MapaImpacto'));

// Riscos e Mudanças
const GestaoRiscos         = lazy(() => import('./pages/RiscosMudancas/GestaoRiscos'));
const GestaoMudancas       = lazy(() => import('./pages/RiscosMudancas/GestaoMudancas'));

// Agentes
const ExecutorDados        = lazy(() => import('./pages/Agentes/ExecutorDados'));
const AnalistaNegocio      = lazy(() => import('./pages/Agentes/AnalistaNegocio'));
const AnalistaContratual   = lazy(() => import('./pages/Agentes/AnalistaContratual'));

// Configurações
const GerenciarProjeto     = lazy(() => import('./pages/Configuracoes/GerenciarProjeto'));
const AgenteConfig         = lazy(() => import('./pages/Configuracoes/AgenteConfig'));
const Usuarios             = lazy(() => import('./pages/Configuracoes/Usuarios'));

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

function getCurrentPageName(pathname) {
  if (pathname === '/dashboard') return 'Dashboard';
  for (const group of navigationGroups) {
    if (group.path === pathname) return group.title;
    if (group.children) {
      const child = group.children.find(c => c.path === pathname);
      if (child) return child.title;
    }
  }
  return '';
}

const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  const currentPageName = getCurrentPageName(location.pathname);
  return <Layout currentPageName={currentPageName}>{children}</Layout>;
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const wrap = (Component) => (
  <ProtectedRoute>
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
    <Route path="/dashboard" element={wrap(Dashboard)} />

    {/* Engenharia */}
    <Route path="/engenharia/documentos" element={wrap(Documentos)} />

    {/* Suprimentos */}
    <Route path="/suprimentos/mapa" element={wrap(MapaSuprimentos)} />

    {/* Planejamento */}
    <Route path="/planejamento/cronograma" element={wrap(PlanejamentoCronograma)} />
    <Route path="/planejamento/6wla" element={wrap(SixWLAPage)} />
    <Route path="/planejamento/take-off" element={wrap(TakeOff)} />
    <Route path="/planejamento/histograma" element={wrap(PlanejamentoHistograma)} />
    <Route path="/planejamento/avancos" element={wrap(Avancos)} />

    {/* Adm. Contratual */}
    <Route path="/admin-contratual/contratos" element={wrap(Contratos)} />
    <Route path="/admin-contratual/medicoes" element={wrap(Medicoes)} />
    <Route path="/admin-contratual/rdos" element={wrap(RDOs)} />
    <Route path="/admin-contratual/registros" element={wrap(Registros)} />
    <Route path="/admin-contratual/pleitos" element={wrap(AdminPleitos)} />
    <Route path="/admin-contratual/mapa-impacto" element={wrap(MapaImpacto)} />

    {/* Riscos e Mudanças */}
    <Route path="/riscos-mudancas/gestao-riscos" element={wrap(GestaoRiscos)} />
    <Route path="/riscos-mudancas/gestao-mudancas" element={wrap(GestaoMudancas)} />

    {/* Agentes de IA */}
    <Route path="/agentes/executor" element={wrap(ExecutorDados)} />
    <Route path="/agentes/analista-negocio" element={wrap(AnalistaNegocio)} />
    <Route path="/agentes/analista-contratual" element={wrap(AnalistaContratual)} />

    {/* Configurações */}
    <Route path="/configuracoes/gerenciar-projeto" element={wrap(GerenciarProjeto)} />
    <Route path="/configuracoes/agente-config" element={wrap(AgenteConfig)} />
    <Route path="/configuracoes/usuarios" element={wrap(Usuarios)} />

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
    <Route path="/Agente" element={<Navigate to="/agentes/executor" replace />} />
    <Route path="/AgenteConfig" element={<Navigate to="/configuracoes/agente-config" replace />} />
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
