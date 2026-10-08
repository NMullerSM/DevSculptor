import React, { useMemo } from 'react';
import { CanvasEntity } from '@/types/canvas.types';

interface BezierConnectorsProps {
  entities: CanvasEntity[];
  zoom?: number;
}

interface ConnectorLine {
  id: string;
  path: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isTargetOnRight: boolean;
  midX: number;
  midY: number;
  cardinality: '1:1' | '1:N' | 'N:M';
  sourceTable: string;
  targetTable: string;
  sDir: number;
  tDir: number;
}

export const BezierConnectors: React.FC<BezierConnectorsProps> = ({ entities }) => {
  const NODE_WIDTH = 220;
  const NODE_HEADER_HEIGHT = 32;
  const ROW_HEIGHT = 24;

  const lines = useMemo<ConnectorLine[]>(() => {
    const result: ConnectorLine[] = [];
    const entityMap = new Map<string, CanvasEntity>();
    entities.forEach((e) => entityMap.set(e.table_name.toLowerCase(), e));

    entities.forEach((source) => {
      if (!Array.isArray(source.columns_json)) return;

      source.columns_json.forEach((col, colIdx) => {
        const colRecord = col as unknown as Record<string, unknown>;
        let targetTable = (
          col.referencesTable ||
          col.references_table ||
          colRecord.references ||
          colRecord.targetTable ||
          colRecord.target_table ||
          colRecord.refTable
        ) as string | undefined;

        // Limpiar formato: remover comillas, acentos graves, espacios y posibles prefijos de schema (ej. public.orders -> orders)
        if (typeof targetTable === 'string') {
          targetTable = targetTable.replace(/["'`;]/g, '').trim().split('.').pop()?.toLowerCase();
        }

        // 1. Si no está explícito pero el tipo contiene FK → users o REFERENCES users
        if (!targetTable && col.type) {
          const matchFk = col.type.match(/FK →\s*([a-zA-Z0-9_]+)/i);
          const matchRef = col.type.match(/REFERENCES\s+([a-zA-Z0-9_]+)/i);
          if (matchFk) targetTable = matchFk[1].toLowerCase();
          else if (matchRef) targetTable = matchRef[1].toLowerCase();
        }

        // 2. Inferencia inteligente por convención de nombre de columna (ej. user_id -> users, order_id -> orders, dark_store_id -> dark_stores)
        if (!targetTable && col.name && col.name.endsWith('_id') && col.name.toLowerCase() !== 'id') {
          const baseName = col.name.slice(0, -3).toLowerCase();
          const pluralName = baseName.endsWith('s') ? baseName : `${baseName}s`;
          const esPluralName = `${baseName}es`;
          const iesPluralName = baseName.endsWith('y') ? `${baseName.slice(0, -1)}ies` : '';

          if (entityMap.has(pluralName)) {
            targetTable = pluralName;
          } else if (entityMap.has(baseName)) {
            targetTable = baseName;
          } else if (entityMap.has(esPluralName)) {
            targetTable = esPluralName;
          } else if (iesPluralName && entityMap.has(iesPluralName)) {
            targetTable = iesPluralName;
          } else if (['author_id', 'creator_id', 'owner_id', 'client_id', 'customer_id'].includes(col.name.toLowerCase()) && entityMap.has('users')) {
            targetTable = 'users';
          }
        }

        // 3. Normalización flexible singular/plural si targetTable difiere ligeramente del nombre en el canvas
        if (targetTable && !entityMap.has(targetTable)) {
          if (entityMap.has(`${targetTable}s`)) {
            targetTable = `${targetTable}s`;
          } else if (entityMap.has(`${targetTable}es`)) {
            targetTable = `${targetTable}es`;
          } else if (targetTable.endsWith('y') && entityMap.has(`${targetTable.slice(0, -1)}ies`)) {
            targetTable = `${targetTable.slice(0, -1)}ies`;
          } else if (targetTable.endsWith('ies') && entityMap.has(`${targetTable.slice(0, -3)}y`)) {
            targetTable = `${targetTable.slice(0, -3)}y`;
          } else if (targetTable.endsWith('s') && entityMap.has(targetTable.slice(0, -1))) {
            targetTable = targetTable.slice(0, -1);
          }
        }

        if (targetTable && entityMap.has(targetTable) && targetTable !== source.table_name.toLowerCase()) {
          const target = entityMap.get(targetTable)!;

          let startX: number;
          let endX: number;
          let cp1x: number;
          let cp2x: number;
          let isTargetOnRight: boolean;
          let sDir: number;
          let tDir: number;
          let midX: number;

          const startY = source.position_y + NODE_HEADER_HEIGHT + colIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
          const endY = target.position_y + NODE_HEADER_HEIGHT + ROW_HEIGHT / 2;

          const isVerticallyStacked = Math.abs(target.position_x - source.position_x) < 50;

          if (isVerticallyStacked) {
            // Conexión lateral por el borde derecho para nodos en la misma columna
            startX = source.position_x + NODE_WIDTH;
            endX = target.position_x + NODE_WIDTH;
            const curveOffset = 45;
            cp1x = startX + curveOffset;
            cp2x = endX + curveOffset;
            isTargetOnRight = true;
            sDir = 1;
            tDir = 1;
            midX = startX + curveOffset * 0.75;
          } else if (target.position_x >= source.position_x + 50) {
            // Destino está claramente a la derecha
            isTargetOnRight = true;
            startX = source.position_x + NODE_WIDTH;
            endX = target.position_x;
            const dx = Math.max(35, (endX - startX) * 0.5);
            cp1x = startX + dx;
            cp2x = endX - dx;
            sDir = 1;
            tDir = -1;
            midX = 0.125 * startX + 0.375 * cp1x + 0.375 * cp2x + 0.125 * endX;
          } else {
            // Destino está claramente a la izquierda
            isTargetOnRight = false;
            startX = source.position_x;
            endX = target.position_x + NODE_WIDTH;
            const dx = Math.max(35, (startX - endX) * 0.5);
            cp1x = startX - dx;
            cp2x = endX + dx;
            sDir = -1;
            tDir = 1;
            midX = 0.125 * startX + 0.375 * cp1x + 0.375 * cp2x + 0.125 * endX;
          }

          const pathD = `M ${startX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${endX} ${endY}`;
          const midY = 0.5 * startY + 0.5 * endY;

          result.push({
            id: `${source.id}-${col.name}-${target.id}`,
            path: pathD,
            startX,
            startY,
            endX,
            endY,
            isTargetOnRight,
            midX,
            midY,
            cardinality: (col.cardinality as '1:1' | '1:N' | 'N:M') || '1:N',
            sourceTable: source.table_name,
            targetTable: target.table_name,
            sDir,
            tDir,
          });
        }
      });
    });

    return result;
  }, [entities]);

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'visible',
      }}
    >
      <defs>
        <filter id="neon-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#38bdf8" floodOpacity="0.85" />
        </filter>
      </defs>

      {lines.map((line) => {
        const { startX, startY, endX, endY, cardinality, sDir, tDir } = line;

        // Determinar símbolos para cada extremo según la notación Crow's Foot (Pata de Gallo)
        const isSourceMany = cardinality === '1:N' || cardinality === 'N:M';
        const isTargetMany = cardinality === 'N:M';

        return (
          <g key={line.id} className="connector-group">
            {/* Trazo Curva Bézier */}
            <path
              d={line.path}
              className="bezier-connector"
              style={{ filter: 'url(#neon-glow)' }}
            />

            {/* Símbolo en el Extremo de Origen (Source / Clave Foránea) */}
            {isSourceMany ? (
              // Pata de Gallo (Crow's foot: 3 puntas divergentes hacia la tabla + barra perpendicular)
              <g stroke="#38bdf8" strokeWidth="1.5" fill="none" style={{ filter: 'url(#neon-glow)' }}>
                {/* Punta superior */}
                <line x1={startX} y1={startY - 7} x2={startX + 12 * sDir} y2={startY} />
                {/* Punta inferior */}
                <line x1={startX} y1={startY + 7} x2={startX + 12 * sDir} y2={startY} />
                {/* Barra vertical de obligatoriedad */}
                <line x1={startX + 6 * sDir} y1={startY - 6} x2={startX + 6 * sDir} y2={startY + 6} />
              </g>
            ) : (
              // Notación Uno (Dos barras verticales ||)
              <g stroke="#38bdf8" strokeWidth="1.5" fill="none" style={{ filter: 'url(#neon-glow)' }}>
                <line x1={startX + 5 * sDir} y1={startY - 7} x2={startX + 5 * sDir} y2={startY + 7} />
                <line x1={startX + 10 * sDir} y1={startY - 7} x2={startX + 10 * sDir} y2={startY + 7} />
              </g>
            )}

            {/* Símbolo en el Extremo de Destino (Target / Tabla Referenciada PK) */}
            {isTargetMany ? (
              // Pata de Gallo en destino (para relaciones N:M)
              <g stroke="#38bdf8" strokeWidth="1.5" fill="none" style={{ filter: 'url(#neon-glow)' }}>
                <line x1={endX} y1={endY - 7} x2={endX + 12 * tDir} y2={endY} />
                <line x1={endX} y1={endY + 7} x2={endX + 12 * tDir} y2={endY} />
                <line x1={endX + 6 * tDir} y1={endY - 6} x2={endX + 6 * tDir} y2={endY + 6} />
              </g>
            ) : (
              // Notación Uno (Dos barras verticales || para el lado 1)
              <g stroke="#38bdf8" strokeWidth="1.5" fill="none" style={{ filter: 'url(#neon-glow)' }}>
                <line x1={endX + 5 * tDir} y1={endY - 7} x2={endX + 5 * tDir} y2={endY + 7} />
                <line x1={endX + 10 * tDir} y1={endY - 7} x2={endX + 10 * tDir} y2={endY + 7} />
              </g>
            )}

            {/* Badge de Cardinalidad Flotante en el Punto Medio */}
            <g transform={`translate(${line.midX}, ${line.midY})`}>
              {/* Fondo del badge */}
              <rect
                x="-19"
                y="-11"
                width="38"
                height="22"
                rx="11"
                className="fill-white dark:fill-[#080c14] stroke-[#0284c7] dark:stroke-[#38bdf8] shadow-xl"
                strokeWidth="1.3"
              />
              {/* Texto de la cardinalidad (1:1, 1:N, N:M) */}
              <text
                x="0"
                y="4"
                textAnchor="middle"
                className="fill-[#0284c7] dark:fill-[#38bdf8]"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {line.cardinality}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};
