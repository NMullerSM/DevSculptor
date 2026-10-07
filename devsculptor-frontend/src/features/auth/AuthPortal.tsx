import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { VisionButton } from '@/components/ui/VisionButton';
import { VisionInput } from '@/components/ui/VisionInput';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { ForgotPasswordModal } from './ForgotPasswordModal';

export const AuthPortal: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isPasswordStrong, setIsPasswordStrong] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Estados de 2FA y Recuperación de Contraseña
  const [mfaChallenge, setMfaChallenge] = useState<{ tempToken: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [urlResetToken, setUrlResetToken] = useState<string>('');

  const { login, register, verifyMfaLogin, isLoading, error, clearError } = useAuthStore();

  // Detectar token de restablecimiento en la URL si el usuario abrió el enlace
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('resetToken');
    if (token) {
      setUrlResetToken(token);
      setIsForgotPasswordOpen(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    // Validaciones preventivas en cliente
    if (!email || !email.includes('@')) {
      setFormError('Introduce un correo electrónico corporativo o personal válido.');
      return;
    }

    if (isRegister) {
      if (fullName.trim().length < 2) {
        setFormError('Por favor ingresa tu nombre completo.');
        return;
      }
      if (!isPasswordStrong) {
        setFormError('La contraseña debe cumplir con todos los requisitos de seguridad (mayúscula, minúscula, número y símbolo).');
        return;
      }
    } else {
      if (password.length < 1) {
        setFormError('La contraseña es requerida.');
        return;
      }
    }

    try {
      if (isRegister) {
        await register({ email, password, full_name: fullName });
      } else {
        const loginRes = await login({ email, password });
        if (loginRes?.mfaRequired && loginRes.tempToken) {
          setMfaChallenge({ tempToken: loginRes.tempToken });
          setMfaCode('');
        }
      }
    } catch {
      // El error se maneja en el store
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaChallenge || mfaCode.trim().length !== 6) {
      setFormError('Por favor introduce el código de 6 dígitos de tu app autenticadora.');
      return;
    }

    setFormError(null);
    clearError();

    try {
      await verifyMfaLogin(mfaChallenge.tempToken, mfaCode.trim());
    } catch {
      // El error se maneja en el store
    }
  };

  return (
    <div className="h-screen h-dvh w-screen flex items-center justify-center p-3 sm:p-4 z-20 relative overflow-y-auto">
      <div className="vision-window max-w-sm w-full p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 shadow-2xl relative my-auto">
        {/* Selector Sol/Luna en esquina */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        {/* Encabezado con Isotipo */}
        <div className="space-y-1.5 text-center pt-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] mb-1">
            <span className="material-symbols-outlined text-white text-xl">token</span>
          </div>
          <h1 className="text-base font-bold text-white tracking-tight">DevSculptor Studio</h1>
          <p className="text-[11px] text-muted leading-tight font-mono">
            Plataforma de Gobernanza Técnica Pre-Coding & Compilación Documental OKF
          </p>
        </div>

        {/* Pantalla de Desafío 2FA / TOTP */}
        {mfaChallenge ? (
          <div className="space-y-4 animate-fade-in">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-center space-y-1">
              <span className="material-symbols-outlined text-2xl text-cyan-400">lock</span>
              <div className="text-xs font-bold text-primary">Autenticación en Dos Pasos (2FA)</div>
              <p className="text-[10.5px] text-secondary">
                Ingresa el código temporal de 6 dígitos generado por tu aplicación de autenticación (Google Authenticator, Authy, etc.).
              </p>
            </div>

            {/* Mensajes de Error */}
            {(formError || error) && (
              <div className="p-2.5 rounded-[6px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                <span className="material-symbols-outlined text-sm shrink-0">error</span>
                <span>{formError || error}</span>
              </div>
            )}

            <form onSubmit={handleMfaSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-secondary mb-1 text-center">
                  Código de Seguridad (6 Dígitos)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  placeholder="000000"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  className="vision-input text-center text-xl tracking-[0.4em] font-mono font-bold w-full py-2"
                />
              </div>

              <VisionButton
                type="submit"
                variant="primary"
                disabled={isLoading || mfaCode.length !== 6}
                className="w-full !py-2.5 justify-center font-semibold"
              >
                {isLoading ? 'Verificando...' : 'Confirmar e Ingresar'}
              </VisionButton>

              <button
                type="button"
                onClick={() => {
                  setMfaChallenge(null);
                  setFormError(null);
                  clearError();
                }}
                className="w-full text-center text-xs text-secondary hover:text-primary font-mono cursor-pointer pt-1"
              >
                &larr; Cancelar y volver al inicio
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Pestañas Conmutables Iniciar Sesión / Crear Cuenta */}
            <div className="flex bg-white/[0.04] p-0.5 rounded-[7px] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setFormError(null);
                  clearError();
                }}
                className={`flex-1 py-1.5 text-[11px] font-medium rounded-[5px] transition-all ${
                  !isRegister ? 'bg-indigo-600/80 text-white shadow-sm' : 'text-muted hover:text-white'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setFormError(null);
                  clearError();
                }}
                className={`flex-1 py-1.5 text-[11px] font-medium rounded-[5px] transition-all ${
                  isRegister ? 'bg-indigo-600/80 text-white shadow-sm' : 'text-muted hover:text-white'
                }`}
              >
                Crear Cuenta
              </button>
            </div>

            {/* Mensajes de Error */}
            {(formError || error) && (
              <div className="p-2.5 rounded-[6px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                <span className="material-symbols-outlined text-sm shrink-0">error</span>
                <span>{formError || error}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {isRegister && (
                <VisionInput
                  label="Nombre Completo"
                  type="text"
                  required
                  placeholder="Ej. Nathaniel Muller"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              )}

              <VisionInput
                label="Correo Electrónico"
                type="email"
                required
                placeholder="desarrollador@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div>
                <VisionInput
                  label="Contraseña"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {/* Indicador de Fuerza de Contraseña en Registro */}
                {isRegister && (
                  <PasswordStrengthIndicator
                    password={password}
                    onValidChange={(valid) => setIsPasswordStrong(valid)}
                  />
                )}

                {/* Enlace Olvidé mi Contraseña en Inicio de Sesión */}
                {!isRegister && (
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      className="text-[11px] font-mono font-medium text-cyan-300 hover:text-cyan-100 dark:text-cyan-300 dark:hover:text-cyan-100 hover:underline transition-colors cursor-pointer drop-shadow-sm"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                )}
              </div>

              <VisionButton
                type="submit"
                variant="primary"
                disabled={isLoading || (isRegister && !isPasswordStrong)}
                className="w-full !py-2.5 mt-2 justify-center font-semibold tracking-wide"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Autenticando...
                  </span>
                ) : isRegister ? (
                  'Crear Cuenta y Comenzar'
                ) : (
                  'Acceder al Estudio'
                )}
              </VisionButton>
            </form>

            <div className="pt-2 border-t border-white/[0.06] text-center">
              <p className="text-[10px] text-muted font-mono">
                Protegido con bcrypt (12 rounds), TOTP RFC 6238 y tokens HMAC-SHA256
              </p>
            </div>
          </>
        )}

        {/* Modal de Recuperación de Contraseña */}
        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
          initialToken={urlResetToken}
          onSuccess={() => {
            setIsRegister(false);
            setFormError(null);
          }}
        />
      </div>
    </div>
  );
};
