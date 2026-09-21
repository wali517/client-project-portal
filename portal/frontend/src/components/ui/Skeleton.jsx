import cn from '../../utils/cn.js';

export const Skeleton = ({ className }) => <div className={cn('animate-pulse rounded-md bg-ink-100', className)} />;

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="space-y-2 p-4">
    {Array.from({ length: rows }).map((_, index) => (
      <Skeleton key={index} className="h-12 w-full" />
    ))}
  </div>
);

export const CardSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: count }).map((_, index) => (
      <Skeleton key={index} className="h-24 w-full" />
    ))}
  </div>
);

export default Skeleton;
