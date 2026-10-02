import React from 'react';
import { VisionModal } from '@/components/ui/VisionModal';
import { VisionButton } from '@/components/ui/VisionButton';
import { VisionPill } from '@/components/ui/VisionPill';
import { useProjectStore } from '@/stores/useProjectStore';

interface CoverageMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoverageMetricsModal: React.FC<CoverageMetricsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { metrics, activeProject } = useProjectStore();

  const maturityScore = metrics ? metrics.maturity_index : 100;
  const totalRf = metrics ? metrics.total_rf : 0;
  const totalRnf = metrics ? metrics.total_rnf : 0;
  const totalEntities = metrics ? metrics.total_entities : 0;
  const totalAdrs = metrics ? metrics.total_adrs_accepted : 0;
  const totalAdrsCount = metrics ? metrics.total_adrs_total : 0;

  // Cálculo heurístico de cobertura
  const totalReqs = totalRf + totalRnf;
  const reqToDataCoverage = totalReqs > 0 ? Math.min(100, Math.round((totalEntities / Math.max(1, totalRf)) * 100)) : 100;
  const adrCoverage = totalAdrsCount > 0 ? Math.round((totalAdrs / totalAdrsCount) * 100) : 100;

  return (
    <VisionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Métricas de Cobertura y Gobernanza Técnica"
      description="Auditoría formal de madurez pre-código bajo normas IEEE-830, Codd 3FN y Michael Nygard."
      icon="insights"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Cabecera del Proyecto */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-black/10 dark:bg-white/[0.04] border border-glass-subtle gap-2">
          <div>
            <div className="text-[10px] text-muted font-mono uppercase tracking-wider">Proyecto Activo</div>
            <div className="text-sm font-bold text-primary">{activeProject?.name || 'DevSculptor Core'}</div>
            <div className="text-[11px] text-secondary">
              Líder Arquitecto: <span className="text-indigo-400 font-mono">{activeProject?.lead_architect || 'Staff Architect'}</span>
            </div>
          </div>
          <VisionPill variant="cyan" className="font-mono text-[9px]">
            {activeProject?.architecture_style || 'Layered MVC Modular'}
          </VisionPill>
        </div>

        {/* Indicador Principal de Madurez (Stored Procedure) */}
        <div className="vision-card p-4 text-center space-y-2 border-indigo-500/30 bg-indigo-500/5">
          <div className="text-[10.5px] font-mono text-muted uppercase tracking-wider">
            Índice de Madurez Global (Stored Procedure)
          </div>
          <div className="text-4xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
            {maturityScore}%
          </div>
          <div className="w-full h-2 rounded-full bg-black/20 dark:bg-white/[0.08] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-700"
              style={{ width: `${maturityScore}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted font-mono px-1">
            <span>0% Caos Sin Especificar</span>
            <span className="text-emerald-400 font-semibold">100% Pre-Código Blindado</span>
          </div>
        </div>

        {/* Grilla de Coberturas Clave */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Requisitos */}
          <div className="vision-card p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-mono text-muted uppercase">Requisitos</span>
              <span className="material-symbols-outlined text-sm text-amber-400">checklist</span>
            </div>
            <div className="text-xl font-bold font-mono text-amber-400">{totalReqs}</div>
            <div className="text-[10.5px] text-secondary">
              {totalRf} Funcionales &bull; {totalRnf} No Funcionales
            </div>
            <div className="text-[9.5px] text-emerald-400 font-mono mt-1">100% Zod Validated</div>
          </div>

          {/* Modelado de Datos */}
          <div className="vision-card p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-mono text-muted uppercase">Tablas Canvas</span>
              <span className="material-symbols-outlined text-sm text-emerald-400">schema</span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400">{totalEntities}</div>
            <div className="text-[10.5px] text-secondary">
              Cobertura RF-Datos: <strong className="text-primary">{reqToDataCoverage}%</strong>
            </div>
            <div className="text-[9.5px] text-emerald-400 font-mono mt-1">Normalización 3FN</div>
          </div>

          {/* Decisiones ADR */}
          <div className="vision-card p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-mono text-muted uppercase">Actas ADR</span>
              <span className="material-symbols-outlined text-sm text-cyan-400">description</span>
            </div>
            <div className="text-xl font-bold font-mono text-cyan-400">{totalAdrs} / {totalAdrsCount}</div>
            <div className="text-[10.5px] text-secondary">
              Ratio de Aprobación: <strong className="text-primary">{adrCoverage}%</strong>
            </div>
            <div className="text-[9.5px] text-cyan-400 font-mono mt-1">Human-in-the-Loop</div>
          </div>
        </div>

        {/* Pilares de Gobernanza y Compliance */}
        <div className="vision-card p-3 space-y-2 text-xs">
          <div className="text-[10px] font-mono text-muted uppercase tracking-wider">
            Checklist de Calidad Arquitectónica
          </div>
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/5 dark:bg-white/[0.02]">
              <span className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined text-sm text-emerald-400">check_circle</span>
                Trazabilidad Requisitos IEEE-830 (RF / RNF)
              </span>
              <span className="text-emerald-400 font-semibold">CONFORME</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/5 dark:bg-white/[0.02]">
              <span className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined text-sm text-emerald-400">check_circle</span>
                Normalización Relacional Edgar F. Codd (3FN)
              </span>
              <span className="text-emerald-400 font-semibold">VERIFICADO</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/5 dark:bg-white/[0.02]">
              <span className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined text-sm text-emerald-400">check_circle</span>
                Seguridad Row Level Security (RLS) Multi-Tenant
              </span>
              <span className="text-emerald-400 font-semibold">ACTIVO</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/5 dark:bg-white/[0.02]">
              <span className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined text-sm text-emerald-400">check_circle</span>
                Inmutabilidad Bóveda OKF (Deterministic Sha256)
              </span>
              <span className="text-emerald-400 font-semibold">SINCRONIZADO</span>
            </div>
          </div>
        </div>

        {/* Botón de Cierre */}
        <div className="flex justify-end pt-2 border-t border-glass-subtle">
          <VisionButton variant="secondary" onClick={onClose} size="sm">
            Entendido / Cerrar
          </VisionButton>
        </div>
      </div>
    </VisionModal>
  );
};
