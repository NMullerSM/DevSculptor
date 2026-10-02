import React, { useState } from 'react';
import { FlowSidebar, StudioStep } from './FlowSidebar';
import { CopilotInspector } from './CopilotInspector';
import { ChatConsultantView } from '@/features/chat/ChatConsultantView';
import { RequirementsView } from '@/features/requirements/RequirementsView';
import { DecisionsView } from '@/features/decisions/DecisionsView';
import { CanvasView } from '@/features/canvas/CanvasView';
import { OkfExportModal } from '@/features/export/OkfExportModal';
import { useProjectStore } from '@/stores/useProjectStore';
import { useAiChatStore } from '@/stores/useAiChatStore';
import { useLayoutStore } from '@/stores/useLayoutStore';

export const StudioWorkspace: React.FC = () => {
  const { activeProject } = useProjectStore();
  const {
    isFlowDrawerOpen,
    isCopilotDrawerOpen,
    toggleFlowDrawer,
    toggleCopilotDrawer,
  } = useLayoutStore();

  const [activeStep, setActiveStep] = useState<StudioStep>('view-chat');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [reqsCount, setReqsCount] = useState(0);
  const [adrsCount, setAdrsCount] = useState(0);
  const [isRightPanelExpanded, setIsRightPanelExpanded] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'chat' | 'inspector'>('chat');

  const handleQuickAction = (actionText: string) => {
    if (actionText.includes('Auditoría IA') || actionText.includes('3FN')) {
      setActiveStep('view-chat');
      if (activeProject) {
        useAiChatStore.getState().analyzeSchema(activeProject.id);
      }
    } else if (actionText.includes('RF')) {
      setActiveStep('view-reqs');
    } else if (actionText.includes('RLS') || actionText.includes('DDL')) {
      setActiveStep('view-canvas');
    } else {
      setActiveStep('view-chat');
    }
  };

  if (!activeProject) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-muted text-xs font-mono">
        Selecciona o crea un proyecto en la pestaña "Proyectos" para ingresar al Estudio de Gobernanza.
      </div>
    );
  }

  return (
    <div id="screen-studio" className="flex-1 min-h-0 flex flex-col xl:flex-row gap-2 sm:gap-3 w-full z-10 fade-in relative overflow-hidden">
      {/* 1. Panel Izquierdo Desktop: Flujo Guiado (Visible en pantallas >= 1280px) */}
      <FlowSidebar
        activeStep={activeStep}
        onSelectStep={(step) => setActiveStep(step)}
        onOpenExportModal={() => setIsExportOpen(true)}
        reqsCount={reqsCount}
        adrsCount={adrsCount}
        className="w-[240px] shrink-0 hidden xl:flex"
      />

      {/* 2. Panel Central: Workspace Studio de 4 Vistas Activas (100% en móvil/tablet, flex-1 en desktop) */}
      <main className="vision-window flex-1 flex flex-col min-w-0 relative overflow-hidden h-full">
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

      {/* 3. Panel Derecho Desktop: Copiloto / Inspector (Visible en pantallas >= 1280px) */}
      <aside
        className={`hidden xl:flex flex-col shrink-0 transition-all duration-300 ease-in-out ${
          isRightPanelExpanded
            ? 'w-[33.3vw] max-w-[33.3vw]'
            : activeStep === 'view-chat'
            ? 'w-[260px]'
            : 'w-[320px]'
        }`}
      >
        {activeStep === 'view-chat' ? (
          <div className="relative w-full h-full flex flex-col">
            <div className="absolute top-2.5 right-2.5 z-20">
              <button
                type="button"
                onClick={() => setIsRightPanelExpanded((prev) => !prev)}
                className="vision-btn !p-1 text-muted hover:text-primary text-[10px]"
                title={isRightPanelExpanded ? 'Reducir panel' : 'Expandir panel a 1/3 de pantalla'}
              >
                <span className="material-symbols-outlined text-[13px]">
                  {isRightPanelExpanded ? 'close_fullscreen' : 'open_in_full'}
                </span>
              </button>
            </div>
            <CopilotInspector
              onQuickAction={handleQuickAction}
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="vision-window w-full h-full flex flex-col overflow-hidden">
            {/* Cabecera del Panel con Selector de Pestañas y Control de Ancho */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-glass-subtle bg-black/5 dark:bg-white/[0.02] shrink-0">
              <div className="flex items-center gap-1 bg-black/10 dark:bg-white/[0.04] p-0.5 rounded-lg border border-glass-subtle">
                <button
                  type="button"
                  onClick={() => setRightPanelTab('chat')}
                  className={`px-2 py-0.5 rounded-md text-[10.5px] font-medium transition-all flex items-center gap-1 ${
                    rightPanelTab === 'chat'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">chat_bubble</span>
                  <span>Copiloto IA</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab('inspector')}
                  className={`px-2 py-0.5 rounded-md text-[10.5px] font-medium transition-all flex items-center gap-1 ${
                    rightPanelTab === 'inspector'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">tune</span>
                  <span>Métricas</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsRightPanelExpanded((prev) => !prev)}
                  className="vision-btn !p-1 text-muted hover:text-primary text-[10px]"
                  title={isRightPanelExpanded ? 'Reducir panel' : 'Expandir panel a 1/3 de pantalla'}
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {isRightPanelExpanded ? 'close_fullscreen' : 'open_in_full'}
                  </span>
                </button>
              </div>
            </div>

            {/* Contenido Dinámico: Chat o Inspector */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {rightPanelTab === 'chat' ? (
                <ChatConsultantView
                  isCompact={!isRightPanelExpanded}
                  onNavigateStep={(step) => setActiveStep(step)}
                />
              ) : (
                <CopilotInspector
                  onQuickAction={handleQuickAction}
                  className="w-full h-full !border-none !bg-transparent !p-3"
                />
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Barra de Navegación Rápida Flotante en Móvil y Tablet (< 1280px) */}
      <div className="xl:hidden flex items-center justify-between px-3 py-1.5 vision-window mx-auto w-full shrink-0 z-20 gap-1.5 text-xs shadow-lg">
        <button
          onClick={() => toggleFlowDrawer(true)}
          className="vision-btn !py-1 !px-2 text-[11px] flex items-center gap-1 shrink-0"
          title="Ver todos los pasos"
        >
          <span className="material-symbols-outlined text-[14px]">menu_open</span>
          <span className="hidden sm:inline">Pasos</span>
        </button>

        <div className="flex items-center gap-1 justify-center flex-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveStep('view-chat')}
            className={`vision-btn !py-1 !px-2 text-[11px] flex items-center gap-1 ${
              activeStep === 'view-chat' ? 'vision-btn-primary' : ''
            }`}
            title="Conversación"
          >
            <span className="material-symbols-outlined text-[14px] text-indigo-400">chat_bubble</span>
            <span className="hidden xs:inline">Chat</span>
          </button>
          <button
            onClick={() => setActiveStep('view-reqs')}
            className={`vision-btn !py-1 !px-2 text-[11px] flex items-center gap-1 ${
              activeStep === 'view-reqs' ? 'vision-btn-primary' : ''
            }`}
            title="Requisitos"
          >
            <span className="material-symbols-outlined text-[14px] text-indigo-400">checklist</span>
            <span className="hidden xs:inline">Requisitos</span>
          </button>
          <button
            onClick={() => setActiveStep('view-docs')}
            className={`vision-btn !py-1 !px-2 text-[11px] flex items-center gap-1 ${
              activeStep === 'view-docs' ? 'vision-btn-primary' : ''
            }`}
            title="Documentos"
          >
            <span className="material-symbols-outlined text-[14px] text-indigo-400">description</span>
            <span className="hidden xs:inline">ADRs</span>
          </button>
          <button
            onClick={() => setActiveStep('view-canvas')}
            className={`vision-btn !py-1 !px-2 text-[11px] flex items-center gap-1 ${
              activeStep === 'view-canvas' ? 'vision-btn-primary' : ''
            }`}
            title="Modelador de Código"
          >
            <span className="material-symbols-outlined text-[14px] text-indigo-400">schema</span>
            <span className="hidden xs:inline">Canvas</span>
          </button>
        </div>

        <button
          onClick={() => toggleCopilotDrawer(true)}
          className={`vision-btn !py-1 !px-2 text-[11px] flex items-center gap-1 shrink-0 ${
            isCopilotDrawerOpen ? 'vision-btn-primary' : ''
          }`}
          title="Abrir Copiloto"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="material-symbols-outlined text-[14px]">smart_toy</span>
          <span className="hidden sm:inline">Copiloto</span>
        </button>
      </div>

      {/* Drawer Deslizante Izquierdo (Móvil y Tablet < 1280px) */}
      {isFlowDrawerOpen && (
        <div className="fixed inset-0 z-50 xl:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => toggleFlowDrawer(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full p-2 z-50 animate-slide-right flex flex-col">
            <FlowSidebar
              activeStep={activeStep}
              onSelectStep={(step) => setActiveStep(step)}
              onOpenExportModal={() => setIsExportOpen(true)}
              reqsCount={reqsCount}
              adrsCount={adrsCount}
              onClose={() => toggleFlowDrawer(false)}
              className="w-full h-full shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Drawer Deslizante Derecho (Móvil y Tablet < 1280px) */}
      {isCopilotDrawerOpen && (
        <div className="fixed inset-0 z-50 xl:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => toggleCopilotDrawer(false)}
          />
          <div className="relative w-80 max-w-[85vw] h-full p-2 z-50 animate-slide-left flex flex-col">
            <div className="vision-window w-full h-full flex flex-col overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-3 py-2 border-b border-glass-subtle shrink-0">
                <div className="flex items-center gap-1 bg-black/10 dark:bg-white/[0.04] p-0.5 rounded-lg border border-glass-subtle">
                  <button
                    type="button"
                    onClick={() => setRightPanelTab('chat')}
                    className={`px-2 py-0.5 rounded-md text-[10.5px] font-medium transition-all ${
                      rightPanelTab === 'chat'
                        ? 'bg-indigo-600 text-white'
                        : 'text-secondary hover:text-primary'
                    }`}
                  >
                    Copiloto
                  </button>
                  <button
                    type="button"
                    onClick={() => setRightPanelTab('inspector')}
                    className={`px-2 py-0.5 rounded-md text-[10.5px] font-medium transition-all ${
                      rightPanelTab === 'inspector'
                        ? 'bg-indigo-600 text-white'
                        : 'text-secondary hover:text-primary'
                    }`}
                  >
                    Métricas
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => toggleCopilotDrawer(false)}
                  className="vision-btn !p-1 text-muted hover:text-primary"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {rightPanelTab === 'chat' ? (
                  <ChatConsultantView
                    isCompact={true}
                    onNavigateStep={(step) => {
                      setActiveStep(step);
                      toggleCopilotDrawer(false);
                    }}
                  />
                ) : (
                  <CopilotInspector
                    onQuickAction={handleQuickAction}
                    onClose={() => toggleCopilotDrawer(false)}
                    className="w-full h-full !border-none !bg-transparent !p-3"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exportación OKF */}
      <OkfExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
};
