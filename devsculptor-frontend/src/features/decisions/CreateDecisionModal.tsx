import React, { useState } from 'react';
import { VisionModal } from '@/components/ui/VisionModal';
import { VisionInput } from '@/components/ui/VisionInput';
import { VisionButton } from '@/components/ui/VisionButton';
import { decisionsService } from '@/services/decisions.service';
import { Decision } from '@/types/decision.types';

interface CreateDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onCreated: (decision: Decision) => void;
}

export const CreateDecisionModal: React.FC<CreateDecisionModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onCreated,
}) => {
  const [code, setCode] = useState('ADR-04');
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [decision, setDecision] = useState('');
  const [consequences, setConsequences] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const regex = /^ADR-\d{2,3}$/;
    if (!regex.test(code.trim())) {
      setError('El código debe seguir el formato formal de acta: ADR-01, ADR-02, etc.');
      return;
    }
    if (!title.trim() || !context.trim() || !decision.trim()) {
      setError('Título, contexto y decisión son campos obligatorios para el acta.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const created = await decisionsService.create(projectId, {
        code: code.trim(),
        title: title.trim(),
        context: context.trim(),
        decision: decision.trim(),
        consequences: consequences.trim() || undefined,
        status: 'PROPOSED',
      });

      onCreated(created);
      setTitle('');
      setContext('');
      setDecision('');
      setConsequences('');
      setIsSubmitting(false);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar acta ADR');
      setIsSubmitting(false);
    }
  };

  return (
    <VisionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Acta de Decisión de Arquitectura (ADR)"
      icon="description"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        {error && (
          <div className="p-2.5 rounded-[6px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <VisionInput
            label="Identificador ADR *"
            required
            placeholder="ADR-04"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <VisionInput
            label="Título del Dilema Técnico *"
            required
            placeholder="Ej. pg.Pool Nativo vs ORM Pesado"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-muted font-medium mb-1">
            Contexto y Justificación del Problema *
          </label>
          <textarea
            rows={2}
            required
            placeholder="Describe las fuerzas concurrentes, restricciones o requerimientos..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="vision-input text-xs"
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-muted font-medium mb-1">
            Decisión de Ingeniería Adoptada *
          </label>
          <textarea
            rows={2}
            required
            placeholder="Especifica el patrón o solución ratificada..."
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            className="vision-input text-xs"
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-muted font-medium mb-1">
            Consecuencias y Trade-offs (Opcional)
          </label>
          <textarea
            rows={2}
            placeholder="Impacto positivo o compromisos operacionales asumidos..."
            value={consequences}
            onChange={(e) => setConsequences(e.target.value)}
            className="vision-input text-xs"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
          <VisionButton type="button" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </VisionButton>
          <VisionButton type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Registrando...' : 'Registrar Propuesta ADR'}
          </VisionButton>
        </div>
      </form>
    </VisionModal>
  );
};
