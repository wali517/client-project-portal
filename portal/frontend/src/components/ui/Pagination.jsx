import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button.jsx';

const Pagination = ({ pagination, onPageChange }) => {
  const { page = 1, totalPages = 1, total = 0, limit = 10 } = pagination || {};
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 border-t border-ink-100 px-4 py-3 sm:flex-row"
    >
      <p className="text-sm text-ink-500">
        <span className="tabular">{from}</span>–<span className="tabular">{to}</span> of{' '}
        <span className="tabular">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          icon={ChevronLeft}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <span className="tabular px-2 text-sm text-ink-600">
          {page} / {totalPages}
        </span>
        <Button size="sm" variant="secondary" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
};

export default Pagination;
