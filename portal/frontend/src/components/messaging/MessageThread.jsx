import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import MessageList from './MessageList.jsx';
import MessageInput from './MessageInput.jsx';
import DataState from '../ui/DataState.jsx';
import useFetch from '../../hooks/useFetch.js';
import useAuth from '../../hooks/useAuth.js';
import { ROLES } from '../../constants/index.js';
import { getErrorMessage } from '../../utils/errors.js';

const SingleChatBox = ({ fetchMessages, sendMessage, channel, title, onUnreadChange, isActive = true }) => {
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);

  const fetchChannelMessages = useCallback(
    () => fetchMessages(channel ? { channel, markRead: isActive ? 'true' : 'false' } : { markRead: isActive ? 'true' : 'false' }),
    [fetchMessages, channel, isActive]
  );

  const { data, isLoading, error, refetch, setData } = useFetch(fetchChannelMessages, [fetchChannelMessages]);
  const isPollingRef = useRef(false);

  const messages = data?.data || [];
  const knownMsgIdsRef = useRef(null);

  // When tab becomes active, trigger a fetch with markRead: 'true' to mark thread read
  useEffect(() => {
    if (isActive) {
      fetchChannelMessages().then((response) => {
        if (response?.data) setData(response);
      }).catch(() => {});
    }
  }, [isActive, fetchChannelMessages, setData]);

  const isRateLimitedRef = useRef(false);

  // Live polling for real-time live chat without page refresh
  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.hidden || isPollingRef.current || isRateLimitedRef.current) return;
      isPollingRef.current = true;
      try {
        const response = await fetchChannelMessages();
        if (response?.data) {
          setData(response);
        }
      } catch (err) {
        if (err?.response?.status === 429) {
          isRateLimitedRef.current = true;
          setTimeout(() => { isRateLimitedRef.current = false; }, 15000);
        }
      } finally {
        isPollingRef.current = false;
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchChannelMessages, setData]);

  const unreadCount = messages.filter(
    (m) =>
      m.sender?._id !== user?._id &&
      (!m.readBy || !m.readBy.some((r) => String(r.user?._id || r.user) === String(user?._id)))
  ).length;

  useEffect(() => {
    onUnreadChange?.(unreadCount);
  }, [unreadCount, onUnreadChange]);

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
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-ink-900 text-sm">{title}</h3>
            {unreadCount > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-bold shadow-sm animate-pulse">
                {unreadCount} unread
              </span>
            )}
          </div>
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
const MessageThread = ({ fetchMessages, sendMessage, onUnreadChange, isActive = true }) => {
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
          isActive={isActive}
        />
        <SingleChatBox
          fetchMessages={fetchMessages}
          sendMessage={sendMessage}
          channel="STAFF"
          title="Staff Chat Box"
          onUnreadChange={onUnreadChange}
          isActive={isActive}
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
      isActive={isActive}
    />
  );
};


export default MessageThread;
