import { create } from 'zustand';
import {
  AiChatMessage,
  AiChatResult,
  AiSuggestedRequirement,
  AiSuggestedEntity,
  AiSuggestedDecision,
  AiSuggestedDiagram,
  DevSculptorActions,
} from '@/types/ai.types';
import { aiService } from '@/services/ai.service';
import { requirementsService } from '@/services/requirements.service';
import { decisionsService } from '@/services/decisions.service';
import { useCanvasStore } from './useCanvasStore';
import { useProjectStore } from './useProjectStore';
import { okfService } from '@/services/okf.service';

export interface ProjectChatSession {
  messages: AiChatMessage[];
  injectedKeys: Record<string, boolean>;
  injectedDiagrams?: AiSuggestedDiagram[];
}

interface AiChatState {
  currentProjectId: string | null;
  sessions: Record<string, ProjectChatSession>;
  messages: AiChatMessage[];
  isLoading: boolean;
  error: string | null;
  injectedKeys: Record<string, boolean>;

  switchProject: (projectId: string) => void;
  removeProjectSession: (projectId: string) => void;
  sendMessage: (projectId: string, content: string, actionContext?: string) => Promise<void>;
  analyzeSchema: (projectId: string) => Promise<void>;
  suggestRequirements: (projectId: string, prompt: string) => Promise<void>;

  injectRequirement: (projectId: string, req: AiSuggestedRequirement) => Promise<void>;
  injectEntity: (projectId: string, entity: AiSuggestedEntity) => Promise<void>;
  injectDecision: (projectId: string, decision: AiSuggestedDecision) => Promise<void>;
  injectDiagram: (projectId: string, diagram: AiSuggestedDiagram) => Promise<void>;
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

const STORAGE_KEY = 'devsculptor_chat_sessions_v1';

const loadSessionsFromStorage = (): Record<string, ProjectChatSession> => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const saveSessionsToStorage = (sessions: Record<string, ProjectChatSession>) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Protección ante cuota o restricciones de almacenamiento en navegación privada
  }
};

const initialStoredSessions = loadSessionsFromStorage();

