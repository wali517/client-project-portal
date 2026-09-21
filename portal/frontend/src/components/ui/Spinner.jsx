import { Loader2 } from 'lucide-react';
import cn from '../../utils/cn.js';

const Spinner = ({ className, label = 'Loading' }) => (
  <span role="status" aria-live="polite" className="inline-flex items-center gap-2 text-ink-500">
    <Loader2 className={cn('h-5 w-5 animate-spin', className)} aria-hidden="true" />
    <span className="sr-only">{label}</span>
  </span>
);

export default Spinner;
