import React, { useState } from 'react';
import { VisionModal } from '@/components/ui/VisionModal';
import { useAdminStore } from '@/stores/useAdminStore';

interface CreateVaultFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateVaultFileDialog: React.FC<CreateVaultFileDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { createVaultFile, isSaving } = useAdminStore();

  const [category, setCategory] = useState<'templates' | 'skills' | 'rules' | 'archetypes' | 'sources'>('templates');
  const [title, setTitle] = useState('');
  const [filename, setFilename] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('# Título de la Plantilla Canónica\n\nDescripción del artefacto...\n');
  const [localError, setLocalError] = useState<string | null>(null);

  const getSuggestedPath = () => {
    const cleanFile = filename.trim().replace(/^\/+/, '');
    if (!cleanFile) return `_global/${category}/...`;
    return `_global/${category}/${cleanFile}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!title.trim()) {
      setLocalError('El título es obligatorio.');
      return;
    }
    if (!filename.trim()) {
      setLocalError('El nombre del archivo es obligatorio.');
      return;
    }

    const fullPath = `_global/${category}/${filename.trim().replace(/^\/+/, '')}`;

    try {
      await createVaultFile({
        title: title.trim(),
        path: fullPath,
        category,
        description: description.trim() || undefined,
        content,
      });
      onClose();
      // Reset form
      setTitle('');
      setFilename('');
      setDescription('');
      setContent('# Título de la Plantilla Canónica\n\nDescripción del artefacto...\n');
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Error al aprovisionar artefacto.');
    }
  };

  return (
    <VisionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Aprovisionar Nuevo Artefacto Global"
      description="Crea una nueva fuente, plantilla canónica o regla de IA en la bóveda global (_global/)."
      icon="add_circle"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
        {localError && (
          <div className="p-2.5 rounded-[6px] bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[11px] flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{localError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-muted font-mono font-medium">Categoría Canónica</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as 'templates' | 'skills' | 'rules' | 'archetypes' | 'sources')}
              className="vision-btn !justify-start !text-left bg-black/20 dark:bg-white/[0.05] border border-glass-subtle py-1.5 px-2.5 text-xs text-primary rounded-[6px] outline-none"
            >
              <option value="templates" className="bg-[#12141a] text-white">templates (Plantillas de Requerimientos, ADR, DB)</option>
              <option value="skills" className="bg-[#12141a] text-white">skills (Habilidades de IA para Agentes)</option>
              <option value="rules" className="bg-[#12141a] text-white">rules (Reglas de Desarrollo: Cursor, Claude, etc.)</option>
              <option value="archetypes" className="bg-[#12141a] text-white">archetypes (Arquetipos Arquitecturales)</option>
              <option value="sources" className="bg-[#12141a] text-white">sources (Fuentes Técnicas: Arquitectura, PDFs, MD)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-muted font-mono font-medium">Nombre de Archivo Relativo</label>
            <input
              type="text"
              placeholder="ej: TEMPLATE_API_CONTRACT.md"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="vision-btn !justify-start bg-black/20 dark:bg-white/[0.05] border border-glass-subtle py-1.5 px-2.5 text-xs text-primary rounded-[6px] outline-none font-mono"
            />
          </div>
        </div>

        <div className="p-2 rounded-[6px] bg-indigo-500/5 border border-indigo-500/15 font-mono text-[11px] text-indigo-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-xs">folder_special</span>
          <span>Ruta destino calculada: <strong>{getSuggestedPath()}</strong></span>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-muted font-mono font-medium">Título Descriptivo</label>
          <input
            type="text"
            placeholder="ej: Plantilla Canónica de Contrato OpenAPI 3.1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="vision-btn !justify-start bg-black/20 dark:bg-white/[0.05] border border-glass-subtle py-1.5 px-2.5 text-xs text-primary rounded-[6px] outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-muted font-mono font-medium">Descripción y Propósito</label>
          <input
            type="text"
            placeholder="ej: Estandariza la especificación técnica de endpoints y schemas..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="vision-btn !justify-start bg-black/20 dark:bg-white/[0.05] border border-glass-subtle py-1.5 px-2.5 text-xs text-primary rounded-[6px] outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-muted font-mono font-medium">Contenido Inicial (Markdown / YAML)</label>
          <textarea
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-black/30 dark:bg-black/50 border border-glass-subtle rounded-[6px] p-2.5 font-mono text-[11.5px] text-primary outline-none focus:border-indigo-500/50 resize-y"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-glass-subtle">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="vision-btn py-1.5 px-3"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="vision-btn vision-btn-primary py-1.5 px-4 flex items-center gap-1.5"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                <span>Aprovisionando...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xs">rocket_launch</span>
                <span>Aprovisionar Artefacto</span>
              </>
            )}
          </button>
        </div>
      </form>
    </VisionModal>
  );
};
