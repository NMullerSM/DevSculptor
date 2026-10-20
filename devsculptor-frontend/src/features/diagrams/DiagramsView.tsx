import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { requirementsService } from '@/services/requirements.service';
import { decisionsService } from '@/services/decisions.service';
import { canvasService } from '@/services/canvas.service';
import { okfService } from '@/services/okf.service';
import { Requirement } from '@/types/requirement.types';
import { Decision } from '@/types/decision.types';
import { CanvasEntity } from '@/types/canvas.types';
import { AiSuggestedDiagram } from '@/types/ai.types';
import { ENTERPRISE_TEMPLATES, EnterpriseTemplateDef } from '@/features/export/okfTemplates';
import { DIAGRAM_CATALOG } from './catalog/diagramCatalog';
import { DiagramSpec, ProjectDiagramContext } from './diagram.types';
import { GraphCanvas } from './render/GraphCanvas';
import { SequenceCanvas } from './render/SequenceCanvas';
import { MermaidVisualizer } from '@/components/diagrams/MermaidVisualizer';
import { VisionButton } from '@/components/ui/VisionButton';
import {
  downloadSvg,
  downloadPng,
  downloadStandaloneHtml,
  printDiagramPdf,
} from './export/diagramExport';

import { useThemeStore } from '@/stores/useThemeStore';
import { useAiChatStore } from '@/stores/useAiChatStore';

interface DiagramsViewProps {
  projectId: string;
}

type MainTab = 'interactive' | 'mermaid';
type KindFilter = 'all' | 'graph' | 'sequence';

