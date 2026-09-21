import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import cn from '../../utils/cn.js';

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300',
  secondary: 'bg-white text-ink-700 border border-ink-200 hover:bg-ink-50',
  subtle: 'bg-ink-100 text-ink-700 hover:bg-ink-200',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300',
  warning: 'bg-amber-600 text-white hover:bg-amber-700 disabled:bg-amber-300',
  ghost: 'text-ink-600 hover:bg-ink-100',
};

const sizes = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
};

const Button = forwardRef(
  ({ variant = 'primary', size = 'md', isLoading = false, icon: Icon, className, children, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-70',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
    </button>
  )
);

Button.displayName = 'Button';
export default Button;
