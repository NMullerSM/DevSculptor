import React, { useEffect } from 'react';
import { useAdminStore } from '@/stores/useAdminStore';

export const PlatformStatsTab: React.FC = () => {
  const { stats, isLoading, error, fetchStats } = useAdminStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const kpis = [
    {
      title: 'Proyectos Registrados',
      value: stats?.total_projects ?? 0,
      icon: 'folder_open',
      color: 'text-indigo-400',
      bgGlow: 'from-indigo-500/10 to-indigo-500/0',
      border: 'border-indigo-500/20',
      desc: 'Proyectos arquitecturales activos en la plataforma',
    },
    {
      title: 'Usuarios Activos',
      value: stats?.total_users ?? 0,
      icon: 'group',
      color: 'text-cyan-400',
      bgGlow: 'from-cyan-500/10 to-cyan-500/0',
      border: 'border-cyan-500/20',
      desc: 'Cuentas con acceso verificado en el sistema',
    },
    {
      title: 'Entidades Modeladas',
      value: stats?.total_entities ?? 0,
      icon: 'schema',
      color: 'text-emerald-400',
      bgGlow: 'from-emerald-500/10 to-emerald-500/0',
      border: 'border-emerald-500/20',
      desc: 'Modelos de datos y tablas diseñadas en canvas',
    },
    {
      title: 'Requerimientos (SRS)',
      value: stats?.total_requirements ?? 0,
      icon: 'rule',
      color: 'text-amber-400',
      bgGlow: 'from-amber-500/10 to-amber-500/0',
      border: 'border-amber-500/20',
      desc: 'Requerimientos funcionales y no funcionales',
    },
    {
      title: 'Índice de Madurez Promedio',
      value: `${stats?.avg_maturity_score ?? 0}%`,
      icon: 'insights',
      color: 'text-purple-400',
      bgGlow: 'from-purple-500/10 to-purple-500/0',
      border: 'border-purple-500/20',
      desc: 'Puntuación promedio de completitud técnica',
    },
  ];

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">
      {/* Cabecera con Botón de Refresco */}
      <div className="flex items-center justify-between pb-2 border-b border-glass-subtle shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-400 text-base">analytics</span>
          <div>
            <h3 className="font-semibold text-xs text-primary tracking-tight">
              Telemetría y Salud Operativa de DevSculptor
            </h3>
            <p className="text-[10px] text-muted font-mono">
              Monitoreo en tiempo real de volumen y madurez técnica transversal
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchStats()}
          disabled={isLoading}
          className="vision-btn !py-1 !px-2.5 text-[11px] flex items-center gap-1.5"
        >
          <span
            className={`material-symbols-outlined text-xs ${
              isLoading ? 'animate-spin' : ''
            }`}
          >
            refresh
          </span>
          <span>Actualizar Métricas</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-[6px] bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Grid de Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className={`vision-card p-3.5 flex flex-col justify-between gap-3 border ${kpi.border} bg-gradient-to-b ${kpi.bgGlow}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-muted">{kpi.title}</span>
              <span className={`material-symbols-outlined text-lg ${kpi.color}`}>
                {kpi.icon}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-2xl font-bold font-mono tracking-tight text-primary">
                {isLoading ? '...' : kpi.value}
              </span>
              <span className="text-[10px] text-muted font-mono mt-1">{kpi.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Paneles de Diagnóstico y Estado de Infraestructura */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-1">
        {/* Estado de Seguridad y Gobernanza */}
        <div className="vision-card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-2 border-b border-glass-subtle">
            <span className="material-symbols-outlined text-amber-400 text-base">shield</span>
            <h4 className="font-semibold text-xs text-primary">Perfil de Seguridad & RBAC</h4>
          </div>

          <div className="flex flex-col gap-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded-[5px] bg-white/[0.02] border border-glass-subtle">
              <span className="text-muted">Mecanismo de Ocultación de Rutas:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Fail-Safe 404 (Anti-Enumeration)
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-[5px] bg-white/[0.02] border border-glass-subtle">
              <span className="text-muted">Aislamiento de Storage:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                RLS Activo (okf-vault)
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-[5px] bg-white/[0.02] border border-glass-subtle">
              <span className="text-muted">Hashing de Integridad de Plantillas:</span>
              <span className="text-indigo-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                SHA-256 en Tiempo Real
              </span>
            </div>
          </div>
        </div>

        {/* Estado de Conectividad Cloud & Motor de Persistencia */}
        <div className="vision-card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-2 border-b border-glass-subtle">
            <span className="material-symbols-outlined text-cyan-400 text-base">database</span>
            <h4 className="font-semibold text-xs text-primary">Motor de Persistencia & OKF</h4>
          </div>

          <div className="flex flex-col gap-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded-[5px] bg-white/[0.02] border border-glass-subtle">
              <span className="text-muted">Base de Datos:</span>
              <span className="text-cyan-400 font-semibold">PostgreSQL 17 (Supabase Cloud)</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-[5px] bg-white/[0.02] border border-glass-subtle">
              <span className="text-muted">Conector de Pool:</span>
              <span className="text-emerald-400 font-semibold">pg.Pool (Transaccional)</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-[5px] bg-white/[0.02] border border-glass-subtle">
              <span className="text-muted">Estructura Canónica:</span>
              <span className="text-indigo-300 font-semibold">OKF Standard Tree Specification</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
