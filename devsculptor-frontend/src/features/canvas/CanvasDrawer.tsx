import React, { useState } from 'react';
import { CanvasEntity } from '@/types/canvas.types';

interface CanvasDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  entities: CanvasEntity[];
  onSelectEntity: (id: string) => void;
  onEditEntity: (entity: CanvasEntity) => void;
  onAddQuickTemplate: (templateName: string) => void;
  onOpenImport: () => void;
  onOpenNormalization: () => void;
}

const TEMPLATES = [
  {
    id: 'auth',
    name: 'Usuarios & Auth',
    desc: 'users con email, hash y roles',
    icon: 'manage_accounts',
    badge: 'Seguridad',
  },
  {
    id: 'orders',
    name: 'Órdenes de Compra',
    desc: 'orders con user_id y totales',
    icon: 'shopping_bag',
    badge: 'Transaccional',
  },
  {
    id: 'products',
    name: 'Catálogo Productos',
    desc: 'products con sku, precio y stock',
    icon: 'inventory_2',
    badge: 'Catálogo',
  },
  {
    id: 'audit',
    name: 'Auditoría & Logs',
    desc: 'audit_logs con payload JSONB',
    icon: 'shield',
    badge: 'Gobernanza',
  },
];

export const CanvasDrawer: React.FC<CanvasDrawerProps> = ({
  isOpen,
  onToggle,
  entities,
  onSelectEntity,
  onEditEntity,
  onAddQuickTemplate,
  onOpenImport,
  onOpenNormalization,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredEntities = entities.filter((e) =>
    e.table_name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <>
      {/* Botón Flotante para Abrir / Cerrar Drawer */}
      <button
        onClick={onToggle}
        className={`absolute top-3 left-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all duration-300 shadow-xl ${
          isOpen
            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 translate-x-72 backdrop-blur-xl'
            : 'bg-black/60 text-white/90 border border-white/10 hover:bg-black/80 hover:border-cyan-500/40 backdrop-blur-md'
        }`}
        title={isOpen ? 'Ocultar panel de tablas' : 'Desplegar catálogo de tablas y utilidades'}
      >
        <span className="material-symbols-outlined text-[14px]">
          {isOpen ? 'chevron_left' : 'view_sidebar'}
        </span>
        <span>{isOpen ? 'Ocultar' : `Tablas (${entities.length})`}</span>
      </button>

      {/* Panel Desplegable (Sliding Drawer) */}
      <div
        className={`absolute top-0 left-0 bottom-0 w-72 z-20 bg-[#0c121e]/90 backdrop-blur-2xl border-r border-white/10 flex flex-col transition-transform duration-300 ease-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabecera del Drawer */}
        <div className="p-3 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400 text-base">dashboard_customize</span>
            <h3 className="text-xs font-semibold text-white tracking-wide">Panel de Modelado</h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
            ERD Studio
          </span>
        </div>

        {/* Herramientas de Acción Rápida (Importar SQL / 3FN) */}
        <div className="p-2.5 border-b border-white/[0.06] bg-black/20 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenImport}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-[11px] font-mono text-indigo-300 transition-colors"
              title="Importar script DDL existente"
            >
              <span className="material-symbols-outlined text-[13px]">file_upload</span>
              <span>Importar SQL</span>
            </button>

            <button
              onClick={onOpenNormalization}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-[11px] font-mono text-emerald-300 transition-colors"
              title="Analizar cumplimiento de las 3 Formas Normales"
            >
              <span className="material-symbols-outlined text-[13px]">verified</span>
              <span>Auditoría 3FN</span>
            </button>
          </div>
        </div>

        {/* Buscador de Tablas */}
        <div className="p-2.5 border-b border-white/[0.06]">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-muted text-[13px]">
              search
            </span>
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filtrar tablas..."
              className="w-full text-[11px] font-mono bg-black/30 border border-white/10 rounded-lg pl-8 pr-2 py-1 text-white placeholder:text-muted focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        {/* Lista de Tablas Existentes */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted px-1 pt-1">
            Tablas en el Lienzo ({filteredEntities.length})
          </div>

          {filteredEntities.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted font-mono">
              {filterQuery ? 'No coinciden tablas' : 'No hay tablas aún en el lienzo'}
            </div>
          ) : (
            filteredEntities.map((entity) => {
              const colCount = Array.isArray(entity.columns_json) ? entity.columns_json.length : 0;
              const fkCount = Array.isArray(entity.columns_json)
                ? entity.columns_json.filter((c) => c.isFk || c.is_fk).length
                : 0;

              return (
                <div
                  key={entity.id}
                  onClick={() => onSelectEntity(entity.id)}
                  className="group p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] hover:border-cyan-500/30 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[13px] text-cyan-400 shrink-0">
                      table_chart
                    </span>
                    <div className="min-w-0">
                      <div className="font-mono text-xs text-white truncate group-hover:text-cyan-300">
                        {entity.table_name}
                      </div>
                      <div className="text-[9.5px] font-mono text-muted flex items-center gap-1.5">
                        <span>{colCount} cols</span>
                        {fkCount > 0 && <span className="text-cyan-400">· {fkCount} FKs</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEntity(entity);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-muted hover:text-white transition-opacity"
                    title="Editar tabla (ALTER TABLE)"
                  >
                    <span className="material-symbols-outlined text-[13px]">tune</span>
                  </button>
                </div>
              );
            })
          )}

          {/* Plantillas Rápidas */}
          <div className="pt-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted px-1 pb-1">
              Plantillas Rápidas
            </div>
            <div className="space-y-1.5">
              {TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-white/15 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[14px] text-indigo-400 shrink-0">
                      {tmpl.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium text-white truncate">{tmpl.name}</div>
                      <div className="text-[9px] text-muted truncate">{tmpl.desc}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onAddQuickTemplate(tmpl.id)}
                    className="text-[10px] font-mono px-2 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition-colors shrink-0"
                  >
                    + Insertar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer del Drawer */}
        <div className="p-2.5 border-t border-white/[0.08] bg-black/30 flex items-center justify-between text-[10.5px] font-mono text-muted">
          <span>DevSculptor v0.3.0</span>
          <span className="text-emerald-400">● Motor Listo</span>
        </div>
      </div>
    </>
  );
};
