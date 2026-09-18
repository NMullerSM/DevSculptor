import React, { useState, useEffect } from 'react';
import { VisionModal } from './VisionModal';
import { VisionButton } from './VisionButton';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  requireConfirmationTicket?: boolean;
  confirmationTicketText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading: externalLoading,
  requireConfirmationTicket = false,
  confirmationTicketText,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [ticketChecked, setTicketChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLoading = externalLoading ?? internalLoading;

  useEffect(() => {
    if (isOpen) {
      setTicketChecked(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (requireConfirmationTicket && !ticketChecked) return;
    try {
      setInternalLoading(true);
      setErrorMessage(null);
      await onConfirm();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar la operación';
      setErrorMessage(msg);
    } finally {
      setInternalLoading(false);
    }
  };

  const iconName = variant === 'danger' ? 'warning' : variant === 'warning' ? 'help' : 'info';
  const confirmBtnClass =
    variant === 'danger'
      ? '!bg-rose-500/20 !border-rose-500/40 !text-rose-300 hover:!bg-rose-500/30'
      : '!bg-indigo-500/20 !border-indigo-500/40 !text-indigo-300 hover:!bg-indigo-500/30';

  const isConfirmDisabled = isLoading || (requireConfirmationTicket && !ticketChecked);

  return (
    <VisionModal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) onClose();
      }}
      title={title}
      icon={iconName}
      maxWidth="sm"
    >
      <div className="space-y-4 text-xs">
        <p className="text-secondary leading-relaxed text-[11.5px]">{description}</p>

        {requireConfirmationTicket && (
          <label className="flex items-start gap-2.5 p-3 rounded-[8px] bg-rose-500/10 border border-rose-500/25 cursor-pointer select-none transition-all hover:bg-rose-500/15">
            <input
              type="checkbox"
              checked={ticketChecked}
              onChange={(e) => setTicketChecked(e.target.checked)}
              disabled={isLoading}
              className="mt-0.5 w-4 h-4 rounded border-rose-500/40 text-rose-500 focus:ring-rose-500/30 accent-rose-500 shrink-0 cursor-pointer"
            />
            <span className="text-[11px] text-rose-300 font-sans leading-snug">
              {confirmationTicketText ||
                'Confirmo que deseo eliminar este elemento y todo su contenido asociado de forma permanente e irreversible.'}
            </span>
          </label>
        )}

        {errorMessage && (
          <div className="p-2.5 rounded-[8px] bg-rose-500/15 border border-rose-500/35 text-rose-300 text-[11px] font-mono flex items-center gap-2 animate-fade-in">
            <span className="material-symbols-outlined text-[15px] text-rose-400 shrink-0">error</span>
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
          <VisionButton
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="!text-secondary hover:!text-white"
          >
            {cancelText}
          </VisionButton>
          <VisionButton
            type="button"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className={`font-semibold transition-all ${confirmBtnClass} ${
              isConfirmDisabled ? '!opacity-40 !cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </VisionButton>
        </div>
      </div>
    </VisionModal>
  );
};
