import { forwardRef } from 'react';
import cn from '../../utils/cn.js';

const Select = forwardRef(({ label, error, options = [], placeholder, className, id, required, children, ...props }, ref) => {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink-800',
          'focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500',
          error ? 'border-rose-400' : 'border-ink-200',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
