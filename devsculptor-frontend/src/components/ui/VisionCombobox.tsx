import React, { useState, useRef, useEffect } from 'react';

export interface VisionComboboxOption {
  id: string;
  label: string;
  icon?: string;
  badge?: string;
}

interface VisionComboboxProps {
  value: string;
  options: VisionComboboxOption[];
  onChange: (value: string) => void;
  labelPrefix?: string;
  className?: string;
  ariaLabel?: string;
}

export const VisionCombobox: React.FC<VisionComboboxProps> = ({
  value,
  options,
  onChange,
  labelPrefix = '',
  className = '',
  ariaLabel = 'Seleccionar opción',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative select-auto ${className}`}>
      {/* Botón Disparador del Combobox */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 bg-[var(--glass-card)] hover:bg-white/[0.08] active:bg-white/[0.12] border border-glass-subtle hover:border-cyan-500/40 rounded-lg px-2.5 py-1 text-xs text-primary transition-all duration-150 cursor-pointer shadow-sm w-full focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {selectedOption?.icon && (
          <span className="material-symbols-outlined text-[15px] text-cyan-400 shrink-0">
            {selectedOption.icon}
          </span>
        )}

        {labelPrefix && (
          <span className="text-muted text-[10.5px] font-mono shrink-0">
            {labelPrefix}
          </span>
        )}

        <span className="font-medium text-xs truncate flex-1 text-left">
          {selectedOption?.label || value}
        </span>

        {selectedOption?.badge && (
          <span className="text-[9.5px] font-mono px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 shrink-0">
            {selectedOption.badge}
          </span>
        )}

        <span
          className={`material-symbols-outlined text-[15px] text-muted transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-cyan-400' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {/* Menú Desplegable con Estilo Liquid Glass */}
      {isOpen && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute top-full left-0 mt-1.5 z-50 min-w-full sm:min-w-[210px] vision-card !bg-slate-900/95 dark:!bg-slate-900/95 !border-glass-subtle rounded-xl p-1 shadow-2xl backdrop-blur-2xl animate-fade-in border flex flex-col gap-0.5"
        >
          {options.map((option) => {
            const isSelected = option.id === value;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.id)}
                className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                    : 'text-secondary hover:text-primary hover:bg-white/[0.06]'
                }`}
              >
                {option.icon && (
                  <span
                    className={`material-symbols-outlined text-[14px] shrink-0 ${
                      isSelected ? 'text-cyan-400' : 'text-muted'
                    }`}
                  >
                    {option.icon}
                  </span>
                )}
                <span className="flex-1 truncate">{option.label}</span>
                {isSelected && (
                  <span className="material-symbols-outlined text-[13px] text-cyan-400 shrink-0">
                    check
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
