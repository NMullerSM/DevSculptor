import React, { useState, useEffect } from 'react';
import { decisionsService } from '@/services/decisions.service';
import { Decision, DecisionStatus } from '@/types/decision.types';
import { VisionButton } from '@/components/ui/VisionButton';
import { VisionPill } from '@/components/ui/VisionPill';
import { CreateDecisionModal } from './CreateDecisionModal';
import { EditDecisionModal } from './EditDecisionModal';
import { AdrStatusVerifyModal } from './AdrStatusVerifyModal';
import { ArchitectureStyleModal } from './ArchitectureStyleModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useProjectStore } from '@/stores/useProjectStore';
import { documentExportService, ExportFormat } from '@/features/export/documentExportService';
import { ConsolidatedDocumentsView } from '@/features/export/ConsolidatedDocumentsView';
import { ENTERPRISE_TEMPLATES } from '@/features/export/okfTemplates';

interface DecisionsViewProps {
  projectId: string;
  onCountChange?: (count: number) => void;
}

export const DecisionsView: React.FC<DecisionsViewProps> = ({
  projectId,
  onCountChange,
}) => {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [editingDecision, setEditingDecision] = useState<Decision | null>(null);
  const [deletingDecision, setDeletingDecision] = useState<Decision | null>(null);

  // Estados para el Modal de Verificación Human-in-the-Loop
  const [verifyingDecision, setVerifyingDecision] = useState<Decision | null>(null);
  const [targetStatus, setTargetStatus] = useState<DecisionStatus | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'adrs' | 'consolidated'>('adrs');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isExportingAdrs, setIsExportingAdrs] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const { activeProject, updateProject, fetchMetrics } = useProjectStore();

  const handleExportAdrs = (format: ExportFormat = 'html') => {
    if (!activeProject || decisions.length === 0) return;
    setIsExportingAdrs(true);
    setActionError(null);
    setIsExportMenuOpen(false);
    try {
      documentExportService.exportAdrsDossier(activeProject, decisions, format);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error al exportar dossier de ADRs');
    } finally {
      setIsExportingAdrs(false);
    }
  };

  const isArchitecturePending =
    !activeProject?.architecture_style ||
    activeProject.architecture_style === 'Por Definir / En Evaluación';

  const loadDecisions = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const statusParam = filterStatus === 'ALL' ? undefined : (filterStatus as DecisionStatus);
      const data = await decisionsService.getAllByProject(projectId, statusParam);
      setDecisions(data);
      if (onCountChange) onCountChange(data.length);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error al cargar actas ADR');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadDecisions();
    }
  }, [projectId, filterStatus]);

  // Abre el modal de verificación formal (Human-in-the-Loop)
  const openStatusVerification = (decision: Decision, nextStatus: DecisionStatus) => {
    setVerifyingDecision(decision);
    setTargetStatus(nextStatus);
  };

  // Ejecución del cambio de estado una vez certificado por el usuario humano
  const handleConfirmVerifiedStatus = async (
    decisionId: string,
    nextStatus: DecisionStatus,
    syncArchitecture?: string
  ) => {
    setActionError(null);
    try {
      const updated = await decisionsService.changeStatus(projectId, decisionId, nextStatus);
      setDecisions((prev) => prev.map((d) => (d.id === decisionId ? updated : d)));

      // Sincronizar con el estilo oficial del proyecto si se ratificó la arquitectura
      if (syncArchitecture && nextStatus === 'ACCEPTED') {
        await updateProject(projectId, { architecture_style: syncArchitecture });
      }

      // Refrescar métricas ya que los ADRs aceptados impactan el Maturity Index
      await fetchMetrics(projectId);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error al cambiar estado de la decisión');
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingDecision) return;
    try {
      await decisionsService.delete(projectId, deletingDecision.id);
      const remaining = decisions.filter((d) => d.id !== deletingDecision.id);
      setDecisions(remaining);
      if (onCountChange) onCountChange(remaining.length);
      await fetchMetrics(projectId);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error al eliminar acta ADR');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full p-2.5 sm:p-4 gap-2.5 sm:gap-3 select-none overflow-hidden">
      {/* Selector de Pestañas: Actas ADR vs Documentos Consolidados */}
      <div className="flex items-center justify-between pb-1.5 border-b border-glass-subtle shrink-0">
        <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-glass-subtle">
          <button
            type="button"
            onClick={() => setActiveSubTab('adrs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === 'adrs'
                ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-500/25'
                : 'text-secondary hover:text-primary hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">gavel</span>
            <span>Actas de Decisión (ADRs)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/10 ml-0.5">
              {decisions.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('consolidated')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === 'consolidated'
                ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-500/25'
                : 'text-secondary hover:text-primary hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">menu_book</span>
            <span>Documentos Consolidados (OKF)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 ml-0.5 border border-emerald-500/30">
              {ENTERPRISE_TEMPLATES.length} Plantillas
            </span>
          </button>
        </div>
      </div>

      {activeSubTab === 'consolidated' ? (
        <ConsolidatedDocumentsView projectId={projectId} />
      ) : (
        <>
          {/* Encabezado */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-glass-subtle shrink-0 gap-2">
        <div className="min-w-0">
          <h2 className="text-xs font-semibold text-primary truncate">
            Registro de Decisiones de Arquitectura (ADRs)
          </h2>
          <p className="text-[10px] sm:text-[10.5px] text-secondary font-mono truncate">
            Gobernanza formal, trazabilidad inmutable y certificación técnica Human-in-the-Loop.
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="relative">
            <div className="flex items-center">
              <VisionButton
                variant="secondary"
                icon="download"
                size="sm"
                onClick={() => handleExportAdrs('html')}
                disabled={isExportingAdrs || decisions.length === 0}
                title="Descargar dossier completo de arquitectura en formato HTML (Abre de inmediato en Windows y permite imprimir a PDF)"
                className="!rounded-r-none border-r-0"
              >
                <span className="hidden xs:inline">{isExportingAdrs ? 'Exportando...' : 'Dossier ADRs (.html)'}</span>
                <span className="xs:hidden">ADRs</span>
              </VisionButton>
              <button
                type="button"
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                disabled={isExportingAdrs || decisions.length === 0}
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
                  Dossier de Arquitectura
                </div>
                <button
                  type="button"
                  onClick={() => handleExportAdrs('html')}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left text-xs text-primary hover:bg-indigo-500/20 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-indigo-400">html</span>
                    <div>
                      <div className="font-medium">Dossier Completo (.html)</div>
                      <div className="text-[10px] text-secondary">Abre directo en Windows + PDF</div>
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">RECOMENDADO</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportAdrs('md')}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left text-xs text-primary hover:bg-indigo-500/20 hover:text-white transition-colors mt-0.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400">description</span>
                    <div>
                      <div className="font-medium">Dossier Markdown (.md)</div>
                      <div className="text-[10px] text-secondary">Para repositorios Git</div>
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-300 font-mono">DEV</span>
                </button>
              </div>
            )}
          </div>
          <VisionButton
            variant="default"
            icon="architecture"
            size="sm"
            onClick={() => setIsArchModalOpen(true)}
            className="!border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:!bg-cyan-500/10"
          >
            <span className="hidden xs:inline">Evaluar Arquitectura</span>
            <span className="xs:hidden">Evaluar</span>
          </VisionButton>
          <VisionButton
            variant="primary"
            icon="add"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
          >
            <span className="hidden xs:inline">Nueva Acta ADR</span>
            <span className="xs:hidden">Nueva</span>
          </VisionButton>
        </div>
      </div>

      {/* Banner de Estado Arquitectónico Oficial */}
      {isArchitecturePending ? (
        <div className="p-2.5 sm:p-3 rounded-[7px] bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-amber-500 dark:text-amber-400 text-lg mt-0.5 shrink-0">
              pending_actions
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-xs text-primary">
                  Estilo Canónico: En Evaluación
                </span>
                <span className="text-[9px] font-mono text-amber-600 dark:text-amber-300 bg-amber-400/20 px-1.5 py-0.5 rounded-[4px] border border-amber-400/30 shrink-0">
                  PENDIENTE
                </span>
              </div>
              <p className="text-[10.5px] sm:text-[11px] text-secondary mt-0.5 line-clamp-2 sm:line-clamp-none">
                El proyecto no impone una arquitectura rígida al inicio. Evalúa los 4 estilos canónicos y ratifica el acta formal correspondiente.
              </p>
            </div>
          </div>
          <VisionButton
            variant="primary"
            icon="architecture"
            size="sm"
            onClick={() => setIsArchModalOpen(true)}
            className="!bg-amber-600 hover:!bg-amber-500 text-white shrink-0 w-full sm:w-auto justify-center"
          >
            Definir Estilo (ADR-001)
          </VisionButton>
        </div>
      ) : (
        <div className="p-2 sm:p-2.5 rounded-[7px] bg-cyan-500/[0.08] border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-2 font-mono flex-wrap">
            <span className="material-symbols-outlined text-cyan-400 text-sm">verified</span>
            <span className="text-secondary text-[10.5px] sm:text-[11px]">Estilo Arquitectónico Oficial:</span>
            <span className="font-bold text-cyan-600 dark:text-cyan-300 text-[10.5px] sm:text-[11px] bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
              {activeProject?.architecture_style}
            </span>
          </div>
          <button
            onClick={() => setIsArchModalOpen(true)}
            className="text-[10.5px] font-mono text-muted hover:text-cyan-400 underline transition-colors self-start sm:self-auto"
          >
            Re-evaluar Arquitectura
          </button>
        </div>
      )}

      {/* Filtros de Estado */}
      <div className="flex items-center gap-2 shrink-0">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="vision-btn text-xs !py-1 bg-[var(--glass-input)] text-primary"
        >
          <option value="ALL" className="bg-slate-900 text-white dark:bg-slate-900">Todos los estados</option>
          <option value="PROPOSED" className="bg-slate-900 text-white dark:bg-slate-900">En Evaluación (PROPOSED)</option>
          <option value="ACCEPTED" className="bg-slate-900 text-white dark:bg-slate-900">Ratificadas (ACCEPTED)</option>
          <option value="REJECTED" className="bg-slate-900 text-white dark:bg-slate-900">Descartadas (REJECTED)</option>
        </select>
        <span className="text-[10.5px] font-mono text-muted ml-auto">
          {decisions.length} {decisions.length === 1 ? 'acta registrada' : 'actas registradas'}
        </span>
      </div>

      {/* Lista de Actas ADR */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {isLoading && decisions.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted font-mono">Cargando actas ADR...</div>
        ) : decisions.length === 0 ? (
          <div className="vision-card p-8 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/[0.04] border border-glass-subtle flex items-center justify-center text-muted">
              <span className="material-symbols-outlined text-2xl">description</span>
            </div>
            <div>
              <h3 className="font-semibold text-xs text-primary">No se encontraron decisiones registradas</h3>
              <p className="text-[11px] text-muted mt-1 max-w-sm">
                Comienza evaluando los estilos canónicos de arquitectura para generar la primera acta de gobernanza.
              </p>
            </div>
            <VisionButton
              variant="primary"
              icon="architecture"
              size="sm"
              onClick={() => setIsArchModalOpen(true)}
              className="mt-1"
            >
              Definir Estilo Arquitectónico
            </VisionButton>
          </div>
        ) : (
          decisions.map((adr) => {
            const isProposed = adr.status === 'PROPOSED';
            const isAccepted = adr.status === 'ACCEPTED';
            const isRejected = adr.status === 'REJECTED';

            return (
              <div
                key={adr.id}
                className="vision-card p-4 space-y-3 hover:border-indigo-500/30 transition-all border-glass-subtle"
              >
                {/* Cabecera del Acta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-primary bg-black/5 dark:bg-white/[0.08] px-2 py-0.5 rounded-[4px] border border-glass-subtle">
                      {adr.code}
                    </span>
                    <h3 className="font-semibold text-xs text-primary tracking-tight">
                      {adr.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <VisionPill
                      variant={isAccepted ? 'emerald' : isRejected ? 'rose' : 'amber'}
                      dot
                    >
                      {adr.status}
                    </VisionPill>
                    <button
                      onClick={() => setEditingDecision(adr)}
                      className="vision-btn vision-btn-icon text-muted hover:text-indigo-500 dark:hover:text-indigo-300 text-xs"
                      title="Editar acta ADR"
                    >
                      <span className="material-symbols-outlined text-xs">edit</span>
                    </button>
                    <button
                      onClick={() => setDeletingDecision(adr)}
                      className="vision-btn vision-btn-icon text-muted hover:text-rose-500 text-xs"
                      title="Eliminar acta ADR"
                    >
                      <span className="material-symbols-outlined text-xs">delete</span>
                    </button>
                  </div>
                </div>

                {/* Contexto y Justificación */}
                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">
                    Contexto y Fuerzas:
                  </span>
                  <p className="text-[11.5px] text-secondary leading-relaxed bg-black/5 dark:bg-black/20 p-2 rounded-[5px]">
                    {adr.context}
                  </p>
                </div>

                {/* Decisión Adoptada */}
                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block font-semibold">
                    Decisión Técnica:
                  </span>
                  <p className="text-[11.5px] text-primary leading-relaxed bg-indigo-500/[0.06] border border-indigo-500/20 p-2 rounded-[5px]">
                    {adr.decision}
                  </p>
                </div>

                {/* Consecuencias si existen */}
                {adr.consequences && (
                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">
                      Consecuencias / Trade-offs:
                    </span>
                    <p className="text-[11px] text-muted leading-relaxed">
                      {adr.consequences}
                    </p>
                  </div>
                )}

                {/* Transición de Máquina de Estados con Verificación Humana */}
                <div className="pt-2 border-t border-glass-subtle flex items-center justify-between text-xs">
                  {isProposed ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] font-mono text-amber-500 dark:text-amber-300 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">pending</span>
                        <span>En evaluación</span>
                      </span>
                      <VisionButton
                        size="sm"
                        icon="verified"
                        onClick={() => openStatusVerification(adr, 'ACCEPTED')}
                        className="!bg-emerald-500/20 !border-emerald-500/40 text-emerald-600 dark:text-emerald-300 hover:!bg-emerald-500/30"
                      >
                        Ratificar Decisión
                      </VisionButton>
                      <VisionButton
                        size="sm"
                        icon="cancel"
                        onClick={() => openStatusVerification(adr, 'REJECTED')}
                        className="!bg-rose-500/20 !border-rose-500/40 text-rose-600 dark:text-rose-300 hover:!bg-rose-500/30"
                      >
                        Descartar
                      </VisionButton>
                    </div>
                  ) : isAccepted ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">lock</span>
                        <span>Ratificada por Arquitecto</span>
                      </span>
                      <button
                        onClick={() => openStatusVerification(adr, 'PROPOSED')}
                        className="vision-btn !py-0.5 !px-2 text-[10.5px] text-muted hover:text-amber-400 hover:border-amber-400/30"
                        title="Reabrir decisión para reevaluación técnica"
                      >
                        Reabrir Evaluación
                      </button>
                      <button
                        onClick={() => openStatusVerification(adr, 'REJECTED')}
                        className="vision-btn !py-0.5 !px-2 text-[10.5px] text-muted hover:text-rose-400 hover:border-rose-400/30"
                        title="Revocar y descartar decisión"
                      >
                        Revocar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] font-mono text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">block</span>
                        <span>Descartada</span>
                      </span>
                      <button
                        onClick={() => openStatusVerification(adr, 'PROPOSED')}
                        className="vision-btn !py-0.5 !px-2 text-[10.5px] text-muted hover:text-amber-400 hover:border-amber-400/30"
                        title="Reconsiderar y reabrir evaluación"
                      >
                        Reconsiderar
                      </button>
                    </div>
                  )}

                  <span className="text-[10px] font-mono text-muted">
                    {new Date(adr.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {actionError && (
        <div className="p-2.5 rounded-[6px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] shrink-0">
          {actionError}
        </div>
      )}

      {/* Modal de Verificación Human-in-the-Loop */}
      <AdrStatusVerifyModal
        isOpen={!!verifyingDecision}
        onClose={() => {
          setVerifyingDecision(null);
          setTargetStatus(null);
        }}
        decision={verifyingDecision}
        targetStatus={targetStatus}
        onConfirm={handleConfirmVerifiedStatus}
      />

      {/* Modal de Selección Canónica de Arquitectura */}
      <ArchitectureStyleModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
        projectId={projectId}
        onCreated={() => loadDecisions()}
      />

      {/* Modal Nueva Acta */}
      <CreateDecisionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        projectId={projectId}
        onCreated={() => loadDecisions()}
      />

      {/* Modal Editar Acta */}
      <EditDecisionModal
        isOpen={!!editingDecision}
        onClose={() => setEditingDecision(null)}
        projectId={projectId}
        decision={editingDecision}
        onUpdated={() => loadDecisions()}
      />

        {/* Diálogo Confirmar Eliminación */}
        <ConfirmModal
          isOpen={!!deletingDecision}
          onClose={() => setDeletingDecision(null)}
          onConfirm={handleConfirmDelete}
          title="Eliminar Acta de Decisión (ADR)"
          description={`¿Estás seguro de eliminar el acta "${deletingDecision?.code} - ${deletingDecision?.title}"? Esta acción impactará el cálculo de métricas del proyecto.`}
          confirmText="Eliminar Acta"
          variant="danger"
        />
        </>
      )}
    </div>
  );
};
