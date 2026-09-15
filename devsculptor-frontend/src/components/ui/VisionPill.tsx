import React from 'react';

interface VisionPillProps {
  variant?: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'rose';
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const VisionPill: React.FC<VisionPillProps> = ({
  variant = 'indigo',
  dot = false,
  children,
  className = '',
}) => {
  const dotColorMap = {
    indigo: 'bg-indigo-400',
    cyan: 'bg-cyan-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
  };

  return (
    <span className={`vision-pill pill-${variant} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColorMap[variant]}`} />
      )}
      {children}
    </span>
  );
};
