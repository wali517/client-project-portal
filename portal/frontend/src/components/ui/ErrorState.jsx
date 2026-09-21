import { AlertTriangle } from 'lucide-react';
import Button from './Button.jsx';

const ErrorState = ({ title = 'That did not load', message, onRetry }) => (
  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
    <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
      <AlertTriangle className="h-6 w-6" aria-hidden="true" />
    </span>
    <h3 className="text-base font-semibold text-ink-900">{title}</h3>
    {message && <p className="mt-1 max-w-md text-sm text-ink-500">{message}</p>}
    {onRetry && (
      <Button className="mt-4" variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);

export default ErrorState;
