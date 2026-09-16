import React from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProjectStore } from '@/stores/useProjectStore';
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

  const getInitials = (name?: string) => {
    if (!name) return 'DS';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="vision-window h-11 w-full shrink-0 px-4 flex items-center justify-between z-30 select-none">
      {/* Izquierda: Identidad & Switch de Pantallas */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
          <span className="font-semibold text-xs tracking-tight text-primary">DevSculptor</span>
        </div>

        <div className="h-3 w-px bg-[var(--border-glass-subtle-color)] mx-0.5" />

        {/* Switch: Estudio vs Hub */}
        <div className="flex items-center gap-1 bg-black/5 dark:bg-white/[0.04] p-0.5 rounded-[7px] border border-glass-subtle">
          <button
            onClick={() => onNavigateScreen('studio')}
            className={`vision-btn !py-1 !px-2.5 text-[11px] ${
              currentScreen === 'studio' ? 'vision-btn-primary' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">grid_view</span>
            <span>Estudio</span>
          </button>
          <button
            onClick={() => onNavigateScreen('hub')}
            className={`vision-btn !py-1 !px-2.5 text-[11px] ${
              currentScreen === 'hub' ? 'vision-btn-primary' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">folder_open</span>
            <span>Proyectos</span>
          </button>
        </div>
      </div>

      {/* Centro: Proyecto Activo */}
      <div className="hidden md:flex items-center gap-2">
        <span className="text-[11px] text-muted font-mono">Proyecto:</span>
        <span className="font-semibold text-xs text-primary">
          {activeProject ? activeProject.name : 'Sin proyecto seleccionado'}
        </span>
        <VisionPill variant="indigo" className="text-[8.5px]">
          Fase Pre-Código
        </VisionPill>
      </div>

      {/* Derecha: Persistencia, ThemeToggle y Perfil */}
      <div className="flex items-center gap-2.5 font-mono text-xs">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-[5px] bg-emerald-500/10 border border-emerald-500/20 text-[10.5px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-emerald-400 font-medium">PostgreSQL pg.Pool</span>
        </div>

        <div className="h-3 w-px bg-[var(--border-glass-subtle-color)] mx-0.5" />

        <ThemeToggle />

        {/* Avatar de Usuario y Cerrar Sesión */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-semibold text-[10px] shadow-sm cursor-default"
            title={user ? `${user.full_name} (${user.email})` : 'Usuario'}
          >
            {getInitials(user?.full_name)}
          </div>
          <button
            onClick={logout}
            className="vision-btn vision-btn-icon text-muted hover:text-rose-400"
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
