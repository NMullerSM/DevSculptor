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
  const [devTokenNotice, setDevTokenNotice] = useState(false);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    setDevTokenNotice(false);

    try {
      const data = await authService.forgotPassword(email.trim());
      setSuccessMsg(
        data.message ||
          'Si la cuenta se encuentra registrada, se ha enviado un correo con instrucciones para restablecer tu contraseña.'
      );
      if (data.resetToken) {
        setToken(data.resetToken);
        setDevTokenNotice(true);
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

            {devTokenNotice && (
              <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-mono flex items-center gap-2">
                <span className="material-symbols-outlined text-sm shrink-0">developer_mode</span>
                <span>Modo desarrollo activo: Token de recuperación pre-cargado para pruebas locales.</span>
              </div>
            )}

            {successMsg ? (
              <div className="pt-2">
                <VisionButton
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setStep('reset')}
                  className="w-full"
                >
                  Continuar e Ingresar Token Recibido &rarr;
                </VisionButton>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('reset')}
                  className="text-xs text-cyan-300 hover:text-cyan-100 dark:text-cyan-300 dark:hover:text-cyan-100 underline font-mono font-medium cursor-pointer"
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
                  Enviar Instrucciones
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
