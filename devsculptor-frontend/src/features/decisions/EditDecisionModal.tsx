import React, { useState, useEffect } from 'react';
import { VisionModal } from '@/components/ui/VisionModal';
import { VisionInput } from '@/components/ui/VisionInput';
import { VisionButton } from '@/components/ui/VisionButton';
import { decisionsService } from '@/services/decisions.service';
import { Decision } from '@/types/decision.types';

interface EditDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  decision: Decision | null;
  onUpdated: (decision: Decision) => void;
}

export const EditDecisionModal: React.FC<EditDecisionModalProps> = ({
  isOpen,
  onClose,
  projectId,
  decision,
  onUpdated,
}) => {
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [decisionContent, setDecisionContent] = useState('');
  const [consequences, setConsequences] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (decision) {
      setTitle(decision.title);
      setContext(decision.context);
      setDecisionContent(decision.decision);
      setConsequences(decision.consequences || '');
      setError(null);
    }
  }, [decision, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decision) return;

    if (!title.trim() || !context.trim() || !decisionContent.trim()) {
      setError('Título, contexto y decisión son campos obligatorios para el acta ADR.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const updated = await decisionsService.update(projectId, decision.id, {
        title: title.trim(),
        context: context.trim(),
        decision: decisionContent.trim(),
        consequences: consequences.trim() || undefined,
      });

      onUpdated(updated);
      setIsSubmitting(false);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar acta ADR');
      setIsSubmitting(false);
    }
  };

  return (
    <VisionModal
      isOpen={isOpen && !!decision}
      onClose={onClose}
      title={`Editar Acta ${decision?.code || 'ADR'}`}
      icon="edit_document"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        {error && (
          <div className="p-2.5 rounded-[6px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
            {error}
          </div>
        )}

        <VisionInput
          label="Título del Dilema Técnico *"
          required
          placeholder="Ej. pg.Pool Nativo vs ORM Pesado"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-muted font-medium mb-1">
            Contexto del Problema y Fuerzas en Conflicto *
          </label>
          <textarea
            rows={3}
            placeholder="Describe qué motivó la decisión, qué alternativas existían y qué restricciones había..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="vision-input text-xs resize-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-muted font-medium mb-1">
            Decisión Arquitectónica Adoptada *
          </label>
          <textarea
            rows={3}
            placeholder="Detalla qué solución técnica se eligió y el fundamento técnico..."
            value={decisionContent}
            onChange={(e) => setDecisionContent(e.target.value)}
            className="vision-input text-xs resize-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-muted font-medium mb-1">
            Consecuencias y Trade-offs
          </label>
          <textarea
            rows={2}
            placeholder="Impacto positivo y negativo, compensaciones aceptadas..."
            value={consequences}
            onChange={(e) => setConsequences(e.target.value)}
            className="vision-input text-xs resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
          <VisionButton type="button" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </VisionButton>
          <VisionButton type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </VisionButton>
        </div>
      </form>
    </VisionModal>
  );
};
