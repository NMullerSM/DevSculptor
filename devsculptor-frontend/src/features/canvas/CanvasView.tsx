import React, { useState, useEffect, useRef } from 'react';
import { useCanvasStore, CanvasSubTab } from '@/stores/useCanvasStore';
import { EntityNode } from './EntityNode';
import { BezierConnectors } from './BezierConnectors';
import { CanvasAuditView } from './CanvasAuditView';
import { CreateEntityModal } from './CreateEntityModal';
import { EditEntityModal } from './EditEntityModal';
import { CanvasDrawer } from './CanvasDrawer';
import { SqlImportModal } from './SqlImportModal';
import { NormalizationCheckerModal } from './NormalizationCheckerModal';
import { VisionButton } from '@/components/ui/VisionButton';
import { VisionCombobox } from '@/components/ui/VisionCombobox';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { CanvasEntity } from '@/types/canvas.types';
import {
  generatePostgreSqlDdl,
  generateMySqlDdl,
  generateSqliteDdl,
  generateOracleDdl,
  generateTypeScriptDtos,
  generateJsonSchema,
  generatePythonPydantic,
  SqlDialect,
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
    setTransientPosition,
    updatePosition,
    deleteEntity,
  } = useCanvasStore();

  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<CanvasEntity | null>(null);
  const [entityToDelete, setEntityToDelete] = useState<CanvasEntity | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isNormalizationOpen, setIsNormalizationOpen] = useState(false);
  const [sqlDialect, setSqlDialect] = useState<SqlDialect>('postgres');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projectId) {
      fetchEntities(projectId);
    }
  }, [projectId, fetchEntities]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!canvasContainerRef.current) return;
    if (!document.fullscreenElement) {
      canvasContainerRef.current.requestFullscreen?.().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        setIsFullscreen((prev) => !prev);
      });
    } else {
      document.exitFullscreen?.().then(() => {
        setIsFullscreen(false);
      }).catch(() => {
        setIsFullscreen(false);
      });
    }
  };

  const getCodeContent = () => {
    switch (activeSubTab) {
      case 'sql':
        if (sqlDialect === 'mysql') return generateMySqlDdl(entities);
        if (sqlDialect === 'sqlite') return generateSqliteDdl(entities);
        if (sqlDialect === 'oracle') return generateOracleDdl(entities);
        return generatePostgreSqlDdl(entities);
      case 'ts':
        return generateTypeScriptDtos(entities);
      case 'json':
        return generateJsonSchema(entities);
      case 'py':
        return generatePythonPydantic(entities);
      default:
        // Si no está en una pestaña de código pero se solicita, compilar DDL del dialecto activo
        if (sqlDialect === 'mysql') return generateMySqlDdl(entities);
        if (sqlDialect === 'sqlite') return generateSqliteDdl(entities);
        if (sqlDialect === 'oracle') return generateOracleDdl(entities);
        return generatePostgreSqlDdl(entities);
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

  const handleDownloadCode = () => {
    const code = getCodeContent();
    if (!code) return;
    const ext = activeSubTab === 'sql' ? 'sql' : activeSubTab === 'ts' ? 'ts' : activeSubTab === 'json' ? 'json' : 'py';
    const filename = activeSubTab === 'sql' ? `schema_ddl_${sqlDialect}.sql` : `schema_export.${ext}`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const subtabs: { id: CanvasSubTab; label: string; icon: string }[] = [
    { id: 'erd', label: 'Lienzo ERD', icon: 'schema' },
    { id: 'sql', label: 'DDL Multi-Motor', icon: 'database' },
    { id: 'ts', label: 'TypeScript DTOs', icon: 'code' },
    { id: 'json', label: 'JSON Schema', icon: 'data_object' },
    { id: 'py', label: 'Python Pydantic', icon: 'terminal' },
    { id: 'audit', label: 'Auditoría Triggers', icon: 'history' },
  ];

  return (
    <div
      ref={canvasContainerRef}
      className={`flex-1 flex flex-col h-full relative overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-0 z-50 bg-[#06080d] p-3' : ''
      }`}
    >
      {/* Barra Superior de Subpestañas */}
      <div className="min-h-10 py-1.5 px-2 sm:px-3 border-b border-glass-subtle flex items-center justify-between gap-2 bg-black/5 dark:bg-black/20 shrink-0 z-20">
        {/* Modo Combobox en Pantallas Pequeñas y Tablets (< xl) */}
        <div className="xl:hidden flex items-center gap-1.5 flex-1 min-w-0">
          <VisionCombobox
            value={activeSubTab}
            options={subtabs}
            onChange={(val) => setActiveSubTab(val as CanvasSubTab)}
            className="w-full max-w-[220px] sm:max-w-[240px]"
            ariaLabel="Seleccionar vista de canvas"
          />
        </div>

        {/* Modo Botones Desplegados en Pantallas Laptop, Desktop y Ultra-Wide (>= xl) */}
        <div className="hidden xl:flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {subtabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`vision-btn !py-1 !px-2.5 text-[11px] shrink-0 cursor-pointer ${
                activeSubTab === tab.id ? 'vision-btn-primary' : ''
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Lado Derecho: Selector de Motor y Acciones */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Selector de Dialecto Multi-Motor cuando está en SQL */}
          {activeSubTab === 'sql' && (
            <>
              {/* Combobox de Motor en móvil y tablet (< xl) */}
              <div className="xl:hidden">
                <VisionCombobox
                  value={sqlDialect}
                  labelPrefix="Motor: "
                  options={[
                    { id: 'postgres', label: 'PostgreSQL' },
                    { id: 'mysql', label: 'MySQL' },
                    { id: 'sqlite', label: 'SQLite' },
                    { id: 'oracle', label: 'Oracle 21c' },
                  ]}
                  onChange={(d) => setSqlDialect(d as SqlDialect)}
                  ariaLabel="Seleccionar motor de base de datos"
                />
              </div>

              {/* Botones Desplegados de Motor en laptops y pantallas grandes (>= xl) */}
              <div className="hidden xl:flex items-center gap-1 bg-[var(--glass-card)] border border-glass-subtle rounded-lg p-0.5 font-mono text-[10.5px]">
                <span className="text-muted px-1 text-[10px]">Motor:</span>
                {(['postgres', 'mysql', 'sqlite', 'oracle'] as SqlDialect[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setSqlDialect(d)}
                    className={`px-2 py-0.5 rounded capitalize transition-colors cursor-pointer ${
                      sqlDialect === d
                        ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-bold border border-cyan-500/40'
                        : 'text-muted hover:text-primary'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </>
          )}

          {activeSubTab === 'erd' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] font-mono text-muted bg-[var(--glass-card)] px-2 py-0.5 rounded border border-glass-subtle hidden sm:inline-block">
                {entities.length} {entities.length === 1 ? 'tabla' : 'tablas'}
              </span>
              {!isDrawerOpen && (
                <VisionButton
                  size="sm"
                  icon="view_sidebar"
                  onClick={() => setIsDrawerOpen(true)}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  Modelado
                </VisionButton>
              )}
            </div>
          )}

          {activeSubTab !== 'erd' && activeSubTab !== 'audit' && (
            <div className="flex items-center gap-1.5">
              <VisionButton
                size="sm"
                icon={copyFeedback ? 'done' : 'content_copy'}
                onClick={handleCopyCode}
                className={copyFeedback ? 'text-emerald-400' : ''}
              >
                <span className="hidden xs:inline">{copyFeedback ? 'Copiado' : 'Copiar Código'}</span>
                <span className="xs:hidden">{copyFeedback ? 'Listo' : 'Copiar'}</span>
              </VisionButton>
              <VisionButton
                size="sm"
                variant="secondary"
                icon="download"
                onClick={handleDownloadCode}
                title="Descargar archivo directamente a tu equipo"
              >
                <span className="hidden xs:inline">Descargar</span>
              </VisionButton>
            </div>
          )}

          {/* Botón Universal de Pantalla Completa para el Modelador */}
          <VisionButton
            size="sm"
            variant="secondary"
            icon={isFullscreen ? 'fullscreen_exit' : 'open_in_full'}
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Expandir modelador a pantalla completa'}
            className="!px-2"
          >
            <span className="hidden md:inline">{isFullscreen ? 'Salir' : 'Pantalla Completa'}</span>
          </VisionButton>
        </div>
      </div>

      {/* Vista 1: Lienzo Gráfico ERD */}
      {activeSubTab === 'erd' && (
        <div
          id="canvas-visual-area"
          className="flex-1 canvas-grid-bg relative overflow-hidden select-none"
          onClick={() => selectEntity(null)}
        >
          {/* Drawer Lateral Retráctil del Lienzo */}
          <CanvasDrawer
            isOpen={isDrawerOpen}
            onToggle={() => setIsDrawerOpen(!isDrawerOpen)}
            entities={entities}
            onSelectEntity={(id) => selectEntity(id)}
            onEditEntity={(entity) => setEditingEntity(entity)}
            onDeleteEntity={(id) => {
              const target = entities.find((e) => e.id === id);
              if (target) setEntityToDelete(target);
            }}
            onAddTable={() => setIsAddTableOpen(true)}
            onOpenImport={() => setIsImportOpen(true)}
            onOpenNormalization={() => setIsNormalizationOpen(true)}
          />

          {/* Contenedor Unificado de Mundo Virtual con Zoom y Coordenadas Compartidas */}
          <div
            id="canvas-world-transform"
            className="absolute inset-0 origin-top-left pointer-events-auto"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: '0 0',
              width: '100%',
              height: '100%',
            }}
          >
            {/* Conectores Bezier SVG con Badges de Cardinalidad */}
            <BezierConnectors entities={entities} zoom={zoom} />

            {/* Nodos de Entidades */}
            {entities.map((entity) => (
              <EntityNode
                key={entity.id}
                entity={entity}
                zoom={zoom}
                isSelected={selectedEntityId === entity.id}
                onSelect={(id) => selectEntity(id)}
                onDragMove={(id, x, y) => setTransientPosition(id, x, y)}
                onPositionChange={(id, x, y) => updatePosition(projectId, id, x, y)}
                onEdit={(ent) => setEditingEntity(ent)}
                onDelete={(id) => {
                  const target = entities.find((e) => e.id === id);
                  if (target) setEntityToDelete(target);
                }}
              />
            ))}
          </div>

          {/* Dock Flotante de Zoom */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
            <div className="vision-dock">
              <button
                onClick={zoomOut}
                className="vision-btn vision-btn-icon text-xs text-muted hover:text-primary"
                title="Alejar lienzo"
              >
                <span className="material-symbols-outlined text-xs">remove</span>
              </button>
              <button
                onClick={resetZoom}
                className="font-mono text-[10.5px] text-secondary px-1 hover:text-primary"
                title="Restablecer zoom a 100%"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={zoomIn}
                className="vision-btn vision-btn-icon text-xs text-muted hover:text-primary"
                title="Acercar lienzo"
              >
                <span className="material-symbols-outlined text-xs">add</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vista 2: Previsualización de Código Multi-Lenguaje y Multi-Dialecto */}
      {activeSubTab !== 'erd' && activeSubTab !== 'audit' && (
        <div className="flex-1 overflow-auto p-4 font-mono text-xs text-primary leading-relaxed bg-[var(--glass-code)] fade-in">
          <pre className="whitespace-pre select-text font-mono text-[11.5px] text-primary">
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

      {/* Modal Editar / Alterar Tabla (ALTER TABLE) */}
      <EditEntityModal
        isOpen={Boolean(editingEntity)}
        onClose={() => setEditingEntity(null)}
        entity={editingEntity}
        projectId={projectId}
      />

      {/* Modal Importar Script SQL */}
      <SqlImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        projectId={projectId}
      />

      {/* Modal Validador 3FN */}
      <NormalizationCheckerModal
        isOpen={isNormalizationOpen}
        onClose={() => setIsNormalizationOpen(false)}
        entities={entities}
      />

      {/* Modal de Confirmación para Eliminar Tabla */}
      <ConfirmModal
        isOpen={Boolean(entityToDelete)}
        title="Eliminar Tabla del Esquema"
        description={`¿Estás seguro de que deseas eliminar permanentemente la tabla "${entityToDelete?.table_name}"? Se perderán las columnas asociadas y las relaciones de clave foránea.`}
        confirmText="Eliminar Tabla"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={async () => {
          if (entityToDelete) {
            await deleteEntity(projectId, entityToDelete.id);
            setEntityToDelete(null);
          }
        }}
        onClose={() => setEntityToDelete(null)}
      />
    </div>
  );
};
