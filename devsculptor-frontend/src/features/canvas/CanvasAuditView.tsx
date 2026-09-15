import React, { useEffect } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { VisionPill } from '@/components/ui/VisionPill';

interface CanvasAuditViewProps {
  projectId: string;
}

export const CanvasAuditView: React.FC<CanvasAuditViewProps> = ({ projectId }) => {
  const { auditLogs, fetchAuditLogs } = useCanvasStore();

  useEffect(() => {
    if (projectId) {
      fetchAuditLogs(projectId);
    }
  }, [projectId, fetchAuditLogs]);

  return (
    <div className="flex-1 overflow-auto p-4 bg-black/30 fade-in">
      <div className="vision-card overflow-hidden">
        <div className="p-3 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400 text-sm">history</span>
            <h3 className="font-semibold text-xs text-white">
              Historial de Auditoría de Base de Datos (PL/pgSQL Trigger)
            </h3>
          </div>
          <VisionPill variant="cyan">fn_audit_canvas_entities</VisionPill>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-muted">
            No se han registrado operaciones DDL ni mutaciones en esta sesión. Cada inserción, actualización o eliminación de tabla en el canvas activará el trigger atómico.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-muted font-mono text-[10px]">
                <th className="p-2.5">HORA</th>
                <th className="p-2.5">ACCIÓN</th>
                <th className="p-2.5">TABLA AFECTADA</th>
                <th className="p-2.5">USUARIO SESIÓN</th>
                <th className="p-2.5">PAYLOAD CAPTURADO (OLD / NEW)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono text-[11px]">
              {auditLogs.map((log) => {
                const actionColor =
                  log.action === 'INSERT'
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : log.action === 'UPDATE'
                    ? 'text-cyan-400 bg-cyan-500/10'
                    : 'text-rose-400 bg-rose-500/10';

                return (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-2.5 text-muted">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded-[4px] font-bold ${actionColor}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-2.5 text-white font-semibold">{log.table_name}</td>
                    <td className="p-2.5 text-secondary">{log.user_session || 'authenticated_user'}</td>
                    <td className="p-2.5 text-muted max-w-xs truncate">
                      {log.payload_after
                        ? JSON.stringify(log.payload_after)
                        : log.payload_before
                        ? JSON.stringify(log.payload_before)
                        : 'Acción ejecutada'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
