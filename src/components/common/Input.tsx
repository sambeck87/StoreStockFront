import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-[var(--color-border)] dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 placeholder:text-gray-400 dark:placeholder:text-gray-600 ${error ? 'border-red-500 focus:ring-red-500/30 focus:border-red-500' : ''} ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
