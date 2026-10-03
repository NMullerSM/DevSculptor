import React from 'react';
import { useAdminStore } from '@/stores/useAdminStore';
import { AdminTab } from '@/types/admin.types';
import { GlobalVaultTab } from './tabs/GlobalVaultTab';
import { PlatformStatsTab } from './tabs/PlatformStatsTab';
import { AuditLogsTab } from './tabs/AuditLogsTab';
import { UserManagementTab } from './tabs/UserManagementTab';
import { AiModelsTab } from './tabs/AiModelsTab';

interface AdminConsoleViewProps {
  onBack: () => void;
}

export const AdminConsoleView: React.FC<AdminConsoleViewProps> = ({ onBack }) => {
  const { activeTab, setActiveTab } = useAdminStore();

  const tabs: Array<{ id: AdminTab; label: string; icon: string }> = [
    { id: 'vault', label: 'Bóveda Global (_global/)', icon: 'folder_data' },
    { id: 'models', label: 'Catálogo Modelos IA', icon: 'smart_toy' },
    { id: 'stats', label: 'Telemetría & KPIs', icon: 'analytics' },
    { id: 'audit', label: 'Auditoría Transversal', icon: 'receipt_long' },
    { id: 'users', label: 'Usuarios & RBAC', icon: 'manage_accounts' },
  ];

  return (
    <main className="vision-window flex-1 flex flex-col p-3 sm:p-4 min-h-0 relative overflow-hidden gap-3 shadow-2xl">
      {/* 1. Cabecera Maestra de la Consola */}
      <header className="flex flex-wrap items-center justify-between pb-3 border-b border-glass-subtle gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="vision-btn !p-1.5 text-xs text-muted hover:text-primary"
            title="Regresar al Estudio"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.9)]" />
            <h1 className="text-sm font-semibold text-primary tracking-tight">
              Consola de Gobernanza y Administrador Maestro
            </h1>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded-[5px] bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold inline-flex items-center gap-1 shadow-sm">
            <span className="material-symbols-outlined text-xs">shield_person</span>
            <span>SUPERADMIN</span>
          </span>
        </div>

        {/* Selector de Pestañas visionOS */}
        <nav className="flex items-center gap-1 bg-black/20 dark:bg-white/[0.04] p-0.5 rounded-[8px] border border-glass-subtle">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`vision-btn !py-1 !px-2.5 sm:!px-3 text-[11px] flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'vision-btn-primary !shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                    : 'text-muted hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">{tab.icon}</span>
                <span className="hidden sm:inline font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* 2. Contenido Dinámico de la Pestaña Activa */}
      <section className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeTab === 'vault' && <GlobalVaultTab />}
        {activeTab === 'models' && <AiModelsTab />}
        {activeTab === 'stats' && <PlatformStatsTab />}
        {activeTab === 'audit' && <AuditLogsTab />}
        {activeTab === 'users' && <UserManagementTab />}
      </section>
    </main>
  );
};
