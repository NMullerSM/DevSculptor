import React, { useMemo, useEffect } from 'react';

interface PasswordRule {
  id: string;
  label: string;
  validator: (pwd: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'length',
    label: 'Al menos 8 caracteres',
    validator: (pwd) => pwd.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'Una letra mayúscula (A-Z)',
    validator: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    id: 'lowercase',
    label: 'Una letra minúscula (a-z)',
    validator: (pwd) => /[a-z]/.test(pwd),
  },
  {
    id: 'number',
    label: 'Al menos un número (0-9)',
    validator: (pwd) => /\d/.test(pwd),
  },
  {
    id: 'special',
    label: 'Un carácter especial o símbolo (!@#$%^&*...)',
    validator: (pwd) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(pwd),
  },
];

interface PasswordStrengthIndicatorProps {
  password: string;
  onValidChange?: (isValid: boolean) => void;
  showRules?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  onValidChange,
  showRules = true,
}) => {
  const ruleResults = useMemo(() => {
    return PASSWORD_RULES.map((rule) => ({
      ...rule,
      passed: rule.validator(password),
    }));
  }, [password]);

  const passedCount = useMemo(() => {
    return ruleResults.filter((r) => r.passed).length;
  }, [ruleResults]);

  const isValid = passedCount === PASSWORD_RULES.length;

  useEffect(() => {
    onValidChange?.(isValid);
  }, [isValid, onValidChange]);

  if (!password) {
    return null;
  }

  // Configuración de niveles de fuerza
  let strengthLabel = 'Muy Débil';
  let barColor = 'bg-rose-500';
  let barWidth = '20%';

  if (passedCount === 2) {
    strengthLabel = 'Débil';
    barColor = 'bg-amber-500';
    barWidth = '40%';
  } else if (passedCount === 3) {
    strengthLabel = 'Aceptable';
    barColor = 'bg-yellow-400';
    barWidth = '60%';
  } else if (passedCount === 4) {
    strengthLabel = 'Segura';
    barColor = 'bg-cyan-400';
    barWidth = '80%';
  } else if (passedCount === 5) {
    strengthLabel = 'Excelente / Blindada';
    barColor = 'bg-emerald-400';
    barWidth = '100%';
  }

  return (
    <div className="space-y-2 mt-1.5 animate-fade-in select-none">
      {/* Barra de Progreso y Etiqueta */}
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-secondary">Seguridad:</span>
        <span
          className={`font-semibold ${
            passedCount <= 2
              ? 'text-rose-400'
              : passedCount <= 3
              ? 'text-amber-400'
              : passedCount === 4
              ? 'text-cyan-400'
              : 'text-emerald-400'
          }`}
        >
          {strengthLabel}
        </span>
      </div>

      <div className="w-full h-1.5 rounded-full bg-black/20 dark:bg-white/[0.08] overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300 rounded-full`}
          style={{ width: barWidth }}
        />
      </div>

      {/* Lista Heurística de Reglas */}
      {showRules && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 text-[10px] font-mono">
          {ruleResults.map((r) => (
            <div
              key={r.id}
              className={`flex items-center gap-1.5 transition-colors ${
                r.passed ? 'text-emerald-400' : 'text-slate-400 opacity-60'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">
                {r.passed ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span className="truncate">{r.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
