import { FileText, CalendarClock, Wallet, User } from 'lucide-react';
import Card, { CardBody, CardHeader } from '../ui/Card.jsx';
import RequestStatusBadge from './RequestStatusBadge.jsx';
import PriorityBadge from '../ui/PriorityBadge.jsx';
import { formatCurrency, formatDate, formatDateTime, labelForServiceType } from '../../utils/format.js';

const Detail = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-2.5">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
    <div className="min-w-0">
      <p className="text-xs text-ink-500">{label}</p>
      <p className="truncate text-sm font-medium text-ink-800">{children}</p>
    </div>
  </div>
);

const RequestDetails = ({ request, showClient = false }) => (
  <Card>
    <CardHeader
      title={request.title}
      description={`${request.requestNumber} · submitted ${formatDateTime(request.createdAt)}`}
      action={
        <div className="flex flex-wrap gap-2">
          <PriorityBadge priority={request.priority} />
          <RequestStatusBadge status={request.status} />
        </div>
      }
    />
    <CardBody className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Detail icon={FileText} label="Service">
          {labelForServiceType(request.serviceType)}
        </Detail>
        <Detail icon={CalendarClock} label="Deadline">
          {formatDate(request.deadline)}
        </Detail>
        <Detail icon={Wallet} label="Budget">
          {formatCurrency(request.budget)}
        </Detail>
        {showClient && (
          <Detail icon={User} label="Client">
            {request.client?.name || '—'}
          </Detail>
        )}
      </div>

      <div>
        <h3 className="mb-1 text-sm font-semibold text-ink-900">Description</h3>
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink-600">{request.description}</p>
      </div>

      {request.instructions && (
        <div>
          <h3 className="mb-1 text-sm font-semibold text-ink-900">Instructions</h3>
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink-600">{request.instructions}</p>
        </div>
      )}

      {request.rejectionReason && (
        <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3">
          <h3 className="text-sm font-semibold text-rose-800">Why this was rejected</h3>
          <p className="mt-1 text-sm text-rose-700">{request.rejectionReason}</p>
        </div>
      )}

      {request.adminNotes?.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-ink-900">Admin notes</h3>
          <ul className="space-y-2">
            {request.adminNotes.map((note, index) => (
              <li key={note._id || index} className="rounded-lg bg-ink-50 px-3 py-2">
                <p className="text-sm text-ink-700">{note.note}</p>
                <p className="mt-1 text-xs text-ink-500">
                  {note.author?.name || 'Admin'} · {formatDateTime(note.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </CardBody>
  </Card>
);

export default RequestDetails;
