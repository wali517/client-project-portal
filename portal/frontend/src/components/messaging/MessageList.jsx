import { useEffect, useRef } from 'react';
import { MessagesSquare } from 'lucide-react';
import MessageItem from './MessageItem.jsx';
import EmptyState from '../ui/EmptyState.jsx';

const MessageList = ({ messages = [], currentUserId }) => {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);

  if (!messages.length) {
    return (
      <EmptyState
        icon={MessagesSquare}
        title="No messages yet"
        description="Start the conversation — everyone with access to this record will see it."
      />
    );
  }

  return (
    <div className="scrollbar-thin max-h-[26rem] overflow-y-auto pr-1">
      <ul className="space-y-4">
        {messages.map((message) => (
          <MessageItem
            key={message._id}
            message={message}
            isOwn={(message.sender?._id || message.sender) === currentUserId}
          />
        ))}
      </ul>
      <div ref={endRef} />
    </div>
  );
};

export default MessageList;
