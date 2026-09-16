import React, { useState, useMemo } from 'react';
import { CanvasEntity } from '@/types/canvas.types';

interface CanvasDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  entities: CanvasEntity[];
  onSelectEntity: (id: string) => void;
  onEditEntity: (entity: CanvasEntity) => void;
  onAddTable: () => void;
  onOpenImport: () => void;
  onOpenNormalization: () => void;
}

export const CanvasDrawer: React.FC<CanvasDrawerProps> = ({
  isOpen,
  onToggle,
  entities,
  onSelectEntity,
  onEditEntity,
  onAddTable,
  onOpenImport,
  onOpenNormalization,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [isTablesOpen, setIsTablesOpen] = useState(true);
  const [isRelationsOpen, setIsRelationsOpen] = useState(true);
  const [expandedTableId, setExpandedTableId] = useState<string | null>(null);

  const filteredEntities = entities.filter((e) =>
    e.table_name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  // Extraer todas las relaciones activas del modelo para el panel de conectores
  const activeRelations = useMemo(() => {
    const list: {
      id: string;
      sourceTable: string;
      sourceCol: string;
      targetTable: string;
      targetCol: string;
      cardinality: string;
    }[] = [];

    entities.forEach((ent) => {
      const cols = Array.isArray(ent.columns_json) ? ent.columns_json : [];
      cols.forEach((col) => {
        const targetTable = col.referencesTable || col.references_table;
        if (col.isFk || col.is_fk || targetTable) {
          if (targetTable) {
            list.push({
              id: `${ent.id}-${col.name}`,
              sourceTable: ent.table_name,
              sourceCol: col.name,
              targetTable,
              targetCol: col.referencesColumn || col.references_column || 'id',
              cardinality: col.cardinality || '1:N',
            });
          }
        }
      });
    });

    return list;
  }, [entities]);

  return (
    <>
      {/* Botón Flotante para Abrir / Cerrar Drawer */}
      <button
        onClick={onToggle}
        className={`absolute top-3 left-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all duration-300 shadow-xl ${
          isOpen
            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 translate-x-80 backdrop-blur-xl'
            : 'bg-black/60 text-white/90 border border-white/10 hover:bg-black/80 hover:border-cyan-500/40 backdrop-blur-md'
        }`}
        title={isOpen ? 'Ocultar panel de modelado' : 'Desplegar panel de modelado y herramientas'}
      >
        <span className="material-symbols-outlined text-[14px]">
          {isOpen ? 'chevron_left' : 'view_sidebar'}
        </span>
        <span>{isOpen ? 'Ocultar' : `Modelado (${entities.length})`}</span>
      </button>

      {/* Panel Desplegable (Sliding Drawer) */}
      <div
        className={`absolute top-0 left-0 bottom-0 w-80 z-20 bg-[#0c121e]/95 backdrop-blur-2xl border-r border-white/10 flex flex-col transition-transform duration-300 ease-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabecera del Drawer */}
        <div className="p-3 border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400 text-base">architecture</span>
            <h3 className="text-xs font-semibold text-white tracking-wide">Panel de Modelado</h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
            ERD Studio
          </span>
        </div>

        {/* Barra de Creación y Utilidades Principales */}
        <div className="p-3 border-b border-white/[0.06] bg-black/20 flex flex-col gap-2 shrink-0">
          {/* Botón Principal: Añadir Tabla */}
          <button
            onClick={onAddTable}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 border border-cyan-500/40 text-xs font-mono font-medium text-cyan-300 transition-all shadow-sm group"
          >
            <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">
              add_circle
            </span>
            <span>Añadir Tabla al Lienzo</span>
          </button>

          {/* Botones secundarios: Importar SQL / Auditoría 3FN */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenImport}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-[11px] font-mono text-white/80 transition-colors"
              title="Importar sentencias DDL CREATE TABLE"
            >
              <span className="material-symbols-outlined text-[13px] text-indigo-400">file_upload</span>
              <span>Importar SQL</span>
            </button>

            <button
              onClick={onOpenNormalization}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-[11px] font-mono text-white/80 transition-colors"
              title="Auditoría matemática y heurística 3FN"
            >
              <span className="material-symbols-outlined text-[13px] text-emerald-400">verified</span>
              <span>Auditoría 3FN</span>
            </button>
          </div>
        </div>

        {/* Área Scrolleable con Acordeones Desplegables */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">

          {/* ACORDEÓN 1: Tablas del Modelo (Desplegable hacia abajo) */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
            <button
              onClick={() => setIsTablesOpen(!isTablesOpen)}
              className="w-full p-2.5 flex items-center justify-between hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="material-symbols-outlined text-[14px] text-cyan-400">table_chart</span>
                <span className="text-xs font-mono font-medium text-white truncate">
                  Tablas del Modelo ({entities.length})
                </span>
              </div>
              <span className="material-symbols-outlined text-muted text-sm transition-transform duration-200" style={{ transform: isTablesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </button>

            {isTablesOpen && (
              <div className="p-2 pt-0 border-t border-white/[0.04] space-y-2">
                {/* Buscador de tablas */}
                <div className="relative pt-2">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 text-muted text-[13px] pointer-events-none">
                    search
                  </span>
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Buscar tabla..."
                    className="w-full text-[11px] font-mono bg-black/40 border border-white/10 rounded-md pl-8 pr-2 py-1 text-white placeholder:text-muted focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                {/* Lista de tablas */}
                {filteredEntities.length === 0 ? (
                  <div className="p-3 text-center text-xs font-mono text-muted">
                    {filterQuery ? 'No hay coincidencias' : 'No hay tablas creadas'}
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {filteredEntities.map((entity) => {
                      const cols = Array.isArray(entity.columns_json) ? entity.columns_json : [];
                      const isExpanded = expandedTableId === entity.id;

                      return (
                        <div
                          key={entity.id}
                          className="rounded-lg bg-black/30 border border-white/[0.06] hover:border-cyan-500/30 transition-all overflow-hidden"
                        >
                          <div
                            onClick={() => onSelectEntity(entity.id)}
                            className="p-2 cursor-pointer flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="material-symbols-outlined text-cyan-400 text-xs shrink-0">
                                description
                              </span>
                              <div className="min-w-0">
                                <div className="font-mono text-xs text-white truncate group-hover:text-cyan-300">
                                  {entity.table_name}
                                </div>
                                <div className="text-[9px] font-mono text-muted">
                                  {cols.length} columnas
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedTableId(isExpanded ? null : entity.id);
                                }}
                                className="p-1 rounded hover:bg-white/10 text-muted hover:text-white transition-colors"
                                title="Ver columnas"
                              >
                                <span className="material-symbols-outlined text-[13px]">
                                  {isExpanded ? 'visibility_off' : 'visibility'}
                                </span>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditEntity(entity);
                                }}
                                className="p-1 rounded hover:bg-white/10 text-muted hover:text-cyan-300 transition-colors"
                                title="Editar columnas y relaciones (ALTER TABLE)"
                              >
                                <span className="material-symbols-outlined text-[13px]">tune</span>
                              </button>
                            </div>
                          </div>

                          {/* Vista Previa Desplegable de Columnas */}
                          {isExpanded && (
                            <div className="p-2 pt-1 border-t border-white/[0.04] bg-black/40 space-y-1">
                              {cols.map((col, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-[10px] font-mono px-1 py-0.5 rounded hover:bg-white/[0.02]"
                                >
                                  <div className="flex items-center gap-1 min-w-0">
                                    {col.isPk || col.is_pk ? (
                                      <span className="text-amber-400 font-bold text-[9px]">🔑</span>
                                    ) : col.isFk || col.is_fk ? (
                                      <span className="text-cyan-400 text-[9px]">🔗</span>
                                    ) : (
                                      <span className="w-1 h-1 rounded-full bg-white/20" />
                                    )}
                                    <span className="text-white/90 truncate">{col.name}</span>
                                  </div>
                                  <span className="text-muted text-[9px] shrink-0">{col.type}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ACORDEÓN 2: Conectores & Relaciones ERD (Desplegable hacia abajo) */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
            <button
              onClick={() => setIsRelationsOpen(!isRelationsOpen)}
              className="w-full p-2.5 flex items-center justify-between hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="material-symbols-outlined text-[14px] text-cyan-400">hub</span>
                <span className="text-xs font-mono font-medium text-white truncate">
                  Conectores y Relaciones ({activeRelations.length})
                </span>
              </div>
              <span className="material-symbols-outlined text-muted text-sm transition-transform duration-200" style={{ transform: isRelationsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </button>

            {isRelationsOpen && (
              <div className="p-2.5 pt-1 border-t border-white/[0.04] space-y-2">
                {/* Leyenda Crow's Foot */}
                <div className="p-2 rounded-lg bg-black/40 border border-white/[0.04] space-y-1.5 text-[10px] font-mono">
                  <div className="text-cyan-300 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">info</span>
                    <span>Simbología Crow's Foot (IE)</span>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span>Muchos (FK):</span>
                    <span className="text-cyan-400 font-bold">Pata de Gallo (❯|)</span>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span>Uno (PK):</span>
                    <span className="text-cyan-400 font-bold">Doble Barra (||)</span>
                  </div>
                </div>

                {/* Listado de relaciones activas en el modelo */}
                {activeRelations.length === 0 ? (
                  <div className="p-2 text-center text-[10.5px] font-mono text-muted">
                    No hay relaciones foráneas configuradas en el modelo.
                  </div>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {activeRelations.map((rel) => (
                      <div
                        key={rel.id}
                        className="p-1.5 rounded bg-black/20 border border-white/[0.04] text-[10px] font-mono flex items-center justify-between"
                      >
                        <div className="truncate text-white/90">
                          <span className="text-cyan-300">{rel.sourceTable}</span>
                          <span className="text-muted">.{rel.sourceCol}</span>
                          <span className="text-white/40 px-1">➔</span>
                          <span className="text-indigo-300">{rel.targetTable}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 font-bold shrink-0 ml-1">
                          {rel.cardinality}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-2 rounded bg-indigo-950/20 border border-indigo-500/20 text-[10px] font-mono text-indigo-300/90 leading-tight">
                  💡 Para agregar una relación, edita cualquier tabla con el icono <span className="text-white font-bold">tune</span> y marca una columna como Foreign Key (FK).
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer del Drawer */}
        <div className="p-2.5 border-t border-white/[0.08] bg-black/30 flex items-center justify-between text-[10px] font-mono text-muted shrink-0">
          <span>DevSculptor ERD</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Lienzo Activo
          </span>
        </div>
      </div>
    </>
  );
};
