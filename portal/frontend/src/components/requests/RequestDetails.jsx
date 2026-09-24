import { FileText, CalendarClock, Wallet, User, CheckCircle2, XCircle, StickyNote } from 'lucide-react';
import Card, { CardBody, CardHeader } from '../ui/Card.jsx';
import RequestStatusBadge from './RequestStatusBadge.jsx';
import PriorityBadge from '../ui/PriorityBadge.jsx';
import useAuth from '../../hooks/useAuth.js';
import { ROLES } from '../../constants/index.js';
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

const RequestDetails = ({ request, showClient = false }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const isClient = user?.role === ROLES.CLIENT;

  // Separate approval notes, reject notes, and regular admin notes so each is in its own section
  const approvalNotes = (request.adminNotes || []).filter(
    (n) => n.type === 'APPROVE' || (/approve/i.test(n.note || '') && !/reject/i.test(n.note || ''))
  );
  if (request.approvalNote && !approvalNotes.some((n) => n.note === request.approvalNote)) {
    approvalNotes.unshift({ note: request.approvalNote, author: request.reviewedBy, createdAt: request.reviewedAt });
  }

  const rejectionNotes = (request.adminNotes || []).filter(
    (n) => n.type === 'REJECT' || (/reject/i.test(n.note || '') && !/approve/i.test(n.note || ''))
  );
  if (request.rejectionReason && !rejectionNotes.some((n) => n.note === request.rejectionReason)) {
    rejectionNotes.unshift({ note: request.rejectionReason, author: request.reviewedBy, createdAt: request.reviewedAt });
  }

  const regularAdminNotes = (request.adminNotes || []).filter(
    (n) =>
      n.type === 'NOTE' ||
      (n.type !== 'APPROVE' &&
        n.type !== 'REJECT' &&
        !approvalNotes.some((an) => an._id === n._id || an.note === n.note) &&
        !rejectionNotes.some((rn) => rn._id === n._id || rn.note === n.note))
  );

  const showRejectionSection = (isAdmin || isClient) && rejectionNotes.length > 0;
  const showApprovalSection = (isAdmin || isClient) && approvalNotes.length > 0;
  const showAdminNotesSection = isAdmin && regularAdminNotes.length > 0;

  return (
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

        {showApprovalSection && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-emerald-900">Approve Notes</h3>
            </div>
            <ul className="space-y-2">
              {approvalNotes.map((note, index) => (
                <li key={note._id || index} className="rounded-lg bg-white/90 p-3 border border-emerald-100 shadow-2xs">
                  <p className="text-sm font-medium text-emerald-950">{note.note}</p>
                  <p className="mt-1 text-xs text-emerald-700">
                    {note.author?.name || 'Admin'} {note.createdAt ? `· ${formatDateTime(note.createdAt)}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {showRejectionSection && (
          <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-rose-600" />
              <h3 className="text-sm font-semibold text-rose-900">Reject Notes</h3>
            </div>
            <ul className="space-y-2">
              {rejectionNotes.map((note, index) => (
                <li key={note._id || index} className="rounded-lg bg-white/90 p-3 border border-rose-100 shadow-2xs">
                  <p className="text-sm font-medium text-rose-950">{note.note}</p>
                  <p className="mt-1 text-xs text-rose-700">
                    {note.author?.name || 'Admin'} {note.createdAt ? `· ${formatDateTime(note.createdAt)}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {showAdminNotesSection && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-brand-600" />
              <h3 className="text-sm font-semibold text-ink-900">Admin Notes</h3>
            </div>
            <ul className="space-y-2">
              {regularAdminNotes.map((note, index) => (
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
};

export default RequestDetails;
