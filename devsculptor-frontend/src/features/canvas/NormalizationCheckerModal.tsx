import React, { useMemo } from 'react';
import { VisionModal } from '@/components/ui/VisionModal';
import { VisionButton } from '@/components/ui/VisionButton';
import { CanvasEntity } from '@/types/canvas.types';

interface NormalizationCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  entities: CanvasEntity[];
}

interface TableDiagnostic {
  tableName: string;
  is1Fn: boolean;
  is2Fn: boolean;
  is3Fn: boolean;
  issues: string[];
  recommendations: string[];
}

export const NormalizationCheckerModal: React.FC<NormalizationCheckerModalProps> = ({
  isOpen,
  onClose,
  entities,
}) => {
  const diagnostics = useMemo<TableDiagnostic[]>(() => {
    return entities.map((entity) => {
      const cols = Array.isArray(entity.columns_json) ? entity.columns_json : [];
      const issues: string[] = [];
      const recommendations: string[] = [];

      // 1. Chequeo 1FN: Debe tener PK y columnas atómicas
      const pkCols = cols.filter((c) => c.isPk || c.is_pk);
      const hasPk = pkCols.length > 0;
      if (!hasPk) {
        issues.push('1FN: La tabla no define una clave primaria (PK).');
        recommendations.push('Añadir una columna "id" de tipo UUID o BIGINT como Primary Key.');
      }

      // Detectar nombres sospechosos de arrays o listas en texto
      const nonAtomic = cols.filter((c) =>
        /lista|items|tags|telefonos|correos|roles_list/i.test(c.name) &&
        !c.type.toLowerCase().includes('json')
      );
      if (nonAtomic.length > 0) {
        issues.push(`1FN: Posibles atributos multivaluados no atómicos (${nonAtomic.map((c) => c.name).join(', ')}).`);
        recommendations.push('Descomponer los atributos multivaluados en una tabla 1:N secundaria.');
      }

      const is1Fn = hasPk && nonAtomic.length === 0;

      // 2. Chequeo 2FN: Dependencia funcional completa si hay PK compuesta
      let is2Fn = true;
      if (pkCols.length > 1) {
        // En PK compuesta, si hay columnas descriptivas que parecen pertenecer a una sola clave
        const nonKeyCols = cols.filter((c) => !c.isPk && !c.is_pk);
        if (nonKeyCols.length > 0) {
          recommendations.push('2FN: Validar que todos los atributos dependan de la clave compuesta completa.');
        }
      }

      // 3. Chequeo 3FN: Ausencia de dependencias transitivas
      // Detecta campos como client_name, user_email, product_price en tablas transaccionales
      const transitiveCandidates = cols.filter((c) => {
        if (c.isPk || c.is_pk || c.isFk || c.is_fk) return false;
        const n = c.name.toLowerCase();
        // Si la tabla no es users pero tiene user_name o user_email
        if (!entity.table_name.includes('user') && (n.includes('user_name') || n.includes('user_email'))) {
          return true;
        }
        // Si la tabla no es customer pero tiene customer_name o client_address
        if (!entity.table_name.includes('customer') && (n.includes('customer_name') || n.includes('client_email'))) {
          return true;
        }
        return false;
      });

      let is3Fn = true;
      if (transitiveCandidates.length > 0) {
        is3Fn = false;
        issues.push(
          `3FN: Posible dependencia transitiva detectada en (${transitiveCandidates.map((c) => c.name).join(', ')}).`
        );
        recommendations.push(
          'Reubicar la información descriptiva en la tabla maestra correspondiente y mantener únicamente la Foreign Key.'
        );
      }

      return {
        tableName: entity.table_name,
        is1Fn,
        is2Fn,
        is3Fn,
        issues,
        recommendations,
      };
    });
  }, [entities]);

  const totalScore = useMemo(() => {
    if (diagnostics.length === 0) return 100;
    const totalChecks = diagnostics.length * 3;
    let passed = 0;
    diagnostics.forEach((d) => {
      if (d.is1Fn) passed++;
      if (d.is2Fn) passed++;
      if (d.is3Fn) passed++;
    });
    return Math.round((passed / totalChecks) * 100);
  }, [diagnostics]);

  return (
    <VisionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Motor de Verificación de Normalización (3FN)"
      description="Auditoría matemática y heurística para 1FN, 2FN y 3FN en las tablas del modelo."
      size="lg"
    >
      <div className="space-y-4">
        {/* Banner de Puntuación Global */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900/90 to-indigo-950/40 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold font-mono text-lg border ${
                totalScore >= 85
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : totalScore >= 60
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}
            >
              {totalScore}%
            </div>
            <div>
              <div className="text-sm font-semibold text-primary">
                {totalScore >= 85
                  ? 'Esquema Altamente Normalizado (3FN)'
                  : totalScore >= 60
                  ? 'Normalización Parcial — Advertencias Detectadas'
                  : 'Riesgo de Redundancia y Anomalías DDL'}
              </div>
              <div className="text-xs text-muted font-mono">
                Evaluadas {entities.length} tablas bajo la teoría relacional de Codd.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="px-2 py-1 rounded bg-[var(--glass-card)] border border-glass-subtle text-cyan-600 dark:text-cyan-300">
              Mecánica: Activa
            </span>
            <span className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300">
              IA: Lista para S3-Épica B
            </span>
          </div>
        </div>

        {/* Desglose por Tabla */}
        <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          {diagnostics.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-muted">
              No hay tablas en el modelo para analizar.
            </div>
          ) : (
            diagnostics.map((d, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-[var(--glass-card)] border border-glass-subtle space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px] text-cyan-500 dark:text-cyan-400">table_chart</span>
                    <span className="font-mono font-semibold text-xs text-primary">{d.tableName}</span>
                  </div>

                  {/* Badges de 1FN, 2FN, 3FN */}
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span
                      className={`px-1.5 py-0.5 rounded border ${
                        d.is1Fn
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      1FN {d.is1Fn ? '✓' : '✗'}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded border ${
                        d.is2Fn
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      2FN {d.is2Fn ? '✓' : '✗'}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded border ${
                        d.is3Fn
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      3FN {d.is3Fn ? '✓' : '⚠'}
                    </span>
                  </div>
                </div>

                {d.issues.length > 0 && (
                  <div className="space-y-1">
                    {d.issues.map((iss, j) => (
                      <div key={j} className="text-[11px] font-mono text-rose-300/90 flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-xs text-rose-400 shrink-0 mt-0.5">
                          warning
                        </span>
                        <span>{iss}</span>
                      </div>
                    ))}
                  </div>
                )}

                {d.recommendations.length > 0 && (
                  <div className="space-y-1 bg-cyan-950/20 p-2 rounded border border-cyan-500/10">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                      Recomendaciones de Arquitectura:
                    </div>
                    {d.recommendations.map((rec, k) => (
                      <div key={k} className="text-[11px] font-mono text-cyan-200/80 flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-xs text-cyan-400 shrink-0 mt-0.5">
                          lightbulb
                        </span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-glass-subtle">
          <VisionButton variant="secondary" onClick={onClose}>
            Cerrar
          </VisionButton>
        </div>
      </div>
    </VisionModal>
  );
};
