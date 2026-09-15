import React, { useState, useEffect } from 'react';
import { VisionModal } from '@/components/ui/VisionModal';
import { VisionInput } from '@/components/ui/VisionInput';
import { VisionButton } from '@/components/ui/VisionButton';
import { useProjectStore } from '@/stores/useProjectStore';
import { Project, ArchitectureStyle } from '@/types/project.types';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onUpdated?: () => void;
}

const ARCHITECTURE_STYLES: ArchitectureStyle[] = [
  'Monolito Modular Layered MVC',
  'Microservicios Desacoplados',
  'Event-Driven Architecture',
  'Clean Architecture / Hexagonal',
];

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [architectureStyle, setArchitectureStyle] = useState<ArchitectureStyle>(
    'Monolito Modular Layered MVC'
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { updateProject } = useProjectStore();

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setArchitectureStyle(
        (project.architecture_style as ArchitectureStyle) || 'Monolito Modular Layered MVC'
      );
      setError(null);
    }
  }, [project, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    if (!name.trim()) {
      setError('El nombre del proyecto no puede estar vacío.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await updateProject(project.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        architecture_style: architectureStyle,
      });
      setIsSubmitting(false);
      onClose();
      if (onUpdated) onUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar proyecto');
      setIsSubmitting(false);
    }
  };

  return (
    <VisionModal
      isOpen={isOpen && !!project}
      onClose={onClose}
      title="Editar Metadatos de Proyecto"
      icon="tune"
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
            Descripción / Alcance Técnico
          </label>
          <textarea
            rows={3}
            placeholder="Propósito del software, contexto de gobernanza, módulos previstos..."
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
