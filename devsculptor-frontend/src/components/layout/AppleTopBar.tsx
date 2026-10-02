import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { UserSecurityModal } from '@/features/auth/UserSecurityModal';

interface AppleTopBarProps {
  currentScreen: 'studio' | 'hub' | 'admin';
  onNavigateScreen: (screen: 'studio' | 'hub' | 'admin') => void;
}

export const AppleTopBar: React.FC<AppleTopBarProps> = ({
  currentScreen,
  onNavigateScreen,
}) => {
  const { user, logout } = useAuthStore();
  const { activeProject } = useProjectStore();
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
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

        {/* Acceso Exclusivo Superadmin: Consola Maestra */}
        {user?.role === 'SUPERADMIN' && (
          <button
            onClick={() => onNavigateScreen('admin')}
            className={`vision-btn !py-1 !px-2 sm:!px-2.5 text-[11px] flex items-center gap-1.5 transition-all ${
              currentScreen === 'admin'
                ? '!bg-amber-500/20 !border-amber-500/60 !text-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.35)]'
                : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/25 bg-amber-500/5'
            }`}
            title="Consola de Gobernanza y Administrador Maestro"
          >
            <span className="material-symbols-outlined text-[14px] text-amber-400">shield_person</span>
            <span className="hidden sm:inline font-semibold tracking-wide">Consola Maestra</span>
          </button>
        )}
      </div>

      {/* Centro: Nombre Limpio del Proyecto Activo */}
      <div className="hidden md:flex items-center gap-2 truncate max-w-xs lg:max-w-md">
        <span className="font-semibold text-xs text-primary truncate tracking-wide">
          {activeProject ? activeProject.name : 'Sin proyecto seleccionado'}
        </span>
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

        <div className="h-3 w-px bg-[var(--border-glass-subtle-color)] mx-0.5 hidden sm:block" />

        <ThemeToggle />

        {/* Avatar de Usuario y Cerrar Sesión */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setIsSecurityModalOpen(true)}
            className="flex items-center gap-1.5 vision-btn !py-0.5 !px-1.5 text-xs text-secondary hover:text-primary transition-all group"
            title={user ? `${user.full_name} (${user.email}) - Click para gestionar Seguridad & 2FA` : 'Seguridad'}
          >
            <div
              className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-semibold text-[9.5px] shadow-sm shrink-0 group-hover:scale-105 transition-transform"
            >
              {getInitials(user?.full_name)}
            </div>
            {user?.mfa_enabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="2FA Activo" />
            )}
            <span className="material-symbols-outlined text-[13px] text-muted group-hover:text-primary">
              security
            </span>
          </button>

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

      {/* Modal de Seguridad y 2FA */}
      <UserSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </header>
  );
};
