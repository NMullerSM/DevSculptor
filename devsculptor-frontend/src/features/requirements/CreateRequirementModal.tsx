import React, { useState } from 'react';
import { VisionModal } from '@/components/ui/VisionModal';
import { VisionInput } from '@/components/ui/VisionInput';
import { VisionButton } from '@/components/ui/VisionButton';
import { requirementsService } from '@/services/requirements.service';
import { Requirement, RequirementType, RequirementPriority } from '@/types/requirement.types';

interface CreateRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onCreated: (req: Requirement) => void;
}

export const CreateRequirementModal: React.FC<CreateRequirementModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onCreated,
}) => {
  const [code, setCode] = useState('RF-04');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<RequirementType>('RF');
  const [priority, setPriority] = useState<RequirementPriority>('HIGH');
  const [entityRelation, setEntityRelation] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const regex = /^(RF|RNF)-\d{2,3}$/;
    if (!regex.test(code.trim())) {
      setError('El código debe seguir el formato formal IEEE: RF-01, RF-02 o RNF-01.');
      return;
    }
    if (!title.trim()) {
      setError('El título del requisito es obligatorio.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const created = await requirementsService.create(projectId, {
        code: code.trim(),
        title: title.trim(),
        type,
        priority,
        entity_relation: entityRelation.trim() || undefined,
        description: description.trim() || undefined,
      });

      onCreated(created);
      setTitle('');
      setDescription('');
      setIsSubmitting(false);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar requisito');
      setIsSubmitting(false);
    }
  };

  return (
    <VisionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Nuevo Requisito (IEEE-830)"
      icon="checklist"
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
            label="Código (Formato RF-01 / RNF-01) *"
            required
            placeholder="RF-04"
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

        <VisionInput
          label="Título del Requisito *"
          required
          placeholder="Ej. Control de Acceso y Aislamiento por Proyecto"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-muted font-medium mb-1">
              Prioridad
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as RequirementPriority)}
              className="vision-input text-xs"
            >
              <option value="HIGH" className="bg-slate-900 text-white">ALTA (Crítica)</option>
              <option value="MEDIUM" className="bg-slate-900 text-white">MEDIA</option>
              <option value="LOW" className="bg-slate-900 text-white">BAJA</option>
            </select>
          </div>
          <VisionInput
            label="Entidad Relacionada (Opcional)"
            placeholder="users, projects, pg.Pool"
            value={entityRelation}
            onChange={(e) => setEntityRelation(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-muted font-medium mb-1">
            Descripción y Criterio de Aceptación
          </label>
          <textarea
            rows={3}
            placeholder="Detalla el comportamiento esperado y la condición técnica..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="vision-input text-xs"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
          <VisionButton type="button" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </VisionButton>
          <VisionButton type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar Requisito'}
          </VisionButton>
        </div>
      </form>
    </VisionModal>
  );
};
