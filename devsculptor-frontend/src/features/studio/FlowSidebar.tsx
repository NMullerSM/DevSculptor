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
      title: 'Conversación',
      iconColor: 'text-indigo-400',
    },
    {
      id: 'view-reqs' as StudioStep,
      icon: 'checklist',
      title: 'Requisitos',
      iconColor: 'text-indigo-400',
      badge: reqsCount.toString(),
      badgeVariant: 'amber' as const,
    },
    {
      id: 'view-docs' as StudioStep,
      icon: 'description',
      title: 'Documentos',
      iconColor: 'text-indigo-400',
      badge: adrsCount.toString(),
      badgeVariant: 'cyan' as const,
    },
    {
      id: 'view-canvas' as StudioStep,
      icon: 'schema',
      title: 'Modelador de Código',
      iconColor: 'text-indigo-400',
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
      {/* Encabezado con título blanco de alto contraste */}
      <div className="flex items-center justify-between pb-1.5 border-b border-glass-subtle">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white font-semibold">
            Flujo de Trabajo
          </span>
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

      {/* Lista de Pasos Minimalista */}
      <div className="flex-1 overflow-y-auto space-y-1.5 text-xs pr-0.5 custom-scrollbar">
        {steps.map((step) => {
          const isSelected = activeStep === step.id;
          return (
            <button
              key={step.id}
              onClick={() => handleStepClick(step.id)}
              className={`w-full vision-card p-2.5 text-left flex items-center gap-2.5 transition-all ${
                isSelected ? 'selected ring-1 ring-indigo-500/50 bg-indigo-500/10' : 'hover:border-indigo-400/40'
              }`}
            >
              <span className={`material-symbols-outlined text-[17px] ${step.iconColor}`}>
                {step.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-primary truncate text-xs">{step.title}</div>
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
