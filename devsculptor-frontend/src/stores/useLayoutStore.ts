import { create } from 'zustand';

interface LayoutState {
  isFlowDrawerOpen: boolean;
  isCopilotDrawerOpen: boolean;
  toggleFlowDrawer: (force?: boolean) => void;
  toggleCopilotDrawer: (force?: boolean) => void;
  closeAllDrawers: () => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  isFlowDrawerOpen: false,
  isCopilotDrawerOpen: false,

  toggleFlowDrawer: (force?: boolean) =>
    set((state) => ({
      isFlowDrawerOpen: force !== undefined ? force : !state.isFlowDrawerOpen,
      // Si abre uno en pantallas muy estrechas, cerrar el otro
      isCopilotDrawerOpen: force === true || (force === undefined && !state.isFlowDrawerOpen) ? false : state.isCopilotDrawerOpen,
    })),

  toggleCopilotDrawer: (force?: boolean) =>
    set((state) => ({
      isCopilotDrawerOpen: force !== undefined ? force : !state.isCopilotDrawerOpen,
      isFlowDrawerOpen: force === true || (force === undefined && !state.isCopilotDrawerOpen) ? false : state.isFlowDrawerOpen,
    })),

  closeAllDrawers: () =>
    set({
      isFlowDrawerOpen: false,
      isCopilotDrawerOpen: false,
    }),
}));
