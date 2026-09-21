import cn from '../../utils/cn.js';

const ProgressBar = ({ value = 0, showLabel = true, className, tone = 'brand' }) => {
  const safe = Math.min(Math.max(Number(value) || 0, 0), 100);
  const tones = { brand: 'bg-brand-600', success: 'bg-emerald-600', warning: 'bg-accent-400' };

  return (
    <div className={cn('w-full', className)}>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-ink-100"
        role="progressbar"
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={cn('h-full rounded-full transition-[width]', tones[tone])} style={{ width: `${safe}%` }} />
      </div>
      {showLabel && <p className="tabular mt-1 text-xs text-ink-500">{safe}% complete</p>}
    </div>
  );
};

export default ProgressBar;
