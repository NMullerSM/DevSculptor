import React, { useEffect, useState, useMemo } from 'react';
import { useAdminStore } from '@/stores/useAdminStore';
import { AdminUserItem } from '@/types/admin.types';

export const UserManagementTab: React.FC = () => {
  const { users, isLoading, error, fetchUsers, updateUserRole } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN' | 'SUPERADMIN') => {
    setUpdatingUserId(userId);
    try {
      await updateUserRole(userId, newRole);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden pr-1">
      {/* Cabecera y Buscador */}
      <div className="flex flex-wrap items-center justify-between pb-2 border-b border-glass-subtle gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-400 text-base">manage_accounts</span>
          <div>
            <h3 className="font-semibold text-xs text-primary tracking-tight">
              Control de Accesos y Privilegios de Usuarios (RBAC)
            </h3>
            <p className="text-[10px] text-muted font-mono">
              Gestión de credenciales, roles y activación de cuentas en la plataforma
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/20 dark:bg-white/[0.04] border border-glass-subtle rounded-[6px] pl-7 pr-2 py-1 text-xs text-primary outline-none font-mono"
            />
            <span className="material-symbols-outlined text-muted text-xs absolute left-2 top-1.5">
              search
            </span>
          </div>

          <button
            onClick={() => fetchUsers()}
            disabled={isLoading}
            className="vision-btn !py-1 !px-2 text-[11px] flex items-center gap-1"
            title="Refrescar usuarios"
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

      {/* Tabla de Usuarios */}
      <div className="flex-1 vision-card overflow-hidden flex flex-col min-h-0 border border-glass-subtle">
        <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black/30 dark:bg-white/[0.03] text-muted text-[10.5px] uppercase tracking-wider sticky top-0 backdrop-blur-md border-b border-glass-subtle z-10">
              <tr>
                <th className="py-2.5 px-3">Usuario</th>
                <th className="py-2.5 px-3">Correo Electrónico</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3">Rol Actual</th>
                <th className="py-2.5 px-3">Cambiar Privilegio</th>
                <th className="py-2.5 px-3 text-right">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-subtle">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    <span className="material-symbols-outlined text-base animate-spin mr-2 align-middle">
                      progress_activity
                    </span>
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    No se encontraron usuarios registrados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((userItem: AdminUserItem) => {
                  const isUpdating = updatingUserId === userItem.id;
                  return (
                    <tr key={userItem.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-primary flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-semibold text-[10px] shrink-0">
                          {userItem.full_name ? userItem.full_name[0].toUpperCase() : 'U'}
                        </div>
                        <span>{userItem.full_name}</span>
                      </td>

                      <td className="py-2.5 px-3 text-secondary">{userItem.email}</td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {userItem.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[10.5px] text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10.5px] text-rose-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Inactivo
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {userItem.role === 'SUPERADMIN' ? (
                          <span className="px-2 py-0.5 rounded-[4px] bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold text-[10px] inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">shield_person</span>
                            SUPERADMIN
                          </span>
                        ) : userItem.role === 'ADMIN' ? (
                          <span className="px-2 py-0.5 rounded-[4px] bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold text-[10px] inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">admin_panel_settings</span>
                            ADMIN
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-[4px] bg-white/10 border border-white/20 text-muted text-[10px]">
                            USER
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={userItem.role}
                            disabled={isUpdating}
                            onChange={(e) =>
                              handleRoleChange(
                                userItem.id,
                                e.target.value as 'USER' | 'ADMIN' | 'SUPERADMIN'
                              )
                            }
                            className="bg-black/30 dark:bg-white/[0.05] border border-glass-subtle rounded-[5px] px-2 py-1 text-[11px] text-primary outline-none font-mono"
                          >
                            <option value="USER" className="bg-[#12141a] text-white">USER (Estándar)</option>
                            <option value="ADMIN" className="bg-[#12141a] text-white">ADMIN (Gestor)</option>
                            <option value="SUPERADMIN" className="bg-[#12141a] text-white">SUPERADMIN (Maestro)</option>
                          </select>
                          {isUpdating && (
                            <span className="material-symbols-outlined text-xs animate-spin text-amber-400">
                              progress_activity
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right text-muted text-[11px]">
                        {formatDate(userItem.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
