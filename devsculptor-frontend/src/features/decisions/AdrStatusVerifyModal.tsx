import React, { useState } from 'react';
import { VisionModal } from '@/components/ui/VisionModal';
import { VisionButton } from '@/components/ui/VisionButton';
import { VisionPill } from '@/components/ui/VisionPill';
import { Decision, DecisionStatus } from '@/types/decision.types';

interface AdrStatusVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  decision: Decision | null;
  targetStatus: DecisionStatus | null;
  onConfirm: (decisionId: string, nextStatus: DecisionStatus, syncArchitecture?: string) => Promise<void>;
}

export const AdrStatusVerifyModal: React.FC<AdrStatusVerifyModalProps> = ({
  isOpen,
  onClose,
  decision,
  targetStatus,
  onConfirm,
}) => {
  const [isHumanCertified, setIsHumanCertified] = useState(false);
  const [justification, setJustification] = useState('');
  const [syncArchitecture, setSyncArchitecture] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!decision || !targetStatus) return null;

  // Detectar si esta decisión define o propone un estilo arquitectónico
  const detectArchitectureStyle = (): string | null => {
    const text = `${decision.title} ${decision.decision}`.toLowerCase();
    if (text.includes('monolito modular')) return 'Monolito Modular Layered MVC';
    if (text.includes('microservicio') || text.includes('microservices')) return 'Microservicios Desacoplados';
    if (text.includes('hexagonal') || text.includes('clean architecture')) return 'Clean Architecture / Hexagonal';
    if (text.includes('event-driven') || text.includes('eventos')) return 'Event-Driven Architecture';
    return null;
  };

  const detectedArch = detectArchitectureStyle();
  const isTargetAccepted = targetStatus === 'ACCEPTED';
  const isTargetRejected = targetStatus === 'REJECTED';
  const isReopening = targetStatus === 'PROPOSED';

  const handleExecute = async () => {
    if (!isHumanCertified) {
      setError('Debes certificar como arquitecto humano para ratificar este cambio de estado.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const archToSync = isTargetAccepted && syncArchitecture && detectedArch ? detectedArch : undefined;
      await onConfirm(decision.id, targetStatus, archToSync);
      setIsSubmitting(false);
      setIsHumanCertified(false);
      setJustification('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar la verificación de estado');
      setIsSubmitting(false);
    }
  };

  return (
    <VisionModal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) {
          setIsHumanCertified(false);
          setJustification('');
          setError(null);
          onClose();
        }
      }}
      title="Verificación de Gobernanza Técnica (Human-in-the-Loop)"
      icon="verified_user"
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {error && (
          <div className="p-2.5 rounded-[6px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
            {error}
          </div>
        )}

        {/* Banner de Identificación y Bloqueo de IA */}
        <div className="p-3 rounded-[7px] bg-indigo-500/10 border border-indigo-500/25 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-indigo-400 text-lg mt-0.5 shrink-0">shield_person</span>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary text-xs">
                Protocolo Estricto de Certificación de Arquitectura
              </span>
              <span className="text-[9.5px] font-mono font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-[4px] border border-indigo-500/30">
                HUMAN-IN-THE-LOOP
              </span>
            </div>
            <p className="text-[11px] text-secondary leading-relaxed">
              Los agentes autónomos de IA y procesos desatendidos tienen <strong>prohibido alterar el estado de gobernanza</strong> de las actas ADR. Todo cambio de estado requiere la revisión explícita y firma de un arquitecto humano.
            </p>
          </div>
        </div>

        {/* Resumen de la Transición de Estado */}
        <div className="vision-card p-3 space-y-2 border-glass-subtle">
          <div className="flex items-center justify-between border-b border-glass-subtle pb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-primary bg-black/5 dark:bg-white/[0.08] px-2 py-0.5 rounded-[4px]">
                {decision.code}
              </span>
              <span className="font-semibold text-xs text-primary">{decision.title}</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <VisionPill
                variant={decision.status === 'ACCEPTED' ? 'emerald' : decision.status === 'REJECTED' ? 'rose' : 'amber'}
                dot
              >
                {decision.status}
              </VisionPill>
              <span className="material-symbols-outlined text-xs text-muted">arrow_forward</span>
              <VisionPill
                variant={isTargetAccepted ? 'emerald' : isTargetRejected ? 'rose' : 'amber'}
                dot
              >
                {targetStatus}
              </VisionPill>
            </div>
          </div>

          {/* Impacto Técnico según Transición */}
          <div className="text-[11px] leading-relaxed text-secondary pt-1">
            {isTargetAccepted && (
              <p>
                <strong className="text-emerald-400">Impacto de Ratificación (ACCEPTED):</strong> Esta decisión se convertirá en un compromiso arquitectónico vinculante para el diseño relacional y el backend. Aumenta el <em>Technical Maturity Index</em> del proyecto.
              </p>
            )}
            {isTargetRejected && (
              <p>
                <strong className="text-rose-400">Impacto de Descarte (REJECTED):</strong> Documenta formalmente la opción analizada y sus motivos de rechazo, preservando la memoria técnica para evitar reincidir en alternativas descartadas.
              </p>
            )}
            {isReopening && (
              <p>
                <strong className="text-amber-400">Impacto de Reapertura (PROPOSED):</strong> Revoca el estado final previo y reabre el debate técnico. El índice de madurez del proyecto se recalculará automáticamente.
              </p>
            )}
          </div>
        </div>

        {/* Si detecta estilo de arquitectura, opción de sincronización con el proyecto */}
        {detectedArch && isTargetAccepted && (
          <div className="p-3 rounded-[6px] bg-cyan-500/10 border border-cyan-500/25 space-y-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400 text-sm">architecture</span>
              <span className="font-semibold text-xs text-cyan-300">
                Sincronización de Estilo Canónico
              </span>
            </div>
            <p className="text-[11px] text-secondary">
              Esta decisión ratifica el estilo <strong>"{detectedArch}"</strong>.
            </p>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={syncArchitecture}
                onChange={(e) => setSyncArchitecture(e.target.checked)}
                className="rounded border-cyan-400/40 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-[11px] text-primary font-medium">
                Establecer automáticamente como el Estilo Arquitectónico Oficial del Proyecto
              </span>
            </label>
          </div>
        )}

        {/* Justificación opcional del cambio */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-muted font-medium mb-1">
            Justificación Técnica del Cambio (Opcional — Trazabilidad de Auditoría)
          </label>
          <textarea
            rows={2}
            placeholder="Motivo del cambio de estado, nuevos requerimientos que lo justifican o notas de revisión..."
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            className="vision-input text-xs resize-none"
          />
        </div>

        {/* Checkbox Obligatorio de Certificación Humana */}
        <div className="p-3 rounded-[6px] bg-black/5 dark:bg-white/[0.03] border border-glass-subtle">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isHumanCertified}
              onChange={(e) => setIsHumanCertified(e.target.checked)}
              className="mt-0.5 rounded border-indigo-500/40 text-indigo-500 focus:ring-indigo-500"
            />
            <span className="text-[11px] text-primary leading-tight font-medium">
              Certifico formalmente como <strong>Arquitecto de Software</strong> que he evaluado las implicaciones técnicas y apruebo este cambio de estado de gobernanza.
            </span>
          </label>
        </div>

        {/* Acciones del Modal */}
        <div className="flex items-center justify-between pt-2 border-t border-glass-subtle">
          <span className="text-[10px] font-mono text-muted">
            {isHumanCertified ? '✓ Verificación humana satisfecha' : 'Esperando confirmación del arquitecto'}
          </span>

          <div className="flex items-center gap-2">
            <VisionButton
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </VisionButton>
            <VisionButton
              type="button"
              variant="primary"
              onClick={handleExecute}
              disabled={!isHumanCertified || isSubmitting}
              className={
                isTargetAccepted
                  ? '!bg-emerald-600 hover:!bg-emerald-500 text-white shadow-emerald-500/20'
                  : isTargetRejected
                  ? '!bg-rose-600 hover:!bg-rose-500 text-white shadow-rose-500/20'
                  : '!bg-amber-600 hover:!bg-amber-500 text-white shadow-amber-500/20'
              }
            >
              {isSubmitting
                ? 'Certificando...'
                : isTargetAccepted
                ? 'Ratificar Decisión (ACCEPTED)'
                : isTargetRejected
                ? 'Descartar Decisión (REJECTED)'
                : 'Reabrir Evaluación (PROPOSED)'}
            </VisionButton>
          </div>
        </div>
      </div>
    </VisionModal>
  );
};
