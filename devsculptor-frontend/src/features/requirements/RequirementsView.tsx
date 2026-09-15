import React, { useState, useEffect } from 'react';
import { requirementsService } from '@/services/requirements.service';
import { Requirement, RequirementType } from '@/types/requirement.types';
import { VisionButton } from '@/components/ui/VisionButton';
import { VisionPill } from '@/components/ui/VisionPill';
import { CreateRequirementModal } from './CreateRequirementModal';

interface RequirementsViewProps {
  projectId: string;
  onCountChange?: (count: number) => void;
}

export const RequirementsView: React.FC<RequirementsViewProps> = ({
  projectId,
  onCountChange,
}) => {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadRequirements = async () => {
    setIsLoading(true);
    try {
      const typeParam = filterType === 'ALL' ? undefined : (filterType as RequirementType);
      const data = await requirementsService.getAllByProject(projectId, typeParam);
      setRequirements(data);
      if (onCountChange) onCountChange(data.length);
    } catch {
      // Fallback a lista inicial si la API o proyecto es nuevo
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadRequirements();
    }
  }, [projectId, filterType]);

  const filtered = requirements.filter(
    (r) =>
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = async (requirementId: string) => {
    if (!confirm('¿Deseas eliminar este requisito de la matriz?')) return;
    try {
      await requirementsService.delete(projectId, requirementId);
      const updated = requirements.filter((r) => r.id !== requirementId);
      setRequirements(updated);
      if (onCountChange) onCountChange(updated.length);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full p-4 gap-3 select-none">
      {/* Encabezado */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] shrink-0">
        <div>
          <h2 className="text-xs font-semibold text-white">Matriz de Requisitos (IEEE-830)</h2>
          <p className="text-[10.5px] text-secondary font-mono">
            Parametrizados bajo formato formal y validados con Zod.
          </p>
        </div>
        <VisionButton
          variant="primary"
          icon="add"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
        >
          Nuevo Requisito
        </VisionButton>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="text"
          placeholder="Buscar por código o título..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="vision-input !py-1 text-xs max-w-xs"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="vision-btn text-xs !py-1 bg-black/30"
        >
          <option value="ALL" className="bg-slate-900 text-white">Todos los tipos</option>
          <option value="RF" className="bg-slate-900 text-white">Solo RF (Funcionales)</option>
          <option value="RNF" className="bg-slate-900 text-white">Solo RNF (No Funcionales)</option>
        </select>
        <span className="text-[10.5px] font-mono text-muted ml-auto">
          {filtered.length} {filtered.length === 1 ? 'requisito' : 'requisitos'}
        </span>
      </div>

      {/* Lista de Requisitos */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {isLoading && requirements.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted font-mono">Cargando requisitos...</div>
        ) : filtered.length === 0 ? (
          <div className="vision-card p-8 text-center text-muted text-xs font-mono">
            No se encontraron requisitos para este filtro. Haz clic en "Nuevo Requisito" para comenzar.
          </div>
        ) : (
          filtered.map((req) => (
            <div
              key={req.id}
              className="vision-card p-3 flex flex-col md:flex-row md:items-start justify-between gap-3 hover:border-white/20 transition-all"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs text-white bg-white/[0.06] px-2 py-0.5 rounded-[4px] border border-white/10">
                    {req.code}
                  </span>
                  <VisionPill variant={req.type === 'RF' ? 'amber' : 'cyan'}>
                    {req.type}
                  </VisionPill>
                  <span
                    className={`text-[9.5px] font-mono px-2 py-0.5 rounded-[4px] font-medium ${
                      req.priority === 'HIGH'
                        ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                        : req.priority === 'MEDIUM'
                        ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                        : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                    }`}
                  >
                    PRIORIDAD {req.priority}
                  </span>
                  {req.entity_relation && (
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-[4px] border border-cyan-500/20">
                      Entidad: {req.entity_relation}
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-xs text-white tracking-tight">
                  {req.title}
                </h3>

                {req.description && (
                  <p className="text-[11.5px] text-secondary leading-relaxed">
                    {req.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0 self-end md:self-start">
                <button
                  onClick={() => handleDelete(req.id)}
                  className="vision-btn vision-btn-icon text-muted hover:text-rose-400"
                  title="Eliminar requisito"
                  aria-label="Eliminar requisito"
                >
                  <span className="material-symbols-outlined text-xs">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nuevo Requisito */}
      <CreateRequirementModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        projectId={projectId}
        onCreated={() => loadRequirements()}
      />
    </div>
  );
};
