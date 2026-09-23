import Avatar from '../ui/Avatar.jsx';
import Badge from '../ui/Badge.jsx';
import cn from '../../utils/cn.js';
import { ROLE_LABELS } from '../../constants/index.js';
import { formatDateTime, relativeTime } from '../../utils/format.js';

/** A single message bubble. Own messages are right-aligned on every breakpoint. */
const MessageItem = ({ message, isOwn }) => (
  <li className={cn('flex gap-2.5', isOwn ? 'flex-row-reverse' : 'flex-row')}>
    <Avatar name={message.sender?.name} src={message.sender?.avatar} size="sm" className="mt-1 shrink-0" />
    <div className={cn('min-w-0 max-w-[85%] sm:max-w-[70%]', isOwn && 'text-right')}>
      <p className={cn('flex flex-wrap items-center gap-2 text-xs text-ink-500', isOwn && 'justify-end')}>
        <Badge tone={isOwn ? 'brand' : 'neutral'}>{ROLE_LABELS[message.sender?.role] || message.sender?.role}</Badge>
        <time dateTime={message.createdAt} title={formatDateTime(message.createdAt)}>
          {relativeTime(message.createdAt)}
        </time>
      </p>
      <div
        className={cn(
          'mt-1 inline-block whitespace-pre-line break-words rounded-2xl px-3.5 py-2 text-left text-sm',
          isOwn ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-800'
        )}
      >
        {message.message}
      </div>
      {message.attachments?.length > 0 && (
        <ul className={cn('mt-1 flex flex-wrap gap-1.5', isOwn && 'justify-end')}>
          {message.attachments.map((attachment) => (
            <li key={attachment._id} className="rounded-md bg-ink-50 px-2 py-1 text-xs text-ink-600">
              {attachment.originalName}
            </li>
          ))}
        </ul>
      )}
    </div>
  </li>
);

export default MessageItem;
