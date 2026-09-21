import Spinner from './Spinner.jsx';
import ErrorState from './ErrorState.jsx';
import EmptyState from './EmptyState.jsx';

/**
 * One place that decides between loading / error / empty / content,
 * so every list and detail screen handles all four the same way.
 */
const DataState = ({
  isLoading,
  error,
  isEmpty,
  onRetry,
  loadingLabel = 'Loading…',
  emptyTitle,
  emptyDescription,
  emptyAction,
  emptyIcon,
  skeleton,
  children,
}) => {
  if (isLoading) {
    return (
      skeleton || (
        <div className="flex items-center justify-center gap-3 px-6 py-12 text-sm text-ink-500">
          <Spinner />
          {loadingLabel}
        </div>
      )
    );
  }
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} icon={emptyIcon} />;
  }
  return children;
};

export default DataState;
