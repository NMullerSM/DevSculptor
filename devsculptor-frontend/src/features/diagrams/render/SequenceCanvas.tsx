import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { SequenceSpec } from '../diagram.types';
import { computeSequenceLayout } from '../geometry/sequenceGeometry';
import { getGroupThemes, getCanvasTokens } from '../diagramTheme';
import { useThemeStore } from '@/stores/useThemeStore';

interface SequenceCanvasProps {
  spec: SequenceSpec;
  onExportSvgRef?: (svg: SVGSVGElement | null) => void;
  className?: string;
}

export const SequenceCanvas: React.FC<SequenceCanvasProps> = ({
  spec,
  onExportSvgRef,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Tema del sistema
  const currentTheme = useThemeStore((s) => s.theme);
  const isDark = currentTheme === 'dark';

  const groupThemes = useMemo(() => getGroupThemes(currentTheme), [currentTheme]);
  const tokens = useMemo(() => getCanvasTokens(currentTheme), [currentTheme]);

  // Estados de Pan & Zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 30 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Estados de Reproducción Secuencial (Playback)
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1800); // ms por paso

  // Layout geométrico
  const layout = useMemo(() => {
    return computeSequenceLayout(spec.participants, spec.messages);
  }, [spec.participants, spec.messages]);

  // Exponer ref de SVG para exportación limpia
  useEffect(() => {
    if (onExportSvgRef) {
      onExportSvgRef(svgRef.current);
    }
  }, [onExportSvgRef, layout]);

  // Manejo de Zoom no pasivo
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoom((z) => Math.min(Math.max(z * factor, 0.3), 3.0));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Timer de reproducción automática
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev === null) return 0;
        if (prev >= spec.messages.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, spec.messages.length]);

  // Ajustar vista inicial
  const handleFitView = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const scaleX = (clientWidth - 80) / layout.bounds.width;
    const scaleY = (clientHeight - 80) / layout.bounds.height;
    const fitZoom = Math.min(scaleX, scaleY, 1.2);
    setZoom(Math.max(fitZoom, 0.4));
    setPan({
      x: Math.max(20, (clientWidth - layout.bounds.width * fitZoom) / 2),
      y: 20,
    });
  }, [layout.bounds]);

  useEffect(() => {
    handleFitView();
  }, [spec.id, handleFitView]);

  // Controles de reproducción
  const handlePlayToggle = () => {
    if (activeStep !== null && activeStep >= spec.messages.length - 1) {
      setActiveStep(0);
      setIsPlaying(true);
    } else {
      if (activeStep === null) setActiveStep(0);
      setIsPlaying((prev) => !prev);
    }
  };

  const handleStepPrev = () => {
    setIsPlaying(false);
    setActiveStep((prev) => (prev === null || prev <= 0 ? 0 : prev - 1));
  };

  const handleStepNext = () => {
    setIsPlaying(false);
    setActiveStep((prev) => {
      if (prev === null) return 0;
      return Math.min(prev + 1, spec.messages.length - 1);
    });
  };

  const handleResetPlayback = () => {
    setIsPlaying(false);
    setActiveStep(null);
  };

  // Drag handlers
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
          <marker
            id="seq-arrow-right"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill={isDark ? '#38bdf8' : '#0284c7'} />
          </marker>
          <marker
            id="seq-arrow-left"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill={isDark ? '#38bdf8' : '#0284c7'} />
          </marker>
          <marker
            id="seq-arrow-return"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill={isDark ? '#94a3b8' : '#64748b'} />
          </marker>
        </defs>

        {/* 1. LÍNEAS DE VIDA (LIFELINES) */}
        <g className="seq-lifelines">
          {layout.lifelines.map((line) => (
            <line
              key={line.participantId}
              x1={line.x}
              y1={line.startY}
              x2={line.x}
              y2={line.endY}
              stroke={tokens.lifelineStroke}
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          ))}
        </g>

        {/* 2. MENSAJES / FLECHAS TEMPORALES */}
        <g className="seq-messages">
          {layout.messages.map((msg) => {
            const isStepActive = activeStep === msg.index;
            const isStepFuture = activeStep !== null && activeStep < msg.index;

            const strokeColor = isStepActive
              ? isDark ? '#38bdf8' : '#0284c7'
              : msg.isReturn
              ? isDark ? '#94a3b8' : '#64748b'
              : isDark ? '#818cf8' : '#6366f1';
            const strokeWidth = isStepActive ? 2.6 : 1.8;
            const strokeDasharray = msg.isReturn ? '5 3' : 'none';

            return (
              <g
                key={msg.id}
                className="cursor-pointer transition-opacity duration-200"
                style={{ opacity: isStepFuture ? 0.35 : 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStep(msg.index);
                  setIsPlaying(false);
                }}
              >
                {/* Fondo resaltado si es el paso activo */}
                {isStepActive && (
                  <rect
                    x="20"
                    y={msg.y - 22}
                    width={layout.bounds.width - 40}
                    height="44"
                    rx="8"
                    fill={tokens.sequenceStepBg}
                    stroke={tokens.sequenceStepBorder}
                    strokeWidth="1"
                  />
                )}

                {/* Flecha según tipo */}
                {msg.isSelf ? (
                  // Auto-llamada
                  <path
                    d={`M ${msg.startX} ${msg.y - 10} C ${msg.startX + 50} ${msg.y - 20}, ${msg.startX + 50} ${msg.y + 20}, ${msg.startX} ${msg.y + 10}`}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    markerEnd="url(#seq-arrow-right)"
                  />
                ) : (
                  // Mensaje horizontal
                  <line
                    x1={msg.startX}
                    y1={msg.y}
                    x2={msg.endX}
                    y2={msg.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    markerEnd={
                      msg.isReturn
                        ? 'url(#seq-arrow-return)'
                        : msg.arrowDirection === 'left'
                        ? 'url(#seq-arrow-left)'
                        : 'url(#seq-arrow-right)'
                    }
                  />
                )}

                {/* Número del paso secuencial */}
                <circle
                  cx={Math.min(msg.startX, msg.endX) + 16}
                  cy={msg.y - 12}
                  r="9"
                  fill={isStepActive ? '#0284c7' : tokens.stepNumberBg}
                  stroke={isStepActive ? (isDark ? '#38bdf8' : '#0284c7') : tokens.protocolBadgeBorder}
                  strokeWidth="1.2"
                />
                <text
                  x={Math.min(msg.startX, msg.endX) + 16}
                  y={msg.y - 8.5}
                  textAnchor="middle"
                  fill={isStepActive ? '#ffffff' : tokens.stepNumberText}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {msg.index + 1}
                </text>

                {/* Texto del mensaje */}
                <text
                  x={(msg.startX + msg.endX) / 2}
                  y={msg.y - 7}
                  textAnchor="middle"
                  fill={isStepActive ? (isDark ? '#ffffff' : '#0284c7') : tokens.nodeTitleText}
                  fontSize="11"
                  fontWeight={isStepActive ? '600' : '500'}
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {msg.label}
                </text>

                {/* Detalle o Protocolo adicional */}
                {msg.detail && (
                  <text
                    x={(msg.startX + msg.endX) / 2}
                    y={msg.y + 14}
                    textAnchor="middle"
                    fill={isStepActive ? (isDark ? '#7dd3fc' : '#0369a1') : tokens.nodeSubtitleText}
                    fontSize="9.5"
                    fontFamily="monospace"
                  >
                    {msg.detail}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* 3. PARTICIPANTES (ENCABEZADOS) */}
        <g className="seq-participants">
          {layout.participants.map((p) => {
            const theme = groupThemes[p.group] || groupThemes.backend;

            return (
              <g
                key={p.id}
                transform={`translate(${p.x}, ${p.y})`}
                className="select-none"
              >
                <rect
                  width={p.width}
                  height={p.height}
                  rx="8"
                  fill={tokens.nodeCardFill}
                  stroke={theme.border}
                  strokeWidth="1.5"
                />
                <path
                  d={`M 0 8 Q 0 0 8 0 L ${p.width - 8} 0 Q ${p.width} 0 ${p.width} 8 L ${p.width} 22 L 0 22 Z`}
                  fill={theme.fill}
                />
                <text
                  x="10"
                  y="15"
                  fill={theme.badgeText}
                  fontSize="8.5"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {p.group.toUpperCase()}
                </text>
                <text
                  x="10"
                  y="40"
                  fill={tokens.nodeTitleText}
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {p.label}
                </text>
                {p.subtitle && (
                  <text
                    x="10"
                    y="54"
                    fill={tokens.nodeSubtitleText}
                    fontSize="9.5"
                    fontFamily="system-ui, -apple-system, sans-serif"
                  >
                    {p.subtitle}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* BANNER FLOTANTE DE PASO ACTIVO */}
      {activeStep !== null && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl vision-window border border-glass shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in max-w-lg">
          <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-500 dark:text-sky-400 font-mono text-xs font-bold flex items-center justify-center border border-sky-500/30">
            {activeStep + 1}
          </span>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-primary truncate">
              {spec.messages[activeStep]?.label}
            </div>
            <div className="text-[10px] text-secondary font-mono truncate">
              {spec.messages[activeStep]?.from} → {spec.messages[activeStep]?.to}
              {spec.messages[activeStep]?.detail && ` • ${spec.messages[activeStep]?.detail}`}
            </div>
          </div>
          <button
            onClick={() => setActiveStep(null)}
            className="vision-btn !p-1 text-muted hover:text-primary ml-auto"
            title="Cerrar paso"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}

      {/* DOCK DE REPRODUCCIÓN Y ZOOM INFERIOR */}
      <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1.5 p-1.5 rounded-xl vision-window border border-glass shadow-2xl backdrop-blur-md">
        {/* Playback Controls */}
        <button
          type="button"
          onClick={handlePlayToggle}
          className={`vision-btn !py-1 !px-2.5 text-xs flex items-center gap-1.5 font-semibold ${
            isPlaying ? 'bg-amber-600 text-white' : 'vision-btn-primary'
          }`}
          title={isPlaying ? 'Pausar simulación' : 'Reproducir simulación secuencial'}
        >
          <span className="material-symbols-outlined text-[16px]">
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
          <span>{isPlaying ? 'Pausa' : 'Simular'}</span>
        </button>

        <button
          type="button"
          onClick={handleStepPrev}
          className="vision-btn !p-1.5 text-muted hover:text-primary"
          title="Paso Anterior"
        >
          <span className="material-symbols-outlined text-[16px]">skip_previous</span>
        </button>

        <span className="text-[10px] font-mono text-secondary px-1">
          {activeStep !== null ? `${activeStep + 1}/${spec.messages.length}` : `0/${spec.messages.length}`}
        </span>

        <button
          type="button"
          onClick={handleStepNext}
          className="vision-btn !p-1.5 text-muted hover:text-primary"
          title="Paso Siguiente"
        >
          <span className="material-symbols-outlined text-[16px]">skip_next</span>
        </button>

        <button
          type="button"
          onClick={handleResetPlayback}
          className="vision-btn !p-1.5 text-muted hover:text-primary"
          title="Reiniciar Secuencia"
        >
          <span className="material-symbols-outlined text-[16px]">replay</span>
        </button>

        <button
          type="button"
          onClick={() => setPlaybackSpeed((s) => (s === 1800 ? 1000 : s === 1000 ? 2500 : 1800))}
          className="vision-btn !py-1 !px-2 text-[10px] font-mono text-indigo-500 dark:text-cyan-300 hover:text-primary"
          title="Velocidad de reproducción"
        >
          {playbackSpeed === 1800 ? '1x' : playbackSpeed === 1000 ? '1.8x' : '0.7x'}
        </button>

        <div className="h-4 w-px bg-white/10 mx-0.5" />

        {/* Zoom Controls */}
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
          onClick={handleFitView}
          className="vision-btn !p-1.5 text-muted hover:text-primary"
          title="Ajustar al área visible"
        >
          <span className="material-symbols-outlined text-[16px]">fit_screen</span>
        </button>
      </div>
    </div>
  );
};
