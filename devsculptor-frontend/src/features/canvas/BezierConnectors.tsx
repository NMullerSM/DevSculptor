import React, { useMemo } from 'react';
import { CanvasEntity } from '@/types/canvas.types';

interface BezierConnectorsProps {
  entities: CanvasEntity[];
  zoom: number;
}

export const BezierConnectors: React.FC<BezierConnectorsProps> = ({ entities }) => {
  const NODE_WIDTH = 220;
  const NODE_HEADER_HEIGHT = 28;
  const ROW_HEIGHT = 22;

  const lines = useMemo(() => {
    const result: { id: string; path: string }[] = [];
    const entityMap = new Map<string, CanvasEntity>();
    entities.forEach((e) => entityMap.set(e.table_name, e));

    entities.forEach((source) => {
      if (!Array.isArray(source.columns_json)) return;

      source.columns_json.forEach((col, colIdx) => {
        let targetTable = col.referencesTable;

        // Si no está explícito pero el tipo contiene FK -> users
        if (!targetTable && col.type && col.type.includes('FK →')) {
          const match = col.type.match(/FK →\s*([a-zA-Z0-9_]+)/);
          if (match) targetTable = match[1];
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
          result.push({
            id: `${source.id}-${col.name}-${target.id}`,
            path: pathD,
          });
        }
      });
    });

    return result;
  }, [entities]);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <defs>
        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.8" />
        </filter>
      </defs>
      {lines.map((line) => (
        <path
          key={line.id}
          d={line.path}
          className="bezier-connector"
          style={{ filter: 'url(#neon-glow)' }}
        />
      ))}
    </svg>
  );
};
