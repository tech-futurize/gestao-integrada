import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { usePermissionsMap, usePermissionsLoading } from '@/hooks/usePermissions';
import { Lock, Loader2 } from 'lucide-react';
import AgentsList from '@/components/agentes/AgentsList';
import ToolsList from '@/components/agentes/ToolsList';
import MetricsDashboard from '@/components/agentes/MetricsDashboard';
import ProvidersTab from '@/components/agentes/ProvidersTab';

const TABS = [
  { key: 'agentes',   label: 'Agentes' },
  { key: 'tools',     label: 'Tools' },
  { key: 'metricas',  label: 'Métricas & Custos' },
  { key: 'provedores',label: 'Provedores' },
];

export default function AdminAgentes() {
  const [activeTab, setActiveTab] = useState('agentes');
  const { isAdmin } = usePermissionsMap();
  const permsLoading = usePermissionsLoading();

  if (permsLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Lock className="w-10 h-10 opacity-30" />
          <p className="text-sm">Acesso restrito a administradores.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader />

      <div className="flex-1 overflow-auto">
        <div className="flex gap-1 border-b border-border px-6 md:px-8 bg-background sticky top-0 z-10">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'agentes'    && <AgentsList />}
            {activeTab === 'tools'      && <ToolsList />}
            {activeTab === 'metricas'   && <MetricsDashboard />}
            {activeTab === 'provedores' && <ProvidersTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
