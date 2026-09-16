import React from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { VisionPill } from '@/components/ui/VisionPill';

interface CopilotInspectorProps {
  onQuickAction?: (actionText: string) => void;
}

export const CopilotInspector: React.FC<CopilotInspectorProps> = ({ onQuickAction }) => {
  const { metrics, activeProject } = useProjectStore();

  const maturityScore = metrics ? metrics.maturity_index : 100;
  const totalRf = metrics ? metrics.total_rf : 0;
  const totalRnf = metrics ? metrics.total_rnf : 0;
  const totalEntities = metrics ? metrics.total_entities : 0;
  const totalAdrs = metrics ? metrics.total_adrs_accepted : 0;

  return (
    <aside className="vision-window w-[260px] shrink-0 flex flex-col p-3 gap-3 select-none">
      {/* Encabezado */}
      <div className="flex items-center justify-between pb-1 border-b border-glass-subtle">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(56,189,248,0.8)] animate-pulse" />
          <span className="font-semibold text-xs text-primary">Copiloto</span>
        </div>
        <VisionPill variant="cyan" className="text-[8.5px]">
          ACTIVO
        </VisionPill>
      </div>

      {/* Tarjeta de Maturity Index del Stored Procedure */}
      <div className="vision-card p-3 space-y-2 text-center">
        <div className="text-[9px] font-mono text-muted uppercase tracking-wider">
          Índice de Madurez (SP)
        </div>
        <div className="text-2xl font-bold font-mono text-indigo-400">
          {maturityScore}%
        </div>
        <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/[0.06] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${maturityScore}%` }}
          />
        </div>
        <div className="text-[9px] text-muted font-mono flex items-center justify-between">
          <span>0% Caos</span>
          <span>100% Blindado</span>
        </div>
      </div>

      {/* Métricas Clave de Persistencia */}
      <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
        <div className="vision-card p-2">
          <div className="text-[8px] text-muted">NORMALIZACIÓN</div>
          <div className="text-sm font-bold text-emerald-500 dark:text-emerald-400">3FN</div>
          <div className="text-[7.5px] text-muted truncate">Sin duplicación</div>
        </div>
        <div className="vision-card p-2">
          <div className="text-[8px] text-muted">POLÍTICAS RLS</div>
          <div className="text-sm font-bold text-cyan-600 dark:text-cyan-400">6 / 6</div>
          <div className="text-[7.5px] text-muted truncate">Cloud Seguro</div>
        </div>
      </div>

      {/* Resumen Cuantitativo */}
      <div className="vision-card p-2 text-[10px] font-mono text-secondary space-y-1">
        <div className="flex justify-between">
          <span>Requisitos (RF/RNF):</span>
          <span className="text-amber-500 dark:text-amber-400 font-bold">{totalRf + totalRnf}</span>
        </div>
        <div className="flex justify-between">
          <span>Tablas Canvas:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{totalEntities}</span>
        </div>
        <div className="flex justify-between">
          <span>ADRs Aprobados:</span>
          <span className="text-cyan-600 dark:text-cyan-400 font-bold">{totalAdrs}</span>
        </div>
      </div>

      {/* Acciones de Inspección Heurística */}
      <div className="flex-1 overflow-y-auto space-y-1.5 text-xs pr-0.5 custom-scrollbar">
        <div className="text-[9.5px] font-mono text-muted uppercase px-1">
          Acciones de Calidad
        </div>

        <button
          onClick={() => onQuickAction?.('Validar RF con Esquema DDL')}
          className="vision-card p-2 w-full text-left text-[10.5px] text-primary hover:border-indigo-400/50 flex items-center gap-2 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm text-cyan-500 dark:text-cyan-400">verified</span>
          <span>Validar RF con Esquema DDL</span>
        </button>

        <button
          onClick={() => onQuickAction?.('Inspeccionar Políticas RLS')}
          className="vision-card p-2 w-full text-left text-[10.5px] text-primary hover:border-indigo-400/50 flex items-center gap-2 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm text-emerald-500 dark:text-emerald-400">lock</span>
          <span>Inspeccionar Políticas RLS</span>
        </button>

        <button
          onClick={() => onQuickAction?.('Métricas de Cobertura')}
          className="vision-card p-2 w-full text-left text-[10.5px] text-primary hover:border-indigo-400/50 flex items-center gap-2 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm text-amber-500 dark:text-amber-400">insights</span>
          <span>Métricas de Cobertura</span>
        </button>
      </div>

      {/* Certificación Metodológica */}
      <div className="p-2.5 vision-card text-[11px] space-y-1 border-emerald-500/20 bg-emerald-500/[0.02]">
        <div className="font-semibold text-emerald-400 flex items-center gap-1 text-[11px]">
          <span className="material-symbols-outlined text-[13px]">task_alt</span>
          <span>Pre-Código Verificado</span>
        </div>
        <p className="text-secondary leading-tight text-[10px]">
          {activeProject?.name || 'Proyecto'} listo para inyección como Prompt Bundle en Cursor o Claude.
        </p>
      </div>
    </aside>
  );
};
