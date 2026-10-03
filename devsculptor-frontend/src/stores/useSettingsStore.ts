import { create } from 'zustand';
import { apiClient } from '@/services/apiClient';
import { useThemeStore } from './useThemeStore';

export type AiProvider = 'openrouter' | 'gemini' | 'openai' | 'deepseek' | 'anthropic' | 'groq' | 'custom';

export interface RegisteredAiModel {
  id: string;
  name: string;
  provider: AiProvider;
  contextWindow: number;
  isFree: boolean;
  badge?: string;
  description?: string;
  baseUrl?: string;
  isCustom?: boolean;
}

export const DEFAULT_AI_MODELS: RegisteredAiModel[] = [
  // Modelo Oficial Predeterminado del Servidor (Sin requerir API Key propia)
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Google Gemini 3.1 Flash Lite',
    provider: 'gemini',
    contextWindow: 1000000,
    isFree: true,
    badge: 'INCLUIDO (SERVIDOR)',
    description: 'Modelo oficial predeterminado de DevSculptor. Funciona directamente sin requerir API Key del usuario.',
  },

  // Modelos OpenRouter (Requieren API Key propia de OpenRouter en Mis API Keys)
  {
    id: 'openrouter/free',
    name: 'OpenRouter Free Smart Router',
    provider: 'openrouter',
    contextWindow: 128000,
    isFree: false,
    badge: 'REQUIERE OPENROUTER',
    description: 'Enrutador de OpenRouter. Requiere configurar tu API Key propia en Perfil > Mis API Keys.',
  },
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek R1 (OpenRouter)',
    provider: 'openrouter',
    contextWindow: 128000,
    isFree: false,
    badge: 'REQUIERE OPENROUTER',
    description: 'Razonamiento profundo (CoT). Requiere configurar tu API Key de OpenRouter.',
  },
  {
    id: 'deepseek/deepseek-chat:free',
    name: 'DeepSeek V3 (OpenRouter)',
    provider: 'openrouter',
    contextWindow: 128000,
    isFree: false,
    badge: 'REQUIERE OPENROUTER',
    description: 'Modelo 671B parámetros. Requiere configurar tu API Key de OpenRouter.',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Meta Llama 3.3 70B (OpenRouter)',
    provider: 'openrouter',
    contextWindow: 128000,
    isFree: false,
    badge: 'REQUIERE OPENROUTER',
    description: 'Modelo insignia de Meta. Requiere configurar tu API Key de OpenRouter.',
  },
  {
    id: 'qwen/qwen-2.5-coder-32b-instruct:free',
    name: 'Qwen 2.5 Coder 32B (OpenRouter)',
    provider: 'openrouter',
    contextWindow: 128000,
    isFree: false,
    badge: 'REQUIERE OPENROUTER',
    description: 'Especializado en código y diagramas. Requiere configurar tu API Key de OpenRouter.',
  },
  {
    id: 'mistralai/mistral-small-24b-instruct-2501:free',
    name: 'Mistral Small 24B (OpenRouter)',
    provider: 'openrouter',
    contextWindow: 32000,
    isFree: false,
    badge: 'REQUIERE OPENROUTER',
    description: 'Modelo compacto europeo. Requiere configurar tu API Key de OpenRouter.',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Google Gemini 2.0 Flash',
    provider: 'gemini',
    contextWindow: 1000000,
    isFree: false,
    badge: 'MULTIMODAL',
    description: 'Inferencia nativa de Google con gran capacidad analítica.',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Google Gemini 2.5 Pro',
    provider: 'gemini',
    contextWindow: 2000000,
    isFree: false,
    badge: 'PRO',
    description: 'Máxima capacidad cognitiva de Google para proyectos de escala corporativa.',
  },

  // DeepSeek Directo
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3 (Directo)',
    provider: 'deepseek',
    contextWindow: 64000,
    isFree: false,
    badge: 'ECONÓMICO',
    description: 'Acceso directo a la API oficial de DeepSeek con máxima velocidad.',
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek R1 (Directo)',
    provider: 'deepseek',
    contextWindow: 64000,
    isFree: false,
    badge: 'RAZONAMIENTO',
    description: 'Modo de pensamiento deliberativo para verificación de restricciones de integridad.',
  },

  // OpenAI Directo
  {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o Omni',
    provider: 'openai',
    contextWindow: 128000,
    isFree: false,
    badge: 'ESTÁNDAR',
    description: 'Modelo omnicanal insignia de OpenAI, estándar de la industria.',
  },
  {
    id: 'gpt-4o-mini',
    name: 'OpenAI GPT-4o Mini',
    provider: 'openai',
    contextWindow: 128000,
    isFree: false,
    badge: 'RÁPIDO',
    description: 'Versión ligera, económica y de alto rendimiento.',
  },
  {
    id: 'o3-mini',
    name: 'OpenAI o3-mini',
    provider: 'openai',
    contextWindow: 200000,
    isFree: false,
    badge: 'RAZONAMIENTO',
    description: 'Razonamiento lógico especializado en matemáticas e ingeniería de software.',
  },

  // Anthropic Claude
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet (Hybrid)',
    provider: 'anthropic',
    contextWindow: 200000,
    isFree: false,
    badge: 'ESTADO DEL ARTE',
    description: 'Modelo de razonamiento híbrido de última generación de Anthropic.',
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    contextWindow: 200000,
    isFree: false,
    badge: 'RÁPIDO',
    description: 'Respuesta instantánea para tareas de edición y síntesis.',
  },
];

