import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { VisionModal } from '@/components/ui/VisionModal';
import { VisionButton } from '@/components/ui/VisionButton';
import { VisionPill } from '@/components/ui/VisionPill';
import { useProjectStore } from '@/stores/useProjectStore';
import { SqlDialect } from '@/features/canvas/scriptGenerators';
import { okfVaultService, VaultSummary } from './okfVaultService';
import { ProcessedOkfDocument } from './okfDocumentProcessor';

interface OkfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OkfExportModal: React.FC<OkfExportModalProps> = ({ isOpen, onClose }) => {
  const { activeProject } = useProjectStore();

  const [dialect, setDialect] = useState<SqlDialect>('postgres');
  const [includeDocs, setIncludeDocs] = useState(true);
  const [includeDb, setIncludeDb] = useState(true);
  const [includeSkills, setIncludeSkills] = useState(true);
  const [includeContext, setIncludeContext] = useState(true);

  const [documents, setDocuments] = useState<ProcessedOkfDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<ProcessedOkfDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Cargar y compilar documentos de la bóveda
  const loadVaultDocuments = async () => {
    if (!activeProject) return;
    setIsLoading(true);
    setExportError(null);
    try {
      const docs = await okfVaultService.compileVault(activeProject.id, dialect);
      setDocuments(docs);
      if (docs.length > 0) {
        setSelectedDoc((prev) => {
          if (!prev) return docs[0];
          const match = docs.find((d) => d.path === prev.path);
          return match || docs[0];
        });
      }
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : 'Error al compilar la bóveda OKF');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeProject) {
      loadVaultDocuments();
    }
  }, [isOpen, activeProject?.id, dialect]);

  // Resumen de la bóveda
  const summary: VaultSummary = useMemo(() => {
    return okfVaultService.calculateSummary(documents);
  }, [documents]);

  // Documentos filtrados por las categorías seleccionadas (el manifiesto INDEX.md siempre se incluye)
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (doc.category === 'manifest') return true;
      if (doc.category === 'documentation' && !includeDocs) return false;
      if (doc.category === 'database' && !includeDb) return false;
      if (doc.category === 'skills' && !includeSkills) return false;
      if (doc.category === 'context' && !includeContext) return false;
      return true;
    });
  }, [documents, includeDocs, includeDb, includeSkills, includeContext]);

  // Agrupación por carpetas para la vista de árbol (Raíz/Manifiesto primero)
  const groupedTree = useMemo(() => {
    const groups: Record<string, ProcessedOkfDocument[]> = {};
    documents.forEach((doc) => {
      const parts = doc.path.split('/');
      const folder = parts.length > 1 ? `/${parts.slice(0, -1).join('/')}` : '/ (Raíz OKF)';
      if (!groups[folder]) groups[folder] = [];
      groups[folder].push(doc);
    });
    return groups;
  }, [documents]);

  // Copiar contenido al portapapeles
  const handleCopyContent = async () => {
    if (!selectedDoc) return;
    try {
      await navigator.clipboard.writeText(selectedDoc.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignorar fallo de portapapeles
    }
  };

  // Descargar archivo individual (RF11)
  const handleDownloadSingle = () => {
    if (!selectedDoc) return;
    okfVaultService.downloadSingleDocument(selectedDoc);
  };

  // Sincronizar y ratificar snapshot de Freshness
  const handleRatifyVault = () => {
    if (!activeProject) return;
    okfVaultService.saveVaultSnapshot(activeProject.id, documents);
    loadVaultDocuments();
  };

  // Descarga del paquete ZIP
  const handleExportZip = async () => {
    if (!activeProject || filteredDocuments.length === 0) return;
    setIsExporting(true);
    setProgress(15);
    setExportError(null);

    const projSlug = activeProject.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const filename = `DevSculptor_${projSlug}_OKF_Bundle.zip`;

    try {
      const blob = await okfVaultService.generateZipBundle(
        filteredDocuments,
        activeProject.name,
        (pct) => setProgress(pct)
      );

      setProgress(100);
      okfVaultService.downloadBlob(blob, filename);

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti opcional
      }

      setTimeout(() => {
        setIsExporting(false);
        setProgress(0);
        onClose();
      }, 700);
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : 'Error al comprimir el paquete ZIP');
      setIsExporting(false);
    }
  };

  const projName = activeProject?.name || 'Proyecto';

  return (
    <VisionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Bóveda Documental OKF y Exportador de Prompt Bundles"
      icon="folder_zip"
      maxWidth="3xl"
    >
      <div className="flex flex-col gap-3 text-xs">
        {/* Banner Superior de Freshness y Métricas de Bóveda */}
        <div className="vision-card p-3 flex flex-wrap items-center justify-between gap-2 border-indigo-500/20 bg-indigo-500/[0.04]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400 text-lg">verified</span>
            <div>
              <div className="font-semibold text-primary flex items-center gap-1.5">
                <span>Bóveda OKF: {projName}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-secondary font-mono">
                  {summary.totalDocuments} archivos
                </span>
              </div>
              <div className="text-[10.5px] text-muted flex items-center gap-2 font-mono">
                <span>
                  Freshness Score:{' '}
                  <strong
                    className={
                      summary.freshnessScore >= 90
                        ? 'text-emerald-400'
                        : summary.freshnessScore >= 60
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }
                  >
                    {summary.freshnessScore}% Al Día
                  </strong>
                </span>
                {summary.staleDocuments > 0 && (
                  <span className="text-amber-300">
                    ({summary.staleDocuments} desactualizados por mutaciones en BD)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {summary.staleDocuments > 0 && (
              <VisionButton
                type="button"
                size="sm"
                variant="secondary"
                icon="sync"
                onClick={handleRatifyVault}
                title="Ratificar cambios y marcar documentos como vigentes"
              >
                Ratificar Bóveda
              </VisionButton>
            )}
            {/* Selector de Dialecto DDL */}
            <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-[6px] border border-white/10 font-mono text-[10.5px]">
              <span className="text-muted px-1">Motor:</span>
              {(['postgres', 'mysql', 'sqlite', 'oracle'] as SqlDialect[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDialect(d)}
                  className={`px-1.5 py-0.5 rounded transition-all uppercase ${
                    dialect === d
                      ? 'bg-indigo-500 text-white font-semibold shadow-sm'
                      : 'text-muted hover:text-primary hover:bg-white/[0.06]'
                  }`}
                >
                  {d === 'postgres' ? 'PG' : d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mensaje de Error si existiese */}
        {exportError && (
          <div className="p-2.5 rounded-[6px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{exportError}</span>
          </div>
        )}

        {/* Panel Principal Dividido: Explorador de Árbol + Previsualizador */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 min-h-[360px] max-h-[460px] overflow-hidden">
          {/* Columna Izquierda: Árbol de Carpetas (5 cols) */}
          <div className="md:col-span-5 vision-card p-2.5 flex flex-col gap-2 overflow-y-auto custom-scrollbar border-white/10">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.08] text-[11px] font-semibold text-secondary">
              <span>Estructura Canónica OKF</span>
              <span className="text-[10px] text-muted font-mono">{filteredDocuments.length} seleccionados</span>
            </div>

            {/* Checkboxes de Categoría Rápida */}
            <div className="grid grid-cols-2 gap-1.5 pb-2 border-b border-white/[0.06] text-[10px] font-mono">
              <label className="flex items-center gap-1.5 cursor-pointer text-muted hover:text-primary">
                <input
                  type="checkbox"
                  checked={includeDocs}
                  onChange={(e) => setIncludeDocs(e.target.checked)}
                  className="rounded accent-indigo-500"
                />
                <span>/documentation</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-muted hover:text-primary">
                <input
                  type="checkbox"
                  checked={includeDb}
                  onChange={(e) => setIncludeDb(e.target.checked)}
                  className="rounded accent-indigo-500"
                />
                <span>/database</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-muted hover:text-primary">
                <input
                  type="checkbox"
                  checked={includeSkills}
                  onChange={(e) => setIncludeSkills(e.target.checked)}
                  className="rounded accent-indigo-500"
                />
                <span>/skills</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-muted hover:text-primary">
                <input
                  type="checkbox"
                  checked={includeContext}
                  onChange={(e) => setIncludeContext(e.target.checked)}
                  className="rounded accent-indigo-500"
                />
                <span>/context</span>
              </label>
            </div>

            {/* Lista del Árbol */}
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center text-muted font-mono text-[11px]">
                Compilando bóveda determinista...
              </div>
            ) : (
              <div className="space-y-2 text-[11px] font-mono">
                {Object.entries(groupedTree).map(([folder, docs]) => {
                  const visibleDocs = docs.filter((d) => filteredDocuments.some((fd) => fd.path === d.path));
                  if (visibleDocs.length === 0) return null;

                    const isRootFolder = folder.startsWith('/ (Raíz');
                    return (
                      <div key={folder} className="space-y-1">
                        <div
                          className={`font-semibold flex items-center gap-1 text-[10.5px] ${
                            isRootFolder ? 'text-amber-400' : 'text-indigo-400'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xs">
                            {isRootFolder ? 'star' : 'folder'}
                          </span>
                          <span>{folder}</span>
                        </div>
                        <div className="pl-3 space-y-0.5 border-l border-white/10">
                          {visibleDocs.map((doc) => {
                            const isSelected = selectedDoc?.path === doc.path;
                            const isManifest = doc.category === 'manifest';
                            return (
                              <button
                                key={doc.path}
                                type="button"
                                onClick={() => setSelectedDoc(doc)}
                                className={`w-full text-left px-2 py-1 rounded-[4px] flex items-center justify-between gap-1.5 transition-all ${
                                  isSelected
                                    ? isManifest
                                      ? 'bg-amber-500/20 border border-amber-500/50 text-white font-medium shadow-sm'
                                      : 'bg-indigo-500/20 border border-indigo-500/40 text-white font-medium'
                                    : isManifest
                                      ? 'text-amber-300/90 hover:text-amber-200 hover:bg-amber-500/10'
                                      : 'text-muted hover:text-primary hover:bg-white/[0.04]'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span
                                    className={`material-symbols-outlined text-[12px] ${
                                      isManifest ? 'text-amber-400 opacity-100' : 'opacity-70'
                                    }`}
                                  >
                                    {isManifest ? 'auto_awesome' : 'description'}
                                  </span>
                                  <span className={`truncate ${isManifest ? 'font-semibold' : ''}`}>
                                    {doc.filename}
                                  </span>
                                </div>
                                <span
                                  className={`text-[9px] px-1 py-0.2 rounded font-sans shrink-0 uppercase ${
                                    isManifest
                                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                                      : doc.freshnessStatus === 'FRESH'
                                        ? 'bg-emerald-500/10 text-emerald-400'
                                        : 'bg-amber-500/10 text-amber-400'
                                  }`}
                                >
                                  {isManifest ? 'INDEX' : doc.freshnessStatus}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                })}
              </div>
            )}
          </div>

          {/* Columna Derecha: Previsualizador de Documento y Metadatos (7 cols) */}
          <div className="md:col-span-7 vision-card p-3 flex flex-col gap-2 overflow-hidden border-white/10 bg-black/20">
            {selectedDoc ? (
              <>
                {/* Cabecera del Documento Seleccionado */}
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] shrink-0">
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-primary text-[12px] truncate">
                      {selectedDoc.header.title}
                    </div>
                    <div className="text-[10px] text-muted font-mono truncate">
                      {selectedDoc.path}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <VisionButton
                      type="button"
                      size="sm"
                      variant="secondary"
                      icon={copied ? 'check' : 'content_copy'}
                      onClick={handleCopyContent}
                      title="Copiar contenido"
                    >
                      {copied ? 'Copiado' : 'Copiar'}
                    </VisionButton>
                    <VisionButton
                      type="button"
                      size="sm"
                      variant="secondary"
                      icon="download"
                      onClick={handleDownloadSingle}
                      title="Descargar sólo este archivo"
                    >
                      Descargar
                    </VisionButton>
                  </div>
                </div>

                {/* Etiquetas Semánticas y Freshness */}
                <div className="flex flex-wrap items-center gap-1 shrink-0">
                  <VisionPill
                    variant={selectedDoc.freshnessStatus === 'FRESH' ? 'emerald' : 'amber'}
                  >
                    {selectedDoc.freshnessStatus}
                  </VisionPill>
                  {selectedDoc.header.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.05] text-muted font-mono"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Visor de Contenido Monospace */}
                <div className="flex-1 min-h-0 bg-black/40 rounded-[6px] p-2.5 overflow-y-auto custom-scrollbar font-mono text-[10.5px] leading-relaxed text-secondary select-text border border-white/[0.04]">
                  <pre className="whitespace-pre-wrap break-all">{selectedDoc.content}</pre>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted font-mono text-center p-4">
                Selecciona un archivo del árbol para previsualizar su contenido determinista y encabezado YAML.
              </div>
            )}
          </div>
        </div>

        {/* Barra de Progreso de Empaquetado */}
        {isExporting && (
          <div className="space-y-1 pt-1 fade-in">
            <div className="text-[10px] font-mono text-indigo-400 flex items-center justify-between">
              <span>Empaquetando artefactos en ZIP con JSZip...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Barra de Acciones Inferior */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
          <div className="text-[10.5px] text-muted font-mono">
            {filteredDocuments.length} artefactos listos para transferir a Cursor / Claude
          </div>

          <div className="flex items-center gap-2">
            <VisionButton type="button" onClick={onClose} disabled={isExporting}>
              Cerrar
            </VisionButton>
            <VisionButton
              type="button"
              variant="primary"
              icon="download_for_offline"
              onClick={handleExportZip}
              disabled={isExporting || filteredDocuments.length === 0}
            >
              {isExporting ? 'Empaquetando...' : 'Descargar Paquete ZIP'}
            </VisionButton>
          </div>
        </div>
      </div>
    </VisionModal>
  );
};
