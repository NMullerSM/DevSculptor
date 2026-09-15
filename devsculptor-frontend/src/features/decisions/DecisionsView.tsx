import React, { useState, useEffect } from 'react';
import { decisionsService } from '@/services/decisions.service';
import { Decision, DecisionStatus } from '@/types/decision.types';
import { VisionButton } from '@/components/ui/VisionButton';
import { VisionPill } from '@/components/ui/VisionPill';
import { CreateDecisionModal } from './CreateDecisionModal';
import { EditDecisionModal } from './EditDecisionModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useProjectStore } from '@/stores/useProjectStore';

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
  const [editingDecision, setEditingDecision] = useState<Decision | null>(null);
  const [deletingDecision, setDeletingDecision] = useState<Decision | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { fetchMetrics } = useProjectStore();

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

  const handleStatusChange = async (decisionId: string, nextStatus: 'ACCEPTED' | 'REJECTED') => {
    setActionError(null);
    try {
      const updated = await decisionsService.changeStatus(projectId, decisionId, nextStatus);
      setDecisions((prev) => prev.map((d) => (d.id === decisionId ? updated : d)));
      // Refrescar métricas ya que los ADRs aceptados impactan el Maturity Index
      await fetchMetrics(projectId);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error al cambiar estado de la decisión');
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
    <div className="flex-1 flex flex-col h-full p-4 gap-3 select-none">
      {/* Encabezado */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] shrink-0">
        <div>
          <h2 className="text-xs font-semibold text-white">
            Registro de Decisiones de Arquitectura (ADRs)
          </h2>
          <p className="text-[10.5px] text-secondary font-mono">
            Trazabilidad técnica inmutable con máquina de estados finitos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <VisionPill variant="cyan">GOBERNANZA FORMAL</VisionPill>
          <VisionButton
            variant="primary"
            icon="add"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
          >
            Nueva Acta ADR
          </VisionButton>
        </div>
      </div>

      {/* Filtros de Estado */}
      <div className="flex items-center gap-2 shrink-0">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="vision-btn text-xs !py-1 bg-black/30"
        >
          <option value="ALL" className="bg-slate-900 text-white">Todos los estados</option>
          <option value="PROPOSED" className="bg-slate-900 text-white">En Evaluación (PROPOSED)</option>
          <option value="ACCEPTED" className="bg-slate-900 text-white">Ratificadas (ACCEPTED)</option>
          <option value="REJECTED" className="bg-slate-900 text-white">Descartadas (REJECTED)</option>
        </select>
        <span className="text-[10.5px] font-mono text-muted ml-auto">
          {decisions.length} {decisions.length === 1 ? 'acta registrada' : 'actas registradas'}
        </span>
      </div>

      {/* Lista de Actas ADR */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {isLoading && decisions.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted font-mono">Cargando actas ADR...</div>
        ) : decisions.length === 0 ? (
          <div className="vision-card p-8 text-center text-muted text-xs font-mono">
            No se encontraron decisiones para este filtro. Registra tu primera acta ADR.
          </div>
        ) : (
          decisions.map((adr) => {
            const isProposed = adr.status === 'PROPOSED';
            const isAccepted = adr.status === 'ACCEPTED';
            const isRejected = adr.status === 'REJECTED';

            return (
              <div
                key={adr.id}
                className="vision-card p-4 space-y-3 hover:border-white/20 transition-all border-white/[0.08]"
              >
                {/* Cabecera del Acta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-white bg-white/[0.08] px-2 py-0.5 rounded-[4px] border border-white/15">
                      {adr.code}
                    </span>
                    <h3 className="font-semibold text-xs text-white tracking-tight">
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
                      className="vision-btn vision-btn-icon text-muted hover:text-indigo-300 text-xs"
                      title="Editar acta ADR"
                    >
                      <span className="material-symbols-outlined text-xs">edit</span>
                    </button>
                    <button
                      onClick={() => setDeletingDecision(adr)}
                      className="vision-btn vision-btn-icon text-muted hover:text-rose-400 text-xs"
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
                  <p className="text-[11.5px] text-secondary leading-relaxed bg-black/20 p-2 rounded-[5px]">
                    {adr.context}
                  </p>
                </div>

                {/* Decisión Adoptada */}
                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block font-semibold">
                    Decisión Ratificada:
                  </span>
                  <p className="text-[11.5px] text-white leading-relaxed bg-indigo-500/[0.06] border border-indigo-500/20 p-2 rounded-[5px]">
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

                {/* Transición de Máquina de Estados */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  {isProposed ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] font-mono text-amber-300">
                        Estado: En evaluación
                      </span>
                      <VisionButton
                        size="sm"
                        icon="check_circle"
                        onClick={() => handleStatusChange(adr.id, 'ACCEPTED')}
                        className="!bg-emerald-500/20 !border-emerald-500/40 text-emerald-300 hover:!bg-emerald-500/30"
                      >
                        Aprobar Decisión
                      </VisionButton>
                      <VisionButton
                        size="sm"
                        icon="cancel"
                        onClick={() => handleStatusChange(adr.id, 'REJECTED')}
                        className="!bg-rose-500/20 !border-rose-500/40 text-rose-300 hover:!bg-rose-500/30"
                      >
                        Rechazar Decisión
                      </VisionButton>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-muted">
                      <span className="material-symbols-outlined text-xs text-emerald-400">lock</span>
                      <span>Decisión ratificada — Estado inmutable por gobernanza técnica.</span>
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
    </div>
  );
};