export const WALLPAPER_PRESETS = [
  {
    id: 'silicon-sunset',
    name: 'Silicon Valley Sunset',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'neon-architecture',
    name: 'Neon Glass Flow',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2564&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'dark-horizon',
    name: 'Dark Horizon Minimal',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=2564&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'deep-space-glass',
    name: 'Deep Obsidian Void',
    url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2564&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=300&auto=format&fit=crop',
  },
];

interface SettingsState {
  // BYOK & IA
  provider: 'openrouter' | 'gemini' | 'openai' | 'deepseek' | 'anthropic' | 'groq' | 'custom';
  apiKeys: Record<string, string>;
  selectedModelId: string;
  customModels: RegisteredAiModel[];
  customEndpointUrl: string;

  // Preferencias de Usuario (Secundario)
  currentWallpaperUrl: string;
  customWallpaperUrl: string;
  glassBlur: number;

  // Gobernanza
  reqCodePrefix: 'RF' | 'REQ' | 'US';
  strict3FN: boolean;

  // Acciones
  setProvider: (provider: SettingsState['provider']) => void;
  setApiKey: (provider: string, key: string) => void;
  setSelectedModelId: (modelId: string) => void;
  setCustomEndpointUrl: (url: string) => void;
  addCustomModel: (model: Omit<RegisteredAiModel, 'isCustom'>) => void;
  removeCustomModel: (modelId: string) => void;
  getAllModels: () => RegisteredAiModel[];

  setWallpaper: (url: string) => void;
  setCustomWallpaper: (url: string) => void;
  setGlassBlur: (blur: number) => void;
  setGovernancePrefix: (prefix: 'RF' | 'REQ' | 'US') => void;
  setStrict3FN: (strict: boolean) => void;

  pingTest: (projectId: string) => Promise<{ success: boolean; latencyMs: number; message: string; model: string }>;
  getActiveApiKey: () => string | undefined;
}

const STORAGE_KEY = 'devsculptor_user_settings_v2';

const loadPersistedSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const syncByokToLocalStorage = (
  provider: string,
  key: string,
  model: string,
  endpoint?: string
) => {
  try {
    if (key && key.trim().length > 0) {
      localStorage.setItem('devsculptor_active_ai_key', key.trim());
      localStorage.setItem('devsculptor_active_ai_provider', provider);
      localStorage.setItem('devsculptor_active_ai_model', model);
      if (endpoint) {
        localStorage.setItem('devsculptor_active_ai_endpoint', endpoint);
      } else {
        localStorage.removeItem('devsculptor_active_ai_endpoint');
      }
    } else {
      localStorage.removeItem('devsculptor_active_ai_key');
      localStorage.removeItem('devsculptor_active_ai_provider');
      localStorage.removeItem('devsculptor_active_ai_model');
      localStorage.removeItem('devsculptor_active_ai_endpoint');
    }
  } catch {
    // Ignore storage issues
  }
};

const persisted = loadPersistedSettings();

