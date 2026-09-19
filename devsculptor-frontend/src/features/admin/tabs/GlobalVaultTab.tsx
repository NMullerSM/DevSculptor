import React, { useEffect, useState, useMemo } from 'react';
import JSZip from 'jszip';
import { useAdminStore } from '@/stores/useAdminStore';
import { CreateVaultFileDialog } from '../components/CreateVaultFileDialog';
import { GlobalVaultFile } from '@/types/admin.types';
import { adminService } from '@/services/admin.service';
import { VisionModal } from '@/components/ui/VisionModal';

export const GlobalVaultTab: React.FC = () => {
  const {
    vaultFiles,
    selectedFile,
    fileContentBuffer,
    isDirty,
    previewMarkdown,
    isLoading,
    isSaving,
    feedbackMessage,
    fetchVaultFiles,
    selectVaultFile,
    setFileContentBuffer,
    setPreviewMarkdown,
    saveCurrentVaultFile,
    deleteVaultFile,
    setFeedbackMessage,
    clearFeedback,
  } = useAdminStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [deleteConfirmPath, setDeleteConfirmPath] = useState<string | null>(null);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchVaultFiles();
  }, [fetchVaultFiles]);

  // Atajo de teclado: Ctrl+S o Cmd+S para guardar cuando el editor está abierto
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isEditorOpen && isDirty && !isSaving) {
          saveCurrentVaultFile();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditorOpen, isDirty, isSaving, saveCurrentVaultFile]);

  // Auto-limpieza del mensaje de feedback tras 4 segundos
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
      const q = searchQuery.toLowerCase();
      const matchesQuery = title.includes(q) || filePath.includes(q);
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

  // Apertura del Editor in-situ mediante DOBLE CLIC
  const handleFileDoubleClick = async (file: GlobalVaultFile) => {
    await selectVaultFile(file);
    setIsEditorOpen(true);
  };

  // Descarga del archivo activo individual
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
    }, 10000);

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
      }, 10000);

      setFeedbackMessage({
        type: 'success',
        text: `Bóveda Global OKF comprimida y descargada exitosamente en ZIP (${vaultFiles.length} artefactos).`,
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
    <div className="flex-1 flex flex-col min-h-0 h-full gap-3">
      {/* 1. Barra Superior de Acciones de la Bóveda */}
      <div className="vision-card p-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-amber-400 text-xl">account_tree</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-xs text-primary tracking-tight">
                Árbol de Bóveda Canónica Global OKF
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                {vaultFiles.length} artefactos
              </span>
            </div>
            <p className="text-[10.5px] text-muted font-mono">
              Estructura jerárquica de carpetas, habilidades de IA, reglas de desarrollo y plantillas maestras
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          {/* Botón de Exportación ZIP Robusto */}
          <button
            onClick={handleExportGlobalVaultZip}
            disabled={isExportingZip || vaultFiles.length === 0}
            className="vision-btn !py-1.5 !px-3 text-[11.5px] text-amber-300 hover:text-white border-amber-500/40 bg-amber-500/15 flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            title="Descargar la bóveda canónica global completa comprimida en ZIP con su árbol y manifiestos"
          >
            <span className={`material-symbols-outlined text-xs ${isExportingZip ? 'animate-spin' : ''}`}>
              {isExportingZip ? 'progress_activity' : 'archive'}
            </span>
            <span className="font-semibold">Exportar Bóveda OKF (.zip)</span>
          </button>

          {/* Botón de Aprovisionamiento */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="vision-btn vision-btn-primary !py-1.5 !px-3 text-[11.5px] flex items-center gap-1.5"
            title="Añadir una nueva plantilla o regla al árbol canónico"
          >
            <span className="material-symbols-outlined text-xs">add</span>
            <span>Nuevo Artefacto</span>
          </button>

          <button
            onClick={() => fetchVaultFiles()}
            disabled={isLoading}
            className="vision-btn !py-1.5 !px-2.5 text-xs text-muted hover:text-primary"
            title="Refrescar árbol de la bóveda"
          >
            <span className={`material-symbols-outlined text-xs ${isLoading ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* Banner de Feedback (Éxito o Error) */}
      {feedbackMessage && (
        <div
          className={`px-3 py-2 rounded-[6px] text-xs font-mono flex items-center justify-between shrink-0 shadow-sm ${
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

      {/* 2. Filtros y Búsqueda */}
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0 px-1">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Buscar por nombre, YAML o ruta canónica..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/25 dark:bg-white/[0.04] border border-glass-subtle rounded-[6px] pl-7 pr-2 py-1 text-xs text-primary outline-none font-mono"
          />
          <span className="material-symbols-outlined text-muted text-xs absolute left-2 top-1.5">
            search
          </span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto text-[10.5px] font-mono custom-scrollbar pb-1">
          <span className="text-muted mr-1 hidden sm:inline">Filtrar:</span>
          {[
            { id: 'all', label: 'Todos los Artefactos' },
            { id: 'templates', label: 'Plantillas (/templates)' },
            { id: 'skills', label: 'Habilidades IA (/skills)' },
            { id: 'rules', label: 'Reglas IDE (/rules)' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-[5px] border transition-colors whitespace-nowrap ${
                activeCategoryFilter === cat.id
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-semibold'
                  : 'border-glass-subtle text-muted hover:text-primary hover:bg-white/[0.03]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Explorador Visual Jerárquico de Carpetas OKF */}
      <div className="flex-1 vision-card p-3 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-3">
        {isLoading && vaultFiles.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted font-mono text-xs gap-2 py-12">
            <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
            <span>Cargando estructura jerárquica de la bóveda...</span>
          </div>
        ) : Object.keys(groupedFolders).length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted font-mono text-xs py-12">
            <span className="material-symbols-outlined text-3xl mb-2 opacity-50">folder_off</span>
            <span>No se encontraron artefactos con el criterio actual.</span>
          </div>
        ) : (
          Object.entries(groupedFolders).map(([folderKey, files]) => {
            const isCollapsed = collapsedFolders[folderKey];
            const isRoot = folderKey.includes('Raíz');

            return (
              <div
                key={folderKey}
                className="vision-card overflow-hidden border border-glass-subtle bg-black/20 dark:bg-white/[0.02] flex flex-col"
              >
                {/* Cabecera de Carpeta */}
                <div
                  onClick={() => toggleFolder(folderKey)}
                  className="px-3 py-2 bg-white/[0.03] border-b border-glass-subtle flex items-center justify-between cursor-pointer hover:bg-white/[0.06] transition-colors select-none"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-muted text-sm">
                      {isCollapsed ? 'chevron_right' : 'expand_more'}
                    </span>
                    <span className="material-symbols-outlined text-amber-400 text-sm">
                      {isCollapsed ? 'folder' : 'folder_open'}
                    </span>
                    <span
                      className={`font-mono text-xs font-semibold tracking-tight ${
                        isRoot ? 'text-amber-300' : 'text-primary'
                      }`}
                    >
                      {folderKey}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-muted">
                    <span className="px-2 py-0.2 rounded bg-black/30 border border-white/5">
                      {files.length} {files.length === 1 ? 'archivo' : 'archivos'}
                    </span>
                  </div>
                </div>

                {/* Lista de Archivos dentro de la Carpeta */}
                {!isCollapsed && (
                  <div className="divide-y divide-glass-subtle">
                    {files.map((file) => {
                      const fileMeta = getFileIcon(file);
                      const filename = (file.path || file.file_path || file.filename).split('/').pop() || file.filename;

                      return (
                        <div
                          key={file.path || file.file_path || file.id}
                          onDoubleClick={() => handleFileDoubleClick(file)}
                          className="px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors cursor-pointer group select-none"
                          title="Haz doble clic para desplegar y editar este archivo en el editor in-situ"
                        >
                          {/* Izquierda: Icono, Nombre de archivo y Título */}
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`material-symbols-outlined text-base shrink-0 ${fileMeta.color}`}>
                              {fileMeta.icon}
                            </span>

                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-semibold text-primary truncate">
                                  {filename}
                                </span>
                                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold ${fileMeta.bg} ${fileMeta.color}`}>
                                  {fileMeta.badge}
                                </span>
                              </div>
                              <span className="text-[10.5px] text-muted truncate">
                                {file.title} {file.description ? `• ${file.description}` : ''}
                              </span>
                            </div>
                          </div>

                          {/* Derecha: Metadatos, Hash, Versión y Botones */}
                          <div className="flex items-center gap-2 shrink-0 font-mono text-[10.5px]">
                            <span className="text-muted/70 text-[9.5px] hidden md:inline">
                              SHA: {(file.state_hash || file.sha256_hash || '').substring(0, 8)}
                            </span>

                            <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-black/40 text-indigo-300 border border-indigo-500/20">
                              v{file.version}
                            </span>

                            {/* Píldora que avisa sobre el doble clic */}
                            <span className="text-[9px] text-muted/60 opacity-0 group-hover:opacity-100 transition-opacity hidden lg:inline">
                              Doble clic para editar
                            </span>

                            {/* Botón rápido para abrir editor */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFileDoubleClick(file);
                              }}
                              className="vision-btn !py-1 !px-2 text-[10.5px] text-indigo-300 hover:text-white"
                              title="Abrir editor"
                            >
                              <span className="material-symbols-outlined text-xs">edit_note</span>
                              <span className="hidden sm:inline">Desplegar</span>
                            </button>
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

      {/* 4. MODAL DEL EDITOR IN-SITU (Desplegado ÚNICAMENTE tras DOBLE CLIC) */}
      {isEditorOpen && selectedFile && (
        <VisionModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          title={`Editor Canónico: ${selectedFile.title}`}
          description={`${selectedFile.path || selectedFile.file_path} • v${selectedFile.version} • Hash: ${(selectedFile.state_hash || selectedFile.sha256_hash || '').substring(0, 16)}...`}
          icon="code"
          maxWidth="4xl"
        >
          <div className="flex flex-col gap-3 min-h-[500px] max-h-[75vh]">
            {/* Barra de Herramientas del Editor */}
            <div className="flex flex-wrap items-center justify-between pb-2 border-b border-glass-subtle gap-2 shrink-0">
              <div className="flex items-center gap-2 truncate">
                <span className="material-symbols-outlined text-amber-400 text-base">edit_document</span>
                <span className="font-mono text-xs font-semibold text-primary truncate">
                  {(selectedFile.path || selectedFile.file_path || '').split('/').pop()}
                </span>
                {isDirty && (
                  <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1 shrink-0 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Cambios no guardados</span>
                  </span>
                )}
              </div>

              {/* Botones de Acción del Editor */}
              <div className="flex items-center gap-1.5 font-mono text-xs shrink-0">
                {/* Botón Descargar Archivo Activo a Disco */}
                <button
                  type="button"
                  onClick={handleDownloadActiveFile}
                  className="vision-btn !py-1 !px-2.5 text-[11px] flex items-center gap-1 text-primary hover:text-indigo-300"
                  title="Descargar este archivo a tu equipo local"
                >
                  <span className="material-symbols-outlined text-xs">download</span>
                  <span>Descargar Archivo</span>
                </button>

                {/* Alternar Vista Previa Markdown */}
                <button
                  type="button"
                  onClick={() => setPreviewMarkdown(!previewMarkdown)}
                  className={`vision-btn !py-1 !px-2.5 text-[11px] flex items-center gap-1 ${
                    previewMarkdown ? 'vision-btn-primary' : ''
                  }`}
                  title="Alternar vista previa renderizada"
                >
                  <span className="material-symbols-outlined text-xs">
                    {previewMarkdown ? 'edit_note' : 'visibility'}
                  </span>
                  <span>{previewMarkdown ? 'Modo Edición' : 'Previsualizar'}</span>
                </button>

                {/* Guardar Cambios */}
                <button
                  type="button"
                  onClick={saveCurrentVaultFile}
                  disabled={!isDirty || isSaving}
                  className={`vision-btn !py-1 !px-3 text-[11px] flex items-center gap-1 ${
                    isDirty
                      ? '!bg-amber-500/20 !border-amber-500/60 !text-amber-300 hover:!bg-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  title="Guardar cambios y sincronizar en caliente (Ctrl+S / Cmd+S)"
                >
                  {isSaving ? (
                    <>
                      <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xs">save</span>
                      <span>Guardar</span>
                    </>
                  )}
                </button>

                {/* Eliminar Artefacto */}
                <button
                  type="button"
                  onClick={() => setDeleteConfirmPath(selectedFile.path || selectedFile.file_path || '')}
                  className="vision-btn !py-1 !px-2 text-[11px] text-rose-400 hover:text-rose-300 border-rose-500/20 hover:bg-rose-500/10"
                  title="Eliminar este archivo de la bóveda global"
                >
                  <span className="material-symbols-outlined text-xs">delete</span>
                </button>
              </div>
            </div>

            {/* Cuerpo del Editor / Vista Previa */}
            <div className="flex-1 min-h-[380px] relative flex flex-col overflow-hidden rounded-[6px] border border-glass-subtle bg-black/40 dark:bg-black/70">
              {previewMarkdown ? (
                <div className="flex-1 overflow-y-auto p-4 prose prose-invert max-w-none text-xs custom-scrollbar">
                  <div className="text-[11px] text-muted font-mono pb-2 mb-3 border-b border-glass-subtle">
                    Previsualización del archivo canónico:
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-xs text-primary leading-relaxed">
                    {fileContentBuffer}
                  </pre>
                </div>
              ) : (
                <div className="flex-1 flex min-h-0 relative">
                  <textarea
                    value={fileContentBuffer}
                    onChange={(e) => setFileContentBuffer(e.target.value)}
                    placeholder="Escribe aquí el contenido canónico..."
                    spellCheck={false}
                    className="flex-1 p-3 font-mono text-[12px] leading-relaxed bg-transparent text-primary outline-none resize-none custom-scrollbar"
                  />
                </div>
              )}

              {/* Pie de Información del Editor */}
              <div className="h-7 px-3 bg-black/50 border-t border-glass-subtle flex items-center justify-between text-[10px] font-mono text-muted shrink-0">
                <div className="flex items-center gap-3">
                  <span>Líneas: {lineCount}</span>
                  <span>Caracteres: {fileContentBuffer.length}</span>
                  <span className="hidden sm:inline">UTF-8</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-muted/80">SHA-256:</span>
                  <code className="text-indigo-300 text-[9px] bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                    {selectedFile.state_hash || selectedFile.sha256_hash}
                  </code>
                </div>
              </div>
            </div>

            {/* Pie de Acciones del Modal */}
            <div className="flex items-center justify-between pt-2 border-t border-glass-subtle shrink-0">
              <span className="text-[10px] font-mono text-muted">
                Tip: Guarda rápidamente tus modificaciones usando el atajo <kbd className="px-1 py-0.5 rounded bg-black/40 border border-white/10 text-primary">Ctrl + S</kbd>
              </span>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="vision-btn py-1 px-3 text-xs"
              >
                Cerrar Editor
              </button>
            </div>
          </div>
        </VisionModal>
      )}

      {/* Modal de Creación */}
      <CreateVaultFileDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {/* Confirmación de Eliminación */}
      {deleteConfirmPath && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="vision-window max-w-md w-full p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
              <span className="material-symbols-outlined text-base">warning</span>
              <span>Confirmar Eliminación de Artefacto</span>
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
                  setIsEditorOpen(false);
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
