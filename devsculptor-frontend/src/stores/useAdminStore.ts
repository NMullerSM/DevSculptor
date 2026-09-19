import { create } from 'zustand';
import {
  AdminTab,
  PlatformStats,
  GlobalVaultFile,
  AuditLogEntry,
  AdminUserItem,
  CreateVaultFilePayload,
} from '@/types/admin.types';
import { adminService } from '@/services/admin.service';

interface AdminState {
  activeTab: AdminTab;
  stats: PlatformStats | null;
  vaultFiles: GlobalVaultFile[];
  selectedFile: GlobalVaultFile | null;
  fileContentBuffer: string;
  isDirty: boolean;
  previewMarkdown: boolean;
  auditLogs: AuditLogEntry[];
  auditFilterEntity: string;
  users: AdminUserItem[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  feedbackMessage: { type: 'success' | 'error'; text: string } | null;

  // Acciones UI
  setActiveTab: (tab: AdminTab) => void;
  setFileContentBuffer: (content: string) => void;
  setPreviewMarkdown: (show: boolean) => void;
  setAuditFilterEntity: (entity: string) => void;
  setFeedbackMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
  clearFeedback: () => void;

  // Acciones Asíncronas
  fetchStats: () => Promise<void>;
  fetchVaultFiles: () => Promise<void>;
  selectVaultFile: (file: GlobalVaultFile) => Promise<void>;
  saveCurrentVaultFile: () => Promise<void>;
  createVaultFile: (payload: CreateVaultFilePayload) => Promise<void>;
  deleteVaultFile: (path: string) => Promise<void>;
  fetchAuditLogs: (entity?: string) => Promise<void>;
  fetchUsers: () => Promise<void>;
  updateUserRole: (userId: string, role: 'USER' | 'ADMIN' | 'SUPERADMIN') => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  activeTab: 'vault',
  stats: null,
  vaultFiles: [],
  selectedFile: null,
  fileContentBuffer: '',
  isDirty: false,
  previewMarkdown: false,
  auditLogs: [],
  auditFilterEntity: '',
  users: [],
  isLoading: false,
  isSaving: false,
  error: null,
  feedbackMessage: null,

  setActiveTab: (tab: AdminTab) => {
    set({ activeTab: tab, error: null });
    if (tab === 'stats') {
      get().fetchStats();
    } else if (tab === 'vault' && get().vaultFiles.length === 0) {
      get().fetchVaultFiles();
    } else if (tab === 'audit') {
      get().fetchAuditLogs();
    } else if (tab === 'users') {
      get().fetchUsers();
    }
  },

  setFileContentBuffer: (content: string) => {
    const selected = get().selectedFile;
    const isDirty = selected ? selected.content !== content : false;
    set({ fileContentBuffer: content, isDirty });
  },

  setPreviewMarkdown: (show: boolean) => {
    set({ previewMarkdown: show });
  },

  setAuditFilterEntity: (entity: string) => {
    set({ auditFilterEntity: entity });
    get().fetchAuditLogs(entity || undefined);
  },

  setFeedbackMessage: (msg: { type: 'success' | 'error'; text: string } | null) => {
    set({ feedbackMessage: msg });
  },

  clearFeedback: () => {
    set({ feedbackMessage: null });
  },

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const stats = await adminService.getPlatformStats();
      set({ stats, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar telemetría';
      set({ error: msg, isLoading: false });
    }
  },

  fetchVaultFiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const vaultFiles = await adminService.listGlobalVaultFiles();
      set({ vaultFiles, isLoading: false });

      // Si no hay archivo seleccionado y existen archivos, cargar el primero
      if (!get().selectedFile && vaultFiles.length > 0) {
        await get().selectVaultFile(vaultFiles[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar archivos de bóveda';
      set({ error: msg, isLoading: false });
    }
  },

  selectVaultFile: async (file: GlobalVaultFile) => {
    set({ isLoading: true, error: null });
    try {
      const filePath = file.path || file.file_path || '';
      const fullFile = await adminService.getVaultFile(filePath);
      set({
        selectedFile: fullFile,
        fileContentBuffer: fullFile.content || '',
        isDirty: false,
        isLoading: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al abrir archivo';
      set({ error: msg, isLoading: false });
    }
  },

  saveCurrentVaultFile: async () => {
    const { selectedFile, fileContentBuffer } = get();
    if (!selectedFile) return;

    set({ isSaving: true, error: null });
    try {
      const filePath = selectedFile.path || selectedFile.file_path || '';
      const updated = await adminService.saveVaultFile({
        path: filePath,
        content: fileContentBuffer,
        description: selectedFile.description,
      });

      const updatedPath = updated.path || updated.file_path;

      // Actualizar archivo seleccionado y lista de archivos
      set((state) => ({
        selectedFile: updated,
        fileContentBuffer: updated.content || fileContentBuffer,
        isDirty: false,
        isSaving: false,
        vaultFiles: state.vaultFiles.map((f) => ((f.path || f.file_path) === updatedPath ? updated : f)),
        feedbackMessage: {
          type: 'success',
          text: `Artefacto "${updated.title}" guardado y sincronizado con éxito.`,
        },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar archivo en bóveda';
      set({
        error: msg,
        isSaving: false,
        feedbackMessage: { type: 'error', text: msg },
      });
    }
  },

  createVaultFile: async (payload: CreateVaultFilePayload) => {
    set({ isSaving: true, error: null });
    try {
      const newFile = await adminService.createVaultFile(payload);
      set((state) => ({
        vaultFiles: [newFile, ...state.vaultFiles],
        selectedFile: newFile,
        fileContentBuffer: newFile.content || payload.content,
        isDirty: false,
        isSaving: false,
        feedbackMessage: {
          type: 'success',
          text: `Nuevo artefacto "${newFile.title}" aprovisionado con éxito.`,
        },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear archivo';
      set({
        error: msg,
        isSaving: false,
        feedbackMessage: { type: 'error', text: msg },
      });
      throw err;
    }
  },

  deleteVaultFile: async (path: string) => {
    set({ isLoading: true, error: null });
    try {
      await adminService.deleteVaultFile(path);
      const remaining = get().vaultFiles.filter((f) => (f.path || f.file_path) !== path);
      set({
        vaultFiles: remaining,
        selectedFile: remaining.length > 0 ? remaining[0] : null,
        fileContentBuffer: remaining.length > 0 ? remaining[0].content || '' : '',
        isDirty: false,
        isLoading: false,
        feedbackMessage: {
          type: 'success',
          text: `Artefacto eliminado de la bóveda global.`,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar archivo';
      set({ error: msg, isLoading: false });
    }
  },

  fetchAuditLogs: async (entity?: string) => {
    set({ isLoading: true, error: null });
    try {
      const auditLogs = await adminService.getAuditLogs({
        limit: 100,
        offset: 0,
        entity: entity || undefined,
      });
      set({ auditLogs, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar registros de auditoría';
      set({ error: msg, isLoading: false });
    }
  },

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const users = await adminService.listUsers();
      set({ users, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar usuarios';
      set({ error: msg, isLoading: false });
    }
  },

  updateUserRole: async (userId: string, role: 'USER' | 'ADMIN' | 'SUPERADMIN') => {
    set({ isLoading: true, error: null });
    try {
      const updated = await adminService.updateUserRole(userId, role);
      set((state) => ({
        users: state.users.map((u) => (u.id === userId ? updated : u)),
        isLoading: false,
        feedbackMessage: {
          type: 'success',
          text: `Rol de ${updated.full_name} actualizado a ${updated.role}.`,
        },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar rol de usuario';
      set({ error: msg, isLoading: false });
    }
  },
}));
