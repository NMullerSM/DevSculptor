import { create } from 'zustand';
import {
  AiChatMessage,
  AiChatResult,
  AiSuggestedRequirement,
  AiSuggestedEntity,
  AiSuggestedDecision,
  DevSculptorActions,
} from '@/types/ai.types';
import { aiService } from '@/services/ai.service';
import { requirementsService } from '@/services/requirements.service';
import { decisionsService } from '@/services/decisions.service';
import { useCanvasStore } from './useCanvasStore';
import { useProjectStore } from './useProjectStore';

interface AiChatState {
  messages: AiChatMessage[];
  isLoading: boolean;
  error: string | null;
  injectedKeys: Record<string, boolean>;

  sendMessage: (projectId: string, content: string, actionContext?: string) => Promise<void>;
  analyzeSchema: (projectId: string) => Promise<void>;
  suggestRequirements: (projectId: string, prompt: string) => Promise<void>;

  injectRequirement: (projectId: string, req: AiSuggestedRequirement) => Promise<void>;
  injectEntity: (projectId: string, entity: AiSuggestedEntity) => Promise<void>;
  injectDecision: (projectId: string, decision: AiSuggestedDecision) => Promise<void>;
  injectAllActions: (projectId: string, actions: DevSculptorActions) => Promise<number>;

  clearHistory: () => void;
  isItemInjected: (key: string) => boolean;
}

const INITIAL_GREETING: AiChatMessage = {
  id: 'msg-initial-greeting',
  role: 'assistant',
  content:
    'Bienvenido a la sesión de consultoría técnica de DevSculptor. Como tu Arquitecto de Software Principal, estoy conectado en tiempo real a tus requisitos, modelos de datos del canvas y actas de decisión (ADRs).\n\n¿En qué módulo, regla de negocio o estrategia relacional trabajaremos hoy?',
  timestamp: Date.now(),
};

export const useAiChatStore = create<AiChatState>((set, get) => ({
  messages: [INITIAL_GREETING],
  isLoading: false,
  error: null,
  injectedKeys: {},

  sendMessage: async (projectId: string, content: string, actionContext?: string) => {
    if (!content.trim()) return;

    const userMessage: AiChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const updatedMessages = [...get().messages, userMessage];
    set({ messages: updatedMessages, isLoading: true, error: null });

    try {
      // Filtrar a historial relevante para enviar a la API
      const historyPayload = updatedMessages
        .filter((m) => m.id !== 'msg-initial-greeting')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const result: AiChatResult = await aiService.chat(projectId, {
        messages: historyPayload,
        actionContext,
      });

      const assistantMessage: AiChatMessage = {
        id: `msg-assistant-${Date.now()}`,
        role: 'assistant',
        content: result.reply,
        provider: result.provider,
        model: result.model,
        actions: result.actions,
        timestamp: Date.now(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al consultar al arquitecto IA';
      set({ error: message, isLoading: false });
    }
  },

  analyzeSchema: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await aiService.analyzeSchema(projectId);
      const assistantMessage: AiChatMessage = {
        id: `msg-schema-audit-${Date.now()}`,
        role: 'assistant',
        content: result.reply,
        provider: result.provider,
        model: result.model,
        actions: result.actions,
        timestamp: Date.now(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al auditar el esquema con IA';
      set({ error: message, isLoading: false });
    }
  },

  suggestRequirements: async (projectId: string, prompt: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await aiService.suggestRequirements(projectId, prompt);
      const assistantMessage: AiChatMessage = {
        id: `msg-suggest-reqs-${Date.now()}`,
        role: 'assistant',
        content: result.reply,
        provider: result.provider,
        model: result.model,
        actions: result.actions,
        timestamp: Date.now(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al sintetizar requisitos con IA';
      set({ error: message, isLoading: false });
    }
  },

  injectRequirement: async (projectId: string, req: AiSuggestedRequirement) => {
    const key = `req:${req.code}`;
    if (get().injectedKeys[key]) return;

    await requirementsService.create(projectId, {
      code: req.code,
      title: req.title,
      type: req.type,
      priority: req.priority,
      description: req.description || '',
    });

    set((state) => ({
      injectedKeys: { ...state.injectedKeys, [key]: true },
    }));

    // Refrescar métricas del proyecto en tiempo real
    useProjectStore.getState().fetchMetrics(projectId);
  },

  injectEntity: async (projectId: string, entity: AiSuggestedEntity) => {
    const key = `entity:${entity.tableName}`;
    if (get().injectedKeys[key]) return;

    const offset = Math.floor(Math.random() * 120);
    await useCanvasStore.getState().createEntity(projectId, {
      table_name: entity.tableName,
      columns_json: entity.columns,
      position_x: 220 + offset,
      position_y: 120 + offset,
    });

    set((state) => ({
      injectedKeys: { ...state.injectedKeys, [key]: true },
    }));

    useProjectStore.getState().fetchMetrics(projectId);
  },

  injectDecision: async (projectId: string, decision: AiSuggestedDecision) => {
    const key = `decision:${decision.code}`;
    if (get().injectedKeys[key]) return;

    await decisionsService.create(projectId, {
      code: decision.code,
      title: decision.title,
      status: decision.status,
      context: decision.context || 'Contexto analizado por consultor IA',
      decision: decision.decision || 'Decisión recomendada por buenas prácticas',
      consequences: decision.consequences || 'Mitigación de riesgos y consistencia técnica',
    });

    set((state) => ({
      injectedKeys: { ...state.injectedKeys, [key]: true },
    }));

    useProjectStore.getState().fetchMetrics(projectId);
  },

  injectAllActions: async (projectId: string, actions: DevSculptorActions) => {
    let count = 0;

    if (actions.requirements && actions.requirements.length > 0) {
      for (const req of actions.requirements) {
        if (!get().injectedKeys[`req:${req.code}`]) {
          await get().injectRequirement(projectId, req);
          count++;
        }
      }
    }

    if (actions.entities && actions.entities.length > 0) {
      for (const ent of actions.entities) {
        if (!get().injectedKeys[`entity:${ent.tableName}`]) {
          await get().injectEntity(projectId, ent);
          count++;
        }
      }
    }

    if (actions.decisions && actions.decisions.length > 0) {
      for (const dec of actions.decisions) {
        if (!get().injectedKeys[`decision:${dec.code}`]) {
          await get().injectDecision(projectId, dec);
          count++;
        }
      }
    }

    return count;
  },

  clearHistory: () => {
    set({
      messages: [INITIAL_GREETING],
      injectedKeys: {},
      error: null,
    });
  },

  isItemInjected: (key: string) => {
    return !!get().injectedKeys[key];
  },
}));
