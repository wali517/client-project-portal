import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const PageHeader = ({ title, description, actions, backTo, backLabel = 'Back' }) => (
  <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {backTo && (
        <Link to={backTo} className="mb-2 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-brand-600">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Link>
      )}
      <h1 className="truncate text-xl font-semibold sm:text-2xl">{title}</h1>
      {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export default PageHeader;
