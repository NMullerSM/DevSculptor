import React, { useState } from 'react';
import { VisionModal } from '@/components/ui/VisionModal';
import { VisionButton } from '@/components/ui/VisionButton';
import { VisionPill } from '@/components/ui/VisionPill';
import { useAuthStore } from '@/stores/useAuthStore';
import { authService } from '@/services/auth.service';

interface UserSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSecurityModal: React.FC<UserSecurityModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuthStore();
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const isMfaActive = Boolean(user?.mfa_enabled);

  const handleStartSetup = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const data = await authService.setupMfa();
      setSecret(data.secret);
      setIsSettingUp(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar configuración 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError('El código debe contener exactamente 6 dígitos.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.enableMfa(code.trim());
      setSuccessMsg(res.message);
      setIsSettingUp(false);
      setCode('');
      // Actualizar estado en store
      if (user) {
        const updated = { ...user, mfa_enabled: true };
        localStorage.setItem('devsculptor_user', JSON.stringify(updated));
        useAuthStore.setState({ user: updated });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al activar 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError('El código debe contener exactamente 6 dígitos.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.disableMfa(code.trim());
      setSuccessMsg(res.message);
      setIsDisabling(false);
      setCode('');
      // Actualizar estado en store
      if (user) {
        const updated = { ...user, mfa_enabled: false };
        localStorage.setItem('devsculptor_user', JSON.stringify(updated));
        useAuthStore.setState({ user: updated });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al desactivar 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySecret = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <VisionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Seguridad de la Cuenta & Autenticación (2FA)"
      description="Políticas de acceso criptográfico, protección de credenciales y doble factor TOTP."
      icon="security"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Ficha de Identidad del Usuario */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-black/10 dark:bg-white/[0.03] border border-glass-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="text-xs font-semibold text-primary">{user?.full_name}</div>
              <div className="text-[10.5px] font-mono text-secondary">{user?.email}</div>
            </div>
          </div>
          <VisionPill variant="indigo" className="font-mono text-[9px]">
            {user?.role || 'USER'}
          </VisionPill>
        </div>

        {/* Notificaciones */}
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
            <span className="material-symbols-outlined text-sm shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <span className="material-symbols-outlined text-sm shrink-0">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tarjeta de Estado de 2FA */}
        <div className="vision-card p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`material-symbols-outlined text-lg ${
                  isMfaActive ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {isMfaActive ? 'verified_user' : 'gpp_maybe'}
              </span>
              <div>
                <div className="text-xs font-bold text-primary">Autenticación en Dos Pasos (2FA)</div>
                <div className="text-[10.5px] text-secondary">
                  Basado en estándares abiertos TOTP (RFC 6238)
                </div>
              </div>
            </div>
            <span
              className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full ${
                isMfaActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {isMfaActive ? 'ACTIVO' : 'INACTIVO'}
            </span>
          </div>

          {/* Estado Inactivo - Botón de Configuración */}
          {!isMfaActive && !isSettingUp && (
            <div className="space-y-2 pt-1">
              <p className="text-[11px] text-secondary leading-relaxed">
                Protege tu cuenta institucional ante accesos no autorizados requiriendo un código de 6 dígitos emitido por una aplicación autenticadora en tu teléfono.
              </p>
              <VisionButton
                variant="primary"
                size="sm"
                icon="add_moderator"
                onClick={handleStartSetup}
                isLoading={isLoading}
              >
                Configurar Autenticador (2FA)
              </VisionButton>
            </div>
          )}

          {/* Proceso de Activación (Ingreso de Secreto y Validación) */}
          {isSettingUp && (
            <form onSubmit={handleConfirmEnable} className="space-y-3 pt-2 border-t border-glass-subtle animate-fade-in">
              <div className="text-[11px] text-secondary space-y-1">
                <p>1. Abre tu aplicación autenticadora (Google Authenticator, Authy o Microsoft Authenticator).</p>
                <p>2. Agrega una nueva cuenta manual usando esta clave secreta:</p>
              </div>

              {secret && (
                <div className="p-2.5 rounded-lg bg-black/30 border border-glass-subtle flex items-center justify-between gap-2">
                  <div className="font-mono text-xs text-cyan-300 font-bold tracking-wider select-all truncate">
                    {secret}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="vision-btn !p-1 text-xs shrink-0 text-muted hover:text-primary flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      {copiedKey ? 'check' : 'content_copy'}
                    </span>
                    <span className="text-[10px]">{copiedKey ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono text-secondary mb-1">
                  3. Introduce el código de 6 dígitos que muestra tu app:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="vision-input text-center text-lg tracking-[0.3em] font-mono font-bold w-full py-1.5"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingUp(false);
                    setCode('');
                  }}
                  className="text-xs text-secondary hover:text-primary font-mono cursor-pointer"
                >
                  Cancelar
                </button>
                <VisionButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isLoading}
                  disabled={code.length !== 6 || isLoading}
                >
                  Confirmar y Activar 2FA
                </VisionButton>
              </div>
            </form>
          )}

          {/* Estado Activo - Información y Opción de Desactivar */}
          {isMfaActive && !isDisabling && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]">
                <span className="material-symbols-outlined text-sm">shield</span>
                <span>Tu sesión requiere verificación de 6 dígitos en cada inicio de sesión.</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDisabling(true)}
                className="text-xs text-rose-400 hover:text-rose-300 underline font-mono cursor-pointer pt-1"
              >
                Desactivar 2FA
              </button>
            </div>
          )}

          {/* Formulario de Desactivación */}
          {isDisabling && (
            <form onSubmit={handleConfirmDisable} className="space-y-3 pt-2 border-t border-glass-subtle animate-fade-in">
              <p className="text-[11px] text-secondary">
                Por seguridad, introduce tu código 2FA actual para confirmar la desactivación:
              </p>
              <input
                type="text"
                maxLength={6}
                autoFocus
                required
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="vision-input text-center text-lg tracking-[0.3em] font-mono font-bold w-full py-1.5"
              />
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsDisabling(false);
                    setCode('');
                  }}
                  className="text-xs text-secondary hover:text-primary font-mono cursor-pointer"
                >
                  Cancelar
                </button>
                <VisionButton
                  type="submit"
                  variant="default"
                  size="sm"
                  className="!border-rose-500/40 text-rose-400 hover:!bg-rose-500/10"
                  isLoading={isLoading}
                  disabled={code.length !== 6 || isLoading}
                >
                  Confirmar Desactivación
                </VisionButton>
              </div>
            </form>
          )}
        </div>

        {/* Políticas de Contraseña Informativas */}
        <div className="vision-card p-3 space-y-1.5 text-xs">
          <div className="text-[10px] font-mono text-muted uppercase tracking-wider">
            Políticas de Seguridad Transversales
          </div>
          <div className="space-y-1 text-[11px] text-secondary">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px] text-emerald-400">check</span>
              <span>Hashing de contraseñas con bcrypt (12 rounds)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px] text-emerald-400">check</span>
              <span>Tokens de sesión JWT criptográficos HMAC-SHA256</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px] text-emerald-400">check</span>
              <span>Tokens de recuperación únicos con expiración estricta (1h)</span>
            </div>
          </div>
        </div>

        {/* Botón de Cierre */}
        <div className="flex justify-end pt-2 border-t border-glass-subtle">
          <VisionButton variant="secondary" onClick={onClose} size="sm">
            Cerrar
          </VisionButton>
        </div>
      </div>
    </VisionModal>
  );
};
