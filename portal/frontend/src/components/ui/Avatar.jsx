import { initials } from '../../utils/format.js';
import cn from '../../utils/cn.js';

const sizes = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-12 w-12 text-base' };

const Avatar = ({ name = '', src, size = 'md', className }) =>
  src ? (
    <img src={src} alt={name} className={cn('rounded-full object-cover', sizes[size], className)} />
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700',
        sizes[size],
        className
      )}
    >
      {initials(name)}
    </span>
  );

export default Avatar;
