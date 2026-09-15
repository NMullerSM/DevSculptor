import React from 'react';
import { useThemeStore } from '@/stores/useThemeStore';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, nextWallpaper } = useThemeStore();

  return (
    <div className="flex items-center gap-1.5">
      {/* Botón de alternancia de Wallpaper escénico */}
      <button
        onClick={nextWallpaper}
        className="vision-btn vision-btn-icon"
        title="Cambiar fondo escénico (Montañas / Glaciar / Bosque / Aurora)"
        aria-label="Cambiar fondo"
      >
        <span className="material-symbols-outlined text-sm text-cyan-400">wallpaper</span>
      </button>

      {/* Botón Sol/Luna */}
      <button
        onClick={toggleTheme}
        className="vision-btn vision-btn-icon"
        title={theme === 'dark' ? 'Cambiar a Modo Claro (Sol)' : 'Cambiar a Modo Oscuro (Luna)'}
        aria-label="Alternar tema"
      >
        <span className="material-symbols-outlined text-sm text-amber-400">
          {theme === 'dark' ? 'dark_mode' : 'light_mode'}
        </span>
      </button>
    </div>
  );
};
