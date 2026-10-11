import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { requirementsService } from '@/services/requirements.service';
import { decisionsService } from '@/services/decisions.service';
import { canvasService } from '@/services/canvas.service';
import { Requirement } from '@/types/requirement.types';
import { Decision } from '@/types/decision.types';
import { CanvasEntity } from '@/types/canvas.types';
import { ENTERPRISE_TEMPLATES, EnterpriseTemplateDef } from './okfTemplates';
import { documentExportService, triggerFileDownload } from './documentExportService';
import { MermaidVisualizer } from '@/components/diagrams/MermaidVisualizer';
import { useThemeStore } from '@/stores/useThemeStore';
import { useAiChatStore } from '@/stores/useAiChatStore';

interface ConsolidatedDocumentsViewProps {
  projectId: string;
}

type CategoryFilter = 'all' | 'requirements' | 'architecture' | 'diagrams' | 'quality';
type PreviewMode = 'executive' | 'diagram' | 'source';

export const ConsolidatedDocumentsView: React.FC<ConsolidatedDocumentsViewProps> = ({ projectId }) => {
  const { activeProject, metrics } = useProjectStore();
  const projectSession = useAiChatStore((s) => (projectId ? s.sessions[projectId] : undefined));
  const injectedAiDiagrams = useMemo(
    () => projectSession?.injectedDiagrams || [],
    [projectSession?.injectedDiagrams]
  );
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

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
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar catálogo con tecla Escape si está abierto
  useEffect(() => {
    if (!isCatalogOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCatalogOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCatalogOpen]);

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

  // Catálogo unificado: 19 plantillas base OKF + diagramas inyectados por el Copiloto IA
  const allTemplates = useMemo<EnterpriseTemplateDef[]>(() => {
    const aiTemplates: EnterpriseTemplateDef[] = injectedAiDiagrams.map((diag) => {
      const templateId = `ai-${diag.code.toLowerCase()}`;
      return {
        id: templateId,
        title: `${diag.title} (${diag.code})`,
        category: 'diagrams',
        standard: `UML / BPMN (${diag.type.toUpperCase()})`,
        canonicalPath: `architecture/diagrams/${diag.code.toLowerCase()}.md`,
        tags: ['diagram', 'uml', 'mermaid', 'ai-generated', diag.type],
        description: diag.description || `Diagrama arquitectónico ${diag.type} inyectado por el Copiloto IA.`,
        aiHooks: ['ai.diagrams', `diagram.${diag.code}`],
        generate: (project) => {
          const frontmatter = `---
template_id: "${diag.code}"
canonical_path: "architecture/diagrams/${diag.code.toLowerCase()}.md"
document_type: "ARCHITECTURAL_DIAGRAM"
standard: "UML / BPMN (${diag.type.toUpperCase()})"
title: "${diag.title}"
project_name: "${project.name}"
version: "1.0.0"
generated_at: "${new Date().toISOString()}"
ai_context_hooks:
  - "ai.diagrams"
tags:
  - "diagram"
  - "mermaid"
  - "${diag.type}"
---`;
          const body = `# ${diag.title}\n\n**Código:** ${diag.code} | **Tipo:** ${diag.type.toUpperCase()}\n\n${diag.description ? `> ${diag.description}\n\n` : ''}\`\`\`mermaid\n${diag.mermaidCode}\n\`\`\`\n`;
          return {
            markdown: body,
            yamlFrontmatter: frontmatter,
            fullContent: `${frontmatter}\n\n${body}`,
          };
        },
      };
    });

    return [...ENTERPRISE_TEMPLATES, ...aiTemplates];
  }, [injectedAiDiagrams]);

  // Filtrado del catálogo unificado
  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((tpl) => {
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
  }, [allTemplates, categoryFilter, searchQuery]);

  const selectedTemplate = useMemo(() => {
    return (
      allTemplates.find((t) => t.id === selectedTemplateId) ||
      allTemplates[0] ||
      ENTERPRISE_TEMPLATES[0]
    );
  }, [allTemplates, selectedTemplateId]);

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
      all: allTemplates.length,
      requirements: 0,
      architecture: 0,
      diagrams: 0,
      quality: 0,
    };
    allTemplates.forEach((t) => {
      if (t.category in counts) {
        counts[t.category as keyof typeof counts] += 1;
      }
    });
    return counts;
  }, [allTemplates]);

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
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      } ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Barra Superior con Métricas y Filtros de Categoría */}
      <div
        className={`px-3 sm:px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 shrink-0 ${
          isDark ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-white/70 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2">
          {/* Botón retráctil estilo CanvasDrawer para abrir/cerrar catálogo */}
          <button
            type="button"
            onClick={() => setIsCatalogOpen((prev) => !prev)}
            className="vision-btn !rounded-full !py-1 !px-3 text-[11px] flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            aria-expanded={isCatalogOpen}
            aria-controls="okf-catalog-drawer"
            title={isCatalogOpen ? 'Ocultar catálogo de plantillas' : 'Desplegar catálogo de plantillas'}
          >
            <span className="material-symbols-outlined text-[15px]">
              {isCatalogOpen ? 'chevron_left' : 'view_sidebar'}
            </span>
            <span>{isCatalogOpen ? 'Ocultar' : `Catálogo (${allTemplates.length})`}</span>
          </button>

          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-primary">
            Espacio de Documentos Consolidados (OKF Enterprise)
          </span>
          <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {allTemplates.length} DOCUMENTOS FORMALES
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

      {/* Cuerpo Principal: Visor a Pantalla Completa + Drawer Deslizante sobrepuesto */}
      <div className="flex-1 relative min-h-0 overflow-hidden">
        {/* Backdrop en pantallas pequeñas */}
        {isCatalogOpen && (
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20 md:hidden transition-opacity"
            onClick={() => setIsCatalogOpen(false)}
          />
        )}

        {/* Panel Desplegable (Sliding Drawer) del Catálogo de Plantillas */}
        <aside
          id="okf-catalog-drawer"
          className={`vision-drawer absolute top-0 left-0 bottom-0 w-80 sm:w-96 max-w-[90vw] z-30 flex flex-col transition-transform duration-300 ease-out shadow-2xl ${
            isDark
              ? 'border-r border-white/10 bg-slate-950/95 text-slate-100'
              : 'border-r border-slate-200 bg-white/95 text-slate-900'
          } ${isCatalogOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'}`}
          aria-hidden={!isCatalogOpen}
        >
          {/* Barra de búsqueda y cabecera del drawer */}
          <div
            className={`p-2.5 border-b flex items-center justify-between gap-2 shrink-0 ${
              isDark ? 'border-white/10' : 'border-slate-200'
            }`}
          >
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-2 top-2 text-[15px] text-muted pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por estándar, título, tag..."
                className={`vision-input !pl-7 !py-1 !text-xs w-full ${
                  isDark
                    ? 'bg-black/30 border-white/10 text-white placeholder-slate-500'
                    : 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 text-muted hover:text-primary text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsCatalogOpen(false)}
              className="p-1 rounded hover:bg-white/10 text-muted hover:text-primary transition-colors cursor-pointer"
              title="Cerrar catálogo"
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
                    onClick={() => {
                      setSelectedTemplateId(tpl.id);
                      setIsCatalogOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex flex-col gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-500/15 border-indigo-500/40 shadow-sm shadow-indigo-500/20'
                        : isDark
                          ? 'bg-white/[0.02] hover:bg-white/[0.05] border-transparent'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
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
        </aside>

        {/* Panel Central: Visor del Documento Consolidado (100% Ancho) */}
        <div className="absolute inset-0 flex flex-col min-w-0 h-full overflow-hidden">
          {/* 1. DOCK FLOTANTE EN PANTALLA COMPLETA */}
          {isFullscreen && (
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2 p-1.5 rounded-xl shadow-2xl backdrop-blur-xl border border-white/20 bg-slate-900/85 text-white animate-in fade-in slide-in-from-top-2">
              {/* Selector de modo flotante */}
              <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setPreviewMode('executive')}
                  className={`px-2 py-0.5 text-[10.5px] rounded-md font-medium transition-all ${
                    previewMode === 'executive'
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="Vista Ejecutiva"
                >
                  Vista Ejecutiva
                </button>
                {selectedTemplate.category === 'diagrams' && (
                  <button
                    type="button"
                    onClick={() => setPreviewMode('diagram')}
                    className={`px-2 py-0.5 text-[10.5px] rounded-md font-medium transition-all ${
                      previewMode === 'diagram'
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                    title="Diagrama Interactivo"
                  >
                    Diagrama
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewMode('source')}
                  className={`px-2 py-0.5 text-[10.5px] rounded-md font-medium transition-all ${
                    previewMode === 'source'
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="YAML & Markdown"
                >
                  YAML & MD
                </button>
              </div>

              <div className="h-4 w-px bg-white/20" />

              {/* Micro-acciones flotantes */}
              <button
                type="button"
                onClick={handleCopyMarkdown}
                title="Copiar contenido"
                className={`p-1.5 rounded-lg border text-xs flex items-center transition-all cursor-pointer ${
                  hasCopied
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {hasCopied ? 'check' : 'content_copy'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadMarkdown}
                title="Descargar .md"
                className="p-1.5 rounded-lg border border-white/10 bg-white/10 hover:bg-white/20 text-white text-xs flex items-center transition-all cursor-pointer font-mono text-[10px]"
              >
                .md
              </button>

              {selectedTemplate.category === 'diagrams' && (
                <button
                  type="button"
                  onClick={handleDownloadMmd}
                  title="Descargar .mmd"
                  className="p-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs flex items-center transition-all cursor-pointer font-mono text-[10px]"
                >
                  .mmd
                </button>
              )}

              <button
                type="button"
                onClick={handleDownloadHtml}
                title="Descargar .html"
                className="p-1.5 rounded-lg border border-white/10 bg-white/10 hover:bg-white/20 text-white text-xs flex items-center transition-all cursor-pointer font-mono text-[10px]"
              >
                .html
              </button>

              <button
                type="button"
                onClick={handlePrintPdf}
                title="Imprimir / PDF"
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs flex items-center transition-all shadow-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">print</span>
              </button>

              <div className="h-4 w-px bg-white/20" />

              {/* Salir de pantalla completa */}
              <button
                type="button"
                onClick={toggleFullscreen}
                title="Salir de pantalla completa (Esc)"
                className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs flex items-center transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">fullscreen_exit</span>
              </button>
            </div>
          )}

          {/* 2. CABECERA LIGERA EN MODO NORMAL (SIN ETIQUETAS DE COLORES, SELECTOR AL LADO DEL TÍTULO, MICRO-BOTONES) */}
          {!isFullscreen && (
            <div
              className={`px-3.5 py-2 border-b flex items-center justify-between gap-3 shrink-0 transition-colors ${
                isDark
                  ? 'border-white/10 bg-white/[0.02]'
                  : 'border-slate-200 bg-white/80 shadow-xs'
              }`}
            >
              {/* Lado Izquierdo: Nombre del Documento + Selector de Vista al lado derecho */}
              <div className="flex items-center gap-3 min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-primary truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                  {selectedTemplate.title}
                </h3>

                {/* Selector de Modo de Vista colocado inmediatamente a la derecha del título */}
                <div
                  className={`flex items-center p-0.5 rounded-lg border shrink-0 ${
                    isDark ? 'bg-black/40 border-white/10' : 'bg-slate-200/70 border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setPreviewMode('executive')}
                    className={`px-2 py-0.5 text-[10.5px] rounded-md font-medium transition-all ${
                      previewMode === 'executive'
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : isDark
                          ? 'text-slate-400 hover:text-white'
                          : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Vista ejecutiva renderizada con estilos de alta fidelidad, código y diagramas"
                  >
                    Vista Ejecutiva
                  </button>

                  {selectedTemplate.category === 'diagrams' && (
                    <button
                      type="button"
                      onClick={() => setPreviewMode('diagram')}
                      className={`px-2 py-0.5 text-[10.5px] rounded-md font-medium transition-all ${
                        previewMode === 'diagram'
                          ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                          : isDark
                            ? 'text-slate-400 hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Lienzo interactivo React con zoom y renderizado vectorial de arquitectura"
                    >
                      Diagrama
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setPreviewMode('source')}
                    className={`px-2 py-0.5 text-[10.5px] rounded-md font-medium transition-all ${
                      previewMode === 'source'
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : isDark
                          ? 'text-slate-400 hover:text-white'
                          : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Markdown con YAML Frontmatter puro para IA o Git"
                  >
                    YAML & MD
                  </button>
                </div>
              </div>

              {/* Lado Derecho: Micro-botones de Copiar, Descargar, Imprimir y Fullscreen */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Micro-botón Copiar */}
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  title="Copiar contenido con Frontmatter al portapapeles"
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all cursor-pointer ${
                    hasCopied
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : isDark
                        ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {hasCopied ? 'check' : 'content_copy'}
                  </span>
                  <span className="text-[10px] hidden sm:inline">
                    {hasCopied ? 'Copiado' : 'Copiar'}
                  </span>
                </button>

                {/* Micro-botón Descargar .md */}
                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  title="Descargar archivo .md listo para git"
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all cursor-pointer ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">description</span>
                  <span className="text-[10px] font-mono">.md</span>
                </button>

                {/* Micro-botón Descargar .mmd si es plantilla de diagramas */}
                {selectedTemplate.category === 'diagrams' && (
                  <button
                    type="button"
                    onClick={handleDownloadMmd}
                    title="Descargar definición pura de Mermaid (.mmd)"
                    className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all cursor-pointer text-cyan-400 ${
                      isDark
                        ? 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30'
                        : 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">account_tree</span>
                    <span className="text-[10px] font-mono">.mmd</span>
                  </button>
                )}

                {/* Micro-botón Descargar .html */}
                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  title="Descargar HTML standalone con estilos ejecutivos"
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all cursor-pointer ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">html</span>
                  <span className="text-[10px] font-mono">.html</span>
                </button>

                {/* Micro-botón Imprimir / PDF */}
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  title="Abre la ventana de impresión nativa / PDF"
                  className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">print</span>
                  <span className="text-[10px] hidden md:inline">PDF</span>
                </button>

                {/* Micro-botón Pantalla Completa */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  title="Expandir a pantalla completa inmersiva"
                  className={`p-1.5 rounded-lg border text-xs flex items-center transition-all cursor-pointer ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">fullscreen</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. ÁREA DE VISUALIZACIÓN */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            {previewMode === 'diagram' && selectedTemplate.category === 'diagrams' ? (
              <div
                className={`w-full h-full overflow-y-auto p-4 custom-scrollbar transition-colors ${
                  isDark ? 'bg-[#070b16]' : 'bg-slate-50'
                }`}
              >
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
                className={`w-full h-full border-none transition-colors ${
                  isDark ? 'bg-[#0a0f1d]' : 'bg-white'
                }`}
                sandbox="allow-same-origin allow-scripts"
              />
            ) : (
              <div
                className={`w-full h-full overflow-y-auto p-4 custom-scrollbar font-mono text-xs transition-colors ${
                  isDark ? 'bg-[#090d16]' : 'bg-slate-50'
                }`}
              >
                <div className="max-w-4xl mx-auto space-y-4">
                  {/* YAML Frontmatter Inspector */}
                  <div
                    className={`rounded-xl border p-3 ${
                      isDark
                        ? 'border-indigo-500/30 bg-indigo-950/20'
                        : 'border-indigo-200 bg-indigo-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-indigo-500/20 text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                      <span>YAML Frontmatter Metadata (AI Binding Contract)</span>
                      <span className="text-[9px] bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-300">
                        Zod Ratified
                      </span>
                    </div>
                    <pre className="text-emerald-400 whitespace-pre font-mono text-[11px] leading-relaxed overflow-x-auto">
                      {generatedContent?.yamlFrontmatter}
                    </pre>
                  </div>

                  {/* Markdown Body */}
                  <div
                    className={`rounded-xl border p-4 ${
                      isDark
                        ? 'border-white/10 bg-black/40 text-slate-200'
                        : 'border-slate-200 bg-white text-slate-800 shadow-xs'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between pb-2 mb-3 border-b text-[10px] font-semibold uppercase tracking-wider ${
                        isDark ? 'border-white/10 text-muted' : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      <span>Cuerpo Markdown Documental</span>
                      <span className="text-[9px] text-secondary">
                        {generatedContent?.markdown.split('\n').length} líneas
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed">
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
