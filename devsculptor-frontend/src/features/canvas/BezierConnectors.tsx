import React, { useMemo } from 'react';
import { CanvasEntity } from '@/types/canvas.types';

interface BezierConnectorsProps {
  entities: CanvasEntity[];
  zoom: number;
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
        <filter id="neon-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#38bdf8" floodOpacity="0.85" />
        </filter>
      </defs>

      {lines.map((line) => {
        const { startX, startY, endX, endY, isTargetOnRight, cardinality } = line;

        // Determinar símbolos para cada extremo según la notación Crow's Foot (Pata de Gallo)
        const isSourceMany = cardinality === '1:N' || cardinality === 'N:M';
        const isTargetMany = cardinality === 'N:M';

        // Desplazamiento horizontal según la dirección del conector
        const sDir = isTargetOnRight ? 1 : -1;
        const tDir = isTargetOnRight ? -1 : 1;

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
                fill="#080c14"
                stroke="#38bdf8"
                strokeWidth="1.3"
                className="shadow-xl"
              />
              {/* Texto de la cardinalidad (1:1, 1:N, N:M) */}
              <text
                x="0"
                y="4"
                textAnchor="middle"
                fill="#38bdf8"
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
