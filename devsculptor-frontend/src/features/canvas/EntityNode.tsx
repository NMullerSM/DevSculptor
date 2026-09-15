import React, { useRef, useState, useEffect } from 'react';
import { CanvasEntity } from '@/types/canvas.types';

interface EntityNodeProps {
  entity: CanvasEntity;
  isSelected: boolean;
  zoom: number;
  onSelect: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
}

export const EntityNode: React.FC<EntityNodeProps> = ({
  entity,
  isSelected,
  zoom,
  onSelect,
  onPositionChange,
  onDelete,
}) => {
  const [pos, setPos] = useState({ x: entity.position_x, y: entity.position_y });
  const isDragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, initialX: 0, initialY: 0 });

  useEffect(() => {
    setPos({ x: entity.position_x, y: entity.position_y });
  }, [entity.position_x, entity.position_y]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    onSelect(entity.id);
    isDragging.current = true;
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: pos.x,
      initialY: pos.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = (moveEvent.clientX - dragStart.current.mouseX) / zoom;
      const dy = (moveEvent.clientY - dragStart.current.mouseY) / zoom;
      const nextX = Math.round(dragStart.current.initialX + dx);
      const nextY = Math.round(dragStart.current.initialY + dy);
      setPos({ x: nextX, y: nextY });
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        onPositionChange(entity.id, pos.x, pos.y);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const columns = Array.isArray(entity.columns_json) ? entity.columns_json : [];

  return (
    <div
      id={`erd-node-${entity.table_name}`}
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
      }}
      onMouseDown={handleMouseDown}
      className={`erd-node ${isSelected ? 'is-selected' : ''}`}
    >
      {/* Cabecera de Tabla */}
      <div className="erd-node-header">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="material-symbols-outlined text-[13px] text-cyan-400">table_chart</span>
          <span className="font-mono font-bold text-xs text-white truncate">
            {entity.table_name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-[3px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            RLS
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(entity.id);
            }}
            className="text-muted hover:text-rose-400 p-0.5 rounded transition-colors"
            title="Eliminar tabla"
          >
            <span className="material-symbols-outlined text-[11px]">close</span>
          </button>
        </div>
      </div>

      {/* Filas de Atributos */}
      <div className="erd-node-body">
        {columns.map((col, index) => {
          return (
            <div key={index} className="erd-row">
              <div className="flex items-center gap-1.5 min-w-0">
                {col.isPk ? (
                  <span className="text-amber-400 font-bold text-[10px]">🔑</span>
                ) : col.isFk ? (
                  <span className="text-cyan-400 text-[10px]">🔗</span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                )}
                <span
                  className={`truncate ${
                    col.isPk
                      ? 'text-amber-300 font-semibold'
                      : col.isFk
                      ? 'text-cyan-300'
                      : 'text-white/90'
                  }`}
                >
                  {col.name}
                </span>
              </div>
              <span className="text-[9.5px] text-muted font-mono shrink-0 ml-2">
                {col.type}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
