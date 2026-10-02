import React, { useState, useEffect } from 'react';
import { requirementsService } from '@/services/requirements.service';
import { Requirement, RequirementType } from '@/types/requirement.types';
import { VisionButton } from '@/components/ui/VisionButton';
import { VisionPill } from '@/components/ui/VisionPill';
import { CreateRequirementModal } from './CreateRequirementModal';
import { EditRequirementModal } from './EditRequirementModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

import { useProjectStore } from '@/stores/useProjectStore';
import { documentExportService, ExportFormat } from '@/features/export/documentExportService';

interface RequirementsViewProps {
  projectId: string;
  onCountChange?: (count: number) => void;
}

export const RequirementsView: React.FC<RequirementsViewProps> = ({
  projectId,
  onCountChange,
}) => {
  const { activeProject } = useProjectStore();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<Requirement | null>(null);
  const [deletingReq, setDeletingReq] = useState<Requirement | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isExportingSrs, setIsExportingSrs] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const handleExportSrs = (format: ExportFormat = 'html') => {
    if (!activeProject || requirements.length === 0) return;
    setIsExportingSrs(true);
    setActionError(null);
    setIsExportMenuOpen(false);
    try {
      documentExportService.exportSrs(activeProject, requirements, format);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error al exportar SRS');
    } finally {
      setIsExportingSrs(false);
    }
  };

  const loadRequirements = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const typeParam = filterType === 'ALL' ? undefined : (filterType as RequirementType);
      const data = await requirementsService.getAllByProject(projectId, typeParam);
      setRequirements(data);
      if (onCountChange) onCountChange(data.length);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error al cargar requisitos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadRequirements();
    }
  }, [projectId, filterType]);

  const filtered = requirements.filter(
    (r) =>
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleConfirmDelete = async () => {
    if (!deletingReq) return;
    try {
      await requirementsService.delete(projectId, deletingReq.id);
      const updated = requirements.filter((r) => r.id !== deletingReq.id);
      setRequirements(updated);
      if (onCountChange) onCountChange(updated.length);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error al eliminar requisito');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full p-2.5 sm:p-4 gap-2.5 sm:gap-3 select-none">
      {/* Encabezado */}
      <div className="flex items-center justify-between pb-2 border-b border-glass-subtle shrink-0 gap-2">
        <div className="min-w-0">
          <h2 className="text-xs font-semibold text-primary truncate">Matriz de Requisitos (IEEE-830)</h2>
          <p className="text-[10px] sm:text-[10.5px] text-secondary font-mono truncate">
            Parametrizados bajo formato formal y validados con Zod.
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <div className="flex items-center">
              <VisionButton
                variant="secondary"
                icon="download"
                size="sm"
                onClick={() => handleExportSrs('html')}
                disabled={isExportingSrs || requirements.length === 0}
                title="Descargar especificación de requisitos en formato HTML (Abre de inmediato en Windows y permite imprimir a PDF)"
                className="!rounded-r-none border-r-0"
              >
                <span className="hidden xs:inline">{isExportingSrs ? 'Exportando...' : 'Exportar SRS (.html)'}</span>
                <span className="xs:hidden">SRS</span>
              </VisionButton>
              <button
                type="button"
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                disabled={isExportingSrs || requirements.length === 0}
                className="vision-btn !p-1 !px-1.5 !text-xs !rounded-l-none border-l border-white/10 hover:bg-white/10 disabled:opacity-50"
                title="Otras opciones de exportación"
              >
                <span className="material-symbols-outlined text-[15px]">arrow_drop_down</span>
              </button>
            </div>

            {isExportMenuOpen && (
              <div 
                className="absolute right-0 mt-1.5 w-64 vision-card p-1.5 shadow-2xl z-50 animate-fade-in border border-indigo-500/30 bg-[#0f172a]/95 backdrop-blur-xl rounded-xl"
                onMouseLeave={() => setIsExportMenuOpen(false)}
              >
                <div className="px-2 py-1 text-[10px] font-semibold text-secondary uppercase tracking-wider">
                  Formatos Disponibles
                </div>
                <button
                  type="button"
                  onClick={() => handleExportSrs('html')}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left text-xs text-primary hover:bg-indigo-500/20 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-indigo-400">html</span>
                    <div>
                      <div className="font-medium">Documento HTML (.html)</div>
                      <div className="text-[10px] text-secondary">Abre directo en Windows + PDF</div>
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">RECOMENDADO</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportSrs('md')}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left text-xs text-primary hover:bg-indigo-500/20 hover:text-white transition-colors mt-0.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400">description</span>
                    <div>
                      <div className="font-medium">Markdown Puro (.md)</div>
                      <div className="text-[10px] text-secondary">Para repositorios Git</div>
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-300 font-mono">DEV</span>
                </button>
              </div>
            )}
          </div>

          <VisionButton
            variant="primary"
            icon="add"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
          >
            <span className="hidden xs:inline">Nuevo Requisito</span>
            <span className="xs:hidden">Nuevo</span>
          </VisionButton>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <input
          type="text"
          placeholder="Buscar por código o título..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="vision-input !py-1 text-xs flex-1 min-w-[130px] sm:max-w-xs"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="vision-btn text-xs !py-1 bg-[var(--glass-input)] text-primary shrink-0"
        >
          <option value="ALL" className="bg-slate-900 text-white dark:bg-slate-900">Todos</option>
          <option value="RF" className="bg-slate-900 text-white dark:bg-slate-900">Solo RF (Funcionales)</option>
          <option value="RNF" className="bg-slate-900 text-white dark:bg-slate-900">Solo RNF (No Funcionales)</option>
        </select>
        <span className="text-[10px] sm:text-[10.5px] font-mono text-muted ml-auto hidden xs:inline shrink-0">
          {filtered.length} {filtered.length === 1 ? 'requisito' : 'requisitos'}
        </span>
      </div>

      {/* Lista de Requisitos */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {isLoading && requirements.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted font-mono">Cargando requisitos...</div>
        ) : filtered.length === 0 ? (
          <div className="vision-card p-8 text-center text-muted text-xs font-mono">
            No se encontraron requisitos para este filtro. Haz clic en "Nuevo Requisito" para comenzar.
          </div>
        ) : (
          filtered.map((req) => (
            <div
              key={req.id}
              className="vision-card p-3 flex flex-col md:flex-row md:items-start justify-between gap-3 hover:border-indigo-500/30 transition-all"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs text-primary bg-black/5 dark:bg-white/[0.06] px-2 py-0.5 rounded-[4px] border border-glass-subtle">
                    {req.code}
                  </span>
                  <VisionPill variant={req.type === 'RF' ? 'amber' : 'cyan'}>
                    {req.type}
                  </VisionPill>
                  <span
                    className={`text-[9.5px] font-mono px-2 py-0.5 rounded-[4px] font-medium ${
                      req.priority === 'HIGH'
                        ? 'text-rose-500 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20'
                        : req.priority === 'MEDIUM'
                        ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20'
                        : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                    }`}
                  >
                    PRIORIDAD {req.priority}
                  </span>
                  {req.entity_relation && (
                    <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-[4px] border border-cyan-500/20">
                      Entidad: {req.entity_relation}
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-xs text-primary tracking-tight">
                  {req.title}
                </h3>

                {req.description && (
                  <p className="text-[11.5px] text-secondary leading-relaxed">
                    {req.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0 self-end md:self-start">
                <button
                  onClick={() => setEditingReq(req)}
                  className="vision-btn vision-btn-icon text-muted hover:text-indigo-300"
                  title="Editar requisito"
                  aria-label="Editar requisito"
                >
                  <span className="material-symbols-outlined text-xs">edit</span>
                </button>
                <button
                  onClick={() => setDeletingReq(req)}
                  className="vision-btn vision-btn-icon text-muted hover:text-rose-400"
                  title="Eliminar requisito"
                  aria-label="Eliminar requisito"
                >
                  <span className="material-symbols-outlined text-xs">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {actionError && (
        <div className="p-2.5 rounded-[6px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] shrink-0">
          {actionError}
        </div>
      )}

      {/* Modal Nuevo Requisito */}
      <CreateRequirementModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        projectId={projectId}
        onCreated={() => loadRequirements()}
      />

      {/* Modal Editar Requisito */}
      <EditRequirementModal
        isOpen={!!editingReq}
        onClose={() => setEditingReq(null)}
        projectId={projectId}
        requirement={editingReq}
        onUpdated={() => loadRequirements()}
      />

      {/* Diálogo Confirmar Eliminación */}
      <ConfirmModal
        isOpen={!!deletingReq}
        onClose={() => setDeletingReq(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Requisito"
        description={`¿Estás seguro de eliminar el requisito "${deletingReq?.code} - ${deletingReq?.title}" de la matriz IEEE-830?`}
        confirmText="Eliminar Requisito"
        variant="danger"
      />
    </div>
  );
};
