import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { authService } from '@/services/auth.service';
import { useSettingsStore, AiProvider } from '@/stores/useSettingsStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { VisionButton } from '@/components/ui/VisionButton';
import { VisionPill } from '@/components/ui/VisionPill';

interface UserProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

type MenuTab = 'profile' | 'security' | 'api-keys';

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ isOpen, onClose }) => {
  const { user, updateUser, logout } = useAuthStore();
  const { activeProject } = useProjectStore();
  const {
    apiKeys,
    setApiKey,
    provider,
    setProvider,
    customEndpointUrl,
    setCustomEndpointUrl,
    pingTest,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<MenuTab>('profile');

  // Estado para edición de nombre
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  // Estado para cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  // Estado para 2FA / MFA
  const [isSettingUpMfa, setIsSettingUpMfa] = useState(false);
  const [isDisablingMfa, setIsDisablingMfa] = useState(false);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [isMfaLoading, setIsMfaLoading] = useState(false);
  const [mfaSuccess, setMfaSuccess] = useState<string | null>(null);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Estado para BYOK / API Keys
  const [showKey, setShowKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; message: string } | null>(null);

  if (!isOpen) return null;

  const isMfaActive = Boolean(user?.mfa_enabled);

  // Iniciales del avatar
  const getInitials = (name?: string) => {
    if (!name) return 'DS';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Guardar nombre de perfil
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim() === user?.full_name) return;
    setIsSavingName(true);
    setNameError(null);
    setNameSuccess(null);
    try {
      const updated = await authService.updateProfile(fullName.trim());
      updateUser(updated);
      setNameSuccess('Nombre de perfil actualizado correctamente.');
      setTimeout(() => setNameSuccess(null), 3000);
    } catch (err: unknown) {
      setNameError(err instanceof Error ? err.message : 'Error al actualizar nombre.');
    } finally {
      setIsSavingName(false);
    }
  };

  // Cambiar contraseña
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword.length < 8) {
      setPassError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Las contraseñas no coinciden.');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await authService.changePassword(currentPassword, newPassword);
      setPassSuccess(res.message || 'Contraseña actualizada correctamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(null), 3500);
    } catch (err: unknown) {
      setPassError(err instanceof Error ? err.message : 'Error al cambiar contraseña.');
    } finally {
      setIsChangingPass(false);
    }
  };

  // Iniciar configuración 2FA
  const handleStartMfaSetup = async () => {
    setIsMfaLoading(true);
    setMfaError(null);
    setMfaSuccess(null);
    try {
      const data = await authService.setupMfa();
      setMfaSecret(data.secret);
      setIsSettingUpMfa(true);
    } catch (err: unknown) {
      setMfaError(err instanceof Error ? err.message : 'Error al iniciar 2FA.');
    } finally {
      setIsMfaLoading(false);
    }
  };

  // Confirmar y activar 2FA
  const handleConfirmEnableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.trim().length !== 6) {
      setMfaError('El código debe tener 6 dígitos numéricos.');
      return;
    }

    setIsMfaLoading(true);
    setMfaError(null);
    try {
      const res = await authService.enableMfa(mfaCode.trim());
      setMfaSuccess(res.message);
      setIsSettingUpMfa(false);
      setMfaCode('');
      if (user) {
        updateUser({ ...user, mfa_enabled: true });
      }
    } catch (err: unknown) {
      setMfaError(err instanceof Error ? err.message : 'Error al activar 2FA.');
    } finally {
      setIsMfaLoading(false);
    }
  };

  // Confirmar desactivación 2FA
  const handleConfirmDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.trim().length !== 6) {
      setMfaError('El código debe tener 6 dígitos numéricos.');
      return;
    }

    setIsMfaLoading(true);
    setMfaError(null);
    try {
      const res = await authService.disableMfa(mfaCode.trim());
      setMfaSuccess(res.message);
      setIsDisablingMfa(false);
      setMfaCode('');
      if (user) {
        updateUser({ ...user, mfa_enabled: false });
      }
    } catch (err: unknown) {
      setMfaError(err instanceof Error ? err.message : 'Error al desactivar 2FA.');
    } finally {
      setIsMfaLoading(false);
    }
  };

  // Copiar clave secreta 2FA
  const handleCopySecret = async () => {
    if (!mfaSecret) return;
    try {
      await navigator.clipboard.writeText(mfaSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch {
      // Ignorar fallback
    }
  };

  // Test de Ping para la API Key
  const handleTestKey = async () => {
    if (!activeProject) {
      setTestResult({
        success: false,
        latencyMs: 0,
        message: 'Abre un proyecto en el estudio para realizar el test de latencia.',
      });
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);
    try {
      const res = await pingTest(activeProject.id);
      setTestResult(res);
    } finally {
      setIsTestingKey(false);
    }
  };

  const currentKey = apiKeys[provider] || '';

  return createPortal(
    <>
      {/* Backdrop con atenuación y desenfoque para cerrar al hacer clic */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer deslizante desde la DERECHA hacia la izquierda (Right Slide-Over) con fondo opaco */}
      <aside
        className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[480px] max-w-[92vw] bg-[#0c1222]/98 dark:bg-[#070b16]/98 backdrop-blur-2xl !rounded-l-2xl !rounded-r-none shadow-2xl border-l border-y-0 border-r-0 border-glass-subtle flex flex-col overflow-hidden animate-slide-left select-none text-xs"
      >
        {/* Cabecera del Usuario */}
        <div className="p-4 border-b border-glass-subtle bg-black/15 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0 ring-2 ring-indigo-500/30">
              {getInitials(user?.full_name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-xs sm:text-sm text-primary truncate max-w-[200px]">
                  {user?.full_name || 'Usuario'}
                </h3>
                <VisionPill
                  variant={user?.role === 'SUPERADMIN' ? 'amber' : 'indigo'}
                  className="text-[9px] !py-0 !px-1.5"
                >
                  {user?.role || 'USER'}
                </VisionPill>
                {isMfaActive && (
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">
                    2FA ACTIVO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted truncate font-mono mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="vision-btn !p-1 text-muted hover:text-primary rounded-lg text-xs"
            title="Cerrar panel"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {/* Pestañas de Navegación del Usuario */}
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-glass-subtle bg-black/5 shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-secondary hover:text-primary hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">person</span>
            <span>Perfil</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'security'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-secondary hover:text-primary hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">shield</span>
            <span>Seguridad & 2FA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('api-keys')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'api-keys'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-secondary hover:text-primary hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">key</span>
            <span>Mis API Keys</span>
          </button>
        </div>

        {/* Contenedor Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
          {/* ========================================================= */}
          {/* PESTAÑA 1: PERFIL DE USUARIO                              */}
          {/* ========================================================= */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Actualizar Nombre */}
              <form onSubmit={handleSaveName} className="vision-card p-3 space-y-2.5">
                <h4 className="font-semibold text-primary text-xs flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-indigo-400">badge</span>
                  Información Personal
                </h4>

                {nameSuccess && (
                  <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px]">
                    {nameSuccess}
                  </div>
                )}
                {nameError && (
                  <div className="p-2 rounded bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[11px]">
                    {nameError}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-mono text-muted mb-1">Nombre Completo</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="vision-input text-xs flex-1 !py-1"
                    />
                    <VisionButton
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={isSavingName || fullName === user?.full_name}
                      className="!py-1 !px-3"
                    >
                      {isSavingName ? 'Guardando...' : 'Guardar'}
                    </VisionButton>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-muted mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="vision-input text-xs w-full !py-1 opacity-70 cursor-not-allowed font-mono bg-white/[0.02]"
                  />
                  <span className="text-[9.5px] text-muted font-mono mt-0.5 block">
                    El correo electrónico está vinculado a tu cuenta institucional.
                  </span>
                </div>
              </form>

              {/* Cambiar Contraseña */}
              <form onSubmit={handleChangePassword} className="vision-card p-3 space-y-2.5">
                <h4 className="font-semibold text-primary text-xs flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-cyan-400">lock_reset</span>
                  Actualizar Contraseña
                </h4>

                {passSuccess && (
                  <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px]">
                    {passSuccess}
                  </div>
                )}
                {passError && (
                  <div className="p-2 rounded bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[11px]">
                    {passError}
                  </div>
                )}

                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-mono text-muted mb-1">Contraseña Actual</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="vision-input text-xs w-full !py-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-muted mb-1">Nueva Contraseña</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="Mínimo 8 caracteres"
                        className="vision-input text-xs w-full !py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted mb-1">Confirmar Nueva</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Repite la contraseña"
                        className="vision-input text-xs w-full !py-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <VisionButton
                    type="submit"
                    variant="secondary"
                    size="sm"
                    disabled={isChangingPass || !currentPassword || !newPassword}
                    className="!py-1 !px-3"
                  >
                    {isChangingPass ? 'Actualizando...' : 'Cambiar Contraseña'}
                  </VisionButton>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* PESTAÑA 2: SEGURIDAD & 2FA (RFC 6238 TOTP)               */}
          {/* ========================================================= */}
          {activeTab === 'security' && (
            <div className="space-y-3.5">
              <div className="vision-card p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-primary text-xs">Autenticación en Dos Factores (2FA)</h4>
                    <p className="text-[10.5px] text-muted">
                      Estándar RFC 6238 TOTP (Google Authenticator, Authy, Apple Passwords).
                    </p>
                  </div>
                  <VisionPill variant={isMfaActive ? 'emerald' : 'amber'} className="text-[9.5px]">
                    {isMfaActive ? 'ACTIVO' : 'INACTIVO'}
                  </VisionPill>
                </div>

                {mfaSuccess && (
                  <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px]">
                    {mfaSuccess}
                  </div>
                )}
                {mfaError && (
                  <div className="p-2 rounded bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[11px]">
                    {mfaError}
                  </div>
                )}

                {/* Flujo cuando 2FA está apagado */}
                {!isMfaActive && !isSettingUpMfa && (
                  <div className="space-y-2 pt-1 border-t border-glass-subtle">
                    <p className="text-[11px] text-secondary leading-relaxed">
                      Protege tu cuenta de accesos no autorizados exigiendo un código temporal de 6 dígitos cada vez que inicies sesión.
                    </p>
                    <VisionButton
                      variant="primary"
                      size="sm"
                      onClick={handleStartMfaSetup}
                      disabled={isMfaLoading}
                      className="!py-1 !px-3 w-full justify-center"
                    >
                      {isMfaLoading ? 'Iniciando...' : 'Activar Autenticación 2FA'}
                    </VisionButton>
                  </div>
                )}

                {/* Proceso de Activación con Secreto TOTP */}
                {isSettingUpMfa && (
                  <form onSubmit={handleConfirmEnableMfa} className="space-y-3 pt-2 border-t border-glass-subtle">
                    <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 space-y-1.5">
                      <div className="text-[10.5px] font-mono text-indigo-300 font-semibold">
                        Clave Secreta Manual:
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-emerald-400 font-mono text-[11px] select-all break-all">
                          {mfaSecret}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopySecret}
                          className="vision-btn !p-1 text-[10px] shrink-0"
                          title="Copiar secreto"
                        >
                          {copiedSecret ? '¡Copiado!' : 'Copiar'}
                        </button>
                      </div>
                      <p className="text-[10px] text-muted">
                        Ingresa esta clave en tu aplicación autenticadora para vincular tu cuenta.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-muted mb-1">
                        Código de Verificación (6 dígitos)
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                        required
                        placeholder="123456"
                        className="vision-input text-sm font-mono text-center tracking-widest w-full !py-1.5"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsSettingUpMfa(false)}
                        className="vision-btn !py-1 text-xs flex-1"
                      >
                        Cancelar
                      </button>
                      <VisionButton
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={isMfaLoading || mfaCode.length !== 6}
                        className="flex-1 justify-center !py-1"
                      >
                        {isMfaLoading ? 'Validando...' : 'Confirmar & Activar'}
                      </VisionButton>
                    </div>
                  </form>
                )}

                {/* Flujo cuando 2FA ya está activo */}
                {isMfaActive && !isDisablingMfa && (
                  <div className="space-y-2 pt-1 border-t border-glass-subtle">
                    <p className="text-[11px] text-emerald-400 leading-relaxed flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">verified_user</span>
                      Tu cuenta está completamente blindada con segundo factor de autenticación.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsDisablingMfa(true)}
                      className="text-[11px] text-rose-400 hover:text-rose-300 underline"
                    >
                      Desactivar 2FA
                    </button>
                  </div>
                )}

                {/* Proceso de Desactivación */}
                {isDisablingMfa && (
                  <form onSubmit={handleConfirmDisableMfa} className="space-y-2.5 pt-2 border-t border-glass-subtle">
                    <p className="text-[10.5px] text-rose-300">
                      Para desactivar 2FA, ingresa el código actual de tu aplicación autenticadora:
                    </p>
                    <input
                      type="text"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                      required
                      placeholder="Código de 6 dígitos"
                      className="vision-input text-xs font-mono text-center w-full !py-1"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsDisablingMfa(false)}
                        className="vision-btn !py-1 text-xs flex-1"
                      >
                        Cancelar
                      </button>
                      <VisionButton
                        type="submit"
                        variant="secondary"
                        size="sm"
                        disabled={isMfaLoading || mfaCode.length !== 6}
                        className="flex-1 justify-center !py-1 !bg-rose-600 hover:!bg-rose-500 text-white"
                      >
                        {isMfaLoading ? 'Desactivando...' : 'Confirmar Desactivación'}
                      </VisionButton>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PESTAÑA 3: MIS API KEYS (BYOK - TOKENS DEL USUARIO)       */}
          {/* ========================================================= */}
          {activeTab === 'api-keys' && (
            <div className="space-y-3.5">
              <div className="vision-card p-3 space-y-3">
                <div className="border-b border-glass-subtle pb-2">
                  <h4 className="font-semibold text-primary text-xs flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-indigo-400">key</span>
                    Tus Claves Privadas de Inferencia (BYOK)
                  </h4>
                  <p className="text-[10.5px] text-secondary mt-1 leading-relaxed">
                    Configura tus propias API Keys. Se guardan únicamente en tu navegador local (cero retención en base de datos) y viajan cifradas por cabecera de inferencia.
                  </p>
                </div>

                {/* Explicación transparente sobre cómo funciona */}
                <div className="p-2.5 rounded-lg bg-indigo-500/[0.08] border border-indigo-500/20 text-[10.5px] text-indigo-200 leading-relaxed space-y-1">
                  <div className="font-semibold flex items-center gap-1 text-indigo-300">
                    <span className="material-symbols-outlined text-sm">info</span>
                    ¿Qué ocurre si no configuro una clave propia?
                  </div>
                  <div>
                    DevSculptor utilizará automáticamente el proveedor configurado por defecto en el servidor (Google Gemini Flash), sin costo adicional para ti.
                  </div>
                </div>

                {/* Selector de Proveedor */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono text-muted uppercase">
                    Proveedor a Configurar
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as AiProvider)}
                    className="vision-input text-xs w-full !py-1.5"
                  >
                    <option value="openrouter">OpenRouter (Modelos Free Tier & Premium)</option>
                    <option value="gemini">Google Gemini (API Key Directa)</option>
                    <option value="deepseek">DeepSeek (API Oficial Directa)</option>
                    <option value="openai">OpenAI (GPT-4o, o3-mini)</option>
                    <option value="anthropic">Anthropic (Claude 3.7 / 3.5)</option>
                    <option value="groq">Groq (Inferencia LPU)</option>
                    <option value="custom">Personalizado (Ollama / Local vLLM)</option>
                  </select>
                </div>

                {/* Input de Clave */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono text-muted uppercase">
                      API Key para {provider.toUpperCase()}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="text-[10px] text-indigo-400 hover:underline"
                    >
                      {showKey ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type={showKey ? 'text' : 'password'}
                      placeholder={`Pega tu clave ${provider === 'openrouter' ? 'sk-or-v1-...' : provider === 'deepseek' ? 'sk-...' : 'AIzaSy...'}`}
                      value={currentKey}
                      onChange={(e) => setApiKey(provider, e.target.value)}
                      className="vision-input text-xs font-mono flex-1 !py-1"
                    />
                    {currentKey && (
                      <button
                        type="button"
                        onClick={() => setApiKey(provider, '')}
                        className="vision-btn !p-1 text-muted hover:text-rose-400 text-xs"
                        title="Borrar clave local"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Endpoint personalizado si es custom */}
                {provider === 'custom' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-muted uppercase">
                      URL del Endpoint OpenAI-Compatible
                    </label>
                    <input
                      type="url"
                      placeholder="http://localhost:11434/v1"
                      value={customEndpointUrl || ''}
                      onChange={(e) => setCustomEndpointUrl(e.target.value)}
                      className="vision-input text-xs font-mono w-full !py-1"
                    />
                  </div>
                )}

                {/* Botón Probar Conexión & Latencia */}
                <div className="pt-2 border-t border-glass-subtle flex items-center justify-between gap-2">
                  <div className="text-[10px] font-mono">
                    {currentKey ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Clave configurada localmente
                      </span>
                    ) : (
                      <span className="text-muted">Sin clave (Usa servidor default)</span>
                    )}
                  </div>

                  <VisionButton
                    variant="secondary"
                    size="sm"
                    onClick={handleTestKey}
                    disabled={isTestingKey}
                    className="!py-1 !px-2.5 text-xs"
                  >
                    {isTestingKey ? 'Probando...' : 'Probar Conexión'}
                  </VisionButton>
                </div>

                {/* Feedback del Test de Ping */}
                {testResult && (
                  <div
                    className={`p-2.5 rounded-lg border text-[11px] space-y-1 ${
                      testResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span>{testResult.success ? '✓ Conexión Exitosa' : '✕ Error de Conexión'}</span>
                      {testResult.latencyMs > 0 && <span>{testResult.latencyMs}ms</span>}
                    </div>
                    <div>{testResult.message}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pie del Menú con Cerrar Sesión */}
        <div className="p-3 border-t border-glass-subtle bg-black/15 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[10px] font-mono text-muted">
            DevSculptor Studio v1.0
          </span>

          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/20 transition-all"
          >
            <span className="material-symbols-outlined text-[14px]">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>,
    document.body
  );
};
