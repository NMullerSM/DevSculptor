import { DiagramNode } from './diagram.types';

export type DiagramThemeMode = 'dark' | 'light';

export interface GroupStyle {
  label: string;
  fill: string;
  border: string;
  badgeBg: string;
  badgeText: string;
  accent: string;
  glow: string;
  iconBg: string;
}

export interface CanvasVisualTokens {
  canvasBg: string;
  gridDot: string;
  nodeCardFill: string;
  nodeTitleText: string;
  nodeSubtitleText: string;
  nodeDetailsBg: string;
  nodeDetailsBorder: string;
  metricBoxBg: string;
  metricBoxBorder: string;
  metricLabelText: string;
  metricValText: string;
  protocolBadgeBg: string;
  protocolBadgeBorder: string;
  protocolBadgeText: string;
  lifelineStroke: string;
  sequenceStepBg: string;
  sequenceStepBorder: string;
  stepNumberBg: string;
  stepNumberText: string;
}

export function getGroupThemes(mode: DiagramThemeMode): Record<DiagramNode['group'], GroupStyle> {
  const isDark = mode === 'dark';

  return {
    frontend: {
      label: 'Capa Frontend / Presentación',
      fill: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.06)',
      border: isDark ? 'rgba(96, 165, 250, 0.45)' : 'rgba(37, 99, 235, 0.45)',
      badgeBg: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.14)',
      badgeText: isDark ? '#93c5fd' : '#1d4ed8',
      accent: '#3b82f6',
      glow: isDark ? 'rgba(59, 130, 246, 0.35)' : 'rgba(59, 130, 246, 0.2)',
      iconBg: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)',
    },
    backend: {
      label: 'Capa Backend / Servicios',
      fill: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.06)',
      border: isDark ? 'rgba(129, 140, 248, 0.45)' : 'rgba(79, 70, 229, 0.45)',
      badgeBg: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.14)',
      badgeText: isDark ? '#c7d2fe' : '#4338ca',
      accent: '#6366f1',
      glow: isDark ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.2)',
      iconBg: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.15)',
    },
    database: {
      label: 'Capa de Persistencia / DB',
      fill: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.06)',
      border: isDark ? 'rgba(52, 211, 153, 0.45)' : 'rgba(5, 150, 105, 0.45)',
      badgeBg: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.14)',
      badgeText: isDark ? '#a7f3d0' : '#047857',
      accent: '#10b981',
      glow: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.2)',
      iconBg: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.15)',
    },
    ai: {
      label: 'Motor Cognitivo / IA BYOK',
      fill: isDark ? 'rgba(236, 72, 153, 0.08)' : 'rgba(236, 72, 153, 0.06)',
      border: isDark ? 'rgba(244, 114, 182, 0.45)' : 'rgba(219, 39, 119, 0.45)',
      badgeBg: isDark ? 'rgba(236, 72, 153, 0.2)' : 'rgba(236, 72, 153, 0.14)',
      badgeText: isDark ? '#fbcfe8' : '#be185d',
      accent: '#ec4899',
      glow: isDark ? 'rgba(236, 72, 153, 0.35)' : 'rgba(236, 72, 153, 0.2)',
      iconBg: isDark ? 'rgba(236, 72, 153, 0.25)' : 'rgba(236, 72, 153, 0.15)',
    },
    security: {
      label: 'Seguridad / Autenticación',
      fill: isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.06)',
      border: isDark ? 'rgba(251, 191, 36, 0.45)' : 'rgba(217, 119, 6, 0.45)',
      badgeBg: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.14)',
      badgeText: isDark ? '#fde68a' : '#b45309',
      accent: '#f59e0b',
      glow: isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.2)',
      iconBg: isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.15)',
    },
    governance: {
      label: 'Gobernanza / Auditoría OKF',
      fill: isDark ? 'rgba(168, 85, 247, 0.08)' : 'rgba(168, 85, 247, 0.06)',
      border: isDark ? 'rgba(192, 132, 252, 0.45)' : 'rgba(147, 51, 234, 0.45)',
      badgeBg: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.14)',
      badgeText: isDark ? '#e9d5ff' : '#7e22ce',
      accent: '#a853ba',
      glow: isDark ? 'rgba(168, 85, 247, 0.35)' : 'rgba(168, 85, 247, 0.2)',
      iconBg: isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(168, 85, 247, 0.15)',
    },
    client: {
      label: 'Cliente / Navegador Web',
      fill: isDark ? 'rgba(6, 182, 212, 0.08)' : 'rgba(6, 182, 212, 0.06)',
      border: isDark ? 'rgba(34, 211, 238, 0.45)' : 'rgba(8, 145, 178, 0.45)',
      badgeBg: isDark ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.14)',
      badgeText: isDark ? '#a5f3fc' : '#0e7490',
      accent: '#06b6d4',
      glow: isDark ? 'rgba(6, 182, 212, 0.35)' : 'rgba(6, 182, 212, 0.2)',
      iconBg: isDark ? 'rgba(6, 182, 212, 0.25)' : 'rgba(6, 182, 212, 0.15)',
    },
    external: {
      label: 'Servicios Externos / APIs',
      fill: isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(148, 163, 184, 0.06)',
      border: isDark ? 'rgba(203, 213, 225, 0.35)' : 'rgba(71, 85, 105, 0.35)',
      badgeBg: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.14)',
      badgeText: isDark ? '#e2e8f0' : '#334155',
      accent: '#94a3b8',
      glow: isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.15)',
      iconBg: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.12)',
    },
  };
}

