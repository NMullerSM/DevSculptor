import React, { useMemo } from 'react';
import { CanvasEntity } from '@/types/canvas.types';

interface BezierConnectorsProps {
  entities: CanvasEntity[];
  zoom: number;
}

interface ConnectorLine {
  id: string;
  path: string;
  midX: number;
  midY: number;
  cardinality: string;
  sourceTable: string;
  targetTable: string;
}

export const BezierConnectors: React.FC<BezierConnectorsProps> = ({ entities, zoom }) => {
  const NODE_WIDTH = 220;
  const NODE_HEADER_HEIGHT = 28;
  const ROW_HEIGHT = 22;

  const lines = useMemo<ConnectorLine[]>(() => {
    const result: ConnectorLine[] = [];
    const entityMap = new Map<string, CanvasEntity>();
    entities.forEach((e) => entityMap.set(e.table_name.toLowerCase(), e));

    entities.forEach((source) => {
      if (!Array.isArray(source.columns_json)) return;

      source.columns_json.forEach((col, colIdx) => {
        let targetTable = (col.referencesTable || col.references_table)?.toLowerCase();

        // Si no está explícito pero el tipo contiene FK -> users
        if (!targetTable && col.type && col.type.includes('FK →')) {
          const match = col.type.match(/FK →\s*([a-zA-Z0-9_]+)/);
          if (match) targetTable = match[1].toLowerCase();
        }

        if (targetTable && entityMap.has(targetTable)) {
          const target = entityMap.get(targetTable)!;

          // Coordenadas de salida del puerto izquierdo o derecho
          const isTargetOnRight = target.position_x > source.position_x;

          const startX = isTargetOnRight
            ? source.position_x + NODE_WIDTH
            : source.position_x;
          const startY = source.position_y + NODE_HEADER_HEIGHT + colIdx * ROW_HEIGHT + ROW_HEIGHT / 2;

          const endX = isTargetOnRight ? target.position_x : target.position_x + NODE_WIDTH;
          const endY = target.position_y + NODE_HEADER_HEIGHT + ROW_HEIGHT / 2;

          const dx = Math.abs(endX - startX) * 0.5;
          const cp1x = isTargetOnRight ? startX + dx : startX - dx;
          const cp2x = isTargetOnRight ? endX - dx : endX + dx;

          const pathD = `M ${startX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${endX} ${endY}`;

          // Punto medio de la curva Bézier cúbica en t = 0.5
          const midX = 0.125 * startX + 0.375 * cp1x + 0.375 * cp2x + 0.125 * endX;
          const midY = 0.5 * startY + 0.5 * endY;

          result.push({
            id: `${source.id}-${col.name}-${target.id}`,
            path: pathD,
            midX,
            midY,
            cardinality: col.cardinality || '1:N',
            sourceTable: source.table_name,
            targetTable: target.table_name,
          });
        }
      });
    });

    return result;
  }, [entities]);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-0 origin-top-left"
      style={{
        transform: `scale(${zoom})`,
        transformOrigin: '0 0',
      }}
    >
      <defs>
        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.8" />
        </filter>
      </defs>

      {lines.map((line) => (
        <g key={line.id} className="connector-group">
          {/* Sombra y trazo de curva Bézier */}
          <path
            d={line.path}
            className="bezier-connector"
            style={{ filter: 'url(#neon-glow)' }}
          />

          {/* Badge de Cardinalidad Flotante en el Punto Medio */}
          <g transform={`translate(${line.midX}, ${line.midY})`}>
            {/* Fondo del badge */}
            <rect
              x="-18"
              y="-10"
              width="36"
              height="20"
              rx="10"
              fill="#080c14"
              stroke="#38bdf8"
              strokeWidth="1.2"
              className="shadow-lg"
            />
            {/* Texto de la cardinalidad (1:1, 1:N, N:M) */}
            <text
              x="0"
              y="3.5"
              textAnchor="middle"
              fill="#38bdf8"
              fontSize="9.5"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {line.cardinality}
            </text>
          </g>
        </g>
      ))}
    </svg>
  );
};
