import React, { useState } from 'react';
import { VisionModal } from '@/components/ui/VisionModal';
import { VisionInput } from '@/components/ui/VisionInput';
import { VisionButton } from '@/components/ui/VisionButton';
import { useProjectStore } from '@/stores/useProjectStore';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [leadArchitect, setLeadArchitect] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createProject } = useProjectStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre del proyecto es obligatorio.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      await createProject({
        name: name.trim(),
        organization: organization.trim() || undefined,
        lead_architect: leadArchitect.trim() || undefined,
        description: description.trim() || undefined,
        architecture_style: 'Por Definir / En Evaluación',
      });
      setName('');
      setOrganization('');
      setLeadArchitect('');
      setDescription('');
      setIsSubmitting(false);
      onClose();
      if (onCreated) onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear proyecto');
      setIsSubmitting(false);
    }
  };

  return (
    <VisionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Inicializar Nuevo Proyecto de Software"
      icon="create_new_folder"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {error && (
          <div className="p-2.5 rounded-[6px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
            {error}
          </div>
        )}

        {/* Banner informativo de Gobernanza Desacoplada */}
        <div className="p-2.5 rounded-[6px] bg-indigo-500/10 border border-indigo-500/20 text-secondary flex items-start gap-2 text-[11px]">
          <span className="material-symbols-outlined text-indigo-400 text-sm mt-0.5 shrink-0">info</span>
          <div>
            <span className="font-semibold text-primary block text-[11.5px]">
              Gobernanza Progresiva Pre-Código
            </span>
            <span>
              La arquitectura del sistema ya no se impone al inicio. Podrás evaluarla objetivamente con la IA y ratificarla formalmente mediante <strong>Actas de Decisión (ADRs)</strong> durante el flujo de trabajo.
            </span>
          </div>
        </div>

        <VisionInput
          label="Nombre del Proyecto *"
          required
          placeholder="Ej. Sistema de Pagos Core"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <VisionInput
            label="Organización / Empresa (Opcional)"
            placeholder="Ej. Acme Corp / DevSculptor Labs"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />
          <VisionInput
            label="Arquitecto Líder / Responsable (Opcional)"
            placeholder="Ej. Nathaniel Muller"
            value={leadArchitect}
            onChange={(e) => setLeadArchitect(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-muted font-medium mb-1">
            Descripción y Alcance del Software (Opcional)
          </label>
          <textarea
            rows={3}
            placeholder="Describe brevemente el propósito del sistema, usuarios previstos o restricciones de negocio..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="vision-input text-xs"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-glass-subtle">
          <VisionButton type="button" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </VisionButton>
          <VisionButton type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creando...' : 'Crear y Abrir Estudio'}
          </VisionButton>
        </div>
      </form>
    </VisionModal>
  );
};
