import { Inbox } from 'lucide-react';

const EmptyState = ({ icon: Icon = Inbox, title = 'Nothing here yet', description, action }) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-500">
      <Icon className="h-6 w-6" aria-hidden="true" />
    </span>
    <h3 className="text-base font-semibold text-ink-900">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
