import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-ink-primary mb-1.5">{label}</label>
        )}
        <input
          ref={ref}
          className={`w-full px-3.5 py-2.5 bg-surface-card border rounded-xl text-sm text-ink-primary transition-all duration-150 placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 ${
            error ? 'border-red-400 focus:ring-red-500/40 focus:border-red-500' : 'border-surface-border hover:border-zinc-300'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
