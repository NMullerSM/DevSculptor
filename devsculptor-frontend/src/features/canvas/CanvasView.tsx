import React, { useState, useEffect } from 'react';
import { useCanvasStore, CanvasSubTab } from '@/stores/useCanvasStore';
import { EntityNode } from './EntityNode';
import { BezierConnectors } from './BezierConnectors';
import { CanvasAuditView } from './CanvasAuditView';
import { CreateEntityModal } from './CreateEntityModal';
import { VisionButton } from '@/components/ui/VisionButton';
import {
  generatePostgreSqlDdl,
  generateTypeScriptDtos,
  generateJsonSchema,
  generatePythonPydantic,
} from './scriptGenerators';

interface CanvasViewProps {
  projectId: string;
}

export const CanvasView: React.FC<CanvasViewProps> = ({ projectId }) => {
  const {
    entities,
    fetchEntities,
    activeSubTab,
    setActiveSubTab,
    zoom,
    zoomIn,
    zoomOut,
    resetZoom,
    selectedEntityId,
    selectEntity,
    updatePosition,
    deleteEntity,
  } = useCanvasStore();

  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchEntities(projectId);
    }
  }, [projectId, fetchEntities]);

  const getCodeContent = () => {
    switch (activeSubTab) {
      case 'sql':
        return generatePostgreSqlDdl(entities);
      case 'ts':
        return generateTypeScriptDtos(entities);
      case 'json':
        return generateJsonSchema(entities);
      case 'py':
        return generatePythonPydantic(entities);
      default:
        return '';
    }
  };

  const handleCopyCode = async () => {
    const code = getCodeContent();
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      // Fallback
    }
  };

  const subtabs: { id: CanvasSubTab; label: string; icon: string }[] = [
    { id: 'erd', label: 'Lienzo ERD', icon: 'schema' },
    { id: 'sql', label: 'PostgreSQL DDL', icon: 'database' },
    { id: 'ts', label: 'TypeScript DTOs', icon: 'code' },
    { id: 'json', label: 'JSON Schema', icon: 'data_object' },
    { id: 'py', label: 'Python Pydantic', icon: 'terminal' },
    { id: 'audit', label: 'Auditoría Triggers', icon: 'history' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden select-none">
      {/* Barra de Subpestañas de Formato */}
      <div className="h-10 px-3 border-b border-white/[0.06] flex items-center justify-between bg-black/20 shrink-0 z-20">
        <div className="flex items-center gap-1 overflow-x-auto">
          {subtabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`vision-btn !py-1 !px-2.5 text-[11px] ${
                activeSubTab === tab.id ? 'vision-btn-primary' : ''
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'erd' && (
            <VisionButton
              size="sm"
              icon="add"
              onClick={() => setIsAddTableOpen(true)}
              className="text-emerald-400 hover:text-emerald-300"
            >
              Añadir Tabla
            </VisionButton>
          )}

          {activeSubTab !== 'erd' && activeSubTab !== 'audit' && (
            <VisionButton
              size="sm"
              icon={copyFeedback ? 'done' : 'content_copy'}
              onClick={handleCopyCode}
              className={copyFeedback ? 'text-emerald-400' : ''}
            >
              {copyFeedback ? 'Copiado' : 'Copiar Código'}
            </VisionButton>
          )}
        </div>
      </div>

      {/* Vista 1: Lienzo Gráfico ERD */}
      {activeSubTab === 'erd' && (
        <div
          id="canvas-visual-area"
          className="flex-1 canvas-grid-bg relative overflow-hidden select-none"
          onClick={() => selectEntity(null)}
        >
          {/* Conectores Bezier SVG */}
          <BezierConnectors entities={entities} zoom={zoom} />

          {/* Área de Nodos Arrastrables con Zoom */}
          <div
            className="absolute inset-0 w-full h-full origin-top-left"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {entities.map((entity) => (
              <EntityNode
                key={entity.id}
                entity={entity}
                zoom={zoom}
                isSelected={selectedEntityId === entity.id}
                onSelect={(id) => selectEntity(id)}
                onPositionChange={(id, x, y) => updatePosition(projectId, id, x, y)}
                onDelete={(id) => {
                  if (confirm(`¿Eliminar la tabla "${entity.table_name}"?`)) {
                    deleteEntity(projectId, id);
                  }
                }}
              />
            ))}
          </div>

          {/* Dock Flotante de Zoom */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
            <div className="vision-dock">
              <button
                onClick={zoomOut}
                className="vision-btn vision-btn-icon text-xs text-muted hover:text-white"
                title="Alejar lienzo"
              >
                <span className="material-symbols-outlined text-xs">remove</span>
              </button>
              <button
                onClick={resetZoom}
                className="font-mono text-[10.5px] text-secondary px-1 hover:text-white"
                title="Restablecer a 100%"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={zoomIn}
                className="vision-btn vision-btn-icon text-xs text-muted hover:text-white"
                title="Acercar lienzo"
              >
                <span className="material-symbols-outlined text-xs">add</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vista 2: Previsualización de Código Multi-Lenguaje */}
      {activeSubTab !== 'erd' && activeSubTab !== 'audit' && (
        <div className="flex-1 overflow-auto p-4 font-mono text-xs text-white leading-relaxed bg-[#0b0f19] fade-in">
          <pre className="whitespace-pre select-text font-mono text-[11.5px] text-white/90">
            {getCodeContent()}
          </pre>
        </div>
      )}

      {/* Vista 3: Visor de Auditoría de Triggers */}
      {activeSubTab === 'audit' && <CanvasAuditView projectId={projectId} />}

      {/* Modal Añadir Tabla */}
      <CreateEntityModal
        isOpen={isAddTableOpen}
        onClose={() => setIsAddTableOpen(false)}
        projectId={projectId}
      />
    </div>
  );
};
