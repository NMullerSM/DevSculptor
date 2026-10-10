import { DiagramNode, DiagramEdge } from '../diagram.types';

export interface PositionedNode extends DiagramNode {
  x: number;
  y: number;
  width: number;
  height: number;
  layer: number;
}

export interface LayoutBounds {
  width: number;
  height: number;
  layerCount: number;
}

export interface LayeredLayoutResult {
  nodes: PositionedNode[];
  nodeMap: Map<string, PositionedNode>;
  bounds: LayoutBounds;
}

export interface LayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  horizontalSpacing?: number;
  verticalSpacing?: number;
  padding?: number;
}

/**
 * Computa el layout por capas (tipo Sugiyama / Kahn) para grafos dirigidos.
 * Asigna capas deterministas, centra las columnas verticalmente y produce
 * coordenadas óptimas para renderizado SVG de alta legibilidad.
 */
export function computeLayeredLayout(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  options: LayoutOptions = {}
): LayeredLayoutResult {
  const nodeWidth = options.nodeWidth ?? 230;
  const nodeHeight = options.nodeHeight ?? 115;
  const horizontalSpacing = options.horizontalSpacing ?? 130;
  const verticalSpacing = options.verticalSpacing ?? 36;
  const padding = options.padding ?? 50;

  if (nodes.length === 0) {
    return {
      nodes: [],
      nodeMap: new Map(),
      bounds: { width: 400, height: 300, layerCount: 0 },
    };
  }

  // 1. Mapa de nodos por ID
  const rawNodeMap = new Map<string, DiagramNode>();
  nodes.forEach((n) => rawNodeMap.set(n.id, n));

  // 2. Grado de entrada y lista de adyacencia
  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  const revAdj = new Map<string, string[]>();

  nodes.forEach((n) => {
    inDegree.set(n.id, 0);
    outDegree.set(n.id, 0);
    adj.set(n.id, []);
    revAdj.set(n.id, []);
  });

  edges.forEach((edge) => {
    if (rawNodeMap.has(edge.from) && rawNodeMap.has(edge.to) && edge.from !== edge.to) {
      adj.get(edge.from)?.push(edge.to);
      revAdj.get(edge.to)?.push(edge.from);
      inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
      outDegree.set(edge.from, (outDegree.get(edge.from) ?? 0) + 1);
    }
  });

  // 3. Asignación de capa (Layer assignment)
  const nodeLayer = new Map<string, number>();

  // Si el nodo tiene capa explícita, respetarla
  nodes.forEach((n) => {
    if (typeof n.layer === 'number') {
      nodeLayer.set(n.id, n.layer);
    }
  });

  // Nodos raíz (inDegree === 0) que no tengan capa asignada van a capa 0
  const queue: string[] = [];
  nodes.forEach((n) => {
    if (!nodeLayer.has(n.id) && (inDegree.get(n.id) ?? 0) === 0) {
      nodeLayer.set(n.id, 0);
      queue.push(n.id);
    }
  });

  // Si no hay nodos con inDegree 0 (ciclos cerrados), toma el primero sin capa
  if (queue.length === 0) {
    const unassigned = nodes.filter((n) => !nodeLayer.has(n.id));
    if (unassigned.length > 0) {
      nodeLayer.set(unassigned[0].id, 0);
      queue.push(unassigned[0].id);
    }
  }

  // BFS / Topological forward relaxation
  const visited = new Set<string>();
  while (queue.length > 0) {
    const curr = queue.shift()!;
    visited.add(curr);
    const currL = nodeLayer.get(curr) ?? 0;

    const neighbors = adj.get(curr) ?? [];
    for (const next of neighbors) {
      const nextExplicit = rawNodeMap.get(next)?.layer;
      if (typeof nextExplicit === 'number') {
        nodeLayer.set(next, nextExplicit);
      } else {
        const existingNextL = nodeLayer.get(next) ?? 0;
        const proposed = Math.max(existingNextL, currL + 1);
        nodeLayer.set(next, proposed);
      }
      if (!visited.has(next) && !queue.includes(next)) {
        queue.push(next);
      }
    }
  }

  // Asignar cualquier nodo residual que no haya sido visitado (islas disjuntas)
  nodes.forEach((n) => {
    if (!nodeLayer.has(n.id)) {
      nodeLayer.set(n.id, 0);
    }
  });

  // 4. Agrupar nodos por capa
  const layerBuckets = new Map<number, DiagramNode[]>();
  nodes.forEach((n) => {
    const l = nodeLayer.get(n.id) ?? 0;
    if (!layerBuckets.has(l)) {
      layerBuckets.set(l, []);
    }
    layerBuckets.get(l)!.push(n);
  });

  const sortedLayerIndices = Array.from(layerBuckets.keys()).sort((a, b) => a - b);

  // Normalizar índices de capa a 0..K-1
  const normalizedLayerMap = new Map<number, number>();
  sortedLayerIndices.forEach((orig, idx) => {
    normalizedLayerMap.set(orig, idx);
  });

  // 5. Ordenar dentro de cada capa: agrupar por categoría/group para coherencia visual
  const groupOrder: Record<DiagramNode['group'], number> = {
    client: 0,
    frontend: 1,
    security: 2,
    backend: 3,
    ai: 4,
    governance: 5,
    database: 6,
    external: 7,
  };

  const layersArray: DiagramNode[][] = [];
  sortedLayerIndices.forEach((orig) => {
    const bucket = layerBuckets.get(orig) ?? [];
    bucket.sort((a, b) => {
      const orderA = groupOrder[a.group] ?? 99;
      const orderB = groupOrder[b.group] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.label.localeCompare(b.label);
    });
    layersArray.push(bucket);
  });

  // 6. Calcular altura máxima para centrar verticalmente cada columna
  let maxColumnHeight = 0;
  layersArray.forEach((layerNodes) => {
    const colHeight = layerNodes.length * nodeHeight + Math.max(0, layerNodes.length - 1) * verticalSpacing;
    if (colHeight > maxColumnHeight) {
      maxColumnHeight = colHeight;
    }
  });

  // 7. Calcular coordenadas absolutas
  const positionedNodes: PositionedNode[] = [];
  const nodePositionMap = new Map<string, PositionedNode>();

  layersArray.forEach((layerNodes, layerIndex) => {
    const colX = padding + layerIndex * (nodeWidth + horizontalSpacing);
    const colHeight = layerNodes.length * nodeHeight + Math.max(0, layerNodes.length - 1) * verticalSpacing;
    const startY = padding + (maxColumnHeight - colHeight) / 2;

    layerNodes.forEach((node, nodeIdxInLayer) => {
      const nodeY = startY + nodeIdxInLayer * (nodeHeight + verticalSpacing);
      const positioned: PositionedNode = {
        ...node,
        x: colX,
        y: nodeY,
        width: nodeWidth,
        height: nodeHeight,
        layer: layerIndex,
      };
      positionedNodes.push(positioned);
      nodePositionMap.set(node.id, positioned);
    });
  });

  const totalWidth = padding * 2 + layersArray.length * nodeWidth + Math.max(0, layersArray.length - 1) * horizontalSpacing;
  const totalHeight = padding * 2 + maxColumnHeight;

  return {
    nodes: positionedNodes,
    nodeMap: nodePositionMap,
    bounds: {
      width: Math.max(totalWidth, 600),
      height: Math.max(totalHeight, 400),
      layerCount: layersArray.length,
    },
  };
}