export function getEdgeStyles(mode: DiagramThemeMode) {
  const isDark = mode === 'dark';

  return {
    default: {
      stroke: isDark ? '#64748b' : '#94a3b8',
      strokeWidth: 1.8,
      strokeDasharray: 'none',
      particleFill: isDark ? '#818cf8' : '#4f46e5',
    },
    accent: {
      stroke: isDark ? '#818cf8' : '#6366f1',
      strokeWidth: 2.2,
      strokeDasharray: 'none',
      particleFill: isDark ? '#38bdf8' : '#0284c7',
    },
    warning: {
      stroke: '#f59e0b',
      strokeWidth: 2,
      strokeDasharray: '4 3',
      particleFill: '#fbbf24',
    },
    dashed: {
      stroke: isDark ? '#475569' : '#cbd5e1',
      strokeWidth: 1.6,
      strokeDasharray: '5 4',
      particleFill: isDark ? '#94a3b8' : '#64748b',
    },
    success: {
      stroke: '#10b981',
      strokeWidth: 2,
      strokeDasharray: 'none',
      particleFill: '#34d399',
    },
  };
}

export function getCanvasTokens(mode: DiagramThemeMode): CanvasVisualTokens {
  const isDark = mode === 'dark';

  if (isDark) {
    return {
      canvasBg: 'rgba(2, 6, 23, 0.90)',
      gridDot: '#6366f1',
      nodeCardFill: '#0b1120',
      nodeTitleText: '#f8fafc',
      nodeSubtitleText: '#94a3b8',
      nodeDetailsBg: 'rgba(0, 0, 0, 0.35)',
      nodeDetailsBorder: 'rgba(255, 255, 255, 0.08)',
      metricBoxBg: 'rgba(255, 255, 255, 0.03)',
      metricBoxBorder: 'rgba(255, 255, 255, 0.08)',
      metricLabelText: '#64748b',
      metricValText: '#38bdf8',
      protocolBadgeBg: '#0f172a',
      protocolBadgeBorder: '#334155',
      protocolBadgeText: '#cbd5e1',
      lifelineStroke: 'rgba(148, 163, 184, 0.25)',
      sequenceStepBg: 'rgba(56, 189, 248, 0.08)',
      sequenceStepBorder: 'rgba(56, 189, 248, 0.3)',
      stepNumberBg: '#1e293b',
      stepNumberText: '#94a3b8',
    };
  }

  // Tokens para Tema Claro (Light Mode) de Alto Contraste y Limpieza
  return {
    canvasBg: 'rgba(248, 250, 252, 0.95)',
    gridDot: 'rgba(99, 102, 241, 0.35)',
    nodeCardFill: '#ffffff',
    nodeTitleText: '#0f172a',
    nodeSubtitleText: '#475569',
    nodeDetailsBg: 'rgba(241, 245, 249, 0.8)',
    nodeDetailsBorder: 'rgba(203, 213, 225, 0.8)',
    metricBoxBg: 'rgba(241, 245, 249, 0.7)',
    metricBoxBorder: 'rgba(203, 213, 225, 0.7)',
    metricLabelText: '#64748b',
    metricValText: '#0284c7',
    protocolBadgeBg: '#ffffff',
    protocolBadgeBorder: '#cbd5e1',
    protocolBadgeText: '#1e293b',
    lifelineStroke: 'rgba(100, 116, 139, 0.35)',
    sequenceStepBg: 'rgba(2, 132, 199, 0.08)',
    sequenceStepBorder: 'rgba(2, 132, 199, 0.35)',
    stepNumberBg: '#e2e8f0',
    stepNumberText: '#334155',
  };
}

export const GROUP_THEMES = getGroupThemes('dark');
export const EDGE_STYLES = getEdgeStyles('dark');

export const STATUS_COLORS: Record<string, { dot: string; text: string }> = {
  ok: { dot: '#10b981', text: 'text-emerald-500' },
  warning: { dot: '#f59e0b', text: 'text-amber-500' },
  critical: { dot: '#ef4444', text: 'text-rose-500' },
  info: { dot: '#0284c7', text: 'text-sky-500' },
  neutral: { dot: '#94a3b8', text: 'text-slate-500' },
};
