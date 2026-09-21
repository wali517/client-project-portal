import cn from '../../utils/cn.js';

const Logo = ({ variant = 'dark', className }) => (
  <span className={cn('flex items-center gap-2.5', className)}>
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
      CP
    </span>
    <span className={cn('text-sm font-semibold leading-tight', variant === 'light' ? 'text-white' : 'text-ink-900')}>
      Client &amp; Project
      <span className={cn('block text-xs font-normal', variant === 'light' ? 'text-ink-400' : 'text-ink-500')}>
        Portal
      </span>
    </span>
  </span>
);

export default Logo;
