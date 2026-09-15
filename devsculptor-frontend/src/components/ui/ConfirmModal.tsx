import React, { useState } from 'react';
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
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading ?? internalLoading;

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
      onClose();
    } finally {
      setInternalLoading(false);
    }
  };

  const iconName = variant === 'danger' ? 'warning' : variant === 'warning' ? 'help' : 'info';
  const confirmBtnClass =
    variant === 'danger'
      ? '!bg-rose-500/20 !border-rose-500/40 !text-rose-300 hover:!bg-rose-500/30'
      : '!bg-indigo-500/20 !border-indigo-500/40 !text-indigo-300 hover:!bg-indigo-500/30';

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
            disabled={isLoading}
            className={`font-semibold ${confirmBtnClass}`}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </VisionButton>
        </div>
      </div>
    </VisionModal>
  );
};
