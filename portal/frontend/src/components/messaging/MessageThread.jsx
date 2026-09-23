import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import MessageList from './MessageList.jsx';
import MessageInput from './MessageInput.jsx';
import DataState from '../ui/DataState.jsx';
import Tabs from '../ui/Tabs.jsx';
import useFetch from '../../hooks/useFetch.js';
import useAuth from '../../hooks/useAuth.js';
import { ROLES } from '../../constants/index.js';
import { getErrorMessage } from '../../utils/errors.js';

/**
 * Works for both project and request conversations: the caller passes the
 * matching list/send functions from the API layer.
 */
const MessageThread = ({ fetchMessages, sendMessage, onUnreadChange }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const [channel, setChannel] = useState('CLIENT');
  const [isSending, setIsSending] = useState(false);

  const fetchChannelMessages = useCallback(
    () => fetchMessages(isAdmin ? { channel } : {}),
    [fetchMessages, isAdmin, channel]
  );

  const { data, isLoading, error, refetch, setData } = useFetch(fetchChannelMessages, [fetchChannelMessages]);
  const isPollingRef = useRef(false);

  const messages = data?.data || [];

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
        const response = await sendMessage({ message: text, channel: isAdmin ? channel : undefined });
        setData((current) => ({ ...(current || {}), data: [...(current?.data || []), response.data] }));
        return true;
      } catch (err) {
        toast.error(getErrorMessage(err));
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [sendMessage, setData, isAdmin, channel]
  );

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="mb-2 border-b border-ink-100 pb-2">
          <Tabs
            active={channel}
            onChange={setChannel}
            tabs={[
              { value: 'CLIENT', label: 'Client Chat' },
              { value: 'STAFF', label: 'Staff Chat' },
            ]}
          />
        </div>
      )}
      <DataState isLoading={isLoading} error={error} onRetry={refetch} loadingLabel="Loading messages…">
        <MessageList messages={messages} currentUserId={user?._id} />
      </DataState>
      <MessageInput onSend={send} isSending={isSending} />
    </div>
  );
};

export default MessageThread;
