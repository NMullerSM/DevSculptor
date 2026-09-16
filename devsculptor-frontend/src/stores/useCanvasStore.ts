import { create } from 'zustand';
import { CanvasEntity, CreateCanvasEntityPayload, UpdateCanvasEntityPayload, AuditLogEntry } from '@/types/canvas.types';
import { canvasService } from '@/services/canvas.service';

export type CanvasSubTab = 'erd' | 'sql' | 'ts' | 'json' | 'py' | 'audit';

interface CanvasState {
  entities: CanvasEntity[];
  selectedEntityId: string | null;
  activeSubTab: CanvasSubTab;
  zoom: number;
  auditLogs: AuditLogEntry[];
  isLoading: boolean;
  error: string | null;

  fetchEntities: (projectId: string) => Promise<void>;
  selectEntity: (id: string | null) => void;
  setActiveSubTab: (tab: CanvasSubTab) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setTransientPosition: (entityId: string, x: number, y: number) => void;
  updatePosition: (projectId: string, entityId: string, x: number, y: number) => Promise<void>;
  createEntity: (projectId: string, payload: CreateCanvasEntityPayload) => Promise<CanvasEntity>;
  updateEntity: (projectId: string, entityId: string, payload: UpdateCanvasEntityPayload) => Promise<CanvasEntity>;
  deleteEntity: (projectId: string, entityId: string) => Promise<void>;
  fetchAuditLogs: (projectId: string) => Promise<void>;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  entities: [],
  selectedEntityId: null,
  activeSubTab: 'erd',
  zoom: 1,
  auditLogs: [],
  isLoading: false,
  error: null,

  fetchEntities: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const entities = await canvasService.getAllByProject(projectId);
      set({ entities, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar entidades del canvas';
      set({ error: message, isLoading: false });
    }
  },

  selectEntity: (id: string | null) => set({ selectedEntityId: id }),

  setActiveSubTab: (tab: CanvasSubTab) => set({ activeSubTab: tab }),

  setZoom: (zoom: number) => set({ zoom: Math.max(0.3, Math.min(2.0, zoom)) }),

  zoomIn: () => set((state) => ({ zoom: Math.min(2.0, state.zoom + 0.1) })),

  zoomOut: () => set((state) => ({ zoom: Math.max(0.4, state.zoom - 0.1) })),

  resetZoom: () => set({ zoom: 1 }),

  setTransientPosition: (entityId: string, x: number, y: number) => {
    set((state) => ({
      entities: state.entities.map((e) =>
        e.id === entityId ? { ...e, position_x: x, position_y: y } : e
      ),
    }));
  },

  updatePosition: async (projectId: string, entityId: string, x: number, y: number) => {
    // 1. Actualización optimista instantánea para 60 FPS
    set((state) => ({
      entities: state.entities.map((e) =>
        e.id === entityId ? { ...e, position_x: x, position_y: y } : e
      ),
    }));

    // 2. Persistencia en backend (activa trigger de auditoría)
    try {
      await canvasService.updateEntity(projectId, entityId, {
        position_x: x,
        position_y: y,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al persistir posición del nodo';
      set({ error: message });
    }
  },

  createEntity: async (projectId: string, payload: CreateCanvasEntityPayload) => {
    set({ isLoading: true });
    try {
      const created = await canvasService.createEntity(projectId, payload);
      set((state) => ({
        entities: [...state.entities, created],
        isLoading: false,
      }));
      return created;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear tabla';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  updateEntity: async (projectId: string, entityId: string, payload: UpdateCanvasEntityPayload) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await canvasService.updateEntity(projectId, entityId, payload);
      set((state) => ({
        entities: state.entities.map((e) => (e.id === entityId ? updated : e)),
        isLoading: false,
      }));
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar tabla';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  deleteEntity: async (projectId: string, entityId: string) => {
    try {
      await canvasService.deleteEntity(projectId, entityId);
      set((state) => ({
        entities: state.entities.filter((e) => e.id !== entityId),
        selectedEntityId: state.selectedEntityId === entityId ? null : state.selectedEntityId,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar tabla';
      set({ error: message });
      throw err;
    }
  },

  fetchAuditLogs: async (projectId: string) => {
    try {
      const logs = await canvasService.getAuditLogs(projectId);
      set({ auditLogs: logs });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener audit logs';
      set({ error: message });
    }
  },
}));
