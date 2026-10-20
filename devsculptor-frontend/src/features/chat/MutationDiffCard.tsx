import React from 'react';
import { VisionPill } from '@/components/ui/VisionPill';
import { VisionButton } from '@/components/ui/VisionButton';
import {
  AiEntityMutation,
  AiRequirementMutation,
  AiDecisionMutation,
  AiDiagramMutation,
} from '@/types/ai.types';

export interface MutationDiffCardProps {
  mutationKey: string;
  type: 'entity' | 'requirement' | 'decision' | 'diagram';
  entityMutation?: AiEntityMutation;
  requirementMutation?: AiRequirementMutation;
  decisionMutation?: AiDecisionMutation;
  diagramMutation?: AiDiagramMutation;
  status: 'authorized' | 'rejected' | null;
  onAuthorize: () => Promise<void> | void;
  onReject: () => void;
  isProcessing?: boolean;
}

export const MutationDiffCard: React.FC<MutationDiffCardProps> = ({
  type,
  entityMutation,
  requirementMutation,
  decisionMutation,
  diagramMutation,
  status,
  onAuthorize,
  onReject,
  isProcessing = false,
}) => {
  const action =
    entityMutation?.action ||
    requirementMutation?.action ||
    decisionMutation?.action ||
    diagramMutation?.action ||
    'UPDATE';

  const actionVariant =
    action === 'DELETE' ? 'rose' : action === 'CREATE' ? 'emerald' : 'amber';

  const actionIcon =
    action === 'DELETE' ? 'delete_forever' : action === 'CREATE' ? 'add_circle' : 'build';

  const targetName =
    entityMutation?.targetTableName ||
    requirementMutation?.targetCode ||
    decisionMutation?.targetCode ||
    diagramMutation?.targetCode ||
    diagramMutation?.targetTitle ||
    'Artefacto';

  const rationale =
    entityMutation?.rationale ||
    requirementMutation?.rationale ||
    decisionMutation?.rationale ||
    diagramMutation?.rationale ||
    'Modificación arquitectónica solicitada.';

  return (
    <div className="p-3 rounded-[8px] bg-black/15 dark:bg-white/[0.04] border border-amber-500/30 dark:border-amber-500/25 shadow-sm text-[11px] space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-glass-subtle pb-2">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="material-symbols-outlined text-[14px] text-amber-400">
            {type === 'entity' ? 'table_chart' : type === 'requirement' ? 'rule' : type === 'decision' ? 'gavel' : 'schema'}
          </span>
          <span className="font-mono font-bold text-primary truncate">
            {type === 'entity' && `Tabla: ${targetName}`}
            {type === 'requirement' && `Requisito: ${targetName}`}
            {type === 'decision' && `ADR: ${targetName}`}
            {type === 'diagram' && `Diagrama: ${targetName}`}
          </span>
          {entityMutation?.renameTableTo && (
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
              {entityMutation.renameTableTo}
            </span>
          )}
        </div>
        <VisionPill variant={actionVariant} className="text-[8.5px] px-1.5 py-0.5 shrink-0 flex items-center gap-1 font-mono">
          <span className="material-symbols-outlined text-[10px]">{actionIcon}</span>
          {action}
        </VisionPill>
      </div>

      {/* Rationale */}
      <p className="text-[11px] text-secondary leading-relaxed italic">
        "{rationale}"
      </p>

      {/* Column Mutations List (For Entities) */}
      {entityMutation?.columnMutations && entityMutation.columnMutations.length > 0 && (
        <div className="space-y-1 bg-black/20 dark:bg-black/30 p-2 rounded-[6px] border border-glass-subtle font-mono text-[10px]">
          <div className="text-[9px] uppercase tracking-wider text-muted font-bold mb-1">
            Cambios de Columnas Propuestos:
          </div>
          {entityMutation.columnMutations.map((cm, idx) => {
            const isAdd = cm.type === 'ADD';
            const isDrop = cm.type === 'DROP';
            const isMod = cm.type === 'MODIFY';

            return (
              <div
                key={idx}
                className={`flex items-center justify-between px-2 py-1 rounded ${
                  isAdd
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : isDrop
                    ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[11px]">
                    {isAdd && '+'}
                    {isDrop && '-'}
                    {isMod && '~'}
                  </span>
                  <span>{cm.type}</span>
                  <span className="font-semibold text-primary">{cm.column.name}</span>
                  {cm.column.type && !isDrop && (
                    <span className="text-muted text-[9px]">({cm.column.type})</span>
                  )}
                  {cm.column.isPk && <span className="text-amber-400 font-bold">[PK]</span>}
                  {cm.column.isFk && cm.column.referencesTable && (
                    <span className="text-indigo-400">[FK -&gt; {cm.column.referencesTable}]</span>
                  )}
                </div>
                {cm.previousColumnName && (
                  <span className="text-muted text-[9px]">
                    (anterior: {cm.previousColumnName})
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Requirements Updated Fields */}
      {requirementMutation?.updatedFields && (
        <div className="bg-black/20 dark:bg-black/30 p-2 rounded-[6px] border border-glass-subtle font-mono text-[10px] space-y-1">
          <div className="text-[9px] uppercase tracking-wider text-muted font-bold">
            Campos Actualizados:
          </div>
          {requirementMutation.updatedFields.title && (
            <div><span className="text-muted">Título:</span> {requirementMutation.updatedFields.title}</div>
          )}
          {requirementMutation.updatedFields.type && (
            <div><span className="text-muted">Tipo:</span> {requirementMutation.updatedFields.type}</div>
          )}
          {requirementMutation.updatedFields.priority && (
            <div><span className="text-muted">Prioridad:</span> {requirementMutation.updatedFields.priority}</div>
          )}
          {requirementMutation.updatedFields.description && (
            <div><span className="text-muted">Detalle:</span> {requirementMutation.updatedFields.description}</div>
          )}
        </div>
      )}

      {/* Decision Updated Fields */}
      {decisionMutation?.updatedFields && (
        <div className="bg-black/20 dark:bg-black/30 p-2 rounded-[6px] border border-glass-subtle font-mono text-[10px] space-y-1">
          <div className="text-[9px] uppercase tracking-wider text-muted font-bold">
            Detalles Actualizados:
          </div>
          {decisionMutation.updatedFields.title && (
            <div><span className="text-muted">Título:</span> {decisionMutation.updatedFields.title}</div>
          )}
          {decisionMutation.updatedFields.decision && (
            <div><span className="text-muted">Decisión:</span> {decisionMutation.updatedFields.decision}</div>
          )}
        </div>
      )}

      {/* Footer Controls / Status */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[9.5px] font-mono text-muted flex items-center gap-1">
          <span className="material-symbols-outlined text-[11px]">verified_user</span>
          Gobernanza Human-in-the-Loop
        </span>

        {status === 'authorized' ? (
          <div className="flex items-center gap-1 text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
            <span className="material-symbols-outlined text-[12px]">check_circle</span>
            <span>Mutación Autorizada</span>
          </div>
        ) : status === 'rejected' ? (
          <div className="flex items-center gap-1 text-rose-400 font-mono text-[10px] bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/20">
            <span className="material-symbols-outlined text-[12px]">cancel</span>
            <span>Mutación Rechazada</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onReject}
              disabled={isProcessing}
              className="text-[10px] font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 px-2 py-1 rounded transition-colors cursor-pointer"
            >
              ✕ Rechazar
            </button>
            <VisionButton
              variant="primary"
              size="sm"
              icon="check"
              onClick={onAuthorize}
              disabled={isProcessing}
              className="text-[10px] font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm"
            >
              ✓ Autorizar
            </VisionButton>
          </div>
        )}
      </div>
    </div>
  );
};
