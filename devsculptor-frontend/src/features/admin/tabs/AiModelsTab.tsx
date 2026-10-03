import React, { useState } from 'react';
import { useSettingsStore, RegisteredAiModel } from '@/stores/useSettingsStore';
import { VisionButton } from '@/components/ui/VisionButton';
import { VisionPill } from '@/components/ui/VisionPill';

export const AiModelsTab: React.FC = () => {
  const {
    getAllModels,
    addCustomModel,
    removeCustomModel,
    selectedModelId,
    setSelectedModelId,
  } = useSettingsStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterFreeOnly, setFilterFreeOnly] = useState(false);

  // Formulario de nuevo modelo
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [provider, setProvider] = useState<RegisteredAiModel['provider']>('openrouter');
  const [contextWindow, setContextWindow] = useState(128000);
  const [isFree, setIsFree] = useState(false);
  const [badge, setBadge] = useState('CUSTOM');
  const [description, setDescription] = useState('');

  const handleAddModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !id.trim()) return;

    addCustomModel({
      id: id.trim(),
      name: name.trim(),
      provider,
      contextWindow: contextWindow || 128000,
      isFree,
      badge: badge.trim() || (isFree ? 'GRATIS' : 'EXTERNO'),
      description: description.trim() || 'Modelo registrado por Superadmin en la Consola Maestra.',
    });

    setName('');
    setId('');
    setDescription('');
    setIsAddOpen(false);
  };

  const allModels = getAllModels();
  const filteredModels = allModels.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchProvider = filterProvider === 'all' || m.provider === filterProvider;
    const matchFree = !filterFreeOnly || m.isFree;
    return matchSearch && matchProvider && matchFree;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 fade-in overflow-hidden">
      {/* Barra de Controles Superadmin */}
      <div className="vision-card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400 text-base">smart_toy</span>
            <span>Catálogo Global de Modelos de Inteligencia Artificial</span>
          </h2>
          <p className="text-[10.5px] sm:text-xs text-muted font-mono">
            Administra los modelos autorizados, tier gratuito de OpenRouter y endpoints externos para los proyectos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Buscar modelo o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="vision-input text-xs !py-1 w-44 sm:w-56"
          />

          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className="vision-input text-xs !py-1"
          >
            <option value="all">Todos los proveedores</option>
            <option value="openrouter">OpenRouter</option>
            <option value="gemini">Google Gemini</option>
            <option value="deepseek">DeepSeek</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="custom">Personalizados</option>
          </select>

          <button
            type="button"
            onClick={() => setFilterFreeOnly(!filterFreeOnly)}
            className={`vision-btn !py-1 !px-2.5 text-xs flex items-center gap-1 ${
              filterFreeOnly ? 'vision-btn-primary' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">volunteer_activism</span>
            <span>Gratuitos</span>
          </button>

          <VisionButton
            variant="primary"
            icon="add"
            onClick={() => setIsAddOpen(true)}
            className="!py-1 !px-2.5 text-xs"
          >
            Agregar Modelo
          </VisionButton>
        </div>
      </div>

      {/* Modal / Panel de Alta de Modelo */}
      {isAddOpen && (
        <form
          onSubmit={handleAddModel}
          className="vision-card p-4 space-y-3 border-indigo-500/50 bg-indigo-500/10 shrink-0 fade-in"
        >
          <div className="flex items-center justify-between border-b border-glass-subtle pb-2">
            <h3 className="text-xs font-bold text-indigo-300">
              Registrar Nuevo Modelo en la Plataforma
            </h3>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="text-muted hover:text-primary text-xs"
            >
              Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-mono text-muted mb-1">Nombre Descriptivo</label>
              <input
                type="text"
                required
                placeholder="Ej: Llama 3.3 70B Instruct"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="vision-input text-xs w-full !py-1"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted mb-1">Identificador de API (Model ID)</label>
              <input
                type="text"
                required
                placeholder="Ej: meta-llama/llama-3.3-70b-instruct"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="vision-input text-xs font-mono w-full !py-1"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted mb-1">Proveedor de Servicio</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as any)}
                className="vision-input text-xs w-full !py-1"
              >
                <option value="openrouter">OpenRouter</option>
                <option value="deepseek">DeepSeek</option>
                <option value="openai">OpenAI</option>
                <option value="gemini">Google Gemini</option>
                <option value="anthropic">Anthropic</option>
                <option value="groq">Groq</option>
                <option value="custom">Custom / Ollama Local</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted mb-1">Etiqueta Especializada</label>
              <input
                type="text"
                placeholder="Ej: RAZONAMIENTO, CÓDIGO, GRATIS"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="vision-input text-xs w-full !py-1"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted mb-1">Ventana Contexto (Tokens)</label>
              <input
                type="number"
                value={contextWindow}
                onChange={(e) => setContextWindow(parseInt(e.target.value, 10) || 128000)}
                className="vision-input text-xs w-full !py-1 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 text-xs text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="rounded text-indigo-500"
              />
              <span>Modelo sin costo (:free tier)</span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="vision-btn !py-1 !px-3 text-xs"
              >
                Cancelar
              </button>
              <VisionButton type="submit" variant="primary" className="!py-1 !px-4 text-xs">
                Guardar en Bóveda de Modelos
              </VisionButton>
            </div>
          </div>
        </form>
      )}

      {/* Lista de Modelos en Tarjetas de Alto Rendimiento */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredModels.map((model) => {
          const isSelected = selectedModelId === model.id;
          return (
            <div
              key={model.id}
              className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition-all ${
                isSelected
                  ? 'bg-indigo-600/15 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                  : 'bg-black/10 dark:bg-white/[0.02] border-glass-subtle hover:border-indigo-400/40'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-xs text-primary leading-tight">{model.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
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
                      <button
                        type="button"
                        onClick={() => removeCustomModel(model.id)}
                        className="text-muted hover:text-rose-400 p-0.5"
                        title="Eliminar modelo custom"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>

                <span className="text-[10px] font-mono text-muted block truncate">{model.id}</span>
                {model.description && (
                  <p className="text-[11px] text-secondary line-clamp-2 leading-relaxed">
                    {model.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-glass-subtle text-[10px] font-mono text-muted">
                <span>Proveedor: <strong className="text-secondary">{model.provider}</strong></span>
                <button
                  type="button"
                  onClick={() => setSelectedModelId(model.id)}
                  className={`px-2 py-0.5 rounded text-[9.5px] font-semibold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-secondary'
                  }`}
                >
                  {isSelected ? 'Activo' : 'Elegir'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
