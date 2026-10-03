import React, { useState } from 'react';
import { useSettingsStore, RegisteredAiModel, WALLPAPER_PRESETS } from '@/stores/useSettingsStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { VisionButton } from '@/components/ui/VisionButton';
import { VisionPill } from '@/components/ui/VisionPill';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'ai' | 'appearance' | 'governance';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    provider,
    setProvider,
    apiKeys,
    setApiKey,
    selectedModelId,
    setSelectedModelId,
    customEndpointUrl,
    setCustomEndpointUrl,
    getAllModels,
    addCustomModel,
    removeCustomModel,
    pingTest,
    currentWallpaperUrl,
    setWallpaper,
    customWallpaperUrl,
    setCustomWallpaper,
    glassBlur,
    setGlassBlur,
    reqCodePrefix,
    setGovernancePrefix,
    strict3FN,
    setStrict3FN,
  } = useSettingsStore();

  const { activeProject } = useProjectStore();

  const [activeTab, setActiveTab] = useState<TabType>('ai');
  const [showKey, setShowKey] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [filterFreeOnly, setFilterFreeOnly] = useState(false);

  // Estado del Ping Test
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    message: string;
    model: string;
  } | null>(null);

  // Formulario de modelo externo
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelId, setNewModelId] = useState('');
  const [newModelProvider, setNewModelProvider] = useState<RegisteredAiModel['provider']>('openrouter');
  const [newModelContext, setNewModelContext] = useState(128000);
  const [newModelIsFree, setNewModelIsFree] = useState(false);
  const [newModelBadge, setNewModelBadge] = useState('CUSTOM');

  if (!isOpen) return null;

  const currentKey = apiKeys[provider] || '';

  const handleTestConnection = async () => {
    if (!activeProject) {
      setTestResult({
        success: false,
        latencyMs: 0,
        model: selectedModelId,
        message: 'Abre o selecciona un proyecto antes de probar la conexión.',
      });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await pingTest(activeProject.id);
      setTestResult(res);
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddCustomModelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim() || !newModelId.trim()) return;

    addCustomModel({
      id: newModelId.trim(),
      name: newModelName.trim(),
      provider: newModelProvider,
      contextWindow: newModelContext || 128000,
      isFree: newModelIsFree,
      badge: newModelBadge.trim() || (newModelIsFree ? 'GRATIS' : 'EXTERNO'),
      description: 'Modelo agregado manualmente por el usuario.',
    });

    setSelectedModelId(newModelId.trim());
    setNewModelName('');
    setNewModelId('');
    setIsAddingModel(false);
  };

  const allModels = getAllModels();
  const filteredModels = allModels.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.id.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.provider.toLowerCase().includes(modelSearch.toLowerCase()) ||
      (m.badge && m.badge.toLowerCase().includes(modelSearch.toLowerCase()));
    const matchesFree = !filterFreeOnly || m.isFree;
    return matchesSearch && matchesFree;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md fade-in select-none">
      <div className="vision-window w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-glass-subtle">
        {/* Cabecera Apple Glass */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-glass-subtle bg-black/10 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <span className="material-symbols-outlined text-[18px]">settings</span>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-primary tracking-tight">
                Configuración del Sistema y Gobernanza
              </h2>
              <p className="text-[10.5px] sm:text-xs text-muted font-mono">
                Gestión de proveedores de IA (BYOK), catálogo de modelos y preferencias.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="vision-btn !p-1.5 text-muted hover:text-primary rounded-lg"
            title="Cerrar ventana"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {/* Barra de Pestañas */}
        <div className="flex items-center gap-1 px-4 sm:px-6 py-2 border-b border-glass-subtle bg-black/5 dark:bg-white/[0.01]">
          <button
            onClick={() => setActiveTab('ai')}
            className={`vision-btn !py-1 !px-3 text-xs flex items-center gap-1.5 ${
              activeTab === 'ai' ? 'vision-btn-primary' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">smart_toy</span>
            <span>Modelos IA & BYOK</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`vision-btn !py-1 !px-3 text-xs flex items-center gap-1.5 ${
              activeTab === 'appearance' ? 'vision-btn-primary' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">palette</span>
            <span>Apariencia y Fondos</span>
          </button>

          <button
            onClick={() => setActiveTab('governance')}
            className={`vision-btn !py-1 !px-3 text-xs flex items-center gap-1.5 ${
              activeTab === 'governance' ? 'vision-btn-primary' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">policy</span>
            <span>Gobernanza Estándar</span>
          </button>
        </div>

        {/* Contenido Dinámico con Scroll */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6">
          {/* ========================================================= */}
          {/* PESTAÑA 1: MODELOS IA & BYOK                              */}
          {/* ========================================================= */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              {/* Bloque 1: Proveedor y API Key */}
              <div className="vision-card p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-glass-subtle pb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-400 text-lg">key</span>
                    <h3 className="text-xs sm:text-sm font-bold text-primary">
                      Bring Your Own Key (BYOK) — Clave de API Privada
                    </h3>
                  </div>
                  <VisionPill variant="emerald" dot className="text-[10px]">
                    ZERO-RETENTION
                  </VisionPill>
                </div>

                <p className="text-[11px] sm:text-xs text-secondary leading-relaxed">
                  Tus credenciales se resguardan de forma segura en tu navegador y viajan cifradas por cabecera de inferencia. DevSculptor nunca almacena tus claves en la base de datos central. Si dejas el campo vacío, se utilizará el proveedor configurado por defecto en el servidor.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Selector de Proveedor */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-muted uppercase">Proveedor Activo</label>
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value as any)}
                      className="vision-input text-xs w-full py-1.5"
                    >
                      <option value="openrouter">OpenRouter (Modelos Free Tier & Premium)</option>
                      <option value="gemini">Google Gemini (Nativo)</option>
                      <option value="deepseek">DeepSeek (API Oficial Directa)</option>
                      <option value="openai">OpenAI (GPT-4o, o3-mini)</option>
                      <option value="anthropic">Anthropic (Claude 3.7 / 3.5)</option>
                      <option value="groq">Groq (Inferencia LPU Ultra-Rápida)</option>
                      <option value="custom">Personalizado (Ollama / vLLM / Endpoint Propio)</option>
                    </select>
                  </div>

                  {/* Input de API Key */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-muted uppercase flex items-center justify-between">
                      <span>API Key para {provider.toUpperCase()}</span>
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="text-[10px] text-indigo-400 hover:underline"
                      >
                        {showKey ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </label>
                    <input
                      type={showKey ? 'text' : 'password'}
                      placeholder={`Pega tu clave ${provider === 'openrouter' ? 'sk-or-v1-...' : provider === 'deepseek' ? 'sk-...' : 'AIzaSy...'}`}
                      value={currentKey}
                      onChange={(e) => setApiKey(provider, e.target.value)}
                      className="vision-input text-xs font-mono w-full py-1.5"
                    />
                  </div>
                </div>

                {/* Endpoint personalizado si corresponde */}
                {provider === 'custom' && (
                  <div className="space-y-1.5 pt-2 border-t border-glass-subtle">
                    <label className="text-[11px] font-mono text-muted uppercase">
                      URL del Endpoint OpenAI-Compatible (Base URL)
                    </label>
                    <input
                      type="text"
                      placeholder="http://localhost:11434/v1 o https://mi-proxy-ia.corp/v1"
                      value={customEndpointUrl}
                      onChange={(e) => setCustomEndpointUrl(e.target.value)}
                      className="vision-input text-xs font-mono w-full py-1.5"
                    />
                  </div>
                )}

                {/* Botón de Ping Test y Feedback */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <VisionButton
                      variant="primary"
                      icon={isTesting ? 'hourglass_top' : 'bolt'}
                      disabled={isTesting}
                      onClick={handleTestConnection}
                      className="!py-1.5 !px-3 text-xs"
                    >
                      {isTesting ? 'Probando Conexión...' : 'Probar Conexión (Ping Test)'}
                    </VisionButton>
                    <span className="text-[10px] text-muted font-mono">
                      Modelo en prueba: <span className="text-primary">{selectedModelId}</span>
                    </span>
                  </div>

                  {testResult && (
                    <div
                      className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
                        testResult.success
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {testResult.success ? 'check_circle' : 'error'}
                      </span>
                      <span>
                        {testResult.message}{' '}
                        {testResult.success && `(${testResult.latencyMs}ms)`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bloque 2: Selector y Catálogo de Modelos */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-primary">
                      Catálogo de Modelos Disponibles
                    </h3>
                    <p className="text-[11px] text-muted">
                      Selecciona el modelo activo para tus consultas al Copiloto de Arquitectura.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Filtrar modelos..."
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      className="vision-input text-xs !py-1 w-40 sm:w-48"
                    />

                    <button
                      type="button"
                      onClick={() => setFilterFreeOnly(!filterFreeOnly)}
                      className={`vision-btn !py-1 !px-2.5 text-xs flex items-center gap-1 ${
                        filterFreeOnly ? 'vision-btn-primary' : ''
                      }`}
                      title="Mostrar solo modelos gratuitos de OpenRouter"
                    >
                      <span className="material-symbols-outlined text-[13px]">volunteer_activism</span>
                      <span>Solo Gratis</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAddingModel(!isAddingModel)}
                      className="vision-btn !py-1 !px-2.5 text-xs flex items-center gap-1"
                      title="Agregar un modelo externo al catálogo"
                    >
                      <span className="material-symbols-outlined text-[13px]">add</span>
                      <span className="hidden sm:inline">Nuevo Modelo</span>
                    </button>
                  </div>
                </div>

                {/* Formulario desplegable para registrar nuevo modelo externo */}
                {isAddingModel && (
                  <form
                    onSubmit={handleAddCustomModelSubmit}
                    className="vision-card p-4 space-y-3 border-indigo-500/40 bg-indigo-500/5 fade-in"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-indigo-400">
                        Registrar Nuevo Modelo Externo en el Catálogo
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsAddingModel(false)}
                        className="text-muted hover:text-primary text-xs"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[10px] font-mono text-muted mb-1">Nombre Amigable</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Mistral Large 2"
                          value={newModelName}
                          onChange={(e) => setNewModelName(e.target.value)}
                          className="vision-input text-xs w-full !py-1"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-muted mb-1">ID del Modelo (Code)</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: mistralai/mistral-large-2407"
                          value={newModelId}
                          onChange={(e) => setNewModelId(e.target.value)}
                          className="vision-input text-xs font-mono w-full !py-1"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-muted mb-1">Proveedor</label>
                        <select
                          value={newModelProvider}
                          onChange={(e) => setNewModelProvider(e.target.value as any)}
                          className="vision-input text-xs w-full !py-1"
                        >
                          <option value="openrouter">OpenRouter</option>
                          <option value="deepseek">DeepSeek</option>
                          <option value="openai">OpenAI</option>
                          <option value="gemini">Gemini</option>
                          <option value="groq">Groq</option>
                          <option value="custom">Custom / Local</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-muted mb-1">Etiqueta / Badge</label>
                        <input
                          type="text"
                          placeholder="Ej: CÓDIGO o GRATIS"
                          value={newModelBadge}
                          onChange={(e) => setNewModelBadge(e.target.value)}
                          className="vision-input text-xs w-full !py-1"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-muted mb-1">Contexto (Tokens)</label>
                        <input
                          type="number"
                          value={newModelContext}
                          onChange={(e) => setNewModelContext(parseInt(e.target.value, 10) || 128000)}
                          className="vision-input text-xs w-full !py-1 font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 text-xs text-secondary cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newModelIsFree}
                          onChange={(e) => setNewModelIsFree(e.target.checked)}
                          className="rounded text-indigo-500"
                        />
                        <span>¿Es de uso gratuito (:free)?</span>
                      </label>

                      <VisionButton type="submit" variant="primary" className="!py-1 !px-3 text-xs">
                        Guardar Modelo en Catálogo
                      </VisionButton>
                    </div>
                  </form>
                )}

                {/* Grid de Modelos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto custom-scrollbar p-1">
                  {filteredModels.map((model) => {
                    const isSelected = selectedModelId === model.id;
                    return (
                      <div
                        key={model.id}
                        onClick={() => setSelectedModelId(model.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 select-none ${
                          isSelected
                            ? 'bg-indigo-600/15 border-indigo-500/70 shadow-sm ring-1 ring-indigo-500/40'
                            : 'bg-black/5 dark:bg-white/[0.02] border-glass-subtle hover:border-indigo-400/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-primary">{model.name}</span>
                              {model.badge && (
                                <VisionPill
                                  variant={
                                    model.isFree || model.badge === 'GRATIS'
                                      ? 'emerald'
                                      : model.badge === 'RAZONAMIENTO'
                                      ? 'cyan'
                                      : model.badge === 'SERVIDOR DEFAULT'
                                      ? 'amber'
                                      : 'indigo'
                                  }
                                  className="text-[9px] !py-0 !px-1.5"
                                >
                                  {model.badge}
                                </VisionPill>
                              )}
                              {model.isCustom && (
                                <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">
                                  CUSTOM
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-muted block truncate max-w-[280px]">
                              {model.id}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {model.isCustom && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCustomModel(model.id);
                                }}
                                className="text-muted hover:text-rose-400 text-xs p-1"
                                title="Eliminar modelo personalizado"
                              >
                                <span className="material-symbols-outlined text-[14px]">delete</span>
                              </button>
                            )}
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-500 text-white'
                                  : 'border-glass-subtle'
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                        </div>

                        {model.description && (
                          <p className="text-[10.5px] text-secondary line-clamp-2 leading-relaxed">
                            {model.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[9.5px] font-mono text-muted pt-1 border-t border-glass-subtle">
                          <span>Proveedor: <strong className="text-secondary">{model.provider}</strong></span>
                          <span>Contexto: {(model.contextWindow / 1000).toFixed(0)}k</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PESTAÑA 2: APARIENCIA Y FONDOS (SECUNDARIO)               */}
          {/* ========================================================= */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xs sm:text-sm font-bold text-primary">
                  Fondos Escénicos Apple Glass
                </h3>
                <p className="text-[11px] text-muted">
                  Personaliza el ambiente visual de la plataforma. La selección se almacena en tus preferencias locales.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {WALLPAPER_PRESETS.map((preset) => {
                    const isSelected = currentWallpaperUrl === preset.url;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => setWallpaper(preset.url)}
                        className={`group relative rounded-xl overflow-hidden border cursor-pointer aspect-video transition-all ${
                          isSelected
                            ? 'ring-2 ring-indigo-500 border-indigo-400 shadow-lg scale-[1.02]'
                            : 'border-glass-subtle hover:border-indigo-400/50'
                        }`}
                      >
                        <img
                          src={preset.thumbnail}
                          alt={preset.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                          <span className="text-[10.5px] font-medium text-white truncate">
                            {preset.name}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow">
                            <span className="material-symbols-outlined text-[12px]">check</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fondo personalizado por URL */}
              <div className="vision-card p-4 space-y-2">
                <h4 className="text-xs font-bold text-primary">Fondo de Pantalla Personalizado por URL</h4>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://ejemplo.com/mi-wallpaper-corporativo.jpg"
                    value={customWallpaperUrl}
                    onChange={(e) => setCustomWallpaper(e.target.value)}
                    className="vision-input text-xs font-mono flex-1 !py-1.5"
                  />
                  {customWallpaperUrl && (
                    <VisionButton
                      variant="primary"
                      onClick={() => setWallpaper(customWallpaperUrl)}
                      className="!py-1.5 text-xs"
                    >
                      Aplicar URL
                    </VisionButton>
                  )}
                </div>
              </div>

              {/* Control de Desenfoque del Vidrio */}
              <div className="vision-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-primary">Intensidad de Desenfoque del Vidrio (Blur)</h4>
                  <span className="text-xs font-mono text-indigo-400 font-bold">{glassBlur}px</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="45"
                  step="5"
                  value={glassBlur}
                  onChange={(e) => setGlassBlur(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-muted">
                  <span>Sutil (5px)</span>
                  <span>Estándar (20px)</span>
                  <span>Opaco Profundo (45px)</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PESTAÑA 3: GOBERNANZA ESTÁNDAR                            */}
          {/* ========================================================= */}
          {activeTab === 'governance' && (
            <div className="space-y-4">
              <div className="vision-card p-4 space-y-4">
                <div className="border-b border-glass-subtle pb-2">
                  <h3 className="text-xs sm:text-sm font-bold text-primary">
                    Parámetros de Gobernanza y Convenciones
                  </h3>
                  <p className="text-[11px] text-muted">
                    Reglas aplicadas automáticamente durante la captura de requisitos y diagramado relacional.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-primary mb-1">
                      Prefijo Estándar para Requisitos Funcionales
                    </label>
                    <div className="flex items-center gap-2">
                      {(['RF', 'REQ', 'US'] as const).map((prefix) => (
                        <button
                          key={prefix}
                          type="button"
                          onClick={() => setGovernancePrefix(prefix)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all ${
                            reqCodePrefix === prefix
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                              : 'bg-black/5 dark:bg-white/[0.02] border-glass-subtle text-secondary hover:text-primary'
                          }`}
                        >
                          {prefix}-001
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-glass-subtle flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-primary">Normalización Relacional Estricta (3FN)</h4>
                      <p className="text-[10.5px] text-muted">
                        Exige validación de Tercera Forma Normal y claves foráneas tipadas en el Modelador de Código.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={strict3FN}
                      onChange={(e) => setStrict3FN(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie de Ventana */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-glass-subtle bg-black/10 dark:bg-white/[0.02] text-xs">
          <div className="flex items-center gap-2 text-muted font-mono text-[11px]">
            <span>Modelo Activo:</span>
            <strong className="text-indigo-400">{selectedModelId}</strong>
          </div>

          <VisionButton variant="primary" onClick={onClose} className="!py-1 !px-4 text-xs">
            Listo / Guardar
          </VisionButton>
        </div>
      </div>
    </div>
  );
};
