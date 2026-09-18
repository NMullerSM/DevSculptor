import React from 'react';
import { VisionPill } from '@/components/ui/VisionPill';
import { VisionButton } from '@/components/ui/VisionButton';

export type StudioStep = 'view-chat' | 'view-reqs' | 'view-docs' | 'view-canvas';

interface FlowSidebarProps {
  activeStep: StudioStep;
  onSelectStep: (step: StudioStep) => void;
  onOpenExportModal: () => void;
  reqsCount?: number;
  adrsCount?: number;
  onClose?: () => void;
  className?: string;
}

export const FlowSidebar: React.FC<FlowSidebarProps> = ({
  activeStep,
  onSelectStep,
  onOpenExportModal,
  reqsCount = 0,
  adrsCount = 0,
  onClose,
  className = '',
}) => {
  const steps = [
    {
      id: 'view-chat' as StudioStep,
      icon: 'chat_bubble',
      title: '1. Conversación',
      subtitle: 'Entrevista & Alcance',
      iconColor: 'text-indigo-400',
    },
    {
      id: 'view-reqs' as StudioStep,
      icon: 'checklist',
      title: '2. Requisitos',
      subtitle: 'Matriz RF y RNF',
      iconColor: 'text-amber-400',
      badge: reqsCount.toString(),
      badgeVariant: 'amber' as const,
    },
    {
      id: 'view-docs' as StudioStep,
      icon: 'description',
      title: '3. Documentos',
      subtitle: 'Actas ADRs & Specs',
      iconColor: 'text-cyan-400',
      badge: adrsCount.toString(),
      badgeVariant: 'cyan' as const,
    },
    {
      id: 'view-canvas' as StudioStep,
      icon: 'schema',
      title: '4. Modelador & Código',
      subtitle: 'ERD, DDL, TS, Py',
      iconColor: 'text-emerald-400',
    },
  ];

  const handleStepClick = (stepId: StudioStep) => {
    onSelectStep(stepId);
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className={`vision-window flex flex-col p-3 gap-3 select-none ${className}`}>
      {/* Encabezado */}
      <div className="flex items-center justify-between pb-1.5 border-b border-glass-subtle">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
            Flujo de Trabajo
          </span>
          <VisionPill variant="indigo" className="text-[8.5px]">
            5 PASOS
          </VisionPill>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="vision-btn vision-btn-icon !p-1 text-muted hover:text-primary"
            title="Cerrar panel de flujo"
            aria-label="Cerrar panel de flujo"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      {/* Lista de Pasos */}
      <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-0.5 custom-scrollbar">
        {steps.map((step) => {
          const isSelected = activeStep === step.id;
          return (
            <button
              key={step.id}
              onClick={() => handleStepClick(step.id)}
              className={`w-full vision-card p-2.5 text-left flex items-center gap-2.5 transition-all ${
                isSelected ? 'selected ring-1 ring-indigo-500/50' : ''
              }`}
            >
              <span className={`material-symbols-outlined text-[17px] ${step.iconColor}`}>
                {step.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-primary truncate text-xs">{step.title}</div>
                <div className="text-[10px] text-secondary truncate font-mono">{step.subtitle}</div>
              </div>
              {step.badge && (
                <VisionPill variant={step.badgeVariant} className="text-[9px] px-1.5 py-0.5">
                  {step.badge}
                </VisionPill>
              )}
            </button>
          );
        })}
      </div>

      {/* Paso 5: Botón Inferior Anclado de Exportación OKF */}
      <div className="pt-2 border-t border-glass-subtle">
        <VisionButton
          variant="primary"
          icon="folder_zip"
          onClick={() => {
            onOpenExportModal();
            if (onClose) onClose();
          }}
          className="w-full !py-2 justify-center shadow-lg font-semibold"
        >
          Compilar & Exportar OKF
        </VisionButton>
      </div>
    </aside>
  );
};
