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
}

export const FlowSidebar: React.FC<FlowSidebarProps> = ({
  activeStep,
  onSelectStep,
  onOpenExportModal,
  reqsCount = 0,
  adrsCount = 0,
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

  return (
    <aside className="vision-window w-[250px] shrink-0 flex flex-col p-3 gap-3 select-none">
      {/* Encabezado */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border-glass-subtle)]">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
          Flujo de Trabajo
        </span>
        <VisionPill variant="indigo" className="text-[8.5px]">
          5 PASOS
        </VisionPill>
      </div>

      {/* Lista de Pasos */}
      <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-0.5 custom-scrollbar">
        {steps.map((step) => {
          const isSelected = activeStep === step.id;
          return (
            <button
              key={step.id}
              onClick={() => onSelectStep(step.id)}
              className={`w-full vision-card p-2.5 text-left flex items-center gap-2.5 transition-all ${
                isSelected ? 'selected' : ''
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
      <div className="pt-2 border-t border-[var(--border-glass-subtle)]">
        <VisionButton
          variant="primary"
          icon="folder_zip"
          onClick={onOpenExportModal}
          className="w-full !py-2 justify-center shadow-lg font-semibold"
        >
          Compilar & Exportar OKF
        </VisionButton>
      </div>
    </aside>
  );
};
