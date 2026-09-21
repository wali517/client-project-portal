import { forwardRef } from 'react';
import cn from '../../utils/cn.js';

const Input = forwardRef(({ label, error, hint, className, id, required, ...props }, ref) => {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink-800 placeholder:text-ink-400',
          'focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500',
          'disabled:bg-ink-50 disabled:text-ink-400',
          error ? 'border-rose-400' : 'border-ink-200',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