export const useAiChatStore = create<AiChatState>((set, get) => ({
  currentProjectId: null,
  sessions: initialStoredSessions,
  messages: [INITIAL_GREETING],
  isLoading: false,
  error: null,
  injectedKeys: {},

  switchProject: (projectId: string) => {
    if (!projectId) return;
    const { currentProjectId, sessions, messages, injectedKeys } = get();
    if (currentProjectId === projectId) return;

    const updatedSessions = { ...sessions };
    if (currentProjectId) {
      updatedSessions[currentProjectId] = {
        messages,
        injectedKeys,
      };
    }

    const targetSession: ProjectChatSession = updatedSessions[projectId] || {
      messages: [INITIAL_GREETING],
      injectedKeys: {},
    };
    updatedSessions[projectId] = targetSession;
    saveSessionsToStorage(updatedSessions);

    set({
      currentProjectId: projectId,
      sessions: updatedSessions,
      messages: targetSession.messages,
      injectedKeys: targetSession.injectedKeys,
      error: null,
      isLoading: false,
    });
  },

  removeProjectSession: (projectId: string) => {
    const { sessions, currentProjectId } = get();
    const updatedSessions = { ...sessions };
    delete updatedSessions[projectId];
    saveSessionsToStorage(updatedSessions);

    if (currentProjectId === projectId) {
      set({
        currentProjectId: null,
        sessions: updatedSessions,
        messages: [INITIAL_GREETING],
        injectedKeys: {},
      });
    } else {
      set({ sessions: updatedSessions });
    }
  },

  sendMessage: async (projectId: string, content: string, actionContext?: string) => {
    if (!content.trim()) return;

    if (get().currentProjectId !== projectId) {
      get().switchProject(projectId);
    }

    const userMessage: AiChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const updatedMessages = [...get().messages, userMessage];
    const interimSessions = {
      ...get().sessions,
      [projectId]: {
        messages: updatedMessages,
        injectedKeys: get().injectedKeys,
      },
    };
    saveSessionsToStorage(interimSessions);

    set({
      messages: updatedMessages,
      sessions: interimSessions,
      isLoading: true,
      error: null,
    });

    try {
      // Filtrar a historial relevante para enviar a la API (ventana deslizante de 30 mensajes max)
      const rawRelevant = updatedMessages
        .filter((m) => m.id !== 'msg-initial-greeting')
        .slice(-30);

      const historyPayload = rawRelevant.map((m) => {
        let safeContent = (m.content || '').trim();
        if (!safeContent) {
          safeContent = '(Mensaje sin contenido)';
        }
        if (safeContent.length > 16000) {
          safeContent = safeContent.slice(0, 16000) + '... [contenido truncado por longitud]';
        }
        const safeRole = m.role === 'user' ? 'user' : 'assistant';
        return {
          role: safeRole as 'user' | 'assistant',
          content: safeContent,
        };
      });

      const result: AiChatResult = await aiService.chat(projectId, {
        messages: historyPayload,
        actionContext,
      });

      const assistantMessage: AiChatMessage = {
        id: `msg-assistant-${Date.now()}`,
        role: 'assistant',
        content: result.reply || result.content || 'Sin respuesta del modelo.',
        provider: result.provider,
        model: result.model,
        actions: {
          requirements: result.actions?.requirements || result.suggestedRequirements,
          entities: result.actions?.entities || result.suggestedEntities,
          decisions: result.actions?.decisions || result.suggestedDecisions,
          diagrams: result.actions?.diagrams || result.suggestedDiagrams,
        },
        timestamp: Date.now(),
      };

      const finalMessages = [...get().messages, assistantMessage];
      const finalSessions = {
        ...get().sessions,
        [projectId]: {
          messages: finalMessages,
          injectedKeys: get().injectedKeys,
        },
      };
      saveSessionsToStorage(finalSessions);

      set({
        messages: finalMessages,
        sessions: finalSessions,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al consultar al arquitecto IA';
      set({ error: message, isLoading: false });
    }
  },

  analyzeSchema: async (projectId: string) => {
    if (get().currentProjectId !== projectId) {
      get().switchProject(projectId);
    }

    set({ isLoading: true, error: null });
    try {
      const result = await aiService.analyzeSchema(projectId);
      const assistantMessage: AiChatMessage = {
        id: `msg-schema-audit-${Date.now()}`,
        role: 'assistant',
        content: result.reply || result.content || 'Auditoría completada.',
        provider: result.provider,
        model: result.model,
        actions: result.actions || {
          requirements: result.suggestedRequirements,
          entities: result.suggestedEntities,
          decisions: result.suggestedDecisions,
          diagrams: result.suggestedDiagrams,
        },
        timestamp: Date.now(),
      };

      const finalMessages = [...get().messages, assistantMessage];
      const finalSessions = {
        ...get().sessions,
        [projectId]: {
          messages: finalMessages,
          injectedKeys: get().injectedKeys,
        },
      };
      saveSessionsToStorage(finalSessions);

      set({
        messages: finalMessages,
        sessions: finalSessions,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al auditar el esquema con IA';
      set({ error: message, isLoading: false });
    }
  },

  suggestRequirements: async (projectId: string, prompt: string) => {
    if (get().currentProjectId !== projectId) {
      get().switchProject(projectId);
    }

    set({ isLoading: true, error: null });
    try {
      const result = await aiService.suggestRequirements(projectId, prompt);
      const assistantMessage: AiChatMessage = {
        id: `msg-suggest-reqs-${Date.now()}`,
        role: 'assistant',
        content: result.reply || result.content || 'Requisitos sugeridos.',
        provider: result.provider,
        model: result.model,
        actions: result.actions || {
          requirements: result.suggestedRequirements,
          entities: result.suggestedEntities,
          decisions: result.suggestedDecisions,
          diagrams: result.suggestedDiagrams,
        },
        timestamp: Date.now(),
      };

      const finalMessages = [...get().messages, assistantMessage];
      const finalSessions = {
        ...get().sessions,
        [projectId]: {
          messages: finalMessages,
          injectedKeys: get().injectedKeys,
        },
      };
      saveSessionsToStorage(finalSessions);

      set({
        messages: finalMessages,
        sessions: finalSessions,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al sintetizar requisitos con IA';
      set({ error: message, isLoading: false });
    }
  },

  injectRequirement: async (projectId: string, req: AiSuggestedRequirement) => {
    if (get().currentProjectId !== projectId) {
      get().switchProject(projectId);
    }

    const key = `req:${req.code}`;
    if (get().injectedKeys[key]) return;

    const safePriority =
      (req.priority as string) === 'CRITICAL'
        ? 'HIGH'
        : (['HIGH', 'MEDIUM', 'LOW'].includes(req.priority) ? req.priority : 'MEDIUM');
    const safeType = req.type === 'RNF' ? 'RNF' : 'RF';

    await requirementsService.create(projectId, {
      code: req.code,
      title: req.title,
      type: safeType,
      priority: safePriority,
      description: req.description || '',
      entity_relation: req.entityRelation || [],
    });

    const updatedKeys = { ...get().injectedKeys, [key]: true };
    const updatedSessions = {
      ...get().sessions,
      [projectId]: {
        messages: get().messages,
        injectedKeys: updatedKeys,
      },
    };
    saveSessionsToStorage(updatedSessions);

    set({
      injectedKeys: updatedKeys,
      sessions: updatedSessions,
    });

    // Refrescar métricas del proyecto en tiempo real
    useProjectStore.getState().fetchMetrics(projectId);
  },

  injectEntity: async (projectId: string, entity: AiSuggestedEntity) => {
    if (get().currentProjectId !== projectId) {
      get().switchProject(projectId);
    }

    const key = `entity:${entity.tableName}`;
    if (get().injectedKeys[key]) return;

    // Hidratar el canvasStore desde la base de datos si no ha sido cargado previamente
    const canvasStore = useCanvasStore.getState();
    let existingEntities = canvasStore.entities;
    if (!existingEntities || existingEntities.length === 0) {
      try {
        await canvasStore.fetchEntities(projectId);
        existingEntities = useCanvasStore.getState().entities;
      } catch {
        existingEntities = [];
      }
    }

    // Prevención de duplicados en PostgreSQL
    const tableNorm = entity.tableName.toLowerCase().trim();
    if (existingEntities.some((e) => e.table_name.toLowerCase().trim() === tableNorm)) {
      const updatedKeys = { ...get().injectedKeys, [key]: true };
      set({ injectedKeys: updatedKeys });
      return;
    }

    const count = existingEntities.length;
    // Ubicación en cuadrícula limpia para no amontonar las tablas
    const posX = 40 + (count % 3) * 270;
    const posY = 40 + Math.floor(count / 3) * 250;

    const normalizedColumns = (entity.columns || []).map((col) => {
      const colRecord = col as unknown as Record<string, unknown>;
      let refTable = (
        colRecord.referencesTable ||
        colRecord.references_table ||
        colRecord.references ||
        colRecord.targetTable ||
        colRecord.target_table ||
        colRecord.refTable
      ) as string | undefined;

      if (typeof refTable === 'string') {
        refTable = refTable.replace(/["'`;]/g, '').trim().split('.').pop() || refTable;
      }

      const isPk = Boolean(colRecord.isPk ?? colRecord.is_pk ?? colRecord.isPrimary ?? (col.name.toLowerCase() === 'id'));
      let isFk = Boolean((colRecord.isFk ?? colRecord.is_fk) || refTable);

      if (!refTable && col.name && col.name.endsWith('_id') && col.name.toLowerCase() !== 'id') {
        isFk = true;
        const base = col.name.slice(0, -3).toLowerCase();
        const plural = base.endsWith('s') ? base : `${base}s`;
        const iesPlural = base.endsWith('y') ? `${base.slice(0, -1)}ies` : '';

        if (existingEntities.some((e) => e.table_name.toLowerCase() === base)) {
          refTable = base;
        } else if (existingEntities.some((e) => e.table_name.toLowerCase() === plural)) {
          refTable = plural;
        } else if (iesPlural && existingEntities.some((e) => e.table_name.toLowerCase() === iesPlural)) {
          refTable = iesPlural;
        } else {
          refTable = base === 'user' ? 'users' : plural;
        }
      }

      const isNullable =
        col.isNullable !== undefined
          ? Boolean(col.isNullable)
          : (colRecord.nullable !== undefined ? Boolean(colRecord.nullable) : !isPk);

      const isUnique =
        col.isUnique !== undefined
          ? Boolean(col.isUnique)
          : Boolean(colRecord.unique || colRecord.cardinality === '1:1');

      return {
        name: col.name,
        type: col.type || 'VARCHAR(255)',
        isPk,
        is_pk: isPk,
        isFk,
        is_fk: isFk,
        referencesTable: refTable || undefined,
        references_table: refTable || undefined,
        referencesColumn: (colRecord.referencesColumn || colRecord.references_column || (isFk ? 'id' : undefined)) as string | undefined,
        cardinality: ((colRecord.cardinality as '1:1' | '1:N' | 'N:M') || '1:N'),
        nullable: isNullable,
        unique: isUnique,
      };
    });

    await useCanvasStore.getState().createEntity(projectId, {
      table_name: entity.tableName,
      columns_json: normalizedColumns,
      position_x: posX,
      position_y: posY,
    });

    const updatedKeys = { ...get().injectedKeys, [key]: true };
    const updatedSessions = {
      ...get().sessions,
      [projectId]: {
        messages: get().messages,
        injectedKeys: updatedKeys,
      },
    };
    saveSessionsToStorage(updatedSessions);

    set({
      injectedKeys: updatedKeys,
      sessions: updatedSessions,
    });

    useProjectStore.getState().fetchMetrics(projectId);
  },

  injectDecision: async (projectId: string, decision: AiSuggestedDecision) => {
    if (get().currentProjectId !== projectId) {
      get().switchProject(projectId);
    }

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

    const updatedKeys = { ...get().injectedKeys, [key]: true };
    const updatedSessions = {
      ...get().sessions,
      [projectId]: {
        messages: get().messages,
        injectedKeys: updatedKeys,
      },
    };
    saveSessionsToStorage(updatedSessions);

    set({
      injectedKeys: updatedKeys,
      sessions: updatedSessions,
    });

    useProjectStore.getState().fetchMetrics(projectId);
  },

  injectDiagram: async (projectId: string, diagram: AiSuggestedDiagram) => {
    if (get().currentProjectId !== projectId) {
      get().switchProject(projectId);
    }

    const key = `diagram:${diagram.code}`;
    if (get().injectedKeys[key]) return;

    const updatedKeys = { ...get().injectedKeys, [key]: true };
    const currentSession = get().sessions[projectId] || {
      messages: get().messages,
      injectedKeys: get().injectedKeys,
      injectedDiagrams: [],
    };
    const existingDiagrams = currentSession.injectedDiagrams || [];
    const updatedDiagrams = [...existingDiagrams, diagram];

    const updatedSessions = {
      ...get().sessions,
      [projectId]: {
        ...currentSession,
        injectedKeys: updatedKeys,
        injectedDiagrams: updatedDiagrams,
      },
    };
    saveSessionsToStorage(updatedSessions);

    set({
      injectedKeys: updatedKeys,
      sessions: updatedSessions,
    });

    // Persistir el diagrama arquitectónico en la Bóveda OKF (PostgreSQL)
    try {
      const slug = diagram.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const canonicalPath = `02-architecture-diagrams/${slug || 'diagram'}.md`;
      const markdown = `# ${diagram.title}\n\n**Tipo:** ${diagram.type}\n**Formato:** Mermaid UML\n\n${diagram.description ? `${diagram.description}\n\n` : ''}\`\`\`mermaid\n${diagram.mermaidCode}\n\`\`\`\n`;

      await okfService.syncVault(projectId, [
        {
          documentId: diagram.code || `DIAG-${Date.now()}`,
          documentType: 'DIAGRAM',
          canonicalPath,
          title: diagram.title,
          tags: ['diagram', diagram.type, 'architecture', 'mermaid'],
          contentPreview: diagram.description || diagram.title,
          contentMarkdown: markdown,
          stateHash: `hash-${Date.now()}`,
          freshnessStatus: 'FRESH',
        },
      ]);
    } catch {
      // Ignorar errores no críticos de persistencia de diagrama
    }
  },

  injectAllActions: async (projectId: string, actions: DevSculptorActions) => {
    if (get().currentProjectId !== projectId) {
      get().switchProject(projectId);
    }

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
      // Ordenamiento topológico: tablas referenciadas van primero
      const entityMap = new Map<string, AiSuggestedEntity>();
      for (const ent of actions.entities) {
        entityMap.set(ent.tableName.toLowerCase(), ent);
      }

      const visited = new Set<string>();
      const orderedEntities: AiSuggestedEntity[] = [];

      const visit = (ent: AiSuggestedEntity) => {
        const tName = ent.tableName.toLowerCase();
        if (visited.has(tName)) return;
        visited.add(tName);

        for (const col of ent.columns || []) {
          const colRec = col as unknown as Record<string, unknown>;
          const ref = (col.referencesTable || col.references || colRec.targetTable) as string | undefined;
          if (ref) {
            const parent = entityMap.get(ref.toLowerCase());
            if (parent && parent.tableName.toLowerCase() !== tName) {
              visit(parent);
            }
          }
        }
        orderedEntities.push(ent);
      };

      for (const ent of actions.entities) {
        visit(ent);
      }

      for (const ent of orderedEntities) {
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

    if (actions.diagrams && actions.diagrams.length > 0) {
      for (const diag of actions.diagrams) {
        if (!get().injectedKeys[`diagram:${diag.code}`]) {
          await get().injectDiagram(projectId, diag);
          count++;
        }
      }
    }

    return count;
  },

  clearHistory: () => {
    const { currentProjectId, sessions } = get();
    const cleanSession: ProjectChatSession = {
      messages: [INITIAL_GREETING],
      injectedKeys: {},
      injectedDiagrams: [],
    };

    const updatedSessions = currentProjectId
      ? { ...sessions, [currentProjectId]: cleanSession }
      : sessions;

    if (currentProjectId) {
      saveSessionsToStorage(updatedSessions);
    }

    set({
      messages: cleanSession.messages,
      injectedKeys: cleanSession.injectedKeys,
      sessions: updatedSessions,
      error: null,
    });
  },

  isItemInjected: (key: string) => {
    return !!get().injectedKeys[key];
  },
}));
