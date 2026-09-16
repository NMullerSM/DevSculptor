import React, { useEffect } from 'react';

interface VisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export const VisionModal: React.FC<VisionModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  maxWidth,
  size = 'md',
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeSize = maxWidth || size;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }[activeSize];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 fade-in"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`vision-window ${maxWidthClass} w-full p-5 flex flex-col gap-4 shadow-2xl`}>
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-glass-subtle)]">
          <div className="flex flex-col gap-0.5 min-w-0 pr-2">
            <div className="flex items-center gap-2">
              {icon && (
                <span className="material-symbols-outlined text-indigo-500 dark:text-indigo-400 text-lg leading-none">
                  {icon}
                </span>
              )}
              <h3 className="font-semibold text-xs text-primary tracking-tight truncate">{title}</h3>
            </div>
            {description && (
              <p className="text-[11px] text-secondary leading-tight font-mono">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="vision-btn vision-btn-icon text-xs text-muted hover:text-primary shrink-0"
            aria-label="Cerrar modal"
          >
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
