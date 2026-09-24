import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import MessageList from './MessageList.jsx';
import MessageInput from './MessageInput.jsx';
import DataState from '../ui/DataState.jsx';
import useFetch from '../../hooks/useFetch.js';
import useAuth from '../../hooks/useAuth.js';
import { ROLES } from '../../constants/index.js';
import { getErrorMessage } from '../../utils/errors.js';

const SingleChatBox = ({ fetchMessages, sendMessage, channel, title, onUnreadChange }) => {
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);

  const fetchChannelMessages = useCallback(
    () => fetchMessages(channel ? { channel } : {}),
    [fetchMessages, channel]
  );

  const { data, isLoading, error, refetch, setData } = useFetch(fetchChannelMessages, [fetchChannelMessages]);
  const isPollingRef = useRef(false);

  const messages = data?.data || [];
  const knownMsgIdsRef = useRef(null);

  // Pop up toast notification when a new message arrives from another user
  useEffect(() => {
    if (!messages.length) return;
    const currentIds = new Set(messages.map((m) => String(m._id || m.id)));
    if (knownMsgIdsRef.current === null) {
      knownMsgIdsRef.current = currentIds;
      return;
    }
    messages.forEach((msg) => {
      const msgId = String(msg._id || msg.id);
      if (!knownMsgIdsRef.current.has(msgId)) {
        knownMsgIdsRef.current.add(msgId);
        const isFromOther = String(msg.sender?._id || msg.sender) !== String(user?._id);
        if (isFromOther) {
          const senderName = msg.sender?.name || 'User';
          const preview = msg.message?.length > 45 ? `${msg.message.slice(0, 45)}…` : msg.message;
          toast(`New message from ${senderName}: "${preview}"`, {
            icon: '💬',
            id: `new-msg-${msgId}`,
          });
        }
      }
    });
  }, [messages, user]);

  // Live polling every 2.5 seconds for real-time live chat without page refresh
  useEffect(() => {
    const interval = setInterval(async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        const response = await fetchChannelMessages();
        if (response?.data) {
          setData(response);
        }
      } catch {
        // silent background poll error
      } finally {
        isPollingRef.current = false;
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [fetchChannelMessages, setData]);

  useEffect(() => {
    if (!messages.length || !user?._id) return;
    const unread = messages.filter(
      (m) =>
        m.sender?._id !== user._id &&
        (!m.readBy || !m.readBy.some((r) => String(r.user?._id || r.user) === String(user._id)))
    ).length;
    onUnreadChange?.(unread);
  }, [messages, user, onUnreadChange]);

  const send = useCallback(
    async (text) => {
      setIsSending(true);
      try {
        const response = await sendMessage({ message: text, channel });
        if (response?.data) {
          const newMsg = response.data;
          const newMsgId = String(newMsg._id || newMsg.id);
          if (knownMsgIdsRef.current) knownMsgIdsRef.current.add(newMsgId);
          setData((current) => ({ ...(current || {}), data: [...(current?.data || []), newMsg] }));
        }
        toast.success('Message sent');
        return true;
      } catch (err) {
        toast.error(getErrorMessage(err));
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [sendMessage, setData, channel]
  );

  return (
    <div className="flex flex-col border border-ink-200 rounded-xl bg-white p-4 shadow-sm space-y-4">
      {title && (
        <div className="border-b border-ink-100 pb-2 flex items-center justify-between">
          <h3 className="font-semibold text-ink-900 text-sm">{title}</h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 font-medium">
            {channel === 'CLIENT' ? 'Client <-> Admin' : 'Staff <-> Admin'}
          </span>
        </div>
      )}
      <DataState isLoading={isLoading} error={error} onRetry={refetch} loadingLabel="Loading messages…">
        <MessageList messages={messages} currentUserId={user?._id} />
      </DataState>
      <MessageInput onSend={send} isSending={isSending} />
    </div>
  );
};

/**
 * Works for both project and request conversations: the caller passes the
 * matching list/send functions from the API layer.
 */
const MessageThread = ({ fetchMessages, sendMessage, onUnreadChange }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  if (isAdmin) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SingleChatBox
          fetchMessages={fetchMessages}
          sendMessage={sendMessage}
          channel="CLIENT"
          title="Client Chat Box"
          onUnreadChange={onUnreadChange}
        />
        <SingleChatBox
          fetchMessages={fetchMessages}
          sendMessage={sendMessage}
          channel="STAFF"
          title="Staff Chat Box"
          onUnreadChange={onUnreadChange}
        />
      </div>
    );
  }

  const userChannel = user?.role === ROLES.STAFF ? 'STAFF' : 'CLIENT';
  const chatTitle = user?.role === ROLES.STAFF ? 'Staff Chat Box' : 'Client Chat Box';

  return (
    <SingleChatBox
      fetchMessages={fetchMessages}
      sendMessage={sendMessage}
      channel={userChannel}
      title={chatTitle}
      onUnreadChange={onUnreadChange}
    />
  );
};

export default MessageThread;
