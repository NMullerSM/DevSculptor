import React, { useState, useEffect } from 'react';
import { VisionModal } from '@/components/ui/VisionModal';
import { VisionInput } from '@/components/ui/VisionInput';
import { VisionButton } from '@/components/ui/VisionButton';
import { requirementsService } from '@/services/requirements.service';
import { Requirement, RequirementType, RequirementPriority } from '@/types/requirement.types';

interface EditRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  requirement: Requirement | null;
  onUpdated: (req: Requirement) => void;
}

export const EditRequirementModal: React.FC<EditRequirementModalProps> = ({
  isOpen,
  onClose,
  projectId,
  requirement,
  onUpdated,
}) => {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<RequirementType>('RF');
  const [priority, setPriority] = useState<RequirementPriority>('MEDIUM');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (requirement) {
      setCode(requirement.code);
      setTitle(requirement.title);
      setType(requirement.type);
      setPriority(requirement.priority);
      setDescription(requirement.description || '');
      setError(null);
    }
  }, [requirement, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirement) return;

    const regex = /^(RF|RNF)-\d{2,3}$/;
    if (code && !regex.test(code.trim())) {
      setError('El código debe seguir el formato formal IEEE: RF-01, RF-02 o RNF-01.');
      return;
    }
    if (!title.trim()) {
      setError('El título del requisito no puede estar vacío.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const updated = await requirementsService.update(projectId, requirement.id, {
        code: code.trim() !== requirement.code ? code.trim() : undefined,
        title: title.trim(),
        type,
        priority,
        description: description.trim() || undefined,
      });

      onUpdated(updated);
      setIsSubmitting(false);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar requisito');
      setIsSubmitting(false);
    }
  };

  return (
    <VisionModal
      isOpen={isOpen && !!requirement}
      onClose={onClose}
      title={`Editar Requisito ${requirement?.code || ''}`}
      icon="edit_note"
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
            label="Código IEEE *"
            required
            placeholder="RF-01"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-muted font-medium mb-1">
              Tipo de Requisito
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as RequirementType)}
              className="vision-input text-xs"
            >
              <option value="RF" className="bg-slate-900 text-white">Funcional (RF)</option>
              <option value="RNF" className="bg-slate-900 text-white">No Funcional (RNF)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <VisionInput
            label="Título del Requisito *"
            required
            placeholder="Ej. Aislamiento Horizontal por user_id"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-muted font-medium mb-1">
              Prioridad
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as RequirementPriority)}
              className="vision-input text-xs"
            >
              <option value="HIGH" className="bg-slate-900 text-white">Alta (HIGH)</option>
              <option value="MEDIUM" className="bg-slate-900 text-white">Media (MEDIUM)</option>
              <option value="LOW" className="bg-slate-900 text-white">Baja (LOW)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-muted font-medium mb-1">
            Descripción y Criterio de Aceptación
          </label>
          <textarea
            rows={3}
            placeholder="Detalle de reglas de negocio, validaciones o precondiciones..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
