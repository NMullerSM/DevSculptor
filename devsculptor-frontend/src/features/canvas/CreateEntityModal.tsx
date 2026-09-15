import React, { useState } from 'react';
import { VisionModal } from '@/components/ui/VisionModal';
import { VisionInput } from '@/components/ui/VisionInput';
import { VisionButton } from '@/components/ui/VisionButton';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { CanvasColumn } from '@/types/canvas.types';

interface CreateEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const CreateEntityModal: React.FC<CreateEntityModalProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<CanvasColumn[]>([
    { name: 'id', type: 'UUID PK', isPk: true },
    { name: 'name', type: 'VARCHAR', isPk: false },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { createEntity, entities } = useCanvasStore();

  const handleAddColumn = () => {
    setColumns((prev) => [...prev, { name: 'col_name', type: 'VARCHAR', isPk: false }]);
  };

  const handleUpdateColumn = (index: number, key: keyof CanvasColumn, value: unknown) => {
    setColumns((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [key]: value } : c))
    );
  };

  const handleRemoveColumn = (index: number) => {
    setColumns((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim()) {
      setError('El nombre de la tabla es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Posición escalonada
      const nextX = 40 + (entities.length % 4) * 280;
      const nextY = 60 + Math.floor(entities.length / 4) * 240;

      await createEntity(projectId, {
        table_name: tableName.trim().toLowerCase(),
        columns_json: columns,
        position_x: nextX,
        position_y: nextY,
      });

      setTableName('');
      setColumns([
        { name: 'id', type: 'UUID PK', isPk: true },
        { name: 'name', type: 'VARCHAR', isPk: false },
      ]);
      setIsSubmitting(false);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear tabla');
      setIsSubmitting(false);
    }
  };

  return (
    <VisionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Diseñar Nueva Tabla en Canvas ERD"
      icon="table_chart"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {error && (
          <div className="p-2.5 rounded-[6px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
            {error}
          </div>
        )}

        <VisionInput
          label="Nombre de Tabla (snake_case) *"
          required
          placeholder="Ej. audit_logs"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted font-medium">
              Columnas y Restricciones
            </label>
            <button
              type="button"
              onClick={handleAddColumn}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
            >
              <span className="material-symbols-outlined text-xs">add</span>
              <span>Añadir Columna</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {columns.map((col, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="nombre"
                  value={col.name}
                  onChange={(e) => handleUpdateColumn(idx, 'name', e.target.value)}
                  className="vision-input !py-1 text-xs flex-1"
                />
                <input
                  type="text"
                  placeholder="tipo (ej. UUID, VARCHAR)"
                  value={col.type}
                  onChange={(e) => handleUpdateColumn(idx, 'type', e.target.value)}
                  className="vision-input !py-1 text-xs w-32 font-mono"
                />
                <label className="flex items-center gap-1 text-[10px] font-mono text-muted cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={!!col.isPk}
                    onChange={(e) => handleUpdateColumn(idx, 'isPk', e.target.checked)}
                    className="rounded accent-indigo-500"
                  />
                  <span>PK</span>
                </label>
                {columns.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveColumn(idx)}
                    className="text-muted hover:text-rose-400"
                  >
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
          <VisionButton type="button" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </VisionButton>
          <VisionButton type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creando...' : 'Añadir al Canvas'}
          </VisionButton>
        </div>
      </form>
    </VisionModal>
  );
};
