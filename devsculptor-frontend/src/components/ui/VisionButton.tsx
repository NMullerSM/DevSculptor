import React from 'react';

interface VisionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'icon' | 'pill';
  size?: 'sm' | 'md' | 'lg';
  icon?: string; // Material Symbol icon name
  children?: React.ReactNode;
}

export const VisionButton: React.FC<VisionButtonProps> = ({
  variant = 'default',
  size = 'md',
  icon,
  children,
  className = '',
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
    <button className={`${baseClass} ${className}`} {...props}>
      {icon && (
        <span className="material-symbols-outlined text-[15px] leading-none">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
};
