import React, { useEffect, useState } from 'react';
import { useAdminStore } from '@/stores/useAdminStore';
import { AuditLogEntry } from '@/types/admin.types';
import { VisionModal } from '@/components/ui/VisionModal';

export const AuditLogsTab: React.FC = () => {
  const {
    auditLogs,
    auditFilterEntity,
    isLoading,
    error,
    fetchAuditLogs,
    setAuditFilterEntity,
  } = useAdminStore();

  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    fetchAuditLogs(auditFilterEntity || undefined);
  }, [fetchAuditLogs, auditFilterEntity]);

  const entityFilters = [
    { label: 'Todas las Entidades', value: '' },
    { label: 'Proyectos', value: 'projects' },
    { label: 'Requerimientos', value: 'requirements' },
    { label: 'Entidades Canvas', value: 'entities' },
    { label: 'Bóveda Global', value: 'global_vault_templates' },
    { label: 'Usuarios', value: 'users' },
  ];

  const getActionBadge = (action: string) => {
    switch (action.toUpperCase()) {
      case 'INSERT':
        return (
          <span className="px-2 py-0.5 rounded-[4px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-semibold">
            INSERT
          </span>
        );
      case 'UPDATE':
        return (
          <span className="px-2 py-0.5 rounded-[4px] bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] font-semibold">
            UPDATE
          </span>
        );
      case 'DELETE':
        return (
          <span className="px-2 py-0.5 rounded-[4px] bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono text-[10px] font-semibold">
            DELETE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-[4px] bg-white/10 border border-white/20 text-muted font-mono text-[10px]">
            {action}
          </span>
        );
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden pr-1">
      {/* Cabecera y Filtros */}
      <div className="flex flex-wrap items-center justify-between pb-2 border-b border-glass-subtle gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-400 text-base">receipt_long</span>
          <div>
            <h3 className="font-semibold text-xs text-primary tracking-tight">
              Trazabilidad y Auditoría Relacional Transversal
            </h3>
            <p className="text-[10px] text-muted font-mono">
              Registro inmutable de mutaciones en PostgreSQL ({auditLogs.length} eventos recuperados)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de Filtro de Entidad */}
          <div className="flex items-center gap-1 font-mono text-xs">
            <span className="text-muted text-[11px]">Entidad:</span>
            <select
              value={auditFilterEntity}
              onChange={(e) => setAuditFilterEntity(e.target.value)}
              className="bg-black/20 dark:bg-white/[0.04] border border-glass-subtle rounded-[6px] px-2 py-1 text-xs text-primary outline-none font-mono"
            >
              {entityFilters.map((f) => (
                <option key={f.value} value={f.value} className="bg-[#12141a] text-white">
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchAuditLogs(auditFilterEntity || undefined)}
            disabled={isLoading}
            className="vision-btn !py-1 !px-2 text-[11px] flex items-center gap-1"
            title="Refrescar auditoría"
          >
            <span className={`material-symbols-outlined text-xs ${isLoading ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-[6px] bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Tabla de Logs de Auditoría */}
      <div className="flex-1 vision-card overflow-hidden flex flex-col min-h-0 border border-glass-subtle">
        <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black/30 dark:bg-white/[0.03] text-muted text-[10.5px] uppercase tracking-wider sticky top-0 backdrop-blur-md border-b border-glass-subtle z-10">
              <tr>
                <th className="py-2.5 px-3">Fecha y Hora</th>
                <th className="py-2.5 px-3">Acción</th>
                <th className="py-2.5 px-3">Entidad</th>
                <th className="py-2.5 px-3">ID Entidad</th>
                <th className="py-2.5 px-3">Actor / Usuario</th>
                <th className="py-2.5 px-3 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-subtle">
              {isLoading && auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    <span className="material-symbols-outlined text-base animate-spin mr-2 align-middle">
                      progress_activity
                    </span>
                    Cargando eventos de auditoría...
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    No se encontraron registros de auditoría para esta consulta.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => {
                  const logDate = log.created_at || log.timestamp || '';
                  const entityName = log.entity_name || log.entity_type || 'Entidad';
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                      onClick={() => setSelectedEntry(log)}
                    >
                      <td className="py-2 px-3 text-[11px] text-muted whitespace-nowrap">
                        {formatDate(logDate)}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">{getActionBadge(log.action)}</td>
                      <td className="py-2 px-3 font-semibold text-primary">{entityName}</td>
                      <td className="py-2 px-3 text-muted/80 text-[10px] truncate max-w-[120px]">
                        {log.entity_id}
                      </td>
                      <td className="py-2 px-3 text-cyan-300 text-[11px] truncate max-w-[180px]">
                        {log.user_email || log.user_id || 'Sistema'}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEntry(log);
                          }}
                          className="vision-btn !py-0.5 !px-2 text-[10px] text-indigo-300 hover:text-white"
                        >
                          Inspeccionar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle de Auditoría e Inspección JSON */}
      {selectedEntry && (
        <VisionModal
          isOpen={Boolean(selectedEntry)}
          onClose={() => setSelectedEntry(null)}
          title={`Evento de Auditoría: ${selectedEntry.action} en ${selectedEntry.entity_name || selectedEntry.entity_type}`}
          description={`ID: ${selectedEntry.id} • ${formatDate(selectedEntry.created_at || selectedEntry.timestamp || '')}`}
          icon="receipt_long"
          size="2xl"
        >
          <div className="flex flex-col gap-3 text-xs font-mono">
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-[6px] bg-white/[0.02] border border-glass-subtle">
              <div>
                <span className="text-muted block text-[10px]">Actor:</span>
                <span className="text-primary font-semibold">
                  {selectedEntry.user_email || selectedEntry.user_id || 'Operación de Sistema'}
                </span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">ID de Registro Afectado:</span>
                <span className="text-primary break-all">{selectedEntry.entity_id}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Valores Anteriores */}
              <div className="flex flex-col gap-1">
                <span className="text-muted text-[11px] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Valores Previos (payload_before):
                </span>
                <pre className="p-3 bg-black/40 rounded-[6px] border border-glass-subtle text-[11px] text-rose-300 overflow-x-auto max-h-64 custom-scrollbar">
                  {selectedEntry.payload_before || selectedEntry.old_values
                    ? JSON.stringify(selectedEntry.payload_before || selectedEntry.old_values, null, 2)
                    : '(Sin valores previos / INSERT)'}
                </pre>
              </div>

              {/* Nuevos Valores */}
              <div className="flex flex-col gap-1">
                <span className="text-muted text-[11px] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Nuevos Valores (payload_after):
                </span>
                <pre className="p-3 bg-black/40 rounded-[6px] border border-glass-subtle text-[11px] text-emerald-300 overflow-x-auto max-h-64 custom-scrollbar">
                  {selectedEntry.payload_after || selectedEntry.new_values
                    ? JSON.stringify(selectedEntry.payload_after || selectedEntry.new_values, null, 2)
                    : '(Sin valores posteriores / DELETE)'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-glass-subtle">
              <button
                onClick={() => setSelectedEntry(null)}
                className="vision-btn py-1 px-3 text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </VisionModal>
      )}
    </div>
  );
};
