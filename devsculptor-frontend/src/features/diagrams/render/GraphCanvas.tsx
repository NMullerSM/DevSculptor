import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { GraphSpec } from '../diagram.types';
import { computeLayeredLayout } from '../layout/layeredLayout';
import { getEdgeGeometry, computeReach, ReachMode } from '../geometry/graphGeometry';
import {
  getGroupThemes,
  getEdgeStyles,
  getCanvasTokens,
  STATUS_COLORS,
} from '../diagramTheme';
import { useThemeStore } from '@/stores/useThemeStore';

interface GraphCanvasProps {
  spec: GraphSpec;
  onExportSvgRef?: (svg: SVGSVGElement | null) => void;
  className?: string;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  spec,
  onExportSvgRef,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Tema activo del sistema (dark / light)
  const currentTheme = useThemeStore((s) => s.theme);
  const isDark = currentTheme === 'dark';

  const groupThemes = useMemo(() => getGroupThemes(currentTheme), [currentTheme]);
  const edgeStyles = useMemo(() => getEdgeStyles(currentTheme), [currentTheme]);
  const tokens = useMemo(() => getCanvasTokens(currentTheme), [currentTheme]);

  // Estados de transformación (Pan & Zoom)
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 30, y: 30 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Selección y resaltado de alcance (Reach)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [reachMode, setReachMode] = useState<ReachMode>('both');
  const [showLegend, setShowLegend] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);

  // Computar Layout
  const layout = useMemo(() => {
    return computeLayeredLayout(spec.nodes, spec.edges);
  }, [spec.nodes, spec.edges]);

  // Exponer referencia al SVG para exportación limpia
  useEffect(() => {
    if (onExportSvgRef) {
      onExportSvgRef(svgRef.current);
    }
  }, [onExportSvgRef, layout]);

  // Listener no pasivo para zoom con rueda del mouse
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoom((prevZoom) => {
        const next = prevZoom * zoomFactor;
        return Math.min(Math.max(next, 0.3), 3.0);
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Manejo de Pan (arrastrar)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Restablecer vista
  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 30, y: 30 });
  }, []);

  // Ajustar a la pantalla (Fit view)
  const handleFitView = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const scaleX = (clientWidth - 80) / layout.bounds.width;
    const scaleY = (clientHeight - 80) / layout.bounds.height;
    const fitZoom = Math.min(scaleX, scaleY, 1.2);
    setZoom(Math.max(fitZoom, 0.4));
    setPan({
      x: Math.max(20, (clientWidth - layout.bounds.width * fitZoom) / 2),
      y: Math.max(20, (clientHeight - layout.bounds.height * fitZoom) / 2),
    });
  }, [layout.bounds]);

  useEffect(() => {
    handleFitView();
  }, [spec.id, handleFitView]);

  // Cálculo de alcance para el nodo enfocado
  const activeFocusId = selectedNodeId || hoveredNodeId;

  const reach = useMemo(() => {
    if (!activeFocusId) return null;
    return computeReach(activeFocusId, spec.edges, reachMode);
  }, [activeFocusId, spec.edges, reachMode]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return layout.nodeMap.get(selectedNodeId) || null;
  }, [selectedNodeId, layout.nodeMap]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none overflow-hidden transition-colors duration-200 cursor-grab ${
        isDragging ? 'cursor-grabbing' : ''
      } ${className}`}
      style={{ backgroundColor: tokens.canvasBg }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Fondo de Cuadrícula Sutil Adaptativo */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle, ${tokens.gridDot} 1.2px, transparent 1.2px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {/* SVG Canvas Principal */}
      <svg
        ref={svgRef}
        className="w-full h-full overflow-visible"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.08s ease-out',
        }}
        width={layout.bounds.width}
        height={layout.bounds.height}
        viewBox={`0 0 ${layout.bounds.width} ${layout.bounds.height}`}
      >
        <defs>
          {/* Marcadores de flechas */}
          <marker
            id="arrow-default"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill={edgeStyles.default.stroke} />
          </marker>
          <marker
            id="arrow-accent"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill={edgeStyles.accent.stroke} />
          </marker>
          <marker
            id="arrow-warning"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
          </marker>
          <marker
            id="arrow-success"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
          </marker>

          {/* Filtro de resplandor (Glow) */}
          <filter id="node-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="6"
              floodColor={isDark ? '#6366f1' : '#4f46e5'}
              floodOpacity={isDark ? '0.45' : '0.35'}
            />
          </filter>
        </defs>

        {/* 1. RENDERIZADO DE BORDES (EDGES) */}
        <g className="diagram-edges">
          {spec.edges.map((edge) => {
            const source = layout.nodeMap.get(edge.from);
            const target = layout.nodeMap.get(edge.to);
            if (!source || !target) return null;

            const geo = getEdgeGeometry(source, target);
            const edgeStyle = edgeStyles[edge.variant || 'default'];

            const isEdgeReachable = reach ? reach.edgeIds.has(edge.id) : true;
            const isEdgeDimmed = reach && !isEdgeReachable;
            const isHighlighted = reach && isEdgeReachable;

            const strokeColor = isHighlighted ? (isDark ? '#38bdf8' : '#0284c7') : edgeStyle.stroke;
            const strokeWidth = isHighlighted ? 2.8 : edgeStyle.strokeWidth;
            const markerId = isHighlighted
              ? 'url(#arrow-accent)'
              : edge.variant === 'warning'
              ? 'url(#arrow-warning)'
              : edge.variant === 'success'
              ? 'url(#arrow-success)'
              : 'url(#arrow-default)';

            return (
              <g
                key={edge.id}
                className="transition-opacity duration-200"
                style={{ opacity: isEdgeDimmed ? 0.12 : 1 }}
              >
                {/* Línea de fondo para hit testing */}
                <path
                  d={geo.pathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="14"
                  className="cursor-pointer"
                />

                {/* Trazo visual de la curva Bézier */}
                <path
                  d={geo.pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={edgeStyle.strokeDasharray}
                  markerEnd={markerId}
                />

                {/* Pulso de partícula animada */}
                {edge.animated !== false && !isEdgeDimmed && (
                  <circle
                    r={isHighlighted ? 4.5 : 3.5}
                    fill={isHighlighted ? (isDark ? '#38bdf8' : '#0284c7') : edgeStyle.particleFill}
                  >
                    <animateMotion
                      path={geo.pathD}
                      dur={isHighlighted ? '2.0s' : '3.2s'}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Etiqueta de Protocolo / Flujo */}
                {(edge.label || edge.protocol) && (
                  <g
                    transform={`translate(${geo.midX}, ${geo.midY})`}
                    className="pointer-events-none select-none"
                  >
                    <rect
                      x="-55"
                      y="-11"
                      width="110"
                      height="22"
                      rx="4"
                      fill={tokens.protocolBadgeBg}
                      stroke={isHighlighted ? (isDark ? '#38bdf8' : '#0284c7') : tokens.protocolBadgeBorder}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill={isHighlighted ? (isDark ? '#e0f2fe' : '#0284c7') : tokens.protocolBadgeText}
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="500"
                    >
                      {edge.protocol || edge.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* 2. RENDERIZADO DE NODOS */}
        <g className="diagram-nodes">
          {layout.nodes.map((node) => {
            const theme = groupThemes[node.group] || groupThemes.backend;
            const statusCfg = STATUS_COLORS[node.status || 'ok'];

            const isNodeSelected = selectedNodeId === node.id;
            const isNodeReachable = reach ? reach.nodeIds.has(node.id) : true;
            const isNodeDimmed = reach && !isNodeReachable;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer transition-opacity duration-200"
                style={{ opacity: isNodeDimmed ? 0.18 : 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNodeId((prev) => {
                    const next = prev === node.id ? null : node.id;
                    if (next) setIsInspectorOpen(true);
                    return next;
                  });
                }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
              >
                {/* Tarjeta del Nodo */}
                <rect
                  width={node.width}
                  height={node.height}
                  rx="10"
                  fill={tokens.nodeCardFill}
                  stroke={isNodeSelected ? (isDark ? '#38bdf8' : '#0284c7') : theme.border}
                  strokeWidth={isNodeSelected ? '2.5' : '1.5'}
                  filter={isNodeSelected ? 'url(#node-glow)' : undefined}
                />

                {/* Barra de cabecera coloreada */}
                <path
                  d={`M 0 10 Q 0 0 10 0 L ${node.width - 10} 0 Q ${node.width} 0 ${node.width} 10 L ${node.width} 28 L 0 28 Z`}
                  fill={theme.fill}
                />

                {/* Badge de Categoría/Grupo */}
                <rect
                  x="8"
                  y="5"
                  width="72"
                  height="16"
                  rx="3"
                  fill={theme.badgeBg}
                />
                <text
                  x="44"
                  y="16.5"
                  textAnchor="middle"
                  fill={theme.badgeText}
                  fontSize="8.5"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {node.badge || node.group.toUpperCase()}
                </text>

                {/* Indicador de Estado (LED Dot) */}
                <circle cx={node.width - 14} cy="13" r="4" fill={statusCfg.dot} />

                {/* Título Principal */}
                <text
                  x="12"
                  y="48"
                  fill={tokens.nodeTitleText}
                  fontSize="12.5"
                  fontWeight="600"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {node.label}
                </text>

                {/* Subtítulo / Descripción corta */}
                <text
                  x="12"
                  y="65"
                  fill={tokens.nodeSubtitleText}
                  fontSize="10"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {node.subtitle || ''}
                </text>

                {/* Métricas o Atributos en la base del nodo */}
                {node.metrics && node.metrics.length > 0 && (
                  <g transform="translate(10, 78)">
                    {node.metrics.slice(0, 2).map((m, mIdx) => (
                      <g key={mIdx} transform={`translate(${mIdx * 105}, 0)`}>
                        <rect
                          width="100"
                          height="22"
                          rx="4"
                          fill={tokens.metricBoxBg}
                          stroke={tokens.metricBoxBorder}
                          strokeWidth="1"
                        />
                        <text
                          x="6"
                          y="15"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          <tspan fill={tokens.metricLabelText}>{m.label}: </tspan>
                          <tspan fontWeight="600" fill={tokens.metricValText}>
                            {m.value}
                          </tspan>
                        </text>
                      </g>
                    ))}
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* DOCK DE CONTROLES FLOTANTE INFERIOR */}
      <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1.5 p-1.5 rounded-xl vision-window border border-glass shadow-2xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(z * 1.2, 3))}
          className="vision-btn !p-1.5 text-muted hover:text-primary"
          title="Acercar (Zoom In)"
        >
          <span className="material-symbols-outlined text-[16px]">zoom_in</span>
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(z / 1.2, 0.3))}
          className="vision-btn !p-1.5 text-muted hover:text-primary"
          title="Alejar (Zoom Out)"
        >
          <span className="material-symbols-outlined text-[16px]">zoom_out</span>
        </button>
        <button
          type="button"
          onClick={handleResetView}
          className="vision-btn !p-1.5 text-muted hover:text-primary"
          title="Restablecer tamaño (100%)"
        >
          <span className="material-symbols-outlined text-[16px]">restart_alt</span>
        </button>
        <button
          type="button"
          onClick={handleFitView}
          className="vision-btn !p-1.5 text-muted hover:text-primary"
          title="Ajustar al área visible"
        >
          <span className="material-symbols-outlined text-[16px]">fit_screen</span>
        </button>

        <div className="h-4 w-px bg-white/10 mx-0.5" />

        {/* Selector de Modo Reach */}
        <div className="flex items-center gap-0.5 bg-black/20 dark:bg-black/30 p-0.5 rounded-lg border border-glass-subtle">
          <button
            type="button"
            onClick={() => setReachMode('downstream')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
              reachMode === 'downstream'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Resaltar flujo hacia adelante (Downstream)"
          >
            Down
          </button>
          <button
            type="button"
            onClick={() => setReachMode('upstream')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
              reachMode === 'upstream'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Resaltar dependencias previas (Upstream)"
          >
            Up
          </button>
          <button
            type="button"
            onClick={() => setReachMode('both')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
              reachMode === 'both'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Resaltar todo el alcance conectado (Both)"
          >
            All
          </button>
        </div>

        <div className="h-4 w-px bg-white/10 mx-0.5" />

        <button
          type="button"
          onClick={() => setShowLegend((prev) => !prev)}
          className={`vision-btn !p-1.5 ${showLegend ? 'text-indigo-400' : 'text-muted hover:text-primary'}`}
          title="Mostrar / Ocultar Leyenda de Capas"
        >
          <span className="material-symbols-outlined text-[16px]">info</span>
        </button>
      </div>

      {/* LEYENDA FLOTANTE */}
      {showLegend && (
        <div className="absolute top-3 left-3 z-30 p-3 rounded-xl vision-window border border-glass shadow-2xl max-w-xs text-xs space-y-1.5 animate-in fade-in">
          <div className="font-semibold text-primary pb-1 border-b border-glass-subtle flex items-center justify-between">
            <span>Leyenda de Capas del Proyecto</span>
            <button
              onClick={() => setShowLegend(false)}
              className="text-muted hover:text-primary"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10.5px]">
            {Object.entries(groupThemes).map(([key, g]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: g.accent }}
                />
                <span className="text-secondary truncate">{g.label.split('/')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INSPECTOR DE NODO SELECCIONADO (DRAWER LATERAL DERECHO) */}
      {selectedNode && isInspectorOpen && (
        <aside className="absolute top-3 right-3 bottom-14 z-30 w-80 rounded-xl vision-window border border-glass shadow-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-right-4 overflow-hidden">
          {/* Cabecera */}
          <div className="flex items-start justify-between border-b border-glass-subtle pb-2">
            <div>
              <span
                className="text-[9.5px] font-mono uppercase px-2 py-0.5 rounded font-semibold"
                style={{
                  backgroundColor: groupThemes[selectedNode.group]?.badgeBg,
                  color: groupThemes[selectedNode.group]?.badgeText,
                }}
              >
                {selectedNode.badge || selectedNode.group}
              </span>
              <h4 className="text-sm font-semibold text-primary mt-1">
                {selectedNode.label}
              </h4>
            </div>
            <button
              onClick={() => {
                setIsInspectorOpen(false);
                setSelectedNodeId(null);
              }}
              className="vision-btn !p-1 text-muted hover:text-primary"
              title="Cerrar inspector"
            >
              <span className="material-symbols-outlined text-[15px]">close</span>
            </button>
          </div>

          {/* Subtítulo / Descripción */}
          <div className="text-xs text-secondary leading-relaxed space-y-2 overflow-y-auto pr-1 custom-scrollbar">
            {selectedNode.subtitle && (
              <p className="font-medium text-primary">{selectedNode.subtitle}</p>
            )}
            {selectedNode.description && (
              <p className="text-[11.5px] text-secondary bg-black/5 dark:bg-black/20 p-2 rounded-lg border border-glass-subtle">
                {selectedNode.description}
              </p>
            )}

            {/* Métricas */}
            {selectedNode.metrics && selectedNode.metrics.length > 0 && (
              <div className="pt-2">
                <div className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1.5">
                  Métricas de Componente
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {selectedNode.metrics.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-black/5 dark:bg-black/30 border border-glass-subtle text-center"
                    >
                      <div className="text-[9.5px] text-muted">{m.label}</div>
                      <div className="text-xs font-mono font-semibold text-indigo-500 dark:text-cyan-400 mt-0.5">
                        {m.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Atributos y Detalles */}
            {selectedNode.details && (
              <div className="pt-2">
                <div className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1.5">
                  Especificación Técnica
                </div>
                <div className="space-y-1 bg-black/5 dark:bg-black/30 p-2 rounded-lg border border-glass-subtle font-mono text-[10px]">
                  {Object.entries(selectedNode.details).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-0.5 border-b border-glass-subtle last:border-none">
                      <span className="text-muted">{k}:</span>
                      <span className="text-primary font-medium truncate max-w-[140px] text-right">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alcance (Reach Stats) */}
            {reach && (
              <div className="pt-2 text-[10px] font-mono text-muted">
                <div className="text-[9.5px] uppercase tracking-wider mb-1">
                  Alcance ({reachMode}):
                </div>
                <div className="text-primary">
                  {reach.nodeIds.size} nodos conectados • {reach.edgeIds.size} enlaces activos
                </div>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
};
