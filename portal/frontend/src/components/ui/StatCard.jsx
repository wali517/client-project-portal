import { Link } from 'react-router-dom';
import cn from '../../utils/cn.js';

const tones = {
  neutral: 'text-ink-900',
  brand: 'text-brand-600',
  warning: 'text-accent-500',
  danger: 'text-rose-600',
  success: 'text-emerald-600',
};

const StatCard = ({ label, value, icon: Icon, tone = 'neutral', to, hint }) => {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-50 text-ink-500">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className={cn('tabular mt-3 text-2xl font-semibold sm:text-3xl', tones[tone])}>{value ?? 0}</p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </>
  );

  const className = 'card block px-4 py-4 transition-colors hover:border-brand-200';
  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
};

export default StatCard;
