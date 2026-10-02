import React, { useState } from 'react';
import { VisionModal } from '@/components/ui/VisionModal';
import { VisionButton } from '@/components/ui/VisionButton';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { authService } from '@/services/auth.service';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialToken?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialToken = '',
}) => {
  const [step, setStep] = useState<'request' | 'reset'>(initialToken ? 'reset' : 'request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [simulatedToken, setSimulatedToken] = useState<string | null>(null);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const data = await authService.forgotPassword(email.trim());
      setSuccessMsg(data.message);
      if (data.resetToken) {
        setSimulatedToken(data.resetToken);
        setToken(data.resetToken);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al solicitar recuperación de contraseña';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Debes ingresar el token de recuperación.');
      return;
    }
    if (!isPasswordValid) {
      setError('La nueva contraseña no cumple con todas las directivas de seguridad.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await authService.resetPassword({
        token: token.trim(),
        new_password: newPassword,
      });
      setSuccessMsg(data.message);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al restablecer contraseña';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VisionModal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'request' ? 'Recuperación de Contraseña' : 'Crear Nueva Contraseña'}
      description={
        step === 'request'
          ? 'Ingresa tu correo institucional registrado para validar tu identidad en el sistema.'
          : 'Define una nueva clave criptográficamente robusta para proteger tu cuenta.'
      }
      icon="lock_reset"
      maxWidth="md"
    >
      <div className="space-y-3.5">
        {/* Banner de Error */}
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
            <span className="material-symbols-outlined text-sm shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Banner de Éxito */}
        {successMsg && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <span className="material-symbols-outlined text-sm shrink-0">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequestToken} className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono text-secondary mb-1">
                Correo Electrónico Registrado
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ejemplo@empresa.com"
                className="vision-input text-xs w-full"
              />
            </div>

            {simulatedToken && (
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-2">
                <div className="text-[10.5px] font-mono text-indigo-300 font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">key</span>
                  <span>Token de Recuperación Emitido</span>
                </div>
                <div className="p-2 bg-black/30 rounded font-mono text-[10px] text-slate-300 break-all select-all">
                  {simulatedToken}
                </div>
                <VisionButton
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setStep('reset')}
                  className="w-full"
                >
                  Continuar a Cambiar Contraseña &rarr;
                </VisionButton>
              </div>
            )}

            {!simulatedToken && (
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('reset')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline font-mono cursor-pointer"
                >
                  ¿Ya tienes un token? Ingresarlo
                </button>
                <VisionButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isLoading}
                  disabled={!email.trim() || isLoading}
                >
                  Verificar y Continuar
                </VisionButton>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono text-secondary mb-1">
                Token de Recuperación
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                placeholder="Token alfanumérico de 64 caracteres..."
                className="vision-input text-xs w-full font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-secondary mb-1">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Nueva clave segura..."
                className="vision-input text-xs w-full"
              />
              <PasswordStrengthIndicator
                password={newPassword}
                onValidChange={(val) => setIsPasswordValid(val)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-secondary mb-1">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repite la contraseña..."
                className="vision-input text-xs w-full"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <div className="text-[10px] text-rose-400 font-mono mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">cancel</span>
                  <span>Las contraseñas no coinciden.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-xs text-secondary hover:text-primary font-mono cursor-pointer"
              >
                &larr; Volver
              </button>
              <VisionButton
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isLoading}
                disabled={!isPasswordValid || newPassword !== confirmPassword || isLoading}
              >
                Actualizar Contraseña
              </VisionButton>
            </div>
          </form>
        )}
      </div>
    </VisionModal>
  );
};
