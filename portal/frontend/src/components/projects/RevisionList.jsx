import { RefreshCcw } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { ROLE_LABELS } from '../../constants/index.js';
import { formatDateTime, humanize } from '../../utils/format.js';

const tones = { OPEN: 'warning', IN_PROGRESS: 'brand', RESOLVED: 'success' };

const RevisionList = ({ revisions = [] }) => {
  if (!revisions.length) {
    return (
      <EmptyState
        icon={RefreshCcw}
        title="No revisions requested"
        description="If work comes back for changes, every request is recorded here."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {revisions.map((revision) => (
        <li key={revision._id} className="rounded-lg border border-ink-100 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-ink-900">
              {revision.requestedBy?.name || 'Someone'}{' '}
              <span className="font-normal text-ink-500">
                ({ROLE_LABELS[revision.requestedBy?.role] || revision.requestedBy?.role})
              </span>
            </p>
            <Badge tone={tones[revision.status] || 'neutral'}>{humanize(revision.status)}</Badge>
          </div>
          <p className="mt-1.5 whitespace-pre-line text-sm text-ink-700">{revision.reason}</p>
          {revision.instructions && (
            <p className="mt-1.5 whitespace-pre-line text-sm text-ink-600">{revision.instructions}</p>
          )}
          <p className="mt-2 text-xs text-ink-500">
            Requested {formatDateTime(revision.createdAt)}
            {revision.resolvedAt && ` · resolved ${formatDateTime(revision.resolvedAt)}`}
          </p>
        </li>
      ))}
    </ul>
  );
};

export default RevisionList;