export const DiagramsView: React.FC<DiagramsViewProps> = ({ projectId }) => {
  const { activeProject, metrics } = useProjectStore();
  const projectSession = useAiChatStore((s) => (projectId ? s.sessions[projectId] : undefined));
  const [persistedAiDiagrams, setPersistedAiDiagrams] = useState<AiSuggestedDiagram[]>([]);

  const injectedAiDiagrams = useMemo(() => {
    const sessionDiags = projectSession?.injectedDiagrams || [];
    const combined = [...sessionDiags];
    persistedAiDiagrams.forEach((pd) => {
      if (!combined.some((c) => c.title.toLowerCase() === pd.title.toLowerCase())) {
        combined.push(pd);
      }
    });
    return combined;
  }, [projectSession?.injectedDiagrams, persistedAiDiagrams]);

  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

  // Datos reales del proyecto
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [entities, setEntities] = useState<CanvasEntity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de navegación
  const [activeTab, setActiveTab] = useState<MainTab>('mermaid');
  const [selectedInteractiveId, setSelectedInteractiveId] = useState<string>(
    DIAGRAM_CATALOG[0].id
  );
  const [selectedMermaidId, setSelectedMermaidId] = useState<string>('class-diagram');
  const [isCatalogOpen, setIsCatalogOpen] = useState<boolean>(false);
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Referencia al elemento SVG activo para descargas
  const activeSvgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // 1. Cargar datos del proyecto
  useEffect(() => {
    let isMounted = true;

    async function loadProjectData() {
      if (!projectId) return;
      setIsLoading(true);
      setError(null);
      try {
        const [reqs, decs, ents, diagramDocs] = await Promise.all([
          requirementsService.getAllByProject(projectId).catch(() => []),
          decisionsService.getAllByProject(projectId).catch(() => []),
          canvasService.getAllByProject(projectId).catch(() => []),
          okfService.getDocuments(projectId, { documentType: 'DIAGRAM' }).catch(() => []),
        ]);

        if (!isMounted) return;
        setRequirements(reqs || []);
        setDecisions(decs || []);
        setEntities(ents || []);

        const loadedDiagrams: AiSuggestedDiagram[] = (diagramDocs || []).map((doc, idx) => {
          const raw = doc.content_markdown || doc.content_preview || '';
          const mermaidMatch = raw.match(/```mermaid([\s\S]*?)```/);
          const mermaidCode = mermaidMatch ? mermaidMatch[1].trim() : raw;
          const validTypes = ['class', 'sequence', 'er', 'state', 'c4', 'deployment', 'activity', 'flowchart'] as const;
          const matchedType = validTypes.find((vt) => doc.tags?.includes(vt)) || 'class';
          return {
            code: `DIAG-DB-${idx + 1}`,
            title: doc.title,
            type: matchedType,
            format: 'mermaid',
            mermaidCode,
            description: doc.content_preview || undefined,
          };
        });
        setPersistedAiDiagrams(loadedDiagrams);
      } catch (err) {
        if (!isMounted) return;
        console.error('Error al sincronizar datos para el generador de diagramas:', err);
        setError('Error al sincronizar datos para el generador de diagramas.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProjectData();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Cerrar menús al hacer click afuera o presionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCatalogOpen) setIsCatalogOpen(false);
        if (isExportMenuOpen) setIsExportMenuOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCatalogOpen, isExportMenuOpen]);

  // 2. Construir contexto del proyecto
  const diagramContext: ProjectDiagramContext = useMemo(() => {
    const proposed = decisions.filter((d) => d.status === 'PROPOSED').length;
    const accepted = decisions.filter((d) => d.status === 'ACCEPTED').length;
    const rejected = decisions.filter((d) => d.status === 'REJECTED').length;

    return {
      projectId,
      projectName: activeProject?.name || 'DevSculptor Architecture',
      organization: activeProject?.organization || undefined,
      leadArchitect: activeProject?.lead_architect || undefined,
      architectureStyle: activeProject?.architecture_style,
      reqsCount: requirements.length,
      adrsCount: decisions.length,
      adrsProposed: proposed,
      adrsAccepted: accepted,
      adrsRejected: rejected,
      tablesCount: entities.length,
      requirements: requirements.map((r) => ({
        code: r.code,
        title: r.title,
        type: r.type,
        priority: r.priority,
      })),
      decisions: decisions.map((d) => ({
        code: d.code,
        title: d.title,
        status: d.status,
      })),
      tables: entities.map((e) => {
        const cols = e.columns_json || [];
        return {
          id: e.id,
          name: e.table_name,
          columns: cols.map((c) => ({
            name: c.name,
            type: c.type,
            isPrimary: c.isPk || c.is_pk,
            isForeign: c.isFk || c.is_fk,
          })),
          foreignKeys: cols
            .filter((c) => (c.isFk || c.is_fk) && (c.referencesTable || c.references_table))
            .map((c) => ({
              targetTable: c.referencesTable || c.references_table || '',
              targetColumn: c.referencesColumn || c.references_column || 'id',
            })),
        };
      }),
    };
  }, [projectId, activeProject, requirements, decisions, entities]);

  // 3. Filtrar diagramas interactivos
  const filteredInteractive = useMemo(() => {
    return DIAGRAM_CATALOG.filter((item) => {
      if (kindFilter !== 'all' && item.kind !== kindFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.badge.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [kindFilter, searchQuery]);

  // 4. Plantillas Mermaid (UML OKF)
  const umlTemplates = useMemo(() => {
    return ENTERPRISE_TEMPLATES.filter(
      (t) => t.category === 'diagrams' || t.tags.includes('mermaid')
    );
  }, []);

  const filteredUmlTemplates = useMemo(() => {
    if (!searchQuery.trim()) return umlTemplates;
    const q = searchQuery.toLowerCase();
    return umlTemplates.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.standard.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
    );
  }, [umlTemplates, searchQuery]);

  const filteredAiDiagrams = useMemo(() => {
    if (!searchQuery.trim()) return injectedAiDiagrams;
    const q = searchQuery.toLowerCase();
    return injectedAiDiagrams.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q)) ||
        d.code.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q)
    );
  }, [injectedAiDiagrams, searchQuery]);

  const activeInteractiveItem = useMemo(() => {
    return (
      DIAGRAM_CATALOG.find((d) => d.id === selectedInteractiveId) || DIAGRAM_CATALOG[0]
    );
  }, [selectedInteractiveId]);

  const activeInteractiveSpec: DiagramSpec = useMemo(() => {
    return activeInteractiveItem.getSpec(diagramContext);
  }, [activeInteractiveItem, diagramContext]);

  const activeAiDiagram = useMemo(() => {
    return injectedAiDiagrams.find((d) => `ai-${d.code}` === selectedMermaidId);
  }, [injectedAiDiagrams, selectedMermaidId]);

  const activeMermaidTemplate: EnterpriseTemplateDef = useMemo(() => {
    return (
      umlTemplates.find((t) => t.id === selectedMermaidId) ||
      umlTemplates[0] ||
      ENTERPRISE_TEMPLATES[0]
    );
  }, [umlTemplates, selectedMermaidId]);

  const activeMermaidContent = useMemo(() => {
    if (activeAiDiagram) return null;
    if (!activeProject || !activeMermaidTemplate) return null;
    return activeMermaidTemplate.generate(
      activeProject,
      requirements,
      entities,
      decisions,
      metrics
    );
  }, [activeAiDiagram, activeProject, activeMermaidTemplate, requirements, entities, decisions, metrics]);

  const activeMermaidTitle = activeAiDiagram ? activeAiDiagram.title : activeMermaidTemplate.title;
  const activeMermaidStandard = activeAiDiagram ? `OKF IA (${activeAiDiagram.type})` : activeMermaidTemplate.standard;
  const activeMermaidCode = activeAiDiagram ? activeAiDiagram.mermaidCode : (activeMermaidContent?.markdown || '');

  // Handlers de Exportación
  const handleExportSvg = () => {
    if (activeTab === 'interactive') {
      if (!activeSvgRef.current) return;
      downloadSvg(activeSvgRef.current, activeInteractiveSpec.id);
    } else {
      const mermaidSvg = containerRef.current?.querySelector('.mermaid-render-container svg') as SVGSVGElement | null;
      if (mermaidSvg) {
        downloadSvg(mermaidSvg, selectedMermaidId);
      }
    }
    setIsExportMenuOpen(false);
  };

  const handleExportPng = async () => {
    if (activeTab === 'interactive') {
      if (!activeSvgRef.current) return;
      setIsExporting(true);
      try {
        await downloadPng(activeSvgRef.current, activeInteractiveSpec.id);
      } catch (e) {
        console.error('Error al exportar PNG:', e);
      } finally {
        setIsExporting(false);
        setIsExportMenuOpen(false);
      }
    } else {
      const mermaidSvg = containerRef.current?.querySelector('.mermaid-render-container svg') as SVGSVGElement | null;
      if (mermaidSvg) {
        setIsExporting(true);
        try {
          await downloadPng(mermaidSvg, selectedMermaidId);
        } catch (e) {
          console.error('Error al exportar PNG:', e);
        } finally {
          setIsExporting(false);
          setIsExportMenuOpen(false);
        }
      }
    }
  };

  const handleExportHtml = () => {
    if (activeTab === 'interactive') {
      if (!activeSvgRef.current) return;
      downloadStandaloneHtml(
        activeSvgRef.current,
        activeInteractiveSpec,
        activeInteractiveSpec.id
      );
    } else {
      const cleanCode = activeMermaidCode
        .replace(/^```[a-z0-9_-]*\n/i, '')
        .replace(/\n```$/, '')
        .trim();
      const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${activeMermaidTitle} — DevSculptor</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; background: #0b0f19; color: #f8fafc; padding: 2rem; display: flex; flex-direction: column; align-items: center; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { font-size: 0.875rem; color: #94a3b8; margin-bottom: 2rem; }
    .mermaid { background: #0f172a; padding: 2rem; border-radius: 1rem; border: 1px solid #1e293b; max-width: 100%; overflow: auto; }
  </style>
</head>
<body>
  <h1>${activeMermaidTitle}</h1>
  <p>Estándar: ${activeMermaidStandard} | Proyecto: ${activeProject?.name || 'DevSculptor'}</p>
  <div class="mermaid">
${cleanCode}
  </div>
  <script>mermaid.initialize({ startOnLoad: true, theme: 'dark' });</script>
</body>
</html>`;
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedMermaidId}.html`;
      link.click();
      URL.revokeObjectURL(url);
    }
    setIsExportMenuOpen(false);
  };

  const handleExportMmd = () => {
    if (!activeMermaidCode) return;
    const cleanCode = activeMermaidCode
      .replace(/^```[a-z0-9_-]*\n/i, '')
      .replace(/\n```$/, '')
      .trim();
    const blob = new Blob([cleanCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedMermaidId}.mmd`;
    link.click();
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };

  const handlePrint = () => {
    setIsExportMenuOpen(false);
    printDiagramPdf();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex flex-col overflow-hidden transition-colors ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      } ${isFullscreen ? 'fixed inset-0 z-50 p-4' : ''}`}
    >
      {/* 1. BARRA SUPERIOR DE CONTROL */}
      <header
        className={`px-3 py-2 border-b flex flex-wrap items-center justify-between gap-2 shrink-0 z-20 backdrop-blur-md transition-colors ${
          isDark
            ? 'border-white/10 bg-slate-900/60'
            : 'border-slate-200 bg-white/80 shadow-xs'
        }`}
      >
        {/* Izquierda: Botón de Catálogo y Título Activo */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setIsCatalogOpen((prev) => !prev)}
            className={`vision-btn !py-1 !px-2.5 text-xs flex items-center gap-1.5 font-semibold transition-all ${
              isCatalogOpen ? 'vision-btn-primary' : 'text-primary hover:border-indigo-500/40'
            }`}
            title="Abrir u ocultar catálogo de diagramas"
          >
            <span className="material-symbols-outlined text-[16px]">menu_open</span>
            <span className="hidden sm:inline">
              {isCatalogOpen ? 'Ocultar Catálogo' : 'Catálogo'}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 ml-0.5 border border-indigo-500/30">
              {activeTab === 'interactive' ? DIAGRAM_CATALOG.length : umlTemplates.length + injectedAiDiagrams.length}
            </span>
          </button>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          {/* Título y Badge del diagrama actual */}
          <div className="min-w-0 flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 font-semibold uppercase shrink-0">
              {activeTab === 'interactive'
                ? activeInteractiveSpec.badge || activeInteractiveSpec.category
                : activeMermaidStandard}
            </span>
            <h3 className="text-xs sm:text-sm font-semibold text-primary truncate max-w-[240px] sm:max-w-md">
              {activeTab === 'interactive'
                ? activeInteractiveSpec.title
                : activeMermaidTitle}
            </h3>
          </div>
        </div>

        {/* Centro: Selector de Pestañas (Interactivos vs UML OKF) */}
        <div
          className={`flex items-center gap-1 p-0.5 rounded-lg border order-3 sm:order-2 ${
            isDark ? 'bg-black/30 border-white/10' : 'bg-slate-200/70 border-slate-300'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('mermaid')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'mermaid'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">account_tree</span>
            <span>Diagramas UML (Mermaid)</span>
            <span className="text-[9.5px] font-mono px-1 py-0.2 rounded bg-white/20">
              {umlTemplates.length + injectedAiDiagrams.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('interactive')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'interactive'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">insights</span>
            <span>Interactivos SVG</span>
            <span className="text-[9.5px] font-mono px-1 py-0.2 rounded bg-white/20">
              {DIAGRAM_CATALOG.length}
            </span>
          </button>
        </div>

        {/* Derecha: Menú de Exportación y Fullscreen */}
        <div className="flex items-center gap-1.5 order-2 sm:order-3">
          {/* Dropdown de Exportación (solo activo o visible para interactivos o con opciones) */}
          <div className="relative" ref={exportMenuRef}>
            <VisionButton
              variant="primary"
              size="sm"
              icon="download"
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              disabled={isExporting}
              className="!py-1 !px-2.5 !text-xs font-semibold shadow-md"
              title="Descargar diagrama en múltiples formatos"
            >
              Exportar
              <span className="material-symbols-outlined text-[14px] ml-0.5">
                {isExportMenuOpen ? 'expand_less' : 'expand_more'}
              </span>
            </VisionButton>

            {isExportMenuOpen && (
              <div
                className={`absolute right-0 top-full mt-1.5 w-56 border shadow-2xl p-1.5 rounded-xl z-50 text-xs space-y-1 animate-in fade-in ${
                  isDark
                    ? 'vision-window border-white/10 text-white'
                    : 'bg-white border-slate-200 text-slate-800 shadow-xl'
                }`}
              >
                <div className="px-2 py-1 text-[10px] font-mono uppercase text-muted border-b border-glass-subtle">
                  Formatos de Entrega
                </div>

                <button
                  type="button"
                  onClick={handleExportSvg}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 text-primary flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-cyan-400">code</span>
                  <div className="flex-1">
                    <div className="font-semibold">Vectorial SVG (.svg)</div>
                    <div className="text-[9.5px] text-muted">Vector puro escalable</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportPng}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 text-primary flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-emerald-400">image</span>
                  <div className="flex-1">
                    <div className="font-semibold">Imagen PNG 2x (.png)</div>
                    <div className="text-[9.5px] text-muted">Alta resolución para reportes</div>
                  </div>
                </button>

                {activeTab === 'mermaid' && (
                  <button
                    type="button"
                    onClick={handleExportMmd}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 text-primary flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm text-fuchsia-400">code_blocks</span>
                    <div className="flex-1">
                      <div className="font-semibold">Código Mermaid (.mmd)</div>
                      <div className="text-[9.5px] text-muted">Definición UML/BPMN en texto puro</div>
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExportHtml}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 text-primary flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-amber-400">html</span>
                  <div className="flex-1">
                    <div className="font-semibold">HTML Autónomo (.html)</div>
                    <div className="text-[9.5px] text-muted">Zero-script, abre en cualquier browser</div>
                  </div>
                </button>

                <div className="h-px bg-white/10 my-1" />

                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/10 text-primary flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-indigo-400">print</span>
                  <div className="flex-1">
                    <div className="font-semibold">Imprimir / PDF</div>
                    <div className="text-[9.5px] text-muted">Optimizado para impresión A4/Carta</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Botón de Pantalla Completa */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="vision-btn !p-1 text-muted hover:text-primary"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla Completa Inmersiva'}
          >
            <span className="material-symbols-outlined text-[17px]">
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>
        </div>
      </header>

      {/* 2. CONTENIDO PRINCIPAL: CANVAS AL 100% Y DRAWER RETRÁCTIL DESDE LA IZQUIERDA */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {/* Backdrop en pantallas pequeñas para cerrar al tocar fuera */}
        {isCatalogOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs sm:hidden"
            onClick={() => setIsCatalogOpen(false)}
          />
        )}

        {/* Drawer Deslizante Izquierdo del Catálogo */}
        <aside
          className={`vision-drawer absolute top-0 bottom-0 left-0 z-40 w-80 max-w-[85vw] flex flex-col border-r shadow-2xl transition-transform duration-300 ease-in-out ${
            isDark
              ? 'border-white/10 bg-slate-950/95 backdrop-blur-xl text-slate-100'
              : 'border-slate-200 bg-white/95 backdrop-blur-xl text-slate-900'
          } ${isCatalogOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {/* Cabecera del Drawer */}
          <div
            className={`p-3 border-b flex items-center justify-between ${
              isDark ? 'border-white/10' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400 text-[18px]">
                {activeTab === 'interactive' ? 'hub' : 'account_tree'}
              </span>
              <span className="text-xs font-semibold">
                {activeTab === 'interactive'
                  ? 'Catálogo Interactivo'
                  : 'Modelos UML OKF'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsCatalogOpen(false)}
              className="vision-btn !p-1 text-muted hover:text-primary"
              title="Cerrar catálogo (Esc)"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
          </div>

          {/* Barra de búsqueda universal y Filtros */}
          <div
            className={`p-2 border-b space-y-2 ${
              isDark ? 'border-white/10' : 'border-slate-200'
            }`}
          >
            <input
              type="text"
              placeholder={activeTab === 'interactive' ? 'Buscar interactivo...' : 'Buscar diagrama UML o BPMN...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-2.5 py-1 text-xs rounded-lg border focus:outline-none focus:border-indigo-500 ${
                isDark
                  ? 'bg-black/30 border-white/10 text-white placeholder-slate-500'
                  : 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />

            {activeTab === 'interactive' && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setKindFilter('all')}
                  className={`flex-1 py-1 rounded text-[10px] font-mono transition-all ${
                    kindFilter === 'all'
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : isDark
                        ? 'text-slate-400 hover:text-white bg-white/5'
                        : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                  }`}
                >
                  Todos (8)
                </button>
                <button
                  type="button"
                  onClick={() => setKindFilter('graph')}
                  className={`flex-1 py-1 rounded text-[10px] font-mono transition-all ${
                    kindFilter === 'graph'
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : isDark
                        ? 'text-slate-400 hover:text-white bg-white/5'
                        : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                  }`}
                >
                  Estructura (6)
                </button>
                <button
                  type="button"
                  onClick={() => setKindFilter('sequence')}
                  className={`flex-1 py-1 rounded text-[10px] font-mono transition-all ${
                    kindFilter === 'sequence'
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : isDark
                        ? 'text-slate-400 hover:text-white bg-white/5'
                        : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                  }`}
                >
                  Secuencia (2)
                </button>
              </div>
            )}
          </div>

          {/* Lista de Tarjetas */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            {error && (
              <div className="p-2 mb-2 rounded bg-rose-500/10 border border-rose-500/30 text-[10.5px] text-rose-300">
                {error}
              </div>
            )}
            {isLoading && (
              <div className="p-3 text-center text-xs text-secondary animate-pulse">
                Sincronizando modelos del proyecto...
              </div>
            )}
            {activeTab === 'interactive' ? (
              filteredInteractive.map((item) => {
                const isSelected = item.id === activeInteractiveItem.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedInteractiveId(item.id);
                      setIsCatalogOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex flex-col gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-500/15 border-indigo-500/40 shadow-sm shadow-indigo-500/20'
                        : isDark
                          ? 'bg-white/[0.02] hover:bg-white/[0.05] border-transparent'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-400 border border-sky-500/20">
                        {item.badge}
                      </span>
                      <span className="text-[9px] font-mono text-muted uppercase">
                        {item.kind}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-primary mt-0.5">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-secondary line-clamp-2">
                      {item.subtitle}
                    </div>
                  </button>
                );
              })
            ) : (
              <>
                {/* Sección 1: Modelos de Arquitectura OKF Vivos */}
                <div className="space-y-1.5 pb-2 mb-2 border-b border-glass-subtle">
                  <div className="text-[9.5px] font-mono text-indigo-400 font-semibold uppercase px-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">schema</span>
                    <span>Modelos de Arquitectura OKF ({filteredUmlTemplates.length})</span>
                  </div>
                  {filteredUmlTemplates.map((tpl) => {
                    const isSelected = tpl.id === activeMermaidTemplate.id && !activeAiDiagram;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          setSelectedMermaidId(tpl.id);
                          setIsCatalogOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex flex-col gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-500/15 border-indigo-500/40 shadow-sm shadow-indigo-500/20'
                            : isDark
                              ? 'bg-white/[0.02] hover:bg-white/[0.05] border-transparent'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-400 border border-purple-500/20">
                            {tpl.standard}
                          </span>
                          <span className="text-[9px] font-mono text-muted">
                            OKF VIVO
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-primary mt-0.5">
                          {tpl.title}
                        </div>
                        <div className="text-[10px] text-secondary line-clamp-2">
                          {tpl.description}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Sección 2: Diagramas Inyectados por el Copiloto IA */}
                {injectedAiDiagrams.length > 0 && (
                  <div className="space-y-1.5 pb-2 mb-2">
                    <div className="text-[9.5px] font-mono text-fuchsia-400 font-semibold uppercase px-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">smart_toy</span>
                      <span>Inyectados por Copiloto IA ({filteredAiDiagrams.length})</span>
                    </div>
                    {filteredAiDiagrams.map((diag) => {
                      const isSelected = selectedMermaidId === `ai-${diag.code}`;
                      return (
                        <button
                          key={`ai-${diag.code}`}
                          type="button"
                          onClick={() => {
                            setSelectedMermaidId(`ai-${diag.code}`);
                            setIsCatalogOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all flex flex-col gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-fuchsia-500/15 border-fuchsia-500/40 shadow-sm shadow-fuchsia-500/20'
                              : isDark
                                ? 'bg-white/[0.02] hover:bg-white/[0.05] border-transparent'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/20">
                              {diag.code}
                            </span>
                            <span className="text-[9px] font-mono text-muted uppercase">
                              {diag.type}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-primary mt-0.5">
                            {diag.title}
                          </div>
                          {diag.description && (
                            <div className="text-[10px] text-secondary line-clamp-2">
                              {diag.description}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {filteredUmlTemplates.length === 0 && filteredAiDiagrams.length === 0 && (
                  <div className="p-4 text-center text-xs text-muted">
                    No se encontraron diagramas con "{searchQuery}"
                  </div>
                )}
              </>
            )}
          </div>
        </aside>

        {/* 3. VISOR DEL DIAGRAMA (100% DEL ÁREA CENTRAL) */}
        <div className="absolute inset-0 flex flex-col min-w-0 h-full overflow-hidden">
          {activeTab === 'interactive' ? (
            activeInteractiveSpec.kind === 'graph' ? (
              <GraphCanvas
                spec={activeInteractiveSpec}
                onExportSvgRef={(svg) => {
                  activeSvgRef.current = svg;
                }}
              />
            ) : (
              <SequenceCanvas
                spec={activeInteractiveSpec}
                onExportSvgRef={(svg) => {
                  activeSvgRef.current = svg;
                }}
              />
            )
          ) : (
            <div
              className={`w-full h-full overflow-y-auto p-4 custom-scrollbar transition-colors ${
                isDark ? 'bg-[#070b16]' : 'bg-slate-50'
              }`}
            >
              <div className="max-w-5xl mx-auto space-y-3">
                {entities.length === 0 &&
                  (selectedMermaidId === 'class-diagram' || selectedMermaidId === 'erd-relational-model') && (
                    <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex items-center justify-between gap-3 animate-fade-in">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">info</span>
                        <span>
                          Aún no se han definido tablas en el Canvas relacional. El diagrama se actualizará automáticamente cuando agregues entidades o solicites al Copiloto generarlas.
                        </span>
                      </div>
                    </div>
                  )}

                <MermaidVisualizer
                  code={activeMermaidCode}
                  title={activeMermaidTitle}
                  standard={activeMermaidStandard}
                  showCode={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
