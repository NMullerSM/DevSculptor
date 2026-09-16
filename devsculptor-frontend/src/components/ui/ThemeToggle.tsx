import React from 'react';
import { useThemeStore } from '@/stores/useThemeStore';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, nextWallpaper } = useThemeStore();

  return (
    <div className="flex items-center gap-1.5">
      {/* Botón de alternancia de Wallpaper escénico */}
      <button
        onClick={nextWallpaper}
        className="vision-btn vision-btn-icon text-cyan-600 dark:text-cyan-400"
        title="Cambiar fondo escénico (Montañas / Glaciar / Bosque / Aurora)"
        aria-label="Cambiar fondo"
      >
        <span className="material-symbols-outlined text-[15px]">wallpaper</span>
      </button>

      {/* Switch Segmentado de Cápsula visionOS: [ ☀️ | 🌙 ] */}
      <div
        className="relative flex items-center bg-black/10 dark:bg-white/[0.08] p-0.5 rounded-full border border-[var(--border-glass-subtle-color)] shadow-inner select-none"
        role="group"
        aria-label="Selector de tema Claro / Oscuro"
      >
        {/* Pastilla deslizante indicadora del modo activo */}
        <div
          className={`absolute top-0.5 bottom-0.5 w-[26px] rounded-full transition-all duration-300 ease-out pointer-events-none ${
            theme === 'light'
              ? 'left-0.5 bg-white shadow-sm border border-black/5'
              : 'left-[29px] bg-indigo-500/35 shadow-[0_0_10px_rgba(99,102,241,0.6)] border border-indigo-400/40'
          }`}
        />

        {/* Botón Modo Claro (Sol) */}
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`relative z-10 w-[26px] h-[22px] flex items-center justify-center rounded-full transition-colors cursor-pointer ${
            theme === 'light'
              ? 'text-amber-500'
              : 'text-slate-400 hover:text-amber-500/80 dark:text-slate-400 dark:hover:text-amber-300'
          }`}
          title="Modo Claro (Snow Spatial Glass)"
          aria-pressed={theme === 'light'}
        >
          <span className="material-symbols-outlined text-[14px]">light_mode</span>
        </button>

        {/* Botón Modo Oscuro (Luna) */}
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`relative z-10 w-[26px] h-[22px] flex items-center justify-center rounded-full transition-colors cursor-pointer ${
            theme === 'dark'
              ? 'text-cyan-300'
              : 'text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400'
          }`}
          title="Modo Oscuro (Crystal Obsidian)"
          aria-pressed={theme === 'dark'}
        >
          <span className="material-symbols-outlined text-[14px]">dark_mode</span>
        </button>
      </div>
    </div>
  );
};
