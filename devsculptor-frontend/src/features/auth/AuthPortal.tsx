import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { VisionButton } from '@/components/ui/VisionButton';
import { VisionInput } from '@/components/ui/VisionInput';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export const AuthPortal: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { login, register, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    // Validaciones preventivas de seguridad en cliente
    if (!email || !email.includes('@')) {
      setFormError('Introduce un correo electrónico corporativo o personal válido.');
      return;
    }
    if (password.length < 8) {
      setFormError('La contraseña debe tener un mínimo de 8 caracteres.');
      return;
    }
    if (isRegister && fullName.trim().length < 2) {
      setFormError('Por favor ingresa tu nombre completo.');
      return;
    }

    try {
      if (isRegister) {
        await register({ email, password, full_name: fullName });
      } else {
        await login({ email, password });
      }
    } catch {
      // El error ya se encuentra almacenado en el store
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center p-4 z-20 relative">
      <div className="vision-window max-w-sm w-full p-6 flex flex-col gap-5 shadow-2xl relative">
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

          <VisionInput
            label="Contraseña"
            type="password"
            required
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <VisionButton
            type="submit"
            variant="primary"
            disabled={isLoading}
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
            Protegido con bcrypt (12 rounds) y tokens HMAC-SHA256
          </p>
        </div>
      </div>
    </div>
  );
};
