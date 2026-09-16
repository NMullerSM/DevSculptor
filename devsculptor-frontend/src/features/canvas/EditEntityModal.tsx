import React, { useState, useEffect } from 'react';
import { VisionModal } from '@/components/ui/VisionModal';
import { VisionButton } from '@/components/ui/VisionButton';
import { VisionInput } from '@/components/ui/VisionInput';
import { CanvasEntity, CanvasColumn } from '@/types/canvas.types';
import { useCanvasStore } from '@/stores/useCanvasStore';

interface EditEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: CanvasEntity | null;
  projectId: string;
}

const COMMON_DATA_TYPES = [
  'UUID',
  'VARCHAR(255)',
  'VARCHAR(100)',
  'TEXT',
  'INTEGER',
  'BIGINT',
  'BOOLEAN',
  'TIMESTAMPTZ',
  'JSONB',
  'DECIMAL(12,2)',
];

export const EditEntityModal: React.FC<EditEntityModalProps> = ({
  isOpen,
  onClose,
  entity,
  projectId,
}) => {
  const { entities, updateEntity } = useCanvasStore();
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<CanvasColumn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (entity) {
      setTableName(entity.table_name);
      setColumns(
        Array.isArray(entity.columns_json)
          ? entity.columns_json.map((c) => ({
              ...c,
              isPk: c.isPk ?? c.is_pk ?? false,
              isFk: c.isFk ?? c.is_fk ?? false,
              referencesTable: c.referencesTable ?? c.references_table ?? '',
              referencesColumn: c.referencesColumn ?? c.references_column ?? 'id',
              cardinality: c.cardinality ?? '1:N',
              nullable: c.nullable ?? true,
              unique: c.unique ?? false,
            }))
          : []
      );
      setError(null);
    }
  }, [entity]);

  if (!entity) return null;

  const otherTables = entities.filter((e) => e.id !== entity.id);

  const handleAddColumn = () => {
    setColumns([
      ...columns,
      {
        name: `col_${columns.length + 1}`,
        type: 'VARCHAR(255)',
        isPk: false,
        nullable: true,
        unique: false,
      },
    ]);
  };

  const handleRemoveColumn = (index: number) => {
    if (columns.length <= 1) {
      setError('La tabla debe contener al menos una columna.');
      return;
    }
    setColumns(columns.filter((_, i) => i !== index));
  };

  const handleColumnChange = (index: number, field: keyof CanvasColumn, value: unknown) => {
    setColumns((prev) =>
      prev.map((col, i) => {
        if (i !== index) return col;
        const updated = { ...col, [field]: value };

        // Si se activa PK, nullable se vuelve false
        if (field === 'isPk' && value === true) {
          updated.nullable = false;
        }

        // Si se desactiva FK, limpiar referencias
        if (field === 'isFk' && value === false) {
          updated.referencesTable = undefined;
          updated.referencesColumn = undefined;
          updated.cardinality = undefined;
        }

        return updated;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = tableName.trim().toLowerCase();
    if (!cleanName) {
      setError('El nombre de la tabla es obligatorio.');
      return;
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleanName)) {
      setError('El nombre de la tabla sólo puede contener letras, números y guiones bajos.');
      return;
    }

    if (columns.length === 0) {
      setError('Debe definir al menos una columna.');
      return;
    }

    // Validar nombres de columna únicos
    const names = new Set<string>();
    for (const col of columns) {
      const colName = col.name.trim().toLowerCase();
      if (!colName) {
        setError('Todas las columnas deben tener un nombre asignado.');
        return;
      }
      if (names.has(colName)) {
        setError(`El nombre de columna "${colName}" está duplicado.`);
        return;
      }
      names.add(colName);
    }

    setIsSubmitting(true);
    try {
      await updateEntity(projectId, entity.id, {
        table_name: cleanName,
        columns_json: columns.map((c) => ({
          name: c.name.trim().toLowerCase(),
          type: c.type,
          isPk: Boolean(c.isPk),
          is_pk: Boolean(c.isPk),
          isFk: Boolean(c.isFk),
          is_fk: Boolean(c.isFk),
          referencesTable: c.isFk ? c.referencesTable : undefined,
          references_table: c.isFk ? c.referencesTable : undefined,
          referencesColumn: c.isFk ? (c.referencesColumn || 'id') : undefined,
          references_column: c.isFk ? (c.referencesColumn || 'id') : undefined,
          cardinality: c.isFk ? (c.cardinality || '1:N') : undefined,
          nullable: c.isPk ? false : Boolean(c.nullable),
          unique: Boolean(c.unique),
        })),
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al modificar la tabla';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VisionModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Modificar Tabla: ${entity.table_name}`}
      description="Altera columnas, tipos de datos, restricciones de unicidad y cardinalidad de claves foráneas."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Nombre de la Tabla */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-secondary font-mono">Nombre de la Tabla (SQL)</label>
          <VisionInput
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            placeholder="ej. order_items"
            autoFocus
          />
        </div>

        {/* Editor de Columnas */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-secondary font-mono flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px] text-cyan-500 dark:text-cyan-400">table_rows</span>
              Columnas y Atributos ({columns.length})
            </label>
            <button
              type="button"
              onClick={handleAddColumn}
              className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 flex items-center gap-1 font-mono transition-colors"
            >
              <span className="material-symbols-outlined text-xs">add_circle</span>
              Añadir Columna
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {columns.map((col, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-[var(--glass-card)] border border-glass-subtle flex flex-col gap-2 transition-all hover:border-indigo-500/30"
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={col.name}
                      onChange={(e) => handleColumnChange(idx, 'name', e.target.value)}
                      placeholder="nombre_columna"
                      className="w-full text-xs font-mono bg-[var(--glass-input)] border border-glass-subtle rounded px-2 py-1 text-primary focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div className="w-36">
                    <select
                      value={col.type}
                      onChange={(e) => handleColumnChange(idx, 'type', e.target.value)}
                      className="w-full text-xs font-mono bg-[var(--glass-input)] border border-glass-subtle rounded px-2 py-1 text-cyan-600 dark:text-cyan-300 focus:outline-none focus:border-cyan-500/50"
                    >
                      {COMMON_DATA_TYPES.map((dt) => (
                        <option key={dt} value={dt} className="bg-slate-900 text-white dark:bg-slate-900">
                          {dt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Badges y Toggles */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <label className="flex items-center gap-1 cursor-pointer text-[10.5px] font-mono text-amber-400" title="Primary Key">
                      <input
                        type="checkbox"
                        checked={Boolean(col.isPk)}
                        onChange={(e) => handleColumnChange(idx, 'isPk', e.target.checked)}
                        className="rounded border-white/20 text-amber-500 focus:ring-0 bg-black/30"
                      />
                      <span>PK</span>
                    </label>

                    <label className="flex items-center gap-1 cursor-pointer text-[10.5px] font-mono text-cyan-400" title="Foreign Key">
                      <input
                        type="checkbox"
                        checked={Boolean(col.isFk)}
                        onChange={(e) => handleColumnChange(idx, 'isFk', e.target.checked)}
                        className="rounded border-white/20 text-cyan-500 focus:ring-0 bg-black/30"
                      />
                      <span>FK</span>
                    </label>

                    <label className="flex items-center gap-1 cursor-pointer text-[10.5px] font-mono text-muted" title="Permite valores nulos">
                      <input
                        type="checkbox"
                        checked={Boolean(col.nullable)}
                        disabled={Boolean(col.isPk)}
                        onChange={(e) => handleColumnChange(idx, 'nullable', e.target.checked)}
                        className="rounded border-white/20 text-indigo-500 focus:ring-0 bg-black/30"
                      />
                      <span>Null</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleRemoveColumn(idx)}
                      className="text-muted hover:text-rose-400 p-1 transition-colors"
                      title="Eliminar columna"
                    >
                      <span className="material-symbols-outlined text-[13px]">delete</span>
                    </button>
                  </div>
                </div>

                {/* Sub-fila de Configuración de Clave Foránea */}
                {col.isFk && (
                  <div className="pt-1.5 border-t border-white/[0.04] flex items-center gap-2 text-xs font-mono bg-cyan-950/20 p-1.5 rounded">
                    <span className="material-symbols-outlined text-[12px] text-cyan-400">link</span>
                    <span className="text-[10px] text-muted">Apunta a:</span>

                    <select
                      value={col.referencesTable || ''}
                      onChange={(e) => handleColumnChange(idx, 'referencesTable', e.target.value)}
                      className="text-[10.5px] font-mono bg-[var(--glass-input)] border border-glass-subtle rounded px-1.5 py-0.5 text-primary focus:outline-none"
                    >
                      <option value="">Selecciona tabla...</option>
                      {otherTables.map((t) => (
                        <option key={t.id} value={t.table_name} className="bg-slate-900 text-white dark:bg-slate-900">
                          {t.table_name}
                        </option>
                      ))}
                    </select>

                    <span className="text-[10px] text-muted">Cardinalidad:</span>
                    <select
                      value={col.cardinality || '1:N'}
                      onChange={(e) => handleColumnChange(idx, 'cardinality', e.target.value)}
                      className="text-[10.5px] font-mono bg-[var(--glass-input)] border border-glass-subtle rounded px-1.5 py-0.5 text-emerald-600 dark:text-emerald-400 focus:outline-none"
                    >
                      <option value="1:1" className="bg-slate-900 text-white dark:bg-slate-900">1:1 (Uno a Uno)</option>
                      <option value="1:N" className="bg-slate-900 text-white dark:bg-slate-900">1:N (Uno a Muchos)</option>
                      <option value="N:M" className="bg-slate-900 text-white dark:bg-slate-900">N:M (Muchos a Muchos)</option>
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-glass-subtle">
          <VisionButton type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </VisionButton>
          <VisionButton type="submit" variant="primary" isLoading={isSubmitting} icon="check">
            Guardar Cambios (ALTER)
          </VisionButton>
        </div>
      </form>
    </VisionModal>
  );
};
