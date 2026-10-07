import React, { useEffect, useState, useMemo, useRef } from 'react';
import JSZip from 'jszip';
import { useAdminStore } from '@/stores/useAdminStore';
import { CreateVaultFileDialog } from '../components/CreateVaultFileDialog';
import { IngestSourceModal } from '../components/IngestSourceModal';
import { GlobalVaultFile } from '@/types/admin.types';
import { adminService } from '@/services/admin.service';
import { convertMarkdownToHtml } from '@/features/export/documentExportService';
import { MermaidVisualizer } from '@/components/diagrams/MermaidVisualizer';
import { VisionButton } from '@/components/ui/VisionButton';

type PreviewMode = 'executive' | 'diagram' | 'source' | 'edit';

export const GlobalVaultTab: React.FC = () => {
  const {
    vaultFiles,
    selectedFile,
    fileContentBuffer,
    isDirty,
    isLoading,
    isSaving,
    feedbackMessage,
    fetchVaultFiles,
    selectVaultFile,
    setFileContentBuffer,
    saveCurrentVaultFile,
    deleteVaultFile,
    setFeedbackMessage,
    clearFeedback,
  } = useAdminStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [deleteConfirmPath, setDeleteConfirmPath] = useState<string | null>(null);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [isTreeCollapsed, setIsTreeCollapsed] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('executive');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchVaultFiles();
  }, [fetchVaultFiles]);

  // Listener para estado de pantalla completa
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
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Error alternando pantalla completa en consola maestra:', err);
    }
  };

  // Atajo de teclado: Ctrl+S o Cmd+S para guardar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty && !isSaving) {
          saveCurrentVaultFile();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, isSaving, saveCurrentVaultFile]);

  // Auto-limpieza del mensaje de feedback tras 4.5 segundos
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => clearFeedback(), 4500);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage, clearFeedback]);

  // Filtrado de archivos por búsqueda y categoría
  const filteredFiles = useMemo(() => {
    return vaultFiles.filter((file) => {
      const matchesCategory =
        activeCategoryFilter === 'all' || file.category === activeCategoryFilter;
      const filePath = (file.path || file.file_path || '').toLowerCase();
      const title = file.title.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || title.includes(q) || filePath.includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [vaultFiles, activeCategoryFilter, searchQuery]);

  // Agrupación jerárquica de carpetas canónicas OKF
  const groupedFolders = useMemo(() => {
    const groups: Record<string, GlobalVaultFile[]> = {};

    filteredFiles.forEach((file) => {
      const filePath = (file.path || file.file_path || file.filename).replace(/^\/+/, '');
      const parts = filePath.split('/');

      let folderKey = '/_global (Raíz del Árbol)';
      if (parts.length > 1) {
        if (parts[0] === '_global') {
          if (parts.length === 2) {
            folderKey = '/_global (Raíz del Árbol)';
          } else {
            folderKey = `/_global/${parts.slice(1, -1).join('/')}`;
          }
        } else {
          folderKey = `/_global/${parts.slice(0, -1).join('/')}`;
        }
      }

      if (!groups[folderKey]) {
        groups[folderKey] = [];
      }
      groups[folderKey].push(file);
    });

    return groups;
  }, [filteredFiles]);

  const toggleFolder = (folderKey: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderKey]: !prev[folderKey],
    }));
  };

  const getFileIcon = (file: GlobalVaultFile) => {
    const path = (file.path || file.file_path || file.filename).toLowerCase();
    if (path.includes('sources') || file.category === 'sources') {
      return { icon: 'source', color: 'text-pink-400', badge: 'SOURCE', bg: 'bg-pink-500/15 border-pink-500/30' };
    }
    if (path.endsWith('index.md')) {
      return { icon: 'auto_awesome', color: 'text-amber-400', badge: 'INDEX', bg: 'bg-amber-500/15 border-amber-500/30' };
    }
    if (path.endsWith('.yaml') || path.endsWith('.yml')) {
      return { icon: 'tune', color: 'text-cyan-400', badge: 'YAML', bg: 'bg-cyan-500/15 border-cyan-500/30' };
    }
    if (path.endsWith('.cursorrules') || path.includes('claude')) {
      return { icon: 'terminal', color: 'text-amber-300', badge: 'RULES', bg: 'bg-amber-500/10 border-amber-500/20' };
    }
    if (path.includes('skill') || file.category === 'skills') {
      return { icon: 'psychology', color: 'text-purple-400', badge: 'SKILL', bg: 'bg-purple-500/15 border-purple-500/30' };
    }
    if (path.includes('database') || path.endsWith('.sql')) {
      return { icon: 'database', color: 'text-emerald-400', badge: 'DB', bg: 'bg-emerald-500/15 border-emerald-500/30' };
    }
    if (path.includes('adr')) {
      return { icon: 'gavel', color: 'text-indigo-400', badge: 'ADR', bg: 'bg-indigo-500/15 border-indigo-500/30' };
    }
    if (path.includes('requirements') || path.includes('srs')) {
      return { icon: 'rule', color: 'text-blue-400', badge: 'SRS', bg: 'bg-blue-500/15 border-blue-500/30' };
    }
    return { icon: 'description', color: 'text-indigo-300', badge: 'DOC', bg: 'bg-white/10 border-white/20' };
  };

  const hasMermaidDiagram = useMemo(() => {
    if (!fileContentBuffer) return false;
    return (
      fileContentBuffer.includes('```mermaid') ||
      fileContentBuffer.includes('```mmd') ||
      /^(classDiagram|flowchart|graph|erDiagram|sequenceDiagram|stateDiagram|C4Context|C4Container)/m.test(
        fileContentBuffer
      )
    );
  }, [fileContentBuffer]);

  // Conversión HTML ejecutiva del archivo activo
  const renderedExecutiveHtml = useMemo(() => {
    if (!fileContentBuffer) return '';
    return convertMarkdownToHtml(fileContentBuffer);
  }, [fileContentBuffer]);

  const handleCopyContent = async () => {
    if (!fileContentBuffer) return;
    try {
      await navigator.clipboard.writeText(fileContentBuffer);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      console.warn('Error al copiar:', err);
    }
  };

  // Descarga del archivo activo individual con revocación diferida de 15 segundos
  const handleDownloadActiveFile = () => {
    if (!selectedFile) return;
    const filePath = selectedFile.path || selectedFile.file_path || 'archivo.md';
    const filename = filePath.split('/').pop() || 'archivo.md';
    const blob = new Blob([fileContentBuffer], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 15000);

    setFeedbackMessage({
      type: 'success',
      text: `Archivo "${filename}" descargado con éxito.`,
    });
  };

  // Descarga y exportación de la Bóveda Global en ZIP
  const handleExportGlobalVaultZip = async () => {
    if (vaultFiles.length === 0) return;
    setIsExportingZip(true);
    try {
      const zip = new JSZip();

      for (const file of vaultFiles) {
        const filePath = file.path || file.file_path || file.filename;
        const cleanPath = filePath.replace(/^\/+/, '');

        let content = file.content;
        if (typeof content !== 'string' || !content) {
          try {
            const fetched = await adminService.getVaultFile(filePath);
            content = fetched.content || '';
          } catch {
            content = '';
          }
        }

        zip.file(cleanPath, content || '');
      }

      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'DevSculptor_OKF_Global_Vault.zip');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 15000);

      setFeedbackMessage({
        type: 'success',
        text: `Bóveda Global OKF descargada exitosamente en ZIP (${vaultFiles.length} artefactos).`,
      });
    } catch (err: unknown) {
      setFeedbackMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al exportar la bóveda en ZIP.',
      });
    } finally {
      setIsExportingZip(false);
    }
  };

  const lineCount = useMemo(() => {
    return fileContentBuffer.split('\n').length;
  }, [fileContentBuffer]);

  return (
    <div
      ref={containerRef}
      className={`flex-1 flex flex-col min-h-0 h-full gap-2 transition-colors ${
        isFullscreen ? 'bg-[#080d1a] fixed inset-0 z-50 p-3' : ''
      }`}
    >
      {/* 1. Barra Superior de Control y Aprovisionamiento */}
      <div className="vision-card p-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0 bg-black/20">
        <div className="flex items-center gap-2">
          {/* Botón para colapsar/expandir el árbol jerárquico */}
          <button
            type="button"
            onClick={() => setIsTreeCollapsed((prev) => !prev)}
            className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-secondary hover:text-primary transition-all border border-glass-subtle flex items-center justify-center"
            title={isTreeCollapsed ? 'Mostrar árbol de bóveda' : 'Colapsar árbol para lectura ancha'}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isTreeCollapsed ? 'right_panel_open' : 'left_panel_close'}
            </span>
          </button>

          <span className="material-symbols-outlined text-amber-400 text-lg">account_tree</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-xs text-primary tracking-tight">
                Bóveda Canónica Global OKF (_global/)
              </h2>
              <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {vaultFiles.length} ARTEFACTOS MAESTROS
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs flex-wrap">
          {/* Ingestar Fuente Técnica */}
          <button
            onClick={() => setIsIngestOpen(true)}
            className="vision-btn !py-1 !px-2.5 text-[11px] text-cyan-300 hover:text-white border-cyan-500/40 bg-cyan-500/15 flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
            title="Ingestar documentos PDF, Markdown o Word en la rama _global/sources/"
          >
            <span className="material-symbols-outlined text-xs">upload_file</span>
            <span>Ingestar Fuente</span>
          </button>

          {/* Nuevo Artefacto */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="vision-btn vision-btn-primary !py-1 !px-2.5 text-[11px] flex items-center gap-1.5"
            title="Añadir una nueva plantilla, habilidad o regla al árbol general"
          >
            <span className="material-symbols-outlined text-xs">add</span>
            <span>Nuevo Artefacto</span>
          </button>

          {/* Exportar ZIP */}
          <button
            onClick={handleExportGlobalVaultZip}
            disabled={isExportingZip || vaultFiles.length === 0}
            className="vision-btn !py-1 !px-2.5 text-[11px] text-amber-300 hover:text-white border-amber-500/40 bg-amber-500/10 flex items-center gap-1.5"
            title="Descargar la bóveda canónica global completa comprimida en ZIP"
          >
            <span className={`material-symbols-outlined text-xs ${isExportingZip ? 'animate-spin' : ''}`}>
              {isExportingZip ? 'progress_activity' : 'archive'}
            </span>
            <span className="hidden sm:inline">Exportar ZIP</span>
          </button>

          {/* Refrescar */}
          <button
            onClick={() => fetchVaultFiles()}
            disabled={isLoading}
            className="vision-btn !py-1 !px-2 text-xs text-muted hover:text-primary"
            title="Refrescar árbol de la bóveda"
          >
            <span className={`material-symbols-outlined text-xs ${isLoading ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>

          {/* Pantalla Completa */}
          <button
            onClick={toggleFullscreen}
            className="vision-btn !py-1 !px-2 text-xs text-indigo-300 hover:text-white border-indigo-500/30"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa inmersiva'}
          >
            <span className="material-symbols-outlined text-xs">
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>
        </div>
      </div>

      {/* Banner de Feedback */}
      {feedbackMessage && (
        <div
          className={`px-3 py-1.5 rounded-[6px] text-xs font-mono flex items-center justify-between shrink-0 shadow-sm ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">
              {feedbackMessage.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={clearFeedback} className="hover:opacity-75">
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
        </div>
      )}

      {/* 2. Cuerpo Principal: Árbol Jerárquico + Visor Documental In-Situ */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 gap-2 overflow-hidden">
        {/* Panel Izquierdo: Árbol Jerárquico Visual (Colapsable) */}
        {!isTreeCollapsed && (
          <div className="w-full md:w-80 lg:w-96 vision-card p-2.5 flex flex-col shrink-0 min-h-0 bg-black/25 transition-all">
            {/* Buscador de Archivos */}
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Buscar en _global/... (título o ruta)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/30 border border-glass-subtle rounded-[6px] pl-7 pr-6 py-1 text-xs text-primary outline-none font-mono"
              />
              <span className="material-symbols-outlined text-muted text-xs absolute left-2 top-1.5 pointer-events-none">
                search
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1 text-muted hover:text-primary text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filtros de Categorías */}
            <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-mono custom-scrollbar pb-1.5 mb-2 border-b border-glass-subtle">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'templates', label: 'Plantillas' },
                { id: 'sources', label: 'Fuentes' },
                { id: 'skills', label: 'Skills' },
                { id: 'rules', label: 'Reglas' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryFilter(cat.id)}
                  className={`px-2 py-0.5 rounded-[4px] border transition-colors whitespace-nowrap ${
                    activeCategoryFilter === cat.id
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold'
                      : 'border-glass-subtle text-muted hover:text-primary hover:bg-white/[0.03]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Explorador de Carpetas */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
              {isLoading && vaultFiles.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted font-mono text-xs gap-2 py-10">
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                  <span>Cargando árbol de la bóveda...</span>
                </div>
              ) : Object.keys(groupedFolders).length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted font-mono text-xs py-8">
                  <span className="material-symbols-outlined text-2xl mb-1 opacity-50">folder_off</span>
                  <span>Sin artefactos coincidentes.</span>
                </div>
              ) : (
                Object.entries(groupedFolders).map(([folderKey, files]) => {
                  const isCollapsed = collapsedFolders[folderKey];
                  const isRoot = folderKey.includes('Raíz');
                  const isSourcesFolder = folderKey.includes('sources');

                  return (
                    <div
                      key={folderKey}
                      className="rounded-lg border border-glass-subtle bg-black/20 overflow-hidden flex flex-col"
                    >
                      {/* Cabecera de Carpeta */}
                      <div
                        onClick={() => toggleFolder(folderKey)}
                        className="px-2.5 py-1.5 bg-white/[0.02] border-b border-glass-subtle flex items-center justify-between cursor-pointer hover:bg-white/[0.05] transition-colors select-none"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="material-symbols-outlined text-muted text-xs">
                            {isCollapsed ? 'chevron_right' : 'expand_more'}
                          </span>
                          <span
                            className={`material-symbols-outlined text-xs ${
                              isSourcesFolder ? 'text-pink-400' : isRoot ? 'text-amber-400' : 'text-cyan-400'
                            }`}
                          >
                            {isCollapsed ? 'folder' : 'folder_open'}
                          </span>
                          <span
                            className={`font-mono text-[11px] font-semibold truncate ${
                              isSourcesFolder ? 'text-pink-300' : isRoot ? 'text-amber-300' : 'text-primary'
                            }`}
                          >
                            {folderKey}
                          </span>
                        </div>

                        <span className="text-[9.5px] font-mono text-muted px-1.5 py-0.2 rounded bg-black/40 border border-white/5 shrink-0">
                          {files.length}
                        </span>
                      </div>

                      {/* Archivos de la Carpeta */}
                      {!isCollapsed && (
                        <div className="divide-y divide-glass-subtle">
                          {files.map((file) => {
                            const fileMeta = getFileIcon(file);
                            const filename =
                              (file.path || file.file_path || file.filename).split('/').pop() || file.filename;
                            const isSelected =
                              selectedFile &&
                              (selectedFile.path === file.path ||
                                selectedFile.file_path === file.file_path ||
                                selectedFile.id === file.id);

                            return (
                              <div
                                key={file.path || file.file_path || file.id}
                                onClick={() => selectVaultFile(file)}
                                onDoubleClick={() => {
                                  selectVaultFile(file);
                                  setPreviewMode('edit');
                                }}
                                className={`px-2.5 py-2 flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
                                  isSelected
                                    ? 'bg-amber-500/15 border-l-2 border-amber-400 shadow-sm'
                                    : 'hover:bg-white/[0.04]'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className={`material-symbols-outlined text-sm shrink-0 ${fileMeta.color}`}>
                                    {fileMeta.icon}
                                  </span>

                                  <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-[11px] font-semibold text-primary truncate">
                                        {filename}
                                      </span>
                                      <span
                                        className={`text-[8.5px] font-mono px-1 py-0.2 rounded border font-semibold shrink-0 ${fileMeta.bg} ${fileMeta.color}`}
                                      >
                                        {fileMeta.badge}
                                      </span>
                                    </div>
                                    <span className="text-[9.5px] text-muted truncate">
                                      {file.title}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0 font-mono text-[9px] text-muted">
                                  <span>v{file.version}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Panel Derecho: Visor de Documentos Enriquecido e In-situ */}
        <div className="flex-1 vision-card p-0 flex flex-col min-w-0 h-full overflow-hidden bg-black/20">
          {selectedFile ? (
            <>
              {/* Cabecera del Visor */}
              <div className="p-3 border-b border-glass-subtle bg-white/[0.01] flex flex-col lg:flex-row lg:items-center justify-between gap-2 shrink-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs sm:text-sm font-bold text-primary truncate">
                      {selectedFile.title}
                    </h3>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      v{selectedFile.version}
                    </span>
                    {isDirty && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 shrink-0 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <span>Modificado</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted font-mono truncate">
                    <span>Ruta: {selectedFile.path || selectedFile.file_path}</span>
                    <span>•</span>
                    <span className="text-emerald-400">
                      SHA: {(selectedFile.state_hash || selectedFile.sha256_hash || '').substring(0, 8)}
                    </span>
                  </div>
                </div>

                {/* Acciones y Selector de Modo de Visualización */}
                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  {/* Selector de Modo */}
                  <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-glass-subtle mr-1">
                    <button
                      type="button"
                      onClick={() => setPreviewMode('executive')}
                      className={`px-2 py-1 text-[10px] rounded font-medium transition-all ${
                        previewMode === 'executive'
                          ? 'bg-amber-600 text-white font-semibold shadow'
                          : 'text-secondary hover:text-primary'
                      }`}
                      title="Vista ejecutiva renderizada con diagramas, tablas y diseño corporativo"
                    >
                      Ejecutiva
                    </button>

                    {hasMermaidDiagram && (
                      <button
                        type="button"
                        onClick={() => setPreviewMode('diagram')}
                        className={`px-2 py-1 text-[10px] rounded font-medium transition-all ${
                          previewMode === 'diagram'
                            ? 'bg-amber-600 text-white font-semibold shadow'
                            : 'text-secondary hover:text-primary'
                        }`}
                        title="Renderizado dinámico de diagramas Mermaid"
                      >
                        Diagrama
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setPreviewMode('source')}
                      className={`px-2 py-1 text-[10px] rounded font-medium transition-all ${
                        previewMode === 'source'
                          ? 'bg-amber-600 text-white font-semibold shadow'
                          : 'text-secondary hover:text-primary'
                      }`}
                      title="YAML Frontmatter y Markdown puro"
                    >
                      YAML / MD
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewMode('edit')}
                      className={`px-2 py-1 text-[10px] rounded font-medium transition-all ${
                        previewMode === 'edit'
                          ? 'bg-amber-600 text-white font-semibold shadow'
                          : 'text-secondary hover:text-primary'
                      }`}
                      title="Editor in-situ para modificar y sincronizar este artefacto canónico"
                    >
                      Editor
                    </button>
                  </div>

                  {/* Guardar si está en modo editor */}
                  {previewMode === 'edit' && (
                    <VisionButton
                      variant="primary"
                      size="sm"
                      icon="save"
                      onClick={saveCurrentVaultFile}
                      disabled={!isDirty || isSaving}
                      title="Guardar modificaciones (Ctrl+S)"
                      className="!text-xs !bg-amber-600 hover:!bg-amber-500 text-white"
                    >
                      {isSaving ? 'Guardando...' : 'Guardar'}
                    </VisionButton>
                  )}

                  {/* Copiar */}
                  <VisionButton
                    variant="secondary"
                    size="sm"
                    icon={hasCopied ? 'check' : 'content_copy'}
                    onClick={handleCopyContent}
                    title="Copiar contenido al portapapeles"
                    className="!text-xs"
                  >
                    {hasCopied ? 'Copiado' : 'Copiar'}
                  </VisionButton>

                  {/* Descargar */}
                  <VisionButton
                    variant="secondary"
                    size="sm"
                    icon="download"
                    onClick={handleDownloadActiveFile}
                    title="Descargar archivo individual"
                    className="!text-xs"
                  >
                    Descargar
                  </VisionButton>

                  {/* Eliminar */}
                  <VisionButton
                    variant="secondary"
                    size="sm"
                    icon="delete"
                    onClick={() => setDeleteConfirmPath(selectedFile.path || selectedFile.file_path || '')}
                    title="Eliminar este archivo de la bóveda global"
                    className="!text-xs text-rose-400 hover:text-rose-300 border-rose-500/20 hover:bg-rose-500/10"
                  >
                    Eliminar
                  </VisionButton>
                </div>
              </div>

              {/* Contenedor del Visor Activo */}
              <div className="flex-1 min-h-0 relative overflow-hidden">
                {previewMode === 'executive' ? (
                  <div className="w-full h-full overflow-y-auto p-4 custom-scrollbar bg-[#090d16]">
                    <div
                      className="max-w-4xl mx-auto prose prose-invert text-xs leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: renderedExecutiveHtml }}
                    />
                  </div>
                ) : previewMode === 'diagram' && hasMermaidDiagram ? (
                  <div className="w-full h-full overflow-y-auto p-4 custom-scrollbar bg-[#070b16]">
                    <div className="max-w-5xl mx-auto">
                      <MermaidVisualizer
                        code={fileContentBuffer}
                        title={selectedFile.title}
                        standard="Bóveda Global OKF"
                        showCode={true}
                      />
                    </div>
                  </div>
                ) : previewMode === 'source' ? (
                  <div className="w-full h-full overflow-y-auto p-4 custom-scrollbar bg-[#080d1a] font-mono text-xs">
                    <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {fileContentBuffer}
                    </pre>
                  </div>
                ) : (
                  /* Modo Editor In-Situ */
                  <div className="w-full h-full flex flex-col bg-[#070b14]">
                    <div className="flex-1 min-h-0 relative">
                      <textarea
                        value={fileContentBuffer}
                        onChange={(e) => setFileContentBuffer(e.target.value)}
                        placeholder="Escribe el contenido canónico de la plantilla o regla..."
                        spellCheck={false}
                        className="w-full h-full p-4 font-mono text-[12px] leading-relaxed bg-transparent text-primary outline-none resize-none custom-scrollbar"
                      />
                    </div>
                    {/* Barra de estado del editor */}
                    <div className="h-7 px-3 bg-black/60 border-t border-glass-subtle flex items-center justify-between text-[10px] font-mono text-muted shrink-0">
                      <div className="flex items-center gap-3">
                        <span>Líneas: {lineCount}</span>
                        <span>Caracteres: {fileContentBuffer.length}</span>
                        <span>UTF-8</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>SHA-256:</span>
                        <code className="text-amber-300 text-[9px] bg-black/40 px-1 py-0.5 rounded border border-white/5">
                          {selectedFile.state_hash || selectedFile.sha256_hash}
                        </code>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted font-mono text-xs gap-3">
              <span className="material-symbols-outlined text-4xl text-amber-400 opacity-60">account_tree</span>
              <div className="max-w-md">
                <h4 className="font-semibold text-primary text-sm mb-1">Consola Maestra de Bóveda Canónica Global</h4>
                <p className="text-[11px] text-muted">
                  Selecciona un artefacto del árbol jerárquico a la izquierda para visualizarlo con formato ejecutivo, inspeccionar diagramas o editarlo in-situ. También puedes ingestar nuevas fuentes técnicas en la rama <strong className="text-amber-300">_global/sources/</strong>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modales: Creación, Ingestión y Confirmación de Eliminación */}
      <CreateVaultFileDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <IngestSourceModal isOpen={isIngestOpen} onClose={() => setIsIngestOpen(false)} />

      {deleteConfirmPath && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="vision-window max-w-md w-full p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
              <span className="material-symbols-outlined text-base">warning</span>
              <span>Confirmar Eliminación de Artefacto Global</span>
            </div>
            <p className="text-xs text-secondary font-mono">
              ¿Estás seguro de que deseas eliminar permanentemente de la bóveda global el archivo{' '}
              <strong className="text-primary">{deleteConfirmPath}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-glass-subtle">
              <button
                onClick={() => setDeleteConfirmPath(null)}
                className="vision-btn py-1 px-3 text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await deleteVaultFile(deleteConfirmPath);
                  setDeleteConfirmPath(null);
                }}
                className="vision-btn !bg-rose-500/20 !border-rose-500/50 text-rose-300 py-1 px-3 text-xs"
              >
                Eliminar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
