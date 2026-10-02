import { create } from 'zustand';
import { Project, CreateProjectPayload, UpdateProjectPayload } from '@/types/project.types';
import { ProjectMetrics } from '@/types/metrics.types';
import { projectsService } from '@/services/projects.service';
import { metricsService } from '@/services/metrics.service';
import { useAiChatStore } from './useAiChatStore';

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  metrics: ProjectMetrics | null;
  isLoading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  setActiveProject: (project: Project | null) => void;
  selectProjectById: (projectId: string) => Promise<void>;
  createProject: (payload: CreateProjectPayload) => Promise<Project>;
  updateProject: (projectId: string, payload: UpdateProjectPayload) => Promise<Project>;
  deleteProject: (projectId: string) => Promise<void>;
  fetchMetrics: (projectId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProject: null,
  metrics: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const { projects } = await projectsService.getAll(50, 0);
      set({ projects, isLoading: false });

      // Si no hay proyecto activo y hay proyectos, seleccionar el primero
      if (!get().activeProject && projects.length > 0) {
        get().setActiveProject(projects[0]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar proyectos';
      set({ error: message, isLoading: false });
    }
  },

  setActiveProject: (project: Project | null) => {
    set({ activeProject: project });
    if (project) {
      get().fetchMetrics(project.id);
    } else {
      set({ metrics: null });
    }
  },

  selectProjectById: async (projectId: string) => {
    set({ isLoading: true });
    try {
      const project = await projectsService.getById(projectId);
      set({ activeProject: project, isLoading: false });
      await get().fetchMetrics(project.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener proyecto';
      set({ error: message, isLoading: false });
    }
  },

  createProject: async (payload: CreateProjectPayload) => {
    set({ isLoading: true, error: null });
    try {
      const newProject = await projectsService.create(payload);
      set((state) => ({
        projects: [newProject, ...state.projects],
        activeProject: newProject,
        isLoading: false,
      }));
      await get().fetchMetrics(newProject.id);
      return newProject;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear proyecto';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  updateProject: async (projectId: string, payload: UpdateProjectPayload) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await projectsService.update(projectId, payload);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === projectId ? updated : p)),
        activeProject: state.activeProject?.id === projectId ? updated : state.activeProject,
        isLoading: false,
      }));
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar proyecto';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  deleteProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      await projectsService.delete(projectId);
      useAiChatStore.getState().removeProjectSession(projectId);
      set((state) => {
        const remaining = state.projects.filter((p) => p.id !== projectId);
        return {
          projects: remaining,
          activeProject: state.activeProject?.id === projectId ? (remaining[0] || null) : state.activeProject,
          isLoading: false,
        };
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar proyecto';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  fetchMetrics: async (projectId: string) => {
    try {
      const metrics = await metricsService.getProjectMetrics(projectId);
      set({ metrics });
    } catch {
      // Si el proyecto es nuevo o no tiene métricas, se mantendrá en null
    }
  },
}));
