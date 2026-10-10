import React, { useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';
import { sanitizeSvg } from '@/utils/sanitizeHtml';
import { VisionButton } from '@/components/ui/VisionButton';
import { useThemeStore } from '@/stores/useThemeStore';

let lastInitializedTheme: 'dark' | 'light' | null = null;

function ensureMermaidInitialized(theme: 'dark' | 'light') {
  if (lastInitializedTheme === theme) return;
  const isDark = theme === 'dark';

  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? 'dark' : 'default',
    securityLevel: 'strict',
    fontFamily: 'JetBrains Mono, Inter, ui-sans-serif, system-ui',
    themeVariables: isDark
      ? {
          darkMode: true,
          background: '#090d16',
          primaryColor: '#6366f1',
          primaryTextColor: '#f8fafc',
          primaryBorderColor: '#818cf8',
          lineColor: '#38bdf8',
          secondaryColor: '#0ea5e9',
          tertiaryColor: '#1e1b4b',
          mainBkg: '#0f172a',
          nodeBorder: '#6366f1',
          clusterBkg: 'rgba(30, 27, 75, 0.4)',
          clusterBorder: '#818cf8',
          defaultLinkColor: '#38bdf8',
          titleColor: '#ffffff',
          edgeLabelBackground: '#1e1b4b',
          actorBkg: '#1e1b4b',
          actorBorder: '#6366f1',
          actorTextColor: '#ffffff',
          signalColor: '#38bdf8',
          signalTextColor: '#f8fafc',
        }
      : {
          darkMode: false,
          background: '#f8fafc',
          primaryColor: '#4f46e5',
          primaryTextColor: '#0f172a',
          primaryBorderColor: '#6366f1',
          lineColor: '#0284c7',
          secondaryColor: '#0369a1',
          tertiaryColor: '#f1f5f9',
          mainBkg: '#ffffff',
          nodeBorder: '#4f46e5',
          clusterBkg: 'rgba(241, 245, 249, 0.7)',
          clusterBorder: '#94a3b8',
          defaultLinkColor: '#0284c7',
          titleColor: '#0f172a',
          edgeLabelBackground: '#ffffff',
          actorBkg: '#f8fafc',
          actorBorder: '#4f46e5',
          actorTextColor: '#0f172a',
          signalColor: '#0284c7',
          signalTextColor: '#0f172a',
        },
  });
  lastInitializedTheme = theme;
}

/**
 * Extrae limpiamente la definición de código Mermaid de cualquier texto Markdown
 */
