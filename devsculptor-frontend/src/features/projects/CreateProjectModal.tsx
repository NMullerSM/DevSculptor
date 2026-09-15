import React, { useState } from 'react';
import { VisionModal } from '@/components/ui/VisionModal';
import { VisionInput } from '@/components/ui/VisionInput';
import { VisionButton } from '@/components/ui/VisionButton';
import { useProjectStore } from '@/stores/useProjectStore';
import { ArchitectureStyle } from '@/types/project.types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const ARCHITECTURE_STYLES: ArchitectureStyle[] = [
  'Monolito Modular Layered MVC',
  'Microservicios Desacoplados',
  'Event-Driven Architecture',
  'Clean Architecture / Hexagonal',
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [architectureStyle, setArchitectureStyle] = useState<ArchitectureStyle>(
    'Monolito Modular Layered MVC'
  );
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
        description: description.trim() || undefined,
        architecture_style: architectureStyle,
      });
      setName('');
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
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {error && (
          <div className="p-2.5 rounded-[6px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
            {error}
          </div>
        )}

        <VisionInput
          label="Nombre del Proyecto *"
          required
          placeholder="Ej. DevSculptor Core MVP"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-muted font-medium mb-1">
            Estilo Arquitectónico Canónico
          </label>
          <select
            value={architectureStyle}
            onChange={(e) => setArchitectureStyle(e.target.value as ArchitectureStyle)}
            className="vision-input text-xs"
          >
            {ARCHITECTURE_STYLES.map((style) => (
              <option key={style} value={style} className="bg-slate-900 text-white">
                {style}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-muted font-medium mb-1">
            Descripción y Alcance (Opcional)
          </label>
          <textarea
            rows={3}
            placeholder="Describe brevemente el propósito del sistema..."
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
            {isSubmitting ? 'Creando...' : 'Crear y Abrir'}
          </VisionButton>
        </div>
      </form>
    </VisionModal>
  );
};
