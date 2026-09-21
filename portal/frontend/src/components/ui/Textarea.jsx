import { forwardRef } from 'react';
import cn from '../../utils/cn.js';

const Textarea = forwardRef(({ label, error, hint, className, id, rows = 4, required, ...props }, ref) => {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink-800 placeholder:text-ink-400',
          'focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500',
          error ? 'border-rose-400' : 'border-ink-200',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
