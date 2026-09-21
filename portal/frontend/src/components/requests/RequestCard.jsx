import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import RequestStatusBadge from './RequestStatusBadge.jsx';
import PriorityBadge from '../ui/PriorityBadge.jsx';
import { formatCurrency, formatDate, labelForServiceType } from '../../utils/format.js';

/** Mobile presentation of a request row. */
const RequestCard = ({ request, to, showClient = false }) => (
  <Link to={to} className="block border-b border-ink-50 px-4 py-4 last:border-0 hover:bg-ink-50">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="tabular text-xs font-medium text-brand-600">{request.requestNumber}</p>
        <p className="mt-0.5 truncate font-medium text-ink-900">{request.title}</p>
        {showClient && request.client && <p className="mt-0.5 truncate text-sm text-ink-500">{request.client.name}</p>}
      </div>
      <RequestStatusBadge status={request.status} />
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-500">
      <PriorityBadge priority={request.priority} />
      <span>{labelForServiceType(request.serviceType)}</span>
      <span className="inline-flex items-center gap-1">
        <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
        {formatDate(request.deadline)}
      </span>
      <span className="tabular">{formatCurrency(request.budget)}</span>
    </div>
  </Link>
);

export default RequestCard;
