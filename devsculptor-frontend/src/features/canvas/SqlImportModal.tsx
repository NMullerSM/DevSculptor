import React, { useState } from 'react';
import { VisionModal } from '@/components/ui/VisionModal';
import { VisionButton } from '@/components/ui/VisionButton';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { CanvasColumn } from '@/types/canvas.types';

interface SqlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

interface ParsedTable {
  tableName: string;
  columns: CanvasColumn[];
}

const SAMPLE_SQL = `-- Ejemplo de DDL para importar a DevSculptor
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL,
  order_number VARCHAR(50) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL,
  product_name VARCHAR(150) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
`;

export const SqlImportModal: React.FC<SqlImportModalProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const { createEntity, entities } = useCanvasStore();
  const [sqlContent, setSqlContent] = useState(SAMPLE_SQL);
  const [error, setError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ParsedTable[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Parser regex de DDL tolerante a fallos
  const parseSql = (sql: string): ParsedTable[] => {
    const tables: ParsedTable[] = [];
    // Limpiar comentarios de bloque y de línea
    const cleanSql = sql
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/--.*$/gm, '');

    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?([a-zA-Z0-9_]+)["`]?\s*\(([\s\S]*?)\)\s*;/gi;
    let match;

    while ((match = createTableRegex.exec(cleanSql)) !== null) {
      const rawTableName = match[1].toLowerCase().trim();
      const body = match[2];

      const columns: CanvasColumn[] = [];
      const lines = body.split(',').map((l) => l.trim()).filter(Boolean);

      const fks: { col: string; refTable: string; refCol: string }[] = [];

      lines.forEach((line) => {
        // Detectar FOREIGN KEY (col) REFERENCES refTable(refCol)
        const fkMatch = line.match(/FOREIGN\s+KEY\s*\(["`]?([a-zA-Z0-9_]+)["`]?\)\s+REFERENCES\s+["`]?([a-zA-Z0-9_]+)["`]?\s*(?:\(["`]?([a-zA-Z0-9_]+)["`]?\))?/i);
        if (fkMatch) {
          fks.push({
            col: fkMatch[1].toLowerCase(),
            refTable: fkMatch[2].toLowerCase(),
            refCol: (fkMatch[3] || 'id').toLowerCase(),
          });
          return;
        }

        // Detectar PRIMARY KEY (col1, col2)
        if (/PRIMARY\s+KEY\s*\(/i.test(line)) {
          return; // saltar definición separada por ahora
        }

        // Columna regular: name TYPE [PRIMARY KEY] [NOT NULL] [UNIQUE] [REFERENCES table(col)]
        const colTokens = line.split(/\s+/);
        if (colTokens.length < 2) return;

        const colName = colTokens[0].replace(/["`]/g, '').toLowerCase();
        // Ignore keywords
        if (['constraint', 'primary', 'foreign', 'unique', 'check'].includes(colName)) return;

        const colType = colTokens[1].toUpperCase();
        const upperLine = line.toUpperCase();

        const isPk = upperLine.includes('PRIMARY KEY');
        const isUnique = upperLine.includes('UNIQUE') && !isPk;
        const nullable = !isPk && !upperLine.includes('NOT NULL');

        let referencesTable: string | undefined;
        let referencesColumn: string | undefined;
        let isFk = false;

        const inlineRef = line.match(/REFERENCES\s+["`]?([a-zA-Z0-9_]+)["`]?\s*(?:\(["`]?([a-zA-Z0-9_]+)["`]?\))?/i);
        if (inlineRef) {
          isFk = true;
          referencesTable = inlineRef[1].toLowerCase();
          referencesColumn = (inlineRef[2] || 'id').toLowerCase();
        }

        columns.push({
          name: colName,
          type: colType,
          isPk,
          is_pk: isPk,
          isFk,
          is_fk: isFk,
          referencesTable,
          references_table: referencesTable,
          referencesColumn,
          references_column: referencesColumn,
          cardinality: isFk ? '1:N' : undefined,
          nullable,
          unique: isUnique,
        });
      });

      // Asociar FKs separadas a las columnas correspondientes
      fks.forEach((fk) => {
        const found = columns.find((c) => c.name === fk.col);
        if (found) {
          found.isFk = true;
          found.is_fk = true;
          found.referencesTable = fk.refTable;
          found.references_table = fk.refTable;
          found.referencesColumn = fk.refCol;
          found.references_column = fk.refCol;
          found.cardinality = '1:N';
        }
      });

      if (columns.length > 0) {
        tables.push({
          tableName: rawTableName,
          columns,
        });
      }
    }

    return tables;
  };

  const handlePreview = () => {
    setError(null);
    try {
      const parsed = parseSql(sqlContent);
      if (parsed.length === 0) {
        setError('No se encontraron sentencias CREATE TABLE válidas en el script ingresado.');
        setParsedPreview([]);
        return;
      }
      setParsedPreview(parsed);
    } catch {
      setError('Error al analizar la sintaxis del script SQL.');
    }
  };

  const handleImport = async () => {
    if (parsedPreview.length === 0) {
      handlePreview();
      return;
    }

    setIsImporting(true);
    setError(null);

    const existingNames = new Set(entities.map((e) => e.table_name.toLowerCase()));
    let successCount = 0;

    try {
      for (let i = 0; i < parsedPreview.length; i++) {
        const item = parsedPreview[i];
        if (existingNames.has(item.tableName.toLowerCase())) {
          continue; // evitar conflicto con tablas existentes
        }

        const posX = 60 + (i % 3) * 280;
        const posY = 80 + Math.floor(i / 3) * 240;

        await createEntity(projectId, {
          table_name: item.tableName,
          columns_json: item.columns,
          position_x: posX,
          position_y: posY,
        });
        successCount++;
      }

      onClose();
      setParsedPreview([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al importar tablas al Canvas';
      setError(`Se importaron ${successCount} tablas antes de un error: ${msg}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <VisionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Importador de Scripts SQL (Reverse Engineering)"
      description="Pega sentencias CREATE TABLE para convertirlas automáticamente en entidades y relaciones visuales."
      size="lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono text-secondary">Sentencias SQL DDL</label>
            <button
              onClick={() => setSqlContent(SAMPLE_SQL)}
              className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors"
            >
              Cargar Ejemplo
            </button>
          </div>
          <textarea
            value={sqlContent}
            onChange={(e) => {
              setSqlContent(e.target.value);
              setParsedPreview([]);
            }}
            rows={10}
            className="w-full text-xs font-mono bg-[var(--glass-input)] border border-[var(--border-glass-subtle)] rounded-lg p-3 text-primary focus:outline-none focus:border-cyan-500/50 resize-none custom-scrollbar leading-relaxed"
            placeholder="CREATE TABLE ..."
          />
        </div>

        {/* Previsualización de Tablas Detectadas */}
        {parsedPreview.length > 0 && (
          <div className="p-3 rounded-lg bg-[var(--glass-card)] border border-[var(--border-glass-subtle)] space-y-2">
            <div className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">task_alt</span>
              <span>{parsedPreview.length} tablas detectadas y listas para importar:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {parsedPreview.map((pt, i) => (
                <div key={i} className="p-2 rounded bg-[var(--glass-input)] border border-[var(--border-glass-subtle)] text-[11px] font-mono">
                  <div className="text-primary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-cyan-600 dark:text-cyan-400">table_chart</span>
                    <span>{pt.tableName}</span>
                  </div>
                  <div className="text-muted text-[9.5px]">
                    {pt.columns.length} cols · {pt.columns.filter((c) => c.isFk).length} FKs
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
          <VisionButton variant="secondary" onClick={onClose} disabled={isImporting}>
            Cancelar
          </VisionButton>
          {parsedPreview.length === 0 ? (
            <VisionButton variant="primary" icon="search" onClick={handlePreview}>
              Analizar Script
            </VisionButton>
          ) : (
            <VisionButton
              variant="primary"
              icon="system_update_alt"
              isLoading={isImporting}
              onClick={handleImport}
            >
              Importar al Lienzo ({parsedPreview.length})
            </VisionButton>
          )}
        </div>
      </div>
    </VisionModal>
  );
};
