import { PositionedNode } from '../layout/layeredLayout';
import { DiagramEdge } from '../diagram.types';

export interface CurveGeometry {
  pathD: string;
  midX: number;
  midY: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export type ReachMode = 'downstream' | 'upstream' | 'both';

export interface ReachResult {
  nodeIds: Set<string>;
  edgeIds: Set<string>;
}

/**
 * Calcula la curva Bézier cúbica óptima entre dos nodos posicionados.
 * Maneja tanto conexiones hacia adelante como conexiones en la misma columna o hacia atrás.
 */
export function getEdgeGeometry(
  source: PositionedNode,
  target: PositionedNode
): CurveGeometry {
  const isSelf = source.id === target.id;

  if (isSelf) {
    // Loopback auto-referencial
    const startX = source.x + source.width * 0.7;
    const startY = source.y;
    const endX = source.x + source.width;
    const endY = source.y + source.height * 0.5;
    const pathD = `M ${startX} ${startY} C ${startX} ${startY - 40}, ${endX + 40} ${startY - 20}, ${endX} ${endY}`;
    return {
      pathD,
      midX: startX + 30,
      midY: startY - 25,
      startX,
      startY,
      endX,
      endY,
    };
  }

  const isForward = target.x > source.x;
  const isSameColumn = Math.abs(target.x - source.x) < 10;

  if (isForward) {
    // Flujo normal izquierda a derecha
    const startX = source.x + source.width;
    const startY = source.y + source.height / 2;
    const endX = target.x;
    const endY = target.y + target.height / 2;

    const dx = Math.max(40, (endX - startX) * 0.5);
    const cp1x = startX + dx;
    const cp1y = startY;
    const cp2x = endX - dx;
    const cp2y = endY;

    const pathD = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
    return {
      pathD,
      midX: (startX + endX) / 2,
      midY: (startY + endY) / 2,
      startX,
      startY,
      endX,
      endY,
    };
  }

  if (isSameColumn) {
    // Misma columna (vertical)
    const isDownwards = target.y > source.y;
    const startX = source.x + source.width * 0.85;
    const startY = isDownwards ? source.y + source.height : source.y;
    const endX = target.x + target.width * 0.85;
    const endY = isDownwards ? target.y : target.y + target.height;

    const offset = 45;
    const cp1x = startX + offset;
    const cp1y = startY + (isDownwards ? 25 : -25);
    const cp2x = endX + offset;
    const cp2y = endY + (isDownwards ? -25 : 25);

    const pathD = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
    return {
      pathD,
      midX: Math.max(startX, endX) + offset,
      midY: (startY + endY) / 2,
      startX,
      startY,
      endX,
      endY,
    };
  }

  // Flujo hacia atrás (feedback loop de derecha a izquierda)
  const isAbove = target.y < source.y;
  const startX = source.x + source.width / 2;
  const startY = isAbove ? source.y : source.y + source.height;
  const endX = target.x + target.width / 2;
  const endY = isAbove ? target.y + target.height : target.y;

  const yCurveOffset = isAbove ? -55 : 55;
  const cp1x = startX;
  const cp1y = startY + yCurveOffset;
  const cp2x = endX;
  const cp2y = endY + yCurveOffset;

  const pathD = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  return {
    pathD,
    midX: (startX + endX) / 2,
    midY: (startY + endY) / 2 + yCurveOffset * 0.6,
    startX,
    startY,
    endX,
    endY,
  };
}

/**
 * Calcula el alcance (reach) de un nodo en el grafo mediante búsqueda en anchura (BFS).
 * Permite aislar y resaltar dependientes (downstream), proveedores (upstream) o ambos.
 */
export function computeReach(
  startNodeId: string,
  edges: DiagramEdge[],
  mode: ReachMode = 'both'
): ReachResult {
  const nodeIds = new Set<string>([startNodeId]);
  const edgeIds = new Set<string>();

  // Downstream (hacia adelante)
  if (mode === 'downstream' || mode === 'both') {
    const queue = [startNodeId];
    const visited = new Set<string>([startNodeId]);

    while (queue.length > 0) {
      const current = queue.shift()!;
      edges.forEach((edge) => {
        if (edge.from === current) {
          edgeIds.add(edge.id);
          nodeIds.add(edge.to);
          if (!visited.has(edge.to)) {
            visited.add(edge.to);
            queue.push(edge.to);
          }
        }
      });
    }
  }

  // Upstream (hacia atrás)
  if (mode === 'upstream' || mode === 'both') {
    const queue = [startNodeId];
    const visited = new Set<string>([startNodeId]);

    while (queue.length > 0) {
      const current = queue.shift()!;
      edges.forEach((edge) => {
        if (edge.to === current) {
          edgeIds.add(edge.id);
          nodeIds.add(edge.from);
          if (!visited.has(edge.from)) {
            visited.add(edge.from);
            queue.push(edge.from);
          }
        }
      });
    }
  }

  return { nodeIds, edgeIds };
}
