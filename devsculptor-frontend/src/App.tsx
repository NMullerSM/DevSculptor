import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { WallpaperCanvas } from '@/components/layout/WallpaperCanvas';
import { AppleTopBar } from '@/components/layout/AppleTopBar';
import { AuthPortal } from '@/features/auth/AuthPortal';
import { ProjectsHub } from '@/features/projects/ProjectsHub';
import { StudioWorkspace } from '@/features/studio/StudioWorkspace';
import { Project } from '@/types/project.types';

export const App: React.FC = () => {
  const { user, token, initAuth, logout } = useAuthStore();
  const { currentWallpaperUrl, initTheme } = useThemeStore();
  const { setActiveProject, fetchProjects } = useProjectStore();

  const [currentScreen, setCurrentScreen] = useState<'studio' | 'hub'>('studio');

  // Inicialización de autenticación y tema en el montaje
  useEffect(() => {
    initAuth();
    initTheme();

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [initAuth, initTheme, logout]);

  // Si está autenticado, cargar proyectos
  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token, fetchProjects]);

  // Pantalla 0: Portal de Acceso y Autenticación
  if (!token || !user) {
    return (
      <div className="h-screen w-screen relative overflow-hidden flex flex-col">
        <WallpaperCanvas currentWallpaperUrl={currentWallpaperUrl} />
        <AuthPortal />
      </div>
    );
  }

  const handleOpenProject = (project: Project) => {
    setActiveProject(project);
    setCurrentScreen('studio');
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden flex flex-col p-3 gap-3">
      {/* 1. Fondo Escénico de Vidrio Multicapa */}
      <WallpaperCanvas currentWallpaperUrl={currentWallpaperUrl} />

      {/* 2. Barra Superior Flotante Apple Glass */}
      <AppleTopBar
        currentScreen={currentScreen}
        onNavigateScreen={(screen) => setCurrentScreen(screen)}
      />

      {/* 3. Contenido Principal */}
      {currentScreen === 'studio' ? (
        <StudioWorkspace />
      ) : (
        <ProjectsHub onOpenProject={handleOpenProject} />
      )}
    </div>
  );
};

export default App;