function extractMermaidCode(rawText: string): string {
  if (!rawText) return '';
  const blockMatch = rawText.match(/```(?:mermaid|mmd)\s*\n([\s\S]*?)```/i);
  if (blockMatch && blockMatch[1]) {
    return blockMatch[1].trim();
  }

  const genericMatch = rawText.match(/```\s*\n([\s\S]*?)```/i);
  if (genericMatch && genericMatch[1]) {
    return genericMatch[1].trim();
  }

  const keywordMatch = rawText.match(
    /(?:^|\n)(classDiagram|flowchart|graph|erDiagram|sequenceDiagram|stateDiagram|pie|gantt|gitGraph|C4Context|C4Container|C4Component)[\s\S]*/
  );
  if (keywordMatch) {
    return keywordMatch[0].replace(/```[\s\S]*$/, '').trim();
  }

  return rawText.replace(/^```[a-z0-9_-]*\n/i, '').replace(/\n```$/, '').trim();
}

interface MermaidVisualizerProps {
  code: string;
  title?: string;
  standard?: string;
  showCode?: boolean;
  className?: string;
}

export const MermaidVisualizer: React.FC<MermaidVisualizerProps> = ({
  code,
  title = 'Diagrama Arquitectónico',
  standard = 'Mermaid UML',
  showCode = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rawId = useId();
  const diagramId = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const currentTheme = useThemeStore((s) => s.theme);
  const isDark = currentTheme === 'dark';

  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hasCopiedCode, setHasCopiedCode] = useState<boolean>(false);
  const [isCodeCollapsed, setIsCodeCollapsed] = useState<boolean>(false);

  const cleanDiagramCode = extractMermaidCode(code);

  useEffect(() => {
    let isCancelled = false;
    ensureMermaidInitialized(currentTheme);

    const renderDiagram = async () => {
      if (!cleanDiagramCode) {
        setSvgContent('');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const renderResult = await mermaid.render(diagramId, cleanDiagramCode);
        if (!isCancelled) {
          const sanitized = sanitizeSvg(renderResult.svg);
          setSvgContent(sanitized);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          console.warn('[MermaidVisualizer] Error al compilar diagrama:', err);
          setError(
            err instanceof Error
              ? err.message
              : 'Error al interpretar la sintaxis del diagrama Mermaid.'
          );
          setIsLoading(false);
        }
      }
    };

    renderDiagram();

    return () => {
      isCancelled = true;
    };
  }, [cleanDiagramCode, diagramId, currentTheme]);

  const handleCopyCode = async () => {
    if (!cleanDiagramCode) return;
    try {
      await navigator.clipboard.writeText(cleanDiagramCode);
      setHasCopiedCode(true);
      setTimeout(() => setHasCopiedCode(false), 2000);
    } catch (e) {
      console.error('Error al copiar código Mermaid:', e);
    }
  };

  const handleDownloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const cleanDisplayCode = cleanDiagramCode || '// Definición de diagrama no disponible';

  return (
    <div
      className={`vision-card !p-0 flex flex-col rounded-xl overflow-hidden border border-glass-subtle shadow-xl ${className}`}
    >
      {/* Cabecera del Visualizador */}
      <div className="px-3.5 py-2.5 border-b border-glass-subtle bg-white/[0.02] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-indigo-400 text-[18px]">
            account_tree
          </span>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-semibold text-primary truncate">{title}</h4>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted">
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/30">
                {standard}
              </span>
              <span>•</span>
              <span>Motor Reactivo Mermaid</span>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-1.5 shrink-0">
          <VisionButton
            variant="secondary"
            size="sm"
            icon={hasCopiedCode ? 'check' : 'content_copy'}
            onClick={handleCopyCode}
            title="Copiar definición de código Mermaid (.mmd)"
            className="!py-1 !px-2 text-[11px]"
          >
            {hasCopiedCode ? 'Copiado' : 'Código .mmd'}
          </VisionButton>

          {svgContent && (
            <VisionButton
              variant="secondary"
              size="sm"
              icon="download"
              onClick={handleDownloadSvg}
              title="Descargar diagrama vectorial SVG"
              className="!py-1 !px-2 text-[11px]"
            >
              SVG
            </VisionButton>
          )}
        </div>
      </div>

      {/* SECCIÓN 1: CÓDIGO FORMAL */}
      {showCode && (
        <div className="border-b border-glass-subtle bg-black/10 dark:bg-black/30">
          <div
            className="px-3 py-1.5 flex items-center justify-between bg-white/[0.02] border-b border-white/[0.04] cursor-pointer hover:bg-white/[0.04] transition-colors"
            onClick={() => setIsCodeCollapsed((prev) => !prev)}
            title="Clic para plegar o desplegar el código fuente del diagrama"
          >
            <div className="flex items-center gap-1.5 text-[10.5px] font-mono font-semibold text-indigo-500 dark:text-indigo-300">
              <span className="material-symbols-outlined text-[14px]">code</span>
              <span>Definición de Código Formal ({standard})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] font-mono text-muted">
                {cleanDisplayCode.split('\n').length} líneas
              </span>
              <span className="material-symbols-outlined text-[15px] text-muted">
                {isCodeCollapsed ? 'expand_more' : 'expand_less'}
              </span>
            </div>
          </div>

          {!isCodeCollapsed && (
            <div
              className={`p-3 max-h-48 overflow-y-auto custom-scrollbar font-mono text-[11.5px] leading-relaxed ${
                isDark ? 'bg-[#060a14] text-emerald-300/90' : 'bg-slate-100 text-slate-800'
              }`}
            >
              <pre className="whitespace-pre selection:bg-indigo-500/30">
                <code>{cleanDisplayCode}</code>
              </pre>
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 2: DIAGRAMA VISUAL */}
      <div
        className={`flex-1 flex flex-col min-h-[300px] ${
          isDark ? 'bg-[#070b16]' : 'bg-slate-50'
        } relative overflow-hidden`}
      >
        {/* Barra de Herramientas de Visualización */}
        <div className="px-3 py-1.5 border-b border-glass-subtle bg-white/[0.015] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Representación Gráfica del Diagrama</span>
          </div>

          {/* Controles de Zoom */}
          <div className="flex items-center gap-1 bg-black/10 dark:bg-black/50 p-0.5 rounded-lg border border-glass-subtle">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))))}
              className="px-2 py-0.5 rounded text-[11px] text-secondary hover:text-primary hover:bg-white/10 transition-colors font-mono"
              title="Alejar (Zoom Out)"
            >
              -
            </button>
            <span className="px-1 text-[10px] font-mono text-muted min-w-[42px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))))}
              className="px-2 py-0.5 rounded text-[11px] text-secondary hover:text-primary hover:bg-white/10 transition-colors font-mono"
              title="Acercar (Zoom In)"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="px-2 py-0.5 rounded text-[10px] text-muted hover:text-primary hover:bg-white/10 transition-colors font-mono"
              title="Restablecer zoom a 100%"
            >
              1:1
            </button>
          </div>
        </div>

        {/* Superficie de Visualización */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto p-6 flex items-center justify-center custom-scrollbar min-h-[260px] max-h-[600px]"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-secondary animate-pulse">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <p className="text-xs font-mono">Renderizando diagrama vectorial SVG...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 max-w-lg space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>Error de Sintaxis en el Diagrama</span>
              </div>
              <p className="font-mono text-[11px] text-rose-200/80 whitespace-pre-wrap">{error}</p>
            </div>
          ) : (
            <div
              className="transition-transform duration-150 ease-out origin-center flex items-center justify-center max-w-full"
              style={{ transform: `scale(${zoomLevel})` }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
