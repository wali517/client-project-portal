import { History } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { ACTIVITY_LABELS, ROLE_LABELS } from '../../constants/index.js';
import { formatDateTime, humanize } from '../../utils/format.js';

const describeChange = (entry) => {
  const { previousValue, newValue } = entry;
  if (previousValue?.status && newValue?.status) {
    return `${humanize(previousValue.status)} → ${humanize(newValue.status)}`;
  }
  if (newValue?.progress !== undefined && previousValue?.progress !== undefined) {
    return `${previousValue.progress}% → ${newValue.progress}%`;
  }
  if (newValue?.fileName) return newValue.fileName;
  if (newValue?.staff) return newValue.staff;
  if (newValue?.reason) return newValue.reason;
  if (newValue?.note) return newValue.note;
  if (newValue?.preview) return newValue.preview;
  return null;
};

const ActivityTimeline = ({
  entries = [],
  emptyDescription = 'Actions on this record will show up here.',
  selectable = false,
  selectedId = null,
  selectedIds = [],
  onSelect = () => {},
  onToggle = () => {},
}) => {
  if (!entries.length) {
    return <EmptyState icon={History} title="No activity yet" description={emptyDescription} />;
  }

  const activeSelectedIds = selectedIds.length ? selectedIds : selectedId ? [selectedId] : [];

  return (
    <ol className="relative space-y-5 pl-2">
      {entries.map((entry, index) => {
        const isSelected = activeSelectedIds.includes(entry._id);
        return (
          <li
            key={entry._id || index}
            className={`relative flex items-start gap-3 rounded-lg p-2 transition-colors ${
              selectable && isSelected ? 'bg-brand-50/50' : ''
            }`}
          >
            {selectable && (
              <div className="pt-1.5">
                <input
                  type="checkbox"
                  id={`activity-checkbox-${entry._id}`}
                  checked={isSelected}
                  onChange={() => {
                    if (onToggle) onToggle(entry._id);
                    if (onSelect) onSelect(entry._id);
                  }}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                  aria-label={`Select activity ${entry._id}`}
                />
              </div>
            )}
            <div className="flex flex-col items-center">
              <Avatar name={entry.user?.name} size="sm" />
              {index !== entries.length - 1 && <span className="mt-1 w-px flex-1 bg-ink-100" aria-hidden="true" />}
            </div>
            <div className="min-w-0 pb-1">
              <p className="text-sm text-ink-800">
                <span className="font-medium">{entry.user?.name || 'Someone'}</span>{' '}
                {ACTIVITY_LABELS[entry.action] || humanize(entry.action)}
              </p>
              {describeChange(entry) && <p className="mt-0.5 break-words text-sm text-ink-600">{describeChange(entry)}</p>}
              <p className="mt-0.5 text-xs text-ink-500">
                {ROLE_LABELS[entry.role] || entry.role} · {formatDateTime(entry.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default ActivityTimeline;
