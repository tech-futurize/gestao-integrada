import './App.css'
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

import Login from './pages/Login';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import Incidentes from './pages/Incidentes';
import Casos from './pages/Casos';
import Qualidade from './pages/Qualidade';
import Financeiro from './pages/Financeiro';
import Histograma from './pages/Histograma';
import AvancoFisico from './pages/AvancoFisico';
import GerenciarProjeto from './pages/GerenciarProjeto';
import GestaoMudancas from './pages/GestaoMudancas';
import Contratos from './pages/Contratos';
import Suprimentos from './pages/Suprimentos';
import Cronograma from './pages/Cronograma';
import Planejamento from './pages/Planejamento';
import GestaoRiscos from './pages/GestaoRiscos';
import Engenharia from './pages/Engenharia';
import Agente from './pages/Agente';
import AgenteConfig from './pages/AgenteConfig';

setupIframeMessaging();

const LayoutWrapper = ({ children, currentPageName }) => (
  <Layout currentPageName={currentPageName}>{children}</Layout>
);

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

const AuthenticatedApp = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<Navigate to="/Dashboard" replace />} />
    <Route path="/Dashboard" element={<ProtectedRoute><LayoutWrapper currentPageName="Dashboard"><Dashboard /></LayoutWrapper></ProtectedRoute>} />
    <Route path="/Registros" element={<ProtectedRoute><LayoutWrapper currentPageName="Registros"><Incidentes /></LayoutWrapper></ProtectedRoute>} />
    <Route path="/Pleitos" element={<ProtectedRoute><LayoutWrapper currentPageName="Pleitos"><Casos /></LayoutWrapper></ProtectedRoute>} />
    <Route path="/Qualidade" element={<ProtectedRoute><LayoutWrapper currentPageName="Qualidade"><Qualidade /></LayoutWrapper></ProtectedRoute>} />
    <Route path="/Financeiro" element={<ProtectedRoute><LayoutWrapper currentPageName="Financeiro"><Financeiro /></LayoutWrapper></ProtectedRoute>} />
    <Route path="/Histograma" element={<ProtectedRoute><LayoutWrapper currentPageName="Histograma"><Histograma /></LayoutWrapper></ProtectedRoute>} />
    <Route path="/AvancoFisico" element={<ProtectedRoute><LayoutWrapper currentPageName="Avanço Físico"><AvancoFisico /></LayoutWrapper></ProtectedRoute>} />
    <Route path="/GerenciarProjeto" element={<ProtectedRoute><LayoutWrapper currentPageName="Gerenciar Projeto"><GerenciarProjeto /></LayoutWrapper></ProtectedRoute>} />
    <Route path="/GestaoMudancas" element={<ProtectedRoute><LayoutWrapper currentPageName="Gestão de Mudanças"><GestaoMudancas /></LayoutWrapper></ProtectedRoute>} />
    <Route path="/Contratos" element={<ProtectedRoute><LayoutWrapper currentPageName="Contratos"><Contratos /></LayoutWrapper></ProtectedRoute>} />
    <Route path="/Suprimentos" element={<ProtectedRoute><LayoutWrapper currentPageName="Suprimentos"><Suprimentos /></LayoutWrapper></ProtectedRoute>} />
    <Route path="/Cronograma" element={<ProtectedRoute><LayoutWrapper currentPageName="Cronograma"><Cronograma /></LayoutWrapper></ProtectedRoute>} />
    <Route path="/Planejamento" element={<ProtectedRoute><LayoutWrapper currentPageName="Planejamento"><Planejamento /></LayoutWrapper></ProtectedRoute>} />
    <Route path="/GestaoRiscos" element={<ProtectedRoute><LayoutWrapper currentPageName="Gestão de Riscos"><GestaoRiscos /></LayoutWrapper></ProtectedRoute>} />
    <Route path="/Engenharia" element={<ProtectedRoute><LayoutWrapper currentPageName="Engenharia"><Engenharia /></LayoutWrapper></ProtectedRoute>} />
    <Route path="/Agente" element={<ProtectedRoute><LayoutWrapper currentPageName="Agente IA"><Agente /></LayoutWrapper></ProtectedRoute>} />
    <Route path="/AgenteConfig" element={<ProtectedRoute><LayoutWrapper currentPageName="Config. Agente"><AgenteConfig /></LayoutWrapper></ProtectedRoute>} />
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
