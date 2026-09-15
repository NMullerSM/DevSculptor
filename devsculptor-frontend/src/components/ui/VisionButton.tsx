import React from 'react';

interface VisionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'icon' | 'pill' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  icon?: string; // Material Symbol icon name
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const VisionButton: React.FC<VisionButtonProps> = ({
  variant = 'default',
  size = 'md',
  icon,
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  let baseClass = 'vision-btn';

  if (variant === 'primary') {
    baseClass += ' vision-btn-primary';
  } else if (variant === 'pill') {
    baseClass += ' vision-btn-pill';
  } else if (variant === 'icon') {
    baseClass += ' vision-btn-icon';
  }

  if (size === 'sm') {
    baseClass += ' !py-1 !px-2.5 !text-[10.5px]';
  } else if (size === 'lg') {
    baseClass += ' !py-2.5 !px-4 !text-xs';
  }

  return (
    <button className={`${baseClass} ${className}`} disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
      ) : icon ? (
        <span className="material-symbols-outlined text-[15px] leading-none">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
};
