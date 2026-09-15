import React, { useState } from 'react';
import { FlowSidebar, StudioStep } from './FlowSidebar';
import { CopilotInspector } from './CopilotInspector';
import { ChatConsultantView } from '@/features/chat/ChatConsultantView';
import { RequirementsView } from '@/features/requirements/RequirementsView';
import { DecisionsView } from '@/features/decisions/DecisionsView';
import { CanvasView } from '@/features/canvas/CanvasView';
import { OkfExportModal } from '@/features/export/OkfExportModal';
import { useProjectStore } from '@/stores/useProjectStore';

export const StudioWorkspace: React.FC = () => {
  const { activeProject } = useProjectStore();
  const [activeStep, setActiveStep] = useState<StudioStep>('view-chat');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [reqsCount, setReqsCount] = useState(0);
  const [adrsCount, setAdrsCount] = useState(0);

  if (!activeProject) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-muted text-xs font-mono">
        Selecciona o crea un proyecto en la pestaña "Proyectos" para ingresar al Estudio de Gobernanza.
      </div>
    );
  }

  return (
    <div id="screen-studio" className="flex-1 min-h-0 flex gap-3 w-full z-10 fade-in">
      {/* 1. Panel Izquierdo: Flujo Guiado en 5 Pasos (250px) */}
      <FlowSidebar
        activeStep={activeStep}
        onSelectStep={(step) => setActiveStep(step)}
        onOpenExportModal={() => setIsExportOpen(true)}
        reqsCount={reqsCount}
        adrsCount={adrsCount}
      />

      {/* 2. Panel Central: Workspace Studio de 4 Vistas Activas (Flex-1) */}
      <main className="vision-window flex-1 flex flex-col min-w-0 relative overflow-hidden">
        {activeStep === 'view-chat' && (
          <ChatConsultantView onNavigateStep={(step) => setActiveStep(step)} />
        )}

        {activeStep === 'view-reqs' && (
          <RequirementsView
            projectId={activeProject.id}
            onCountChange={(count) => setReqsCount(count)}
          />
        )}

        {activeStep === 'view-docs' && (
          <DecisionsView
            projectId={activeProject.id}
            onCountChange={(count) => setAdrsCount(count)}
          />
        )}

        {activeStep === 'view-canvas' && (
          <CanvasView projectId={activeProject.id} />
        )}
      </main>

      {/* 3. Panel Derecho: Copiloto & Inspector de Contexto (260px) */}
      <CopilotInspector
        onQuickAction={(actionText) => {
          if (actionText.includes('RF')) {
            setActiveStep('view-reqs');
          } else if (actionText.includes('RLS') || actionText.includes('DDL')) {
            setActiveStep('view-canvas');
          } else {
            setActiveStep('view-chat');
          }
        }}
      />

      {/* Modal de Exportación OKF */}
      <OkfExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
};