export const useSettingsStore = create<SettingsState>((set, get) => ({
  provider: persisted?.provider || 'gemini',
  apiKeys: persisted?.apiKeys || {},
  selectedModelId: persisted?.selectedModelId || 'gemini-3.1-flash-lite',
  customModels: persisted?.customModels || [],
  customEndpointUrl: persisted?.customEndpointUrl || '',

  currentWallpaperUrl: persisted?.currentWallpaperUrl || WALLPAPER_PRESETS[0].url,
  customWallpaperUrl: persisted?.customWallpaperUrl || '',
  glassBlur: persisted?.glassBlur || 20,

  reqCodePrefix: persisted?.reqCodePrefix || 'RF',
  strict3FN: persisted?.strict3FN ?? true,

  setProvider: (provider) => {
    set((state) => {
      const next = { ...state, provider };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      const key = next.apiKeys[provider] || '';
      syncByokToLocalStorage(provider, key, next.selectedModelId, next.customEndpointUrl);
      return next;
    });
  },

  setApiKey: (provider, key) => {
    set((state) => {
      const updatedKeys = { ...state.apiKeys, [provider]: key };
      const next = { ...state, apiKeys: updatedKeys };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (state.provider === provider) {
        syncByokToLocalStorage(provider, key, state.selectedModelId, state.customEndpointUrl);
      }
      return next;
    });
  },

  setSelectedModelId: (modelId) => {
    set((state) => {
      const next = { ...state, selectedModelId: modelId };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      const key = next.apiKeys[state.provider] || '';
      syncByokToLocalStorage(state.provider, key, modelId, state.customEndpointUrl);
      return next;
    });
  },

  setCustomEndpointUrl: (url) => {
    set((state) => {
      const next = { ...state, customEndpointUrl: url };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      const key = next.apiKeys[state.provider] || '';
      syncByokToLocalStorage(state.provider, key, state.selectedModelId, url);
      return next;
    });
  },

  addCustomModel: (model) => {
    set((state) => {
      const newModel: RegisteredAiModel = { ...model, isCustom: true };
      const filtered = state.customModels.filter((m) => m.id !== model.id);
      const updatedCustom = [...filtered, newModel];
      const next = { ...state, customModels: updatedCustom };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  },

  removeCustomModel: (modelId) => {
    set((state) => {
      const updatedCustom = state.customModels.filter((m) => m.id !== modelId);
      const next = { ...state, customModels: updatedCustom };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  },

  getAllModels: () => {
    const { customModels } = get();
    return [...DEFAULT_AI_MODELS, ...customModels];
  },

  setWallpaper: (url) => {
    set((state) => {
      const next = { ...state, currentWallpaperUrl: url };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      useThemeStore.setState({ currentWallpaperUrl: url });
      return next;
    });
  },

  setCustomWallpaper: (url) => {
    set((state) => {
      const next = { ...state, customWallpaperUrl: url, currentWallpaperUrl: url };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      useThemeStore.setState({ currentWallpaperUrl: url });
      return next;
    });
  },

  setGlassBlur: (blur) => {
    set((state) => {
      const next = { ...state, glassBlur: blur };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  },

  setGovernancePrefix: (prefix) => {
    set((state) => {
      const next = { ...state, reqCodePrefix: prefix };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  },

  setStrict3FN: (strict) => {
    set((state) => {
      const next = { ...state, strict3FN: strict };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  },

  getActiveApiKey: () => {
    const { provider, apiKeys } = get();
    return apiKeys[provider] || undefined;
  },

  pingTest: async (projectId: string) => {
    const { provider, selectedModelId, customEndpointUrl } = get();
    const activeKey = get().getActiveApiKey();

    const headers: Record<string, string> = {};
    if (activeKey) {
      headers['X-User-Ai-Key'] = activeKey;
      headers['X-User-Ai-Provider'] = provider;
      headers['X-User-Ai-Model'] = selectedModelId;
      if (customEndpointUrl) {
        headers['X-User-Ai-Endpoint'] = customEndpointUrl;
      }
    }

    try {
      const res = await apiClient.post(`/projects/${projectId}/ai/ping`, {}, { headers });
      const data = res.data?.data || res.data;
      return {
        success: true,
        latencyMs: data.latencyMs || 0,
        model: data.model || selectedModelId,
        message: data.reply || 'Conexión verificada exitosamente.',
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al conectar con el proveedor';
      return {
        success: false,
        latencyMs: 0,
        model: selectedModelId,
        message,
      };
    }
  },
}));
