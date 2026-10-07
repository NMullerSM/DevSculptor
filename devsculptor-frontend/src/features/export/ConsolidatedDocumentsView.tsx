import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { requirementsService } from '@/services/requirements.service';
import { decisionsService } from '@/services/decisions.service';
import { canvasService } from '@/services/canvas.service';
import { Requirement } from '@/types/requirement.types';
import { Decision } from '@/types/decision.types';
import { CanvasEntity } from '@/types/canvas.types';
import { ENTERPRISE_TEMPLATES } from './okfTemplates';
import { documentExportService, triggerFileDownload } from './documentExportService';
import { VisionButton } from '@/components/ui/VisionButton';
import { MermaidVisualizer } from '@/components/diagrams/MermaidVisualizer';

interface ConsolidatedDocumentsViewProps {
  projectId: string;
}

type CategoryFilter = 'all' | 'requirements' | 'architecture' | 'diagrams' | 'quality';
type PreviewMode = 'executive' | 'diagram' | 'source';

export const ConsolidatedDocumentsView: React.FC<ConsolidatedDocumentsViewProps> = ({ projectId }) => {
  const { activeProject, metrics } = useProjectStore();

  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [entities, setEntities] = useState<CanvasEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('srs-ieee830');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('executive');
  const [hasCopied, setHasCopied] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        if (containerRef.current) {
          if (containerRef.current.requestFullscreen) {
            await containerRef.current.requestFullscreen();
          }
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Error alternando pantalla completa en visor documental:', err);
    }
  };

  // Cargar datos sincronizados del proyecto
  useEffect(() => {
    let isMounted = true;
    const loadProjectData = async () => {
      if (!projectId) return;
      setIsLoading(true);
      setError(null);
      try {
        const [reqsData, decsData, entsData] = await Promise.all([
          requirementsService.getAllByProject(projectId).catch(() => []),
          decisionsService.getAllByProject(projectId).catch(() => []),
          canvasService.getAllByProject(projectId).catch(() => []),
        ]);
        if (isMounted) {
          setRequirements(reqsData);
          setDecisions(decsData);
          setEntities(entsData);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error al cargar datos del proyecto');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProjectData();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Filtrado del catálogo de las 13 plantillas
  const filteredTemplates = useMemo(() => {
    return ENTERPRISE_TEMPLATES.filter((tpl) => {
      const matchesCategory = categoryFilter === 'all' || tpl.category === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tpl.title.toLowerCase().includes(q) ||
        tpl.standard.toLowerCase().includes(q) ||
        tpl.canonicalPath.toLowerCase().includes(q) ||
        tpl.tags.some((t) => t.toLowerCase().includes(q)) ||
        tpl.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [categoryFilter, searchQuery]);

  const selectedTemplate = useMemo(() => {
    return (
      ENTERPRISE_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
      ENTERPRISE_TEMPLATES[0]
    );
  }, [selectedTemplateId]);

  // Contenido generado en tiempo real
  const generatedContent = useMemo(() => {
    if (!activeProject || !selectedTemplate) return null;
    return selectedTemplate.generate(activeProject, requirements, entities, decisions, metrics);
  }, [activeProject, selectedTemplate, requirements, entities, decisions, metrics]);

  // HTML Universal para Vista Ejecutiva e Impresión
  const fullHtmlPreview = useMemo(() => {
    if (!activeProject || !selectedTemplate) return '';
    return documentExportService.getEnterpriseTemplateHtml(
      activeProject,
      selectedTemplate,
      requirements,
      entities,
      decisions,
      metrics
    );
  }, [activeProject, selectedTemplate, requirements, entities, decisions, metrics]);

  // Si cambia de plantilla a una no-diagrama y estaba en modo diagrama, volver a vista ejecutiva
  useEffect(() => {
    if (selectedTemplate.category !== 'diagrams' && previewMode === 'diagram') {
      setPreviewMode('executive');
    }
  }, [selectedTemplate, previewMode]);

  const handleCopyMarkdown = async () => {
    if (!generatedContent) return;
    try {
      await navigator.clipboard.writeText(generatedContent.fullContent);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (e) {
      console.error('Error al copiar contenido al portapapeles', e);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!activeProject || !selectedTemplate) return;
    documentExportService.exportEnterpriseTemplate(
      activeProject,
      selectedTemplate,
      'md',
      requirements,
      entities,
      decisions,
      metrics
    );
  };

  const handleDownloadMmd = () => {
    if (!activeProject || !selectedTemplate || !generatedContent) return;
    const cleanCode = generatedContent.markdown
      .replace(/^```[a-z0-9_-]*\n/i, '')
      .replace(/\n```$/, '')
      .trim();
    const filename = `${selectedTemplate.canonicalPath.split('/').pop()?.replace('.md', '') || 'diagram'}.mmd`;
    triggerFileDownload(cleanCode, filename, 'text/plain;charset=utf-8');
  };

  const handleDownloadHtml = () => {
    if (!activeProject || !selectedTemplate) return;
    documentExportService.exportEnterpriseTemplate(
      activeProject,
      selectedTemplate,
      'html',
      requirements,
      entities,
      decisions,
      metrics
    );
  };

  const handlePrintPdf = () => {
    if (!activeProject || !selectedTemplate) return;
    documentExportService.printEnterpriseTemplate(
      activeProject,
      selectedTemplate,
      requirements,
      entities,
      decisions,
      metrics
    );
  };

  // Contadores dinámicos por categoría
  const categoryCounts = useMemo(() => {
    const counts = {
      all: ENTERPRISE_TEMPLATES.length,
      requirements: 0,
      architecture: 0,
      diagrams: 0,
      quality: 0,
    };
    ENTERPRISE_TEMPLATES.forEach((t) => {
      if (t.category in counts) {
        counts[t.category as keyof typeof counts] += 1;
      }
    });
    return counts;
  }, []);

  if (!activeProject) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-secondary">
        <p className="text-xs">No hay un proyecto activo seleccionado.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex-1 flex flex-col h-full overflow-hidden select-none transition-colors ${
        isFullscreen ? 'bg-[#080d1a] fixed inset-0 z-50' : ''
      }`}
    >
      {/* Barra Superior con Métricas y Filtros de Categoría */}
      <div className="px-3 sm:px-4 py-2 border-b border-glass-subtle bg-black/20 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          {/* Botón para colapsar/expandir el catálogo lateral */}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-secondary hover:text-primary transition-all border border-glass-subtle flex items-center justify-center"
            title={isSidebarCollapsed ? 'Mostrar catálogo de plantillas' : 'Colapsar catálogo para pantalla ancha'}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isSidebarCollapsed ? 'right_panel_open' : 'left_panel_close'}
            </span>
          </button>

          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-primary">
            Espacio de Documentos Consolidados (OKF Enterprise)
          </span>
          <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {ENTERPRISE_TEMPLATES.length} PLANTILLAS FORMALES
          </span>
        </div>

        {/* Categorías */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
          {(
            [
              { id: 'all', label: `Todos (${categoryCounts.all})` },
              { id: 'requirements', label: `Requisitos (${categoryCounts.requirements})` },
              { id: 'architecture', label: `Arquitectura (${categoryCounts.architecture})` },
              { id: 'diagrams', label: `Diagramas UML (${categoryCounts.diagrams})` },
              { id: 'quality', label: `Calidad & APIs (${categoryCounts.quality})` },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2 py-0.5 text-[10px] rounded-md font-medium transition-all ${
                categoryFilter === cat.id
                  ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30 font-semibold'
                  : 'text-secondary hover:text-primary hover:bg-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cuerpo Principal Dividido: Lista Lateral de Plantillas + Visor Activo */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Panel Lateral: Catálogo de Plantillas (Colapsable) */}
        {!isSidebarCollapsed && (
          <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-glass-subtle flex flex-col shrink-0 bg-black/15 transition-all animate-fadeIn">
            {/* Barra de búsqueda */}
            <div className="p-2.5 border-b border-glass-subtle flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-2 top-2 text-[15px] text-muted pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por estándar, título, tag..."
                  className="vision-input !pl-7 !py-1 !text-xs w-full"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1.5 text-muted hover:text-primary text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(true)}
                className="hidden md:flex p-1 rounded hover:bg-white/10 text-muted hover:text-primary transition-colors"
                title="Colapsar panel"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
            </div>

          {/* Lista scrollable de plantillas */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            {error && (
              <div className="p-2 mb-2 rounded bg-rose-500/10 border border-rose-500/30 text-[10.5px] text-rose-300">
                {error}
              </div>
            )}
            {isLoading ? (
              <div className="p-4 text-center text-xs text-secondary animate-pulse">
                Cargando especificaciones y entidades del proyecto...
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="p-4 text-center text-xs text-secondary">
                No se encontraron plantillas con el filtro actual.
              </div>
            ) : (
              filteredTemplates.map((tpl) => {
                const isSelected = tpl.id === selectedTemplate.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-500/15 border-indigo-500/40 shadow-sm shadow-indigo-500/20'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[9.5px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 border border-white/10 shrink-0">
                        {tpl.standard}
                      </span>
                      <span className="text-[9px] font-mono text-muted truncate">
                        {tpl.canonicalPath}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-primary line-clamp-1">
                      {tpl.title}
                    </div>

                    <div className="text-[10px] text-secondary line-clamp-1 font-sans">
                      {tpl.description}
                    </div>

                    {/* Tags / Hooks */}
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      {tpl.aiHooks.slice(0, 2).map((hook) => (
                        <span
                          key={hook}
                          className="text-[8.5px] font-mono text-indigo-300 bg-indigo-500/10 px-1 py-0.2 rounded"
                        >
                          ⚡ {hook}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Panel Central: Visor del Documento Consolidado */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-black/5">
          {/* Cabecera del Documento Activo */}
          <div className="p-3 border-b border-glass-subtle bg-white/[0.01] flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 shrink-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-bold text-primary truncate">
                  {selectedTemplate.title}
                </h3>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 shrink-0">
                  {selectedTemplate.standard}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted font-mono truncate">
                <span>Ruta: {selectedTemplate.canonicalPath}</span>
                <span>•</span>
                <span className="text-emerald-400">Vinculado a Bóveda OKF</span>
              </div>
            </div>

            {/* Acciones de Exportación & Impresión */}
            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              {/* Selector de Modo de Vista */}
              <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-glass-subtle mr-1">
                <button
                  type="button"
                  onClick={() => setPreviewMode('executive')}
                  className={`px-2 py-1 text-[10px] rounded font-medium transition-all ${
                    previewMode === 'executive'
                      ? 'bg-indigo-600 text-white font-semibold shadow'
                      : 'text-secondary hover:text-primary'
                  }`}
                  title="Vista ejecutiva renderizada con estilos de alta fidelidad, código y diagramas"
                >
                  Vista Ejecutiva
                </button>

                {selectedTemplate.category === 'diagrams' && (
                  <button
                    type="button"
                    onClick={() => setPreviewMode('diagram')}
                    className={`px-2 py-1 text-[10px] rounded font-medium transition-all ${
                      previewMode === 'diagram'
                        ? 'bg-indigo-600 text-white font-semibold shadow'
                        : 'text-secondary hover:text-primary'
                    }`}
                    title="Lienzo interactivo React con zoom y renderizado vectorial de arquitectura"
                  >
                    Diagrama Interactivo
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setPreviewMode('source')}
                  className={`px-2 py-1 text-[10px] rounded font-medium transition-all ${
                    previewMode === 'source'
                      ? 'bg-indigo-600 text-white font-semibold shadow'
                      : 'text-secondary hover:text-primary'
                  }`}
                  title="Markdown con YAML Frontmatter puro para IA o Git"
                >
                  YAML & Markdown
                </button>
              </div>

              {/* Botón Copiar */}
              <VisionButton
                variant="secondary"
                size="sm"
                icon={hasCopied ? 'check' : 'content_copy'}
                onClick={handleCopyMarkdown}
                title="Copiar contenido con Frontmatter al portapapeles"
                className="!text-xs"
              >
                {hasCopied ? '¡Copiado!' : 'Copiar'}
              </VisionButton>

              {/* Descargar Markdown */}
              <VisionButton
                variant="secondary"
                size="sm"
                icon="description"
                onClick={handleDownloadMarkdown}
                title="Descargar archivo .md listo para git"
                className="!text-xs"
              >
                .md
              </VisionButton>

              {/* Descargar .mmd puro (Mermaid Definition) cuando es plantilla de diagramas */}
              {selectedTemplate.category === 'diagrams' && (
                <VisionButton
                  variant="secondary"
                  size="sm"
                  icon="account_tree"
                  onClick={handleDownloadMmd}
                  title="Descargar definición pura de Mermaid (.mmd)"
                  className="!text-xs text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/10"
                >
                  .mmd
                </VisionButton>
              )}

              {/* Descargar HTML */}
              <VisionButton
                variant="secondary"
                size="sm"
                icon="html"
                onClick={handleDownloadHtml}
                title="Descargar HTML standalone con estilos ejecutivos y diagramas renderizados"
                className="!text-xs"
              >
                .html
              </VisionButton>

              {/* Imprimir / Guardar como PDF */}
              <VisionButton
                variant="primary"
                size="sm"
                icon="print"
                onClick={handlePrintPdf}
                title="Abre la ventana de impresión nativa optimizada para guardar como PDF"
                className="!text-xs !bg-gradient-to-r !from-indigo-600 !to-cyan-600 text-white shadow-lg shadow-indigo-500/20"
              >
                PDF / Imprimir
              </VisionButton>

              {/* Alternar Pantalla Completa Inmersiva */}
              <VisionButton
                variant="secondary"
                size="sm"
                icon={isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Salir de pantalla completa' : 'Expandir a pantalla completa inmersiva'}
                className="!text-xs text-indigo-300 hover:text-white border-indigo-500/30"
              >
                {isFullscreen ? 'Salir' : 'Pantalla Completa'}
              </VisionButton>
            </div>
          </div>

          {/* Área de Visualización */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            {previewMode === 'diagram' && selectedTemplate.category === 'diagrams' ? (
              <div className="w-full h-full overflow-y-auto p-4 custom-scrollbar bg-[#070b16]">
                <div className="max-w-5xl mx-auto">
                  <MermaidVisualizer
                    code={generatedContent?.markdown || ''}
                    title={selectedTemplate.title}
                    standard={selectedTemplate.standard}
                    showCode={true}
                  />
                </div>
              </div>
            ) : previewMode === 'executive' ? (
              <iframe
                title="Executive Document Preview"
                srcDoc={fullHtmlPreview}
                className="w-full h-full border-none bg-[#0a0f1d]"
                sandbox="allow-same-origin allow-scripts"
              />
            ) : (
              <div className="w-full h-full overflow-y-auto p-4 custom-scrollbar bg-[#090d16] font-mono text-xs">
                <div className="max-w-4xl mx-auto space-y-4">
                  {/* YAML Frontmatter Inspector */}
                  <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-indigo-500/20 text-[10px] font-semibold text-indigo-300 uppercase tracking-wider">
                      <span>YAML Frontmatter Metadata (AI Binding Contract)</span>
                      <span className="text-[9px] bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-200">
                        Zod Ratified
                      </span>
                    </div>
                    <pre className="text-emerald-400 whitespace-pre font-mono text-[11px] leading-relaxed overflow-x-auto">
                      {generatedContent?.yamlFrontmatter}
                    </pre>
                  </div>

                  {/* Markdown Body */}
                  <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10 text-[10px] font-semibold text-muted uppercase tracking-wider">
                      <span>Cuerpo Markdown Documental</span>
                      <span className="text-[9px] text-secondary">
                        {generatedContent?.markdown.split('\n').length} líneas
                      </span>
                    </div>
                    <pre className="text-slate-200 whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed">
                      {generatedContent?.markdown}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
