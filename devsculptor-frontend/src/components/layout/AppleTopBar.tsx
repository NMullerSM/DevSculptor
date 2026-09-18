import React from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { VisionPill } from '@/components/ui/VisionPill';

interface AppleTopBarProps {
  currentScreen: 'studio' | 'hub';
  onNavigateScreen: (screen: 'studio' | 'hub') => void;
}

export const AppleTopBar: React.FC<AppleTopBarProps> = ({
  currentScreen,
  onNavigateScreen,
}) => {
  const { user, logout } = useAuthStore();
  const { activeProject } = useProjectStore();
  const {
    isFlowDrawerOpen,
    isCopilotDrawerOpen,
    toggleFlowDrawer,
    toggleCopilotDrawer,
  } = useLayoutStore();

  const getInitials = (name?: string) => {
    if (!name) return 'DS';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="vision-window h-11 w-full shrink-0 px-2 sm:px-4 flex items-center justify-between z-30 select-none gap-1 sm:gap-3">
      {/* Izquierda: Identidad, Toggles Móviles & Switch de Pantallas */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Toggle de Drawer de Flujo (Visible solo en pantallas menores a 1280px y en modo Studio) */}
        {currentScreen === 'studio' && (
          <button
            onClick={() => toggleFlowDrawer()}
            className={`xl:hidden vision-btn !p-1.5 text-xs ${
              isFlowDrawerOpen ? 'vision-btn-primary' : ''
            }`}
            title="Abrir Flujo de Pasos"
            aria-label="Abrir Flujo de Pasos"
          >
            <span className="material-symbols-outlined text-[16px]">menu_open</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] shrink-0" />
          <span className="font-semibold text-xs tracking-tight text-primary hidden xs:inline">
            DevSculptor
          </span>
        </div>

        <div className="h-3 w-px bg-[var(--border-glass-subtle-color)] mx-0.5 hidden xs:block" />

        {/* Switch: Estudio vs Hub */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-black/5 dark:bg-white/[0.04] p-0.5 rounded-[7px] border border-glass-subtle">
          <button
            onClick={() => onNavigateScreen('studio')}
            className={`vision-btn !py-1 !px-2 sm:!px-2.5 text-[11px] ${
              currentScreen === 'studio' ? 'vision-btn-primary' : ''
            }`}
            title="Ir a Estudio"
          >
            <span className="material-symbols-outlined text-[13px]">grid_view</span>
            <span className="hidden sm:inline">Estudio</span>
          </button>
          <button
            onClick={() => onNavigateScreen('hub')}
            className={`vision-btn !py-1 !px-2 sm:!px-2.5 text-[11px] ${
              currentScreen === 'hub' ? 'vision-btn-primary' : ''
            }`}
            title="Ir a Proyectos"
          >
            <span className="material-symbols-outlined text-[13px]">folder_open</span>
            <span className="hidden sm:inline">Proyectos</span>
          </button>
        </div>
      </div>

      {/* Centro: Proyecto Activo */}
      <div className="hidden md:flex items-center gap-2 truncate max-w-xs lg:max-w-md">
        <span className="text-[11px] text-muted font-mono shrink-0">Proyecto:</span>
        <span className="font-semibold text-xs text-primary truncate">
          {activeProject ? activeProject.name : 'Sin proyecto'}
        </span>
        {activeProject && (
          <>
            {!activeProject.architecture_style ||
            activeProject.architecture_style === 'Por Definir / En Evaluación' ? (
              <span className="text-[9.5px] font-mono text-amber-500 dark:text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-[4px] border border-amber-400/20 inline-flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="hidden lg:inline">Arq. En Evaluación</span>
              </span>
            ) : (
              <span className="text-[9.5px] font-mono text-cyan-600 dark:text-cyan-300 bg-cyan-400/10 px-2 py-0.5 rounded-[4px] border border-cyan-400/20 inline-flex items-center gap-1 shrink-0">
                <span className="material-symbols-outlined text-[11px]">architecture</span>
                <span className="hidden lg:inline">{activeProject.architecture_style}</span>
              </span>
            )}
            <VisionPill variant="indigo" className="text-[8.5px] shrink-0 hidden lg:inline-flex">
              Pre-Código
            </VisionPill>
          </>
        )}
      </div>

      {/* Derecha: Persistencia, ThemeToggle, Copiloto Mobile & Perfil */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 font-mono text-xs">
        {/* Toggle de Copiloto en Mobile/Tablet */}
        {currentScreen === 'studio' && (
          <button
            onClick={() => toggleCopilotDrawer()}
            className={`xl:hidden vision-btn !py-1 !px-2 text-[11px] flex items-center gap-1 ${
              isCopilotDrawerOpen ? 'vision-btn-primary' : ''
            }`}
            title="Abrir Copiloto e Inspector"
            aria-label="Abrir Copiloto e Inspector"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="material-symbols-outlined text-[14px]">smart_toy</span>
            <span className="hidden md:inline">Copiloto</span>
          </button>
        )}

        {/* Badge de DB (Visible solo en desktop amplio) */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-[5px] bg-emerald-500/10 border border-emerald-500/20 text-[10.5px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-emerald-400 font-medium">PostgreSQL pg.Pool</span>
        </div>

        <div className="h-3 w-px bg-[var(--border-glass-subtle-color)] mx-0.5 hidden sm:block" />

        <ThemeToggle />

        {/* Avatar de Usuario y Cerrar Sesión */}
        <div className="flex items-center gap-1 sm:gap-2">
          <div
            className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-semibold text-[10px] shadow-sm cursor-default shrink-0"
            title={user ? `${user.full_name} (${user.email})` : 'Usuario'}
          >
            {getInitials(user?.full_name)}
          </div>
          <button
            onClick={logout}
            className="vision-btn vision-btn-icon text-muted hover:text-rose-400 !p-1"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
