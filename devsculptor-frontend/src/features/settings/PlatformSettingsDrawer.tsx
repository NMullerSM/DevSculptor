import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useThemeStore, WALLPAPERS } from '@/stores/useThemeStore';
import { useSettingsStore, applyVisualEffectsToDom } from '@/stores/useSettingsStore';
import { VisionButton } from '@/components/ui/VisionButton';
import { GLASS_BLUR_RANGE, WINDOW_OPACITY_RANGE } from '@/utils/visualEffects';

interface PlatformSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlatformSettingsDrawer: React.FC<PlatformSettingsDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { theme, setTheme, currentWallpaperUrl } = useThemeStore();
  const {
    glassBlur,
    setGlassBlur,
    windowOpacity,
    setWindowOpacity,
    currentWallpaperUrl: settingsWallpaper,
    setWallpaper,
    strict3FN,
    setStrict3FN,
    reqCodePrefix,
    setGovernancePrefix,
  } = useSettingsStore();

  const [customWallpaperInput, setCustomWallpaperInput] = useState('');
  const [draftBlur, setDraftBlur] = useState(glassBlur);
  const [draftOpacity, setDraftOpacity] = useState(windowOpacity);
  const [isAppliedFeedback, setIsAppliedFeedback] = useState(false);

  useEffect(() => {
    setDraftBlur(glassBlur);
    setDraftOpacity(windowOpacity);
    return () => {
      // Revertir vista previa en vivo si se cierra o desmonta sin aplicar
      applyVisualEffectsToDom(glassBlur, windowOpacity);
    };
  }, [glassBlur, windowOpacity, isOpen]);

  const handleBlurChange = (val: number) => {
    setDraftBlur(val);
    applyVisualEffectsToDom(val, draftOpacity);
  };

  const handleOpacityChange = (val: number) => {
    setDraftOpacity(val);
    applyVisualEffectsToDom(draftBlur, val);
  };

  const handleResetVisualEffects = () => {
    setDraftBlur(GLASS_BLUR_RANGE.def);
    setDraftOpacity(WINDOW_OPACITY_RANGE.def);
    applyVisualEffectsToDom(GLASS_BLUR_RANGE.def, WINDOW_OPACITY_RANGE.def);
  };

  const handleClose = () => {
    applyVisualEffectsToDom(glassBlur, windowOpacity);
    onClose();
  };

  if (!isOpen) return null;

  const handleApplyCustomWallpaper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customWallpaperInput.trim()) return;
    setWallpaper(customWallpaperInput.trim());
    setCustomWallpaperInput('');
  };

  const handleSelectPreset = (url: string) => {
    setWallpaper(url);
  };

  const hasVisualChanges = draftBlur !== glassBlur || draftOpacity !== windowOpacity;

  const handleApplyVisualEffects = () => {
    setGlassBlur(draftBlur);
    setWindowOpacity(draftOpacity);
    setIsAppliedFeedback(true);
    setTimeout(() => setIsAppliedFeedback(false), 2000);
  };

  const activeWallpaper = settingsWallpaper || currentWallpaperUrl;

  return createPortal(
    <>
      {/* Backdrop con desenfoque suave para cerrar al hacer clic */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={handleClose}
      />

      {/* Drawer deslizante desde la izquierda (Left Slide-Over) */}
      <aside
        className="fixed top-0 left-0 bottom-0 z-50 w-full sm:w-[420px] max-w-[90vw] vision-window !rounded-r-2xl !rounded-l-none shadow-2xl border-r border-y-0 border-l-0 border-glass-subtle flex flex-col overflow-hidden animate-slide-right select-none"
      >
        {/* Cabecera del Drawer */}
        <div className="p-4 border-b border-glass-subtle bg-black/15 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <span className="material-symbols-outlined text-[18px]">tune</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-primary">Configuración de la Plataforma</h2>
              <p className="text-[10.5px] text-muted font-mono">
                Apariencia visual, fondos y convenciones del estudio.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="vision-btn !p-1.5 text-muted hover:text-primary rounded-lg text-xs"
            title="Cerrar panel de configuración"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar text-xs">
          {/* ========================================================= */}
          {/* SECCIÓN 1: MODO VISUAL (TEMA CLARO / OSCURO)              */}
          {/* ========================================================= */}
          <div className="vision-card p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary text-xs flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-amber-400">brightness_6</span>
                  Modo de Iluminación
                </h3>
                <p className="text-[10.5px] text-muted">
                  Selecciona la paleta de contraste para el estudio.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                  theme === 'dark'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold shadow-sm shadow-indigo-500/30'
                    : 'bg-black/20 border-glass-subtle text-secondary hover:text-primary hover:bg-white/5'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-indigo-400">
                  <span className="material-symbols-outlined text-sm">dark_mode</span>
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold">Modo Oscuro</div>
                  <div className="text-[9.5px] text-muted font-mono">Vidrio Ahumado</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                  theme === 'light'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold shadow-sm shadow-indigo-500/30'
                    : 'bg-black/20 border-glass-subtle text-secondary hover:text-primary hover:bg-white/5'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center text-amber-500">
                  <span className="material-symbols-outlined text-sm">light_mode</span>
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold">Modo Claro</div>
                  <div className="text-[9.5px] text-muted font-mono">Luz Diurna</div>
                </div>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECCIÓN 2: PERSONALIZACIÓN DE FONDO DE PANTALLA           */}
          {/* ========================================================= */}
          <div className="vision-card p-3.5 space-y-3">
            <div>
              <h3 className="font-semibold text-primary text-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-cyan-400">wallpaper</span>
                Fondo de Pantalla del Estudio
              </h3>
              <p className="text-[10.5px] text-muted">
                Galería de alta resolución o enlace directo a tu imagen preferida.
              </p>
            </div>

            {/* Cuadrícula de Fondos */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {WALLPAPERS.map((wp) => {
                const isSelected = activeWallpaper === wp.url;
                return (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => handleSelectPreset(wp.url)}
                    className={`relative rounded-xl overflow-hidden border text-left group transition-all aspect-video cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-md'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img
                      src={wp.url}
                      alt={wp.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                      <span className="text-[10px] font-medium text-white truncate drop-shadow">
                        {wp.name}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] shadow">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Input para URL personalizada */}
            <form onSubmit={handleApplyCustomWallpaper} className="space-y-1.5 pt-2 border-t border-glass-subtle">
              <label className="block text-[10px] font-mono text-muted">
                URL de Imagen Externa
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={customWallpaperInput}
                  onChange={(e) => setCustomWallpaperInput(e.target.value)}
                  className="vision-input text-xs font-mono flex-1 !py-1"
                />
                <VisionButton
                  type="submit"
                  variant="secondary"
                  size="sm"
                  disabled={!customWallpaperInput.trim()}
                  className="!py-1 !px-2.5"
                >
                  Aplicar
                </VisionButton>
              </div>
            </form>
          </div>

          {/* ========================================================= */}
          {/* SECCIÓN 3: EFECTOS DE VIDRIO & OPACIDAD                    */}
          {/* ========================================================= */}
          <div className="vision-card p-3.5 space-y-3.5">
            <div>
              <h3 className="font-semibold text-primary text-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-indigo-400">blur_on</span>
                Efectos de Vidrio & Opacidad
              </h3>
              <p className="text-[10.5px] text-muted">
                Ajusta el desenfoque Apple Glass y la transparencia de las ventanas.
              </p>
            </div>

            {/* Slider Desenfoque */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary">Intensidad de Desenfoque (Blur)</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-indigo-400 font-bold">{draftBlur}px</span>
                  {draftBlur !== glassBlur && (
                    <span className="text-[9.5px] text-amber-400 font-normal">(sin aplicar)</span>
                  )}
                </div>
              </div>
              <input
                type="range"
                min={GLASS_BLUR_RANGE.min}
                max={GLASS_BLUR_RANGE.max}
                step={GLASS_BLUR_RANGE.step}
                value={draftBlur}
                onChange={(e) => handleBlurChange(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer select-auto"
              />
              <div className="flex justify-between text-[9px] font-mono text-muted">
                <span>Sin blur (0px)</span>
                <span>Estándar (20px)</span>
                <span>Máximo (120px)</span>
              </div>
            </div>

            {/* Slider Opacidad */}
            <div className="space-y-1.5 pt-2 border-t border-glass-subtle">
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary">Opacidad de las Ventanas</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-indigo-400 font-bold">{draftOpacity}%</span>
                  {draftOpacity !== windowOpacity && (
                    <span className="text-[9.5px] text-amber-400 font-normal">(sin aplicar)</span>
                  )}
                </div>
              </div>
              <input
                type="range"
                min={WINDOW_OPACITY_RANGE.min}
                max={WINDOW_OPACITY_RANGE.max}
                step={WINDOW_OPACITY_RANGE.step}
                value={draftOpacity}
                onChange={(e) => handleOpacityChange(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer select-auto"
              />
              <div className="flex justify-between text-[9px] font-mono text-muted">
                <span>Cristal (10%)</span>
                <span>Equilibrado (85%)</span>
                <span>Sólido (100%)</span>
              </div>
              <p className="text-[10px] text-muted font-sans pt-1">
                El desenfoque se aprecia con mayor nitidez con opacidades menores al 70%.
              </p>
            </div>

            {/* Botón Explícito para Aplicar Efectos Visuales y Restablecer */}
            <div className="pt-2 border-t border-glass-subtle flex items-center gap-2">
              <VisionButton
                type="button"
                variant={hasVisualChanges ? 'primary' : 'secondary'}
                size="sm"
                onClick={handleApplyVisualEffects}
                disabled={!hasVisualChanges && !isAppliedFeedback}
                className="flex-1 justify-center !py-2 text-xs font-semibold cursor-pointer"
                icon={isAppliedFeedback ? 'done' : 'check_circle'}
              >
                {isAppliedFeedback
                  ? '✓ Efectos Aplicados'
                  : hasVisualChanges
                  ? 'Aplicar Cambios'
                  : 'Ajustes Aplicados'}
              </VisionButton>
              <VisionButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleResetVisualEffects}
                title="Restablecer a valores estándar (20px blur / 85% opacidad)"
                className="!py-2 !px-2.5 text-xs text-muted hover:text-primary cursor-pointer shrink-0"
                icon="restart_alt"
              >
                Restablecer
              </VisionButton>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECCIÓN 4: GOBERNANZA TÉCNICA DEL ESTUDIO                 */}
          {/* ========================================================= */}
          <div className="vision-card p-3.5 space-y-3">
            <div>
              <h3 className="font-semibold text-primary text-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-emerald-400">verified</span>
                Gobernanza & Convenciones Pre-Coding
              </h3>
              <p className="text-[10.5px] text-muted">
                Reglas aplicadas automáticamente al diseñar esquemas y capturar requisitos.
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-primary text-xs">Normalización Estricta 3FN</h4>
                  <p className="text-[10px] text-muted">
                    Exige Tercera Forma Normal y claves foráneas tipadas en el modelador.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={strict3FN}
                  onChange={(e) => setStrict3FN(e.target.checked)}
                  className="rounded text-indigo-500 cursor-pointer w-4 h-4"
                />
              </div>

              <div className="pt-2 border-t border-glass-subtle space-y-1.5">
                <label className="block text-[10.5px] font-semibold text-primary">
                  Prefijo Canónico de Requisitos
                </label>
                <div className="flex gap-2">
                  {(['RF', 'REQ', 'US'] as const).map((prefix) => (
                    <button
                      key={prefix}
                      type="button"
                      onClick={() => setGovernancePrefix(prefix)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                        reqCodePrefix === prefix
                          ? 'bg-indigo-600 text-white font-semibold shadow'
                          : 'bg-white/5 text-secondary hover:text-primary'
                      }`}
                    >
                      {prefix}-001
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pie del Drawer */}
        <div className="p-3 border-t border-glass-subtle bg-black/15 flex items-center justify-end shrink-0">
          <VisionButton variant="primary" onClick={handleClose} size="sm" className="!py-1 !px-4">
            Listo
          </VisionButton>
        </div>
      </aside>
    </>,
    document.body
  );
};
