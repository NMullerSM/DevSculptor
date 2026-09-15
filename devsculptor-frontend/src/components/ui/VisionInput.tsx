import React from 'react';

interface VisionInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const VisionInput = React.forwardRef<HTMLInputElement, VisionInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="block text-[10px] font-mono uppercase tracking-wider text-muted font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`vision-input ${error ? '!border-rose-500/70' : ''} ${className}`}
          {...props}
        />
        {error && (
          <p className="text-[10px] font-mono text-rose-400 mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);

VisionInput.displayName = 'VisionInput';
